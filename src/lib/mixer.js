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
      // 既にloopで鳴ってるSEがあれば即反映
      for (const el of this._seAudioEls.values()) {
        if (el && !el.paused) el.volume = v * this.levels.master;
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
      try { this.bgmAudioEl.remove(); } catch (e) {}  // ★v5.14.3★ 旧要素を DOM から削除
      this.bgmAudioEl.src = '';
    }
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.src = url;
    audio.volume = this._effectiveBgmVolume();
    // ★v5.14.3★ DOM に attach (Android 画面録画でキャプチャ可能に)
    audio.style.position = 'fixed';
    audio.style.bottom = '-100px';
    audio.style.opacity = '0';
    audio.style.pointerEvents = 'none';
    audio.setAttribute('playsinline', '');
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
   * カスタムSEファイルを登録 (HTMLAudioElement + blob URL で保持)
   */
  async registerCustomSe(id, blob) {
    const prev = this._seAudioEls.get(id);
    if (prev) {
      try { prev.pause(); } catch (e) {}
      try { prev.remove(); } catch (e) {}  // ★v5.14.3★ 旧要素を DOM から削除
      if (prev._blobUrl) URL.revokeObjectURL(prev._blobUrl);
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio._blobUrl = url;
    audio.volume = this._effectiveSeVolume();
    // ★v5.14.3★ DOM に attach (Android 画面録画対応 — 原本もattach、clone のtemplate として保持)
    audio.style.position = 'fixed';
    audio.style.bottom = '-100px';
    audio.style.opacity = '0';
    audio.style.pointerEvents = 'none';
    audio.setAttribute('playsinline', '');
    document.body.appendChild(audio);
    await new Promise((resolve) => {
      let done = false;
      const ok = () => { if (!done) { done = true; resolve(); } };
      audio.addEventListener('canplaythrough', ok, { once: true });
      audio.addEventListener('loadedmetadata', ok, { once: true });
      audio.addEventListener('error', ok, { once: true });
      setTimeout(ok, 2000);
    });
    this._seAudioEls.set(id, audio);
    return audio.duration || 0;
  }

  unregisterCustomSe(id) {
    const el = this._seAudioEls.get(id);
    if (el) {
      try { el.pause(); } catch (e) {}
      try { el.remove(); } catch (e) {}  // ★v5.14.3★ DOM から削除
      if (el._blobUrl) URL.revokeObjectURL(el._blobUrl);
    }
    this._seAudioEls.delete(id);
  }

  /**
   * SE再生: カスタムSE優先 (HTMLAudioElement 録画対応)、なければ合成音 fallback
   */
  playSe(seId) {
    // カスタムSE優先
    const customEl = this._seAudioEls.get(seId);
    if (customEl) {
      try {
        // 重ね再生: cloneして新インスタンスで鳴らす
        const clone = customEl.cloneNode(true);
        clone.volume = this._effectiveSeVolume();
        // ★v5.14.3★ clone も DOM に attach (録画対応)
        clone.style.position = 'fixed';
        clone.style.bottom = '-100px';
        clone.style.opacity = '0';
        clone.style.pointerEvents = 'none';
        clone.setAttribute('playsinline', '');
        document.body.appendChild(clone);
        clone.play().catch(err => console.warn('SE play failed:', err));
        clone.addEventListener('ended', () => {
          try { clone.remove(); } catch (e) {}
        }, { once: true });
      } catch (e) {
        console.warn('SE clone failed, using original:', e);
        customEl.currentTime = 0;
        customEl.volume = this._effectiveSeVolume();
        customEl.play().catch(() => {});
      }
      return;
    }

    // 合成音フォールバック (AudioContext - 録画で取れない可能性あり)
    this._ensureSynthContext();
    const ctx = this._synthCtx;
    const now = ctx.currentTime;

    const presets = {
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
    };

    const preset = presets[seId] || presets.click_tap;
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
    for (const el of this._seAudioEls.values()) {
      if (el?._blobUrl) URL.revokeObjectURL(el._blobUrl);
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
