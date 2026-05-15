/**
 * RankingLayout 横長 (16:9) 専用バリアント ()
 *
 * 構図:
 *   上半分を 2 列で使用 — 左 1-5位、右 6-10位
 *   主役行 (isMainPlayer or focusedName) はオレンジ強調
 *   下半分: テロップ大 + アバター左右
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../../components/HighlightCard.jsx';
import { useSpringNumber } from '../../hooks/useSpringNumber';

function SpringValue({ value, unit }) {
  const raw = String(value || '');
  const numMatch = raw.match(/^([+-]?)(\d*\.?\d+)/);
  const numericVal = numMatch ? parseFloat(numMatch[0]) : NaN;
  const decimals = numMatch ? (numMatch[2].split('.')[1] || '').length : 0;
  const hasLeadingDot = raw.startsWith('.');
  const springVal = useSpringNumber(isNaN(numericVal) ? 0 : numericVal, {
    stiffness: 55, damping: 11, precision: decimals > 0 ? 0.0005 : 0.3,
  });
  if (isNaN(numericVal)) return <>{raw}{unit || ''}</>;
  let formatted = springVal.toFixed(decimals);
  if (hasLeadingDot && formatted.startsWith('0.')) formatted = formatted.slice(1);
  return <>{formatted}{unit || ''}</>;
}

const TEAM_COLORS = {
  G: '#f97316', T: '#fbbf24', D: '#3b82f6', S: '#10b981',
  C: '#dc2626', DB: '#1d4ed8', E: '#991b1b', F: '#0ea5e9',
  L: '#1e40af', H: '#fcd34d', M: '#374151', B: '#7c2d12',
};

export function RankingLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const _rawData = projectData.layoutData?.ranking;
  const _unwrapped = (_rawData && _rawData.ranking && Array.isArray(_rawData.ranking.metrics))
    ? _rawData.ranking : _rawData;

  const data = _unwrapped && Array.isArray(_unwrapped.metrics) && _unwrapped.metrics.length > 0
    ? _unwrapped : {
      mode: 'single', mood: 'neutral',
      metrics: [{
        id: 'ops', label: 'OPS', kana: 'オーピーエス', unit: '',
        entries: [
          { rank: 1, name: '選手A', team: 'G', value: '1.013', isMainPlayer: true },
          { rank: 2, name: '選手B', team: 'T', value: '.945' },
          { rank: 3, name: '選手C', team: 'D', value: '.928' },
          { rank: 4, name: '選手D', team: 'DB', value: '.895' },
          { rank: 5, name: '選手E', team: 'S', value: '.878' },
          { rank: 6, name: '選手F', team: 'C', value: '.812' },
          { rank: 7, name: '選手G', team: 'G', value: '.795' },
          { rank: 8, name: '選手H', team: 'T', value: '.778' },
          { rank: 9, name: '選手I', team: 'D', value: '.752' },
          { rank: 10, name: '選手J', team: 'S', value: '.728' },
        ],
      }],
    };

  const focusedMetricId = currentScript?.focusMetric || null;
  const activeMetric = (focusedMetricId && data.metrics.find(m => m.id === focusedMetricId)) || data.metrics[0];
  const focusedName = currentScript?.focusEntry || null;
  const mood = data.mood || 'neutral';

  const moodStyle = mood === 'best'
    ? { headColor: 'text-yellow-300', glow: 'rgba(250,204,21,0.6)' }
    : mood === 'worst'
    ? { headColor: 'text-red-300', glow: 'rgba(248,113,113,0.6)' }
    : { headColor: themeClass.text, glow: themeClass.glow };

  const allEntries = Array.isArray(activeMetric?.entries) ? [...activeMetric.entries].sort((a, b) => (a.rank || 99) - (b.rank || 99)) : [];
  const top5 = allEntries.slice(0, 5);
  const next5 = allEntries.slice(5, 10);

  const renderRow = (entry, idxInColumn, isLeftColumn) => {
    const isFocused = (focusedName && entry.name === focusedName) || entry.isMainPlayer;
    const teamColor = TEAM_COLORS[entry.team] || '#a3a3a3';
    return (
      <div
        key={`${entry.rank}-${entry.name}`}
        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded ${isFocused ? 'bg-amber-500/20 ring-1 ring-amber-400/60' : ''}`}
        style={{
          animation: `rankRowIn 0.5s var(--spring-bounce) ${idxInColumn * 0.06 + (isLeftColumn ? 0 : 0.3)}s backwards`,
          ...(isFocused ? { animation: `rankRowIn 0.5s var(--spring-bounce) ${idxInColumn * 0.06}s backwards, focusRowGlow 2s ease-in-out infinite` } : {}),
        }}
      >
        <div className={`text-[14px] font-impact w-5 text-center ${
          entry.rank === 1 ? 'text-yellow-300' : entry.rank === 2 ? 'text-zinc-200' : entry.rank === 3 ? 'text-amber-600' : 'text-zinc-500'
        }`}>{entry.rank}</div>
        {entry.team && (
          <div
            className="text-[8px] font-bold rounded px-1"
            style={{ backgroundColor: `${teamColor}30`, color: teamColor, minWidth: 18, textAlign: 'center' }}
          >
            {entry.team}
          </div>
        )}
        <div className={`flex-1 text-[11px] font-bold truncate ${isFocused ? 'text-amber-200' : 'text-zinc-100'}`}>
          {entry.name}
        </div>
        <div className={`text-[13px] font-impact ${isFocused ? themeClass.text : 'text-white'}`}
             style={isFocused ? { textShadow: `0 0 8px ${themeClass.glow}` } : {}}>
          <SpringValue value={entry.value} unit={activeMetric.unit || ''} />
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        key={`rank-l-${animationKey}-${activeMetric?.id || ''}`}
        className="absolute z-10 flex flex-col"
        style={{ top: 32, bottom: '42%', left: 14, right: 14 }}
      >
        {/* 指標見出し */}
        <div className={`text-center mb-1 ${moodStyle.headColor}`}>
          <span className="text-[10px] font-bold tracking-widest opacity-80">
            {mood === 'best' ? '🏆 ' : mood === 'worst' ? '⚠️ ' : '📊 '}
          </span>
          <span className="text-[14px] font-impact" style={{ textShadow: `0 0 12px ${moodStyle.glow}` }}>
            {activeMetric?.label || '指標'}
          </span>
          <span className="text-[9px] text-zinc-400 ml-1.5">ランキング</span>
        </div>

        {/* 2 列 — gap を詰めて 5 行確実に表示 */}
        <div className="flex-1 grid grid-cols-2 gap-2 min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0.5 justify-start">
            {top5.map((e, i) => renderRow(e, i, true))}
          </div>
          <div className="flex flex-col gap-0.5 justify-start">
            {next5.map((e, i) => renderRow(e, i, false))}
          </div>
        </div>
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}
