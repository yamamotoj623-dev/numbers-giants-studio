/**
 * layoutType: spray_chart
 * 打球方向マップ。野球場のイラストに打球分布を重ねて可視化。
 * 引っ張り/流し打ち分析、守備シフト考察に最適。
 *
 * layoutData.spray スキーマ:
 * {
 *   handedness: "right" | "left",            // 打者の利き手
 *   hits: [
 *     { x: 0.3, y: 0.4, type: "1B"|"2B"|"3B"|"HR"|"OUT", zone: "left"|"center"|"right" }
 *   ],
 *   zoneStats: {
 *     left:   { avg: 0.285, count: 12 },
 *     center: { avg: 0.310, count: 18 },
 *     right:  { avg: 0.220, count: 8 }
 *   }
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';

export function SprayChartLayout({ projectData, currentScript, animationKey , phase = 'normal'}) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const primaryColor = themeClass.primary;
  const data = projectData.layoutData?.spray || {
    handedness: 'right',
    hits: [
      { x: 0.30, y: 0.45, type: '1B', zone: 'left' },
      { x: 0.25, y: 0.35, type: '2B', zone: 'left' },
      { x: 0.50, y: 0.25, type: 'HR', zone: 'center' },
      { x: 0.52, y: 0.40, type: '1B', zone: 'center' },
      { x: 0.70, y: 0.50, type: 'OUT', zone: 'right' },
      { x: 0.75, y: 0.55, type: 'OUT', zone: 'right' },
      { x: 0.35, y: 0.55, type: 'OUT', zone: 'left' },
      { x: 0.45, y: 0.30, type: '1B', zone: 'center' },
    ],
    zoneStats: {
      left:   { avg: 0.315, count: 12 },
      center: { avg: 0.280, count: 18 },
      right:  { avg: 0.195, count: 8 },
    },
  };

  const fieldW = 340;
  const fieldH = 280;

  const typeColor = {
    HR:  '#FFD700',
    '3B': '#ef4444',
    '2B': '#f97316',
    '1B': '#10b981',
    OUT: '#52525b',
  };

  const typeRadius = {
    HR: 5.5, '3B': 4.5, '2B': 4, '1B': 3.5, OUT: 2.5,
  };

  return (
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-1 pb-2 px-3">

      <div className="absolute top-1 left-4 z-20">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${themeClass.bg} text-white shadow-md`}>{projectData.mainPlayer.label}</span>
      </div>
      <div className="absolute top-1 right-4 z-20">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-700 text-zinc-300 shadow-md`}>
          {data.handedness === 'right' ? '右打ち' : '左打ち'}
        </span>
      </div>

      <div className="mt-8 mb-3 bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
        <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-between">
          <span className={`${themeClass.text} text-[10px] font-black`}>打球方向マップ</span>
          <span className="text-zinc-500 text-[9px] font-bold">{data.hits.length}打席分</span>
        </div>

        <svg viewBox={`0 0 ${fieldW} ${fieldH}`} className="w-full">
          <defs>
            <radialGradient id="field-grass" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#0a3b1a"/>
              <stop offset="60%" stopColor="#081c0c"/>
              <stop offset="100%" stopColor="#030a05"/>
            </radialGradient>
          </defs>

          <path d={`M ${fieldW/2} ${fieldH*0.95} L ${fieldW*0.05} ${fieldH*0.45} Q ${fieldW/2} ${-fieldH*0.15} ${fieldW*0.95} ${fieldH*0.45} Z`} fill="url(#field-grass)" />
          <circle cx={fieldW/2} cy={fieldH*0.95} r="5" fill="#ffffff" opacity="0.3"/>

          <path d={`M ${fieldW/2} ${fieldH*0.95} L ${fieldW*0.38} ${fieldH*0.78} L ${fieldW/2} ${fieldH*0.58} L ${fieldW*0.62} ${fieldH*0.78} Z`}
                fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>

          <path d={`M ${fieldW/2} ${fieldH*0.95} L ${fieldW*0.05} ${fieldH*0.45}`} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 2"/>
          <path d={`M ${fieldW/2} ${fieldH*0.95} L ${fieldW*0.95} ${fieldH*0.45}`} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 2"/>

          <path d={`M ${fieldW*0.16} ${fieldH*0.85} Q ${fieldW/2} ${fieldH*0.15} ${fieldW*0.84} ${fieldH*0.85}`}
                fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="1 2"/>

          <text x={fieldW*0.15} y={fieldH*0.4} fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="700" textAnchor="middle">左</text>
          <text x={fieldW/2}    y={fieldH*0.18} fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="700" textAnchor="middle">中</text>
          <text x={fieldW*0.85} y={fieldH*0.4} fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="700" textAnchor="middle">右</text>

          {data.hits.map((hit, i) => {
            const cx = hit.x * fieldW;
            const cy = hit.y * fieldH;
            const color = typeColor[hit.type] || '#888';
            const r = typeRadius[hit.type] || 3;
            const isHighlighted = currentScript?.highlight === 'zone_' + hit.zone;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r + 3} fill={color} opacity="0.18"/>
                <circle cx={cx} cy={cy} r={r} fill={color} stroke="#000" strokeWidth="0.5" opacity={isHighlighted ? 1 : 0.9}/>
              </g>
            );
          })}
        </svg>

        <div className="grid grid-cols-5 gap-1 px-2 py-1.5 bg-zinc-800/50 border-t border-zinc-700/50">
          {Object.entries(typeColor).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1 justify-center">
              <span className="w-2 h-2 rounded-full" style={{ background: color }}/>
              <span className="text-[9px] font-bold text-zinc-400">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 z-20">
        {['left', 'center', 'right'].map(zone => {
          const stat = data.zoneStats[zone];
          const isH = currentScript?.highlight === 'zone_' + zone;
          const label = zone === 'left' ? '左方向' : zone === 'center' ? '中方向' : '右方向';
          return (
            <div key={zone} className={`bg-zinc-900/80 border rounded-lg p-2 transition-all duration-300 ${isH ? `border-${projectData.theme}-500 scale-105 ring-1 ring-${projectData.theme}-500` : 'border-zinc-700/50'}`}>
              <div className="text-[9px] font-black text-zinc-500 text-center">{label}</div>
              <div className={`text-[18px] font-mono font-black text-center ${isH ? themeClass.text : 'text-white'}`}>
                {stat.avg.toFixed(3).replace(/^0/, '')}
              </div>
              <div className="text-[8px] text-zinc-500 text-center">{stat.count}打球</div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden z-20">
        {projectData.comparisons.slice(0, 3).map(comp => {
          const isH = currentScript?.highlight === comp.id;
          return (
            <div key={comp.id} className={`flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 ${isH ? `${themeClass.bg}/15 scale-[1.02]` : ''} transition-all`}>
              <span className={`text-[11px] font-black ${isH ? 'text-white' : 'text-zinc-400'}`}>{comp.label}</span>
              <span className={`text-[14px] font-mono font-black ${comp.winner === 'main' ? themeClass.text : 'text-zinc-500'}`}>{comp.valMain}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
