/**
 * layoutType: luck_dashboard
 * 不運ダッシュボード。BABIP・打球速度・打球角度から「実力 vs 不運」を可視化。
 * 擁護型動画の専用レイアウト（中山礼都のような選手向け）。
 * 
 * layoutData.luck スキーマ:
 * {
 *   babip: 0.182,
 *   expectedBabip: 0.290,
 *   exitVelocity: 138.5,      // km/h
 *   barrelRate: 0.08,
 *   unluckyScore: 82          // 0-100 (高いほど不運)
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

export function LuckDashboardLayout({ projectData, currentScript, animationKey , phase = 'normal'}) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const luck = projectData.layoutData?.luck || {
    babip: 0.182,
    expectedBabip: 0.290,
    exitVelocity: 138.5,
    barrelRate: 0.08,
    unluckyScore: 82,
  };

  const babipGap = ((luck.expectedBabip - luck.babip) * 1000).toFixed(0);
  const unluckyColor = luck.unluckyScore >= 70 ? themeClass.primary : '#888780';

  return (
<>
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[30%] px-3">

      <div className="mb-3 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl border border-zinc-700/50 p-4 shadow-2xl z-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-black text-zinc-300 tracking-widest">不運度スコア</span>
          <span className="text-[11px] text-zinc-400">0-100</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[52px] font-black tracking-tighter leading-none" style={{ color: unluckyColor, textShadow: `0 0 20px ${unluckyColor}` }}>
            {luck.unluckyScore}
          </span>
          <span className="text-[16px] font-bold text-zinc-400">/ 100</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${luck.unluckyScore}%`, background: unluckyColor, boxShadow: `0 0 10px ${unluckyColor}` }} />
        </div>
        <div className="mt-2 text-[11px] font-bold text-zinc-400 flex justify-between">
          <span>実力通り</span>
          <span className={themeClass.text}>{luck.unluckyScore >= 70 ? '極端な不運' : '標準範囲'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 z-20">
        <MetricCard label="BABIP (実績)"    value={luck.babip.toFixed(3)}        color="text-red-400"   />
        <MetricCard label="BABIP (期待値)" value={luck.expectedBabip.toFixed(3)} color={themeClass.text} />
        <MetricCard label="打球速度"        value={`${luck.exitVelocity.toFixed(1)}km/h`}  color="text-white" sub="平均以上" />
        <MetricCard label="ギャップ"        value={`-${babipGap}`} color={themeClass.text} sub="本来到達すべき値" />
      </div>

    </div>

    {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}

  </>
  );
}

function MetricCard({ label, value, color, sub }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg p-2.5">
      <div className="text-[10px] font-black text-zinc-300 tracking-widest mb-1">{label}</div>
      <div className={`text-[22px] font-mono font-black tracking-tighter ${color}`}>{value}</div>
      {sub && <div className="text-[9px] text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}
