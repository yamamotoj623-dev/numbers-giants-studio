/**
 * layoutType: versus_card (v5) — 行強調追加
 *
 * v5 改修点 (★v5.14.0★):
 * - 基本成績の視覚的強調: script.highlight が指す comparison の label と
 *   categoryScores[].label が一致する行をパルス強調 (迷子防止)
 *
 * v4 (前回):
 * - ★0-100 スコア廃止★ (意味不明だった)
 * - ★バー廃止★ (見にくかった)
 * - ★装飾バッジ廃止★ (WIN, REF, -差●, 互角 など、選手名にかぶる問題)
 * - ★純粋な数字 vs 数字★ で勝者の数字を強調するだけ
 *
 * layoutData.versus スキーマ (v4 シンプル):
 * {
 *   categoryScores: [
 *     {
 *       label: "打撃",
 *       kana?: "だげき",
 *       rawMain: ".285",
 *       rawSub: ".265",
 *       lowerBetter?: false   // 防御率/WHIP 等は true
 *     }
 *   ]
 * }
 *
 * ※ overall, mood, main/sub 数値スコア は今後使わない (互換性のため受け取るが無視)
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

// ラベル一致判定 (完全一致 or 双方向部分一致、case-insensitive)
function statMatches(statLabel, targetLabel) {
  if (!statLabel || !targetLabel) return false;
  const a = String(statLabel).toLowerCase().trim();
  const b = String(targetLabel).toLowerCase().trim();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function VersusCardLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  // ★v5.14.0★ phase に関係なく、currentScript.highlight があれば行強調を発火
  const focusedComp = currentScript?.highlight
    ? projectData.comparisons?.find(c => c.id === currentScript.highlight)
    : null;
  const focusedLabel = focusedComp?.label || null;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // 互換性レイヤ: 二重ネスト解除
  const _rawData = projectData.layoutData?.versus;
  const _unwrapped = (_rawData && typeof _rawData === 'object' && _rawData.versus && _rawData.versus.categoryScores)
    ? _rawData.versus
    : _rawData;

  // データ有効性判定: versus は categoryScores[] が必要
  const _hasValidData = _unwrapped && typeof _unwrapped === 'object' &&
    Array.isArray(_unwrapped.categoryScores) && _unwrapped.categoryScores.length > 0;

  const data = _hasValidData ? _unwrapped : {
    categoryScores: [
      { label: '打率', rawMain: '.285', rawSub: '.265' },
      { label: '本塁打', rawMain: '12', rawSub: '5' },
      { label: '打点', rawMain: '38', rawSub: '21' },
      { label: 'OPS', rawMain: '.812', rawSub: '.620' },
    ],
  };

  // 勝者判定 (lowerBetter:true なら数値小さい方が勝ち)
  const judgeWinner = (cat) => {
    const m = parseFloat(String(cat.rawMain ?? cat.main ?? '').replace(/[^\d.\-]/g, ''));
    const s = parseFloat(String(cat.rawSub ?? cat.sub ?? '').replace(/[^\d.\-]/g, ''));
    if (isNaN(m) || isNaN(s)) return 'tie';
    if (cat.lowerBetter) {
      if (m < s) return 'main';
      if (s < m) return 'sub';
    } else {
      if (m > s) return 'main';
      if (s > m) return 'sub';
    }
    return 'tie';
  };

  return (
    <>
      <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-10 pb-[40%] px-3">

        {/* ヘッダー: 両選手のラベルと VS のみ (装飾バッジ無し) */}
        <div className="z-20 mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* main 側 */}
          <div className="flex flex-col items-end">
            <span className={`text-[14px] font-black ${themeClass.text} tracking-tighter leading-none`}>
              {projectData.mainPlayer?.name}
            </span>
            <span className={`text-[10px] font-bold mt-0.5 ${themeClass.text} opacity-70`}>
              {projectData.mainPlayer?.label}
            </span>
          </div>

          {/* VS */}
          <span className="text-[20px] font-black italic tracking-tighter px-2" style={{
            background: `linear-gradient(180deg, ${themeClass.primary} 0%, #fff 50%, #38bdf8 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            VS
          </span>

          {/* sub 側 */}
          <div className="flex flex-col items-start">
            <span className="text-[14px] font-black text-sky-400 tracking-tighter leading-none">
              {projectData.subPlayer?.name}
            </span>
            <span className="text-[10px] font-bold mt-0.5 text-sky-400 opacity-70">
              {projectData.subPlayer?.label}
            </span>
          </div>
        </div>

        {/* メイン: 純粋な数字比較 */}
        <div className="z-20 bg-zinc-900/78 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
          {(data.categoryScores || []).map((cat, i) => {
            const winner = judgeWinner(cat);
            const mainWin = winner === 'main';
            const subWin = winner === 'sub';
            const mainDisplay = cat.rawMain ?? cat.main ?? '-';
            const subDisplay = cat.rawSub ?? cat.sub ?? '-';
            // ★v5.14.0★ 行フォーカス判定
            const focused = focusedLabel && (statMatches(cat.label, focusedLabel) || statMatches(cat.kana, focusedLabel));

            return (
              <div
                key={i}
                className={`relative px-3 py-2.5 border-b border-zinc-800 last:border-b-0 transition-all duration-300 ${
                  focused ? 'bg-amber-500/15 animate-pulse-soft ring-2 ring-amber-400/60 rounded-md' : ''
                }`}
              >
                {/* ★v5.15.5★ フォーカス時は左側矢印 + 行全体ハイライト (テキスト「話題中」は削除) */}
                {focused && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-amber-400 text-[20px] animate-bounce-x drop-shadow-lg">
                    ▶
                  </div>
                )}

                {/* ラベル中央 (★v5.15.5★ kana 削除、縦の間延び解消) */}
                <div className="text-center mb-1">
                  <span className={`text-[12px] font-black tracking-widest ${
                    focused ? 'text-amber-300' : 'text-zinc-200'
                  }`}>
                    {cat.label}
                  </span>
                </div>

                {/* ★純粋な数字比較★: main 数値 / 矢印 / sub 数値 */}
                <div className="grid grid-cols-[1fr_30px_1fr] items-center gap-2">
                  {/* main 数値 (★v5.17.0★ font-impact + 発光強化) */}
                  <div className="text-right">
                    <span className={`font-impact leading-none transition-all ${
                      focused ? 'text-[34px]' : 'text-[28px]'
                    } ${
                      mainWin ? (focused ? 'neon-number' : themeClass.text) : 'text-zinc-500'
                    }`} style={mainWin && !focused ? { textShadow: `0 0 14px ${themeClass.glow}, 0 0 28px ${themeClass.glow}80` } : {}}>
                      {mainDisplay}
                    </span>
                  </div>

                  {/* 中央矢印 (勝者を指す) */}
                  <div className="text-[16px] font-black text-center">
                    {mainWin && <span className={themeClass.text} style={{ textShadow: `0 0 8px ${themeClass.glow}` }}>◀</span>}
                    {subWin && <span className="text-sky-400" style={{ textShadow: '0 0 8px rgba(56,189,248,0.7)' }}>▶</span>}
                    {!mainWin && !subWin && <span className="text-zinc-600">=</span>}
                  </div>

                  {/* sub 数値 (★v5.17.0★ font-impact + 発光強化) */}
                  <div className="text-left">
                    <span className={`font-impact leading-none transition-all ${
                      focused ? 'text-[34px]' : 'text-[28px]'
                    } ${
                      subWin ? 'text-sky-300' : 'text-zinc-500'
                    }`} style={subWin ? { textShadow: '0 0 14px rgba(56,189,248,0.85), 0 0 28px rgba(56,189,248,0.4)' } : {}}>
                      {subDisplay}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
