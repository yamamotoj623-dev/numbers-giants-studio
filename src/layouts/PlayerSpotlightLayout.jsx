/**
 * layoutType: player_spotlight (v3)
 * 1選手の主役感を演出するレイアウト。
 *
 * v3 改修点 (重要):
 * - シルエット枠を「番号バッジ + 選手名タイポ」のヒーローカード風に置き換え (画像なし前提)
 * - 選手名の重複表示を削除 (1箇所のみ)
 * - playerType (batter/pitcher) で stats のデフォルトを切替
 *
 * layoutData.spotlight スキーマ:
 * {
 *   players: [
 *     {
 *       id: "matsumoto",
 *       name: "松本剛",
 *       number: "9",
 *       label: "26年(今季)",
 *       primaryStat: {
 *         label: "WAR",
 *         value: "-0.4",
 *         isNegative: true,
 *         compareValue?: { value: "0.0", label: "セ平均" }
 *       },
 *       stats: [
 *         { label: "打率",  value: ".220" },
 *         ...
 *       ],
 *       comment: "..."
 *     }
 *   ]
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

// 投手/打者で stats の自動デフォルトを切替
function getDefaultStats(playerType, mainPlayerStats) {
  if (playerType === 'pitcher') {
    return [
      { label: '防御率', value: mainPlayerStats?.era || '-' },
      { label: 'WHIP',  value: mainPlayerStats?.whip || '-' },
      { label: '奪三振', value: mainPlayerStats?.so || '-' },
      { label: '勝',    value: mainPlayerStats?.win || '-' },
    ];
  }
  // batter / team / その他はデフォルトで打者扱い
  return [
    { label: '打率', value: mainPlayerStats?.avg || '-' },
    { label: 'OPS',  value: mainPlayerStats?.ops || '-' },
    { label: '本塁打', value: mainPlayerStats?.hr || '-' },
    { label: '打点', value: mainPlayerStats?.rbi || '-' },
  ];
}

export function PlayerSpotlightLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // 互換性レイヤ: 二重ネスト ({spotlight:{spotlight:{...}}}) を解除
  const _rawData = projectData.layoutData?.spotlight;
  const _unwrapped = (_rawData && typeof _rawData === 'object' && _rawData.spotlight && Array.isArray(_rawData.spotlight.players))
    ? _rawData.spotlight
    : _rawData;

  const data = _unwrapped || {
    players: [
      {
        id: 'sample',
        name: projectData.mainPlayer?.name || '選手名',
        number: projectData.mainPlayer?.number || '',
        label: projectData.mainPlayer?.label || '',
        // ★playerType で stats のデフォルトを切替★
        stats: getDefaultStats(projectData.playerType, projectData.mainPlayer?.stats),
      },
    ],
  };

  const focusId = currentScript?.focusEntry;
  const player = (focusId && data.players?.find(p => p.id === focusId || p.name === focusId))
    || data.players?.[0]
    || {};

  const isNeg = player.primaryStat?.isNegative;
  const compareValue = player.primaryStat?.compareValue;

  // stats が無いか空なら playerType で自動補完
  const displayStats = (player.stats && player.stats.length > 0)
    ? player.stats
    : getDefaultStats(projectData.playerType, projectData.mainPlayer?.stats);

  return (
    <>
      <div key={`zoom-${animationKey}-${player.id || 'p'}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[34%] px-3">

        {/* ★スポットライト感の背景★ */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% 30%, ${themeClass.glow}25 0%, transparent 60%)`,
        }} />

        {/* ★ヒーローカード★ 選手名は1箇所だけ、シルエット画像は廃止し代わりに巨大ナンバー */}
        <div className="z-20 mb-3 relative bg-zinc-900/80 rounded-2xl border border-zinc-700/50 overflow-hidden backdrop-blur-sm shadow-2xl"
             style={{
               background: `linear-gradient(135deg, rgba(24,24,27,0.95) 0%, ${themeClass.glow}20 100%)`,
               boxShadow: `0 0 32px ${themeClass.glow}30`,
             }}>
          {/* 大きな背景番号 (装飾) */}
          {player.number && (
            <div className="absolute right-2 top-1 text-[88px] font-black opacity-[0.08] leading-none select-none pointer-events-none"
                 style={{ color: themeClass.primary }}>
              {player.number}
            </div>
          )}

          <div className="relative p-3">
            {/* 番号バッジ + 選手名 (★1箇所だけ表示★) */}
            <div className="flex items-center gap-2 mb-1">
              {player.number && (
                <span className={`w-9 h-9 ${themeClass.bg} text-white font-black text-[16px] rounded-md flex items-center justify-center shadow-lg flex-shrink-0`}
                      style={{ boxShadow: `0 0 12px ${themeClass.glow}, 0 0 0 2px ${themeClass.glow}40` }}>
                  {player.number}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className={`${themeClass.text} text-[24px] font-black tracking-tighter leading-none truncate`}
                     style={{ textShadow: `0 0 14px ${themeClass.glow}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {player.name}
                </div>
                {player.label && (
                  <div className={`text-[10px] font-bold tracking-widest opacity-70 mt-0.5 ${themeClass.text}`}>
                    {player.label}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* プライマリ指標 (画面中央に巨大、比較値併記) */}
        {player.primaryStat && (
          <div className="z-20 mb-3 bg-zinc-900/80 rounded-xl border-2 border-zinc-700/60 p-3 backdrop-blur-sm"
               style={{ boxShadow: `0 0 24px ${themeClass.glow}30` }}>
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-zinc-300 tracking-widest mb-1">
                  {player.primaryStat.label}
                </span>
                <span className={`text-[48px] font-mono font-black tracking-tighter leading-none ${
                  isNeg ? 'text-red-400' : themeClass.text
                }`} style={{
                  textShadow: isNeg
                    ? '0 0 20px rgba(248,113,113,0.7), 0 2px 4px rgba(0,0,0,0.8)'
                    : `0 0 20px ${themeClass.glow}, 0 2px 4px rgba(0,0,0,0.8)`
                }}>
                  {player.primaryStat.value}
                </span>
              </div>

              {/* 比較値併記 (右寄せ) */}
              {compareValue && (
                <div className="flex flex-col items-end pb-2">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider">
                    {compareValue.label}
                  </span>
                  <span className="text-[20px] font-mono font-bold text-zinc-300">
                    {compareValue.value}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* サブ指標グリッド (4個なら2x2、3個なら1x3) */}
        {displayStats.length > 0 && (
          <div className={`z-20 grid gap-1.5 mb-2 ${displayStats.length >= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {displayStats.map((stat, i) => (
              <div key={i} className="bg-zinc-900/78 border border-zinc-700/50 rounded-lg p-2 backdrop-blur-sm">
                <div className="text-[10px] font-black text-zinc-300 tracking-widest mb-0.5">{stat.label}</div>
                <div className="text-[18px] font-mono font-black text-white tracking-tighter">{stat.value}</div>
                {stat.sub && <div className="text-[9px] text-zinc-500">{stat.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* コメント */}
        {player.comment && (
          <div className={`z-20 bg-zinc-900/78 border-l-4 ${themeClass.border} rounded p-2 backdrop-blur-sm`}>
            <div className="text-[11px] font-bold text-zinc-200 leading-snug">{player.comment}</div>
          </div>
        )}

      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
