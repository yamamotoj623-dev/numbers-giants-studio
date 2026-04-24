/**
 * layoutType: timeline
 * 時系列推移レイアウト。月別・週別のOPS/防御率などを折れ線で表示。
 * 朗報型（復調検証）・覚醒型に最適。
 * 
 * layoutData.timeline スキーマ:
 * {
 *   unit: "month" | "week",
 *   metric: "表示したい指標名（例: OPS）",
 *   points: [{ label: "4月", main: 0.724, sub: 0.598, highlight: false }]
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

export function TimelineLayout({ projectData, currentScript, animationKey , phase = 'normal'}) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const primaryColor = themeClass.primary;
  const data = projectData.layoutData?.timeline || {
    unit: 'month',
    metric: 'OPS',
    points: [
      { label: '4月', main: 0.724, sub: 0.598 },
      { label: '5月', main: 0.810, sub: 0.621 },
      { label: '6月', main: 0.755, sub: 0.580 },
    ],
  };

  const allVals = data.points.flatMap(p => [p.main, p.sub]).filter(v => typeof v === 'number');
  const maxVal = Math.max(...allVals) * 1.15;
  const minVal = Math.min(...allVals) * 0.85;
  const range = maxVal - minVal || 1;

  const chartW = 320;
  const chartH = 130;
  const padX = 30;
  const padY = 15;

  const scaleX = (i) => padX + (i * (chartW - 2 * padX) / Math.max(1, data.points.length - 1));
  const scaleY = (v) => padY + (chartH - 2 * padY) * (1 - (v - minVal) / range);

  const mainPath = data.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(p.main)}`).join(' ');
  const subPath  = data.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(p.sub)}`).join(' ');

  const isHighlight = phase === 'highlight' && highlightComp;

  return (
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-1 pb-[30%] px-3">
      <div className="absolute top-1 left-4 z-20 flex flex-col items-start gap-0.5">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${themeClass.bg} text-white shadow-md`}>{projectData.mainPlayer.label}</span>
      </div>
      <div className="absolute top-1 right-4 z-20 flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-black bg-zinc-700/80 text-zinc-300 px-1.5 py-0.5 rounded shadow-sm">比較</span>
          <span className="text-zinc-300 text-[12px] font-black drop-shadow-md">{projectData.subPlayer.name}</span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-700 text-zinc-300 shadow-md`}>{projectData.subPlayer.label}</span>
      </div>

      {/* ハイライト時はチャートを上に縮小、下にHighlightCard */}
      <div className={`z-20 mt-8 ${isHighlight ? 'mb-1' : 'mb-3'} w-full bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm transition-all duration-500`} style={isHighlight ? { transform: 'scale(0.7)', transformOrigin: 'top center' } : {}}>
        <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-between">
          <span className={`${themeClass.text} text-[10px] font-black`}>{data.metric} 推移</span>
          <span className="text-zinc-500 text-[9px] font-bold">単位: {data.unit === 'month' ? '月別' : '週別'}</span>
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <line key={i} x1={padX} y1={padY + (chartH - 2 * padY) * r} x2={chartW - padX} y2={padY + (chartH - 2 * padY) * r} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          ))}
          <path d={subPath} stroke="rgba(212,212,216,0.8)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
          <path d={mainPath} stroke={primaryColor} strokeWidth="2.5" fill="none" style={{ filter: `drop-shadow(0 0 4px ${themeClass.glow})` }} />
          {data.points.map((p, i) => (
            <g key={i}>
              <circle cx={scaleX(i)} cy={scaleY(p.sub)} r="2" fill="rgba(212,212,216,0.9)" />
              <circle cx={scaleX(i)} cy={scaleY(p.main)} r={p.highlight ? 4 : 3} fill={primaryColor} style={p.highlight ? { filter: `drop-shadow(0 0 6px ${primaryColor})` } : {}} />
            </g>
          ))}
          {data.points.map((p, i) => (
            <text key={i} x={scaleX(i)} y={chartH - 2} fontSize="8" fill="rgba(212,212,216,0.7)" textAnchor="middle" fontWeight="700">{p.label}</text>
          ))}
        </svg>
      </div>

      {/* ハイライト時: HighlightCard 大カード */}
      {isHighlight && (
        <HighlightCard comp={highlightComp} projectData={projectData} />
      )}
    </div>
  );
}
