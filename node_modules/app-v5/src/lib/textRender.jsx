/**
 * テロップレンダリング関数 v5.0.0 UI確定版
 * 【】黄色 / 「」オレンジ / 『』赤 の強調ルール
 *
 * デモHTML の em-y / em-o / em-r クラスと対応。
 * GlobalStyles 内の .telop-normal .em-y 等のCSSが適用される。
 */

import React from 'react';

export function renderFormattedText(text, isCatchy = false, speaker = null) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(【.*?】|「.*?」|『.*?』)/g);
    return (
      <React.Fragment key={lineIndex}>
        {lineIndex > 0 && <br />}
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('【') && part.endsWith('】')) {
            const inner = part.slice(1, -1);
            // 数字だけの場合は em-n (モノスペース), それ以外は em-y
            const isNumberOnly = /^[0-9.０-９．\-−\s]+$/.test(inner);
            return <span key={i} className={isNumberOnly ? 'em-n' : 'em-y'}>{inner}</span>;
          }
          if (part.startsWith('「') && part.endsWith('」')) {
            return <span key={i} className="em-o">{part.slice(1, -1)}</span>;
          }
          if (part.startsWith('『') && part.endsWith('』')) {
            return <span key={i} className="em-r">{part.slice(1, -1)}</span>;
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </React.Fragment>
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
