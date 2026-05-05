/**
 * 再生エンジン統合フック
 * 
 * v4.24.0 の再生ループを流用しつつ、TTSAdapter経由で切替可能に。
 * SE 発火、BGM ダッキング開始/終了も連動。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAdapter } from '../lib/ttsAdapter';
import { getMixer } from '../lib/mixer';

export function usePlaybackEngine(projectData, { ttsEngine = 'web_speech', speechRate = 1.6, isVoiceEnabled = true, isSEEnabled = true, isBgmEnabled = true } = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animationKey, setAnimationKey] = useState(Date.now());

  const scripts = projectData?.scripts || [];
  const adapterRef = useRef(null);
  const mixerRef = useRef(null);

  useEffect(() => {
    adapterRef.current = getAdapter(ttsEngine);
    mixerRef.current = getMixer();
    return () => {
      adapterRef.current?.stop();
      // ★v5.20.10★ unmount時に ref タイマーもクリア (リーク防止)
      telopTimersRef.current.forEach(clearTimeout);
      telopTimersRef.current = [];
      if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current);
    };
  }, [ttsEngine]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  const playNext = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next < scripts.length) return next;
      // ★v5.18.0★ Gemini提言: smartLoop=true なら冒頭にシームレス遷移 (無限ループ)
      // 視聴維持率向上のため、末尾→冒頭への自然な繋ぎ
      if (projectData?.smartLoop) {
        // ループ前にグループトラッキングをリセット (id:0 が再度トリガーされるように)
        currentGroupRef.current = { startIdx: -1, endIdx: -1 };
        setAnimationKey(Date.now());  // hook flash 再発火用
        return 0;
      }
      // smartLoop=false: 従来通り末尾で停止
      setIsPlaying(false);
      mixerRef.current?.stopDucking();
      mixerRef.current?.stopBgm();
      return prev;
    });
  }, [scripts.length, projectData?.smartLoop]);

  // 同一speaker連続の scripts を「グループ」にまとめる
  // グループ内の最初のscriptの useEffect で、全部の speech を連結して1回 speak
  // テロップは文字数推定で順次切替
  const getSpeakerGroupInfo = useCallback((idx) => {
    const current = scripts[idx];
    if (!current) return { isGroupStart: false, groupSize: 1, groupScripts: [] };
    const prev = scripts[idx - 1];
    const sameAsPrev = prev && prev.speaker === current.speaker;
    // 前と同speakerならグループ途中 = speakは発火しない(既に呼ばれてる)
    if (sameAsPrev) return { isGroupStart: false, groupSize: 0, groupScripts: [] };
    // グループ開始: 同speakerが続くだけ集める
    const groupScripts = [current];
    for (let i = idx + 1; i < scripts.length; i++) {
      if (scripts[i].speaker === current.speaker) {
        groupScripts.push(scripts[i]);
      } else {
        break;
      }
    }
    return { isGroupStart: true, groupSize: groupScripts.length, groupScripts };
  }, [scripts]);

  // 現在進行中のグループ情報を ref で管理 (useEffect再実行でも音声停止されないよう)
  const currentGroupRef = useRef({ startIdx: -1, endIdx: -1 });
  // ★v5.20.10★ グループ内テロップ進行タイマー (currentIndex 変化で消えないよう ref で保持)
  const telopTimersRef = useRef([]);
  const absoluteTimerRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;
    const script = scripts[currentIndex];
    if (!script) return;

    const adapter = adapterRef.current;
    const mixer = mixerRef.current;
    if (!adapter) return;

    // ★v5.18.0★ 冒頭フック (id:1) で hook_impact を自動再生 (Gemini提言: 打撃音/ミット音)
    // script.se が明示指定されていなければ自動的に hook_impact を流す
    if (currentIndex === 0 && mixer && isSEEnabled && !script.se) {
      mixer.playSe('hook_impact');
    }

    if (script.se && mixer && isSEEnabled) {
      mixer.playSe(script.se);
    }

    const { isGroupStart, groupSize, groupScripts } = getSpeakerGroupInfo(currentIndex);

    // グループ途中 (前のscriptと同speaker) → 何もしない (音声継続中、テロップは親のtimerが進める)
    if (!isGroupStart) {
      return; // ★ cleanup で adapter.stop() しない
    }

    // グループ先頭: 前のグループと違うグループなら新規speak
    const groupStartIdx = currentIndex;
    const groupEndIdx = currentIndex + groupSize - 1;

    // 同じグループ先頭が既に発火済みなら二重呼び出しを防ぐ (React Strict Mode 対策)
    if (currentGroupRef.current.startIdx === groupStartIdx) {
      return;
    }
    currentGroupRef.current = { startIdx: groupStartIdx, endIdx: groupEndIdx };

    // === テロップ同期setTimeout配列 ===
    // ★v5.20.10★ ref に保存して currentIndex 変化での useEffect 再実行に消されない
    // (旧実装は cleanup で telopTimers.forEach(clearTimeout) していたため、
    //  3 連続グループの 2->3 遷移で残りのタイマーが全消去 → テロップ反映されない真因)
    const telopTimers = [];
    const charMs = ttsEngine === 'gemini' ? 160 : 150;
    const groupTotalChars = groupScripts.reduce((sum, s) => sum + (s.speech || s.text || '').length, 0) || 1;
    const groupTotalMs = groupTotalChars * charMs / speechRate;

    let cumulativeMs = 0;
    for (let i = 0; i < groupScripts.length - 1; i++) {
      const thisScript = groupScripts[i];
      const thisChars = (thisScript.speech || thisScript.text || '').length;
      cumulativeMs += (thisChars / groupTotalChars) * groupTotalMs;
      // ★v5.20.15★ 最低 800ms → 350ms に緩和 (短テロップの遅延感を解消)
      // 旧 800ms は 5文字テロップで実際の発話400msの倍待たされた
      const delay = Math.max(350, cumulativeMs);
      const targetIdx = groupStartIdx + i + 1;
      telopTimers.push(setTimeout(() => {
        setCurrentIndex(cur => {
          // 該当グループ内かつ現在位置が進めるべき位置の1つ前なら進める
          if (cur === targetIdx - 1) return targetIdx;
          return cur;
        });
      }, delay));
    }

    // 次のグループ先頭(異speaker)をプリフェッチ
    const nextGroupHeadIdx = currentIndex + groupSize;
    const nextGroupHead = scripts[nextGroupHeadIdx];
    if (nextGroupHead && adapter.prefetch) {
      const nextGroupScripts = [nextGroupHead];
      for (let i = nextGroupHeadIdx + 1; i < scripts.length; i++) {
        if (scripts[i].speaker === nextGroupHead.speaker) nextGroupScripts.push(scripts[i]);
        else break;
      }
      // ★v5.18.3★ 句点連結に統一 (再生時の joinedSpeech と完全一致するキャッシュキーに)
      const nextJoined = nextGroupScripts.map(s => {
        const t = s.speech || s.text || '';
        return /[。!?.!?]$/.test(t) ? t : t + '。';
      }).join('');
      adapter.prefetch(nextJoined, nextGroupHead.speaker || 'A').catch(() => {});
    }

    if (!isVoiceEnabled) {
      // 音声OFF: グループ末尾に進めるタイマー
      const endTimer = setTimeout(() => {
        setCurrentIndex(cur => {
          if (cur < groupStartIdx + groupSize) return groupStartIdx + groupSize;
          return cur;
        });
      }, groupTotalMs);
      // ★v5.20.10★ ref に保存 (cleanup で消されないように)
      telopTimersRef.current.forEach(clearTimeout);
      telopTimersRef.current = [...telopTimers, endTimer];
      return undefined;
    }

    // グループ全部の speech を連結して1回でTTS
    // ★ スペースでなく句点「。」で連結すると、Web Speech でも自然な間が入る
    const joinedSpeech = groupScripts.map(s => {
      const s_ = s.speech || s.text || '';
      return /[。！？.!?]$/.test(s_) ? s_ : s_ + '。';
    }).join('');

    // エラー時やタイムアウト時に確実にグループを進める fallback 関数
    let hasAdvanced = false;
    const advanceToNextGroup = (reason) => {
      if (hasAdvanced) return;
      hasAdvanced = true;
      if (reason) console.warn('Advancing past group due to:', reason);
      mixer?.stopDucking();
      setCurrentIndex(cur => {
        const nextAfterGroup = groupStartIdx + groupSize;
        // ★v5.18.0★ 末尾到達時 + smartLoop なら冒頭にループ
        if (nextAfterGroup >= scripts.length && projectData?.smartLoop) {
          currentGroupRef.current = { startIdx: -1, endIdx: -1 };
          setAnimationKey(Date.now());
          return 0;
        }
        if (cur < nextAfterGroup) return nextAfterGroup;
        return cur;
      });
    };

    // 絶対timeout: 連結speech の想定時間 + 10秒 (TTS生成時間+リトライ分を見込む)
    // 例: 100文字 @ rate 1.6 → 100 * 160ms / 1.6 = 10秒 + バッファ10秒 = 20秒
    const absoluteTimeoutMs = Math.max(15000, groupTotalMs + 15000);
    const absoluteTimer = setTimeout(() => {
      advanceToNextGroup('absolute timeout (' + absoluteTimeoutMs + 'ms)');
    }, absoluteTimeoutMs);

    // ★v5.20.10★ 既存のタイマーがあれば一旦クリア(別グループ突入時用)、
    //              ref に新しいセットを保存して useEffect cleanup で消えないようにする
    telopTimersRef.current.forEach(clearTimeout);
    telopTimersRef.current = telopTimers;

    if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current);
    absoluteTimerRef.current = absoluteTimer;

    mixer?.startDucking();
    const speakPromise = adapter.speak(joinedSpeech, script.speaker || 'A', {
      rate: speechRate,
      onEnd: () => {
        clearTimeout(absoluteTimerRef.current);
        absoluteTimerRef.current = null;
        advanceToNextGroup();
      },
      onError: (err) => {
        clearTimeout(absoluteTimerRef.current);
        absoluteTimerRef.current = null;
        advanceToNextGroup('TTS onError: ' + (err?.message || err));
      },
    });
    
    // speak() が Promise の場合、catchされない rejection があっても進行保証
    if (speakPromise && typeof speakPromise.catch === 'function') {
      speakPromise.catch(err => {
        clearTimeout(absoluteTimerRef.current);
        absoluteTimerRef.current = null;
        advanceToNextGroup('speak promise rejected: ' + (err?.message || err));
      });
    }

    // ★v5.20.10★ cleanup: グループ内のタイマーは消さない (ref で持続させる)
    //   useEffect の再実行は currentIndex の変化で起こるが、グループ進行中はタイマー継続必須
    //   完全な停止は togglePlay/reset/jumpTo 経由で adapter.stop() + ref クリアで行う
    return undefined;
  }, [currentIndex, isPlaying, scripts, isVoiceEnabled, isSEEnabled, speechRate, ttsEngine, getSpeakerGroupInfo]);

  const togglePlay = useCallback(async () => {
    if (!isPlaying) {
      // ★v5.14.3★ メディア再生 unlock (Android Chrome 対策)
      // ユーザー操作起点で AudioContext + HTMLMediaElement の autoplay policy を解除する。
      // これがないと「最初の再生だけ無音」「何度かやり直すと出る」現象が発生する。
      try {
        if (adapterRef.current?.unlock) {
          await adapterRef.current.unlock();
        }
      } catch (e) {
        console.warn('unlock failed (continuing):', e);
      }

      if (currentIndex >= scripts.length - 1) {
        setCurrentIndex(0);
        setElapsedTime(0);
        setAnimationKey(Date.now());
      } else if (elapsedTime === 0) {
        setAnimationKey(Date.now());
      }
      // 再生開始時にグループトラッキングリセット
      currentGroupRef.current = { startIdx: -1, endIdx: -1 };
      if (isBgmEnabled) {
        mixerRef.current?.playBgm(true);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      currentGroupRef.current = { startIdx: -1, endIdx: -1 };
      // ★v5.20.10★ 停止時もタイマー全クリア
      telopTimersRef.current.forEach(clearTimeout);
      telopTimersRef.current = [];
      if (absoluteTimerRef.current) {
        clearTimeout(absoluteTimerRef.current);
        absoluteTimerRef.current = null;
      }
      adapterRef.current?.stop();
      mixerRef.current?.stopDucking();
      mixerRef.current?.stopBgm();
    }
  }, [isPlaying, currentIndex, elapsedTime, scripts.length, isBgmEnabled]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setElapsedTime(0);
    setAnimationKey(Date.now());
    currentGroupRef.current = { startIdx: -1, endIdx: -1 };
    // ★v5.20.10★ ref ベースのタイマーをクリア
    telopTimersRef.current.forEach(clearTimeout);
    telopTimersRef.current = [];
    if (absoluteTimerRef.current) {
      clearTimeout(absoluteTimerRef.current);
      absoluteTimerRef.current = null;
    }
    adapterRef.current?.stop();
    mixerRef.current?.stopDucking();
    mixerRef.current?.stopBgm();
  }, []);

  const jumpTo = useCallback((index) => {
    setCurrentIndex(Math.max(0, Math.min(scripts.length - 1, index)));
    currentGroupRef.current = { startIdx: -1, endIdx: -1 };
    // ★v5.20.10★ タイマー全クリア
    telopTimersRef.current.forEach(clearTimeout);
    telopTimersRef.current = [];
    if (absoluteTimerRef.current) {
      clearTimeout(absoluteTimerRef.current);
      absoluteTimerRef.current = null;
    }
    adapterRef.current?.stop();
  }, [scripts.length]);

  return {
    isPlaying,
    currentIndex,
    currentScript: scripts[currentIndex],
    elapsedTime,
    animationKey,
    togglePlay,
    reset,
    jumpTo,
  };
}
