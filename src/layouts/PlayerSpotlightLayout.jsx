/**
 * layoutType: player_spotlight (v5)
 * 1選手のデータを「主役感」で見せるレイアウト。
 *
 * ★v5.15.5★ mode で複数パターン切替:
 *   - 'default' (or undefined): primaryStat + stats grid (現状)
 *   - 'quote': 選手の発言・コメントを大きな文字でピック表示
 *   - 'stats_grid': 基本成績を等価で網羅 (4-6指標、フォーカスなし)
 *   - 'single_metric': 1指標を画面いっぱいに超巨大表示
 *
 * v5 改修点 (★v5.14.0★):
 * - showPlayerName: 'auto'|true|false 追加
 * - 基本成績の視覚的強調
 *
 * layoutData.spotlight スキーマ:
 * {
 *   mode?: 'default' | 'quote' | 'stats_grid' | 'single_metric',  // ★v5.15.5新★
 *   showPlayerName?: 'auto' | true | false,
 *   players: [
 *     {
 *       id: "okamoto",
 *       label: "26年(今季)",
 *       name?: "岡本和真",
 *       number?: "25",
 *       primaryStat: { label, value, isNegative, compareValue? },  // default / single_metric
 *       stats: [{ label, value }, ...],                             // default / stats_grid
 *       quote?: "...",                                              // quote モード用 (発言)
 *       quoteSource?: "監督インタビュー (4/15)",                     // quote の出典
 *       comment?: "..."
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

  // ★v5.15.5★ mode 解決 (default | quote | stats_grid | single_metric)
  const mode = data.mode || 'default';

  return (
    <>
      <div key={`zoom-${animationKey}-${player.id || 'p'}-${mode}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-8 pb-[44%] px-3">

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

        {/* ★v5.15.5★ mode 別本体 */}
        {mode === 'quote' && (
          <div className="z-20 flex-1 flex flex-col items-center justify-start pt-4 px-2">
            {/* 引用記号 装飾 */}
            <div className="text-[80px] leading-none opacity-20 -mb-4 select-none" style={{ color: themeClass.primary }}>
              "
            </div>
            <div className="text-[20px] font-black text-white text-center leading-snug px-3 py-2"
                 style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              {player.quote || player.comment || '(発言が登録されていません)'}
            </div>
            <div className="text-[60px] leading-none opacity-20 self-end -mt-4 mr-4 select-none" style={{ color: themeClass.primary }}>
              "
            </div>
            {player.quoteSource && (
              <div className={`mt-4 text-[10px] font-bold tracking-wider ${themeClass.text} opacity-80`}>
                — {player.quoteSource}
              </div>
            )}
          </div>
        )}

        {mode === 'single_metric' && player.primaryStat && (
          <div className="z-20 flex-1 flex flex-col items-center justify-start pt-6">
            <div className={`text-[16px] font-jp-heavy tracking-widest mb-2 ${themeClass.text}`}>
              {player.primaryStat.label}
            </div>
            <div
              className={`font-impact leading-none ${isNeg ? 'neon-number-red' : 'neon-number'}`}
              style={{ fontSize: '140px' }}
            >
              {player.primaryStat.value}
            </div>
            {compareValue && (
              <div className="mt-4 text-center">
                <span className="text-[12px] text-zinc-500 mr-2">{compareValue.label}:</span>
                <span className="text-[20px] font-impact text-zinc-300">{compareValue.value}</span>
              </div>
            )}
          </div>
        )}

        {mode === 'stats_grid' && (
          <div className="z-20 flex-1 flex flex-col justify-start pt-2">
            <div className={`grid gap-2 ${displayStats.length >= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {/* primaryStat も等価で grid 内に取り込む */}
              {player.primaryStat && (
                <div
                  key="_primary"
                  className="bg-zinc-900/78 rounded-lg p-3 backdrop-blur-sm border border-zinc-700/50 relative overflow-hidden"
                  style={{ boxShadow: `0 0 16px ${themeClass.glow}30` }}
                >
                  <div className={`text-[11px] font-black tracking-widest mb-1 ${themeClass.text}`}>
                    {player.primaryStat.label}
                  </div>
                  <div className={`text-[26px] font-mono font-black tracking-tighter ${
                    isNeg ? 'text-red-400' : 'text-white'
                  }`}>
                    {player.primaryStat.value}
                  </div>
                  {compareValue && (
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      {compareValue.label}: {compareValue.value}
                    </div>
                  )}
                </div>
              )}
              {displayStats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/78 rounded-lg p-3 backdrop-blur-sm border border-zinc-700/50"
                >
                  <div className="text-[11px] font-black text-zinc-300 tracking-widest mb-1">
                    {stat.label}
                  </div>
                  <div className="text-[24px] font-mono font-black tracking-tighter text-white">
                    {stat.value}
                  </div>
                  {stat.sub && <div className="text-[9px] text-zinc-500 mt-0.5">{stat.sub}</div>}
                </div>
              ))}
            </div>
            {player.comment && (
              <div className={`mt-3 bg-zinc-900/78 border-l-4 ${themeClass.border} rounded p-2 backdrop-blur-sm`}>
                <div className="text-[11px] font-bold text-zinc-200 leading-snug">{player.comment}</div>
              </div>
            )}
          </div>
        )}

        {/* ★default モード★ 既存の primaryStat 巨大 + stats grid */}
        {mode === 'default' && (
          <>
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
                    {/* ★巨大数値★ (★v5.17.0★ font-impact + neon-number 適用) */}
                    <span className={`text-[68px] font-impact leading-none ${
                      isNeg ? 'neon-number-red' : 'neon-number'
                    }`}>
                      {player.primaryStat.value}
                    </span>
                  </div>

                  {/* 比較値 (右下) */}
                  {compareValue && (
                    <div className="flex flex-col items-end pb-2">
                      <span className="text-[10px] font-bold text-zinc-500 tracking-wider mb-0.5">
                        {compareValue.label}
                      </span>
                      <span className="text-[26px] font-impact text-zinc-300">
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
                      style={focused ? { boxShadow: '0 0 20px rgba(251,191,36,0.6), 0 0 8px rgba(251,191,36,0.4)' } : {}}
                    >
                      {/* ★v5.15.5★ フォーカス時は枠 + scale + amber 色のみ (テキスト「話題中」削除) */}
                      <div className={`text-[10px] font-black tracking-widest mb-0.5 ${
                        focused ? 'text-amber-300' : 'text-zinc-300'
                      }`}>{stat.label}</div>
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
          </>
        )}

      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
