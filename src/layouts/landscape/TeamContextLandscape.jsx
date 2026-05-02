/**
 * TeamContextLayout 横長 (16:9) 専用バリアント (★v5.20.3 新規★)
 *
 * 構図:
 *   mode 'single':  上半分を 3 カラム (打撃 / 投手 / 采配) で見せる
 *   mode 'compare': 中央に diff テーブル、左 main / 右 比較対象
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../../components/HighlightCard.jsx';

function ScoreDots({ score, themeClass }) {
  const dots = [];
  const s = Number(score) || 0;
  for (let i = 1; i <= 5; i++) {
    dots.push(
      <span
        key={i}
        className={`text-[8px] ${i <= s ? themeClass.text : 'text-zinc-700'}`}
        style={i <= s ? { textShadow: `0 0 3px ${themeClass.glow}` } : {}}
      >●</span>
    );
  }
  return <span className="leading-none">{dots}</span>;
}

function StatsBlock({ title, icon, stats, note, themeClass, indexBase = 0 }) {
  return (
    <div className="bg-zinc-900/70 rounded-lg border border-zinc-700/50 p-2 flex flex-col"
         style={{ animation: 'cardBounceIn 0.45s var(--spring-bounce) both' }}>
      <div className="text-[10px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1">
        <span>{icon}</span><span>{title}</span>
      </div>
      <div className="flex flex-col gap-1">
        {(stats || []).slice(0, 4).map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto] gap-1.5 items-center text-[10px]"
            style={{ animation: `rankRowIn 0.4s var(--spring-bounce) ${(indexBase + i) * 0.06}s backwards` }}
          >
            <span className="text-zinc-200 truncate">{s.label}</span>
            <span className={`font-impact ${themeClass.text} text-[12px]`}>{s.value}</span>
            <span className="ml-1"><ScoreDots score={s.score ?? Math.ceil((6 - (s.rank || 6)) * 1)} themeClass={themeClass} /></span>
          </div>
        ))}
      </div>
      {note && (
        <div className="text-[9px] text-zinc-400 italic mt-1.5 leading-snug">{note}</div>
      )}
    </div>
  );
}

function TraitsBlock({ traits, note, themeClass }) {
  return (
    <div className="bg-zinc-900/70 rounded-lg border border-zinc-700/50 p-2 flex flex-col"
         style={{ animation: 'cardBounceIn 0.45s var(--spring-bounce) both 0.1s' }}>
      <div className="text-[10px] font-bold text-zinc-300 mb-1.5 flex items-center gap-1">
        <span>🎯</span><span>采配</span>
      </div>
      <div className="flex flex-col gap-1">
        {(traits || []).slice(0, 4).map((t, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto] gap-1.5 items-center text-[10px]"
            style={{ animation: `rankRowIn 0.4s var(--spring-bounce) ${(8 + i) * 0.06}s backwards` }}
          >
            <span className="text-zinc-200 truncate">{t.label}</span>
            <span className={`text-[11px] font-bold ${themeClass.text}`}>{t.level}</span>
          </div>
        ))}
      </div>
      {note && <div className="text-[9px] text-zinc-400 italic mt-1.5">{note}</div>}
    </div>
  );
}

export function TeamContextLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;
  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  const data = projectData.layoutData?.context || {};
  const mode = data.mode || 'single';

  const teamName = data.teamName || projectData.mainPlayer?.name || 'チーム';

  return (
    <>
      <div
        key={`tc-l-${animationKey}-${mode}`}
        className="absolute z-10 flex flex-col"
        style={{ top: 32, bottom: '42%', left: 14, right: 14 }}
      >
        {mode === 'compare' ? (
          /* compare モード: main vs target の diff テーブル */
          <>
            <div className="text-center mb-1">
              <span className={`text-[14px] font-impact ${themeClass.text}`}>{teamName}</span>
              <span className="text-[10px] text-zinc-500 mx-2">vs</span>
              <span className="text-[12px] font-bold text-sky-300">{data.target || 'セ平均'}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-[1fr_70px_70px_60px] gap-2 text-[8px] font-bold text-zinc-500 tracking-widest px-1.5 mb-1">
                <div>指標</div>
                <div className="text-right">{teamName}</div>
                <div className="text-right">{data.target || '比較'}</div>
                <div className="text-right">差</div>
              </div>
              {(data.stats || []).slice(0, 6).map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_70px_70px_60px] gap-2 items-center bg-zinc-900/60 rounded px-1.5 py-1 mb-0.5"
                  style={{ animation: `rankRowIn 0.4s var(--spring-bounce) ${i * 0.07}s backwards` }}
                >
                  <span className="text-[11px] font-bold text-white">{s.label}</span>
                  <span className={`text-[12px] font-impact text-right ${s.mainBetter ? themeClass.text : 'text-zinc-300'}`}>{s.mainValue}</span>
                  <span className="text-[12px] font-impact text-right text-sky-300">{s.compareValue}</span>
                  <span className={`text-[11px] font-bold text-right ${s.mainBetter ? themeClass.text : 'text-rose-400'}`}>{s.diff}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* single モード: 3 カラム (打撃 / 投手 / 采配) */
          <>
            <div className={`text-center text-[14px] font-impact mb-1 ${themeClass.text}`}>{teamName}</div>
            <div className="flex-1 grid grid-cols-3 gap-2 min-h-0 overflow-hidden">
              <StatsBlock
                title="打撃" icon="⚾"
                stats={data.batting?.stats}
                note={data.batting?.note}
                themeClass={themeClass}
                indexBase={0}
              />
              <StatsBlock
                title="投手" icon="🥎"
                stats={data.pitching?.stats}
                note={data.pitching?.note}
                themeClass={themeClass}
                indexBase={4}
              />
              {data.management ? (
                <TraitsBlock
                  traits={data.management.traits}
                  note={data.management.note}
                  themeClass={themeClass}
                />
              ) : (
                <div className="bg-zinc-900/40 rounded-lg border border-zinc-800/50 p-2 flex items-center justify-center text-[9px] text-zinc-600">
                  采配データなし
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}
