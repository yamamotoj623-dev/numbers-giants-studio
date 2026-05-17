/**
 * FreetalkLayout: フリートーク・挨拶動画用の縦長レイアウト
 *
 * 「データを見せる」のではなく「キャラが語る」ためのレイアウト。
 * - stats / comparisons / radarStats は使わない
 * - text と speech が画面を支配
 * - 上 1/4 にトピック表示、中 1/2 にテロップ領域、下 1/4 に highlights カード
 *
 * layoutData.freetalk:
 *   - mode: "duo" / "solo"
 *   - topic: 動画テーマ(必須)
 *   - tagline: 補足テキスト(省略可)
 *   - background: "stadium" / "office" / "cafe" / "studio" / "default"
 *   - highlights: [{ label, value }] 0-4 個
 */

import React from 'react';
import { THEMES } from '../lib/config.js';

const BACKGROUND_GRADIENTS = {
  stadium: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a8c 40%, #0a1929 100%)',
  office:  'linear-gradient(180deg, #2d2438 0%, #443754 40%, #1a1322 100%)',
  cafe:    'linear-gradient(180deg, #3d2e1f 0%, #5c4a37 40%, #1f1610 100%)',
  studio:  'linear-gradient(180deg, #1a1a2e 0%, #2d2d5e 40%, #0a0a1a 100%)',
  default: 'linear-gradient(180deg, #18181b 0%, #27272a 40%, #09090b 100%)',
};

export function FreetalkLayout(props) {
  const themeClass = THEMES[props.projectData?.theme] || THEMES.orange;
  const data = props.projectData?.layoutData?.freetalk || {};
  const topic = data.topic || '';
  const tagline = data.tagline || '';
  const background = data.background || 'default';
  const highlights = Array.isArray(data.highlights) ? data.highlights.slice(0, 4) : [];

  const bgGradient = BACKGROUND_GRADIENTS[background] || BACKGROUND_GRADIENTS.default;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-between"
      style={{ background: bgGradient, padding: '12px 12px 16px 12px' }}
    >
      {/* 上部: トピックバー */}
      <div className="w-full text-center">
        <div className={`text-[18px] font-black ${themeClass.text} tracking-wide leading-tight`}>
          {topic}
        </div>
        {tagline && (
          <div className="text-[11px] font-medium text-zinc-300 mt-1 leading-tight">
            {tagline}
          </div>
        )}
      </div>

      {/* 中部: テロップ領域(text 主役、ここは LayoutRouter 外の TeleopOverlay が担当)
          → このレイアウトでは中央を空ける(他レイアウトと違って stats/chart を置かない) */}
      <div className="flex-1 w-full flex items-center justify-center">
        {/* 中央の余白 - テロップは別レイヤーで重なる */}
      </div>

      {/* 下部: highlights カード(0-4 個、横並び) */}
      {highlights.length > 0 && (
        <div className={`w-full grid gap-1.5`} style={{
          gridTemplateColumns: `repeat(${highlights.length}, 1fr)`,
        }}>
          {highlights.map((h, i) => (
            <div
              key={i}
              className="bg-zinc-900/70 border border-zinc-700/50 rounded-md px-2 py-1.5 backdrop-blur-sm"
            >
              <div className="text-[9px] font-medium text-zinc-400 leading-tight truncate">
                {h.label}
              </div>
              <div className={`text-[12px] font-black ${themeClass.text} leading-tight truncate mt-0.5`}>
                {h.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
