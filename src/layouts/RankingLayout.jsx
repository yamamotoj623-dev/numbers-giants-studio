/**
 * layoutType: ranking (v2)
 * 順位/ランキング表示レイアウト。「衝撃」を与える役割。
 *
 * layoutData.ranking スキーマ (v2):
 * {
 *   mode: "single" | "multi",          // single: 1指標、multi: 複数指標タブ切替
 *   mood?: "best" | "worst" | "neutral",  // ★トーン切替 (新)
 *   showCutoff?: boolean,              // 圏外マーカーを表示するか
 *   metrics: [
 *     {
 *       id: "ops",
 *       label: "OPS",
 *       kana: "オーピーエス" (省略可),
 *       unit: "" (省略可),
 *       entries: [
 *         {
 *           rank: 1,
 *           name: "泉口",
 *           team: "G",              // ★v5.18.4新★ 球団略称 (G/D/T/S/E/F/B/H/M/L 等)
 *                                    // 球団横断ランキング (リーグ全体等) で表示推奨
 *                                    // 自軍動画では省略可 (G が並ぶだけなのでノイズ)
 *           value: "1.013",
 *           sub: "12試合",         // 補足情報 (省略可)
 *           isMainPlayer?: bool,    // 注目選手 (動画全体で複数可、★currentScript.focusEntry が優先)
 *           isTeam?: bool          // チームエントリ (新、シルエット非表示など)
 *         },
 *         ...
 *       ]
 *     }
 *   ]
 * }
 *
 * 注意: 同時刻に強調 (◀注目) されるのは currentScript.focusEntry で指定された1人のみ。
 *      isMainPlayer は背景色の弱い強調のみで、◀注目マークは付かない。
 *
 * mood の効果:
 * - "best":   1位に👑、ベスト3に金/銀/銅、明るいトーン
 * - "worst":  1位に⚠️、ワースト3に▼マーク、暗い赤トーン
 * - "neutral": 中性 (デフォルト)
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';
import { isEnglishMetric } from '../lib/metricUtils';
import { useSpringNumber } from '../hooks/useSpringNumber';

// ★v5.19.0★ 数値をバネ物理でカウントアップ表示
function SpringValue({ value, unit }) {
  const raw = String(value || '');
  const numMatch = raw.match(/^([+-]?)(\d*\.?\d+)/);
  const numericVal = numMatch ? parseFloat(numMatch[0]) : NaN;
  const decimals = numMatch ? (numMatch[2].split('.')[1] || '').length : 0;
  const hasLeadingDot = raw.startsWith('.');

  const springVal = useSpringNumber(isNaN(numericVal) ? 0 : numericVal, {
    stiffness: 150, damping: 16, precision: decimals > 0 ? 0.001 : 0.5,
  });

  if (isNaN(numericVal)) return <>{raw}{unit || ''}</>;

  let formatted = springVal.toFixed(decimals);
  if (hasLeadingDot && formatted.startsWith('0.')) formatted = formatted.slice(1);
  return <>{formatted}{unit || ''}</>;
}

// mood ごとのスタイル定義
const MOOD_STYLES = {
  best: {
    titleSuffix: 'ランキング',
    headerColor: 'text-yellow-400',
    rank1Color: 'text-yellow-400',
    rank2Color: 'text-zinc-200',
    rank3Color: 'text-amber-400',
    rankOtherColor: 'text-zinc-500',
    rank1Icon: '👑',
    rank2Icon: '🥈',
    rank3Icon: '🥉',
    barColor: '#fbbf24', // gold
    glowColor: 'rgba(251,191,36,0.6)',
    rowBg: 'from-yellow-900/15 to-amber-900/10',
    accentText: 'text-yellow-300',
  },
  worst: {
    titleSuffix: 'ワースト',
    headerColor: 'text-red-400',
    rank1Color: 'text-red-400',
    rank2Color: 'text-red-300',
    rank3Color: 'text-orange-400',
    rankOtherColor: 'text-zinc-500',
    rank1Icon: '⚠️',
    rank2Icon: '▼',
    rank3Icon: '▼',
    barColor: '#ef4444', // red
    glowColor: 'rgba(239,68,68,0.6)',
    rowBg: 'from-red-900/15 to-zinc-900/10',
    accentText: 'text-red-300',
  },
  neutral: {
    titleSuffix: 'ランキング',
    headerColor: '',
    rank1Color: 'text-yellow-400',
    rank2Color: 'text-zinc-300',
    rank3Color: 'text-orange-300',
    rankOtherColor: 'text-zinc-500',
    rank1Icon: '',
    rank2Icon: '',
    rank3Icon: '',
    barColor: null,
    glowColor: null,
    rowBg: '',
    accentText: '',
  },
};

export function RankingLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // 互換性レイヤ: Geminiが二重ネスト ({ranking:{ranking:{...}}}) で出すことがあるため解除
  const _rawData = projectData.layoutData?.ranking;
  const _unwrapped = (_rawData && typeof _rawData === 'object' && _rawData.ranking && Array.isArray(_rawData.ranking.metrics))
    ? _rawData.ranking
    : _rawData;

  // データ有効性判定: ranking は metrics[] が必要
  const _hasValidData = _unwrapped && typeof _unwrapped === 'object' &&
    Array.isArray(_unwrapped.metrics) && _unwrapped.metrics.length > 0;

  const data = _hasValidData ? _unwrapped : {
    mode: 'single',
    mood: 'neutral',
    metrics: [
      {
        id: 'ops',
        label: 'OPS',
        unit: '',
        entries: [
          {rank: 1, name: '選手A', value: '1.013'},
          {rank: 2, name: '選手B', value: '.980'},
          {rank: 3, name: '選手C', value: '.724', isMainPlayer: true},
        ],
      },
    ],
  };

  const mood = data.mood || 'neutral';
  const moodStyle = MOOD_STYLES[mood] || MOOD_STYLES.neutral;

  // metrics が無い/空なら処理スキップ (空表示)
  const metrics = Array.isArray(data.metrics) ? data.metrics : [];
  if (metrics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-[12px]">
        ランキングデータが空です
      </div>
    );
  }

  // ★v5.18.13★ metric の解決優先順位:
  //   1. currentScript.focusMetric (新フィールド、ranking 専用)
  //   2. currentScript.highlight (互換: comparisons.id とも兼用)
  //   3. metrics[0] (デフォルト先頭)
  const focusedMetricId = currentScript?.focusMetric || currentScript?.highlight;
  const activeMetric = (focusedMetricId && metrics.find(m => m.id === focusedMetricId))
    || metrics[0];

  // 動画 (全体) の中で最終的に「◀注目」マークが付くのは focusEntry で指定された1人のみ
  const focusedName = currentScript?.focusEntry || null;

  return (
    <>
      {/* ★v5.19.2★ key に activeMetric.id + focusedName を含めて、
          metric 切替・フォーカス変更のたびにアニメーションが再発火するようにする */}
      <div key={`rank-${animationKey}-${activeMetric?.id || ''}-${focusedName || ''}`}
           className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[32%] px-3">
        {/* タブ切替 (複数指標時のみ) */}
        {data.mode === "multi" && metrics.length > 1 && (
          <div className="z-20 flex gap-1.5 mb-3 overflow-x-auto">
            {metrics.map(metric => (
              <button
                key={metric.id}
                className={`text-[12px] font-black px-3 py-1.5 rounded-full whitespace-nowrap transition flex-shrink-0 ${
                  metric.id === activeMetric.id
                    ? `${themeClass.bg} text-white shadow-md`
                    : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                }`}
              >
                {metric.label}{isEnglishMetric(metric.label) && metric.kana ? `(${metric.kana})` : ''}
              </button>
            ))}
          </div>
        )}

        {/* タイトル (mood で色変化) */}
        <div className="z-20 mb-3 text-center">
          <span className={`text-[18px] font-black ${moodStyle.headerColor || themeClass.text}`}>
            {activeMetric.label}
            {isEnglishMetric(activeMetric.label) && activeMetric.kana ? <span className="text-[11px] opacity-80 ml-1">{activeMetric.kana}</span> : null}
            <span className="ml-1">{moodStyle.titleSuffix}</span>
          </span>
        </div>

        {/* ランキング表 */}
        <div className={`z-20 w-full bg-zinc-900/78 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm ${
          mood === 'best' ? 'shadow-yellow-500/20' :
          mood === 'worst' ? 'shadow-red-500/20' : ''
        }`}>
          {(() => {
            const all = activeMetric.entries || [];
            const top10 = all.slice(0, 10);
            // 注目選手が圏外なら追加表示
            const mainOutside = focusedName
              ? all.find(e => e.name === focusedName && !top10.includes(e))
              : all.find(e => e.isMainPlayer && !top10.includes(e));
            const display = mainOutside ? [...top10, mainOutside] : top10;

            // バーの長さ計算用
            const numericVals = display
              .map(e => parseFloat(String(e.value).replace(/[^\d.\-]/g, '')))
              .filter(v => !isNaN(v));
            const maxAbs = Math.max(...numericVals.map(Math.abs), 0.01);

            return display.map((entry, idx) => {
              const isTop3 = entry.rank <= 3;
              const isMain = entry.isMainPlayer;
              const isFocused = focusedName && entry.name === focusedName;
              const isCutoff = mainOutside && idx === display.length - 1;

              // 行の背景色
              let rowClass;
              if (isFocused) {
                // ★最強調★ focusEntry に指定された1選手のみ
                if (mood === 'best') {
                  rowClass = 'bg-gradient-to-r from-yellow-700/40 to-amber-800/30 border-2 border-yellow-400 shadow-2xl shadow-yellow-500/30';
                } else if (mood === 'worst') {
                  rowClass = 'bg-gradient-to-r from-red-900/40 to-zinc-900/40 border-2 border-red-500 shadow-2xl shadow-red-500/30';
                } else {
                  rowClass = `${themeClass.bg}/30 border-2 ${themeClass.border} shadow-2xl`;
                }
              } else if (isMain) {
                // ★中強調★ 注目選手フラグ付きだが今は焦点でない選手
                rowClass = `${themeClass.bg}/15 border ${themeClass.border}/50`;
              } else {
                // 通常行 (mood に応じたうっすら背景)
                const baseBg = idx % 2 === 0 ? 'bg-zinc-800/40' : 'bg-zinc-900/40';
                rowClass = mood !== 'neutral'
                  ? `${baseBg} bg-gradient-to-r ${moodStyle.rowBg}`
                  : baseBg;
              }

              const numVal = parseFloat(String(entry.value).replace(/[^\d.\-]/g, ''));
              const barPct = isNaN(numVal) ? 0 : Math.min(Math.abs(numVal) / maxAbs * 100, 100);
              const isNegative = !isNaN(numVal) && numVal < 0;

              // 順位表示の色とアイコン
              const rankColor =
                entry.rank === 1 ? moodStyle.rank1Color :
                entry.rank === 2 ? moodStyle.rank2Color :
                entry.rank === 3 ? moodStyle.rank3Color :
                moodStyle.rankOtherColor;
              const rankIcon =
                entry.rank === 1 ? moodStyle.rank1Icon :
                entry.rank === 2 ? moodStyle.rank2Icon :
                entry.rank === 3 ? moodStyle.rank3Icon : '';

              // バー色
              const barColor = isNegative ? '#ef4444'
                : (isFocused && moodStyle.barColor) ? moodStyle.barColor
                : moodStyle.barColor || themeClass.glow;

              return (
                <React.Fragment key={`${entry.rank}-${entry.name}`}>
                  {isCutoff && (
                    <div className="text-center text-zinc-500 text-[11px] py-1.5 bg-zinc-950/50 font-bold border-y border-zinc-800">
                      ⋯ 圏外 ⋯
                    </div>
                  )}
                  {/* ★v5.19.0★ rank-row-anim でバネ入場 (左からスライドイン + バウンス) */}
                  <div
                    className={`rank-row-anim flex items-center px-3 py-2 border-b border-zinc-800 ${rowClass} ${
                      isFocused ? 'scale-[1.04] z-10 relative' : ''
                    }`}
                    style={isFocused && moodStyle.glowColor ? {
                      animation: 'focusRowGlow 2s ease-in-out infinite, rankRowIn 0.5s var(--spring-bounce) forwards',
                    } : {}}
                  >
                    {/* 順位 */}
                    <div className={`w-9 flex-shrink-0 text-center font-black text-[17px] ${rankColor}`}>
                      {entry.rank}
                      {rankIcon && <span className="text-[10px] ml-0.5">{rankIcon}</span>}
                    </div>

                    {/* 選手名 + サブ情報 */}
                    <div className="flex-1 px-2 min-w-0">
                      <div className={`text-[15px] font-black truncate ${
                        isFocused
                          ? (mood === 'best' ? 'text-yellow-200' : mood === 'worst' ? 'text-red-200' : 'text-white')
                          : (isMain ? themeClass.text : 'text-zinc-300')
                      }`}>
                        {entry.isTeam && <span className="text-[10px] mr-1 opacity-70">[ チーム ]</span>}
                        {entry.name}
                        {/* ★v5.18.4★ 球団略称 (G/D/T/S/E/F 等) — 球団横断ランキングで識別 */}
                        {entry.team && !entry.isTeam && (
                          <span className={`ml-1 text-[11px] font-bold ${
                            entry.team === 'G' ? 'text-orange-300' : 'text-zinc-400'
                          }`}>
                            ({entry.team})
                          </span>
                        )}
                        {isFocused && (
                          <span className={`ml-1.5 text-[10px] ${moodStyle.accentText || themeClass.text}`}
                                style={{ animation: 'badgeBreath 1.2s ease-in-out infinite' }}>
                            ◀ 注目
                          </span>
                        )}
                      </div>
                      {entry.sub && <div className="text-[10px] font-bold text-zinc-500 truncate leading-tight">{entry.sub}</div>}
                    </div>

                    {/* 値 + バー (★v5.19.0★ バネアニメーション) */}
                    <div className="flex-shrink-0 flex flex-col items-end" style={{ width: 80 }}>
                      <div className={`num-spring text-[18px] font-impact leading-none ${
                        isFocused
                          ? (mood === 'best' ? 'text-yellow-300' : mood === 'worst' ? 'text-red-300' : themeClass.text)
                          : (isMain ? themeClass.text : (isTop3 ? 'text-white' : 'text-zinc-400'))
                      }`} style={isFocused || isMain ? { textShadow: `0 0 10px ${themeClass.glow}80` } : {}}>
                        <SpringValue value={entry.value} unit={activeMetric.unit || ''} />
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        {/* ★v5.19.0★ bar-spring でバネ伸長 (scaleX ベース) */}
                        <div
                          className="h-full rounded-full bar-spring"
                          style={{
                            width: `${barPct}%`,
                            background: barColor,
                            boxShadow: isFocused ? `0 0 8px ${moodStyle.glowColor || themeClass.glow}` : 'none',
                            animationDelay: `${idx * 0.07 + 0.15}s`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            });
          })()}
        </div>
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
