/**
 * TimelineLayout 横長 (16:9) 専用バリアント ()
 *
 * 構図:
 *   上半分を SVG でフルワイドに使う折れ線
 *   - 横長は時系列の「長期推移」を魅せられる
 *   - X軸: 月/週/日ラベル、Y軸: 自動スケール
 *   - main 線: 主役色、太め
 *   - sub 線: 比較 (リーグ平均/前年/ライバル) 細めの破線
 *   - isPeak/isBottom にバッジマーク
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../../components/HighlightCard.jsx';

export function TimelineLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;
  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // データ取得 (互換性レイヤ含む)
  const raw = projectData.layoutData?.timeline || projectData.layoutData;
  const tlData = (raw && Array.isArray(raw?.timeline?.points)) ? raw.timeline
    : (raw && Array.isArray(raw?.points)) ? raw
    : { unit: 'month', metric: 'OPS', points: [
        { label: '4月', value: '.724' },
        { label: '5月', value: '.810', isPeak: true },
        { label: '6月', value: '.945' },
        { label: '7月', value: '.678', isBottom: true },
      ]};

  const points = (tlData.points || []).map(p => {
    const v = p.value !== undefined ? p.value : p.main;
    const num = typeof v === 'string' ? parseFloat(v.replace(/[^\d.\-]/g, '')) : Number(v);
    const subNum = p.sub !== undefined ? (typeof p.sub === 'string' ? parseFloat(String(p.sub).replace(/[^\d.\-]/g, '')) : Number(p.sub)) : null;
    return { label: p.label, value: num, sub: subNum, raw: v, rawSub: p.sub, isPeak: p.isPeak, isBottom: p.isBottom, highlight: p.highlight };
  }).filter(p => !isNaN(p.value));

  if (points.length < 2) {
    return <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">データ不足</div>;
  }

  // SVG 描画範囲
  const W = 580, H = 200;
  const padX = 30, padTop = 24, padBottom = 32;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  // Y軸スケール — main + sub 含めて min/max を取る
  const allValues = points.flatMap(p => [p.value, p.sub].filter(v => v !== null && !isNaN(v)));
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = (maxV - minV) || 0.001;
  const yPad = range * 0.15;
  const yMin = minV - yPad;
  const yMax = maxV + yPad;

  const xAt = (i) => padX + (innerW * i) / (points.length - 1);
  const yAt = (v) => padTop + innerH * (1 - (v - yMin) / (yMax - yMin));

  const mainPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.value)}`).join(' ');
  const hasSub = points.some(p => p.sub !== null && !isNaN(p.sub));
  const subPath = hasSub ? points.map((p, i) =>
    p.sub !== null && !isNaN(p.sub) ? `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.sub)}` : ''
  ).join(' ') : '';

  // フォーマッタ (.724 みたいな表示用)
  const fmt = (v) => {
    if (typeof v !== 'number' || isNaN(v)) return '-';
    if (Math.abs(v) < 1) return v.toFixed(3).replace(/^-?0\./, m => m.startsWith('-') ? '-.' : '.');
    return v.toFixed(2);
  };

  return (
    <>
      <div
        key={`tl-l-${animationKey}`}
        className="absolute z-10 flex flex-col"
        style={{ top: 32, bottom: '42%', left: 14, right: 14 }}
      >
        {/* ヘッダー: 指標名は中央、凡例は右 */}
        <div className="relative flex items-center mb-1 px-2" style={{ minHeight: 22 }}>
          {/* 中央: 指標名 + 単位 */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-2">
            <span className={`text-[16px] font-impact ${themeClass.text}`}
                  style={{ textShadow: `0 0 12px ${themeClass.glow}80` }}>
              {tlData.metric || 'OPS'}
            </span>
            <span className="text-[10px] text-zinc-400">
              推移{tlData.unit === 'month' ? ' (月別)' : tlData.unit === 'week' ? ' (週別)' : tlData.unit === 'day' ? ' (日別)' : tlData.unit === 'year' ? ' (年別)' : ''}
            </span>
          </div>
          {/* 右: 凡例 */}
          {hasSub && (
            <span className="ml-auto text-[9px] flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5" style={{ background: themeClass.primary }}></span>
                <span className={themeClass.text}>{projectData.mainPlayer?.label || '主役'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5" style={{ background: '#38bdf8', borderTop: '1px dashed #38bdf8' }}></span>
                <span className="text-sky-300">{projectData.subPlayer?.label || '比較'}</span>
              </span>
            </span>
          )}
        </div>

        {/* SVG グラフ */}
        <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 w-full" preserveAspectRatio="none">
          {/* グリッド線 (Y) */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <line
              key={i}
              x1={padX} x2={W - padX}
              y1={padTop + innerH * r} y2={padTop + innerH * r}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
          ))}

          {/* sub 線 (破線) */}
          {hasSub && (
            <path
              d={subPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.7"
              style={{ animation: 'radarFadeIn 0.6s ease-out 0.2s backwards' }}
            />
          )}

          {/* main 線 */}
          <path
            d={mainPath}
            fill="none"
            stroke={themeClass.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 6px ${themeClass.glow})`,
              strokeDasharray: 1000,
              strokeDashoffset: 0,
              animation: 'tlPathDraw 1.2s ease-out forwards',
            }}
          />

          {/* main ドット + ラベル */}
          {points.map((p, i) => {
            const cx = xAt(i);
            const cy = yAt(p.value);
            const isFocus = p.isPeak || p.isBottom || p.highlight;
            return (
              <g key={i} style={{ animation: `tlDotIn 0.4s var(--spring-bounce) ${0.6 + i * 0.08}s backwards` }}>
                <circle
                  cx={cx} cy={cy} r={isFocus ? 6 : 4}
                  fill={isFocus ? themeClass.primary : '#fff'}
                  stroke={themeClass.primary}
                  strokeWidth="2"
                  style={isFocus ? { filter: `drop-shadow(0 0 8px ${themeClass.glow})` } : {}}
                />
                {/* 値ラベル (ピーク/底のみ) */}
                {isFocus && (
                  <text
                    x={cx} y={cy - 12}
                    fill="#fff" fontSize="11" fontWeight="900"
                    textAnchor="middle"
                    style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.8))` }}
                  >
                    {fmt(p.value)}
                  </text>
                )}
                {/* X軸ラベル */}
                <text
                  x={cx} y={H - 10}
                  fill="#a1a1aa" fontSize="10" fontWeight="700"
                  textAnchor="middle"
                >
                  {p.label}
                </text>
                {/* ピーク/底マーク */}
                {p.isPeak && <text x={cx + 8} y={cy - 4} fill="#fbbf24" fontSize="11">▲</text>}
                {p.isBottom && <text x={cx + 8} y={cy + 12} fill="#f87171" fontSize="11">▼</text>}
              </g>
            );
          })}
        </svg>
      </div>

      {/* tlPath の keyframe を局所的に挿入 */}
      <style>{`
        @keyframes tlPathDraw {
          0% { stroke-dasharray: 1000; stroke-dashoffset: 1000; opacity: 0; }
          15% { opacity: 1; }
          100% { stroke-dasharray: 1000; stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes tlDotIn {
          0% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.4); }
          100% { transform: scale(1); }
        }
      `}</style>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}
