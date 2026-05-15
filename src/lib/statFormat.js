/**
 * statFormat.js *
 * 野球統計の数値表示ルールを統一するヘルパー。
 *
 * ルール (kind の意味):
 *   - 'rate'  : 打率系 (打率/出塁率/長打率/OPS/被打率) → ".333" (先頭0省略)
 *   - 'ratio' : 防御率系 (ERA/WHIP/K/9/BB/9 等) → "0.92" (先頭0残す)  *   - 'auto'  : 後方互換 (1未満は ".333" 形式に省略、互換性維持)
 *   - 'int'   : 整数のみ
 *
 *   - null / undefined / 空文字 / 'N/A' → '-' (データなし)
 *   - 0 → '0' のまま (rate なら '.000')
 */

// rate kind の指標 (打率系: 0始まり省略)
const RATE_METRICS = new Set(['avg', 'obp', 'slg', 'ops', 'babip', 'iso', 'wOBA']);
// ratio kind の指標 (防御率系: 先頭0残す)
const RATIO_METRICS = new Set(['era', 'whip', 'fip', 'kBB', 'k9', 'bb9', 'hr9', 'k_bb']);

export function inferKindFromMetricId(id) {
  if (!id) return 'auto';
  const lower = String(id).toLowerCase();
  if (RATE_METRICS.has(lower)) return 'rate';
  if (RATIO_METRICS.has(lower)) return 'ratio';
  return 'auto';
}

export function formatStat(value, kind = 'auto') {
  // null / undefined → '-'
  if (value === null || value === undefined) return '-';

  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '' || t.toLowerCase() === 'n/a' || t === '--') return '-';
    // 既に '.' 始まり → rate スタイルなのでそのまま
    if (t.startsWith('.') || t.startsWith('-.')) {
      // ratio kind だが値が ".xxx" 形式で来た場合は "0.xxx" に補正
      if (kind === 'ratio') return (t.startsWith('-') ? '-0' : '0') + (t.startsWith('-') ? t.slice(1) : t);
      return t;
    }
    // 0 系は kind=rate の時のみ ".000" に整形、ratio は "0.00"、それ以外は元のまま
    if (/^-?0(\.0+)?$/.test(t)) {
      if (kind === 'rate') {
        const decimals = (t.split('.')[1] || '').length || 3;
        return (t.startsWith('-') ? '-' : '') + '.' + '0'.repeat(decimals);
      }
      if (kind === 'ratio') {
        const decimals = (t.split('.')[1] || '').length || 2;
        return (t.startsWith('-') ? '-' : '') + '0.' + '0'.repeat(decimals);
      }
      return t;
    }
    // '0.xxx' → kind 別処理
    const m = t.match(/^(-?)0\.(\d+)$/);
    if (m) {
      // rate: 先頭0省略
      if (kind === 'rate' || (kind === 'auto' && Math.abs(parseFloat(t)) < 1 && parseFloat(t) !== 0)) {
        return `${m[1]}.${m[2]}`;
      }
      // ratio: 先頭0残す (元のまま)
      if (kind === 'ratio') return t;
    }
    return t;
  }

  if (typeof value !== 'number' || isNaN(value)) return '-';

  // 0 はそのまま (rate kind なら '.000', ratio なら '0.00')
  if (value === 0) {
    if (kind === 'rate') return '.000';
    if (kind === 'ratio') return '0.00';
    return '0';
  }

  if (Number.isInteger(value) && kind !== 'rate' && kind !== 'ratio') return String(value);

  const abs = Math.abs(value);
  // ratio kind: 0.92 形式 (先頭0残す、小数2桁)
  if (kind === 'ratio') {
    const sign = value < 0 ? '-' : '';
    return sign + abs.toFixed(2);
  }
  // rate kind: .333 形式 (先頭0省略、小数3桁)
  if (kind === 'rate' || (kind === 'auto' && abs < 1)) {
    const sign = value < 0 ? '-' : '';
    const str = abs.toFixed(3);
    if (str.startsWith('0.')) return sign + str.slice(1);
    return sign + str;
  }
  return value.toFixed(2);
}

export function formatStatList(arr, kind = 'auto') {
  if (!Array.isArray(arr)) return [];
  return arr.map(v => formatStat(v, kind));
}
