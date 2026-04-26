/**
 * audioExporter.js (★v5.15.1★)
 *
 * 動画用音声トラックをオフライン合成して WAV ファイルとしてダウンロード可能にする。
 *
 * ★v5.15.1 修正★:
 * 1. 速度反映時のピッチ問題 → speechRate は無視 (1.0で再生) し、TTS は自然な速度で書き出し
 *    ユーザーが速度反映したい場合は明示的にチェックを入れる (デフォルトOFF)
 * 2. BGM/SE が入らない問題 → mixer インスタンスから直接 blob を回収する方式に変更
 *    (projectData.audio.bgmId は実は使われていなかった)
 */

import { getCachedAudio } from './audioCache';
import { applyYomigana } from './yomigana';
import { getMixer } from './mixer';

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

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, length * numChannels * 2, true);

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
 * URL から blob を取得 (blob URL も HTTP URL も対応)
 */
async function fetchAsBlob(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    return await response.blob();
  } catch (e) {
    console.warn('fetchAsBlob failed:', url, e);
    return null;
  }
}

/**
 * メイン: プロジェクト全体の音声を合成して WAV blob で返す
 *
 * @param {Object} opts
 * @param {Array} opts.scripts
 * @param {number} opts.speechRate - UI上の再生速度 (1.0=標準)
 * @param {boolean} opts.applySpeechRate - true なら速度を反映 (音質劣化), false なら 1.0倍
 * @param {Object} opts.audio - { bgmVolume, voiceVolume, seVolume }
 * @param {Function} opts.onProgress
 * @returns {Promise<{blob, durationSec, sizeBytes, missingScripts, debugLog}>}
 */
