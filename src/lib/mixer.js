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
  }

  _ensureContext() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.levels.master;
    this.masterGain.connect(this.ctx.destination);

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
      node.gain.cancelScheduledValues(this.ctx.currentTime);
      node.gain.setTargetAtTime(track === 'bgm' && this._ducking ? v * this.levels.duckingAmount : v, this.ctx.currentTime, 0.05);
    }
  }

  setDuckingAmount(amount) {
    this.levels.duckingAmount = Math.max(0, Math.min(1, amount));
  }

  async loadBgmFromUrl(url) {
    this._ensureContext();
    const response = await fetch(url);
    if (!response.ok) throw new Error(`BGM fetch failed: ${response.status}`);
    const arrayBuf = await response.arrayBuffer();
    this.bgmBuffer = await this.ctx.decodeAudioData(arrayBuf);
    return this.bgmBuffer.duration;
  }

  playBgm(loop = true) {
    if (!this.bgmBuffer) return;
    this._ensureContext();
    this.stopBgm();
    const src = this.ctx.createBufferSource();
    src.buffer = this.bgmBuffer;
    src.loop = loop;
    src.connect(this.bgmGain);
    src.start(0);
    this.bgmSource = src;
    this._bgmStartedAt = this.ctx.currentTime;
  }

  stopBgm() {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch (e) {}
      try { this.bgmSource.disconnect(); } catch (e) {}
      this.bgmSource = null;
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
   * SE（短い効果音）を再生。seIdはSE_PRESETSのいずれか。
   * 実装では合成音（Oscillator＋Envelope）で軽量に鳴らす。
   * 本番で素材ファイルを使いたい場合は loadSeFromUrl() で差し替え可能。
   */
  playSe(seId) {
    this._ensureContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    
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
