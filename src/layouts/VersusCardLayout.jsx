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

  return (
<>
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-7 pb-[30%] px-2">

      <div className="grid grid-cols-2 gap-2 mb-2 mt-2 z-20">
        <PlayerCard
          player={projectData.mainPlayer}
          score={data.overall.main}
          isWinner={mainWins}
          themeClass={themeClass}
          side="left"
        />
        <PlayerCard
          player={projectData.subPlayer}
          score={data.overall.sub}
          isWinner={!mainWins}
          themeClass={themeClass}
          side="right"
        />
      </div>

      <div className="relative flex items-center justify-center -my-2 z-30">
        <div className="bg-gradient-to-r from-transparent via-zinc-950 to-transparent px-4 py-0.5">
          <span className="text-[28px] font-black italic tracking-tighter" style={{
            background: `linear-gradient(180deg, ${themeClass.primary} 0%, #fff 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(0,0,0,0.8)',
          }}>VS</span>
        </div>
      </div>

      <div className="bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
        <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-between">
          <span className={`${themeClass.text} text-[10px] font-black`}>指標別の比較</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[8px] text-zinc-400"><span className={`w-2 h-2 rounded-sm ${themeClass.bg}`}/>{projectData.mainPlayer?.name}</span>
            <span className="flex items-center gap-1 text-[8px] text-zinc-400"><span className="w-2 h-2 rounded-sm bg-sky-400"/>{projectData.subPlayer?.name}</span>
          </div>
        </div>
        {data.categoryScores.map((cat, i) => {
          const mainWin = cat.main > cat.sub;
          const subWin = cat.sub > cat.main;
          const mainDisplay = cat.rawMain || `${cat.main}`;
          const subDisplay = cat.rawSub || `${cat.sub}`;
          return (
            <div key={i} className="px-3 py-2 border-b border-zinc-800 last:border-b-0">
              {/* ラベル + 勝者マーク */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-zinc-300">
                  {cat.label}
                  {cat.kana && <span className="text-[8px] text-zinc-500 ml-1">{cat.kana}</span>}
                </span>
                {mainWin && <span className={`text-[9px] font-black ${themeClass.text}`}>◀ {projectData.mainPlayer?.name} 優勢</span>}
                {subWin && <span className="text-[9px] font-black text-sky-400">{projectData.subPlayer?.name} 優勢 ▶</span>}
                {!mainWin && !subWin && <span className="text-[9px] font-black text-zinc-500">互角</span>}
              </div>
              {/* 2本のバーを縦に並べる */}
              <div className="space-y-0.5">
                {/* main */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${themeClass.bg}`}
                      style={{ width: `${cat.main}%`, boxShadow: mainWin ? `0 0 8px ${themeClass.glow}` : 'none' }}
                    />
                  </div>
                  <span className={`text-[11px] font-mono font-black w-12 text-right ${mainWin ? themeClass.text : 'text-zinc-400'}`}>{mainDisplay}</span>
                </div>
                {/* sub */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400"
                      style={{ width: `${cat.sub}%`, boxShadow: subWin ? '0 0 8px rgba(56,189,248,0.6)' : 'none' }}
                    />
                  </div>
                  <span className={`text-[11px] font-mono font-black w-12 text-right ${subWin ? 'text-sky-400' : 'text-zinc-400'}`}>{subDisplay}</span>
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
    <div className={`relative rounded-xl border p-2.5 transition-all overflow-hidden ${isWinner ? `border-current ring-2 ring-offset-0 ${textColor}` : 'border-zinc-700/50'} bg-zinc-900/90`}>
      {isWinner && (
        <div className={`absolute top-0 right-0 ${bgColor} text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg shadow-md`}>
          WIN
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-6 h-6 ${bgColor} text-white font-black text-[11px] rounded-md flex items-center justify-center shadow-md`}>
          {player.number}
        </span>
        <span className={`${textColor} text-[16px] font-black tracking-tighter leading-none truncate`}>{player.name}</span>
      </div>
      <div className={`text-[9px] font-bold ${textColor} opacity-70 mb-1`}>{player.label}</div>

      <div className="flex items-baseline gap-1 justify-center">
        <span className={`text-[40px] font-black tracking-tighter leading-none ${isWinner ? textColor : 'text-zinc-500'}`} style={isWinner ? { textShadow: `0 0 20px currentColor` } : {}}>
          {score}
        </span>
        <span className="text-[10px] font-bold text-zinc-500">/100</span>
      </div>
    </div>
  );
}
