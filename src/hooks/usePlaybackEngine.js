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
      setIsPlaying(false);
      mixerRef.current?.stopDucking();
      mixerRef.current?.stopBgm();
      return prev;
    });
  }, [scripts.length]);

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

  useEffect(() => {
    if (!isPlaying) return;
    const script = scripts[currentIndex];
    if (!script) return;

    const adapter = adapterRef.current;
    const mixer = mixerRef.current;
    if (!adapter) return;

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
    const charMs = ttsEngine === 'gemini' ? 160 : 150;
    const groupTotalChars = groupScripts.reduce((sum, s) => sum + (s.speech || s.text || '').length, 0) || 1;
    const groupTotalMs = groupTotalChars * charMs / speechRate;

    const telopTimers = [];
    let cumulativeMs = 0;
    for (let i = 0; i < groupScripts.length - 1; i++) {
      const thisScript = groupScripts[i];
      const thisChars = (thisScript.speech || thisScript.text || '').length;
      cumulativeMs += (thisChars / groupTotalChars) * groupTotalMs;
      const delay = Math.max(800, cumulativeMs);
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
      const nextJoined = nextGroupScripts.map(s => s.speech || s.text || '').join(' ');
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
      return () => {
        telopTimers.forEach(clearTimeout);
        clearTimeout(endTimer);
      };
    }

    // グループ全部の speech を連結して1回でTTS
    // ★ スペースでなく句点「。」で連結すると、Web Speech でも自然な間が入る
    const joinedSpeech = groupScripts.map(s => {
      const s_ = s.speech || s.text || '';
      // 末尾が句点でなければ追加
      return /[。！？.!?]$/.test(s_) ? s_ : s_ + '。';
    }).join('');

    mixer?.startDucking();
    adapter.speak(joinedSpeech, script.speaker || 'A', {
      rate: speechRate,
      onEnd: () => {
        mixer?.stopDucking();
        // 音声終了: グループ末尾以降に進める (テロップが追いついてない場合のfallback)
        setCurrentIndex(cur => {
          const nextAfterGroup = groupStartIdx + groupSize;
          if (cur < nextAfterGroup) return nextAfterGroup;
          return cur;
        });
      },
      onError: (err) => {
        console.warn('TTS error:', err);
        mixer?.stopDucking();
        setCurrentIndex(cur => {
          const nextAfterGroup = groupStartIdx + groupSize;
          if (cur < nextAfterGroup) return nextAfterGroup;
          return cur;
        });
      },
    });

    // ★ cleanup: テロップタイマーのみ解除、adapter.stop() は呼ばない
    //   (グループ途中の useEffect 再実行で音声が止まらないよう)
    //   音声の本当の停止は togglePlay/reset で明示的に行う
    return () => {
      telopTimers.forEach(clearTimeout);
    };
  }, [currentIndex, isPlaying, scripts, isVoiceEnabled, isSEEnabled, speechRate, ttsEngine, getSpeakerGroupInfo]);

  const togglePlay = useCallback(() => {
    if (!isPlaying) {
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
    adapterRef.current?.stop();
    mixerRef.current?.stopDucking();
    mixerRef.current?.stopBgm();
  }, []);

  const jumpTo = useCallback((index) => {
    setCurrentIndex(Math.max(0, Math.min(scripts.length - 1, index)));
    currentGroupRef.current = { startIdx: -1, endIdx: -1 };
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
