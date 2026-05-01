/**
 * statFormat.js (★v5.19.8 ロジック修正★)
 *
 * 野球統計の数値表示ルールを統一するヘルパー。
 *
 * ルール:
 *   - null / undefined / 空文字 / 'N/A' → '-' (本当にデータなし)
 *   - 0, 0.000, '0' → 0 のまま (本塁打0本、勝利0、防御率0.00 は意味のある値!)
 *   - 0始まりの小数 (0.282) → '.282' (打率系)
 *   - 整数 → そのまま
 *   - 負の0始まり (-0.150) → '-.150'
 */

export function formatStat(value, kind = 'auto') {
  // null / undefined → '-'
  if (value === null || value === undefined) return '-';

  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '' || t.toLowerCase() === 'n/a' || t === '--') return '-';
    if (t.startsWith('.') || t.startsWith('-.')) return t;
    // 0 系は kind=rate の時のみ ".000" に整形、それ以外は元のまま
    if (/^-?0(\.0+)?$/.test(t)) {
      if (kind === 'rate') {
        const decimals = (t.split('.')[1] || '').length || 3;
        return (t.startsWith('-') ? '-' : '') + '.' + '0'.repeat(decimals);
      }
      return t;
    }
    // '0.xxx' → '.xxx'
    const m = t.match(/^(-?)0\.(\d+)$/);
    if (m && (kind === 'rate' || (kind === 'auto' && Math.abs(parseFloat(t)) < 1 && parseFloat(t) !== 0))) {
      return `${m[1]}.${m[2]}`;
    }
    return t;
  }

  if (typeof value !== 'number' || isNaN(value)) return '-';

  // 0 はそのまま (rate kind なら '.000')
  if (value === 0) return kind === 'rate' ? '.000' : '0';

  if (Number.isInteger(value) && kind !== 'rate') return String(value);

  const abs = Math.abs(value);
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
