/**
 * layoutType: ranking
 * 順位/ランキング表示レイアウト
 *
 * 用途:
 * - 「打率TOP10」「OPS順位」「セ・リーグ順位表」など
 * - 複数指標のランキングをタブで切替表示
 *
 * layoutData 構造:
 * {
 *   ranking: {
 *     mode: "single" | "multi",      // single: 1指標、multi: 複数指標タブ切替
 *     metrics: [
 *       {
 *         id: "ops",
 *         label: "OPS",
 *         kana: "オーピーエス" (省略可),
 *         unit: "" (省略可),
 *         entries: [
 *           {rank: 1, name: "泉口", value: "1.013", isMainPlayer: false},
 *           {rank: 2, name: "ダルベック", value: ".980", isMainPlayer: false},
 *           {rank: 3, name: "増田陸", value: ".724", isMainPlayer: true},
 *           ...
 *         ]
 *       },
 *       {
 *         id: "avg",
 *         label: "打率",
 *         entries: [...]
 *       }
 *     ]
 *   }
 * }
 *
 * currentScript.highlight に metric.id を指定すると、そのタブにフォーカス
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

export function RankingLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const data = projectData.layoutData?.ranking || {
    mode: 'single',
    metrics: [
      {
        id: 'ops',
        label: 'OPS',
        unit: '',
        entries: [
          {rank: 1, name: '選手A', value: '1.013', isMainPlayer: false},
          {rank: 2, name: '選手B', value: '.980', isMainPlayer: false},
          {rank: 3, name: '選手C', value: '.724', isMainPlayer: true},
        ],
      },
    ],
  };

  // currentScript.highlight が metric.id と一致するなら、そのmetric を選択
  const focusedMetricId = currentScript?.highlight;
  const activeMetric = (focusedMetricId && data.metrics.find(m => m.id === focusedMetricId))
    || data.metrics[0];

  return (
    <>
      <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-7 pb-[30%] px-3">
        {/* タブ切替 (複数指標時のみ) */}
        {data.mode === 'multi' && data.metrics.length > 1 && (
          <div className="z-20 flex gap-1.5 mb-2 overflow-x-auto">
            {data.metrics.map(metric => (
              <button
                key={metric.id}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap transition flex-shrink-0 ${
                  metric.id === activeMetric.id
                    ? `${themeClass.bg} text-white shadow-md`
                    : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                }`}
              >
                {metric.label}{metric.kana ? `(${metric.kana})` : ''}
              </button>
            ))}
          </div>
        )}

        {/* タイトル */}
        <div className="z-20 mb-2 text-center">
          <span className={`text-[14px] font-black ${themeClass.text}`}>
            {activeMetric.label}{activeMetric.kana ? ` ${activeMetric.kana}` : ''} ランキング
          </span>
        </div>

        {/* ランキング表 (最大10件、注目選手は圏外でも自動含める) */}
        <div className="z-20 w-full bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
          {(() => {
            const all = activeMetric.entries || [];
            const top10 = all.slice(0, 10);
            const mainOutside = all.find(e => e.isMainPlayer && !top10.includes(e));
            const display = mainOutside ? [...top10, mainOutside] : top10;
            return display.map((entry, idx) => {
            const isTop3 = entry.rank <= 3;
            const isMain = entry.isMainPlayer;
            const isCutoff = mainOutside && idx === display.length - 1;
            const rowClass = isMain
              ? `${themeClass.bg}/20 border-2 ${themeClass.border}`
              : (idx % 2 === 0 ? 'bg-zinc-800/40' : 'bg-zinc-900/40');
            return (
              <React.Fragment key={entry.rank}>
                {isCutoff && <div className="text-center text-zinc-600 text-[10px] py-0.5">⋯</div>}
                <div className={`flex items-center px-3 py-1.5 border-b border-zinc-800 ${rowClass} ${isMain ? 'scale-[1.02]' : ''}`}>
                {/* 順位 */}
                <div className={`w-8 flex-shrink-0 text-center font-black text-[14px] ${
                  entry.rank === 1 ? 'text-yellow-400' :
                  entry.rank === 2 ? 'text-zinc-300' :
                  entry.rank === 3 ? 'text-orange-300' :
                  'text-zinc-500'
                }`}>
                  {entry.rank}
                  {isTop3 && entry.rank === 1 && <span className="text-[8px] ml-0.5">👑</span>}
                </div>
                {/* 選手名 */}
                <div className={`flex-1 text-[12px] font-black px-2 ${isMain ? 'text-white' : 'text-zinc-300'}`}>
                  {entry.name}
                  {isMain && <span className={`ml-1 text-[9px] ${themeClass.text}`}>◀ 注目</span>}
                </div>
                {/* 値 */}
                <div className={`flex-shrink-0 text-[14px] font-mono font-black ${
                  isMain ? themeClass.text : (isTop3 ? 'text-white' : 'text-zinc-400')
                }`}>
                  {entry.value}{activeMetric.unit || ''}
                </div>
              </div>
              </React.Fragment>
            );
          });
        })()}
        </div>
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
