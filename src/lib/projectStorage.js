/**
 * projectStorage.js (★v5.18.4 新規★)
 *
 * 編集中の projectData を localStorage に保存・復元する仕組み。
 *
 * 機能:
 * 1. **自動保存** — editing slot に変更があると常に保存。閉じても次回起動時に復元。
 * 2. **名前付きスロット** — ユーザーが「岡本動画」「井上動画」など名前を付けて複数保存可能。
 * 3. **エクスポート/インポート** — JSON 形式で外部に保管・別端末で利用可能。
 *
 * 設計:
 * - localStorage の `np-projects` キーに { editing: {...}, slots: { [name]: {...} } } で保存
 * - 容量上限 ~5MB なので、scripts 全体 + layoutData + comparisons で十分収まる
 * - blob (BGM/SE/TTS音声) は IndexedDB に別管理 (本ヘルパーの対象外)
 */

const STORAGE_KEY = 'np-projects';
const EDITING_SLOT = '__editing__';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { editing: null, slots: {} };
    const parsed = JSON.parse(raw);
    return {
      editing: parsed.editing || null,
      slots: parsed.slots || {},
    };
  } catch (e) {
    console.error('[projectStorage] read failed:', e);
    return { editing: null, slots: {} };
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('[projectStorage] write failed:', e);
    // QuotaExceededError のとき: editing は最新を維持、古いスロットを削除
    if (e.name === 'QuotaExceededError' && data.slots) {
      const slotNames = Object.keys(data.slots);
      if (slotNames.length > 0) {
        // 最も古いスロットを削除して再試行
        const oldest = slotNames.reduce((a, b) =>
          (data.slots[a].savedAt || 0) < (data.slots[b].savedAt || 0) ? a : b
        );
        delete data.slots[oldest];
        return writeAll(data);
      }
    }
    return false;
  }
}

/**
 * 編集中スロットに自動保存
 */
export function autoSaveEditing(projectData) {
  if (!projectData) return;
  const all = readAll();
  all.editing = {
    data: projectData,
    savedAt: Date.now(),
  };
  writeAll(all);
}

/**
 * 編集中スロットを復元
 */
export function loadEditing() {
  const all = readAll();
  return all.editing?.data || null;
}

/**
 * 編集中スロットの最終保存時刻
 */
export function getEditingTimestamp() {
  const all = readAll();
  return all.editing?.savedAt || null;
}

/**
 * 編集中スロットをクリア (新規作成時)
 */
export function clearEditing() {
  const all = readAll();
  all.editing = null;
  writeAll(all);
}

/**
 * 名前付きスロットに保存
 */
export function saveToSlot(name, projectData) {
  if (!name || !projectData) return false;
  const all = readAll();
  all.slots[name] = {
    data: projectData,
    savedAt: Date.now(),
  };
  return writeAll(all);
}

/**
 * 名前付きスロットから復元
 */
export function loadFromSlot(name) {
  const all = readAll();
  return all.slots[name]?.data || null;
}

/**
 * 全スロットを名前順で一覧
 */
export function listSlots() {
  const all = readAll();
  return Object.entries(all.slots)
    .map(([name, entry]) => ({
      name,
      savedAt: entry.savedAt,
      title: entry.data?.title || entry.data?.mainPlayer?.name || '(無題)',
      scriptsCount: entry.data?.scripts?.length || 0,
    }))
    .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

/**
 * スロット削除
 */
export function deleteSlot(name) {
  const all = readAll();
  delete all.slots[name];
  return writeAll(all);
}

/**
 * projectData を JSON 文字列にしてエクスポート
 */
export function exportProjectJson(projectData) {
  return JSON.stringify(projectData, null, 2);
}

/**
 * JSON 文字列を parse して projectData として返す
 */
export function importProjectJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') throw new Error('Invalid format');
    if (!Array.isArray(data.scripts)) throw new Error('scripts is not array');
    return data;
  } catch (e) {
    throw new Error('JSON parse failed: ' + e.message);
  }
}
