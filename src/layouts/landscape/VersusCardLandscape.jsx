/**
 * VersusCardLayout 横長 (16:9) 専用バリアント (★v5.20 新規★)
 *
 * 構図 (本来の対決感を活かす):
 *   左:   main の名前+ラベル (大)
 *   中央: 縦に並ぶカテゴリ行 (label / main値 / 矢印 / sub値) を 5-7 個
 *   右:   sub の名前+ラベル (大)
 *   下半分: テロップ + アバター左右
 */

import React from 'react';
import { THEMES } from '../../lib/config';
import { OutroPanel } from '../../components/OutroPanel.jsx';

function statMatches(a, b) {
  if (!a || !b) return false;
  return String(a).trim() === String(b).trim();
}

function judgeWinner(cat) {
  if (cat.winner === 'main' || cat.winner === 'sub' || cat.winner === 'tie') return cat.winner;
  const m = parseFloat(String(cat.main ?? cat.rawMain ?? '').replace(/[^\d.\-]/g, ''));
  const s = parseFloat(String(cat.sub ?? cat.rawSub ?? '').replace(/[^\d.\-]/g, ''));
  if (isNaN(m) || isNaN(s)) return 'tie';
  if (cat.lowerBetter) return m < s ? 'main' : m > s ? 'sub' : 'tie';
  return m > s ? 'main' : m < s ? 'sub' : 'tie';
}

export function VersusCardLandscape({ projectData, currentScript, animationKey, phase = 'normal' }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const focusedComp = currentScript?.highlight
    ? projectData.comparisons?.find(c => c.id === currentScript.highlight)
    : null;
  const focusedLabel = focusedComp?.label || null;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const data = projectData.layoutData?.versus || {};
  const categories = Array.isArray(data.categoryScores) ? data.categoryScores.slice(0, 7) : [];

  return (
    <>
      <div
        key={`vs-l-${animationKey}`}
        className="absolute z-10 grid"
        style={{
          top: 32,
          bottom: '42%',
          left: 14,
          right: 14,
          gridTemplateColumns: '1fr 2fr 1fr',
          gap: 10,
        }}
      >
        {/* 左: main 選手 */}
        <div
          className="flex flex-col items-end justify-center text-right"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${themeClass.glow}25 100%)`,
            borderRadius: 8,
            padding: '8px 12px',
            animation: 'cardBounceIn 0.4s var(--spring-bounce) both',
          }}
        >
          <div className={`text-[10px] font-bold tracking-widest ${themeClass.text}`}>
            {projectData.mainPlayer?.label || '今季'}
          </div>
          <div className={`text-[18px] font-black leading-tight ${themeClass.text}`}
               style={{ textShadow: `0 0 14px ${themeClass.glow}` }}>
            {projectData.mainPlayer?.name || '主役'}
          </div>
        </div>

        {/* 中央: カテゴリ比較 */}
        <div className="bg-zinc-900/78 rounded-lg border border-zinc-700/50 backdrop-blur-sm overflow-hidden flex flex-col"
             style={{ animation: 'cardBounceIn 0.5s var(--spring-bounce) both 0.05s' }}>
          {categories.map((cat, i) => {
            const winner = judgeWinner(cat);
            const mainWin = winner === 'main';
            const subWin = winner === 'sub';
            const mainDisplay = cat.rawMain ?? cat.main ?? '-';
            const subDisplay = cat.rawSub ?? cat.sub ?? '-';
            const focused = focusedLabel && statMatches(cat.label, focusedLabel);
            return (
              <div
                key={focused ? `${i}-foc-${focusedLabel}` : `${i}`}
                className={`grid items-center gap-2 px-2 py-1 border-b border-zinc-800/60 last:border-b-0 ${
                  focused ? 'bg-amber-500/15 ring-1 ring-amber-400/60' : ''
                }`}
                style={{
                  gridTemplateColumns: '1fr 24px 80px 24px 1fr',
                  animation: focused
                    ? 'rankRowIn 0.5s var(--spring-bounce) backwards, focusRowGlow 2s ease-in-out infinite'
                    : `rankRowIn 0.4s var(--spring-bounce) ${i * 0.06}s backwards`,
                }}
              >
                {/* main 値 */}
                <div className={`text-right text-[15px] font-impact leading-none ${
                  mainWin ? `${themeClass.text} num-shimmer` : 'text-zinc-500'
                }`}
                     style={mainWin ? { textShadow: `0 0 10px ${themeClass.glow}` } : {}}>
                  {mainDisplay}
                </div>
                {/* main 矢印 */}
                <div className="text-center text-[12px] font-black">
                  {mainWin && <span className={themeClass.text} style={{ animation: 'badgeBreath 1.5s ease-in-out infinite' }}>◀</span>}
                </div>
                {/* ラベル中央 */}
                <div className={`text-center text-[10px] font-bold tracking-wider ${focused ? 'text-amber-300' : 'text-zinc-200'}`}>
                  {cat.label}
                </div>
                {/* sub 矢印 */}
                <div className="text-center text-[12px] font-black">
                  {subWin && <span className="text-sky-400" style={{ animation: 'badgeBreath 1.5s ease-in-out infinite' }}>▶</span>}
                  {!mainWin && !subWin && <span className="text-zinc-600">=</span>}
                </div>
                {/* sub 値 */}
                <div className={`text-left text-[15px] font-impact leading-none ${
                  subWin ? 'text-sky-300 num-shimmer' : 'text-zinc-500'
                }`}
                     style={subWin ? { textShadow: '0 0 10px rgba(56,189,248,0.7)' } : {}}>
                  {subDisplay}
                </div>
              </div>
            );
          })}
        </div>

        {/* 右: sub 選手 */}
        <div
          className="flex flex-col items-start justify-center text-left"
          style={{
            background: 'linear-gradient(270deg, transparent 0%, rgba(56,189,248,0.18) 100%)',
            borderRadius: 8,
            padding: '8px 12px',
            animation: 'cardBounceIn 0.4s var(--spring-bounce) both',
          }}
        >
          <div className="text-[10px] font-bold tracking-widest text-sky-300">
            {projectData.subPlayer?.label || '昨季'}
          </div>
          <div className="text-[18px] font-black leading-tight text-sky-200"
               style={{ textShadow: '0 0 14px rgba(56,189,248,0.7)' }}>
            {projectData.subPlayer?.name || '比較'}
          </div>
        </div>
      </div>
    </>
  );
}
