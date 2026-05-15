/**
 * layoutType: timeline (v2)
 * 時系列推移レイアウト。ドラマチックに「変化」を見せる。
 *
 * layoutData.timeline スキーマ (v2):
 * {
 *   unit: "day" | "week" | "month" | "year",   // 軸の単位
 *   metric: "OPS",                              // 指標名 (表示用)
 *   points: [
 *     {
 *       label: "4月",                           // X軸ラベル
 *       value: 0.724,                           // メイン値
 *       highlight?: boolean,                    // ★転換点の強調
 *       isPeak?: boolean,                       // 最高点演出 (任意、AI生成)
 *       isBottom?: boolean                      // 最低点演出 (任意)
 *     }
 *   ],
 *   compareLine?: [                             // 任意: 比較線 (リーグ平均など)
 *     { label: "4月", value: 0.598 }
 *   ]
 * }
 *
 * 互換性レイヤ:
 * - 旧 `points[].main` → `value` として読む
 * - 旧 `points[].sub` → 自動で compareLine に集約
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

const UNIT_LABEL = {
  day: '日別',
  week: '週別',
  month: '月別',
  year: '年別',
};

export function TimelineLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const primaryColor = themeClass.primary;

  // ★最重要: 互換性レイヤ (Geminiが二重ネストで吐く問題への対応) ★
  // パターン1 (正): { points: [...] }
  // パターン2 (Gemini誤): { timeline: { points: [...] } }
  // パターン3 (旧): { points: [{main, sub}] }
  const rawData = (() => {
    let raw = projectData.layoutData?.timeline;

    // 二重ネスト検出: 内側に timeline キーがあったら 1階層下りる
    if (raw && typeof raw === 'object' && raw.timeline && Array.isArray(raw.timeline.points)) {
      raw = raw.timeline;
    }

    // データ無効ならデフォルト
    if (!raw || !Array.isArray(raw.points) || raw.points.length === 0) {
      return {
        unit: 'month',
        metric: 'OPS',
        points: [
          { label: '4月', value: 0.724 },
          { label: '5月', value: 0.810, highlight: true },
          { label: '6月', value: 0.755 },
        ],
      };
    }
    return raw;
  })();

  // === 互換性レイヤ ===
  // 旧スキーマ points[].main / sub を新スキーマ value / compareLine に変換
  // null 値を許容 (線を切る/系列入替表現用)
  const data = (() => {
    const points = (rawData.points || [])
      .map(p => {
        if (!p || typeof p !== 'object') return null;
        // 旧 main → 新 value
        const rawValue = p.value !== undefined ? p.value : p.main;
        // ★null/undefined/空文字★ は null として保持 (線を切る)
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          return { ...p, value: null };
        }
        const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
        if (typeof value !== 'number' || isNaN(value)) {
          return { ...p, value: null };
        }
        return { ...p, value };
      })
      .filter(p => p !== null);   // 完全に nullable な要素 (オブジェクトでない) のみ除外

    let compareLine = rawData.compareLine;
    // 旧 sub → compareLine 自動生成 (★null も保持★)
    if (!compareLine && (rawData.points || []).some(p => p && p.sub !== undefined)) {
      compareLine = rawData.points
        .filter(p => p && p.sub !== undefined)
        .map(p => {
          if (p.sub === null || p.sub === undefined || p.sub === '') {
            return { label: p.label, value: null };
          }
          const v = typeof p.sub === 'string' ? parseFloat(p.sub) : p.sub;
          return { label: p.label, value: (typeof v === 'number' && !isNaN(v)) ? v : null };
        });
    }

    return {
      unit: rawData.unit || 'month',
      metric: rawData.metric || '',
      mainLabel: rawData.mainLabel || '',
      subLabel: rawData.subLabel || '',
      points: points.length > 0 ? points : [
        { label: '-', value: 0 },
        { label: '-', value: 0 },
      ],
      compareLine,
    };
  })();

  // === ドラマ性: ピーク・ボトムを自動判定 (明示指定なければ) ===
  const enhancedPoints = (() => {
    const values = data.points.map(p => p.value).filter(v => typeof v === 'number');
    if (values.length === 0) return data.points;
    const max = Math.max(...values);
    const min = Math.min(...values);
    return data.points.map(p => {
      const isPeak = p.isPeak ?? (p.value === max && values.length > 2);
      const isBottom = p.isBottom ?? (p.value === min && values.length > 2);
      return { ...p, isPeak, isBottom };
    });
  })();

  // 上昇/下降のセグメント色を判定
  const getSegmentColor = (p1, p2) => {
    if (typeof p1.value !== 'number' || typeof p2.value !== 'number') return primaryColor;
    if (p2.value > p1.value * 1.05) return '#fbbf24'; // ゴールド (上昇)
    if (p2.value < p1.value * 0.95) return '#ef4444'; // レッド (下降)
    return primaryColor; // 通常
  };

  // === スケール計算 ===
  const allVals = [
    ...enhancedPoints.map(p => p.value),
    ...(data.compareLine?.map(c => c.value) || []),
  ].filter(v => typeof v === 'number');
  const maxVal = Math.max(...allVals) * 1.15 || 1;
  const minVal = Math.min(...allVals) * 0.85 || 0;
  const range = maxVal - minVal || 1;

  const chartW = 320;
  const chartH = 180;
  const padX = 36;
  const padY = 30;

  const scaleX = (i) => padX + (i * (chartW - 2 * padX) / Math.max(1, enhancedPoints.length - 1));
  const scaleY = (v) => padY + (chartH - 2 * padY) * (1 - (v - minVal) / range);

  // 比較線パス: null 値で線を切る (M/L を null 直前で打ち切る)
  const comparePath = data.compareLine
    ? (() => {
        const segs = [];
        let lastIdx = -1; // 最後に有効だった点
        data.compareLine.forEach((c, i) => {
          if (typeof c.value !== 'number') {
            lastIdx = -1; // 線を切る
            return;
          }
          if (lastIdx === -1) {
            segs.push(`M${scaleX(i)},${scaleY(c.value)}`);
          } else {
            segs.push(`L${scaleX(i)},${scaleY(c.value)}`);
          }
          lastIdx = i;
        });
        return segs.join(' ');
      })()
    : null;

  // メイン線をセグメントごとに分けて色変化を表現
  const mainSegments = [];
  for (let i = 0; i < enhancedPoints.length - 1; i++) {
    const p1 = enhancedPoints[i];
    const p2 = enhancedPoints[i + 1];
    if (typeof p1.value !== 'number' || typeof p2.value !== 'number') continue;
    mainSegments.push({
      d: `M${scaleX(i)},${scaleY(p1.value)} L${scaleX(i + 1)},${scaleY(p2.value)}`,
      color: getSegmentColor(p1, p2),
      isJumpUp: p2.value > p1.value * 1.1,
      isJumpDown: p2.value < p1.value * 0.9,
    });
  }

  const isHighlight = phase === 'highlight' && highlightComp;

  return (
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[32%] px-3">
      {/* ハイライト時はチャートを上に縮小 */}
      <div className={`z-20 ${isHighlight ? 'mb-1' : 'mb-3'} w-full bg-zinc-900/78 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm transition-all duration-500`} style={isHighlight ? { transform: 'scale(0.55)', transformOrigin: 'top center' } : {}}>
        <div className="px-4 py-2.5 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-between">
          <span className={`${themeClass.text} text-[14px] font-black`}>{data.metric} 推移</span>
          <span className="text-zinc-400 text-[11px] font-bold">{UNIT_LABEL[data.unit] || '月別'}</span>
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
          {/* 背景グリッド線 */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <line
              key={i}
              x1={padX}
              y1={padY + (chartH - 2 * padY) * r}
              x2={chartW - padX}
              y2={padY + (chartH - 2 * padY) * r}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          ))}

          {/* 比較線 (任意) */}
          {comparePath && (
            <path
              d={comparePath}
              stroke="rgba(212,212,216,0.6)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 3"
            />
          )}

          {/* メイン線 (セグメントごとに色変化) */}
          {mainSegments.map((seg, i) => (
            <path
              key={`seg-${i}`}
              d={seg.d}
              stroke={seg.color}
              strokeWidth={seg.isJumpUp || seg.isJumpDown ? 4 : 3}
              fill="none"
              style={{
                filter: `drop-shadow(0 0 ${seg.isJumpUp || seg.isJumpDown ? 6 : 4}px ${seg.color}60)`,
              }}
            />
          ))}

          {/* 比較線の点 (null は描画しない) */}
          {data.compareLine?.filter(c => typeof c.value === 'number').map((c, i) => {
            // null 値を含む場合、index がズレるので元 array での index を使う
            const origIdx = data.compareLine.indexOf(c);
            return (
              <circle
                key={`cmp-${origIdx}`}
                cx={scaleX(origIdx)}
                cy={scaleY(c.value)}
                r="2.5"
                fill="rgba(212,212,216,0.7)"
              />
            );
          })}

          {/* メイン点 + ラベル */}
          {enhancedPoints.map((p, i) => {
            if (typeof p.value !== 'number') return null;
            const radius = p.highlight ? 7 : (p.isPeak || p.isBottom ? 5.5 : 4);
            const fillColor = p.highlight
              ? '#fde047'  // 強調はゴールド
              : p.isBottom
                ? '#ef4444'
                : primaryColor;
            return (
              <g key={`pt-${i}`}>
                {/* 強調点の脈動光輪 */}
                {p.highlight && (
                  <circle
                    cx={scaleX(i)}
                    cy={scaleY(p.value)}
                    r="11"
                    fill="none"
                    stroke={fillColor}
                    strokeWidth="1.5"
                    opacity="0.6"
                    style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                  />
                )}
                <circle
                  cx={scaleX(i)}
                  cy={scaleY(p.value)}
                  r={radius}
                  fill={fillColor}
                  style={p.highlight || p.isPeak ? { filter: `drop-shadow(0 0 8px ${fillColor})` } : {}}
                />
                {/* 注釈テキスト (例: 「移籍」「故障」) */}
                {p.note && !isHighlight && (
                  <text
                    x={scaleX(i)}
                    y={scaleY(p.value) - (p.highlight ? 28 : 22)}
                    fontSize="9"
                    fill="#fde047"
                    textAnchor="middle"
                    fontWeight="900"
                    style={{ filter: `drop-shadow(0 0 4px rgba(0,0,0,1))` }}
                  >
                    🚩 {p.note}
                  </text>
                )}
                {/* 数値ラベル (ハイライト点だけ大きく) */}
                {!isHighlight && (
                  <text
                    x={scaleX(i)}
                    y={scaleY(p.value) - (p.highlight ? 12 : 9)}
                    fontSize={p.highlight ? 13 : 11}
                    fill={fillColor}
                    textAnchor="middle"
                    fontWeight="900"
                    style={{ filter: `drop-shadow(0 0 3px rgba(0,0,0,0.9))` }}
                  >
                    {(() => {
                      // 文字列 ".333" でも数値 0.333 でも動くよう Number 正規化
                      const v = Number(p.value);
                      if (!isFinite(v)) return '-';
                      return v < 10 ? v.toFixed(3).replace(/^0/, '') : v.toFixed(0);
                    })()}
                  </text>
                )}
              </g>
            );
          })}

          {/* X軸ラベル */}
          {enhancedPoints.map((p, i) => (
            <text
              key={`lbl-${i}`}
              x={scaleX(i)}
              y={chartH - 6}
              fontSize="11"
              fill="rgba(212,212,216,0.85)"
              textAnchor="middle"
              fontWeight="800"
            >
              {p.label}
            </text>
          ))}

          {/* 系列ラベル凡例 (右上、main/sub 名) */}
          {(data.mainLabel || data.subLabel) && (
            <g>
              {data.mainLabel && (
                <>
                  <line x1={chartW - 90} y1={padY - 16} x2={chartW - 76} y2={padY - 16} stroke={primaryColor} strokeWidth="3" />
                  <text x={chartW - 72} y={padY - 13} fontSize="9" fill={primaryColor} fontWeight="800">{data.mainLabel}</text>
                </>
              )}
              {data.subLabel && data.compareLine && (
                <>
                  <line x1={chartW - 90} y1={padY - 6} x2={chartW - 76} y2={padY - 6} stroke="rgba(212,212,216,0.7)" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x={chartW - 72} y={padY - 3} fontSize="9" fill="rgba(212,212,216,0.85)" fontWeight="700">{data.subLabel}</text>
                </>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* ハイライト時: HighlightCard 大カード */}
      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </div>
  );
}
