/**
 * layoutType: pitch_heatmap
 * ストライクゾーン9分割の配球ヒートマップ。
 * 投手: ゾーン別被打率 / 打者: ゾーン別打率の可視化。
 * 田中瑛斗の「対左打者弱点」のような分析に最適。
 *
 * layoutData.heatmap スキーマ:
 * {
 *   mode: "pitcher_against" | "batter_vs_zone",   // 被打率 or 打率
 *   grid: [
 *     [{ value: 0.180, count: 12 }, ...],    // row 0: high
 *     [...],                                  // row 1: middle
 *     [...]                                   // row 2: low
 *   ],
 *   handedness: "right" | "left"   // 対左打者 / 対右打者
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

export function PitchHeatmapLayout({ projectData, currentScript, animationKey , phase = 'normal'}) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const data = projectData.layoutData?.heatmap || {
    mode: 'pitcher_against',
    handedness: 'left',
    grid: [
      [{ value: 0.125, count: 8 }, { value: 0.200, count: 10 }, { value: 0.357, count: 14 }],
      [{ value: 0.182, count: 11 }, { value: 0.250, count: 12 }, { value: 0.400, count: 15 }],
      [{ value: 0.143, count: 7 },  { value: 0.222, count: 9 },  { value: 0.380, count: 10 }],
    ],
  };

  const modeLabel = data.mode === 'pitcher_against' ? '被打率' : '打率';
  const title = data.mode === 'pitcher_against'
    ? `対${data.handedness === 'left' ? '左' : '右'}打者 ゾーン別${modeLabel}`
    : `ゾーン別${modeLabel}`;

  const getColor = (value) => {
    const clamped = Math.max(0.1, Math.min(0.4, value));
    const t = (clamped - 0.1) / 0.3;
    if (t < 0.33) {
      const r = t / 0.33;
      return `rgba(${Math.round(59 + r*(250-59))},${Math.round(130 - r*(130-50))},${Math.round(246 - r*(246-20))},0.85)`;
    } else if (t < 0.66) {
      const r = (t - 0.33) / 0.33;
      return `rgba(250,${Math.round(204 - r*(204-150))},${Math.round(20 + r*(50-20))},0.9)`;
    } else {
      const r = (t - 0.66) / 0.34;
      return `rgba(${Math.round(239 + r*(255-239))},${Math.round(68 - r*68)},${Math.round(68 - r*68)},0.95)`;
    }
  };

  const zoneW = 90;
  const zoneH = 70;
  const gap = 2;
  const totalW = zoneW * 3 + gap * 2;
  const totalH = zoneH * 3 + gap * 2;

  return (
<>
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-1 pb-[30%] px-3">

      <div className="absolute top-1 left-4 z-20">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${themeClass.bg} text-white shadow-md`}>{projectData.mainPlayer.label}</span>
      </div>
      <div className="absolute top-1 right-4 z-20">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-700 text-zinc-300 shadow-md">
          {data.handedness === 'left' ? '対左打者' : '対右打者'}
        </span>
      </div>

      <div className="mt-8 mb-2 bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
        <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-between">
          <span className={`${themeClass.text} text-[10px] font-black`}>{title}</span>
          <span className="text-zinc-500 text-[9px] font-bold">高: ↑ / 低: ↓</span>
        </div>

        <div className="p-3 flex items-center justify-center relative">
          <div className="absolute left-1 top-8 text-[9px] font-bold text-zinc-500">高</div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-500">中</div>
          <div className="absolute left-1 bottom-4 text-[9px] font-bold text-zinc-500">低</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-bold text-zinc-500 px-8 flex justify-between w-full">
            <span>内</span><span>中</span><span>外</span>
          </div>

          <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: '80%', maxWidth: '260px' }}>
            {data.grid.map((row, rowIdx) =>
              row.map((cell, colIdx) => {
                const x = colIdx * (zoneW + gap);
                const y = rowIdx * (zoneH + gap);
                const color = getColor(cell.value);
                const isHot = cell.value >= 0.300;
                const isCold = cell.value <= 0.150;
                return (
                  <g key={`${rowIdx}-${colIdx}`}>
                    <rect x={x} y={y} width={zoneW} height={zoneH} fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" rx="4"/>
                    <text x={x + zoneW/2} y={y + zoneH/2 - 4}
                          fontSize="24" fontWeight="900" fill="#fff"
                          textAnchor="middle" dominantBaseline="central"
                          style={{ textShadow: '2px 2px 3px rgba(0,0,0,0.8)' }}>
                      {cell.value.toFixed(3).replace(/^0/, '')}
                    </text>
                    <text x={x + zoneW/2} y={y + zoneH/2 + 18}
                          fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.8)"
                          textAnchor="middle">
                      {cell.count}打席
                    </text>
                    {isHot && <text x={x + zoneW - 10} y={y + 12} fontSize="12" textAnchor="middle">🔥</text>}
                    {isCold && <text x={x + zoneW - 10} y={y + 12} fontSize="12" textAnchor="middle">❄</text>}
                  </g>
                );
              })
            )}
          </svg>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/50 border-t border-zinc-700/50 text-[9px] font-bold text-zinc-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(59,130,246,0.85)' }}/>〜.150</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(250,204,20,0.9)' }}/>.200〜.250</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.95)' }}/>.300〜</span>
        </div>
      </div>

    </div>

    {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}

  </>
  );
}
