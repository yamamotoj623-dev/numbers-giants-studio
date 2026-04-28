/**
 * HookMediaOverlay (★v5.19.0 新規★)
 *
 * id:1 (hook) で全画面表示するユーザーアップロード画像/動画。
 * 視聴者のスクロールを止める「1秒の衝撃」を演出。
 *
 * アニメーションパターン:
 *   - 'flash': フラッシュ → 画像 → フラッシュ → チャートに切替
 *   - 'zoom':  ズームイン → 画像 → ズームアウトで背景へ溶ける
 *   - 'slide': 左からスライドイン → 静止 → 右へスライドアウト
 *   - 'glitch': グリッチノイズ → 画像出現 → グリッチで消える
 *
 * 画像/動画は IndexedDB に保存 (seStorage と同じ要領)。
 * 表示期間は hookAnimation の自動タイミング (約0.8-1.2秒) に合わせる。
 */

import React, { useEffect, useState, useRef } from 'react';

const ANIM_PATTERNS = {
  flash: {
    enter: 'hookMediaFlashIn 0.3s ease-out forwards',
    exit:  'hookMediaFlashOut 0.3s ease-in forwards',
  },
  zoom: {
    enter: 'hookMediaZoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    exit:  'hookMediaZoomOut 0.4s ease-in forwards',
  },
  slide: {
    enter: 'hookMediaSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    exit:  'hookMediaSlideOut 0.3s ease-in forwards',
  },
  glitch: {
    enter: 'hookMediaGlitchIn 0.4s steps(8) forwards',
    exit:  'hookMediaGlitchOut 0.3s steps(6) forwards',
  },
};

export function HookMediaOverlay({ mediaUrl, mediaType, pattern = 'flash', isVisible, durationMs = 1000 }) {
  const [phase, setPhase] = useState('hidden'); // hidden | entering | visible | exiting
  const timerRef = useRef(null);

  useEffect(() => {
    if (isVisible && mediaUrl) {
      setPhase('entering');
      // 入場アニメ後 → visible
      timerRef.current = setTimeout(() => {
        setPhase('visible');
        // visible 維持 → exit
        timerRef.current = setTimeout(() => {
          setPhase('exiting');
          timerRef.current = setTimeout(() => setPhase('hidden'), 400);
        }, durationMs);
      }, 400);
    } else {
      setPhase('hidden');
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isVisible, mediaUrl, durationMs]);

  if (phase === 'hidden' || !mediaUrl) return null;

  const animConfig = ANIM_PATTERNS[pattern] || ANIM_PATTERNS.flash;
  const animation = phase === 'entering' ? animConfig.enter
    : phase === 'exiting' ? animConfig.exit
    : 'none';

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ animation }}
    >
      {/* 背景ブラー */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* メディア */}
      {mediaType === 'video' ? (
        <video
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="relative z-10 w-full h-full object-cover"
          style={{ filter: 'brightness(1.1) contrast(1.05)' }}
        />
      ) : (
        <img
          src={mediaUrl}
          alt=""
          className="relative z-10 w-full h-full object-cover"
          style={{ filter: 'brightness(1.1) contrast(1.05)' }}
        />
      )}

      {/* オーバーレイグラデーション (下部に暗くして文字が読める) */}
      <div className="absolute inset-0 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)' }}
      />
    </div>
  );
}

// ============================================================================
// IndexedDB 保存 (seStorage と同じ要領)
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
