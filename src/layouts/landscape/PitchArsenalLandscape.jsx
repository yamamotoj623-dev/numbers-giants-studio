/**
 * PitchArsenalLayout 横長 (16:9) 専用バリアント (★v5.20.3 新規★)
 *
 * 構図:
 *   左 38%: パイチャート (球種比率)
 *   右 62%: 球種詳細リスト (名前 / 比率 / 球速 / 被打率)
 *           → 横長は「球種ごとの被打率の高低」を比較しやすい
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../../components/HighlightCard.jsx';

function PieChart({ pitches, size = 180 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  let cursor = -Math.PI / 2;
  const slices = (pitches || []).map(p => {
    const angle = ((p.pct || 0) / 100) * Math.PI * 2;
    const x1 = cx + Math.cos(cursor) * r;
    const y1 = cy + Math.sin(cursor) * r;
    cursor += angle;
    const x2 = cx + Math.cos(cursor) * r;
    const y2 = cy + Math.sin(cursor) * r;
    const largeArc = angle > Math.PI ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: p.color || '#a3a3a3' };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.03)" />
      {slices.map((s, i) => (
        <path
          key={i}
          d={s.path}
          fill={s.color}
          stroke="#0d0d0f"
          strokeWidth="1.5"
          opacity="0.92"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `pieIn 0.5s var(--spring-bounce) ${i * 0.08}s backwards`,
          }}
        />
      ))}
      <circle cx={cx} cy={cy} r="22" fill="#0a0a0c" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fill="#fff" fontWeight="900">
        {(pitches || []).length}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="8" fill="#a1a1aa" fontWeight="700">球種</text>
    </svg>
  );
}

export function PitchArsenalLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;
  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  const data = projectData.layoutData?.arsenal || {};
  const pitches = Array.isArray(data.pitches) && data.pitches.length > 0 ? data.pitches : [
    { name: 'ストレート', pct: 48, avg: '.205', velocity: 152, color: '#ef4444' },
    { name: 'スプリット', pct: 22, avg: '.150', velocity: 138, color: '#3b82f6' },
    { name: 'スライダー', pct: 18, avg: '.180', velocity: 132, color: '#10b981' },
    { name: 'カーブ',     pct: 8,  avg: '.250', velocity: 118, color: '#f59e0b' },
    { name: 'チェンジ',   pct: 4,  avg: '.200', velocity: 128, color: '#8b5cf6' },
  ];

  return (
    <>
      <div
        key={`arsenal-l-${animationKey}`}
        className="absolute z-10 flex"
        style={{ top: 32, bottom: '42%', left: 14, right: 14, gap: 16 }}
      >
        {/* 左: パイチャート */}
        <div className="flex flex-col items-center justify-center" style={{ width: '38%' }}>
          <PieChart pitches={pitches} size={180} />
        </div>

        {/* 右: 球種詳細リスト */}
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          <div className="grid grid-cols-[1fr_40px_55px_55px] gap-2 text-[8px] font-bold text-zinc-500 tracking-widest px-1">
            <div>球種</div>
            <div className="text-right">割合</div>
            <div className="text-right">球速</div>
            <div className="text-right">被打率</div>
          </div>
          {pitches.slice(0, 6).map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_40px_55px_55px] gap-2 items-center bg-zinc-900/60 rounded px-2 py-1"
              style={{
                borderLeft: `3px solid ${p.color || '#a3a3a3'}`,
                animation: `rankRowIn 0.4s var(--spring-bounce) ${i * 0.08}s backwards`,
              }}
            >
              <div className="text-[12px] font-bold text-white truncate">{p.name}</div>
              <div className="text-[12px] font-impact text-right" style={{ color: p.color || '#fff' }}>
                {p.pct}%
              </div>
              <div className="text-[11px] font-mono text-right text-zinc-300">
                {p.velocity}<span className="text-[8px] text-zinc-500">km/h</span>
              </div>
              <div className={`text-[12px] font-impact text-right ${themeClass.text}`}>
                {p.avg}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pieIn {
          0% { opacity: 0; transform: scale(0); }
          70% { opacity: 1; transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}
