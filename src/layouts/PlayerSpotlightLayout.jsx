/**
 * layoutType: player_spotlight
 *
 * 1選手にフォーカスして詳細を見せるレイアウト。
 * ランキング動画やチーム分析動画で「この選手の詳細を掘る」シーンに最適。
 *
 * layoutData.spotlight スキーマ:
 * {
 *   players: [
 *     {
 *       id: "matsumoto",
 *       name: "松本剛",
 *       number: "2",
 *       label: "26年(今季)",
 *       silhouette: "batter_right",  // optional, デフォルトは projectData.silhouetteType
 *       primaryStat: { label: "WAR", value: "-0.4", isNegative: true },
 *       stats: [
 *         { label: "打率",  value: ".220" },
 *         { label: "OPS",   value: ".590" },
 *         { label: "守備率", value: ".988" },
 *         { label: "失策",   value: "5" },
 *       ],
 *       comment: "外野守備が課題。打撃も復調せず",  // optional
 *     },
 *     ...複数選手をid:script.focusEntryで切替可
 *   ]
 * }
 *
 * currentScript.focusEntry に players[].id (or name) を指定すると、その選手にフォーカス。
 * 未指定なら 1人目を表示。
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';
import { Silhouette } from '../components/Silhouettes.jsx';

export function PlayerSpotlightLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const data = projectData.layoutData?.spotlight || {
    players: [
      {
        id: 'sample',
        name: projectData.mainPlayer?.name || '選手名',
        number: projectData.mainPlayer?.number || '',
        label: projectData.mainPlayer?.label || '',
        silhouette: projectData.silhouetteType,
        primaryStat: { label: 'OPS', value: '.724', isNegative: false },
        stats: [
          { label: '打率', value: '.276' },
          { label: 'HR',   value: '5' },
          { label: '打点', value: '18' },
          { label: '盗塁', value: '2' },
        ],
      },
    ],
  };

  const focusId = currentScript?.focusEntry;
  const player = (focusId && data.players.find(p => p.id === focusId || p.name === focusId))
    || data.players[0];

  const sil = player.silhouette || projectData.silhouetteType || 'batter_right';
  const isNeg = player.primaryStat?.isNegative;

  return (
    <>
      <div key={`zoom-${animationKey}-${player.id}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[28%] px-3">

        {/* 選手名・番号 */}
        <div className="z-20 flex items-center justify-center gap-2 mb-2">
          {player.number && (
            <span className={`w-9 h-9 ${themeClass.bg} text-white font-black text-[16px] rounded-md flex items-center justify-center shadow-lg`}>
              {player.number}
            </span>
          )}
          <span className={`${themeClass.text} text-[24px] font-black tracking-tighter leading-none`} style={{ textShadow: `0 0 12px ${themeClass.glow}` }}>
            {player.name}
          </span>
        </div>
        {player.label && (
          <div className={`z-20 text-center text-[11px] font-bold ${themeClass.text} opacity-80 mb-2`}>
            {player.label}
          </div>
        )}

        {/* シルエット + プライマリ指標 */}
        <div className="z-20 grid grid-cols-[110px_1fr] gap-3 mb-3 items-center">
          <div className="w-full h-[110px] flex items-center justify-center bg-zinc-900/40 rounded-xl border border-zinc-700/40">
            <Silhouette type={sil} themeClass={themeClass} />
          </div>
          {player.primaryStat && (
            <div className="bg-zinc-900/95 rounded-xl border-2 border-zinc-700/60 p-3 flex flex-col items-center justify-center">
              <div className="text-[11px] font-black text-zinc-300 tracking-widest mb-1">{player.primaryStat.label}</div>
              <div className={`text-[44px] font-mono font-black tracking-tighter leading-none ${isNeg ? 'text-red-400' : themeClass.text}`} style={{ textShadow: isNeg ? '0 0 16px rgba(248,113,113,0.6)' : `0 0 16px ${themeClass.glow}` }}>
                {player.primaryStat.value}
              </div>
              {player.primaryStat.note && (
                <div className="text-[9px] font-bold text-zinc-400 mt-1">{player.primaryStat.note}</div>
              )}
            </div>
          )}
        </div>

        {/* サブ指標グリッド */}
        {player.stats && player.stats.length > 0 && (
          <div className={`z-20 grid gap-1.5 mb-2 ${player.stats.length >= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {player.stats.map((stat, i) => (
              <div key={i} className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg p-2">
                <div className="text-[10px] font-black text-zinc-300 tracking-widest mb-0.5">{stat.label}</div>
                <div className="text-[18px] font-mono font-black text-white tracking-tighter">{stat.value}</div>
                {stat.sub && <div className="text-[9px] text-zinc-500">{stat.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* コメント */}
        {player.comment && (
          <div className={`z-20 bg-zinc-900/80 border-l-4 ${themeClass.border} rounded p-2`}>
            <div className="text-[11px] font-bold text-zinc-200 leading-snug">{player.comment}</div>
          </div>
        )}

      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
