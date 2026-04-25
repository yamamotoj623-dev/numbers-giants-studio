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

  return (
<>
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[28%] px-2">

      {/* 上部: メイン2カードを左右に明確に対比 */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1 mb-3 z-20 items-stretch">
        <PlayerCard
          player={projectData.mainPlayer}
          score={data.overall.main}
          isWinner={mainWins}
          themeClass={themeClass}
          side="left"
        />
        <div className="flex flex-col items-center justify-center px-1">
          <span className="text-[36px] font-black italic tracking-tighter leading-none" style={{
            background: `linear-gradient(180deg, ${themeClass.primary} 0%, #fff 50%, #38bdf8 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(0,0,0,0.8)',
          }}>VS</span>
          {scoreDiff > 0 && (
            <span className="text-[10px] font-black text-zinc-400 mt-1">差 {scoreDiff}</span>
          )}
        </div>
        <PlayerCard
          player={projectData.subPlayer}
          score={data.overall.sub}
          isWinner={!mainWins}
          themeClass={themeClass}
          side="right"
        />
      </div>

      <div className="bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
        <div className="px-3 py-2.5 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-between">
          <span className={`${themeClass.text} text-[12px] font-black`}>指標別の比較</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-zinc-300 font-bold"><span className={`w-2.5 h-2.5 rounded-sm ${themeClass.bg}`}/>{projectData.mainPlayer?.name}</span>
            <span className="flex items-center gap-1 text-[10px] text-zinc-300 font-bold"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400"/>{projectData.subPlayer?.name}</span>
          </div>
        </div>
        {data.categoryScores.map((cat, i) => {
          const mainWin = cat.main > cat.sub;
          const subWin = cat.sub > cat.main;
          const mainDisplay = cat.rawMain || `${cat.main}`;
          const subDisplay = cat.rawSub || `${cat.sub}`;
          return (
            <div key={i} className="px-3 py-2.5 border-b border-zinc-800 last:border-b-0">
              {/* ラベル + 勝者マーク */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-black text-zinc-200">
                  {cat.label}
                  {cat.kana && <span className="text-[10px] text-zinc-500 ml-1.5">{cat.kana}</span>}
                </span>
                {mainWin && <span className={`text-[11px] font-black ${themeClass.text}`}>◀ {projectData.mainPlayer?.name} 優勢</span>}
                {subWin && <span className="text-[11px] font-black text-sky-400">{projectData.subPlayer?.name} 優勢 ▶</span>}
                {!mainWin && !subWin && <span className="text-[11px] font-black text-zinc-500">互角</span>}
              </div>
              {/* 2本のバーを縦に並べる */}
              <div className="space-y-1">
                {/* main */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${themeClass.bg}`}
                      style={{ width: `${cat.main}%`, boxShadow: mainWin ? `0 0 8px ${themeClass.glow}` : 'none' }}
                    />
                  </div>
                  <span className={`text-[14px] font-mono font-black w-14 text-right ${mainWin ? themeClass.text : 'text-zinc-400'}`}>{mainDisplay}</span>
                </div>
                {/* sub */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400"
                      style={{ width: `${cat.sub}%`, boxShadow: subWin ? '0 0 8px rgba(56,189,248,0.6)' : 'none' }}
                    />
                  </div>
                  <span className={`text-[14px] font-mono font-black w-14 text-right ${subWin ? 'text-sky-400' : 'text-zinc-400'}`}>{subDisplay}</span>
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

function PlayerCard({ player, score, isWinner, themeClass, side }) {
  const bgColor = side === 'left' ? themeClass.bg : 'bg-sky-600';
  const textColor = side === 'left' ? themeClass.text : 'text-sky-400';

  return (
    <div className={`relative rounded-xl border-2 p-3 transition-all overflow-hidden ${isWinner ? `border-current ring-2 ring-offset-0 ${textColor} shadow-2xl` : 'border-zinc-700/50 opacity-90'} bg-zinc-900/90`}>
      {isWinner && (
        <div className={`absolute top-0 right-0 ${bgColor} text-white text-[10px] font-black px-2.5 py-0.5 rounded-bl-lg shadow-md tracking-wider`}>
          WIN
        </div>
      )}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-7 h-7 ${bgColor} text-white font-black text-[12px] rounded-md flex items-center justify-center shadow-md`}>
          {player.number}
        </span>
        <span className={`${textColor} text-[18px] font-black tracking-tighter leading-none truncate`}>{player.name}</span>
      </div>
      <div className={`text-[11px] font-bold ${textColor} opacity-70 mb-1.5`}>{player.label}</div>

      <div className="flex items-baseline gap-1 justify-center">
        <span className={`text-[48px] font-black tracking-tighter leading-none ${isWinner ? textColor : 'text-zinc-500'}`} style={isWinner ? { textShadow: `0 0 24px currentColor` } : {}}>
          {score}
        </span>
        <span className="text-[12px] font-bold text-zinc-500">/100</span>
      </div>
    </div>
  );
}