export async function exportProjectAudio({
  scripts,
  speechRate = 1.0,
  applySpeechRate = false,
  audio = {},
  onProgress = () => {},
}) {
  if (!scripts || scripts.length === 0) {
    throw new Error('scripts が空です');
  }

  const debugLog = [];
  const log = (msg) => {
    debugLog.push(msg);
    console.log('[audioExporter]', msg);
  };

  const sampleRate = 48000;
  const numChannels = 2;

  // ★v5.15.1★ 速度の扱い: applySpeechRate=true なら playbackRate を変える (音質劣化注意)
  const effectivePlaybackRate = applySpeechRate ? speechRate : 1.0;
  log(`applySpeechRate=${applySpeechRate}, effectivePlaybackRate=${effectivePlaybackRate}`);

  // === Phase 1: TTS 音声を全部 decode してから duration を計算する ===
  // 同一 speaker のグループ化 (usePlaybackEngine と同じロジック)
  onProgress('TTS グループ化中...', 5);
  const groups = [];
  let i = 0;
  while (i < scripts.length) {
    const head = scripts[i];
    if (!head) { i++; continue; }
    const groupScripts = [head];
    for (let j = i + 1; j < scripts.length; j++) {
      if (scripts[j].speaker === head.speaker) {
        groupScripts.push(scripts[j]);
      } else { break; }
    }
    const joinedText = groupScripts.map(s => s.speech || s.text || '').join(' ');
    groups.push({
      startIdx: i,
      groupScripts,
      joinedText,
      speaker: head.speaker || 'A',
      ses: groupScripts.map(s => s.se || null),
    });
    i += groupScripts.length;
  }
  log(`TTS グループ数: ${groups.length}`);

  // === Phase 2: 全TTS の blob 取得 + decode ===
  onProgress('TTS 音声を読み込み中...', 10);
  // 仮の OfflineAudioContext で decode (期間は後で調整)
  const decodeCtx = new OfflineAudioContext(numChannels, sampleRate * 60, sampleRate);
  const missingScripts = [];
  const ttsItems = [];

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const fixedText = applyYomigana(g.joinedText);
    const blob = await getCachedAudio(g.speaker, fixedText);
    if (!blob) {
      missingScripts.push({
        idx: g.startIdx,
        speaker: g.speaker,
        text: g.joinedText.substring(0, 30),
      });
      ttsItems.push({ ...g, audioBuffer: null });
      log(`[GROUP ${gi}] 未生成 idx=${g.startIdx} speaker=${g.speaker}`);
    } else {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
        ttsItems.push({ ...g, audioBuffer });
      } catch (e) {
        log(`[GROUP ${gi}] decode失敗: ${e.message}`);
        missingScripts.push({
          idx: g.startIdx,
          speaker: g.speaker,
          text: g.joinedText.substring(0, 30),
        });
        ttsItems.push({ ...g, audioBuffer: null });
      }
    }
    onProgress(
      `TTS 音声を読み込み中... (${gi + 1}/${groups.length})`,
      10 + ((gi + 1) / groups.length) * 30
    );
  }
  log(`TTS 取得済み: ${ttsItems.filter(t => t.audioBuffer).length}件 / 未生成: ${missingScripts.length}件`);

  // === Phase 3: 各グループの実 duration からタイムラインを構築 ===
  // 無音は推定 (1文字 0.16秒, 速度反映時は短縮)
  const charSec = 0.16;
  const ttsTimings = [];
  let cursor = 0;
  for (const item of ttsItems) {
    let durationSec;
    if (item.audioBuffer) {
      durationSec = item.audioBuffer.duration / effectivePlaybackRate;
    } else {
      durationSec = (item.joinedText.length * charSec) / (applySpeechRate ? speechRate : 1.0);
    }
    ttsTimings.push({
      ...item,
      startSec: cursor,
      durationSec,
    });
    cursor += durationSec;
  }
  const totalDurationSec = cursor + 1.0;
  log(`総時間: ${totalDurationSec.toFixed(2)}秒`);

  // === Phase 4: 本番 OfflineAudioContext で合成 ===
  onProgress('音声トラックを構築中...', 45);
  const offlineCtx = new OfflineAudioContext(
    numChannels,
    Math.ceil(totalDurationSec * sampleRate),
    sampleRate
  );

  // 4-A: TTS をスケジュール
  for (const t of ttsTimings) {
    if (!t.audioBuffer) continue;
    // 本番ctxで再 decode (decodeCtx と sampleRate が違うとそのまま使えないため)
    // 実は同じ sampleRate なら使える。ただし安全のため bufferソース新規作成
    const source = offlineCtx.createBufferSource();
    // ★ v5.15.1 ★ buffer は decode 済みなので そのまま代入できる
    // (samepleRate も両方 48000 で揃えてる)
    source.buffer = t.audioBuffer;
    source.playbackRate.value = effectivePlaybackRate;

    const gain = offlineCtx.createGain();
    gain.gain.value = audio.voiceVolume ?? 1.0;
    source.connect(gain);
    gain.connect(offlineCtx.destination);
    source.start(t.startSec);
  }

  // === Phase 5: BGM/SE を mixer インスタンスから直接取得 ===
  // ★v5.15.1★ projectData.audio.bgmId ではなく、現在 mixer に登録されてる音源を使う
  onProgress('BGM/SE を読み込み中...', 60);
  const mixer = getMixer();

  // 5-A: BGM
  let bgmAdded = false;
  if (mixer.bgmAudioEl && mixer.bgmAudioEl.src) {
    log(`BGM 検出: src=${mixer.bgmAudioEl.src.substring(0, 60)}`);
    try {
      const bgmBlob = await fetchAsBlob(mixer.bgmAudioEl.src);
      if (bgmBlob) {
        const arrayBuffer = await bgmBlob.arrayBuffer();
        const bgmBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));

        const bgmSource = offlineCtx.createBufferSource();
        bgmSource.buffer = bgmBuffer;
        bgmSource.loop = true;

        const bgmGain = offlineCtx.createGain();
        const baseBgmVol = audio.bgmVolume ?? 0.15;
        const duckVol = baseBgmVol * 0.5;

        bgmGain.gain.setValueAtTime(baseBgmVol, 0);
        for (const t of ttsTimings) {
          if (!t.audioBuffer) continue;
          const startSec = Math.max(0, t.startSec - 0.05);
          const endSec = t.startSec + t.durationSec;
          bgmGain.gain.setValueAtTime(baseBgmVol, startSec);
          bgmGain.gain.linearRampToValueAtTime(duckVol, t.startSec + 0.1);
          bgmGain.gain.setValueAtTime(duckVol, Math.max(t.startSec + 0.1, endSec - 0.1));
          bgmGain.gain.linearRampToValueAtTime(baseBgmVol, endSec + 0.15);
        }

        bgmSource.connect(bgmGain);
        bgmGain.connect(offlineCtx.destination);
        bgmSource.start(0);
        bgmAdded = true;
        log(`BGM 追加成功 (vol=${baseBgmVol})`);
      } else {
        log(`BGM blob 取得失敗`);
      }
    } catch (e) {
      log(`BGM 合成失敗: ${e.message}`);
    }
  } else {
    log(`BGM 未登録 (mixer.bgmAudioEl.src なし)`);
  }

  // 5-B: SE
  let seAddedCount = 0;
  let seSkippedCount = 0;
  if (mixer._seAudioEls && mixer._seAudioEls.size > 0) {
    log(`SE 登録数: ${mixer._seAudioEls.size}`);
    // SE id → blob のキャッシュ
    const seBlobCache = new Map();
    for (const [seId, el] of mixer._seAudioEls.entries()) {
      try {
        const blob = await fetchAsBlob(el.src);
        if (blob) seBlobCache.set(seId, blob);
      } catch (e) {
        log(`SE ${seId} blob 取得失敗`);
      }
    }
    log(`SE blob キャッシュ: ${seBlobCache.size}件`);

    // scripts を順次たどって SE を配置
    let seCursor = 0;
    for (const t of ttsTimings) {
      // グループ内の各 script の SE
      let scriptCursor = t.startSec;
      const groupTotalChars = t.joinedText.length || 1;
      const groupDuration = t.durationSec;
      for (let k = 0; k < t.groupScripts.length; k++) {
        const s = t.groupScripts[k];
        const seId = s.se;
        if (seId) {
          const seBlob = seBlobCache.get(seId);
          if (seBlob) {
            try {
              const arrayBuffer = await seBlob.arrayBuffer();
              const seBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));
              const source = offlineCtx.createBufferSource();
              source.buffer = seBuffer;
              const gain = offlineCtx.createGain();
              gain.gain.value = audio.seVolume ?? 0.6;
              source.connect(gain);
              gain.connect(offlineCtx.destination);
              source.start(scriptCursor);
              seAddedCount++;
            } catch (e) {
              log(`SE ${seId} decode 失敗: ${e.message}`);
              seSkippedCount++;
            }
          } else {
            seSkippedCount++;
          }
        }
        const thisChars = (s.speech || s.text || '').length;
        scriptCursor += (thisChars / groupTotalChars) * groupDuration;
      }
    }
    log(`SE 追加: ${seAddedCount}件 / スキップ: ${seSkippedCount}件`);
  } else {
    log(`SE 未登録 (mixer._seAudioEls 空)`);
  }

  // === Phase 6: レンダリング + WAV エンコード ===
  onProgress('音声をレンダリング中... (時間かかります)', 75);
  const renderedBuffer = await offlineCtx.startRendering();

  onProgress('WAV ファイルを生成中...', 95);
  const wavBlob = audioBufferToWav(renderedBuffer);

  onProgress('完了', 100);

  return {
    blob: wavBlob,
    durationSec: totalDurationSec,
    sizeBytes: wavBlob.size,
    missingScripts,
    debugLog,
    bgmAdded,
    seAddedCount,
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
