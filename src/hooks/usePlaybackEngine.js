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

    // グループ途中 (前のscriptと同speaker) → 何もしない
    // テロップは前回のグループ先頭で setTimeout された timers が順次進めてくれる
    if (!isGroupStart) {
      return;
    }

    // === グループ開始: 音声発火 + テロップ同期setTimeout配列 ===
    // テロップの表示時間 = 各scriptのspeech文字数の比率 × 音声全体想定時間
    // Gemini TTS は 1文字 ≈ 160ms、webspeech は ≈ 150ms、playbackRateで割る
    const charMs = ttsEngine === 'gemini' ? 160 : 150;
    const groupTotalChars = groupScripts.reduce((sum, s) => sum + (s.speech || s.text || '').length, 0);
    const groupTotalMs = groupTotalChars * charMs / speechRate;

    // 各scriptの表示終了時刻を累積で計算 → playNext をその時刻にスケジュール
    const telopTimers = [];
    let cumulativeMs = 0;
    for (let i = 0; i < groupScripts.length - 1; i++) {
      // i番目が終わる = 次(i+1)のscriptに進む
      const thisScript = groupScripts[i];
      const thisChars = (thisScript.speech || thisScript.text || '').length;
      cumulativeMs += (thisChars / groupTotalChars) * groupTotalMs;
      // 最低表示時間 保証 (グループ長に応じて)
      const delay = Math.max(800, cumulativeMs);
      telopTimers.push(setTimeout(() => {
        setCurrentIndex(cur => {
          // 該当idにまだ居れば進める (他要因で既に進んでたら何もしない)
          if (cur === currentIndex + i) return currentIndex + i + 1;
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
          if (cur < currentIndex + groupSize) return currentIndex + groupSize;
          return cur;
        });
      }, groupTotalMs);
      return () => {
        telopTimers.forEach(clearTimeout);
        clearTimeout(endTimer);
      };
    }

    // グループ全部の speech を連結して1回でTTS
    const joinedSpeech = groupScripts.map(s => s.speech || s.text || '').join(' ');

    mixer?.startDucking();
    adapter.speak(joinedSpeech, script.speaker || 'A', {
      rate: speechRate,
      onEnd: () => {
        mixer?.stopDucking();
        // 音声終了時にグループ末尾以降に進める
        setCurrentIndex(cur => {
          const groupEnd = currentIndex + groupSize;
          if (cur < groupEnd) return groupEnd;
          return cur;
        });
      },
      onError: (err) => {
        console.warn('TTS error:', err);
        mixer?.stopDucking();
        // エラー時もグループ末尾まで進める
        setCurrentIndex(cur => {
          const groupEnd = currentIndex + groupSize;
          if (cur < groupEnd) return groupEnd;
          return cur;
        });
      },
    });

    return () => {
      telopTimers.forEach(clearTimeout);
      // 音声停止 (unmount/dep変更時)
      adapter.stop?.();
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
      // 動画再生と同時に BGM を最初から開始
      if (isBgmEnabled) {
        mixerRef.current?.playBgm(true);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
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
    adapterRef.current?.stop();
    mixerRef.current?.stopDucking();
    mixerRef.current?.stopBgm();
  }, []);

  const jumpTo = useCallback((index) => {
    setCurrentIndex(Math.max(0, Math.min(scripts.length - 1, index)));
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
