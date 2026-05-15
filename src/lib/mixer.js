/**
 * HTMLAudioElement ベースのオーディオミキサー (v5.14.3)
 *
 * 【★Android Chrome 録画対応の3鉄則 (v5.14.3)★】
 * 1. **AudioContext は録画されない**: ctx.destination 経由の音は画面録画で拾われない。
 *    BGM / SE / Voice 全てを純粋な HTMLAudioElement で並行再生する。
 * 2. **HTMLMediaElement は DOM attach 必須**: new Audio() で作っても DOM ツリーに
 *    appendChild() しないと Android 画面録画でキャプチャされない。
 * 3. **playbackRate は play() 直前に設定**: canplay 前に設定しても Android Chrome では
 *    反映されないことがある。
 *
 * 【autoplay policy 対策】
 * 動画再生開始時に ttsAdapter.unlock() を await する (silent.wav で permission 取得)。
 * これがないと「最初の再生だけ無音、何度か再生し直すと安定」現象が発生する。
 *
 * 音量制御・ducking は element.volume を直接操作 (AudioContext gain 不使用)。
 * 合成音SE (カスタムSE未登録の場合) のみ AudioContext を使うが、これは短時間のため録画取りこぼしても許容。
 *
 * 【今後のリファクタ時の正典】
 * 上記3鉄則を守ること。最適化と称してこれを破ると録画 / 速度 / autoplay の不具合が再発する。
 * v5.11.7 で AudioBufferSourceNode 化して回帰した経験あり (v5.14.1 で revert)。
 */

import { DEFAULT_MIXER_LEVELS } from './config';
import { audioBufferToWav } from './audioExporter';

/**
 * 合成音 SE プリセット (class 外に export — audioExporter / pregenerateSyntheticSeWavs から参照)
 * 旧版は playSe 内に持っていたが、起動時に WAV 化するため module-level に昇格。
 */
export const SYNTHETIC_SE_PRESETS = {
  hook_impact:     { freqs: [80, 40],   type: 'sawtooth', attack: 0.01, release: 0.25, gain: 0.5 },
  highlight_ping:  { freqs: [880, 1320],type: 'sine',     attack: 0.005, release: 0.18, gain: 0.3 },
  stat_reveal:     { freqs: [523, 784], type: 'triangle', attack: 0.01, release: 0.22, gain: 0.35 },
  shock_hit:       { freqs: [200, 100], type: 'square',   attack: 0.005, release: 0.3, gain: 0.4 },
  success_chime:   { freqs: [659, 988, 1319], type: 'sine', attack: 0.01, release: 0.4, gain: 0.3 },
  warning_alert:   { freqs: [440, 415], type: 'square',   attack: 0.01, release: 0.2, gain: 0.3 },
  transition_swoosh: { freqs: [1500, 200], type: 'sawtooth', attack: 0.02, release: 0.25, gain: 0.25 },
  click_tap:       { freqs: [2000],     type: 'square',   attack: 0.001, release: 0.04, gain: 0.2 },
  radar_ping:      { freqs: [1200],     type: 'sine',     attack: 0.005, release: 0.15, gain: 0.25 },
  outro_fade:      { freqs: [440, 330, 220], type: 'sine', attack: 0.02, release: 0.6, gain: 0.3 },
  // v5.20.15 で合成定義追加)
  // sparkle_up: 高音上昇 (キラキラ)
  sparkle_up:      { freqs: [1047, 1568, 2093], type: 'sine', attack: 0.005, release: 0.35, gain: 0.25 },
  // drum_roll: 低音震動 (ドラムロール)
  drum_roll:       { freqs: [60, 80, 60, 80], type: 'triangle', attack: 0.005, release: 0.5, gain: 0.4 },
  // whoosh_in: 低→高 上昇感 (登場)
  whoosh_in:       { freqs: [200, 1200], type: 'sawtooth', attack: 0.02, release: 0.3, gain: 0.3 },
  // soft_pop: ポンと一発の柔らかい音
  soft_pop:        { freqs: [600, 400], type: 'sine', attack: 0.005, release: 0.12, gain: 0.25 },
  // heavy_thud: 重い衝撃 (悲報)
  heavy_thud:      { freqs: [60, 30], type: 'square', attack: 0.002, release: 0.4, gain: 0.5 },
  // ding_correct: 正解音 (高音1回チーン)
  ding_correct:    { freqs: [1568, 2093], type: 'sine', attack: 0.001, release: 0.45, gain: 0.3 },
  // low_buzz: 違和感の低音バズ
  low_buzz:        { freqs: [110, 138], type: 'sawtooth', attack: 0.01, release: 0.25, gain: 0.3 },
  // crystal_chime: 美しい複音 (支配的成績の表現)
  crystal_chime:   { freqs: [880, 1175, 1568, 2093], type: 'sine', attack: 0.008, release: 0.55, gain: 0.28 },
};

