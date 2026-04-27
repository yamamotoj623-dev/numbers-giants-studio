/**
 * 指標 (label) が英語ベースかどうか判定するヘルパー
 *
 * ★v5.15.5★ 英語指標 (OPS, WAR, K/9, BB/9 等) のみ kana/formula を表示する用途。
 * 日本語指標 (打率、本塁打、防御率) は読み・式が冗長なので非表示。
 */
export function isEnglishMetric(label) {
  if (!label) return false;
  const en = (label.match(/[A-Za-z]/g) || []).length;
  const ja = (label.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
  // 英字が1文字以上 + (日本語ゼロ or 英字 >= 日本語) なら英語指標扱い
  return en >= 1 && (ja === 0 || en >= ja);
}
