/**
 * layoutType: team_context
 * 打順・起用法・戦術考察向けレイアウト。
 * 個人の数字ではなく「チームの中での位置づけ」を可視化する。
 *
 * layoutData.context スキーマ:
 * {
 *   mode: "lineup" | "role",
 *   lineup: [                                 // mode=lineup 時
 *     { order: 1, name: "泉口", ops: 1.013, isMainPlayer: false },
 *     ...
 *   ],
 *   roles: [                                  // mode=role 時
 *     { label: "1番 (リードオフ)", fit: 85, note: "長打・出塁両方OK" },
 *     ...
 *   ],
 *   narrative: "5番に増田陸を置くべき3つの理由"
 * }
 */

import React from 'react';
import { THEMES } from '../lib/config';
import { OutroPanel } from '../components/OutroPanel.jsx';

export function TeamContextLayout({ projectData, currentScript, animationKey , phase = 'normal'}) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} currentScript={currentScript} />;

  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const data = projectData.layoutData?.context || {
    mode: 'lineup',
    narrative: '打線の最適解を探る',
    lineup: [
      { order: 1, name: '泉口', ops: 1.013, isMainPlayer: false },
      { order: 2, name: 'キャベッジ', ops: 0.820, isMainPlayer: false },
      { order: 3, name: '坂本', ops: 0.890, isMainPlayer: false },
      { order: 4, name: 'ダルベック', ops: 0.980, isMainPlayer: false },
      { order: 5, name: '増田陸', ops: 0.724, isMainPlayer: true },
      { order: 6, name: '大城', ops: 0.850, isMainPlayer: false },
      { order: 7, name: '浅野', ops: 0.780, isMainPlayer: false },
      { order: 8, name: '佐々木', ops: 0.810, isMainPlayer: false },
      { order: 9, name: '投手', ops: 0.200, isMainPlayer: false },
    ],
    roles: [],
  };

  return (
    <div key={`zoom-${animationKey}`} className="flex-1 flex flex-col justify-start relative z-10 w-full pt-1 pb-2 px-3">

      <div className="absolute top-1 left-4 z-20">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${themeClass.bg} text-white shadow-md`}>{projectData.mainPlayer.label}</span>
      </div>
      <div className="absolute top-1 right-4 z-20">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-700 text-zinc-300 shadow-md">
          {data.mode === 'lineup' ? '打線考察' : '役割分析'}
        </span>
      </div>

      {data.narrative && (
        <div className="mt-8 mb-2 bg-zinc-900/95 rounded-xl border border-zinc-700/50 overflow-hidden shadow-lg backdrop-blur-sm z-20 p-3">
          <div className={`text-[14px] font-black text-center ${themeClass.text}`} style={{ textShadow: `0 0 15px ${themeClass.glow}` }}>
            {data.narrative}
          </div>
        </div>
      )}

      {data.mode === 'lineup' && (
        <div className="bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
          <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/30 flex items-center justify-between">
            <span className={`${themeClass.text} text-[10px] font-black`}>提案オーダー</span>
            <span className="text-zinc-500 text-[9px] font-bold">合計OPS: {data.lineup.reduce((s, p) => s + p.ops, 0).toFixed(2)}</span>
          </div>
          {data.lineup.map(p => (
            <div
              key={p.order}
              className={`flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 last:border-b-0 transition-all ${
                p.isMainPlayer
                  ? `${themeClass.bg}/20 scale-[1.02] ring-1 ring-inset ${themeClass.ring}`
                  : ''
              }`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-[12px] shadow ${
                p.isMainPlayer ? `${themeClass.bg} text-white` : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}>
                {p.order}
              </div>
              <span className={`flex-1 text-[12px] font-black ${p.isMainPlayer ? 'text-white' : 'text-zinc-300'}`}>
                {p.name}
                {p.isMainPlayer && <span className={`ml-1.5 text-[8px] ${themeClass.text} font-black`}>◀ 注目</span>}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${p.isMainPlayer ? themeClass.bg : 'bg-zinc-600'}`}
                    style={{ width: `${Math.min(100, (p.ops / 1.2) * 100)}%` }}
                  />
                </div>
                <span className={`text-[11px] font-mono font-black w-12 text-right ${p.isMainPlayer ? themeClass.text : 'text-zinc-400'}`}>
                  {p.ops.toFixed(3).replace(/^0/, '')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.mode === 'role' && (
        <div className="bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl backdrop-blur-sm z-20">
          <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/30">
            <span className={`${themeClass.text} text-[10px] font-black`}>役割適性スコア</span>
          </div>
          {(data.roles || []).map((role, i) => (
            <div key={i} className="px-3 py-2 border-b border-zinc-800 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-black text-white">{role.label}</span>
                <span className={`text-[15px] font-mono font-black ${role.fit >= 80 ? themeClass.text : role.fit >= 60 ? 'text-yellow-400' : 'text-zinc-500'}`}>{role.fit}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${role.fit}%`,
                    background: role.fit >= 80 ? themeClass.primary : role.fit >= 60 ? '#eab308' : '#52525b',
                    boxShadow: role.fit >= 80 ? `0 0 8px ${themeClass.glow}` : 'none',
                  }}
                />
              </div>
              {role.note && <div className="text-[9px] text-zinc-500">{role.note}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 bg-zinc-900/90 rounded-xl border border-zinc-700/50 overflow-hidden z-20">
        {projectData.comparisons.slice(0, 2).map(comp => {
          const isH = currentScript?.highlight === comp.id;
          return (
            <div key={comp.id} className={`flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 ${isH ? `${themeClass.bg}/15 scale-[1.02]` : ''} transition-all`}>
              <span className={`text-[11px] font-black ${isH ? 'text-white' : 'text-zinc-400'}`}>{comp.label}</span>
              <span className={`text-[14px] font-mono font-black ${comp.winner === 'main' ? themeClass.text : 'text-zinc-500'}`}>{comp.valMain}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
