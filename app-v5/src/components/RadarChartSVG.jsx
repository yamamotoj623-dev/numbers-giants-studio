/**
 * v5.0.0 UI確定版 レーダーチャートSVG
 * デモv15と1対1対応:
 * - 通常: viewBox 0 0 240 220、中心 (120,110)、半径60
 * - コンパクト: viewBox 0 0 150 110、中心 (75,55)、半径35
 * - ラベルは背景rect付きバッジ (通常のみ)、コンパクトはプレーンテキスト
 * - CSSクラス radar-main-poly / radar-sub-poly / radar-dot / radar-label-group が
 *   GlobalStylesのアニメーションと連動
 */

import React from 'react';

// 5軸の方向ベクトル (五角形、-90度から開始、時計回り)
// -90, -18, 54, 126, 198 度
const AXIS_ANGLES = [-90, -18, 54, 126, 198].map(d => d * Math.PI / 180);

// 通常サイズ: 半径60で最大値(100)の時の頂点を計算
// 0度=右、-90=上 (SVG座標)
// (R * cos, R * sin)
// angle=-90: (0, -60)
// angle=-18: (57.06, -18.54)
// angle=54:  (35.27, 48.54)
// angle=126: (-35.27, 48.54)
// angle=198: (-57.06, -18.54)

// コンパクトは半径35
// angle=-90: (0, -35)
// angle=-18: (33.28, -10.82)
// angle=54:  (20.58, 28.32)
// angle=126: (-20.58, 28.32)
// angle=198: (-33.28, -10.82)

// ラベル位置 (通常、240x220 viewBox)
const LABEL_POSITIONS = [
  { x: 95, y: 16,  w: 50, h: 28, tx: 120, ty1: 27, ty2: 40 },  // 上: 長打力
  { x: 190, y: 72, w: 46, h: 28, tx: 213, ty1: 83, ty2: 96 },  // 右上: 出塁力
  { x: 168, y: 168, w: 46, h: 28, tx: 191, ty1: 179, ty2: 192 }, // 右下: 選球眼
  { x: 26, y: 168, w: 46, h: 28, tx: 49, ty1: 179, ty2: 192 }, // 左下: 得点力
  { x: 4, y: 72, w: 46, h: 28, tx: 27, ty1: 83, ty2: 96 },  // 左上: HR率
];

// コンパクトラベル位置 (150x110 viewBox)
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

function computePoints(values, maxR) {
  return values.map((v, i) => {
    const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
    const x = r * Math.cos(AXIS_ANGLES[i]);
    const y = r * Math.sin(AXIS_ANGLES[i]);
    return { x: +x.toFixed(2), y: +y.toFixed(2) };
  });
}

function pointsToString(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

export function RadarChartSVG({ stats, highlight, comparisons, compact = false }) {
  if (!stats) return null;

  const keys = Object.keys(stats);
  const mainValues = keys.map(k => stats[k].main);
  const subValues = keys.map(k => stats[k].sub);
  const labels = keys.map(k => stats[k].label);

  const maxR = compact ? 35 : 60;
  const viewBox = compact ? '0 0 150 110' : '0 0 240 220';
  const transform = compact ? 'translate(75 55)' : 'translate(120 110)';

  const mainPts = computePoints(mainValues, maxR);
  const subPts = computePoints(subValues, maxR);
  const full100Pts = computePoints([100,100,100,100,100], maxR);

  // ガイド5段
  const guide = (scale) => pointsToString(computePoints([100,100,100,100,100].map(() => scale*100), maxR));

  // ハイライト対象頂点のインデックス (radarStatsのキー配列上で探す)
  // highlight(=comparison.id) に対応するradarLabelを持つradarStatsキーを探す
  let highlightIdx = -1;
  if (highlight && comparisons) {
    const comp = comparisons.find(c => c.id === highlight);
    if (comp?.radarMatch) {
      highlightIdx = keys.findIndex(k => stats[k]?.label === comp.radarMatch);
    }
  }
  const hlVertex = highlightIdx >= 0 ? mainPts[highlightIdx] : null;

  return (
    <svg viewBox={viewBox} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <g transform={transform}>
        {/* ガイド */}
        {!compact && (
          <>
            <polygon points={guide(1.0)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
            <polygon points={guide(0.75)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6"/>
            <polygon points={guide(0.5)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6"/>
            <polygon points={guide(0.25)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6"/>
          </>
        )}
        {compact && (
          <>
            <polygon points={guide(1.0)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6"/>
            <polygon points={guide(0.5)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
          </>
        )}

        {/* 軸線 */}
        {full100Pts.map((p, i) => {
          const isHlAxis = i === highlightIdx;
          return (
            <line
              key={i}
              x1={0} y1={0} x2={p.x} y2={p.y}
              stroke={isHlAxis ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.12)'}
              strokeWidth={isHlAxis ? 1 : (compact ? 0.4 : 0.5)}
            />
          );
        })}

        {/* メイン (今季) */}
        <polygon
          className="radar-main-poly"
          points={pointsToString(mainPts)}
          fill="rgba(249,115,22,0.35)"
          stroke="#f97316"
          strokeWidth={compact ? 1.5 : 2}
          style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.6))' }}
        />

        {/* サブ (昨季/相手) */}
        {!compact && (
          <polygon
            className="radar-sub-poly"
            points={pointsToString(subPts)}
            fill="rgba(161,161,170,0.2)"
            stroke="#d4d4d8"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        )}

        {/* 頂点ドット (通常のみ) */}
        {!compact && mainPts.map((p, i) => (
          <circle
            key={i}
            className="radar-dot"
            cx={p.x} cy={p.y} r="3"
            fill="#f97316"
            style={{ filter: 'drop-shadow(0 0 4px #f97316)', transformOrigin: `${p.x}px ${p.y}px`, transformBox: 'fill-box' }}
          />
        ))}

        {/* ハイライト頂点 (金色) */}
        {hlVertex && (
          <g className="vertex-glow" style={{ transformOrigin: `${hlVertex.x}px ${hlVertex.y}px` }}>
            <circle cx={hlVertex.x} cy={hlVertex.y} r="5" fill="#FFD700" style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }}/>
            <circle cx={hlVertex.x} cy={hlVertex.y} r="2" fill="#fff"/>
          </g>
        )}
      </g>

      {/* ラベル (通常) */}
      {!compact && LABEL_POSITIONS.map((pos, i) => {
        const label = labels[i] || '';
        const rank = valueToRank(mainValues[i]);
        const color = RANK_COLORS[rank] || '#d4d4d8';
        const isHl = i === highlightIdx;
        return (
          <g key={i} className="radar-label-group">
            <rect
              x={pos.x} y={pos.y}
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

      {/* ラベル (コンパクト) */}
      {compact && COMPACT_LABEL_POSITIONS.map((pos, i) => {
        const label = labels[i] || '';
        const rank = valueToRank(mainValues[i]);
        const color = RANK_COLORS[rank] || '#d4d4d8';
        const isHl = i === highlightIdx;
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
