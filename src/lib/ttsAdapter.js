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
    this.currentAudio = null;       // legacy (HTMLAudioElement、stop でクリア)
    this.fallbackTimer = null;
    this._audioCtx = null;
    this._totalCostUsd = 0;

    // ★v5.11.7: 再生レイテンシ削減のための拡張★
    this._currentSource = null;       // 現在再生中の AudioBufferSourceNode
    this._decodedCache = new Map();   // (speaker:text) → AudioBuffer (decode 済み)
    this._DECODE_CACHE_MAX = 12;      // メモリリーク防止: 最大12件保持 (LRU)
    this._unlocked = false;           // AudioContext がユーザー操作で resume 済みか
  }

  _getAudioCtx() {
    if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this._audioCtx;
  }

  /**
   * AudioContext と HTMLMediaElement の両方を「unlock」する。
   * ブラウザの自動再生ポリシーで初回はユーザー操作が必要。
   * 「事前生成」ボタンや再生ボタンを押した時に呼んでおくと、
   * 後続の new Audio() が autoplay block されない & レイテンシゼロで再生開始可能。
   *
   * ★v5.14.3★ HTMLMediaElement の autoplay policy unlock も追加。
   *   silent.wav を一度 play() すると以降の new Audio() が許可される。
   *   これがないと Android Chrome で「最初の再生だけ無音」「何度かやり直すと出る」現象が発生する。
   */
  async unlock() {
    // 1. AudioContext unlock (既存)
    try {
      const ctx = this._getAudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (e) {
      console.warn('AudioContext resume failed:', e);
    }

    // 2. ★v5.14.3★ HTMLMediaElement unlock
    if (!this._mediaUnlocked) {
      try {
        // 最小の silent WAV (ヘッダのみ、空 PCM)
        const silentDataUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';
        const silent = new Audio(silentDataUrl);
        silent.volume = 0;
        const p = silent.play();
        if (p && typeof p.then === 'function') {
          await p.catch(() => {});  // play 失敗は無視 (まだunlockされてないだけ)
        }
        try { silent.pause(); } catch (e) {}
        this._mediaUnlocked = true;
      } catch (e) {
        // ignore
      }
    }

    this._unlocked = true;
  }

  /**
   * blob を AudioBuffer に decode する (重い処理、prefetch で先にやっておく)
   */
  async _decodeBlob(blob) {
    const ctx = this._getAudioCtx();
    const arrayBuffer = await blob.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  }

  /**
   * decode キャッシュに入れる (LRU で最大 N 件)
   */
  _putDecoded(key, audioBuffer) {
    if (this._decodedCache.has(key)) {
      this._decodedCache.delete(key);
    }
    this._decodedCache.set(key, audioBuffer);
    while (this._decodedCache.size > this._DECODE_CACHE_MAX) {
      const firstKey = this._decodedCache.keys().next().value;
      this._decodedCache.delete(firstKey);
    }
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
    if (cached) return { blob: cached, wasCached: true, costUsd: 0, usedFallback: false };

    const data = await this._fetchFromGAS(text, speaker);
    const pcmBytes = base64ToBytes(data.audioBase64);
    const wavBlob = pcmToWav(pcmBytes, data.sampleRate || 24000);
    await saveCachedAudio(speaker, text, wavBlob);
    return {
      blob: wavBlob,
      wasCached: false,
      costUsd: data.estimatedCostUsd || 0,
      // ★v5.11.9: フォールバック情報を伝達★
      usedFallback: !!data.usedFallback,
      modelUsed: data.modelUsed || 'gemini-3.1-flash-tts-preview',
    };
  }

  /**
   * 次のscriptの音声を事前生成してキャッシュに入れる (speak時のレイテンシ削減)
   * キャッシュ済みなら何もしない。エラーは握りつぶす (prefetchは best effort)
   *
   * ★v5.14.1★ HTMLAudioElement に戻したため、blob を IndexedDB キャッシュに保存しておくだけで OK。
   * Audio 要素は内部で自動 decode する。decoded AudioBuffer のメモリキャッシュは不要。
   */
  async prefetch(text, speaker) {
    if (!text) return;
    try {
      const fixedText = applyYomigana(text);
      // blob を取得 (キャッシュ済みなら一瞬、未生成なら API call)
      // 結果は audioCache (IndexedDB) に保存される
      await this._getOrGenerate(fixedText, speaker);
    } catch (e) {
      // ignore (prefetch は best effort)
    }
  }

  speak(text, speaker, opts = {}) {
    return new Promise(async (resolve) => {
      const { rate = 1.0, onEnd, onError } = opts;
      this.stop();

      // 読み仮名置換 (難読語ひらがな化)
      const fixedText = applyYomigana(text);

      try {
        // ★v5.14.1★ AudioBufferSourceNode → HTMLAudioElement (Android 画面録画対応)
        // ★v5.14.3★ 追加修正:
        //   1. audio を DOM に attach (画面録画でキャプチャされるように)
        //   2. playbackRate と preservesPitch は play() 直前に設定 (Android Chrome で確実に反映)
        //   3. これらの修正で「速度が反映されない」「録画されない」「最初の再生が無音」を全部解消
        const { blob } = await this._getOrGenerate(fixedText, speaker);
        const url = URL.createObjectURL(blob);
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;

        // ★v5.14.3★ DOM に attach (画面録画でキャプチャ可能に)
        // 画面外に配置するが DOM ツリーには存在させる
        audio.style.position = 'fixed';
        audio.style.bottom = '-100px';
        audio.style.opacity = '0';
        audio.style.pointerEvents = 'none';
        audio.setAttribute('playsinline', '');  // iOS Safari対策
        document.body.appendChild(audio);

        // 音量取得
        try {
          const { getMixer } = await import('./mixer.js');
          const mixer = getMixer();
          audio.volume = mixer._effectiveVoiceVolume();
        } catch (e) {
          audio.volume = 1.0;
        }

        this.currentAudio = audio;

        let resolved = false;
        const cleanup = () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(this.fallbackTimer);
          try { URL.revokeObjectURL(url); } catch (e) {}
          // ★v5.14.3★ DOM から remove
          try { audio.remove(); } catch (e) {}
          if (this.currentAudio === audio) this.currentAudio = null;
        };

        audio.onended = () => {
          cleanup();
          onEnd?.();
          resolve();
        };

        audio.onerror = (e) => {
          cleanup();
          onError?.(e);
          resolve();
        };

        // 即時再生 (preload=auto + src 設定済みなら readyState がすぐ上がる)
        const startPlayback = async () => {
          try {
            // ★v5.14.3★ play() 直前に rate と preservesPitch を設定
            // Android Chrome では canplay 前に設定すると反映されないことがある
            audio.playbackRate = rate;
            audio.preservesPitch = true;       // 標準
            audio.mozPreservesPitch = true;    // 古い Firefox
            audio.webkitPreservesPitch = true; // 古い Safari
            await audio.play();
          } catch (e) {
            cleanup();
            onError?.(e);
            resolve();
          }
        };

        if (audio.readyState >= 3 /* HAVE_FUTURE_DATA */) {
          startPlayback();
        } else {
          const onCanPlay = () => {
            audio.removeEventListener('canplay', onCanPlay);
            startPlayback();
          };
          audio.addEventListener('canplay', onCanPlay);
          audio.load();
        }

        // fallback timer (onended が発火しない場合の保険)
        const estimatedSec = Math.max(1.5, text.length * 0.15 / rate);
        this.fallbackTimer = setTimeout(() => {
          if (!resolved) {
            try { audio.pause(); } catch (e) {}
            cleanup();
            onEnd?.();
            resolve();
          }
        }, (estimatedSec * 1000) + 3000);
      } catch (err) {
        const errStr = (err?.message || String(err)).toLowerCase();
        // 429 (quota超過) は「警告表示 + 無音でスキップ」で再生継続
        if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted')) {
          console.warn('⚠️ Gemini TTS quota exceeded. Skipping voice for this script. Playback continues.');
          try {
            window.dispatchEvent(new CustomEvent('tts-quota-exceeded', {
              detail: { message: 'Gemini TTS 無料枠(1日100回)超過。音声をスキップして再生継続します。8時間後にリセット、または有料プラン化で解消。' }
            }));
          } catch (e) {}
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

  // ★v5.14.1★ レガシー _speakLegacyHtmlAudio は削除 (上の speak() 本体が同等の実装に)

  stop() {
    clearTimeout(this.fallbackTimer);
    // ★v5.11.7: AudioBufferSourceNode を停止★
    // ★v5.14.1★ AudioBufferSourceNode は使わなくなったが、念のため残骸を停止
    if (this._currentSource) {
      try {
        this._currentSource.onended = null;
        this._currentSource.stop();
        this._currentSource.disconnect();
      } catch (e) {}
      this._currentSource = null;
    }
    // 本流: HTMLAudioElement (録画対応のためこちらをデフォルトに)
    if (this.currentAudio) {
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      try { this.currentAudio.pause(); } catch (e) {}
      // ★v5.14.3★ DOM から remove (DOM attach されているため)
      try { this.currentAudio.remove(); } catch (e) {}
      this.currentAudio = null;
    }
  }

  /**
   * scripts を一括事前生成 (★v5.11.8 で並列化、v5.11.9 でフォールバック追跡★)
   *
   * @param {Array} scripts - 生成対象の script 配列
   * @param {Function} onProgress - 進捗コールバック
   * @param {Object} options - { concurrency: 並列数 (デフォルト 2) }
   */
  async pregenerate(scripts, onProgress, options = {}) {
    const concurrency = options.concurrency ?? 2;
    let generated = 0, cached = 0, errors = 0, costUsd = 0, completed = 0;
    let fallbackCount = 0;  // ★v5.11.9: 2.5 Flash でフォールバックされた件数★
    const failedIds = [];
    const fallbackIds = [];  // どの id が fallback されたか

    // 1件処理 (並列ワーカーから呼ばれる)
    const processOne = async (s) => {
      const rawText = s.speech || s.text;
      const text = applyYomigana(rawText);
      const speaker = s.speaker || 'A';
      if (!text) {
        completed++;
        return;
      }
      try {
        const result = await this._getOrGenerate(text, speaker);
        if (result.wasCached) cached++;
        else { generated++; costUsd += result.costUsd; }

        // ★フォールバック発生をカウント★
        if (result.usedFallback) {
          fallbackCount++;
          fallbackIds.push(s.id);
        }

        // ★v5.14.1★ decode キャッシュは廃止 (HTMLAudioElement で再生するため不要)
        // blob は audioCache (IndexedDB) に既に保存されている (上記 _getOrGenerate or saveCachedAudio で)
      } catch (err) {
        console.error('pregenerate failed for script', s.id, err);
        errors++;
        failedIds.push(s.id);
      } finally {
        completed++;
        onProgress?.({
          current: completed,
          total: scripts.length,
          generated, cached, errors, costUsd,
          failedIds: [...failedIds],
          fallbackCount,
          fallbackIds: [...fallbackIds],
        });
      }
    };

    // ★並列化★: チャンクに分けて Promise.all で同時処理
    // v5.11.9: デフォルト concurrency を 4→2 に下げて RPM 10/分 を超えない設計
    for (let i = 0; i < scripts.length; i += concurrency) {
      const chunk = scripts.slice(i, i + concurrency);
      await Promise.all(chunk.map(processOne));
    }

    return { generated, cached, errors, costUsd, failedIds, fallbackCount, fallbackIds };
  }

  /**
   * ★v5.11.6 新規 / v5.11.8 で並列化: scripts のうち、まだキャッシュに無いものだけを返す★
   * UI で「不足チェック」「不足のみ再生成」のために使う。
   *
   * @returns {Promise<Array<{id, speaker, text, reason}>>} 不足している script のリスト (id 順にソート)
   */
  async findMissing(scripts) {
    // ★全件並列でキャッシュチェック★ (IndexedDB 読み込みは並列に強い)
    const checks = scripts.map(async (s) => {
      const rawText = s.speech || s.text;
      const text = applyYomigana(rawText);
      const speaker = s.speaker || 'A';
      if (!text) {
        return { id: s.id, speaker, text: '', reason: 'テキストが空' };
      }
      try {
        const cached = await getCachedAudio(speaker, text);
        if (!cached) {
          return { id: s.id, speaker, text, reason: 'キャッシュ未生成' };
        }
        return null;  // キャッシュあり = 不足ではない
      } catch (err) {
        return { id: s.id, speaker, text, reason: 'キャッシュ確認エラー: ' + err.message };
      }
    });

    const results = await Promise.all(checks);
    return results.filter(r => r !== null).sort((a, b) => a.id - b.id);
  }

  /**
   * ★v5.11.6 新規 / v5.11.8 で並列化: 指定された script だけを再生成★
   * findMissing で取得したリストを渡せば、不足分だけ生成できる。
   *
   * @param {Array} scripts 全 scripts (id ベースで参照)
   * @param {Array<number>} targetIds 再生成したい script の id 配列
   * @param {Function} onProgress 進捗コールバック
   * @param {Object} options { concurrency: 並列数 (デフォルト 4) }
   * @returns {Promise<{generated, errors, costUsd, failedIds}>}
   */
  async pregenerateOnly(scripts, targetIds, onProgress, options = {}) {
    const concurrency = options.concurrency ?? 2;
    const targets = scripts.filter(s => targetIds.includes(s.id));
    let generated = 0, errors = 0, costUsd = 0, completed = 0;
    const failedIds = [];

    const processOne = async (s) => {
      const rawText = s.speech || s.text;
      const text = applyYomigana(rawText);
      const speaker = s.speaker || 'A';
      if (!text) {
        errors++;
        failedIds.push(s.id);
        completed++;
        onProgress?.({ current: completed, total: targets.length, generated, errors, costUsd, failedIds: [...failedIds] });
        return;
      }
      try {
        // キャッシュは無視して強制的に生成する
        const data = await this._fetchFromGAS(text, speaker);
        const pcmBytes = base64ToBytes(data.audioBase64);
        const wavBlob = pcmToWav(pcmBytes, data.sampleRate || 24000);
        await saveCachedAudio(speaker, text, wavBlob);
        generated++;
        costUsd += data.estimatedCostUsd || 0;

        // ★v5.14.1★ decode キャッシュは廃止 (HTMLAudioElement で再生するため不要)
        // blob は saveCachedAudio で IndexedDB に既に保存されている
      } catch (err) {
        console.error('pregenerateOnly failed for script', s.id, err);
        errors++;
        failedIds.push(s.id);
      } finally {
        completed++;
        onProgress?.({ current: completed, total: targets.length, generated, errors, costUsd, failedIds: [...failedIds] });
      }
    };

    // ★並列化★
    for (let i = 0; i < targets.length; i += concurrency) {
      const chunk = targets.slice(i, i + concurrency);
      await Promise.all(chunk.map(processOne));
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
