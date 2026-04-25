/**
 * layoutType: batter_heatmap (旧 pitch_heatmap をリネーム)
 * 打者の打率ゾーン (9エリア) を可視化。投手目線で「ここに投げれば抑えられる」を示す。
 *
 * layoutData.heatmap スキーマ:
 * {
 *   mode: "single" | "vs_handedness",        // single: 単一、vs_handedness: 対右投/対左投
 *   // single 用
 *   zones?: [9つの打率、左上→右下、上段3つ→中段3つ→下段3つ],
 *   // vs_handedness 用
 *   vsRight?: [9つの打率],   // 対右投手
 *   vsLeft?: [9つの打率]     // 対左投手
 * }
 *
 * 例 (single):
 *   zones: [
 *     0.180, 0.240, 0.290,   // 上段 (内角・真ん中・外角の高め)
 *     0.220, 0.310, 0.340,   // 中段
 *     0.150, 0.220, 0.260,   // 下段
 *   ]
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../components/HighlightCard.jsx';

// 打率値から色を計算 (高打率=赤、低打率=青)
function avgToColor(avg) {
  if (typeof avg !== 'number' || isNaN(avg)) return '#3f3f46';
  // 平均打率 .250 を中心に
  const norm = Math.max(0, Math.min(1, (avg - 0.150) / 0.250)); // 0.150 → 0、0.400 → 1
  if (norm > 0.7) return '#dc2626'; // 高打率 (赤)
  if (norm > 0.55) return '#f97316'; // やや高 (オレンジ)
  if (norm > 0.4) return '#fbbf24'; // 中 (黄)
  if (norm > 0.25) return '#84cc16'; // やや低 (黄緑)
  return '#06b6d4'; // 低 (シアン)
}

// 9マスのヒートマップを描画
function HeatmapGrid({ zones, label, themeClass }) {
  const safeZones = (zones || []).slice(0, 9);
  while (safeZones.length < 9) safeZones.push(null);

  const cellSize = 36;
  const gap = 2;
  const totalSize = cellSize * 3 + gap * 2;

  return (
    <div className="flex flex-col items-center">
      {label && (
        <div className="text-[11px] font-black text-zinc-200 tracking-wider mb-1.5">{label}</div>
      )}
      <div className="relative" style={{ width: totalSize, height: totalSize }}>
        {/* ホームベース風の枠 (背景) */}
        <div
          className="absolute inset-0 border-2 border-zinc-600 rounded"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
        {/* 9マス */}
        <div
          className="grid grid-cols-3 grid-rows-3"
          style={{ gap: `${gap}px`, padding: '2px' }}
        >
          {safeZones.map((avg, i) => {
            const color = avgToColor(avg);
            const isHigh = typeof avg === 'number' && avg >= 0.300;
            return (
              <div
                key={i}
                className="flex items-center justify-center font-mono font-black text-[11px] rounded-sm transition-all"
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: color,
                  color: isHigh ? '#fff' : '#000',
                  textShadow: isHigh ? '0 1px 2px rgba(0,0,0,0.7)' : 'none',
                  boxShadow: isHigh ? `0 0 8px ${color}80` : 'none',
                }}
              >
                {typeof avg === 'number' ? avg.toFixed(3).replace(/^0/, '') : '-'}
              </div>
            );
          })}
        </div>
      </div>
      {/* 軸ラベル (打席視点) */}
      <div className="flex justify-between w-full mt-1 px-1">
        <span className="text-[8px] font-bold text-zinc-500">内角</span>
        <span className="text-[8px] font-bold text-zinc-500">外角</span>
      </div>
    </div>
  );
}

export function BatterHeatmapLayout({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const data = projectData.layoutData?.heatmap || {
    mode: 'single',
    zones: [
      0.180, 0.240, 0.290,
      0.220, 0.310, 0.340,
      0.150, 0.220, 0.260,
    ],
  };

  const mode = data.mode || (data.vsRight && data.vsLeft ? 'vs_handedness' : 'single');

  return (
    <>
      <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-12 pb-[32%] px-3">

        {/* タイトル */}
        <div className="z-20 mb-2 text-center">
          <span className={`${themeClass.text} text-[15px] font-black tracking-tighter`} style={{ textShadow: `0 0 10px ${themeClass.glow}` }}>
            打者ゾーン別打率
          </span>
        </div>

        {/* メインコンテンツ */}
        <div className="z-20 bg-zinc-900/85 rounded-xl border border-zinc-700/50 p-3 backdrop-blur-sm shadow-2xl">
          {mode === 'vs_handedness' ? (
            <div className="grid grid-cols-2 gap-2">
              <HeatmapGrid zones={data.vsRight} label="対右投手" themeClass={themeClass} />
              <HeatmapGrid zones={data.vsLeft} label="対左投手" themeClass={themeClass} />
            </div>
          ) : (
            <div className="flex justify-center">
              <HeatmapGrid zones={data.zones} themeClass={themeClass} />
            </div>
          )}

          {/* カラーレジェンド */}
          <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-center gap-2 text-[9px] font-bold">
            <span className="text-zinc-400">.150</span>
            <div className="flex h-2 rounded overflow-hidden" style={{ width: 120 }}>
              <div className="flex-1" style={{ background: '#06b6d4' }} />
              <div className="flex-1" style={{ background: '#84cc16' }} />
              <div className="flex-1" style={{ background: '#fbbf24' }} />
              <div className="flex-1" style={{ background: '#f97316' }} />
              <div className="flex-1" style={{ background: '#dc2626' }} />
            </div>
            <span className="text-zinc-400">.400+</span>
          </div>
          <div className="mt-1 text-center text-[9px] font-bold text-zinc-500">
            打席視点 / 暖色=得意ゾーン、寒色=苦手ゾーン
          </div>
        </div>

      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} />}
    </>
  );
}
