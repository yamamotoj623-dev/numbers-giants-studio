/**
 * 共通アウトロパネル (全レイアウト共通、フェーズD)
 * - 分析まとめ3点(自動要約 or プロジェクトデータのキーポイント)
 * - CTA 問いかけ
 * - いいね/チャンネル登録ボタン
 */

import React from 'react';

export function OutroPanel({ projectData }) {
  const comps = projectData.comparisons || [];
  const wins = comps.filter(c => c.winner === 'main').slice(0, 2);
  const losses = comps.filter(c => c.winner === 'sub').slice(0, 1);

  const points = [
    ...wins.map(c => ({ strong: `${c.label} ${c.valMain}`, rest: c.desc || '' })),
    ...losses.map(c => ({ strong: `${c.label} ${c.valMain}`, rest: '要改善' })),
  ].slice(0, 3);

  const playerName = projectData.mainPlayer?.name || '選手';

  return (
    <div className="flex-1 flex flex-col relative z-10 w-full px-2.5 pt-[118px] pb-[14%]">
      <div className="bg-gradient-to-b from-zinc-900/95 to-zinc-800/85 rounded-2xl border border-orange-500/35 px-3 py-3 mb-2" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
        <div className="text-[10px] text-orange-500 font-black tracking-widest text-center mb-2">▼ 今日の分析まとめ</div>
        <div className="text-center text-[18px] font-black text-white leading-snug tracking-tight mb-2">
          {playerName}の<br />
          <span className="text-orange-500">分析ポイント</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {points.map((p, i) => (
            <div key={i} className="outro-point flex items-start gap-2 text-[13px] text-zinc-300 font-bold leading-snug">
              <span className="check text-orange-500 text-[14px] font-black flex-shrink-0">✓</span>
              <span><strong className="text-white font-black">{p.strong}</strong> {p.rest}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="outro-cta-jiggle relative rounded-2xl px-4 py-3 mb-2 overflow-hidden" style={{ background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', boxShadow: '0 8px 24px rgba(249,115,22,0.4)' }}>
        <div className="absolute -top-[40%] -right-[15%] w-[120px] h-[120px] rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }}></div>
        <div className="relative z-10 text-[16px] text-white font-black text-center tracking-tight leading-snug">
          {playerName}の今季<br />
          <span className="text-[1.4em] inline-block">予想</span>は？
        </div>
        <div className="relative z-10 text-center text-[11px] text-white/95 font-black mt-1 tracking-wider">💬 コメントで教えて！</div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative overflow-hidden bg-zinc-800/90 border-2 border-red-500 rounded-xl py-2.5 flex flex-col items-center gap-1">
          <span className="outro-like-pulse text-[26px] text-red-500" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.6))' }}>❤</span>
          <span className="text-[11px] text-red-500 font-black tracking-wider">いいね</span>
        </div>
        <div className="outro-sub-shine flex-1 relative overflow-hidden border-2 border-red-500 rounded-xl py-2.5 flex flex-col items-center gap-1" style={{ background: 'linear-gradient(180deg, rgba(239,68,68,0.2), rgba(39,39,42,0.9))' }}>
          <span className="text-[26px] text-red-500" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.6))' }}>🔔</span>
          <span className="text-[11px] text-white font-black tracking-wider">チャンネル登録</span>
        </div>
      </div>
    </div>
  );
}
