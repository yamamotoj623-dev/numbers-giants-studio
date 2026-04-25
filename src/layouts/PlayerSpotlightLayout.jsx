/**
 * layoutType: player_spotlight (v2)
 * 1選手の主役感・ポートレート感を演出するレイアウト。
 *
 * layoutData.spotlight スキーマ (v2):
 * {
 *   players: [
 *     {
 *       id: "matsumoto",
 *       name: "松本剛",
 *       number: "9",
 *       label: "26年(今季)",
 *       silhouette: "batter_right",
 *       primaryStat: {
 *         label: "WAR",
 *         value: "-0.4",
 *         isNegative: true,
 *         compareValue?: { value: "0.0", label: "セ平均" }    // ★比較値併記 (新)
 *       },
 *       stats: [
 *         { label: "打率",  value: ".220", sub?: "(.265)" },
 *         { label: "OPS",   value: ".590" },
 *         ...
 *       ],
 *       comment: "外野守備が課題。打撃も復調せず",
 *     }
 *   ]
 * }
 *
 * v2 改修点:
 * - シルエットを劇画タッチで巨大化 (110px → 140px)
 * - サインカード風の選手名表示
 * - プライマリ指標の比較値併記対応
 * - スポットライト感のある背景演出
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
  const compareValue = player.primaryStat?.compareValue;

  return (
    <>
      <div key={`zoom-${animationKey}-${player.id}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[32%] px-3">

        {/* ★スポットライト感の背景★ シルエット背後にうっすらラジアルグラデ */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 30% 35%, ${themeClass.glow}22 0%, transparent 55%)`,
        }} />

        {/* 選手番号 + 名前 (サインカード風) */}
        <div className="z-20 flex items-center justify-center gap-2 mb-1.5">
          {player.number && (
            <span className={`w-10 h-10 ${themeClass.bg} text-white font-black text-[18px] rounded-md flex items-center justify-center shadow-lg`}
                  style={{ boxShadow: `0 4px 12px ${themeClass.glow}, 0 0 0 2px ${themeClass.glow}40` }}>
              {player.number}
            </span>
          )}
          <span className={`${themeClass.text} text-[26px] font-black tracking-tighter leading-none`}
                style={{ textShadow: `0 0 16px ${themeClass.glow}, 0 2px 4px rgba(0,0,0,0.8)` }}>
            {player.name}
          </span>
        </div>
        {player.label && (
          <div className={`z-20 text-center text-[11px] font-bold tracking-widest opacity-80 mb-2 ${themeClass.text}`}>
            ── {player.label} ──
          </div>
        )}

        {/* シルエット (劇画タッチ・巨大) + プライマリ指標 */}
        <div className="z-20 grid grid-cols-[140px_1fr] gap-3 mb-3 items-center">
          {/* シルエット枠 */}
          <div className="w-full h-[140px] flex items-center justify-center relative overflow-hidden rounded-xl border border-zinc-700/40"
               style={{
                 background: `linear-gradient(135deg, ${themeClass.glow}15 0%, rgba(0,0,0,0.4) 100%)`,
                 boxShadow: `inset 0 0 40px ${themeClass.glow}30`
               }}>
            {/* スポットライトの円 */}
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at center, ${themeClass.glow}40 0%, transparent 65%)`,
            }} />
            <div className="relative z-10 transform scale-110">
              <Silhouette type={sil} themeClass={themeClass} />
            </div>
          </div>

          {/* プライマリ指標 (画面中央に巨大) */}
          {player.primaryStat && (
            <div className="bg-zinc-900/95 rounded-xl border-2 border-zinc-700/60 p-3 flex flex-col items-center justify-center"
                 style={{ boxShadow: `0 0 24px ${themeClass.glow}30` }}>
              <div className="text-[11px] font-black text-zinc-300 tracking-widest mb-1">
                {player.primaryStat.label}
              </div>
              <div className={`text-[46px] font-mono font-black tracking-tighter leading-none ${
                isNeg ? 'text-red-400' : themeClass.text
              }`} style={{
                textShadow: isNeg
                  ? '0 0 20px rgba(248,113,113,0.7), 0 2px 4px rgba(0,0,0,0.8)'
                  : `0 0 20px ${themeClass.glow}, 0 2px 4px rgba(0,0,0,0.8)`
              }}>
                {player.primaryStat.value}
              </div>
              {/* 比較値併記 (新) */}
              {compareValue && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                  <span className="opacity-70">{compareValue.label}:</span>
                  <span className="text-zinc-300">{compareValue.value}</span>
                </div>
              )}
              {player.primaryStat.note && !compareValue && (
                <div className="text-[9px] font-bold text-zinc-400 mt-1">{player.primaryStat.note}</div>
              )}
            </div>
          )}
        </div>

        {/* サブ指標グリッド */}
        {player.stats && player.stats.length > 0 && (
          <div className={`z-20 grid gap-1.5 mb-2 ${player.stats.length >= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {player.stats.map((stat, i) => (
              <div key={i} className="bg-zinc-900/85 border border-zinc-700/50 rounded-lg p-2 backdrop-blur-sm">
                <div className="text-[10px] font-black text-zinc-300 tracking-widest mb-0.5">{stat.label}</div>
                <div className="text-[18px] font-mono font-black text-white tracking-tighter">{stat.value}</div>
                {stat.sub && <div className="text-[9px] text-zinc-500">{stat.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* コメント */}
        {player.comment && (
          <div className={`z-20 bg-zinc-900/85 border-l-4 ${themeClass.border} rounded p-2 backdrop-blur-sm`}>
            <div className="text-[11px] font-bold text-zinc-200 leading-snug">{player.comment}</div>
          </div>
        )}

      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