/**
 * 合成音 SE プリセットを OfflineAudioContext で WAV blob 化
 *
 * 【目的】 デフォルト SE を画面録画で拾えるようにする。
 *   旧: AudioContext で実時間合成 → 画面録画キャプチャに乗らない (Firefox/Chrome 共通の制約)
 *   新: 起動時に全プリセットを WAV blob 化して registerCustomSe で HTMLAudioElement 登録
 *       → playSe は HTMLAudioElement プールから鳴らすので画面録画で拾える
 *
 * @param {string} presetId - 'hook_impact' 等
 * @returns {Promise<Blob>} WAV blob
 */
export async function synthesizeSePresetToWavBlob(presetId) {
  const preset = SYNTHETIC_SE_PRESETS[presetId];
  if (!preset) throw new Error(`unknown synthetic SE preset: ${presetId}`);

  const sampleRate = 44100;
  // 全 freqs が連続で鳴り終わるまでの長さ + バッファ
  const totalSec = preset.attack + preset.release + 0.1 + (preset.freqs.length - 1) * 0.04;
  const totalSamples = Math.ceil(totalSec * sampleRate);

  const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate);
  const gain = offlineCtx.createGain();
  gain.connect(offlineCtx.destination);

  const now = 0;
  const finalGain = preset.gain;  // _effectiveSeVolume は再生時に HTMLAudioElement.volume で適用
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(finalGain, now + preset.attack);
  gain.gain.exponentialRampToValueAtTime(0.001, now + preset.attack + preset.release);

  preset.freqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    osc.type = preset.type;
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
    osc.connect(gain);
    osc.start(now + idx * 0.04);
    osc.stop(now + preset.attack + preset.release + 0.05 + idx * 0.04);
  });

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWav(renderedBuffer);
}

export class MixerEngine {
  constructor() {
    this.levels = { ...DEFAULT_MIXER_LEVELS };
    this._ducking = false;

    // BGM: 単一HTMLAudioElement (ループ再生)
    this.bgmAudioEl = null;
    this._bgmUrl = null;

    // SE: カスタムSE用 HTMLAudioElement プール (preset ID → Audio)
    // 合成音SE用 AudioContext (録画で拾われないが fallback)
    this._seAudioEls = new Map();
    this._synthCtx = null;
  }

