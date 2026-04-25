/**
 * layoutType: pitch_arsenal
 * 投手の球種別投球割合＋被打率を可視化。
 * 「魔球の正体」「球種別の得意不得意」などの謎解き型動画に最適。
 *
 * layoutData.arsenal スキーマ:
 * {
 *   pitches: [
 *     { name: "ストレート", pct: 45, avg: 0.280, velocity: 148, color: "#ef4444" },
 *     { name: "スプリット", pct: 25, avg: 0.125, velocity: 138, color: "#a855f7" },
 *     { name: "スライダー", pct: 20, avg: 0.200, velocity: 132, color: "#10b981" },
 *     { name: "カーブ",     pct: 10, avg: 0.350, velocity: 115, color: "#f59e0b" },
 *   ]
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

export function PitchArsenalLayout({ projectData, currentScript, animationKey , phase = 'normal'}) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const data = projectData.layoutData?.arsenal || {
    pitches: [
      { name: 'ストレート', pct: 48, avg: 0.255, velocity: 147, color: '#ef4444' },
      { name: 'スプリット', pct: 26, avg: 0.125, velocity: 138, color: '#a855f7' },
      { name: 'スライダー', pct: 18, avg: 0.210, velocity: 132, color: '#10b981' },
      { name: 'カーブ',     pct: 8,  avg: 0.300, velocity: 115, color: '#f59e0b' },
    ],
  };

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 60;
  const innerRadius = 32;

  let angleAcc = -Math.PI / 2;

  const slices = data.pitches.map(pitch => {
    const angle = (pitch.pct / 100) * Math.PI * 2;
    const startAngle = angleAcc;
    const endAngle = angleAcc + angle;
    angleAcc = endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(startAngle);
    const iy1 = cy + innerRadius * Math.sin(startAngle);
    const ix2 = cx + innerRadius * Math.cos(endAngle);
    const iy2 = cy + innerRadius * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    const midAngle = (startAngle + endAngle) / 2;
    const labelX = cx + (radius + 12) * Math.cos(midAngle);
    const labelY = cy + (radius + 12) * Math.sin(midAngle);

    return { ...pitch, path, labelX, labelY };
  });

  return (
<>
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-7 pb-[35%] px-3">


      <div className="mb-2 bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
        <div className="px-3 py-1.5 border-b border-zinc-700/80 bg-zinc-800/30">
          <span className={`${themeClass.text} text-[10px] font-black`}>球種配分 & 被打率</span>
        </div>
        <div className="flex items-center justify-center p-1">
          <svg viewBox={`-30 -10 ${size + 60} ${size + 20}`} style={{ width: '60%', maxWidth: '180px' }}>
            {slices.map((s, i) => (
              <g key={i}>
                <path d={s.path} fill={s.color} stroke="#0d0d0f" strokeWidth="2" opacity="0.9"/>
                <text x={s.labelX} y={s.labelY} textAnchor="middle" dominantBaseline="central"
                      fontSize="10" fontWeight="900" fill={s.color} style={{ filter: `drop-shadow(0 0 3px ${s.color})` }}>
                  {s.pct}%
                </text>
              </g>
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)" fontWeight="700">配分</text>
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="900">{data.pitches.length}球種</text>
          </svg>
        </div>
      </div>

      <div className="bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden z-20">
        <div className={`px-3 py-1.5 border-b border-zinc-700/80 bg-zinc-800/30 grid ${data.comparePitches ? 'grid-cols-[1fr_56px_56px_56px]' : 'grid-cols-[1fr_50px_50px_45px]'} gap-2 items-center`}>
          <span className="text-[9px] font-black text-zinc-500 tracking-widest">球種</span>
          <span className="text-[9px] font-black text-zinc-500 tracking-widest text-right">配分</span>
          <span className="text-[9px] font-black text-zinc-500 tracking-widest text-right">球速</span>
          <span className="text-[9px] font-black text-zinc-500 tracking-widest text-right">被打率</span>
        </div>
        {data.pitches.map((pitch, i) => {
          const isBest = pitch.avg === Math.min(...data.pitches.map(p => p.avg));
          // 比較対象の同球種を探す
          const cmp = data.comparePitches?.find(p => p.name === pitch.name);
          return (
            <div key={i} className={`px-3 py-2 border-b border-zinc-800 last:border-b-0 grid ${data.comparePitches ? 'grid-cols-[1fr_56px_56px_56px]' : 'grid-cols-[1fr_50px_50px_45px]'} gap-2 items-center`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: pitch.color, boxShadow: `0 0 6px ${pitch.color}` }}/>
                <span className="text-[11px] font-black text-white truncate">{pitch.name}</span>
                {isBest && <span className="text-[8px] bg-amber-500 text-black font-black px-1 py-0.5 rounded flex-shrink-0">武器</span>}
              </div>
              {/* 配分 */}
              <div className="text-right">
                <div className="text-[12px] font-mono font-black text-zinc-300">{pitch.pct}%</div>
                {cmp && <div className="text-[8px] font-mono text-zinc-500 leading-none">→{cmp.pct}%</div>}
              </div>
              {/* 球速 */}
              <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-zinc-400">{pitch.velocity}<span className="text-[7px] text-zinc-600">km</span></div>
                {cmp && <div className="text-[8px] font-mono text-zinc-500 leading-none">→{cmp.velocity}km</div>}
              </div>
              {/* 被打率 */}
              <div className="text-right">
                <div className={`text-[12px] font-mono font-black ${isBest ? 'text-amber-400' : pitch.avg > 0.280 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {pitch.avg.toFixed(3).replace(/^0/, '')}
                </div>
                {cmp && <div className="text-[8px] font-mono text-zinc-500 leading-none">→{cmp.avg.toFixed(3).replace(/^0/, '')}</div>}
              </div>
            </div>
          );
        })}
        {data.compareLabel && (
          <div className="px-3 py-1 bg-zinc-800/40 text-[8px] text-zinc-500 text-right">
            ※ 数値→以降は「{data.compareLabel}」との比較
          </div>
        )}
      </div>

    </div>

    {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}

  </>
  );
}
