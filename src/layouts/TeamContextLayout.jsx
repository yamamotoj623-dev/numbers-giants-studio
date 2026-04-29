/**
 * layoutType: team_context (v2)
 * チーム全体の表情を見せるレイアウト。
 *
 * layoutData.context スキーマ (v2):
 *
 * モード A: チームビュー (mode: "single")
 * {
 *   mode: "single",
 *   teamName?: "巨人",
 *   batting: {
 *     stats: [
 *       { label: "打率",   value: ".268", rank: 5, score: 4 },   // score: 1-5 段階評価
 *       { label: "本塁打", value: "32本", rank: 4, score: 3 },
 *       { label: "得点",   value: "178",  rank: 3, score: 4 },
 *     ],
 *     note?: "中軸不在で苦しい"
 *   },
 *   pitching: {
 *     stats: [
 *       { label: "防御率", value: "2.85", rank: 1, score: 5 },
 *       ...
 *     ],
 *     note?: "投手陣が支える"
 *   },
 *   management?: {
 *     traits: [
 *       { label: "代走起用率", level: "高" },
 *       { label: "バント傾向", level: "中" },
 *       { label: "継投の早さ", level: "早" },
 *     ],
 *     note?: "若手育成志向"
 *   }
 * }
 *
 * モード B: チーム間比較 (mode: "compare")
 * {
 *   mode: "compare",
 *   target: "セ平均" | "上位3チーム平均" | "首位",
 *   stats: [
 *     { label: "打率", mainValue: ".268", compareValue: ".268", diff: "±0", mainBetter: false },
 *     { label: "本塁打", mainValue: "32本", compareValue: "41本", diff: "-9", mainBetter: false },
 *     ...
 *   ]
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

// 1-5 のスコアを ●●●●○ 形式で表示
function ScoreDots({ score, themeClass }) {
  const dots = [];
  for (let i = 1; i <= 5; i++) {
    dots.push(
      <span
        key={i}
        className={`text-[10px] ${i <= score ? themeClass.text : 'text-zinc-700'}`}
        style={i <= score ? { textShadow: `0 0 4px ${themeClass.glow}` } : {}}
      >
        ●
      </span>
    );
  }
  return <span className="leading-none">{dots}</span>;
}

// === モード A: チームビュー ===
function TeamSingleView({ data, themeClass }) {
  const teamName = data.teamName || '巨人';
  return (
    <>
      {/* チーム名ヘッダー */}
      <div className={`z-20 mb-2 text-center`}>
        <span className={`${themeClass.text} text-[18px] font-black tracking-tight`} style={{ textShadow: `0 0 12px ${themeClass.glow}` }}>
          🏟 {teamName}
        </span>
      </div>

      {/* 打線ブロック */}
      {data.batting && (
        <div className="z-20 mb-1.5 bg-zinc-900/78 rounded-lg border border-zinc-700/50 overflow-hidden backdrop-blur-sm">
          <div className={`px-2.5 py-1 ${themeClass.bg}/20 border-b border-zinc-700/50 flex items-center justify-between`}>
            <span className={`${themeClass.text} text-[11px] font-black tracking-widest`}>【打線】</span>
            {data.batting.note && (
              <span className="text-[9px] font-bold text-zinc-400">{data.batting.note}</span>
            )}
          </div>
          <div className="px-2.5 py-1.5">
            {data.batting.stats?.map((stat, i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <span className="text-[12px] font-bold text-zinc-300 w-16">{stat.label}</span>
                <span className="text-[14px] font-mono font-black text-white flex-1 text-right pr-2">{stat.value}</span>
                <span className="text-[10px] font-bold text-zinc-500 w-12 text-right">({stat.rank}位)</span>
                <span className="ml-1.5">
                  <ScoreDots score={stat.score} themeClass={themeClass} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 投手ブロック */}
      {data.pitching && (
        <div className="z-20 mb-1.5 bg-zinc-900/78 rounded-lg border border-zinc-700/50 overflow-hidden backdrop-blur-sm">
          <div className="px-2.5 py-1 bg-sky-900/20 border-b border-zinc-700/50 flex items-center justify-between">
            <span className="text-sky-300 text-[11px] font-black tracking-widest">【投手】</span>
            {data.pitching.note && (
              <span className="text-[9px] font-bold text-zinc-400">{data.pitching.note}</span>
            )}
          </div>
          <div className="px-2.5 py-1.5">
            {data.pitching.stats?.map((stat, i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <span className="text-[12px] font-bold text-zinc-300 w-16">{stat.label}</span>
                <span className="text-[14px] font-mono font-black text-white flex-1 text-right pr-2">{stat.value}</span>
                <span className="text-[10px] font-bold text-zinc-500 w-12 text-right">({stat.rank}位)</span>
                <span className="ml-1.5">
                  <ScoreDots score={stat.score} themeClass={{ text: 'text-sky-400', glow: 'rgba(56,189,248,0.5)' }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 采配ブロック */}
      {data.management && (
        <div className="z-20 bg-zinc-900/78 rounded-lg border border-zinc-700/50 overflow-hidden backdrop-blur-sm">
          <div className="px-2.5 py-1 bg-zinc-800/40 border-b border-zinc-700/50 flex items-center justify-between">
            <span className="text-zinc-300 text-[11px] font-black tracking-widest">【采配】</span>
            {data.management.note && (
              <span className="text-[9px] font-bold text-zinc-400">{data.management.note}</span>
            )}
          </div>
          <div className="px-2.5 py-1.5 grid grid-cols-3 gap-1">
            {data.management.traits?.map((trait, i) => (
              <div key={i} className="text-center bg-zinc-800/40 rounded px-1 py-0.5">
                <div className="text-[10px] font-bold text-zinc-400">{trait.label}</div>
                <div className={`text-[14px] font-black ${themeClass.text}`}>{trait.level}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// === モード B: チーム間比較 ===
function TeamCompareView({ data, themeClass }) {
  const target = data.target || 'セ平均';
  return (
    <>
      <div className="z-20 mb-2 text-center">
        <span className={`${themeClass.text} text-[16px] font-black tracking-tight`}>
          🏟 巨人 <span className="text-zinc-400 mx-1.5">vs</span>
          <span className="text-sky-400">{target}</span>
        </span>
      </div>

      <div className="z-20 bg-zinc-900/78 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
        {data.stats?.map((stat, i) => {
          const mainBetter = stat.mainBetter;
          return (
            <div key={i} className="px-3 py-2 border-b border-zinc-800 last:border-b-0">
              <div className="text-center mb-1">
                <span className="text-[12px] font-black text-zinc-200">{stat.label}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                {/* 巨人 */}
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`text-[14px] font-mono font-black ${
                    mainBetter ? themeClass.text : 'text-zinc-400'
                  }`}>
                    {stat.mainValue}
                  </span>
                  <span className={`text-[9px] font-bold ${themeClass.text}`}>巨</span>
                </div>
                {/* 差分 */}
                <div className={`text-[11px] font-black px-2 py-0.5 rounded ${
                  mainBetter
                    ? `${themeClass.bg}/20 ${themeClass.text}`
                    : stat.diff && stat.diff.startsWith('-')
                      ? 'bg-red-900/30 text-red-300'
                      : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {stat.diff || ''}
                </div>
                {/* 比較対象 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-sky-400">{target.charAt(0)}</span>
                  <span className={`text-[14px] font-mono font-black ${
                    !mainBetter ? 'text-sky-400' : 'text-zinc-400'
                  }`}>
                    {stat.compareValue}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function TeamContextLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // 互換性レイヤ: 二重ネスト ({context:{context:{...}}}) を解除
  const _rawData = projectData.layoutData?.context;
  const _unwrapped = (_rawData && typeof _rawData === 'object' && _rawData.context)
    ? _rawData.context
    : _rawData;

  // データ有効性判定: context は batting / pitching / stats のいずれかが必要
  const _hasValidData = _unwrapped && typeof _unwrapped === 'object' &&
    (_unwrapped.batting || _unwrapped.pitching || _unwrapped.management || Array.isArray(_unwrapped.stats));

  const data = _hasValidData ? _unwrapped : {
    mode: 'single',
    teamName: '巨人',
    batting: {
      stats: [
        { label: '打率',   value: '.268', rank: 5, score: 3 },
        { label: '本塁打', value: '32本', rank: 4, score: 3 },
        { label: '得点',   value: '178',  rank: 3, score: 4 },
      ],
    },
    pitching: {
      stats: [
        { label: '防御率', value: '2.85', rank: 1, score: 5 },
        { label: '奪三振', value: '412',  rank: 2, score: 4 },
        { label: '失点',   value: '145',  rank: 1, score: 5 },
      ],
    },
  };

  const mode = data.mode || 'single';

  return (
    <>
      <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[32%] px-3">
        {/* スタジアム背景演出 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, ${themeClass.glow}10 0%, transparent 30%)`,
        }} />

        {mode === 'compare' ? (
          <TeamCompareView data={data} themeClass={themeClass} />
        ) : (
          <TeamSingleView data={data} themeClass={themeClass} />
        )}
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}
