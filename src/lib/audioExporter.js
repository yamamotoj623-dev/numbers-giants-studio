/**
 * audioExporter.js (★v5.15.0★)
 *
 * 動画用音声トラックをオフライン合成して WAV ファイルとしてダウンロード可能にする。
 *
 * 【背景】
 * Pixel/Android の画面録画では Chrome の HTMLMediaElement の音声がキャプチャされない問題が
 * v5.14.x で何度試しても解消できなかった (audio→video, DOM attach, MediaSession 全部試しても無理)。
 *
 * 【解決アプローチ】
 * 「ブラウザに音を出させて録画する」を諦め、
 * 「OfflineAudioContext でメモリ上で音声を完全合成して WAV 出力」する。
 * これなら環境依存ゼロ、確実に動画用音声が手に入る。
 *
 * 【ユーザーのワークフロー】
 * 1. アプリで動画再生 → 画面録画 (映像のみ、音はミュートでOK)
 * 2. このモジュールで生成した WAV をダウンロード
 * 3. 動画編集アプリで両方合成 → 完成動画
 */

import { getCachedAudio } from './audioCache';
import { applyYomigana } from './yomigana';
import { getBgmBlob } from './bgmStorage';
import { getSeBlob } from './seStorage';

/**
 * AudioBuffer を WAV blob に変換 (16bit PCM)
 */
