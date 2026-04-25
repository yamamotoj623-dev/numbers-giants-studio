/**
 * layoutType: versus_card
 * 2選手対決フルカード。ポジション争い・起用競争の比較動画に専用。
 * mainPlayer/subPlayer の両方を対等に大きく表示する。
 *
 * layoutData.versus スキーマ（オプション）:
 * {
 *   overall: { main: 85, sub: 78 },          // 総合スコア
 *   categoryScores: [
 *     { label: "打撃", main: 82, sub: 75 },
 *     { label: "守備", main: 88, sub: 70 },
 *     { label: "走塁", main: 85, sub: 89 },
 *   ]
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

export function VersusCardLayout({ projectData, currentScript, animationKey , phase = 'normal'}) {
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

  const mainWins = data.overall.main > data.overall.sub;
  const scoreDiff = Math.abs(data.overall.main - data.overall.sub);
  const mainColorBg = themeClass.bg;
  const subColorBg = 'bg-sky-500';

  return (
<>
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[28%] px-2">

      {/* 上部: サマリー帯 (高さ抑制) */}
      <div className="bg-zinc-900/95 rounded-xl border border-zinc-700/50 overflow-hidden mb-2 z-20">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2.5 gap-2">
          {/* 左: main */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 ${mainColorBg} text-white font-black text-[11px] rounded-md flex items-center justify-center shadow-md`}>
                {projectData.mainPlayer?.number}
              </span>
              <span className={`${themeClass.text} text-[16px] font-black tracking-tighter leading-none`}>{projectData.mainPlayer?.name}</span>
            </div>
            <span className={`text-[34px] font-black leading-none mt-1 ${mainWins ? themeClass.text : 'text-zinc-400'}`} style={mainWins ? { textShadow: `0 0 18px currentColor` } : {}}>
              {data.overall.main}
            </span>
          </div>
          {/* 中央: VS */}
          <div className="flex flex-col items-center px-1">
            <span className="text-[28px] font-black italic tracking-tighter leading-none" style={{
              background: `linear-gradient(180deg, ${themeClass.primary} 0%, #fff 50%, #38bdf8 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>VS</span>
            {scoreDiff > 0 && (
              <span className="text-[10px] font-black text-zinc-500 mt-0.5">差 {scoreDiff}</span>
            )}
          </div>
          {/* 右: sub */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-sky-400 text-[16px] font-black tracking-tighter leading-none">{projectData.subPlayer?.name}</span>
              <span className={`w-6 h-6 ${subColorBg} text-white font-black text-[11px] rounded-md flex items-center justify-center shadow-md`}>
                {projectData.subPlayer?.number}
              </span>
            </div>
            <span className={`text-[34px] font-black leading-none mt-1 ${!mainWins ? 'text-sky-400' : 'text-zinc-400'}`} style={!mainWins ? { textShadow: `0 0 18px currentColor` } : {}}>
              {data.overall.sub}
            </span>
          </div>
        </div>
        {/* 選手のラベル (期間など) */}
        <div className="grid grid-cols-2 px-3 pb-1.5 gap-2">
          <div className={`text-[10px] font-bold text-right ${themeClass.text} opacity-80`}>{projectData.mainPlayer?.label}</div>
          <div className="text-[10px] font-bold text-left text-sky-400 opacity-80">{projectData.subPlayer?.label}</div>
        </div>
      </div>

      {/* メイン: 指標別比較 (1行に main vs sub を並べる) */}
      <div className="bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
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
              {/* ラベル中央に */}
              <div className="text-center mb-1">
                <span className="text-[12px] font-black text-zinc-200">{cat.label}</span>
                {cat.kana && <span className="text-[9px] text-zinc-500 ml-1">{cat.kana}</span>}
              </div>
              {/* 1行で左右対比 */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                {/* 左: main (バー右寄せ + 数字) */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[15px] font-mono font-black flex-shrink-0 ${mainWin ? themeClass.text : 'text-zinc-500'}`}>{mainDisplay}</span>
                  <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden flex justify-end">
                    <div
                      className={`h-full ${mainColorBg} rounded-full`}
                      style={{ width: `${cat.main}%`, boxShadow: mainWin ? `0 0 8px ${themeClass.glow}` : 'none' }}
                    />
                  </div>
                </div>
                {/* 中央: 勝者マーク */}
                <div className="text-[12px] font-black px-1 flex-shrink-0">
                  {mainWin && <span className={themeClass.text}>◀</span>}
                  {subWin && <span className="text-sky-400">▶</span>}
                  {!mainWin && !subWin && <span className="text-zinc-600">=</span>}
                </div>
                {/* 右: sub (バー左寄せ + 数字) */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${subColorBg} rounded-full`}
                      style={{ width: `${cat.sub}%`, boxShadow: subWin ? '0 0 8px rgba(56,189,248,0.6)' : 'none' }}
                    />
                  </div>
                  <span className={`text-[15px] font-mono font-black flex-shrink-0 ${subWin ? 'text-sky-400' : 'text-zinc-500'}`}>{subDisplay}</span>
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

function PlayerCard() { return null; } // 旧PlayerCardは未使用、削除予定
