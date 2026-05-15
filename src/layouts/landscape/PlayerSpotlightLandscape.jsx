/**
 * PlayerSpotlightLayout 横長 (16:9) 専用バリアント ()
 *
 * 構図 (写真は使わずテキストで主役感を出す):
 *   左 1/3:  選手名 (大) + 背番号 + 期間ラベル + 球団バッジ
 *   右 2/3:  primaryStat 巨大 + stats 4-6個 グリッド (mode 'default'/'stats_grid')
 *           or 単一指標巨大 (mode 'single_metric')
 *           or 引用 (mode 'quote')
 *   下半分: テロップ + アバター左右
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../../components/HighlightCard.jsx';

const TEAM_COLORS = {
  G: '#f97316', T: '#fbbf24', D: '#3b82f6', S: '#10b981',
  C: '#dc2626', DB: '#1d4ed8', E: '#991b1b', F: '#0ea5e9',
  L: '#1e40af', H: '#fcd34d', M: '#374151', B: '#7c2d12',
};

export function PlayerSpotlightLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;
  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  const data = projectData.layoutData?.spotlight || {};
  const focusedId = currentScript?.focusEntry || null;
  const players = Array.isArray(data.players) ? data.players : [];
  const player = (focusedId && players.find(p => p.id === focusedId || p.name === focusedId)) || players[0] || {};

  // mode 解決
  const mode = currentScript?.spotlightMode || data.mode || 'default';
  const focusQuoteIndex = currentScript?.focusQuoteIndex ?? 0;
  const quotes = Array.isArray(player.quotes) ? player.quotes
    : player.quote ? [{ text: player.quote, source: player.quoteSource }]
    : [];
  const resolvedQuote = quotes[focusQuoteIndex] || quotes[0] || null;

  const teamColor = TEAM_COLORS[player.team] || themeClass.primary;
  const displayStats = Array.isArray(player.stats) ? player.stats.slice(0, 6) : [];

  return (
    <>
      <div
        key={`spot-l-${animationKey}-${player.id || player.name || 'p'}-${mode}`}
        className="absolute z-10 flex"
        style={{ top: 32, bottom: '42%', left: 14, right: 14, gap: 14 }}
      >
        {/* 左: 選手名/背番号/球団 (写真なし、テキストで主役感) */}
        <div
          className="flex flex-col justify-center relative"
          style={{
            width: '30%',
            background: `linear-gradient(135deg, ${teamColor}25 0%, transparent 60%)`,
            borderLeft: `3px solid ${teamColor}`,
            borderRadius: 8,
            padding: '8px 10px',
            animation: 'cardBounceIn 0.55s var(--spring-bounce) both',
          }}
        >
          {/* 球団バッジ */}
          {player.team && (
            <div className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: teamColor }}>
              {player.team}
            </div>
          )}
          {/* 選手名: 14px (縮小、背番号と並べる前提) */}
          <div className={`text-[14px] font-black leading-tight tracking-tight ${themeClass.text}`}
               style={{ textShadow: `0 0 12px ${themeClass.glow}80`, wordBreak: 'keep-all' }}>
            {player.name || '選手名'}
          </div>
          {player.number && (
            <div className="text-[10px] font-mono text-zinc-300 mt-0.5">
              #{player.number}
            </div>
          )}
          {player.label && (
            <div className="text-[9px] font-bold text-zinc-400 mt-1">
              {player.label}
            </div>
          )}
          {player.comment && (
            <div className="text-[9px] text-zinc-300 italic mt-1 leading-snug">
              "{player.comment}"
            </div>
          )}
        </div>

        {/* 右: モード別の主役データ */}
        <div className="flex-1 flex flex-col justify-center relative">
          {mode === 'single_metric' && player.primaryStat && (
            <div className="text-center">
              <div className={`text-[12px] font-bold tracking-widest mb-1 ${themeClass.text}`}>
                {player.primaryStat.label}
              </div>
              <div className={`text-[80px] font-impact leading-none hero-value-pop ${themeClass.text}`}
                   style={{ textShadow: `0 0 24px ${themeClass.glow}` }}>
                {player.primaryStat.value}
              </div>
              {player.primaryStat.compareValue && (
                <div className="text-[11px] text-zinc-400 mt-1">
                  {player.primaryStat.compareValue.label}: <span className="font-bold text-zinc-200">{player.primaryStat.compareValue.value}</span>
                </div>
              )}
            </div>
          )}

          {mode === 'quote' && (
            <div className="flex flex-col justify-center px-3">
              <div className="text-[40px] leading-none opacity-25 mb-1" style={{ color: themeClass.primary }}>"</div>
              <div key={`q-${focusQuoteIndex}`}
                   className="text-[15px] font-bold text-white leading-snug"
                   style={{ animation: 'cardBounceIn 0.5s var(--spring-bounce) both' }}>
                {resolvedQuote?.text || '(発言が登録されていません)'}
              </div>
              {resolvedQuote?.source && (
                <div className={`mt-2 text-[9px] font-bold tracking-wider opacity-80 ${themeClass.text}`}>
                  — {resolvedQuote.source}
                </div>
              )}
            </div>
          )}

          {(mode === 'default' || mode === 'stats_grid') && (
            <div className="flex flex-col gap-2">
              {/* primaryStat (default のみ大きく、stats_grid は 1セル扱い) */}
              {mode === 'default' && player.primaryStat && (
                <div className="bg-zinc-900/80 rounded-lg p-2.5 border border-zinc-700/60"
                     style={{
                       boxShadow: `0 0 24px ${themeClass.glow}40`,
                       animation: 'cardBounceIn 0.4s var(--spring-bounce) both',
                     }}>
                  <div className={`text-[10px] font-black tracking-widest ${themeClass.text}`}>
                    {player.primaryStat.label}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className={`text-[44px] font-impact leading-none hero-value-pop ${themeClass.text}`}
                         style={{ textShadow: `0 0 16px ${themeClass.glow}` }}>
                      {player.primaryStat.value}
                    </div>
                    {player.primaryStat.compareValue && (
                      <div className="text-[9px] text-zinc-400">
                        vs {player.primaryStat.compareValue.label}: <span className="font-bold text-zinc-200">{player.primaryStat.compareValue.value}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* stats grid */}
              {displayStats.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {(mode === 'stats_grid' && player.primaryStat
                    ? [{ label: player.primaryStat.label, value: player.primaryStat.value, _isPrimary: true }, ...displayStats]
                    : displayStats
                  ).slice(0, 6).map((stat, i) => (
                    <div
                      key={i}
                      className={`bg-zinc-900/78 rounded p-1.5 border ${stat._isPrimary ? `border-amber-400/60` : 'border-zinc-700/50'}`}
                      style={{
                        animation: `cardBounceIn 0.35s var(--spring-bounce) both`,
                        animationDelay: `${i * 0.06 + 0.1}s`,
                      }}
                    >
                      <div className="text-[9px] font-bold text-zinc-300 tracking-wider truncate">{stat.label}</div>
                      <div className={`text-[16px] font-impact ${stat._isPrimary ? themeClass.text : 'text-white'}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}
