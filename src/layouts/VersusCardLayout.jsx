/**
 * layoutType: versus_card (v2)
 * 1対1対決を「対決感」で見せるレイアウト。
 *
 * layoutData.versus スキーマ (v2):
 * {
 *   mood?: "main_wins" | "main_loses" | "close",   // ★勝敗強調 (新)
 *   overall: { main: 85, sub: 78 },
 *   categoryScores: [
 *     { label: "打撃", main: 82, sub: 75, rawMain?: ".285", rawSub?: ".265" },
 *     ...
 *   ]
 * }
 *
 * mood の効果:
 * - "main_wins":   mainPlayer 勝利強調 (オレンジ側に WIN・光のオーラ)
 * - "main_loses":  mainPlayer 敗北強調 (mainPlayer 側に「差●」警告、sub側に "REF" マーク)
 * - "close":       互角 (両側グレー寄り、中央に "互角" マーク)
 * - 省略時: overall の数値で自動判定 (main_wins/main_loses)
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
  const data = projectData.layoutData?.versus || {
    overall: { main: 85, sub: 78 },
    categoryScores: [
      { label: '打撃', main: 82, sub: 75 },
      { label: '守備', main: 88, sub: 70 },
      { label: '走塁', main: 85, sub: 89 },
      { label: '総合', main: 85, sub: 78 },
    ],
  };

  // mood 自動判定 (省略時)
  const autoMood = data.overall.main > data.overall.sub
    ? 'main_wins'
    : data.overall.main < data.overall.sub
      ? 'main_loses'
      : 'close';
  const mood = data.mood || autoMood;

  const scoreDiff = Math.abs(data.overall.main - data.overall.sub);
  const mainColorBg = themeClass.bg;
  const subColorBg = 'bg-sky-500';

  // mood ごとの中央マーク
  const centerMark = mood === 'main_wins' ? null  // VS のみ
    : mood === 'main_loses' ? 'WARN'
    : 'DRAW';

  return (
    <>
      <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[32%] px-2">

        {/* 上部: サマリー帯 */}
        <div className={`bg-zinc-900/90 rounded-xl border-2 overflow-hidden mb-2 z-20 backdrop-blur-sm ${
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
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2.5 gap-2">

            {/* 左: main (mainPlayer) */}
            <div className="flex flex-col items-end relative">
              {mood === 'main_wins' && (
                <div className={`absolute -top-1 right-0 px-1.5 py-0.5 ${themeClass.bg} text-white text-[8px] font-black rounded-full shadow-lg tracking-widest`}>
                  WIN
                </div>
              )}
              {mood === 'main_loses' && (
                <div className="absolute -top-1 right-0 px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black rounded-full shadow-lg tracking-widest">
                  -{scoreDiff}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-6 h-6 ${mainColorBg} text-white font-black text-[11px] rounded-md flex items-center justify-center shadow-md`}>
                  {projectData.mainPlayer?.number}
                </span>
                <span className={`${themeClass.text} text-[16px] font-black tracking-tighter leading-none`}>
                  {projectData.mainPlayer?.name}
                </span>
              </div>
              <span className={`text-[34px] font-black leading-none mt-1 ${
                mood === 'main_wins' ? themeClass.text :
                mood === 'main_loses' ? 'text-red-400' :
                'text-zinc-300'
              }`} style={{
                textShadow: mood === 'main_wins'
                  ? `0 0 18px ${themeClass.glow}`
                  : mood === 'main_loses'
                    ? '0 0 18px rgba(239,68,68,0.6)'
                    : 'none'
              }}>
                {data.overall.main}
              </span>
            </div>

            {/* 中央: VS マーク */}
            <div className="flex flex-col items-center px-1 relative">
              <span className="text-[28px] font-black italic tracking-tighter leading-none" style={{
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
              {/* 中央装飾マーク (mood 別) */}
              {centerMark === 'WARN' && (
                <span className="text-[9px] font-black text-red-400 mt-0.5 tracking-widest"
                      style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                  ⚠ 差 {scoreDiff} ⚠
                </span>
              )}
              {centerMark === 'DRAW' && (
                <span className="text-[10px] font-black text-zinc-400 mt-0.5 tracking-widest">
                  互角
                </span>
              )}
              {!centerMark && scoreDiff > 0 && (
                <span className="text-[10px] font-black text-zinc-500 mt-0.5">差 {scoreDiff}</span>
              )}
            </div>

            {/* 右: sub */}
            <div className="flex flex-col items-start relative">
              {mood === 'main_loses' && (
                <div className="absolute -top-1 left-0 px-1.5 py-0.5 bg-sky-500 text-white text-[8px] font-black rounded-full shadow-lg tracking-widest">
                  REF
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sky-400 text-[16px] font-black tracking-tighter leading-none">
                  {projectData.subPlayer?.name}
                </span>
                <span className={`w-6 h-6 ${subColorBg} text-white font-black text-[11px] rounded-md flex items-center justify-center shadow-md`}>
                  {projectData.subPlayer?.number}
                </span>
              </div>
              <span className={`text-[34px] font-black leading-none mt-1 ${
                mood === 'main_loses' ? 'text-sky-400' :
                mood === 'main_wins' ? 'text-zinc-400' :
                'text-zinc-300'
              }`} style={{
                textShadow: mood === 'main_loses' ? '0 0 18px rgba(56,189,248,0.6)' : 'none'
              }}>
                {data.overall.sub}
              </span>
            </div>
          </div>

          {/* 期間ラベル */}
          <div className="grid grid-cols-2 px-3 pb-1.5 gap-2">
            <div className={`text-[10px] font-bold text-right ${themeClass.text} opacity-80`}>
              {projectData.mainPlayer?.label}
            </div>
            <div className="text-[10px] font-bold text-left text-sky-400 opacity-80">
              {projectData.subPlayer?.label}
            </div>
          </div>
        </div>

        {/* メイン: 指標別比較 */}
        <div className="bg-zinc-900/85 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
          <div className="px-3 py-1.5 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-center">
            <span className={`${themeClass.text} text-[11px] font-black tracking-widest`}>指標別の比較</span>
          </div>
          {data.categoryScores.map((cat, i) => {
            const mainWin = cat.main > cat.sub;
            const subWin = cat.sub > cat.main;
            const mainDisplay = cat.rawMain || `${cat.main}`;
            const subDisplay = cat.rawSub || `${cat.sub}`;
            return (
              <div key={i} className="px-2.5 py-2 border-b border-zinc-800 last:border-b-0">
                <div className="text-center mb-1">
                  <span className="text-[12px] font-black text-zinc-200">{cat.label}</span>
                  {cat.kana && <span className="text-[9px] text-zinc-500 ml-1">{cat.kana}</span>}
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[15px] font-mono font-black flex-shrink-0 ${
                      mainWin ? themeClass.text : 'text-zinc-500'
                    }`}>{mainDisplay}</span>
                    <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden flex justify-end">
                      <div
                        className={`h-full ${mainColorBg} rounded-full`}
                        style={{
                          width: `${cat.main}%`,
                          boxShadow: mainWin ? `0 0 8px ${themeClass.glow}` : 'none'
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-[12px] font-black px-1 flex-shrink-0">
                    {mainWin && <span className={themeClass.text}>◀</span>}
                    {subWin && <span className="text-sky-400">▶</span>}
                    {!mainWin && !subWin && <span className="text-zinc-600">=</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${subColorBg} rounded-full`}
                        style={{
                          width: `${cat.sub}%`,
                          boxShadow: subWin ? '0 0 8px rgba(56,189,248,0.6)' : 'none'
                        }}
                      />
                    </div>
                    <span className={`text-[15px] font-mono font-black flex-shrink-0 ${
                      subWin ? 'text-sky-400' : 'text-zinc-500'
                    }`}>{subDisplay}</span>
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
