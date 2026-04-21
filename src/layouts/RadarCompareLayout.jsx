/**
 * layoutType: radar_compare (v5.0.0 UI確定版)
 *
 * フェーズ別表示:
 * - hook: PreviewFrame側で描画、ここは null
 * - normal: レーダー + 凡例 + 成績比較テーブル(6項目)
 * - highlight: 小レーダー + ハイライトカード(計算式+値+WHY+基準)
 * - outro: 分析まとめ + CTA + いいね/登録ボタン
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { RadarChartSVG } from '../components/RadarChartSVG.jsx';
import { OutroPanel } from '../components/OutroPanel.jsx';

export function RadarCompareLayout({ projectData, currentScript, currentIndex, phase = 'normal', animationKey, isPlaying }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} />;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const highlightId = currentScript?.highlight || null;
  const highlightComp = highlightId ? projectData.comparisons?.find(c => c.id === highlightId) : null;

  if (phase === 'highlight' && highlightComp) {
    return <HighlightPanel projectData={projectData} comp={highlightComp} themeClass={themeClass} animationKey={animationKey} />;
  }

  return <NormalPanel projectData={projectData} themeClass={themeClass} animationKey={animationKey} />;
}

function NormalPanel({ projectData, themeClass, animationKey }) {
  return (
    <div key={`normal-${animationKey}`} className="flex-1 flex flex-col items-center justify-start relative z-10 w-full px-4 pt-2 pb-[35%]">
      <div className="w-full max-w-[260px]">
        <RadarChartSVG
          stats={projectData.radarStats}
          highlight={null}
          themeColor={projectData.theme}
          comparisons={projectData.comparisons}
          showLabels={true}
          compact={false}
        />
      </div>
      <div className="mt-1 flex gap-2 justify-center">
        <LegendItem type="main" name={projectData.mainPlayer.name} period={projectData.mainPlayer.label} />
        <LegendItem type="sub" name={projectData.subPlayer.name} period={projectData.subPlayer.label} />
      </div>
      <div className="mt-1 w-full max-w-[260px] bg-zinc-900/88 border border-zinc-700/60 rounded-xl px-3 py-2 backdrop-blur-sm">
        <StatsTable projectData={projectData} themeClass={themeClass} />
      </div>
    </div>
  );
}

function LegendItem({ type, name, period }) {
  const isMain = type === 'main';
  return (
    <div className={`flex items-center gap-1.5 bg-zinc-900/90 px-3 py-1 rounded-2xl border ${isMain ? 'border-zinc-700/60' : 'border-zinc-600/30'}`}>
      <span
        className="w-4 h-[3px] rounded-sm flex-shrink-0"
        style={isMain
          ? { background: '#f97316', boxShadow: '0 0 6px #f97316' }
          : { borderTop: '2px dashed #a1a1aa', height: 2, background: 'none' }
        }
      ></span>
      <div className="flex flex-col leading-[1.1]">
        <span className={`text-[12px] font-black ${isMain ? 'text-orange-500' : 'text-zinc-400'}`}>{name}</span>
        <span className={`text-[9px] font-bold opacity-80 mt-[1px] ${isMain ? 'text-orange-500' : 'text-zinc-400'}`}>{period}</span>
      </div>
    </div>
  );
}

function StatsTable({ projectData, themeClass }) {
  const isBatter = projectData.playerType === 'batter';
  const m = projectData.mainPlayer.stats;
  const s = projectData.subPlayer.stats;

  const rows = isBatter ? [
    { key: 'pa', label: '打席' },
    { key: 'ab', label: '打数' },
    { key: 'avg', label: '打率' },
    { key: 'ops', label: 'OPS' },
    { key: 'hr', label: '本塁打' },
    { key: 'rbi', label: '打点' },
  ] : [
    { key: 'g', label: '登板' },
    { key: 'ip', label: '投球回' },
    { key: 'era', label: '防御率' },
    { key: 'whip', label: 'WHIP' },
    { key: 'so', label: '奪三振' },
    { key: 'win', label: '勝利' },
  ];

  return (
    <div className="grid grid-cols-3 gap-x-2.5 gap-y-1">
      {rows.map(r => (
        <div key={r.key} className="flex flex-col leading-[1.2] gap-[2px]">
          <span className="text-[8px] text-zinc-500 font-black tracking-wider">{r.label}</span>
          <div className="flex flex-col items-start gap-[1px]">
            <span className="font-mono text-[13px] font-black text-orange-500 tracking-tight leading-none">{m?.[r.key] ?? '-'}</span>
            <span className="font-mono text-[9px] font-bold text-zinc-500 tracking-tight leading-none">{s?.[r.key] ?? '-'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HighlightPanel({ projectData, comp, themeClass, animationKey }) {
  return (
    <div key={`hl-${animationKey}`} className="flex-1 flex flex-col relative z-10 w-full px-2 pt-2">
      <div className="w-full flex justify-center items-center h-[110px] px-10 z-10">
        <div className="w-[150px] h-[110px] hl-radar-shrink">
          <RadarChartSVG
            stats={projectData.radarStats}
            highlight={comp.id}
            themeColor={projectData.theme}
            comparisons={projectData.comparisons}
            showLabels={true}
            compact={true}
          />
        </div>
      </div>

      <div className="highlight-card mx-2 mt-2 relative rounded-2xl border border-orange-500/40 px-3 pt-2.5 pb-2" style={{ background: 'linear-gradient(180deg, rgba(24,24,27,0.97), rgba(39,39,42,0.9))' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: '#f97316', boxShadow: '0 0 10px rgba(249,115,22,0.6)' }}></div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-black text-white bg-orange-500 px-2 py-0.5 rounded-full flex-shrink-0">📊 {comp.radarMatch}</span>
          <span className="text-[22px] font-black text-white tracking-wider leading-none flex-1">{comp.label}</span>
          <span className="text-[10px] font-bold text-orange-500 tracking-widest whitespace-nowrap">{comp.kana}</span>
        </div>

        {comp.formula && (
          <div className="flex items-center justify-center gap-1.5 mb-1.5 py-1 px-2 bg-black/35 border border-zinc-700/60 rounded-md">
            <span className="text-[8px] font-black text-zinc-500 tracking-widest border-r border-zinc-700/80 pr-1.5">式</span>
            <span className="text-[12px] font-black text-white tracking-wide">{comp.formula}</span>
          </div>
        )}

        <div className="flex justify-center items-center gap-3 mb-1.5 py-1.5 border-t border-b border-zinc-700/50">
          <div className="flex flex-col items-center">
            <span className={`font-mono text-[30px] font-black tracking-tighter leading-none ${comp.winner === 'main' ? 'text-orange-500' : 'text-red-300'}`}
              style={comp.winner === 'main'
                ? { textShadow: '0 0 20px rgba(249,115,22,0.6)' }
                : { textShadow: '0 0 12px rgba(248,113,113,0.4)' }
              }
            >{comp.valMain}</span>
            <span className={`text-[9px] font-bold mt-0.5 ${comp.winner === 'main' ? 'text-orange-500' : 'text-red-300'}`}>{projectData.mainPlayer.label}</span>
          </div>
          <span className="text-[12px] font-black text-zinc-600 italic">vs</span>
          <div className="flex flex-col items-center">
            <span className={`font-mono text-[22px] font-black tracking-tight leading-none ${comp.winner === 'sub' ? 'text-orange-500' : 'text-red-300 opacity-85'}`}
              style={comp.winner === 'sub'
                ? { textShadow: '0 0 15px rgba(249,115,22,0.6)' }
                : { textShadow: '0 0 8px rgba(248,113,113,0.3)' }
              }
            >{comp.valSub}</span>
            <span className={`text-[9px] font-bold mt-0.5 ${comp.winner === 'sub' ? 'text-orange-500' : 'text-red-300 opacity-85'}`}>{projectData.subPlayer.label}</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {comp.desc && (
            <div className="flex-1 bg-orange-500/10 border-l-2 border-orange-500 rounded px-2 py-1">
              <div className="text-[8px] font-black text-orange-500 tracking-widest mb-0.5">WHY</div>
              <div className="text-[10px] font-bold text-zinc-300 leading-tight">{comp.desc}</div>
            </div>
          )}
          {comp.criteria && (
            <div className="bg-black/35 rounded px-2 py-1 flex flex-col justify-center items-center min-w-[58px]">
              <div className="text-[8px] text-zinc-500 font-bold tracking-wider">優秀</div>
              <div className="text-[12px] font-black text-emerald-400 font-mono">{comp.criteria.replace(/^優秀[::\s]*/, '')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

