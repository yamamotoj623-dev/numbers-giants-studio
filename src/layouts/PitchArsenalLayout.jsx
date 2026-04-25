/**
 * layoutType: pitch_arsenal (v2)
 * 投手の手の内 (球種構成) を可視化。
 *
 * layoutData.arsenal スキーマ (v2):
 * {
 *   mode: "single" | "compare" | "vs_batter",   // ★モード分岐 (新)
 *
 *   // mode: "single" / "compare" 用
 *   pitches?: [
 *     { name: "ストレート", pct: 45, avg: 0.255, velocity: 147, color: "#ef4444" },
 *     ...
 *   ],
 *   comparePitches?: [...],     // mode: "compare" 用 (前年比など)
 *   compareLabel?: "昨季",
 *
 *   // mode: "vs_batter" 用 (新、対右/対左)
 *   vsBatter?: {
 *     vsRight: [{ name, pct, avg, color }],
 *     vsLeft:  [{ name, pct, avg, color }]
 *   }
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

// パイチャートをレンダリング
function PieChart({ pitches, size = 140 }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;
  const innerRadius = 28;
  let angleAcc = -Math.PI / 2;

  const slices = pitches.map(pitch => {
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

    return { ...pitch, path };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: `${size}px` }}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="#0d0d0f" strokeWidth="1.5" opacity="0.92" />
      ))}
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="900">{pitches.length}球種</text>
    </svg>
  );
}

// === 単一モード / 比較モード ===
function SingleOrCompareView({ data, themeClass }) {
  const pitches = data.pitches || [];
  const isCompare = !!data.comparePitches;

  return (
    <>
      <div className="mb-2 bg-zinc-900/78 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
        <div className="px-3 py-1.5 border-b border-zinc-700/80 bg-zinc-800/30">
          <span className={`${themeClass.text} text-[12px] font-black`}>
            球種配分 & 被打率 {isCompare && <span className="text-zinc-400 ml-1 text-[10px]">(vs {data.compareLabel || '比較'})</span>}
          </span>
        </div>
        <div className="flex items-center justify-center p-2">
          <PieChart pitches={pitches} />
        </div>
      </div>

      <div className="bg-zinc-900/78 rounded-xl border border-zinc-700/50 overflow-hidden backdrop-blur-sm z-20">
        <div className="px-3 py-1.5 border-b border-zinc-700/80 bg-zinc-800/30 grid grid-cols-[1.4fr_46px_50px_50px] gap-2 items-center">
          <span className="text-[12px] font-black text-zinc-500 tracking-widest">球種</span>
          <span className="text-[12px] font-black text-zinc-500 tracking-widest text-right">配分</span>
          <span className="text-[12px] font-black text-zinc-500 tracking-widest text-right">球速</span>
          <span className="text-[12px] font-black text-zinc-500 tracking-widest text-right">被打率</span>
        </div>
        {pitches.map((pitch, i) => {
          const isBest = pitch.avg === Math.min(...pitches.map(p => p.avg));
          const cmp = data.comparePitches?.find(p => p.name === pitch.name);
          // 比較時の変化矢印
          const pctDelta = cmp ? pitch.pct - cmp.pct : null;
          return (
            <div key={i} className="px-3 py-2 border-b border-zinc-800 last:border-b-0 grid grid-cols-[1.4fr_46px_50px_50px] gap-2 items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: pitch.color, boxShadow: `0 0 6px ${pitch.color}` }} />
                <span className="text-[13px] font-black text-white leading-tight">{pitch.name}</span>
                {isBest && <span className="text-[10px] bg-amber-500 text-black font-black px-1 py-0.5 rounded flex-shrink-0">武器</span>}
              </div>
              <div className="text-right">
                <div className="text-[12px] font-mono font-black text-zinc-300">{pitch.pct}%</div>
                {cmp && (
                  <div className={`text-[10px] font-mono leading-none ${
                    pctDelta > 2 ? 'text-emerald-400' :
                    pctDelta < -2 ? 'text-red-400' :
                    'text-zinc-500'
                  }`}>
                    {pctDelta > 0 ? '↑' : pctDelta < 0 ? '↓' : '→'}{Math.abs(pctDelta)}%
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[12px] font-mono font-bold text-zinc-400">{pitch.velocity}<span className="text-[7px] text-zinc-600">km</span></div>
                {cmp && <div className="text-[10px] font-mono text-zinc-500 leading-none">→{cmp.velocity}</div>}
              </div>
              <div className="text-right">
                <div className={`text-[12px] font-mono font-black ${isBest ? 'text-amber-400' : pitch.avg > 0.280 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {pitch.avg.toFixed(3).replace(/^0/, '')}
                </div>
                {cmp && <div className="text-[10px] font-mono text-zinc-500 leading-none">→{cmp.avg.toFixed(3).replace(/^0/, '')}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// === 対打者モード (新) ===
function VsBatterView({ data, themeClass }) {
  const right = data.vsBatter?.vsRight || [];
  const left = data.vsBatter?.vsLeft || [];

  return (
    <>
      <div className="mb-2 text-center z-20">
        <span className={`${themeClass.text} text-[14px] font-black tracking-tighter`}>
          対打者別 球種構成
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 z-20">
        {/* 対右打者 */}
        <div className="bg-zinc-900/78 rounded-lg border border-zinc-700/50 overflow-hidden backdrop-blur-sm">
          <div className="px-2 py-1 bg-zinc-800/40 border-b border-zinc-700/50 text-center">
            <span className="text-[11px] font-black text-zinc-200">対右打者</span>
          </div>
          <div className="p-1.5">
            <PieChart pitches={right} size={100} />
          </div>
          <div className="px-2 pb-1.5">
            {right.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
                  <span className="text-zinc-300 font-bold">{p.name}</span>
                </span>
                <span className="font-mono font-black text-white">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 対左打者 */}
        <div className="bg-zinc-900/78 rounded-lg border border-zinc-700/50 overflow-hidden backdrop-blur-sm">
          <div className="px-2 py-1 bg-zinc-800/40 border-b border-zinc-700/50 text-center">
            <span className="text-[11px] font-black text-zinc-200">対左打者</span>
          </div>
          <div className="p-1.5">
            <PieChart pitches={left} size={100} />
          </div>
          <div className="px-2 pb-1.5">
            {left.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
                  <span className="text-zinc-300 font-bold">{p.name}</span>
                </span>
                <span className="font-mono font-black text-white">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 注釈 */}
      <div className="mt-2 z-20 text-center text-[10px] font-bold text-zinc-500">
        ※ 配球の左右別差分で攻略のヒント
      </div>
    </>
  );
}

export function PitchArsenalLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // 互換性レイヤ: 二重ネスト ({arsenal:{arsenal:{...}}}) を解除
  const _rawData = projectData.layoutData?.arsenal;
  const _unwrapped = (_rawData && typeof _rawData === 'object' && _rawData.arsenal)
    ? _rawData.arsenal
    : _rawData;

  const data = _unwrapped || {
    mode: 'single',
    pitches: [
      { name: 'ストレート', pct: 48, avg: 0.255, velocity: 147, color: '#ef4444' },
      { name: 'スプリット', pct: 26, avg: 0.125, velocity: 138, color: '#a855f7' },
      { name: 'スライダー', pct: 18, avg: 0.210, velocity: 132, color: '#10b981' },
      { name: 'カーブ',     pct: 8,  avg: 0.300, velocity: 115, color: '#f59e0b' },
    ],
  };

  const mode = data.mode || (data.vsBatter ? 'vs_batter' : data.comparePitches ? 'compare' : 'single');

  return (
    <>
      <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[32%] px-3">
        {mode === 'vs_batter' ? (
          <VsBatterView data={data} themeClass={themeClass} />
        ) : (
          <SingleOrCompareView data={data} themeClass={themeClass} />
        )}
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
