/**
 * audioExporter.js (★v5.15.4★)
 *
 * 動画用音声トラックをオフライン合成して WAV ファイルとしてダウンロード可能にする。
 *
 * ★v5.15.2★ SoundTouchJS で TTS のピッチを維持したまま速度変更可能に
 * ★v5.15.3★ BGM/SE は IndexedDB + localStorage 直接アクセス (mixer 経由をやめて確実化)
 * ★v5.15.4★ 合成音 SE フォールバック (カスタム SE 未登録の preset でも音が出るように)
 */

import { getCachedAudio } from './audioCache';
import { applyYomigana } from './yomigana';
import { getBgmBlob } from './bgmStorage';
import { listSes, getSeBlob } from './seStorage';
import { PitchShifter } from 'soundtouchjs';
import { groupBySpeaker } from './scriptGrouping';

/**
 * ★v5.15.4★ 合成音 SE のプリセット定義 (mixer.js と同期)
 * カスタム SE が未登録の場合、これらの合成音を OfflineAudioContext で再現する。
 */
const SYNTHETIC_SE_PRESETS = {
  hook_impact:       { freqs: [80, 40],          type: 'sawtooth', attack: 0.01,  release: 0.25, gain: 0.5 },
  highlight_ping:    { freqs: [880, 1320],       type: 'sine',     attack: 0.005, release: 0.18, gain: 0.3 },
  stat_reveal:       { freqs: [523, 784],        type: 'triangle', attack: 0.01,  release: 0.22, gain: 0.35 },
  shock_hit:         { freqs: [200, 100],        type: 'square',   attack: 0.005, release: 0.3,  gain: 0.4 },
  success_chime:     { freqs: [659, 988, 1319],  type: 'sine',     attack: 0.01,  release: 0.4,  gain: 0.3 },
  warning_alert:     { freqs: [440, 415],        type: 'square',   attack: 0.01,  release: 0.2,  gain: 0.3 },
  transition_swoosh: { freqs: [1500, 200],       type: 'sawtooth', attack: 0.02,  release: 0.25, gain: 0.25 },
  click_tap:         { freqs: [2000],            type: 'square',   attack: 0.001, release: 0.04, gain: 0.2 },
  radar_ping:        { freqs: [1200],            type: 'sine',     attack: 0.005, release: 0.15, gain: 0.25 },
  outro_fade:        { freqs: [440, 330, 220],   type: 'sine',     attack: 0.02,  release: 0.6,  gain: 0.3 },
};

/**
 * ★v5.15.4★ 合成音 SE を OfflineAudioContext にスケジュール
 * mixer.js の playSe の合成音ロジックを移植。
 */
function scheduleSyntheticSe(offlineCtx, seId, startSec, seVolume) {
  const preset = SYNTHETIC_SE_PRESETS[seId] || SYNTHETIC_SE_PRESETS.click_tap;
  const finalGain = preset.gain * seVolume;

  const gain = offlineCtx.createGain();
  gain.connect(offlineCtx.destination);
  gain.gain.setValueAtTime(0, startSec);
  gain.gain.linearRampToValueAtTime(finalGain, startSec + preset.attack);
  gain.gain.exponentialRampToValueAtTime(0.001, startSec + preset.attack + preset.release);

  preset.freqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    osc.type = preset.type;
    const oscStart = startSec + idx * 0.04;
    osc.frequency.setValueAtTime(freq, oscStart);
    osc.connect(gain);
    osc.start(oscStart);
    osc.stop(oscStart + preset.attack + preset.release + 0.05);
  });
}

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
 * ★v5.15.2★ SoundTouchJS で AudioBuffer をピッチ維持しつつ速度変更
 *
 * @param {AudioBuffer} sourceBuffer - 元の音声
 * @param {number} tempo - 速度倍率 (1.0=変えない, 1.3=1.3倍速, 0.8=0.8倍)
 * @param {AudioContext} ctx - 出力用 AudioContext (sampleRate を合わせる)
 * @returns {AudioBuffer} 速度変更後の音声 (ピッチは元のまま)
 *
 * SoundTouchJS の PitchShifter は本来「ピッチをshift」する用途だが、
 * tempo プロパティで時間伸縮 (TimeStretch) も可能。pitch=0 で「ピッチそのまま、速度だけ変更」になる。
 */
