/**
 * v5.0.0 UI確定版レーダーチャート
 * - SVG内テキストラベル(頂点外周5点固定配置)
 * - viewBox 240x220、五角形は中央(120,110)・半径60
 * - ラベルは背景rect付き小バッジで読みやすく
 * - highlight時は該当頂点だけ金色強調
 * - compact モード時はラベルを外側に
 */

import React from 'react';

const LABEL_POSITIONS = [
  { x: 120, y: 16, w: 50, h: 28, tx: 120, ty1: 27, ty2: 40 },
  { x: 213, y: 86, w: 46, h: 28, tx: 213, ty1: 83, ty2: 96 },
  { x: 191, y: 182, w: 46, h: 28, tx: 191, ty1: 179, ty2: 192 },
  { x: 49, y: 182, w: 46, h: 28, tx: 49, ty1: 179, ty2: 192 },
  { x: 27, y: 86, w: 46, h: 28, tx: 27, ty1: 83, ty2: 96 },
];

const COMPACT_LABEL_POSITIONS = [
  { tx: 75, ty1: 10, ty2: 19 },
  { tx: 130, ty1: 41, ty2: 51 },
  { tx: 110, ty1: 100, ty2: 108 },
  { tx: 40, ty1: 100, ty2: 108 },
  { tx: 20, ty1: 41, ty2: 51 },
];

const RANK_COLORS = {
  S: '#FFD700', A: '#ef4444', B: '#f97316', C: '#10b981',
  D: '#3b82f6', E: '#a1a1aa', F: '#71717a', G: '#52525b'
};

function valueToRank(value) {
  if (value >= 85) return 'S';
  if (value >= 70) return 'A';
  if (value >= 55) return 'B';
  if (value >= 40) return 'C';
  if (value >= 25) return 'D';
  if (value >= 15) return 'E';
  if (value >= 5) return 'F';
  return 'G';
}

function polygonPoints(values, cx, cy, maxR) {
  // 五角形: 12, 84, 156, 228, 300度 (基準上方向、時計回り)
  const angles = [-90, -18, 54, 126, 198].map(d => d * Math.PI / 180);
  return values.map((v, i) => {
    const r = (v / 100) * maxR;
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    return { x, y };
  });
}

export function RadarChartSVG({ stats, highlight, themeColor, comparisons, showLabels = true, compact = false }) {
  if (!stats) return null;

  const keys = Object.keys(stats);
  const mainValues = keys.map(k => stats[k].main);
  const subValues = keys.map(k => stats[k].sub);
  const labels = keys.map(k => stats[k].label);

  const cx = compact ? 75 : 120;
  const cy = compact ? 55 : 110;
  const maxR = compact ? 35 : 60;
  const viewBox = compact ? '0 0 150 110' : '0 0 240 220';

  const mainPts = polygonPoints(mainValues, cx, cy, maxR);
  const subPts = polygonPoints(subValues, cx, cy, maxR);

  const mainStr = mainPts.map(p => `${p.x},${p.y}`).join(' ');
  const subStr = subPts.map(p => `${p.x},${p.y}`).join(' ');

  const guideStr = (scale) => polygonPoints([scale*100, scale*100, scale*100, scale*100, scale*100], cx, cy, maxR).map(p => `${p.x},${p.y}`).join(' ');

  const highlightIdx = highlight && comparisons ? comparisons.findIndex(c => c.id === highlight) : -1;
  const hlKey = highlightIdx >= 0 ? keys[highlightIdx] : null;
  const hlVertexIdx = hlKey ? keys.indexOf(hlKey) : -1;
  const hlVertex = hlVertexIdx >= 0 ? mainPts[hlVertexIdx] : null;

  return (
    <svg viewBox={viewBox} className="w-full h-full overflow-visible">
      {/* ガイド5段 */}
      <polygon points={guideStr(1.0)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={compact ? 0.6 : 0.8} />
      <polygon points={guideStr(0.75)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />
      <polygon points={guideStr(0.5)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />
      <polygon points={guideStr(0.25)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />

      {/* 軸線 */}
      {mainPts.map((_, i) => {
        const p = polygonPoints([100,100,100,100,100], cx, cy, maxR)[i];
        const isHlAxis = i === hlVertexIdx;
        return (
          <line
            key={i}
            x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke={isHlAxis ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={isHlAxis ? 1 : 0.5}
          />
        );
      })}

      {/* サブ (昨季/相手) - 破線 */}
      <polygon
        className={compact ? '' : 'radar-sub-poly'}
        points={subStr}
        fill="rgba(161,161,170,0.2)"
        stroke="#d4d4d8"
        strokeWidth={compact ? 1 : 1.5}
        strokeDasharray="3 2"
      />

      {/* メイン (今季) - 塗り */}
      <polygon
        className={compact ? '' : 'radar-main-poly'}
        points={mainStr}
        fill="rgba(249,115,22,0.35)"
        stroke="#f97316"
        strokeWidth={compact ? 1.5 : 2}
        style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.6))' }}
      />

      {/* 頂点ドット (非コンパクトのみ) */}
      {!compact && mainPts.map((p, i) => (
        <circle
          key={i}
          className="radar-dot"
          cx={p.x} cy={p.y} r="3"
          fill="#f97316"
          style={{ filter: 'drop-shadow(0 0 4px #f97316)' }}
        />
      ))}

      {/* ハイライト頂点を金色強調 */}
      {hlVertex && (
        <g className="vertex-glow">
          <circle cx={hlVertex.x} cy={hlVertex.y} r="5" fill="#FFD700" style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }} />
          <circle cx={hlVertex.x} cy={hlVertex.y} r="2" fill="#fff" />
        </g>
      )}

      {/* ラベル */}
      {showLabels && !compact && LABEL_POSITIONS.map((pos, i) => {
        const label = labels[i] || '';
        const rank = valueToRank(mainValues[i]);
        const color = RANK_COLORS[rank] || '#d4d4d8';
        const isHl = i === hlVertexIdx;
        return (
          <g key={i} className="radar-label-group">
            <rect
              x={pos.x - pos.w / 2} y={pos.y}
              width={pos.w} height={pos.h}
              rx="6"
              fill="rgba(24,24,27,0.92)"
              stroke={isHl ? 'rgba(249,115,22,0.8)' : 'rgba(63,63,70,0.8)'}
              strokeWidth="1"
            />
            <text x={pos.tx} y={pos.ty1} textAnchor="middle" fill="#e4e4e7" fontSize="10" fontWeight="900">{label}</text>
            <text x={pos.tx} y={pos.ty2} textAnchor="middle" fill={color} fontSize="13" fontWeight="900" fontStyle="italic">{rank}</text>
          </g>
        );
      })}

      {/* コンパクトモードのラベル */}
      {showLabels && compact && COMPACT_LABEL_POSITIONS.map((pos, i) => {
        const label = labels[i] || '';
        const rank = valueToRank(mainValues[i]);
        const color = RANK_COLORS[rank] || '#d4d4d8';
        const isHl = i === hlVertexIdx;
        return (
          <g key={i}>
            <text
              x={pos.tx} y={pos.ty1} textAnchor="middle"
              fill={isHl ? '#FFD700' : '#71717a'}
              fontSize="8" fontWeight="900"
              style={isHl ? { filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.5))' } : {}}
            >{label}</text>
            <text
              x={pos.tx} y={pos.ty2} textAnchor="middle"
              fill={isHl ? '#FFD700' : color}
              fontSize="10" fontWeight="900" fontStyle="italic"
            >{rank}</text>
          </g>
        );
      })}
    </svg>
  );
}
