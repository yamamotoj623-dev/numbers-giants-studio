/**
 * layoutType: player_spotlight (v4)
 * 1選手のデータを「主役感」で見せるレイアウト。
 *
 * v4 改修点 (重要):
 * - ★選手名・番号は表示しない★ (画面上部の phase-b-header に既に表示されているため重複防止)
 * - プライマリ指標を画面の「主役」として巨大表示
 * - 比較値併記でドラマ性
 * - サブ指標は補助情報として小さく
 *
 * layoutData.spotlight スキーマ:
 * {
 *   players: [
 *     {
 *       id: "matsumoto",
 *       label: "26年(今季)",       ← 期間表示
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
 *
 * ※ 選手名/番号は projectData.mainPlayer から自動表示されるので、
 *    layoutData.spotlight の中で name/number を指定する必要はない (ただし、
 *    player.id で focusEntry 切替には使う)。
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

  // 互換性レイヤ: 二重ネスト解除
  const _rawData = projectData.layoutData?.spotlight;
  const _unwrapped = (_rawData && typeof _rawData === 'object' && _rawData.spotlight && Array.isArray(_rawData.spotlight.players))
    ? _rawData.spotlight
    : _rawData;

  // データ有効性判定: spotlight は players[] が必要
  const _hasValidData = _unwrapped && typeof _unwrapped === 'object' &&
    Array.isArray(_unwrapped.players) && _unwrapped.players.length > 0;

  const data = _hasValidData ? _unwrapped : {
    players: [
      {
        id: 'sample',
        label: projectData.mainPlayer?.label || '',
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

  // 期間ラベル (label が無ければ projectData.mainPlayer.label にフォールバック)
  const periodLabel = player.label || projectData.mainPlayer?.label || '';

  return (
    <>
      <div key={`zoom-${animationKey}-${player.id || 'p'}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[34%] px-3">

        {/* スポットライト感の背景 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% 35%, ${themeClass.glow}25 0%, transparent 60%)`,
        }} />

        {/* 期間ラベル (中央上部、控えめに) */}
        {periodLabel && (
          <div className={`z-20 text-center text-[12px] font-bold tracking-widest mb-3 ${themeClass.text} opacity-80`}>
            ── {periodLabel} ──
          </div>
        )}

        {/* ★プライマリ指標★ 画面のメイン主役、巨大表示 */}
        {player.primaryStat && (
          <div className="z-20 mb-4 bg-zinc-900/78 rounded-2xl border-2 border-zinc-700/60 p-4 backdrop-blur-sm relative overflow-hidden"
               style={{ boxShadow: `0 0 32px ${themeClass.glow}40` }}>
            {/* 装飾: 背景に薄くラベル文字 */}
            <div className="absolute -top-3 right-2 text-[42px] font-black opacity-[0.06] leading-none select-none pointer-events-none"
                 style={{ color: themeClass.primary }}>
              {player.primaryStat.label}
            </div>

            <div className="relative flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-zinc-300 tracking-widest mb-1">
                  {player.primaryStat.label}
                </span>
                {/* ★巨大数値★ */}
                <span className={`text-[60px] font-mono font-black tracking-tighter leading-none ${
                  isNeg ? 'text-red-400' : themeClass.text
                }`} style={{
                  textShadow: isNeg
                    ? '0 0 24px rgba(248,113,113,0.7), 0 2px 4px rgba(0,0,0,0.8)'
                    : `0 0 24px ${themeClass.glow}, 0 2px 4px rgba(0,0,0,0.8)`
                }}>
                  {player.primaryStat.value}
                </span>
              </div>

              {/* 比較値 (右下) */}
              {compareValue && (
                <div className="flex flex-col items-end pb-2">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider mb-0.5">
                    {compareValue.label}
                  </span>
                  <span className="text-[24px] font-mono font-bold text-zinc-300">
                    {compareValue.value}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* サブ指標グリッド */}
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
