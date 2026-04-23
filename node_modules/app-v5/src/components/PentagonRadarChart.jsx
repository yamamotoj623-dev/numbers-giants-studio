import React from 'react';
import { THEMES } from '../lib/config';
import { getRankData, hexToRgb } from '../lib/textRender.jsx';

export function PentagonRadarChart({ stats, highlight, themeColor }) {
  const keys = Object.keys(stats).slice(0, 5);
  const points = keys.map((k, i) => ({
    id: k,
    angle: -Math.PI / 2 + (Math.PI * 2 * i) / 5,
    label: stats[k].label
  }));

  const getCoordinates = (value, angle, rScale = 44) => {
    const r = (value / 100) * rScale;
    return `${60 + r * Math.cos(angle)},${60 + r * Math.sin(angle)}`;
  };

  const polyMain = keys.map((k, i) => getCoordinates(stats[k].main, points[i].angle)).join(' ');
  const polySub  = keys.map((k, i) => getCoordinates(stats[k].sub,  points[i].angle)).join(' ');

  const primaryColor = THEMES[themeColor]?.primary || THEMES.orange.primary;
  const glowColor    = THEMES[themeColor]?.glow    || THEMES.orange.glow;
  const fillColor    = `rgba(${hexToRgb(primaryColor)}, 0.4)`;

  return (
    <div className="w-[180px] h-[180px] relative transition-all duration-500 animate-float">
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
        {[100, 80, 60, 40, 20].map(level => (
          <polygon key={level} points={points.map(p => getCoordinates(level, p.angle)).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}
        {points.map((p, i) => (
          <line key={i} x1="60" y1="60" x2={getCoordinates(100, p.angle).split(',')[0]} y2={getCoordinates(100, p.angle).split(',')[1]} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        ))}
        <polygon points={polyMain} fill={fillColor} stroke={primaryColor} strokeWidth="2.5" style={{ filter: `drop-shadow(0px 0px 5px ${glowColor})` }} />
        <polygon points={polySub}  fill="rgba(161, 161, 170, 0.25)" stroke="rgba(212, 212, 216, 1)" strokeWidth="2.5" strokeDasharray="4 3" />
      </svg>
      {points.map((p, i) => {
        const x = 50 + (60/60)*50 * Math.cos(p.angle);
        const y = 50 + (60/60)*50 * Math.sin(p.angle);
        const isH = highlight === p.id;
        const rankData = getRankData(stats[p.id].main);
        return (
          <div key={i} className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${isH ? 'scale-[1.2] z-10' : 'z-0'}`} style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
            <span className={`text-[14px] font-black leading-none whitespace-nowrap mb-0.5 transition-colors ${isH ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)]' : 'text-zinc-300'}`} style={isH ? { textShadow: `0 0 10px ${primaryColor}` } : {}}>{p.label}</span>
            <span className={`text-[18px] font-black italic leading-none ${rankData.color}`}>{rankData.rank}</span>
          </div>
        );
      })}
    </div>
  );
}
