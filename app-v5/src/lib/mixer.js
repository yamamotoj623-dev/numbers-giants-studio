/**
 * Web Audio API ベースのオーディオミキサー
 * 
 * 3トラック: voice / bgm / se を個別ゲインで管理。
 * ボイス再生中は BGM を自動で duckingAmount レベルまで減衰させる。
 * 
 * 設計: MixerEngine インスタンスは App レベルで1つ。複数作るとAudioContextが乱立する。
 */

import { DEFAULT_MIXER_LEVELS } from './config';

export class MixerEngine {
  constructor() {
    this.ctx = null;
    this.levels = { ...DEFAULT_MIXER_LEVELS };
    this.bgmSource = null;
    this.bgmGain = null;
    this.bgmBuffer = null;
    this.masterGain = null;
    this.seGain = null;
    this.voiceGain = null;
    this._ducking = false;
    this._bgmStartedAt = 0;
    this._bgmPausedAt = 0;
    this._seBuffers = new Map();
    this._recordingDestination = null;
  }

  _ensureContext() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.levels.master;

    // ★録画対応: masterGain の出力を MediaStreamDestination 経由で HTMLAudioElement で再生
    // これにより OS の画面録画が「メディア音声」として認識し、録画に音が乗る
    // ctx.destination への直結は、OS の録画で拾われないケースがあるため避ける
    this._outputDestination = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this._outputDestination);
    this.masterGain.connect(this.ctx.destination); // 通常スピーカーにも出す (フォールバック)

    // 隠し HTMLAudioElement で MediaStream を再生 (OS録画で拾われる)
    this._outputAudioEl = new Audio();
    this._outputAudioEl.srcObject = this._outputDestination.stream;
    this._outputAudioEl.volume = 1.0;
    // 自動再生: ユーザーインタラクション後に呼び出されるはずなので成功する
    this._outputAudioEl.play().catch(err => {
      console.warn('Mixer output audio play failed:', err);
    });

    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.value = this.levels.voice;
    this.voiceGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = this.levels.bgm;
    this.bgmGain.connect(this.masterGain);

    this.seGain = this.ctx.createGain();
    this.seGain.gain.value = this.levels.se;
    this.seGain.connect(this.masterGain);
  }

  /**
   * 画面録画用の MediaStream を取得。
   * canvas.captureStream() の audioTracks と組み合わせることで BGM/SE/Voice が録画に乗る。
   * 呼び出すと masterGain から分岐する MediaStreamDestination が生成される。
   */
  getRecordingStream() {
    this._ensureContext();
    if (!this._recordingDestination) {
      this._recordingDestination = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this._recordingDestination);
    }
    return this._recordingDestination.stream;
  }

  setLevel(track, value) {
    this._ensureContext();
    const v = Math.max(0, Math.min(1, value));
    this.levels[track] = v;

    const node = {
      voice: this.voiceGain,
      bgm: this.bgmGain,
      se: this.seGain,
      master: this.masterGain,
    }[track];
    if (node) {
      // BGMなら ducking 状態も反映
      const target = (track === 'bgm' && this._ducking) ? v * this.levels.duckingAmount : v;
      node.gain.cancelScheduledValues(this.ctx.currentTime);
      node.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
  }

  setDuckingAmount(amount) {
    this.levels.duckingAmount = Math.max(0, Math.min(1, amount));
  }

  async loadBgmFromUrl(url) {
    this._ensureContext();
    this._bgmUrl = url;
    if (this.bgmAudioEl) {
      try { this.bgmAudioEl.pause(); } catch (e) {}
      try { this._bgmSourceNode?.disconnect(); } catch (e) {}
      this.bgmAudioEl.src = '';
    }
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.preload = 'auto';
    audio.src = url;
    // HTMLAudioElement自体を無音にしてAudioContext経由で再生 (録画対応 + mixer統合)
    audio.volume = 1.0; // これはmixerのsrc→bgmGainに流す前の段階
    this.bgmAudioEl = audio;
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
    });
    // AudioContext graph に接続: HTMLAudioElement → bgmGain → masterGain
    this._bgmSourceNode = this.ctx.createMediaElementSource(audio);
    this._bgmSourceNode.connect(this.bgmGain);
    return audio.duration || 0;
  }

  playBgm(loop = true) {
    if (!this.bgmAudioEl) return;
    this._ensureContext();
    try {
      this.bgmAudioEl.loop = loop;
      this.bgmAudioEl.currentTime = 0;
      this.bgmAudioEl.play().catch(err => console.warn('BGM play failed:', err));
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

  startDucking() {
    if (!this.bgmGain || this._ducking) return;
    this._ducking = true;
    const target = this.levels.bgm * this.levels.duckingAmount;
    this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bgmGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
  }

  stopDucking() {
    if (!this.bgmGain || !this._ducking) return;
    this._ducking = false;
    this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bgmGain.gain.setTargetAtTime(this.levels.bgm, this.ctx.currentTime, 0.15);
  }

  /**
   * カスタムSEバッファを登録 (アップロードされたファイル)
   * 画面録画でも拾われるようHTMLAudioElement用にblobUrlとしても保持
   */
  async registerCustomSe(id, blob) {
    this._ensureContext();
    const arrayBuf = await blob.arrayBuffer();
    // AudioContext用 (低レイテンシ再生用)
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuf.slice(0));
    this._seBuffers.set(id, audioBuffer);
    // HTMLAudioElement用 (画面録画用の予備ルート)
    const url = URL.createObjectURL(blob);
    if (!this._seBlobUrls) this._seBlobUrls = new Map();
    const prev = this._seBlobUrls.get(id);
    if (prev) URL.revokeObjectURL(prev);
    this._seBlobUrls.set(id, url);
    return audioBuffer.duration;
  }

  unregisterCustomSe(id) {
    this._seBuffers.delete(id);
    if (this._seBlobUrls) {
      const url = this._seBlobUrls.get(id);
      if (url) URL.revokeObjectURL(url);
      this._seBlobUrls.delete(id);
    }
  }

  /**
   * SE（短い効果音）を再生。seIdはSE_PRESETSのいずれか or 登録済みカスタムID。
   * カスタムSEが登録されていればそちらが優先、なければ合成音のプリセットを使う。
   */
  playSe(seId) {
    this._ensureContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // カスタムSE優先
    const customBuffer = this._seBuffers.get(seId);
    if (customBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = customBuffer;
      src.connect(this.seGain);
      src.start(0);
      return;
    }

    // 軽量合成音のプリセット定義
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
    gain.connect(this.seGain);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(preset.gain, now + preset.attack);
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

  /**
   * 外部のVoice出力をミキサーに接続したい場合に使用。
   * （HTMLAudioElementをcreateMediaElementSourceで接続できる）
   * 現状のTTSAdapter実装では Audio要素 の直接再生なので、master gainの管理外だが、
   * ミキサー経由にしたければこの関数経由で接続する。
   */
  connectVoiceElement(htmlAudioElement) {
    this._ensureContext();
    const src = this.ctx.createMediaElementSource(htmlAudioElement);
    src.connect(this.voiceGain);
    return src;
  }

  dispose() {
    this.stopBgm();
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) {}
      this.ctx = null;
    }
  }
}

let _mixerInstance = null;
export function getMixer() {
  if (!_mixerInstance) _mixerInstance = new MixerEngine();
  return _mixerInstance;
}
