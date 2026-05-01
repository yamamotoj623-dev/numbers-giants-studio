/**
 * HookMediaOverlay (★v5.19.7 完全書き直し★)
 *
 * id:1 (hook) で全画面表示するユーザーアップロード画像/動画。
 *
 * 【今回の修正の核】
 * 旧実装は phase: 'hidden' から始まって useEffect の setTimeout で 0.4s 後に visible へ。
 * 初回マウント時の発火タイミング問題で **画像が動かないまま hook が終わる** バグだった。
 * → phase 管理を簡素化、shown になった瞬間に entrance + sustain を**連結したアニメ1つ**で実行。
 */

import React, { useEffect, useState, useRef } from 'react';

// 入場 (短い) + 持続 (長くループ) を カンマ連結 — 1つの animation 指定で entrance + sustain
const COMBINED_ANIMS = {
  flash:      'hookMediaFlashIn 0.4s ease-out both, hookMediaShakeIdle 1.4s ease-in-out 0.4s infinite',
  zoom:       'hookMediaZoomIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both, hookMediaKenBurns 4s ease-in-out 0.5s infinite alternate',
  slide:      'hookMediaSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both, hookMediaShakeIdle 1.6s ease-in-out 0.4s infinite',
  glitch:     'hookMediaGlitchIn 0.5s steps(8) both, hookMediaGlitchIdle 1.8s steps(8) 0.5s infinite',
  zoom_pulse: 'hookMediaZoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both, hookMediaZoomPulse 1.5s ease-in-out 0.4s infinite',
};

const EXIT_ANIMS = {
  flash:      'hookMediaFlashOut 0.3s ease-in forwards',
  zoom:       'hookMediaZoomOut 0.3s ease-in forwards',
  slide:      'hookMediaSlideOut 0.3s ease-in forwards',
  glitch:     'hookMediaGlitchOut 0.3s steps(6) forwards',
  zoom_pulse: 'hookMediaZoomOut 0.3s ease-in forwards',
};

export function HookMediaOverlay({ mediaUrl, mediaType, pattern = 'flash', isVisible, durationMs = 'auto' }) {
  const [showState, setShowState] = useState('hidden'); // 'hidden' | 'shown' | 'exiting'
  const exitTimerRef = useRef(null);
  const durationTimerRef = useRef(null);

  useEffect(() => {
    if (isVisible && mediaUrl) {
      setShowState('shown');
      console.log('[HookMedia] 表示開始:', { pattern, durationMs });
      // 明示的な durationMs (number) なら自動 exit
      if (typeof durationMs === 'number') {
        durationTimerRef.current = setTimeout(() => {
          setShowState('exiting');
          exitTimerRef.current = setTimeout(() => setShowState('hidden'), 300);
        }, durationMs);
      }
    } else {
      if (showState === 'shown') {
        setShowState('exiting');
        exitTimerRef.current = setTimeout(() => setShowState('hidden'), 300);
      }
    }
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (durationTimerRef.current) clearTimeout(durationTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, mediaUrl, durationMs, pattern]);

  if (showState === 'hidden' || !mediaUrl) return null;

  const mediaAnim = showState === 'exiting'
    ? (EXIT_ANIMS[pattern] || EXIT_ANIMS.flash)
    : (COMBINED_ANIMS[pattern] || COMBINED_ANIMS.flash);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {mediaType === 'video' ? (
        <video
          key={`hookmedia-${mediaUrl}`}
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="relative z-10 w-full h-full object-cover"
          style={{
            filter: 'brightness(1.1) contrast(1.08) saturate(1.05)',
            animation: mediaAnim,
            transformOrigin: 'center',
            willChange: 'transform, filter, opacity',
          }}
        />
      ) : (
        <img
          key={`hookmedia-${mediaUrl}`}
          src={mediaUrl}
          alt=""
          className="relative z-10 w-full h-full object-cover"
          style={{
            filter: 'brightness(1.1) contrast(1.08) saturate(1.05)',
            animation: mediaAnim,
            transformOrigin: 'center',
            willChange: 'transform, filter, opacity',
          }}
        />
      )}

      <div className="absolute inset-0 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7) 100%)' }}
      />
    </div>
  );
}

// ============================================================================
// IndexedDB 保存
// ============================================================================
const DB_NAME = 'np-hook-media-db';
const STORE_NAME = 'media';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHookMedia(blob, type) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ blob, type, savedAt: Date.now() }, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getHookMedia() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('current');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearHookMedia() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
