/**
 * VerdictCardLayout: 編集判断カード(縦長 9:16)
 *
 * チャンネル差別化の本丸: 「データを読み上げてる」→「★G党が解釈している★」を視覚化。
 * 動画終盤(id 25-30 付近)で使う、4 つの判断を四象限で同時表示。
 *
 * layoutData.verdict:
 *   - mainCall: { speaker: "数原判定", verdict: "起用継続でOK", reason: "ローテ穴埋め、平均球速も維持" }
 *   - dissent:  { speaker: "もえか異議", verdict: "でも初球は怖い", reason: "初球被打率.380、捕手と噛み合ってない" }
 *   - conclusion: { label: "今日の結論", value: "問題は打率ではなく初球" }
 *   - fanInsight: { label: "G党向け要点", value: "明日見るべき数字は初球ストライク率" }
 *
 * 縦長(9:16)では: 上から mainCall / dissent / conclusion / fanInsight の 4 段積み
 * highlight: "mainCall" | "dissent" | "conclusion" | "fanInsight" で行強調
 */

import React from 'react';
import { THEMES } from '../lib/config.js';

export function VerdictCardLayout(props) {
  const themeClass = THEMES[props.projectData?.theme] || THEMES.orange;
  const data = props.projectData?.layoutData?.verdict || {};
  const mainCall = data.mainCall || { speaker: '数原判定', verdict: '-', reason: '' };
  const dissent = data.dissent || { speaker: 'もえか異議', verdict: '-', reason: '' };
  const conclusion = data.conclusion || { label: '今日の結論', value: '-' };
  const fanInsight = data.fanInsight || { label: 'G党向け要点', value: '-' };

  // 現在 highlight 値で行強調
  const scripts = props.projectData?.scripts || [];
  const currentIndex = props.currentIndex ?? 0;
  let currentHighlight = null;
  for (let i = currentIndex; i >= 0; i--) {
    if (scripts[i]?.highlight) {
      currentHighlight = scripts[i].highlight;
      break;
    }
  }

  const isHl = (key) => currentHighlight === key;

  return (
    <div className="w-full h-full flex flex-col gap-2 px-2.5 py-2" style={{
      background: 'linear-gradient(180deg, #0a0a14 0%, #14141f 100%)',
    }}>
      {/* mainCall: 数原判定 */}
      <div className={`flex-1 rounded-lg border-2 transition-all duration-300 ${
        isHl('mainCall')
          ? `${themeClass.border} bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 scale-[1.02] shadow-lg shadow-emerald-500/20`
          : 'border-zinc-700 bg-zinc-900/40'
      }`} style={{ padding: '8px 10px' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
            ✓ {mainCall.speaker || '数原判定'}
          </span>
        </div>
        <div className={`text-[15px] font-black leading-tight ${isHl('mainCall') ? themeClass.text : 'text-white'}`}>
          {mainCall.verdict}
        </div>
        {mainCall.reason && (
          <div className="text-[10px] font-medium text-zinc-400 leading-snug mt-1">
            {mainCall.reason}
          </div>
        )}
      </div>

      {/* dissent: もえか異議 */}
      <div className={`flex-1 rounded-lg border-2 transition-all duration-300 ${
        isHl('dissent')
          ? `${themeClass.border} bg-gradient-to-br from-rose-900/30 to-rose-950/30 scale-[1.02] shadow-lg shadow-rose-500/20`
          : 'border-zinc-700 bg-zinc-900/40'
      }`} style={{ padding: '8px 10px' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">
            ⚠ {dissent.speaker || 'もえか異議'}
          </span>
        </div>
        <div className={`text-[15px] font-black leading-tight ${isHl('dissent') ? themeClass.text : 'text-white'}`}>
          {dissent.verdict}
        </div>
        {dissent.reason && (
          <div className="text-[10px] font-medium text-zinc-400 leading-snug mt-1">
            {dissent.reason}
          </div>
        )}
      </div>

      {/* conclusion: 今日の結論 */}
      <div className={`rounded-lg border-2 transition-all duration-300 ${
        isHl('conclusion')
          ? `${themeClass.border} ${themeClass.bg}/15 scale-[1.02] shadow-lg`
          : 'border-amber-700/50 bg-amber-950/20'
      }`} style={{ padding: '8px 10px' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-bold text-amber-300 tracking-wider">
            🎯 {conclusion.label || '今日の結論'}
          </span>
        </div>
        <div className={`text-[14px] font-black leading-tight ${isHl('conclusion') ? themeClass.text : 'text-amber-100'}`}>
          {conclusion.value}
        </div>
      </div>

      {/* fanInsight: G党向け要点 */}
      <div className={`rounded-lg border-2 transition-all duration-300 ${
        isHl('fanInsight')
          ? `${themeClass.border} ${themeClass.bg}/15 scale-[1.02] shadow-lg`
          : 'border-orange-700/50 bg-orange-950/20'
      }`} style={{ padding: '8px 10px' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-bold text-orange-300 tracking-wider">
            ⚾ {fanInsight.label || 'G党向け要点'}
          </span>
        </div>
        <div className={`text-[13px] font-black leading-tight ${isHl('fanInsight') ? themeClass.text : 'text-orange-100'}`}>
          {fanInsight.value}
        </div>
      </div>
    </div>
  );
}
