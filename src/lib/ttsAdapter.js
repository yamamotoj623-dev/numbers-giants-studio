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
import { groupBySpeaker } from './scriptGrouping';

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

// blob を data URL に変換 (Android 画面録画対応のため)
// blob: URL は短時間 PCM バッファとして扱われ、Pixel の画面録画でキャプチャされない場合がある。
// data URL ならインラインデータとして扱われ、メディア音として認識されやすい。
async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
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

    // this._currentSource = null;       // 現在再生中の AudioBufferSourceNode
    this._decodedCache = new Map();   // (speaker:text) → AudioBuffer (decode 済み)
    this._DECODE_CACHE_MAX = 12;      // メモリリーク防止: 最大12件保持 (LRU)
    this._unlocked = false;           // AudioContext がユーザー操作で resume 済みか

    // 共有 audio 要素 (永続的に DOM に存在)
    // 動的に new Audio() で作って即削除すると Pixel 画面録画でキャプチャされないため、
    // 1つの audio 要素を最初に DOM に attach し、src を切り替えて再利用する。
    this._sharedAudio = null;

    // pregenerate の進捗 state を adapter インスタンス (singleton) に保持。
    // TTSPanel は条件レンダリング ({activeTab === 'tts' && <TTSPanel/>}) でタブ切替時に完全アンマウントされ、
    // React state が破棄されるが、pregenerate 内の Promise.all は走り続け、IndexedDB へのキャッシュ保存も継続する。
    // しかし TTSPanel 再マウント時に進捗を復元する手段がないため、ユーザーには「止まった」ように見えていた。
    // この state を持つことで、TTSPanel が再マウント時に初期値として読み取り、進捗バー・ステータスを復元できる。
    this._pregenState = {
      isGenerating: false,
      progress: { current: 0, total: 0, generated: 0, cached: 0, errors: 0, costUsd: 0, fallbackCount: 0, fallbackIds: [], failedIds: [] },
      lastResult: null,    // 完了時の最終結果 (null = 未完了 or 未実行)
      startedAt: null,
    };
    // 進捗購読リスナー (TTSPanel が再マウント時に subscribe → unmount 時に unsubscribe)
    this._pregenListeners = new Set();
  }

  // 進捗購読 API — TTSPanel が useEffect で subscribe / unsubscribe する
  subscribePregenState(listener) {
    this._pregenListeners.add(listener);
    // 即時に現状を渡す (再マウント時の復元用)
    listener(this._pregenState);
    return () => this._pregenListeners.delete(listener);
  }

  _emitPregenState() {
    for (const l of this._pregenListeners) {
      try { l(this._pregenState); } catch (e) { /* 個別 listener のエラーは伝搬させない */ }
    }
  }

  /**
   * 共有 <video> 要素を取得 (なければ作って DOM に attach)
   *
   * 【なぜ <video> 要素を使うか】
   * v5.14.5 で <audio> 要素を DOM 永続化したが、ユーザー診断ログで
   * 「audio は完璧な状態 (inDom=true, paused=false, ready=4) なのに録画されない」
   * ことが判明。
   *
   * 真の原因: Pixel/Android の内部音声録画は AUDIO_USAGE_MEDIA フラグの音だけキャプチャする。
   * Chrome の HTMLAudioElement は短時間音声を USAGE_GAME 等で再生する場合があり、
   * 録画キャプチャから漏れる。
   * <video> 要素は確実に AUDIO_USAGE_MEDIA で再生されるため録画される。
   * (Chrome は audio/wav data URL を <video> 要素でも受け付ける)
   *
   * 確認情報: Web Speech API (下書き) は OS の TTS engine 経由で必ず MEDIA usage、
   * これは録画される ← この事実が「audio 要素じゃダメ、media element としての強さが足りない」
   * の証拠になっている。
   */
  _getSharedAudio() {
    // 名前は _getSharedAudio のままだが、中身は <video> (互換性のため)
    if (this._sharedAudio && document.body.contains(this._sharedAudio)) {
      return this._sharedAudio;
    }
    // ★<video> 要素★ に変更 (audio 要素から)
    const el = document.createElement('video');
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.muted = false;
    el.id = 'tts-voice-video-shared';
    // 1px 可視 (録画キャプチャされやすい)
    el.style.position = 'fixed';
    el.style.bottom = '0';
    el.style.right = '0';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.opacity = '0.01';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '-9999';
    el.style.background = '#000';
    document.body.appendChild(el);

    // ★MediaSession API: 「これはメディア再生」と OS に明示★
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: '数字で見るG党 Studio',
          artist: 'TTS Voice',
          album: 'Numbers Giants',
        });
        navigator.mediaSession.setActionHandler('play', () => {});
        navigator.mediaSession.setActionHandler('pause', () => {});
      }
    } catch (e) {}

    this._sharedAudio = el;
    return el;
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
   * HTMLMediaElement の autoplay policy unlock も追加。
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

    // 2. HTMLMediaElement unlock
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
      // usedFallback: !!data.usedFallback,
      modelUsed: data.modelUsed || 'gemini-3.1-flash-tts-preview',
      // APIキーローテーション情報を伝達
      usedKeyIndex: typeof data.usedKeyIndex === 'number' ? data.usedKeyIndex : 0,
      keysAvailable: data.keysAvailable || 1,
    };
  }

  /**
   * 次のscriptの音声を事前生成してキャッシュに入れる (speak時のレイテンシ削減)
   * キャッシュ済みなら何もしない。エラーは握りつぶす (prefetchは best effort)
   *
   * HTMLAudioElement に戻したため、blob を IndexedDB キャッシュに保存しておくだけで OK。
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
        // 共有 audio 要素を再利用 (動的生成→即削除をやめる)
        // Pixel 画面録画は「動的生成・短時間で削除される audio」をキャプチャしない可能性が高い。
        // 永続的に DOM に存在する audio 要素の src を切り替える方式に変更。
        const { blob } = await this._getOrGenerate(fixedText, speaker);
        const dataUrl = await blobToDataUrl(blob);

        const audio = this._getSharedAudio();
        // 前の再生があれば停止 (cleanup)
        try { audio.pause(); } catch (e) {}

        // 全 listener をクリア
        audio.onended = null;
        audio.onerror = null;

        audio.src = dataUrl;
        // Firefox 対策: 同じ audio 要素に同一 src(キャッシュデータURL)を再設定した際、
        // pause() 後の状態(currentTime が再生終了点)と readyState がリセットされず、
        // l531 の `readyState >= 3` 判定で即 startPlayback に入って onended が即発火 → 無音化する。
        // 明示的に load() を呼び readyState を 0 に戻して、canplay 待ちパスに乗せる。
        try { audio.load(); } catch (e) {}

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
          // 共有要素なので DOM remove はしない
          // src だけクリアしておく (次の speak で上書きされる)
          if (this.currentAudio === audio) this.currentAudio = null;
          // Media Session を paused に
          try {
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'paused';
            }
          } catch (e) {}
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

        // 即時再生
        const startPlayback = async () => {
          try {
            // play() 直前に rate と preservesPitch を設定
            audio.playbackRate = rate;
            audio.preservesPitch = true;
            audio.mozPreservesPitch = true;
            audio.webkitPreservesPitch = true;
            audio.muted = false;  // 念のため muted=false 確認
            // Media Session に playing 状態を伝える
            try {
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }
            } catch (e) {}
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

        // fallback timer
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

  // レガシー _speakLegacyHtmlAudio は削除 (上の speak() 本体が同等の実装に)

  stop() {
    clearTimeout(this.fallbackTimer);
    // // AudioBufferSourceNode は使わなくなったが、念のため残骸を停止
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
      // 共有 audio 要素は DOM remove しない (永続的に保持)
      // currentAudio 参照だけクリア
      this.currentAudio = null;
    }
  }

  /**
   * scripts を**グループ単位**で一括事前生成
   *
   * 旧 (v5.18.2): 個別 script 単位で TTS API を叩いていたため、
   *   アプリ再生時のグループキャッシュキーと不一致 → 二重生成 + 「未生成」誤判定
   * 新: groupBySpeaker でグループ化し、joinedSpeech で 1 API コール
   *   アプリ再生時と完全に同じキャッシュキーで保存される
   *
   * @param {Array} scripts - 生成対象の script 配列
   * @param {Function} onProgress - 進捗コールバック
   * @param {Object} options - { concurrency: 並列数 (デフォルト 2) }
   */
  async pregenerate(scripts, onProgress, options = {}) {
    const concurrency = options.concurrency ?? 2;
    let generated = 0, cached = 0, errors = 0, costUsd = 0, completed = 0;
    let fallbackCount = 0;
    const failedIds = [];
    const fallbackIds = [];

    // ★グループ単位に変換★
    const groups = groupBySpeaker(scripts);
    const totalGroups = groups.length;

    // adapter インスタンスに進捗 state を持たせる (TTSPanel 再マウント時に復元するため)
    this._pregenState = {
      isGenerating: true,
      progress: { current: 0, total: totalGroups, generated: 0, cached: 0, errors: 0, costUsd: 0, fallbackCount: 0, fallbackIds: [], failedIds: [] },
      lastResult: null,
      startedAt: Date.now(),
    };
    this._emitPregenState();

    // 1グループ処理 (並列ワーカー)
    const processGroup = async (g) => {
      const text = applyYomigana(g.joinedSpeech);
      if (!text) {
        completed++;
        return;
      }
      try {
        const result = await this._getOrGenerate(text, g.speaker);
        if (result.wasCached) cached++;
        else { generated++; costUsd += result.costUsd; }

        if (result.usedFallback) {
          fallbackCount++;
          // グループに属する全 id を fallback リストに追加
          for (const s of g.scripts) fallbackIds.push(s.id);
        }
      } catch (err) {
        console.error('pregenerate failed for group startIdx=' + g.startIdx, err);
        errors++;
        // グループに属する全 id を failedIds に追加
        for (const s of g.scripts) failedIds.push(s.id);
      } finally {
        completed++;
        const progressSnapshot = {
          current: completed,
          total: totalGroups,
          generated, cached, errors, costUsd,
          failedIds: [...failedIds],
          fallbackCount,
          fallbackIds: [...fallbackIds],
        };
        // adapter state も更新 → 全 subscriber に通知
        this._pregenState = { ...this._pregenState, progress: progressSnapshot };
        this._emitPregenState();
        // 既存の onProgress callback (アンマウント済み TTSPanel の setState は React が discard するが、生成は止まらない)
        onProgress?.(progressSnapshot);
      }
    };

    // グループ単位で並列実行
    for (let i = 0; i < groups.length; i += concurrency) {
      const chunk = groups.slice(i, i + concurrency);
      await Promise.all(chunk.map(processGroup));
    }

    const finalResult = { generated, cached, errors, costUsd, failedIds, fallbackCount, fallbackIds };
    // 完了時の最終結果も保持 (再マウント時に「完了済み」として表示するため)
    this._pregenState = {
      isGenerating: false,
      progress: this._pregenState.progress,
      lastResult: finalResult,
      startedAt: this._pregenState.startedAt,
    };
    this._emitPregenState();

    return finalResult;
  }

  /**
   * scripts のうち、まだキャッシュに無いグループを **グループ単位** で返す
   *
   * 旧 (v5.18.2): 個別 script ごとにキャッシュチェック → アプリ再生時のグループキー
   *   と一致せず、「実は生成済みなのに未生成」と誤判定するバグがあった。
   *
   * 新: groupBySpeaker で結合した joinedSpeech をキャッシュキーにしてチェック。
   *   アプリ再生時と完全に同じキー戦略になる。
   *
   * @returns {Promise<Array<{id, speaker, text, reason}>>}
   *   グループに属する各 script を id 単位で返す (UI 表示は id 単位なので)。
   *   グループのキャッシュが無い場合、そのグループの全 script が「未生成」扱い。
   */
  async findMissing(scripts) {
    const groups = groupBySpeaker(scripts);

    // 各グループ単位でキャッシュチェック (並列)
    const checks = groups.map(async (g) => {
      const fixedText = applyYomigana(g.joinedSpeech);
      if (!fixedText) {
        return { groupCached: false, group: g, reason: 'グループのテキストが空' };
      }
      try {
        const cached = await getCachedAudio(g.speaker, fixedText);
        return { groupCached: !!cached, group: g, reason: cached ? null : 'キャッシュ未生成' };
      } catch (err) {
        return { groupCached: false, group: g, reason: 'キャッシュ確認エラー: ' + err.message };
      }
    });

    const results = await Promise.all(checks);

    // 未生成グループの全 script を平坦化して返す (UI 互換のため id 単位の出力)
    const missing = [];
    for (const r of results) {
      if (r.groupCached) continue;
      for (const s of r.group.scripts) {
        const rawText = s.speech || s.text || '';
        missing.push({
          id: s.id,
          speaker: r.group.speaker,
          text: rawText,
          reason: r.reason,
        });
      }
    }
    return missing.sort((a, b) => a.id - b.id);
  }

  /**
   * 指定された script id を含むグループだけを再生成
   *
   * 旧 (v5.18.2): 個別 script で再生成 → 別キャッシュキーに保存され
   *   アプリ再生時にキャッシュヒットしないバグがあった。
   * 新: targetIds を含むグループを特定して、グループ単位で再生成。
   *
   * @param {Array} scripts 全 scripts (id ベースで参照)
   * @param {Array<number>} targetIds 再生成したい script の id 配列
   * @param {Function} onProgress 進捗コールバック
   * @param {Object} options { concurrency: 並列数 (デフォルト 2) }
   * @returns {Promise<{generated, errors, costUsd, failedIds}>}
   */
  async pregenerateOnly(scripts, targetIds, onProgress, options = {}) {
    const concurrency = options.concurrency ?? 2;
    const targetIdSet = new Set(targetIds);

    // targetIds を含むグループを抽出 (重複なし)
    const allGroups = groupBySpeaker(scripts);
    const targetGroups = allGroups.filter(g =>
      g.scripts.some(s => targetIdSet.has(s.id))
    );

    let generated = 0, errors = 0, costUsd = 0, completed = 0;
    const failedIds = [];

    const processGroup = async (g) => {
      const text = applyYomigana(g.joinedSpeech);
      if (!text) {
        errors++;
        for (const s of g.scripts) failedIds.push(s.id);
        completed++;
        onProgress?.({ current: completed, total: targetGroups.length, generated, errors, costUsd, failedIds: [...failedIds] });
        return;
      }
      try {
        // キャッシュは無視して強制的に生成する
        const data = await this._fetchFromGAS(text, g.speaker);
        const pcmBytes = base64ToBytes(data.audioBase64);
        const wavBlob = pcmToWav(pcmBytes, data.sampleRate || 24000);
        await saveCachedAudio(g.speaker, text, wavBlob);
        generated++;
        costUsd += data.estimatedCostUsd || 0;
      } catch (err) {
        console.error('pregenerateOnly failed for group startIdx=' + g.startIdx, err);
        errors++;
        for (const s of g.scripts) failedIds.push(s.id);
      } finally {
        completed++;
        onProgress?.({ current: completed, total: targetGroups.length, generated, errors, costUsd, failedIds: [...failedIds] });
      }
    };

    // ★並列化★ グループ単位で
    for (let i = 0; i < targetGroups.length; i += concurrency) {
      const chunk = targetGroups.slice(i, i + concurrency);
      await Promise.all(chunk.map(processGroup));
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
