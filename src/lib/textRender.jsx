/**
 * テロップレンダリング関数
 * 【】黄色 / 「」オレンジ / 『』赤 の強調ルールを実装
 */

import React from 'react';

export function renderFormattedText(text, isCatchy = false, speaker = null) {
  if (!text) return null;
  const lines = text.split('\n');
  let firstBracketEncountered = false;
  const baseTextColor = speaker === 'B' ? 'text-yellow-300' : 'text-white';

  return lines.map((line, lineIndex) => {
    const parts = line.split(/(【.*?】|「.*?」|『.*?』)/g);
    return (
      <div key={lineIndex} className="block w-full leading-[1.35] py-0.5">
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('【') && part.endsWith('】')) {
            let displayText = part.slice(1, -1);
            if (isCatchy && !firstBracketEncountered) {
              displayText = part;
              firstBracketEncountered = true;
            } else if (isCatchy) {
              firstBracketEncountered = true;
            }
            return <span key={i} className="text-[#FFD700] text-[1.15em] font-black tracking-tighter mx-0.5 transform -translate-y-[2px] inline-block">{displayText}</span>;
          }
          if (part.startsWith('「') && part.endsWith('」')) {
            return <span key={i} className="text-[#FF8C00] text-[1.1em] font-black tracking-tighter mx-0.5 inline-block">{part.slice(1, -1)}</span>;
          }
          if (part.startsWith('『') && part.endsWith('』')) {
            return <span key={i} className="text-[#FF4500] text-[1.1em] font-black tracking-tighter mx-0.5 inline-block">{part.slice(1, -1)}</span>;
          }
          return <span key={i} className={`${baseTextColor} font-black tracking-tight drop-shadow-md`}>{part}</span>;
        })}
      </div>
    );
  });
}

export function getRankData(score) {
  if (score >= 90) return { rank: 'S', color: 'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' };
  if (score >= 80) return { rank: 'A', color: 'text-red-500' };
  if (score >= 70) return { rank: 'B', color: 'text-orange-500' };
  if (score >= 60) return { rank: 'C', color: 'text-emerald-500' };
  if (score >= 50) return { rank: 'D', color: 'text-blue-500' };
  if (score >= 40) return { rank: 'E', color: 'text-zinc-400' };
  if (score >= 30) return { rank: 'F', color: 'text-zinc-500' };
  return { rank: 'G', color: 'text-zinc-600' };
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '249, 115, 22';
}
