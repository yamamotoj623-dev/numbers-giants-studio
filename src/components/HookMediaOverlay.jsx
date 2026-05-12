/**
 * HookMediaOverlay (★v5.20 簡素化★)
 *
 * id:1 (hook) で全画面表示するユーザーアップロード画像/動画。
 * 過去の useState/useEffect ベースは初回マウントタイミング問題で動かなかったため、
 * **完全にステートレス**にして描画/非描画を isVisible だけで判定。
 *
 * sustain アニメは <img>/<video> の inline style に直接適用、CSS animation だけで揺らす。
 */

import React from 'react';

const PATTERN_ANIM = {
  flash:      'hookMediaShakeIdle 1.4s ease-in-out infinite',
  zoom:       'hookMediaKenBurns 4s ease-in-out infinite alternate',
  slide:      'hookMediaShakeIdle 1.6s ease-in-out infinite',
  glitch:     'hookMediaGlitchIdle 1.8s steps(8) infinite',
  zoom_pulse: 'hookMediaZoomPulse 1.5s ease-in-out infinite',
};

const PATTERN_ENTRY = {
  flash:      'hookEntryFade 0.4s ease-out',
  zoom:       'hookEntryZoom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  slide:      'hookEntrySlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  glitch:     'hookEntryGlitch 0.5s steps(8)',
  zoom_pulse: 'hookEntryZoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export function HookMediaOverlay({ mediaUrl, mediaType, pattern = 'flash', isVisible }) {
  if (!isVisible || !mediaUrl) return null;

  const sustainAnim = PATTERN_ANIM[pattern] || PATTERN_ANIM.flash;
  const entryAnim   = PATTERN_ENTRY[pattern] || PATTERN_ENTRY.flash;

  // 入場 + 持続 を カンマ区切りで連結 (確実に両方発火)
  const combinedAnim = `${entryAnim} both, ${sustainAnim}`;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
      key={`hookmedia-wrapper-${mediaUrl}`}
    >
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
            animation: combinedAnim,
            transformOrigin: 'center',
          }}
        />
      ) : (
        <img
          key={`hookmedia-${mediaUrl}`}
          src={mediaUrl}
          alt=""
          className="relative z-10 w-full h-full object-cover"
          style={{
            animation: combinedAnim,
            transformOrigin: 'center',
          }}
        />
      )}

      <div
        className="absolute inset-0 z-20 pointer-events-none"
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

// ============================================================================
// ★v5.21.4★ outro メディア (最後の id の画像/動画)
// 既存の hook と同じ DB / STORE / コンポーネントを使い、キー名のみ 'outro' で分離。
// PreviewFrame で currentIndex が scripts.length - 1 の時に描画する。
// ============================================================================

export async function saveOutroMedia(blob, type) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ blob, type, savedAt: Date.now() }, 'outro');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOutroMedia() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('outro');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearOutroMedia() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('outro');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
