/**
 * 再生エンジン統合フック
 * 
 * v4.24.0 の再生ループを流用しつつ、TTSAdapter経由で切替可能に。
 * SE 発火、BGM ダッキング開始/終了も連動。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAdapter } from '../lib/ttsAdapter';
import { getMixer } from '../lib/mixer';

export function usePlaybackEngine(projectData, { ttsEngine = 'web_speech', speechRate = 1.6, isVoiceEnabled = true, isSEEnabled = true } = {}) {
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
      return prev;
    });
  }, [scripts.length]);

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

    if (!isVoiceEnabled) {
      const text = script.speech || script.text || '';
      const delay = Math.max(1500, text.length * 150 / speechRate);
      const t = setTimeout(playNext, delay);
      return () => clearTimeout(t);
    }

    mixer?.startDucking();
    adapter.speak(script.speech || script.text || '', script.speaker || 'A', {
      rate: speechRate,
      onEnd: () => {
        mixer?.stopDucking();
        playNext();
      },
      onError: (err) => {
        console.warn('TTS error, skipping:', err);
        mixer?.stopDucking();
        playNext();
      },
    });
  }, [currentIndex, isPlaying, scripts, isVoiceEnabled, isSEEnabled, speechRate, playNext]);

  const togglePlay = useCallback(() => {
    if (!isPlaying) {
      if (currentIndex >= scripts.length - 1) {
        setCurrentIndex(0);
        setElapsedTime(0);
        setAnimationKey(Date.now());
      } else if (elapsedTime === 0) {
        setAnimationKey(Date.now());
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      adapterRef.current?.stop();
      mixerRef.current?.stopDucking();
    }
  }, [isPlaying, currentIndex, elapsedTime, scripts.length]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setElapsedTime(0);
    setAnimationKey(Date.now());
    adapterRef.current?.stop();
    mixerRef.current?.stopDucking();
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
