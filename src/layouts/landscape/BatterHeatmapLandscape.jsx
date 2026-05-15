/**
 * BatterHeatmapLayout 横長 (16:9) 専用バリアント ()
 *
 * 構図:
 *   mode 'single':         中央に大きいヒートマップ + 凡例
 *   mode 'vs_handedness':  左ヒート (対右) + 右ヒート (対左) 横並び
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../../components/HighlightCard.jsx';

function HeatmapGrid({ zones, label, themeClass, size = 110 }) {
  const safe = (zones || []).slice(0, 9);
  // 値域 (一番大きい/小さい打率で色強度を決める)
  const nums = safe.map(z => {
    const v = typeof z === 'string' ? parseFloat(z.replace(/[^\d.\-]/g, '')) : Number(z);
    return isNaN(v) ? null : v;
  });
  const validNums = nums.filter(n => n !== null);
  const minV = validNums.length ? Math.min(...validNums) : 0;
  const maxV = validNums.length ? Math.max(...validNums) : 0.4;
  const range = (maxV - minV) || 0.001;

  const colorFor = (v) => {
    if (v === null) return 'rgba(60,60,70,0.4)';
    const t = (v - minV) / range;  // 0-1
    // 低い: 青、中: 黄、高: 赤
    if (t < 0.5) {
      // 青 → 黄
      const k = t * 2;
      return `rgba(${Math.round(56 + (250 - 56) * k)}, ${Math.round(189 - (189 - 200) * k)}, ${Math.round(248 - 248 * k)}, 0.85)`;
    }
    const k = (t - 0.5) * 2;
    return `rgba(${Math.round(250)}, ${Math.round(200 - 200 * k)}, ${Math.round(40 + (60 - 40) * k)}, 0.85)`;
  };

  const fmt = (v) => {
    if (v === null) return '-';
    return v.toFixed(3).replace(/^0\./, '.').replace(/^-0\./, '-.');
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <div className={`text-[10px] font-bold tracking-widest mb-1 ${themeClass.text}`}>
          {label}
        </div>
      )}
      <div
        className="grid grid-cols-3 gap-1 p-2 rounded-lg"
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          width: size + 24,
          height: size + 24,
        }}
      >
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <div
            key={i}
            className="rounded flex items-center justify-center text-[10px] font-impact text-white"
            style={{
              background: colorFor(nums[i]),
              animation: `heatCellIn 0.4s var(--spring-bounce) ${i * 0.04}s backwards`,
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {fmt(nums[i])}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BatterHeatmapLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;
  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  const raw = projectData.layoutData?.heatmap;
  const _unwrapped = (raw && raw.heatmap) ? raw.heatmap : raw;
  const data = _unwrapped && (Array.isArray(_unwrapped.zones) || Array.isArray(_unwrapped.vsRight) || Array.isArray(_unwrapped.vsLeft))
    ? _unwrapped
    : {
        mode: 'vs_handedness',
        vsRight: ['.180', '.240', '.290', '.220', '.310', '.340', '.150', '.220', '.260'],
        vsLeft:  ['.200', '.260', '.280', '.210', '.280', '.320', '.170', '.230', '.240'],
      };

  const mode = data.mode || (data.vsRight ? 'vs_handedness' : 'single');

  return (
    <>
      <div
        key={`heatmap-l-${animationKey}`}
        className="absolute z-10 flex flex-col items-center justify-center"
        style={{ top: 32, bottom: '42%', left: 14, right: 14 }}
      >
        <div className={`text-[11px] font-impact mb-1.5 ${themeClass.text}`}>
          🎯 ゾーン別打率
        </div>

        {mode === 'single' ? (
          <HeatmapGrid zones={data.zones} themeClass={themeClass} size={140} />
        ) : (
          <div className="flex items-center gap-6">
            <HeatmapGrid zones={data.vsRight} label="対右投手" themeClass={themeClass} size={120} />
            <HeatmapGrid zones={data.vsLeft}  label="対左投手" themeClass={themeClass} size={120} />
          </div>
        )}

        {/* 凡例 */}
        <div className="flex items-center gap-2 mt-2 text-[8px] text-zinc-400">
          <span>低</span>
          <div
            className="w-24 h-2 rounded"
            style={{ background: 'linear-gradient(90deg, rgba(56,189,248,0.85), rgba(250,200,40,0.85), rgba(250,0,60,0.85))' }}
          />
          <span>高</span>
        </div>
      </div>

      <style>{`
        @keyframes heatCellIn {
          0% { opacity: 0; transform: scale(0.3); }
          70% { opacity: 1; transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}