function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const buffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // RIFF header
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);              // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);             // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, length * numChannels * 2, true);

  // PCM 16bit interleaved
  let offset = 44;
  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1, Math.min(1, channelData[ch][i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * scripts のタイミングを計算 (usePlaybackEngine と同じロジック)
 *
 * Returns: [{ scriptIdx, groupStartIdx, startSec, durationSec, joinedText, speaker, se }]
 */
function calcTimings(scripts, speechRate, ttsEngine = 'gemini') {
  const charMs = ttsEngine === 'gemini' ? 160 : 150;
  const timings = [];
  let cursorMs = 0;

  let i = 0;
  while (i < scripts.length) {
    const head = scripts[i];
    if (!head) {
      i++;
      continue;
    }
    // 同 speaker 連続でグループ化
    const groupScripts = [head];
    for (let j = i + 1; j < scripts.length; j++) {
      if (scripts[j].speaker === head.speaker) {
        groupScripts.push(scripts[j]);
      } else {
        break;
      }
    }
    const joinedText = groupScripts.map(s => s.speech || s.text || '').join(' ');
    const groupTotalChars = joinedText.length || 1;
    const groupDurationMs = groupTotalChars * charMs / speechRate;

    timings.push({
      scriptIdx: i,
      groupStartIdx: i,
      startSec: cursorMs / 1000,
      durationSec: groupDurationMs / 1000,
      joinedText,
      speaker: head.speaker || 'A',
      se: head.se,
      groupSize: groupScripts.length,
    });

    // SE タイミング (各 script ごとに記録)
    let scriptCursorMs = cursorMs;
    for (let k = 0; k < groupScripts.length; k++) {
      const s = groupScripts[k];
      if (s.se) {
        timings.push({
          isSe: true,
          se: s.se,
          startSec: scriptCursorMs / 1000,
        });
      }
      const thisChars = (s.speech || s.text || '').length;
      scriptCursorMs += (thisChars / groupTotalChars) * groupDurationMs;
    }

    cursorMs += groupDurationMs;
    i += groupScripts.length;
  }

  return { timings, totalSec: cursorMs / 1000 };
}

/**
 * メイン: プロジェクト全体の音声を合成して WAV blob で返す
 *
 * @param {Object} opts
 * @param {Array} opts.scripts - projectData.scripts
 * @param {number} opts.speechRate - 再生速度 (1.0 = 標準)
 * @param {string} opts.ttsEngine - 'gemini' or 'web_speech'
 * @param {Object} opts.audio - projectData.audio { bgmId, bgmVolume, voiceVolume, seVolume }
 * @param {Function} opts.onProgress - (msg, percent) => void
 * @returns {Promise<Blob>} WAV blob
 */
export async function exportProjectAudio({
  scripts,
  speechRate = 1.0,
  ttsEngine = 'gemini',
  audio = {},
  onProgress = () => {},
}) {
  if (!scripts || scripts.length === 0) {
    throw new Error('scripts が空です');
  }

  const sampleRate = 48000;
  const numChannels = 2;

  onProgress('タイミング計算中...', 5);

  // 1. タイミング計算
  const { timings, totalSec } = calcTimings(scripts, speechRate, ttsEngine);
  // 終端に余白 1秒
  const totalDurationSec = totalSec + 1.0;

  // 2. OfflineAudioContext 作成
  const offlineCtx = new OfflineAudioContext(
    numChannels,
    Math.ceil(totalDurationSec * sampleRate),
    sampleRate
  );

  onProgress('TTS 音声を読み込み中...', 10);

  // 3. 各グループの TTS 音声を順次 decode して接続
  const ttsTimings = timings.filter(t => !t.isSe);
  let processedGroups = 0;
  const missingScripts = [];

  for (const t of ttsTimings) {
    const fixedText = applyYomigana(t.joinedText);
    const blob = await getCachedAudio(t.speaker, fixedText);
    if (!blob) {
      missingScripts.push({
        idx: t.scriptIdx,
        speaker: t.speaker,
        text: t.joinedText.substring(0, 30),
      });
      processedGroups++;
      continue;
    }
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speechRate;

      const gain = offlineCtx.createGain();
      gain.gain.value = audio.voiceVolume ?? 1.0;
      source.connect(gain);
      gain.connect(offlineCtx.destination);

      source.start(t.startSec);
    } catch (e) {
      console.warn('TTS decode failed for group at', t.startSec, e);
      missingScripts.push({
        idx: t.scriptIdx,
        speaker: t.speaker,
        text: t.joinedText.substring(0, 30),
      });
    }
    processedGroups++;
    onProgress(
      `TTS 音声を読み込み中... (${processedGroups}/${ttsTimings.length})`,
      10 + (processedGroups / ttsTimings.length) * 50
    );
  }

  // 4. SE をスケジュール
  onProgress('SE を読み込み中...', 65);
  const seTimings = timings.filter(t => t.isSe);
  for (const t of seTimings) {
    try {
      const blob = await getSeBlob(t.se);
      if (!blob) continue;  // カスタム SE 未登録 → skip (合成音は再現不可)
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gain = offlineCtx.createGain();
      gain.gain.value = audio.seVolume ?? 0.6;
      source.connect(gain);
      gain.connect(offlineCtx.destination);

      source.start(t.startSec);
    } catch (e) {
      console.warn('SE failed:', t.se, e);
    }
  }

  // 5. BGM (ループ + ducking)
  onProgress('BGM を合成中...', 75);
  if (audio.bgmId) {
    try {
      const bgmBlob = await getBgmBlob(audio.bgmId);
      if (bgmBlob) {
        const arrayBuffer = await bgmBlob.arrayBuffer();
        const bgmBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));

        const bgmSource = offlineCtx.createBufferSource();
        bgmSource.buffer = bgmBuffer;
        bgmSource.loop = true;

        const bgmGain = offlineCtx.createGain();
        const baseBgmVol = audio.bgmVolume ?? 0.15;
        const duckVol = baseBgmVol * 0.5;  // ducking 時は半分

        bgmGain.gain.setValueAtTime(baseBgmVol, 0);

        // ducking スケジュール: TTS 再生中は音量下げる
        for (const t of ttsTimings) {
          const startSec = t.startSec;
          const endSec = t.startSec + t.durationSec;
          // ramp down
          bgmGain.gain.setValueAtTime(baseBgmVol, Math.max(0, startSec - 0.05));
          bgmGain.gain.linearRampToValueAtTime(duckVol, startSec + 0.1);
          // hold ducked
          bgmGain.gain.setValueAtTime(duckVol, endSec - 0.1);
          // ramp up
          bgmGain.gain.linearRampToValueAtTime(baseBgmVol, endSec + 0.15);
        }

        bgmSource.connect(bgmGain);
        bgmGain.connect(offlineCtx.destination);
        bgmSource.start(0);
      }
    } catch (e) {
      console.warn('BGM mix failed:', e);
    }
  }

  // 6. レンダリング (重い処理)
  onProgress('音声をレンダリング中... (時間かかります)', 80);
  const renderedBuffer = await offlineCtx.startRendering();

  // 7. WAV エンコード
  onProgress('WAV ファイルを生成中...', 95);
  const wavBlob = audioBufferToWav(renderedBuffer);

  onProgress('完了', 100);

  return {
    blob: wavBlob,
    durationSec: totalDurationSec,
    sizeBytes: wavBlob.size,
    missingScripts,
  };
}

/**
 * Blob をダウンロードトリガー
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try { document.body.removeChild(a); } catch (e) {}
    URL.revokeObjectURL(url);
  }, 1000);
}
