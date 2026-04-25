/**
 * layoutType: versus_card (v3)
 * 1対1対決を「対決感」で見せるレイアウト。
 *
 * v3 改修点:
 * - WIN/差●マークが選手名にかぶらないように位置調整 (右上の独立バッジ)
 * - スコア(0-100)バーを最小化、★生指標値 (rawMain/rawSub) を主役★に
 * - 比較矢印を強化、テロップ透過度を上げて (背景 0.85 → 0.78)
 *
 * layoutData.versus スキーマ (v3):
 * {
 *   mood?: "main_wins" | "main_loses" | "close",
 *   overall: { main: 85, sub: 78 },     // バー表示用 (補助)
 *   categoryScores: [
 *     { 
 *       label: "打撃",
 *       kana?: "だげき",
 *       main: 82, sub: 75,              // バー用 (補助)
 *       rawMain: ".285",                // ★主役表示★
 *       rawSub: ".265",
 *       lowerBetter?: false              // 防御率/WHIP/失策などは true
 *     }
 *   ]
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

export function VersusCardLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // 互換性レイヤ: 二重ネスト解除
  const _rawData = projectData.layoutData?.versus;
  const _unwrapped = (_rawData && typeof _rawData === 'object' && _rawData.versus && _rawData.versus.categoryScores)
    ? _rawData.versus
    : _rawData;

  const data = _unwrapped || {
    overall: { main: 85, sub: 78 },
    categoryScores: [
      { label: '打撃', main: 82, sub: 75 },
      { label: '守備', main: 88, sub: 70 },
      { label: '走塁', main: 85, sub: 89 },
      { label: '総合', main: 85, sub: 78 },
    ],
  };

  // mood 自動判定
  const overall = data.overall || { main: 50, sub: 50 };
  const autoMood = overall.main > overall.sub
    ? 'main_wins'
    : overall.main < overall.sub
      ? 'main_loses'
      : 'close';
  const mood = data.mood || autoMood;

  const scoreDiff = Math.abs(overall.main - overall.sub);
  const mainColorBg = themeClass.bg;
  const subColorBg = 'bg-sky-500';

  // カテゴリで「勝ち」を判定 (lowerBetter: true なら数値が小さい方が勝ち)
  const judgeWinner = (cat) => {
    if (cat.lowerBetter) {
      if (cat.main < cat.sub) return 'main';
      if (cat.sub < cat.main) return 'sub';
    } else {
      if (cat.main > cat.sub) return 'main';
      if (cat.sub > cat.main) return 'sub';
    }
    return 'tie';
  };

  return (
    <>
      <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[34%] px-2">

        {/* 上部: サマリー帯 ★WIN/差●マークは選手名から離して右上独立バッジ★ */}
        <div className={`relative bg-zinc-900/78 rounded-xl border-2 overflow-visible mb-2 z-20 backdrop-blur-sm ${
          mood === 'main_wins' ? `${themeClass.border}` :
          mood === 'main_loses' ? 'border-red-500/40' :
          'border-zinc-700/50'
        }`}
        style={{
          boxShadow: mood === 'main_wins'
            ? `0 0 24px ${themeClass.glow}40`
            : mood === 'main_loses'
              ? '0 0 24px rgba(239,68,68,0.3)'
              : 'none'
        }}>
          {/* ★WIN マークを枠の右上の外側に独立配置★ */}
          {mood === 'main_wins' && (
            <div className={`absolute -top-2 left-3 px-2 py-0.5 ${themeClass.bg} text-white text-[10px] font-black rounded-full shadow-lg tracking-widest z-30`}>
              WIN
            </div>
          )}
          {mood === 'main_loses' && (
            <div className="absolute -top-2 left-3 px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-lg tracking-widest z-30">
              -{scoreDiff}
            </div>
          )}
          {mood === 'close' && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-zinc-700 text-white text-[10px] font-black rounded-full shadow-lg tracking-widest z-30">
              互角
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2.5 gap-2">

            {/* 左: main */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className={`w-6 h-6 ${mainColorBg} text-white font-black text-[11px] rounded-md flex items-center justify-center shadow-md`}>
                  {projectData.mainPlayer?.number}
                </span>
                <span className={`${themeClass.text} text-[16px] font-black tracking-tighter leading-none`}>
                  {projectData.mainPlayer?.name}
                </span>
              </div>
              <div className={`text-[11px] font-bold mt-1 ${themeClass.text} opacity-80`}>
                {projectData.mainPlayer?.label}
              </div>
            </div>

            {/* 中央: VS */}
            <div className="flex flex-col items-center px-1">
              <span className="text-[24px] font-black italic tracking-tighter leading-none" style={{
                background: mood === 'main_wins'
                  ? `linear-gradient(180deg, ${themeClass.primary} 0%, #fff 50%, #888 100%)`
                  : mood === 'main_loses'
                    ? `linear-gradient(180deg, #888 0%, #fff 50%, #38bdf8 100%)`
                    : `linear-gradient(180deg, ${themeClass.primary} 0%, #fff 50%, #38bdf8 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                VS
              </span>
            </div>

            {/* 右: sub */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="text-sky-400 text-[16px] font-black tracking-tighter leading-none">
                  {projectData.subPlayer?.name}
                </span>
                <span className={`w-6 h-6 ${subColorBg} text-white font-black text-[11px] rounded-md flex items-center justify-center shadow-md`}>
                  {projectData.subPlayer?.number}
                </span>
              </div>
              <div className="text-[11px] font-bold mt-1 text-sky-400 opacity-80">
                {projectData.subPlayer?.label}
              </div>
            </div>
          </div>
        </div>

        {/* メイン: 指標別比較 ★生指標値 (rawMain/rawSub) を主役★ */}
        <div className="bg-zinc-900/78 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
          <div className="px-3 py-1.5 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-center">
            <span className={`${themeClass.text} text-[11px] font-black tracking-widest`}>指標別の比較</span>
          </div>
          {(data.categoryScores || []).map((cat, i) => {
            const winner = judgeWinner(cat);
            const mainWin = winner === 'main';
            const subWin = winner === 'sub';
            const mainDisplay = cat.rawMain || `${cat.main}`;
            const subDisplay = cat.rawSub || `${cat.sub}`;
            const hasRaw = !!(cat.rawMain || cat.rawSub);

            return (
              <div key={i} className="px-2 py-2 border-b border-zinc-800 last:border-b-0">
                {/* ラベル中央 */}
                <div className="text-center mb-1">
                  <span className="text-[11px] font-black text-zinc-200">{cat.label}</span>
                  {cat.kana && <span className="text-[9px] text-zinc-500 ml-1">{cat.kana}</span>}
                </div>

                {/* ★生指標値を主役にレイアウト★ 左=mainの数値、中=矢印、右=subの数値 */}
                <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-2">
                  {/* 左: main 値 (大きく) */}
                  <div className="flex items-baseline justify-end gap-1">
                    <span className={`text-[20px] font-mono font-black leading-none ${
                      mainWin ? themeClass.text : 'text-zinc-500'
                    }`} style={mainWin ? { textShadow: `0 0 8px ${themeClass.glow}` } : {}}>
                      {mainDisplay}
                    </span>
                  </div>

                  {/* 中央: 勝者矢印 */}
                  <div className="text-[13px] font-black text-center">
                    {mainWin && <span className={themeClass.text}>◀</span>}
                    {subWin && <span className="text-sky-400">▶</span>}
                    {!mainWin && !subWin && <span className="text-zinc-600">=</span>}
                  </div>

                  {/* 右: sub 値 (大きく) */}
                  <div className="flex items-baseline justify-start gap-1">
                    <span className={`text-[20px] font-mono font-black leading-none ${
                      subWin ? 'text-sky-400' : 'text-zinc-500'
                    }`} style={subWin ? { textShadow: '0 0 8px rgba(56,189,248,0.6)' } : {}}>
                      {subDisplay}
                    </span>
                  </div>
                </div>

                {/* バー (細く・補助的に) */}
                {hasRaw && (
                  <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-2 mt-1.5">
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden flex justify-end">
                      <div
                        className={`h-full ${mainColorBg} rounded-full`}
                        style={{ width: `${Math.min(100, cat.main)}%` }}
                      />
                    </div>
                    <div></div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${subColorBg} rounded-full`}
                        style={{ width: `${Math.min(100, cat.sub)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