async function timeStretchPreservingPitch(sourceBuffer, tempo, ctx) {
  if (Math.abs(tempo - 1.0) < 0.001) {
    return sourceBuffer;  // 変更不要
  }

  const numChannels = sourceBuffer.numberOfChannels;
  const sampleRate = sourceBuffer.sampleRate;
  const inputLength = sourceBuffer.length;
  // 出力長は速度倍率の逆数倍
  const outputLength = Math.ceil(inputLength / tempo) + 4096;  // 余裕大きめ

  // PitchShifter は AudioBufferSourceNode 互換の API を持つので、
  // OfflineAudioContext で接続して render する
  // ★v1.1.1★ buffer size を 1024 → 4096 に拡大 (音質劣化を最小化)
  //   小さい窓だと TTS のような短いフレーズではイントネーションが歪む。
  //   4096 で TTS の自然な抑揚を保ったまま時間伸縮可能。
  const offlineCtx = new OfflineAudioContext(numChannels, outputLength, sampleRate);
  const shifter = new PitchShifter(offlineCtx, sourceBuffer, 4096);
  shifter.tempo = tempo;
  shifter.pitch = 1.0;  // ピッチは変えない (1.0 = 元のまま)
  shifter.connect(offlineCtx.destination);

  const rendered = await offlineCtx.startRendering();
  return rendered;
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

  // ★v5.15.5★ localStorage から音量レベルを取得 (BGMPanel で設定された最新値)
  // projectData.audio (固定値) よりも localStorage を優先
  let mixerLevels = { voice: 1.0, bgm: 0.15, se: 0.6, master: 1.0 };
  try {
    const saved = localStorage.getItem('mixer-levels');
    if (saved) mixerLevels = { ...mixerLevels, ...JSON.parse(saved) };
  } catch (e) {}
  log(`音量レベル: voice=${mixerLevels.voice} bgm=${mixerLevels.bgm} se=${mixerLevels.se} master=${mixerLevels.master}`);

  const sampleRate = 48000;
  const numChannels = 2;

  // ★v5.15.2★ 速度反映: applySpeechRate=true なら SoundTouchJS でピッチ維持時間伸縮
  // false なら speechRate を無視して 1.0倍 (自然な速度)
  const targetTempo = applySpeechRate ? speechRate : 1.0;
  log(`applySpeechRate=${applySpeechRate}, targetTempo=${targetTempo} (SoundTouchJS pitch-preserving)`);

  // === Phase 1: TTS 音声を全部 decode してから duration を計算する ===
  // ★v5.18.3★ 共通ヘルパー groupBySpeaker でグループ化 (usePlaybackEngine, ttsAdapter と完全同期)
  //   旧版はスペース連結だったため、句点連結のキャッシュキーと不一致 → 全部「未生成」誤判定バグ
  onProgress('TTS グループ化中...', 5);
  const speakerGroups = groupBySpeaker(scripts);
  // audioExporter で必要な形式に変換
  const groups = speakerGroups.map(g => ({
    startIdx: g.startIdx,
    groupScripts: g.scripts,
    joinedText: g.joinedSpeech,  // ★句点連結 (アプリ再生時と完全一致)★
    speaker: g.speaker,
    ses: g.scripts.map(s => s.se || null),
  }));
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
        let audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));

        // ★v5.15.2★ 速度反映が ON なら SoundTouchJS でピッチ維持時間伸縮
        if (targetTempo !== 1.0) {
          try {
            audioBuffer = await timeStretchPreservingPitch(audioBuffer, targetTempo, decodeCtx);
          } catch (stretchErr) {
            log(`[GROUP ${gi}] time stretch 失敗, 1倍速で続行: ${stretchErr.message}`);
          }
        }

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
  // ★v5.15.2★ audioBuffer は既に時間伸縮済みなので duration をそのまま使う
  const charSec = 0.16;
  const ttsTimings = [];
  let cursor = 0;
  for (const item of ttsItems) {
    let durationSec;
    if (item.audioBuffer) {
      durationSec = item.audioBuffer.duration;  // 既に targetTempo 反映済み
    } else {
      // 未生成の場合は推定
      durationSec = (item.joinedText.length * charSec) / targetTempo;
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

  // 4-A: TTS をスケジュール (★v5.15.2★ audioBuffer は既に SoundTouch で時間伸縮済み)
  for (const t of ttsTimings) {
    if (!t.audioBuffer) continue;
    const source = offlineCtx.createBufferSource();
    source.buffer = t.audioBuffer;
    // playbackRate は使わない (時間伸縮は事前に SoundTouch で済んでる)

    const gain = offlineCtx.createGain();
    gain.gain.value = mixerLevels.voice * mixerLevels.master;
    source.connect(gain);
    gain.connect(offlineCtx.destination);
    source.start(t.startSec);
  }

  // === Phase 5: BGM/SE を IndexedDB から直接取得 ===
  // ★v5.15.3★ mixer 経由ではなく IndexedDB に直接アクセス
  //   - mixer は React state なので、コンポーネントアンマウントや再マウントで揮発する可能性
  //   - IndexedDB なら永続的、確実に取得できる
  onProgress('BGM/SE を読み込み中...', 60);

  // 5-A: BGM (localStorage に保存された selectedBgmKey から)
  let bgmAdded = false;
  let selectedBgmKey = null;
  try {
    selectedBgmKey = localStorage.getItem('selectedBgmKey');
  } catch (e) {}

  if (selectedBgmKey) {
    log(`BGM 選択 key: ${selectedBgmKey}`);
    try {
      const bgmBlob = await getBgmBlob(selectedBgmKey);
      if (!bgmBlob) {
        log(`⚠️ BGM blob 取得失敗 (key=${selectedBgmKey} は IndexedDB に存在しない?)`);
      } else {
        log(`BGM blob 取得成功 size=${bgmBlob.size} bytes type=${bgmBlob.type}`);
        const arrayBuffer = await bgmBlob.arrayBuffer();
        let bgmBuffer;
        try {
          bgmBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));
        } catch (decodeErr) {
          log(`⚠️ BGM decode 失敗: ${decodeErr.message}`);
          throw decodeErr;
        }
        log(`BGM decode 成功 duration=${bgmBuffer.duration.toFixed(2)}s channels=${bgmBuffer.numberOfChannels}`);

        const bgmSource = offlineCtx.createBufferSource();
        bgmSource.buffer = bgmBuffer;
        bgmSource.loop = true;
        // BGM は元の速度のまま (倍速にしない)

        const bgmGain = offlineCtx.createGain();
        const baseBgmVol = mixerLevels.bgm * mixerLevels.master;
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
        log(`✅ BGM 追加成功 (vol=${baseBgmVol}, ducking 適用)`);
      }
    } catch (e) {
      log(`⚠️ BGM 合成失敗: ${e.message}`);
    }
  } else {
    log(`BGM 未選択 (localStorage.selectedBgmKey が空)`);
    log(`→ BGMPanel で BGM をタップ (✓選択中) してから再度書き出してください`);
  }

  // 5-B: SE (IndexedDB の listSes + assignedPresetId mapping)
  onProgress('SE を読み込み中...', 70);
  let seAddedCount = 0;
  let seSkippedCount = 0;
  try {
    const seList = await listSes();  // IndexedDB から SE 一覧取得
    log(`SE 一覧: ${seList.length} 件登録済み`);

    // ★v5.15.3★ assignedPresetId は localStorage の "se-assignments" map に保存されてる
    let assignments = {};
    try {
      const raw = localStorage.getItem('se-assignments');
      if (raw) assignments = JSON.parse(raw);
    } catch (e) {}
    log(`SE assignment マップ: ${Object.keys(assignments).length} 件`);

    // ★v5.15.4★ カスタム SE 0件でも合成音 fallback を実行する
    // preset id → blob のマップを構築 (空ならカスタムは使わず全部合成音)
    const presetToBlob = new Map();
    if (seList.length === 0) {
      log(`カスタム SE 未登録 → 全 SE は合成音 fallback`);
    } else {
      // assignments[seKey] = presetId なので逆引き
      for (const seMeta of seList) {
        const presetId = assignments[seMeta.key];
        if (!presetId) {
          log(`  SE ${seMeta.key} (${seMeta.name}) は preset 未割り当て → 合成音 fallback`);
          continue;
        }
        const blob = await getSeBlob(seMeta.key);
        if (!blob) {
          log(`  ⚠️ SE blob 取得失敗 key=${seMeta.key} → 合成音 fallback`);
          continue;
        }
        presetToBlob.set(presetId, blob);
        log(`  SE ${presetId} ← ${seMeta.name} (${blob.size} bytes)`);
      }
      log(`SE preset マッピング完了: カスタム ${presetToBlob.size} preset / その他は合成音`);
    }

    {
      // scripts を順次たどって SE を配置 (★v5.15.4★ カスタムなければ合成音 fallback)
      let syntheticCount = 0;
      const seVolume = mixerLevels.se * mixerLevels.master;

      // ★v5.18.0★ 冒頭フック (id:0) で hook_impact を自動配置 (Gemini提言: 打撃音/ミット音)
      // 最初の script に明示的な se が指定されていなければ自動的に hook_impact を入れる
      const firstScript = scripts[0];
      if (firstScript && !firstScript.se) {
        const hookSeId = 'hook_impact';
        const hookBlob = presetToBlob.get(hookSeId);
        const startSec = ttsTimings[0]?.startSec || 0;
        if (hookBlob) {
          try {
            const arrayBuffer = await hookBlob.arrayBuffer();
            const seBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));
            const source = offlineCtx.createBufferSource();
            source.buffer = seBuffer;
            const gain = offlineCtx.createGain();
            gain.gain.value = seVolume;
            source.connect(gain);
            gain.connect(offlineCtx.destination);
            source.start(startSec);
            seAddedCount++;
            log(`✅ 冒頭 hook_impact 自動配置 (カスタム)`);
          } catch (e) {
            scheduleSyntheticSe(offlineCtx, hookSeId, startSec, seVolume);
            syntheticCount++;
            log(`✅ 冒頭 hook_impact 自動配置 (合成音 fallback)`);
          }
        } else if (SYNTHETIC_SE_PRESETS[hookSeId]) {
          scheduleSyntheticSe(offlineCtx, hookSeId, startSec, seVolume);
          syntheticCount++;
          log(`✅ 冒頭 hook_impact 自動配置 (合成音)`);
        }
      }

      for (const t of ttsTimings) {
        let scriptCursor = t.startSec;
        const groupTotalChars = t.joinedText.length || 1;
        const groupDuration = t.durationSec;
        for (let k = 0; k < t.groupScripts.length; k++) {
          const s = t.groupScripts[k];
          const seId = s.se;
          if (seId) {
            const seBlob = presetToBlob.get(seId);
            if (seBlob) {
              try {
                const arrayBuffer = await seBlob.arrayBuffer();
                const seBuffer = await offlineCtx.decodeAudioData(arrayBuffer.slice(0));
                const source = offlineCtx.createBufferSource();
                source.buffer = seBuffer;
                // SE も元の速度のまま (倍速にしない)
                const gain = offlineCtx.createGain();
                gain.gain.value = seVolume;
                source.connect(gain);
                gain.connect(offlineCtx.destination);
                source.start(scriptCursor);
                seAddedCount++;
              } catch (e) {
                log(`  ⚠️ SE ${seId} decode 失敗 → 合成音 fallback`);
                // 合成音 fallback
                if (SYNTHETIC_SE_PRESETS[seId]) {
                  scheduleSyntheticSe(offlineCtx, seId, scriptCursor, seVolume);
                  syntheticCount++;
                } else {
                  seSkippedCount++;
                }
              }
            } else {
              // ★v5.15.4★ カスタム SE 未登録 → 合成音 fallback
              if (SYNTHETIC_SE_PRESETS[seId]) {
                scheduleSyntheticSe(offlineCtx, seId, scriptCursor, seVolume);
                syntheticCount++;
              } else {
                log(`  ⚠️ SE ${seId} は preset もカスタムもなし → スキップ`);
                seSkippedCount++;
              }
            }
          }
          const thisChars = (s.speech || s.text || '').length;
          scriptCursor += (thisChars / groupTotalChars) * groupDuration;
        }
      }
      log(`✅ SE 配置: カスタム ${seAddedCount} 件 / 合成音 ${syntheticCount} 件 / スキップ ${seSkippedCount} 件`);
      // seAddedCount に合成音もカウント (UI表示用)
      seAddedCount += syntheticCount;
    }
  } catch (e) {
    log(`⚠️ SE 取得失敗: ${e.message}`);
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
