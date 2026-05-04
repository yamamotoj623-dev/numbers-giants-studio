/**
 * RadarCompareLayout 横長 (16:9) 専用バリアント (★v5.20 新規★)
 *
 * 構図:
 *   左: 主役選手のラベル + 5軸の数値リスト (テキスト主体、写真不使用)
 *   右: レーダーチャート (大きめ)
 *   下半分: テロップ大 + アバター左右
 *
 * ※ 縦長版とは別ファイル。データロジックは textRender / config 等を共有。
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';
import { HighlightCard, useHighlightComp } from '../../components/HighlightCard.jsx';

const RADAR_DEFAULT_BATTER = {
  stats: [
    { label: '長打力',   main: 70, sub: 50 },
    { label: '選球眼',   main: 65, sub: 55 },
    { label: '三振率',   main: 70, sub: 50 },
    { label: '得点創出', main: 80, sub: 60 },
    { label: '本塁打率', main: 70, sub: 55 },
  ],
};
const RADAR_DEFAULT_PITCHER = {
  stats: [
    { label: '奪三振',   main: 70, sub: 50 },
    { label: '制球力',   main: 65, sub: 55 },
    { label: '球質',     main: 70, sub: 50 },
    { label: '安定感',   main: 80, sub: 60 },
    { label: '空振り率', main: 70, sub: 55 },
  ],
};
const RADAR_DEFAULT_TEAM = {
  stats: [
    { label: '得点力',   main: 70, sub: 50 },
    { label: '失点防止', main: 65, sub: 55 },
    { label: '機動力',   main: 70, sub: 50 },
    { label: '長打力',   main: 80, sub: 60 },
    { label: '守備力',   main: 70, sub: 55 },
  ],
};

export function RadarCompareLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const highlightComp = useHighlightComp(projectData, currentScript);
  const isHighlight = phase === 'highlight' && highlightComp;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;

  // ★v5.20.11★ stats 解決の優先順位:
  //   1. layoutData.radar.stats (明示指定) ← 最優先
  //   2. projectData.radarStats を配列化 (top-level の radarStats を使う)
  //   3. playerType ベースのデフォルト
  let stats;
  const radar = projectData.layoutData?.radar;
  if (Array.isArray(radar?.stats) && radar.stats.length >= 3) {
    stats = radar.stats;
  } else if (projectData.radarStats && typeof projectData.radarStats === 'object') {
    // radarStats: {csw: {label, main, sub}, ...} → 配列に変換
    stats = Object.values(projectData.radarStats)
      .filter(s => s && s.label && (s.main !== undefined || s.sub !== undefined))
      .slice(0, 5)
      .map(s => ({ label: s.label, main: Number(s.main) || 0, sub: Number(s.sub) || 0 }));
  }
  if (!stats || stats.length < 3) {
    const pt = projectData.playerType;
    stats = (pt === 'pitcher' ? RADAR_DEFAULT_PITCHER : pt === 'team' ? RADAR_DEFAULT_TEAM : RADAR_DEFAULT_BATTER).stats;
  }

  return (
    <>
      <div
        key={`radar-l-${animationKey}`}
        className="absolute z-10 flex"
        style={{ top: 32, bottom: '42%', left: 14, right: 14, gap: 12 }}
      >
        {/* 左: 数値リスト (主役 vs 比較) */}
        <div className="flex flex-col justify-center" style={{ width: '38%' }}>
          <div className={`text-[11px] font-bold tracking-widest mb-1 ${themeClass.text}`}>
            {projectData.mainPlayer?.label || '今季'}
            <span className="text-zinc-500 font-normal mx-2">vs</span>
            <span className="text-sky-300">{projectData.subPlayer?.label || '昨季'}</span>
          </div>
          <div className="space-y-1.5">
            {stats.slice(0, 5).map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  animation: `rankRowIn 0.5s var(--spring-bounce) ${i * 0.08}s backwards`,
                }}
              >
                <div className="text-[10px] font-bold text-zinc-300 w-14 truncate">{s.label}</div>
                {/* main 値 */}
                <div className={`flex-1 h-3 rounded bg-zinc-800/60 overflow-hidden relative`}>
                  <div
                    className="absolute inset-y-0 left-0 rounded bar-spring"
                    style={{
                      width: `${Math.min(100, Math.max(0, s.main || 0))}%`,
                      background: themeClass.primary,
                      animationDelay: `${i * 0.08 + 0.15}s`,
                    }}
                  />
                </div>
                <div className={`text-[12px] font-impact ${themeClass.text} w-7 text-right`}>{s.main ?? '-'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右: レーダーチャート */}
        <div className="flex-1 flex items-center justify-center">
          <RadarSvg stats={stats} themeClass={themeClass} />
        </div>
      </div>

      {isHighlight && <HighlightCard comp={highlightComp} projectData={projectData} currentScript={currentScript} />}
    </>
  );
}

// シンプル版 SVG レーダー (横長専用、サイズ可変)
function RadarSvg({ stats, themeClass }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 18;
  const angleAt = (i) => -Math.PI / 2 + (Math.PI * 2 * i) / stats.length;

  const polygonFor = (key) => stats.map((s, i) => {
    const v = Math.max(0, Math.min(100, s[key] || 0)) / 100;
    const a = angleAt(i);
    return `${cx + Math.cos(a) * maxR * v},${cy + Math.sin(a) * maxR * v}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 背景グリッド */}
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <polygon
          key={i}
          points={stats.map((_, j) => {
            const a = angleAt(j);
            return `${cx + Math.cos(a) * maxR * r},${cy + Math.sin(a) * maxR * r}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {/* 軸線 */}
      {stats.map((_, i) => {
        const a = angleAt(i);
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * maxR} y2={cy + Math.sin(a) * maxR} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      {/* sub (比較線) */}
      <polygon className="radar-sub-poly" points={polygonFor('sub')} fill="rgba(56,189,248,0.18)" stroke="rgba(56,189,248,0.65)" strokeWidth="2" />
      {/* main (主役) */}
      <polygon className="radar-main-poly" points={polygonFor('main')} fill={`${themeClass.primary}30`} stroke={themeClass.primary} strokeWidth="2.5" />
      {/* ラベル */}
      {stats.map((s, i) => {
        const a = angleAt(i);
        const lr = maxR + 10;
        const x = cx + Math.cos(a) * lr;
        const y = cy + Math.sin(a) * lr;
        return (
          <text
            key={i}
            x={x}
            y={y}
            fill="#e4e4e7"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}
