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
        <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/30">
          <span className={`${themeClass.text} text-[10px] font-black`}>カテゴリ別比較</span>
        </div>
        {data.categoryScores.map((cat, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 last:border-b-0">
            <div className="w-10 text-[10px] font-black text-zinc-400 text-center">{cat.label}</div>

            <div className="flex-1 flex items-center justify-end gap-1">
              <span className={`text-[13px] font-mono font-black ${cat.main > cat.sub ? themeClass.text : 'text-zinc-500'}`}>{cat.main}</span>
              <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full absolute right-0 ${cat.main > cat.sub ? themeClass.bg : 'bg-zinc-600'}`}
                  style={{ width: `${cat.main}%`, boxShadow: cat.main > cat.sub ? `0 0 8px ${themeClass.glow}` : 'none' }}
                />
              </div>
            </div>

            <div className={`text-[10px] font-black ${cat.main > cat.sub ? themeClass.text : 'text-zinc-500'}`}>
              {cat.main > cat.sub ? '◀' : cat.main < cat.sub ? '▶' : '='}
            </div>

            <div className="flex-1 flex items-center gap-1">
              <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full absolute left-0 ${cat.sub > cat.main ? 'bg-sky-400' : 'bg-zinc-600'}`}
                  style={{ width: `${cat.sub}%`, boxShadow: cat.sub > cat.main ? '0 0 8px rgba(56,189,248,0.6)' : 'none' }}
                />
              </div>
              <span className={`text-[13px] font-mono font-black ${cat.sub > cat.main ? 'text-sky-400' : 'text-zinc-500'}`}>{cat.sub}</span>
            </div>
          </div>
        ))}
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
