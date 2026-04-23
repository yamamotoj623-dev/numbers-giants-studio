/**
 * TTS アダプタ抽象化レイヤー
 * 
 * 2種類のエンジンを同じインターフェースで扱えるようにする。
 * - WebSpeechAdapter: 無料・即時・下書き用
 * - GeminiAdapter:   有料・高品質・本番用
 * 
 * 将来的にElevenLabs等への乗り換えも、新しいアダプタを追加するだけで済む構造。
 * 
 * 共通インターフェース:
 *   speak(text, speaker, { rate, onEnd, onError }): Promise<void>
 *   stop(): void
 *   pregenerate(texts): Promise<{ generated, cached, errors, costUsd }>
 *   name: string
 */

import { GAS_CONFIG } from './config';
import { getCachedAudio, saveCachedAudio } from './audioCache';

// ============================================================================
// PCM → WAV 変換（Gemini TTS が PCM 16bit 24kHz を返してくるため）
// ============================================================================
function pcmToWav(pcmBytes, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmBytes);
  return new Blob([buffer], { type: 'audio/wav' });
}

function base64ToBytes(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ============================================================================
// WebSpeechAdapter: ブラウザ内蔵 TTS（下書き層）
// ============================================================================
export class WebSpeechAdapter {
  constructor() {
    this.name = 'web_speech';
    this.label = 'ブラウザ標準 (下書き)';
    this.currentUtterance = null;
    this.fallbackTimer = null;
    this._voices = [];
    this._loadVoices();
  }

  _loadVoices() {
    const load = () => { this._voices = window.speechSynthesis.getVoices(); };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  async prefetch(text, speaker) {
    // Web Speech は何も準備不要
  }

  speak(text, speaker, opts = {}) {
    return new Promise((resolve) => {
      const { rate = 1.6, onEnd, onError } = opts;
      this.stop();

      if (!('speechSynthesis' in window) || !text) {
        const delay = Math.max(1500, text.length * 150 / rate);
        this.fallbackTimer = setTimeout(() => { onEnd?.(); resolve(); }, delay);
        return;
      }

      const utt = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utt;
      utt.lang = 'ja-JP';
      utt.rate = rate;
      utt.volume = 1.0;

      const jaVoices = this._voices.filter(v => v.lang.includes('ja'));
      if (speaker === 'B') {
        utt.voice = jaVoices.find(v => v.name.includes('Nanami') || v.name.includes('Female')) || jaVoices[0];
        utt.pitch = 1.3;
      } else {
        utt.voice = jaVoices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Kyoko')) || jaVoices[0];
        utt.pitch = 1.05;
      }

      utt.onend = () => {
        clearTimeout(this.fallbackTimer);
        onEnd?.();
        resolve();
      };
      utt.onerror = (e) => {
        clearTimeout(this.fallbackTimer);
        onError?.(e);
        resolve();
      };

      window.speechSynthesis.speak(utt);

      // 既存の v4.24.0 由来のセーフティタイマー（ブラウザバグ対策）
      const maxDelay = Math.max(3000, (text.length * 280) / rate) + 1000;
      this.fallbackTimer = setTimeout(() => {
        if (this.currentUtterance) {
          this.currentUtterance.onend = null;
          this.currentUtterance.onerror = null;
        }
        window.speechSynthesis.cancel();
        onEnd?.();
        resolve();
      }, maxDelay);
    });
  }

  stop() {
    clearTimeout(this.fallbackTimer);
    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  async pregenerate() {
    return { generated: 0, cached: 0, errors: 0, costUsd: 0 };
  }
}

// ============================================================================
// GeminiAdapter: Gemini 3.1 Flash TTS（本番層）
// ============================================================================
export class GeminiAdapter {
  constructor() {
    this.name = 'gemini';
    this.label = 'Gemini 3.1 Flash TTS (本番)';
    this.currentAudio = null;
    this.fallbackTimer = null;
    this._audioCtx = null;
    this._totalCostUsd = 0;
  }

  _getAudioCtx() {
    if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this._audioCtx;
  }

  async _fetchFromGAS(text, speaker) {
    if (!GAS_CONFIG.endpoint) throw new Error('GAS endpoint not configured');
    const response = await fetch(GAS_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'tts',
        token: GAS_CONFIG.authToken,
        text,
        speaker,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GAS error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    if (!data.audioBase64) throw new Error('No audio data returned from GAS');
    this._totalCostUsd += data.estimatedCostUsd || 0;
    return data;
  }

  async _getOrGenerate(text, speaker) {
    const cached = await getCachedAudio(speaker, text);
    if (cached) return { blob: cached, wasCached: true, costUsd: 0 };

    const data = await this._fetchFromGAS(text, speaker);
    const pcmBytes = base64ToBytes(data.audioBase64);
    const wavBlob = pcmToWav(pcmBytes, data.sampleRate || 24000);
    await saveCachedAudio(speaker, text, wavBlob);
    return { blob: wavBlob, wasCached: false, costUsd: data.estimatedCostUsd || 0 };
  }

  /**
   * 次のscriptの音声を事前生成してキャッシュに入れる (speak時のレイテンシ削減)
   * キャッシュ済みなら何もしない。エラーは握りつぶす (prefetchは best effort)
   */
  async prefetch(text, speaker) {
    if (!text) return;
    try {
      await this._getOrGenerate(text, speaker);
    } catch (e) {
      // ignore
    }
  }

  speak(text, speaker, opts = {}) {
    return new Promise(async (resolve) => {
      const { rate = 1.0, onEnd, onError } = opts;
      this.stop();

      try {
        const { blob } = await this._getOrGenerate(text, speaker);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.playbackRate = rate;
        this.currentAudio = audio;

        // mixer の voiceGain に接続 (録画キャプチャ経路に乗せる)
        // 注意: createMediaElementSource は要素1つにつき1回しか呼べないので、audio要素は毎回新規
        try {
          const { getMixer } = await import('./mixer.js');
          const mixer = getMixer();
          mixer._ensureContext();
          const srcNode = mixer.ctx.createMediaElementSource(audio);
          srcNode.connect(mixer.voiceGain);
        } catch (e) {
          console.warn('TTS audio mixer routing failed, using direct playback:', e);
        }

        audio.onended = () => {
          URL.revokeObjectURL(url);
          clearTimeout(this.fallbackTimer);
          onEnd?.();
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(url);
          clearTimeout(this.fallbackTimer);
          onError?.(e);
          resolve();
        };
        await audio.play();

        // Gemini TTS もWeb Speechと同じセーフティネットを敷く
        const estimatedSec = text.length * 0.15 / rate;
        this.fallbackTimer = setTimeout(() => {
          audio.onended = null;
          audio.onerror = null;
          audio.pause();
          URL.revokeObjectURL(url);
          onEnd?.();
          resolve();
        }, (estimatedSec * 1000) + 3000);
      } catch (err) {
        console.error('GeminiAdapter.speak error:', err);
        onError?.(err);
        resolve();
      }
    });
  }

  stop() {
    clearTimeout(this.fallbackTimer);
    if (this.currentAudio) {
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      try { this.currentAudio.pause(); } catch (e) {}
      this.currentAudio = null;
    }
  }

  async pregenerate(scripts, onProgress) {
    let generated = 0, cached = 0, errors = 0, costUsd = 0;
    for (let i = 0; i < scripts.length; i++) {
      const s = scripts[i];
      const text = s.speech || s.text;
      const speaker = s.speaker || 'A';
      if (!text) continue;
      try {
        const result = await this._getOrGenerate(text, speaker);
        if (result.wasCached) cached++;
        else { generated++; costUsd += result.costUsd; }
        onProgress?.({ current: i + 1, total: scripts.length, generated, cached, errors, costUsd });
      } catch (err) {
        console.error('pregenerate failed for script', s.id, err);
        errors++;
        onProgress?.({ current: i + 1, total: scripts.length, generated, cached, errors, costUsd });
      }
    }
    return { generated, cached, errors, costUsd };
  }

  getTotalCostUsd() {
    return this._totalCostUsd;
  }

  resetCostCounter() {
    this._totalCostUsd = 0;
  }
}

// ============================================================================
// アダプタファクトリ
// ============================================================================
let _adapters = null;

export function getAdapters() {
  if (!_adapters) {
    _adapters = {
      web_speech: new WebSpeechAdapter(),
      gemini: new GeminiAdapter(),
    };
  }
  return _adapters;
}

export function getAdapter(engineName) {
  return getAdapters()[engineName] || getAdapters().web_speech;
}
