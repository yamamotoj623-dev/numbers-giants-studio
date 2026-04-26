/**
 * layoutType: player_spotlight (v5)
 * 1選手のデータを「主役感」で見せるレイアウト。
 *
 * v5 改修点 (★v5.14.0★):
 * - showPlayerName: 'auto'|true|false 追加
 *   - 'auto' (or undefined): playerType==='team' なら true、それ以外 false
 *   - true: 選手名・背番号を表示 (期間ラベル下)
 *   - false: 表示しない (ヘッダーで既に表示されてる時に重複防止)
 * - 基本成績の視覚的強調: script.highlight が指す comparison の label と
 *   primaryStat / stats[].label が一致する項目をパルス強調 (迷子防止)
 *
 * v4 (前回) からの継続:
 * - プライマリ指標を画面の「主役」として巨大表示
 * - 比較値併記でドラマ性
 * - サブ指標は補助情報
 *
 * layoutData.spotlight スキーマ:
 * {
 *   showPlayerName?: 'auto' | true | false,   // ★v5新★
 *   players: [
 *     {
 *       id: "okamoto",
 *       label: "26年(今季)",
 *       name?: "岡本和真",          // ★showPlayerName=true 時に使用★
 *       number?: "25",              // ★showPlayerName=true 時に使用★
 *       primaryStat: {
 *         label: "WAR",
 *         value: "-0.4",
 *         isNegative: true,
 *         compareValue?: { value: "0.0", label: "セ平均" }
 *       },
 *       stats: [
 *         { label: "打率",  value: ".220" },
 *         { label: "対佐野", value: ".348" }   // ★Geminiが柔軟にカスタム可★
 *       ],
 *       comment: "..."
 *     }
 *   ]
 * }
 *
 * ※ team 動画 (playerType="team") の場合: ヘッダーが「読売ジャイアンツ」になるので
 *    showPlayerName=true で「岡本和真」など個別選手名を画面内に表示する。
 *    その他の動画 (個人深掘り等) はヘッダーに既に選手名があるので showPlayerName=false。
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

// ラベル一致判定 (完全一致 or 双方向部分一致、case-insensitive)
function statMatches(statLabel, targetLabel) {
  if (!statLabel || !targetLabel) return false;
  const a = String(statLabel).toLowerCase().trim();
  const b = String(targetLabel).toLowerCase().trim();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function PlayerSpotlightLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  // ★v5.14.0★ phase に関係なく、currentScript.highlight があれば行強調を発火
  // (ハイライトカードは phase==='highlight' のみだが、行強調は normal phase でも発動)
  const focusedComp = currentScript?.highlight
    ? projectData.comparisons?.find(c => c.id === currentScript.highlight)
    : null;
  const focusedLabel = focusedComp?.label || null;

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

  // 期間ラベル
  const periodLabel = player.label || projectData.mainPlayer?.label || '';

  // ★v5.14.0★ showPlayerName 判定
  const showNameOption = data.showPlayerName;
  const showName = (() => {
    if (showNameOption === true) return true;
    if (showNameOption === false) return false;
    // 'auto' or undefined → playerType で自動判定
    return projectData.playerType === 'team';
  })();
  const displayName = player.name || (showName ? projectData.mainPlayer?.name : null);
  const displayNumber = player.number || (showName ? projectData.mainPlayer?.number : null);

  // ★v5.14.0★ フォーカス判定 (currentScript.highlight が指す指標と一致する行)
  const primaryFocused = focusedLabel && statMatches(player.primaryStat?.label, focusedLabel);
  const isStatFocused = (statLabel) => focusedLabel && statMatches(statLabel, focusedLabel);

  return (
    <>
      <div key={`zoom-${animationKey}-${player.id || 'p'}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[34%] px-3">

        {/* スポットライト感の背景 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% 35%, ${themeClass.glow}25 0%, transparent 60%)`,
        }} />

        {/* 期間ラベル (中央上部、控えめに) */}
        {periodLabel && (
          <div className={`z-20 text-center text-[12px] font-bold tracking-widest mb-2 ${themeClass.text} opacity-80`}>
            ── {periodLabel} ──
          </div>
        )}

        {/* ★v5.14.0★ 選手名 + 背番号 (showName のとき) */}
        {showName && displayName && (
          <div className="z-20 text-center mb-3">
            <span className="text-[18px] font-black text-white tracking-tight">
              {displayName}
            </span>
            {displayNumber && (
              <span className="text-[12px] font-bold text-zinc-400 ml-2 align-middle">
                #{displayNumber}
              </span>
            )}
          </div>
        )}

        {/* ★プライマリ指標★ 画面のメイン主役、巨大表示 */}
        {player.primaryStat && (
          <div
            className={`z-20 mb-4 bg-zinc-900/78 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden transition-all duration-300 ${
              primaryFocused
                ? 'border-[3px] border-amber-400/80 scale-[1.02] animate-pulse-soft'
                : 'border-2 border-zinc-700/60'
            }`}
            style={{ boxShadow: primaryFocused
              ? `0 0 40px ${themeClass.glow}80, 0 0 16px rgba(251,191,36,0.5)`
              : `0 0 32px ${themeClass.glow}40` }}
          >
            {/* 装飾: 背景に薄くラベル文字 */}
            <div className="absolute -top-3 right-2 text-[42px] font-black opacity-[0.06] leading-none select-none pointer-events-none"
                 style={{ color: themeClass.primary }}>
              {player.primaryStat.label}
            </div>

            {/* ★v5.14.0★ フォーカス時の左側矢印インジケータ */}
            {primaryFocused && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-amber-400 text-[20px] animate-bounce-x">
                ▶
              </div>
            )}

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
            {displayStats.map((stat, i) => {
              const focused = isStatFocused(stat.label);
              return (
                <div
                  key={i}
                  className={`bg-zinc-900/78 rounded-lg p-2 backdrop-blur-sm transition-all duration-300 relative ${
                    focused
                      ? 'border-2 border-amber-400/80 scale-105 animate-pulse-soft'
                      : 'border border-zinc-700/50'
                  }`}
                  style={focused ? { boxShadow: '0 0 16px rgba(251,191,36,0.5)' } : {}}
                >
                  {/* フォーカス時の右上マーク */}
                  {focused && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 text-zinc-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      話題中
                    </div>
                  )}
                  <div className="text-[10px] font-black text-zinc-300 tracking-widest mb-0.5">{stat.label}</div>
                  <div className={`text-[18px] font-mono font-black tracking-tighter ${
                    focused ? 'text-amber-300' : 'text-white'
                  }`}>{stat.value}</div>
                  {stat.sub && <div className="text-[9px] text-zinc-500">{stat.sub}</div>}
                </div>
              );
            })}
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