  // AudioContext は合成音SEでのみ使用 (遅延生成)
  _ensureSynthContext() {
    if (this._synthCtx) return;
    this._synthCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // 互換性のため空実装 (古いコードから呼ばれてもエラーにならない)
  _ensureContext() {
    // no-op (新設計では不要)
  }

  // 画面録画用 MediaStream (使わないが API互換性のため残す)
  getRecordingStream() {
    return null;
  }

  setLevel(track, value) {
    const v = Math.max(0, Math.min(1, value));
    this.levels[track] = v;

    if (track === 'bgm' && this.bgmAudioEl) {
      this.bgmAudioEl.volume = this._effectiveBgmVolume();
    } else if (track === 'voice') {
      // voice は TTSAdapter 側で HTMLAudioElement を直接作るので、
      // mixer 側は levels を保持するだけ (TTS再生時にこの値を適用)
    } else if (track === 'se') {
      // プール化対応: entry.pool の各要素に対して volume 更新
      for (const entry of this._seAudioEls.values()) {
        if (entry && entry.pool) {
          for (const el of entry.pool) {
            if (el && !el.paused) el.volume = v * this.levels.master;
          }
        }
      }
    } else if (track === 'master') {
      if (this.bgmAudioEl) this.bgmAudioEl.volume = this._effectiveBgmVolume();
    }
  }

  setDuckingAmount(amount) {
    this.levels.duckingAmount = Math.max(0, Math.min(1, amount));
  }

  _effectiveBgmVolume() {
    const base = this.levels.bgm * this.levels.master;
    return this._ducking ? base * this.levels.duckingAmount : base;
  }

  _effectiveVoiceVolume() {
    return this.levels.voice * this.levels.master;
  }

  _effectiveSeVolume() {
    return this.levels.se * this.levels.master;
  }

  // ========== BGM ==========

  async loadBgmFromUrl(url) {
    this._bgmUrl = url;
    if (this.bgmAudioEl) {
      try { this.bgmAudioEl.pause(); } catch (e) {}
      try { this.bgmAudioEl.remove(); } catch (e) {}
      this.bgmAudioEl.src = '';
    }
    // <video> 要素に変更 (AUDIO_USAGE_MEDIA を確実にするため)
    const audio = document.createElement('video');
    audio.loop = true;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.muted = false;
    audio.id = 'mixer-bgm-shared';
    audio.src = url;
    audio.volume = this._effectiveBgmVolume();
    // 1px 可視
    audio.style.position = 'fixed';
    audio.style.bottom = '0';
    audio.style.left = '0';
    audio.style.width = '1px';
    audio.style.height = '1px';
    audio.style.opacity = '0.01';
    audio.style.pointerEvents = 'none';
    audio.style.zIndex = '-9999';
    audio.style.background = '#000';
    document.body.appendChild(audio);
    this.bgmAudioEl = audio;
    await new Promise((resolve, reject) => {
      let done = false;
      const ok = () => { if (!done) { done = true; resolve(); } };
      audio.addEventListener('canplaythrough', ok, { once: true });
      audio.addEventListener('loadedmetadata', ok, { once: true });
      audio.addEventListener('error', (e) => { if (!done) { done = true; reject(e); } }, { once: true });
      // 2秒で強制解決 (loadedmetadata不発火対策)
      setTimeout(ok, 2000);
    });
    return audio.duration || 0;
  }

  playBgm(loop = true) {
    if (!this.bgmAudioEl) return;
    try {
      this.bgmAudioEl.loop = loop;
      this.bgmAudioEl.currentTime = 0;
      this.bgmAudioEl.volume = this._effectiveBgmVolume();
      const p = this.bgmAudioEl.play();
      if (p && p.catch) p.catch(err => console.warn('BGM play failed:', err));
    } catch (e) {
      console.warn('playBgm error:', e);
    }
  }

  stopBgm() {
    if (this.bgmAudioEl) {
      try {
        this.bgmAudioEl.pause();
        this.bgmAudioEl.currentTime = 0;
      } catch (e) {}
    }
  }

  // ========== ducking (BGMの音量 element.volume で直接制御) ==========

  startDucking() {
    if (this._ducking) return;
    this._ducking = true;
    if (!this.bgmAudioEl) return;
    const target = this._effectiveBgmVolume();
    const start = this.bgmAudioEl.volume;
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        if (this._ducking && this.bgmAudioEl) {
          this.bgmAudioEl.volume = start + (target - start) * (i / steps);
        }
      }, i * 15);
    }
  }

  stopDucking() {
    if (!this._ducking) return;
    this._ducking = false;
    if (!this.bgmAudioEl) return;
    const target = this._effectiveBgmVolume();
    const start = this.bgmAudioEl.volume;
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        if (!this._ducking && this.bgmAudioEl) {
          this.bgmAudioEl.volume = start + (target - start) * (i / steps);
        }
      }, i * 25);
    }
  }

  // ========== SE ==========

  /**
  /**
   * 全合成音SEプリセットを起動時に WAV 化して registerCustomSe で登録
   *
   * 【目的】 デフォルト SE (合成音) を画面録画で拾えるようにする。
   *   旧 (v5.18.9): カスタムSE未登録の場合 AudioContext で実時間合成 → 画面録画で取れない
   *   新: 起動時に全プリセットを WAV blob 化 → HTMLAudioElement プール登録 → 画面録画で取れる
   *
   * カスタム SE が既に登録されているプリセット ID は上書きしない (ユーザーアップロードを優先)。
   *
   * @returns {Promise<{registered, skipped, errors}>}
   */
  async preregisterSyntheticSes() {
    let registered = 0, skipped = 0, errors = 0;

    // 並列で全プリセットを WAV 化 → registerCustomSe
    const tasks = Object.keys(SYNTHETIC_SE_PRESETS).map(async (presetId) => {
      // 既にカスタム SE が登録されている場合はスキップ (アップロード優先)
      if (this._seAudioEls.has(presetId)) {
        skipped++;
        return;
      }
      try {
        const blob = await synthesizeSePresetToWavBlob(presetId);
        await this.registerCustomSe(presetId, blob);
        registered++;
      } catch (err) {
        console.error(`[mixer] preregister synthetic SE "${presetId}" failed:`, err);
        errors++;
      }
    });

    await Promise.all(tasks);
    return { registered, skipped, errors };
  }

  /**
   * カスタムSEファイルを登録 (HTMLAudioElement + blob URL で保持)
   *
   * プール化: 起動時に N 個の <video> 要素を DOM に常駐させ、
   * 再生時は **DOM mutation ゼロ** で空き要素を再利用する。
   * これにより画面録画時のテロップ進行遅延 (SE のたびにメインスレッド詰まり) を解消。
   */
  async registerCustomSe(id, blob) {
    const POOL_SIZE = 4;  // 同 SE が重なって鳴ることはほぼ無いが、念のため 4 で

    // 既存プールの片付け
    const prev = this._seAudioEls.get(id);
    if (prev && prev.pool) {
      for (const el of prev.pool) {
        try { el.pause(); } catch (e) {}
        try { el.remove(); } catch (e) {}
      }
      if (prev.blobUrl) URL.revokeObjectURL(prev.blobUrl);
    }

    const url = URL.createObjectURL(blob);
    const pool = [];
    let firstDuration = 0;

    for (let i = 0; i < POOL_SIZE; i++) {
      // <video> 要素に変更 (AUDIO_USAGE_MEDIA 確実化)
      const audio = document.createElement('video');
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.muted = false;
      audio.src = url;
      audio.volume = this._effectiveSeVolume();
      // 1px 可視
      audio.style.position = 'fixed';
      audio.style.bottom = '0';
      audio.style.left = `${i}px`;  // 重ならないように 1px ずつズラす
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0.01';
      audio.style.pointerEvents = 'none';
      audio.style.zIndex = '-9999';
      audio.style.background = '#000';
      document.body.appendChild(audio);
      pool.push(audio);
    }

    // 1個だけ load を待つ (他は同じ src なので並列 load される)
    await new Promise((resolve) => {
      let done = false;
      const first = pool[0];
      const ok = () => { if (!done) { done = true; firstDuration = first.duration || 0; resolve(); } };
      first.addEventListener('canplaythrough', ok, { once: true });
      first.addEventListener('loadedmetadata', ok, { once: true });
      first.addEventListener('error', ok, { once: true });
      setTimeout(ok, 2000);
    });

    // プールエントリを Map に格納 (.pool, .blobUrl, .nextIdx で round-robin)
    this._seAudioEls.set(id, { pool, blobUrl: url, nextIdx: 0 });
    return firstDuration;
  }

  unregisterCustomSe(id) {
    const entry = this._seAudioEls.get(id);
    if (entry) {
      if (entry.pool) {
        for (const el of entry.pool) {
          try { el.pause(); } catch (e) {}
          try { el.remove(); } catch (e) {}
        }
      }
      if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
    }
    this._seAudioEls.delete(id);
  }

  /**
   * SE再生: カスタムSE優先 (HTMLAudioElement 録画対応)、なければ合成音 fallback
   *
   * プール化: cloneNode + appendChild + remove の DOM mutation を排除。
   * メインスレッド負荷ほぼゼロ → 画面録画時のテロップ進行遅延を解消。
   *
   * 通常運用では preregisterSyntheticSes() で全プリセットが
   * HTMLAudioElement 化されているので、合成音 fallback は preregister 失敗時の保険のみ。
   */
  playSe(seId) {
    const entry = this._seAudioEls.get(seId);
    if (entry && entry.pool && entry.pool.length > 0) {
      try {
        // round-robin でプールから次の要素を取得
        const idx = entry.nextIdx % entry.pool.length;
        entry.nextIdx = (entry.nextIdx + 1) % entry.pool.length;
        const el = entry.pool[idx];
        // 再生中なら停止 (重なった場合のみ、軽量)
        try { el.pause(); } catch (e) {}
        el.currentTime = 0;
        el.volume = this._effectiveSeVolume();
        // play() は Promise で非同期、メインスレッドはブロックしない
        el.play().catch(err => console.warn('SE play failed:', err));
      } catch (e) {
        console.warn('SE pool play failed, fallback to synthetic:', e);
      }
      return;
    }

    // 通常は preregisterSyntheticSes() で HTMLAudioElement 化済み。
    // ここに来るのは preregister 失敗時のみ → AudioContext 合成 (画面録画では拾えないが、無音よりマシ)
    console.warn(`[mixer] SE "${seId}" not found in pool, falling back to AudioContext synth (will not be captured by screen recording)`);
    this._ensureSynthContext();
    const ctx = this._synthCtx;
    const now = ctx.currentTime;
    const preset = SYNTHETIC_SE_PRESETS[seId] || SYNTHETIC_SE_PRESETS.click_tap;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const finalGain = preset.gain * this._effectiveSeVolume();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(finalGain, now + preset.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + preset.attack + preset.release);
    preset.freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = preset.type;
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.connect(gain);
      osc.start(now + idx * 0.04);
      osc.stop(now + preset.attack + preset.release + 0.05 + idx * 0.04);
    });
  }

  // ========== 互換性プロパティ (既存コードが参照してもエラーにならない) ==========

  get voiceGain() { return null; }
  get bgmGain() { return null; }
  get seGain() { return null; }
  get masterGain() { return null; }
  get ctx() { return this._synthCtx; }

  connectVoiceElement(htmlAudioElement) {
    return null;
  }

  dispose() {
    this.stopBgm();
    if (this.bgmAudioEl?._blobUrl) URL.revokeObjectURL(this.bgmAudioEl._blobUrl);
    this.bgmAudioEl = null;
    // プール化対応: 各エントリの pool / blobUrl を片付ける
    for (const entry of this._seAudioEls.values()) {
      if (entry?.pool) {
        for (const el of entry.pool) {
          try { el.pause(); } catch (e) {}
          try { el.remove(); } catch (e) {}
        }
      }
      if (entry?.blobUrl) URL.revokeObjectURL(entry.blobUrl);
    }
    this._seAudioEls.clear();
    if (this._synthCtx) {
      try { this._synthCtx.close(); } catch (e) {}
      this._synthCtx = null;
    }
  }
}

let _mixerInstance = null;
export function getMixer() {
  if (!_mixerInstance) _mixerInstance = new MixerEngine();
  return _mixerInstance;
}

// 現在再生中のvoice要素を取得する helper (ducking連動用)
export function getVoiceVolume(mixer) {
  return mixer._effectiveVoiceVolume();
}
