/**
 * projectSplit.js ()
 *
 * projectData を「データJSON」「台本JSON」に分割・結合するヘルパー。
 *
 * 【背景】
 * v5.18.11 まで projectData は1つの JSON で、Gemini に毎回 comparisons / layoutData / scripts を
 * 全部出力させていた。これだと:
 *   - 出力量が大きくて quota を圧迫
 *   - データ部分は動画間で再利用したい (1動画内で 5選手 × 各3つの quote 等)
 *   - 台本だけ書き直したい場合にデータ全部を再生成するのが無駄
 *
 * 【解決】
 * projectData を「メタ + データ」と「台本」に分けて持ち、必要なときに merge する。
 *
 * 【スキーマ】
 * - data.json: { schemaVersion, layoutType, pattern, mainPlayer, subPlayer,
 *                radarStats, comparisons, layoutData, audio, theme, period,
 *                hookAnimation, smartLoop, outroCta, ... メタ全部 }
 * - script.json: { scripts: [...] }
 *
 * メタ系 (theme/period 等) は data 側に置く。台本側は scripts 配列だけ。
 */

/**
 * 1ファイル形式の projectData を { data, script } に分割
 */
export function splitProjectData(projectData) {
  if (!projectData || typeof projectData !== 'object') {
    return { data: {}, script: { scripts: [] } };
  }
  const { scripts, ...rest } = projectData;
  return {
    data: rest,
    script: { scripts: Array.isArray(scripts) ? scripts : [] },
  };
}

/**
 * { data, script } を 1ファイル形式の projectData に結合
 */
export function mergeProjectData(data, script) {
  return {
    ...(data || {}),
    scripts: Array.isArray(script?.scripts) ? script.scripts : [],
  };
}

/**
 * データJSON / 台本JSON のどちらの形式か検査して projectData を返す
 *
 * - { scripts: [...], ... メタ全部 } → 1ファイル形式
 * - { data: {...}, script: {...} } → 2ファイル形式 (新フォーマット)
 *
 * これで JsonPanel で貼り付けた JSON がどちらの形式でも受け入れられる。
 */
export function normalizeProjectInput(jsonObj) {
  if (!jsonObj || typeof jsonObj !== 'object') return null;
  // 2ファイル形式
  if (jsonObj.data && jsonObj.script) {
    return mergeProjectData(jsonObj.data, jsonObj.script);
  }
  // 1ファイル形式 (既存)
  if (Array.isArray(jsonObj.scripts)) {
    return jsonObj;
  }
  // データだけ (台本なし) — 空 scripts で返す
  if (jsonObj.mainPlayer || jsonObj.layoutData || jsonObj.comparisons) {
    return { ...jsonObj, scripts: [] };
  }
  // 台本だけ — メタを最低限補う
  if (jsonObj.scripts) {
    return jsonObj;
  }
  return null;
}
