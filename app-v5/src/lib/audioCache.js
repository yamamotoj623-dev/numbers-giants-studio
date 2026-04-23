/**
 * IndexedDB ベースの音声永続キャッシュ
 * 
 * Gemini TTS で生成した音声を保存し、同一speech/speakerの組み合わせでは
 * APIを再呼び出しせずキャッシュから即座に再生する。
 * 
 * キー設計: `${speaker}:${sha1(text)}` で衝突を防ぎつつ短く。
 * 値: { blob: Blob, createdAt: number, speaker: string, textPreview: string, bytes: number }
 */

const DB_NAME = 'baseball-analytics-v5';
const DB_VERSION = 1;
const STORE_NAME = 'audio-cache';

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

// ブラウザ互換性のためSHA-1をWeb Crypto APIで実装
async function hashKey(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function makeKey(speaker, text) {
  const hash = await hashKey(text);
  return `${speaker}:${hash}`;
}

export async function getCachedAudio(speaker, text) {
  const db = await openDB();
  const key = await makeKey(speaker, text);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCachedAudio(speaker, text, blob) {
  const db = await openDB();
  const key = await makeKey(speaker, text);
  const entry = {
    key,
    blob,
    createdAt: Date.now(),
    speaker,
    textPreview: text.substring(0, 40),
    bytes: blob.size,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearCache() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCacheStats() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const entries = req.result;
      const totalBytes = entries.reduce((sum, e) => sum + (e.bytes || 0), 0);
      resolve({ count: entries.length, totalBytes });
    };
    req.onerror = () => reject(req.error);
  });
}
