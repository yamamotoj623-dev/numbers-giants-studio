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
import { applyYomigana } from './yomigana';

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

      // 読み仮名置換 (難読語ひらがな化)
      const fixedText = applyYomigana(text);

      if (!('speechSynthesis' in window) || !fixedText) {
        const delay = Math.max(1500, fixedText.length * 150 / rate);
        this.fallbackTimer = setTimeout(() => { onEnd?.(); resolve(); }, delay);
        return;
      }

      const utt = new SpeechSynthesisUtterance(fixedText);
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
        clearInterval(this._chromeBugKeepAlive);
        onEnd?.();
        resolve();
      };
      utt.onerror = (e) => {
        clearTimeout(this.fallbackTimer);
        clearInterval(this._chromeBugKeepAlive);
        onError?.(e);
        resolve();
      };

      window.speechSynthesis.speak(utt);

      // ★ Chrome 15秒バグ対策: 14秒おきに pause→resume で speechSynthesis を活性化
      // (Chromeは長文speakで内部タイマーが切れて発話停止する既知バグ、業界標準ワークアラウンド)
      this._chromeBugKeepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      // セーフティタイマー: 長文連結にも耐えるよう余裕を大きく
      // 日本語で 1文字 ≈ 280ms の発話、rateで割る。これに加え+5秒余裕
      const maxDelay = Math.max(5000, (text.length * 400) / rate) + 5000;
      this.fallbackTimer = setTimeout(() => {
        if (this.currentUtterance) {
          this.currentUtterance.onend = null;
          this.currentUtterance.onerror = null;
        }
        clearInterval(this._chromeBugKeepAlive);
        window.speechSynthesis.cancel();
        onEnd?.();
        resolve();
      }, maxDelay);
    });
  }

  stop() {
    clearTimeout(this.fallbackTimer);
    clearInterval(this._chromeBugKeepAlive);
    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  async pregenerate() {
    return { generated: 0, cached: 0, errors: 0, costUsd: 0, failedIds: [] };
  }

  async findMissing() {
    return [];  // WebSpeech はキャッシュ概念が無いので不足なし
  }

  async pregenerateOnly() {
    return { generated: 0, errors: 0, costUsd: 0, failedIds: [] };
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
    
    // クライアント側リトライ (GAS側でも3回リトライしてるので、合計最大6回)
    // GAS側が完全失敗した時や、タイムアウト/ネットワークエラー時の保険
    const MAX_CLIENT_RETRIES = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_CLIENT_RETRIES; attempt++) {
      if (attempt > 0) {
        // 1秒, 2秒と待つ
        await new Promise(r => setTimeout(r, 1000 * attempt));
        console.warn(`TTS retry ${attempt}/${MAX_CLIENT_RETRIES} for: ${text.substring(0, 30)}...`);
      }
      
      try {
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
          lastError = new Error(`GAS error ${response.status}: ${errText.substring(0, 200)}`);
          // 4xx(認証等)はリトライしない
          // 429 は daily quota の可能性が高く、秒単位リトライでは回復しないので諦める
          if (response.status === 429 || (response.status >= 400 && response.status < 500)) {
            throw lastError;
          }
          continue; // 5xx のみリトライ
        }
        
        const data = await response.json();
        if (data.error) {
          lastError = new Error(data.error);
          // 5xx相当はリトライ
          if (data.statusCode >= 500 || data.statusCode === 429) continue;
          throw lastError;
        }
        if (!data.audioBase64) {
          lastError = new Error('No audio data returned from GAS');
          continue; // リトライ対象
        }
        
        this._totalCostUsd += data.estimatedCostUsd || 0;
        return data; // 成功
      } catch (err) {
        lastError = err;
        // ネットワークエラーもリトライ
      }
    }
    
    throw lastError || new Error('TTS failed after all retries');
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

      // 読み仮名置換 (難読語ひらがな化)
      const fixedText = applyYomigana(text);

      try {
        const { blob } = await this._getOrGenerate(fixedText, speaker);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.playbackRate = rate;
        try {
          const { getMixer } = await import('./mixer.js');
          const mixer = getMixer();
          audio.volume = mixer._effectiveVoiceVolume();
        } catch (e) {
          audio.volume = 1.0;
        }
        this.currentAudio = audio;

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

        // fallback timer
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
        const errStr = (err?.message || String(err)).toLowerCase();
        // 429 (quota超過) は「警告表示 + 無音でスキップ」で再生継続
        if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted')) {
          console.warn('⚠️ Gemini TTS quota exceeded. Skipping voice for this script. Playback continues.');
          // window にグローバル flag を立てて UI 側に通知
          try {
            window.dispatchEvent(new CustomEvent('tts-quota-exceeded', {
              detail: { message: 'Gemini TTS 無料枠(1日100回)超過。音声をスキップして再生継続します。8時間後にリセット、または有料プラン化で解消。' }
            }));
          } catch (e) {}
          // 推定再生時間だけ待って onEnd (無音スキップ)
          const estimatedSec = Math.max(1.5, text.length * 0.15 / rate);
          setTimeout(() => {
            onEnd?.();
            resolve();
          }, estimatedSec * 1000);
          return;
        }
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
    const failedIds = [];  // ★失敗 id を記録 (v5.11.6)
    for (let i = 0; i < scripts.length; i++) {
      const s = scripts[i];
      const rawText = s.speech || s.text;
      const text = applyYomigana(rawText);
      const speaker = s.speaker || 'A';
      if (!text) continue;
      try {
        const result = await this._getOrGenerate(text, speaker);
        if (result.wasCached) cached++;
        else { generated++; costUsd += result.costUsd; }
        onProgress?.({ current: i + 1, total: scripts.length, generated, cached, errors, costUsd, failedIds: [...failedIds] });
      } catch (err) {
        console.error('pregenerate failed for script', s.id, err);
        errors++;
        failedIds.push(s.id);
        onProgress?.({ current: i + 1, total: scripts.length, generated, cached, errors, costUsd, failedIds: [...failedIds] });
      }
    }
    return { generated, cached, errors, costUsd, failedIds };
  }

  /**
   * ★v5.11.6 新規: scripts のうち、まだキャッシュに無いものだけを返す★
   * UI で「不足チェック」「不足のみ再生成」のために使う。
   *
   * @returns {Promise<Array<{id, speaker, text, reason}>>} 不足している script のリスト
   */
  async findMissing(scripts) {
    const missing = [];
    for (const s of scripts) {
      const rawText = s.speech || s.text;
      const text = applyYomigana(rawText);
      const speaker = s.speaker || 'A';
      if (!text) {
        missing.push({ id: s.id, speaker, text: '', reason: 'テキストが空' });
        continue;
      }
      try {
        const cached = await getCachedAudio(speaker, text);
        if (!cached) {
          missing.push({ id: s.id, speaker, text, reason: 'キャッシュ未生成' });
        }
      } catch (err) {
        missing.push({ id: s.id, speaker, text, reason: 'キャッシュ確認エラー: ' + err.message });
      }
    }
    return missing;
  }

  /**
   * ★v5.11.6 新規: 指定された script だけを再生成★
   * findMissing で取得したリストを渡せば、不足分だけ生成できる。
   *
   * @param {Array} scripts 全 scripts (id ベースで参照)
   * @param {Array<number>} targetIds 再生成したい script の id 配列
   * @param {Function} onProgress 進捗コールバック
   * @returns {Promise<{generated, errors, costUsd, failedIds}>}
   */
  async pregenerateOnly(scripts, targetIds, onProgress) {
    const targets = scripts.filter(s => targetIds.includes(s.id));
    let generated = 0, errors = 0, costUsd = 0;
    const failedIds = [];

    for (let i = 0; i < targets.length; i++) {
      const s = targets[i];
      const rawText = s.speech || s.text;
      const text = applyYomigana(rawText);
      const speaker = s.speaker || 'A';
      if (!text) {
        errors++;
        failedIds.push(s.id);
        onProgress?.({ current: i + 1, total: targets.length, generated, errors, costUsd, failedIds: [...failedIds] });
        continue;
      }
      try {
        // ★キャッシュは無視して強制的に生成する★
        const data = await this._fetchFromGAS(text, speaker);
        const pcmBytes = base64ToBytes(data.audioBase64);
        const wavBlob = pcmToWav(pcmBytes, data.sampleRate || 24000);
        await saveCachedAudio(speaker, text, wavBlob);
        generated++;
        costUsd += data.estimatedCostUsd || 0;
        onProgress?.({ current: i + 1, total: targets.length, generated, errors, costUsd, failedIds: [...failedIds] });
      } catch (err) {
        console.error('pregenerateOnly failed for script', s.id, err);
        errors++;
        failedIds.push(s.id);
        onProgress?.({ current: i + 1, total: targets.length, generated, errors, costUsd, failedIds: [...failedIds] });
      }
    }
    return { generated, errors, costUsd, failedIds };
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
