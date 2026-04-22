/**
 * IndexedDB ベースの BGM 永続ストレージ
 *
 * ユーザーがアップロードした BGM ファイルをブラウザに永続保存し、
 * リロードやセッションまたいで使い続けられるようにする。
 *
 * キー設計: `bgm-${uuid}` のユニークID
 * 値: { key, name, blob, size, createdAt, mimeType }
 *
 * 使い方:
 *   import { saveBgm, listBgms, getBgmBlob, deleteBgm } from './bgmStorage';
 *   const id = await saveBgm(file);
 *   const bgms = await listBgms();
 *   const blob = await getBgmBlob(id);
 *   await deleteBgm(id);
 */

const DB_NAME = 'baseball-analytics-v5-bgm';
const DB_VERSION = 1;
const STORE_NAME = 'bgm-storage';

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

function generateId() {
  return `bgm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * BGMファイルを保存 (返り値: id)
 */
export async function saveBgm(file) {
  const db = await openDB();
  const key = generateId();
  const entry = {
    key,
    name: file.name,
    blob: file,  // Fileオブジェクトは Blob 派生なのでそのまま保存可能
    size: file.size,
    mimeType: file.type || 'audio/mpeg',
    createdAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve(key);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 保存されているBGM一覧 (blob除く、メタ情報のみ)
 */
export async function listBgms() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const entries = req.result || [];
      // blobを除外、新しい順にソート
      const meta = entries
        .map(e => ({
          key: e.key,
          name: e.name,
          size: e.size,
          mimeType: e.mimeType,
          createdAt: e.createdAt,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      resolve(meta);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 指定キーのBGMのBlobを取得 (再生用URL生成に使用)
 */
export async function getBgmBlob(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 指定BGMを削除
 */
export async function deleteBgm(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 全BGM削除
 */
export async function clearBgms() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * BGM ストレージ統計
 */
export async function getBgmStats() {
  const bgms = await listBgms();
  const totalBytes = bgms.reduce((sum, b) => sum + (b.size || 0), 0);
  return { count: bgms.length, totalBytes };
}
