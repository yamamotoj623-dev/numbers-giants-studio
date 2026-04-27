/**
 * scriptGrouping.js (★v5.18.3 新規★)
 *
 * scripts を「同一 speaker 連続グループ」に分割する**共通ヘルパー**。
 *
 * 【背景】
 * v5.18.2 まで、以下3箇所で**バラバラのグループ化ロジック**が使われており、
 * キャッシュキーが不一致になるバグがあった:
 *
 *   1. usePlaybackEngine: 句点 '。' 連結で再生用 joinedSpeech を作成
 *   2. ttsAdapter.pregenerate / checkMissingScripts: 個別 script で TTS 生成・チェック
 *   3. audioExporter: スペース ' ' 連結で別の joinedText を作成
 *
 * 結果: アプリ再生と pregenerate / audioExporter で**別のキャッシュキー** を使い、
 *  - 個別チェックで「未生成」と誤判定 (実は生成済み)
 *  - API コール数が 2倍 (個別 + グループで2回叩く)
 *
 * 【解決】
 * 全箇所で本ヘルパーを使い、**完全に同じグループ化** + **完全に同じ joinedText 生成**を行う。
 * これでキャッシュキーが一致し、bug が解消する。
 */

/**
 * 同 speaker 連続でグループ化
 *
 * @param {Array} scripts - projectData.scripts
 * @returns {Array<{ startIdx, size, scripts, speaker, joinedSpeech }>}
 *   各グループに含まれる script 配列、speaker、結合後のテキスト。
 *
 * joinedSpeech は usePlaybackEngine の TTS 送信形式と同じ:
 *   - 各 script の (speech || text) の末尾に '。' を付与 (既に句点なら付けない)
 *   - 区切り文字なしで結合
 *
 * このフォーマットで TTS API に送信される。キャッシュキーもこの文字列ベース。
 */
export function groupBySpeaker(scripts) {
  if (!scripts || scripts.length === 0) return [];
  const groups = [];
  let i = 0;
  while (i < scripts.length) {
    const head = scripts[i];
    if (!head) { i++; continue; }
    const groupScripts = [head];
    for (let j = i + 1; j < scripts.length; j++) {
      if (scripts[j].speaker === head.speaker) {
        groupScripts.push(scripts[j]);
      } else {
        break;
      }
    }
    groups.push({
      startIdx: i,
      size: groupScripts.length,
      scripts: groupScripts,
      speaker: head.speaker || 'A',
      // ★usePlaybackEngine と完全同期★ 句点で連結
      joinedSpeech: groupScripts.map(s => {
        const t = s.speech || s.text || '';
        return /[。！？.!?]$/.test(t) ? t : t + '。';
      }).join(''),
    });
    i += groupScripts.length;
  }
  return groups;
}

/**
 * 指定された script.id を含むグループを返す
 */
export function findGroupForScript(scripts, scriptId) {
  const groups = groupBySpeaker(scripts);
  for (const g of groups) {
    if (g.scripts.some(s => s.id === scriptId)) return g;
  }
  return null;
}
