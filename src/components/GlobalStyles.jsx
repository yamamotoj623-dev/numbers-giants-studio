/**
 * v5.0.0 UI確定版グローバルスタイル
 * デモHTML v15 の CSS をそのまま React に移植
 * (クラス名・アニメーション名・CSS変数すべてデモと1対1で対応)
 */
import React from 'react';

const CSS_TEXT = `
  :root { --p: #f97316; --p-glow: rgba(249,115,22,0.6); --indigo: #4f46e5; --sky: #0ea5e9; --rose: #fb7185; --rose-glow: rgba(251,113,133,0.6); --like: #ef4444; }
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; margin: 0; padding: 0; }
  body { background: #f4f4f5; font-family: -apple-system, "Segoe UI", "Noto Sans JP", sans-serif; padding: 20px 10px 40px; }

  .demo-head { max-width: 920px; margin: 0 auto 20px; text-align: center; }
  .demo-head h1 { font-size: 20px; font-weight: 900; color: #18181b; margin-bottom: 6px; }
  .demo-head p { font-size: 13px; color: #52525b; line-height: 1.5; }

  .phase-switcher { display: flex; gap: 6px; justify-content: center; margin: 16px 0 12px; flex-wrap: wrap; padding: 0 12px; }
  .phase-btn { font-size: 12px; font-weight: 700; padding: 10px 14px; background: #fff; border: 2px solid #e4e4e7; border-radius: 8px; cursor: pointer; color: #52525b; transition: all 0.15s; min-width: 100px; }
  .phase-btn.active { background: var(--indigo); color: #fff; border-color: var(--indigo); box-shadow: 0 4px 12px rgba(79,70,229,0.3); }

  .controls-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; flex-wrap: wrap; padding: 0 12px; align-items: center; }
  .ctrl-toggle { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #52525b; cursor: pointer; user-select: none; background: #fff; padding: 7px 12px; border-radius: 6px; border: 1px solid #e4e4e7; }
  .main-btn { font-size: 13px; font-weight: 900; padding: 10px 20px; background: var(--indigo); color: #fff; border: 0; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); display: inline-flex; align-items: center; gap: 6px; }
  .main-btn.playing { background: var(--like); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
  .replay-btn { font-size: 12px; font-weight: 700; padding: 7px 14px; background: #18181b; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }

  /* フック出現アニメ切替トグル */
  .anim-mode-row { display: flex; gap: 6px; justify-content: center; margin-bottom: 12px; }
  .anim-mode-btn { font-size: 11px; font-weight: 700; padding: 6px 12px; background: #fff; border: 2px solid #e4e4e7; border-radius: 6px; cursor: pointer; color: #71717a; }
  .anim-mode-btn.active { background: var(--p); color: #fff; border-color: var(--p); }

  .phone-wrapper { max-width: 420px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 14px; }

  .phone { width: 360px; max-width: 92vw; aspect-ratio: 9/16; background: #0d0d0f; border-radius: 32px; border: 6px solid #18181b; box-shadow: 0 15px 40px rgba(0,0,0,0.18); overflow: hidden; position: relative; transition: border-radius 0.3s, border 0.3s; }
  .phone.square { border-radius: 0; border: 1px solid #e4e4e7; }
  /* 録画モード: 編集用UIを全て非表示 */
  .phone.record-mode .duration-badge { display: none; }
  .phone.record-mode .safe-zone-guide { display: none !important; }

  .safe-zone-guide { position: absolute; left: 0; right: 0; pointer-events: none; z-index: 100; display: none; }
  .safe-zone-guide.top { top: 0; height: 14%; background: repeating-linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,0,0,0.1) 10px, transparent 10px, transparent 20px); border-bottom: 1px dashed rgba(255,0,0,0.5); }
  .safe-zone-guide.bottom { bottom: 0; height: 14%; background: repeating-linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,0,0,0.1) 10px, transparent 10px, transparent 20px); border-top: 1px dashed rgba(255,0,0,0.5); }
  .safe-zone-guide.right-actions { top: 14%; bottom: 14%; right: 0; left: auto; width: 12%; background: repeating-linear-gradient(135deg, rgba(255,0,0,0.08), rgba(255,0,0,0.08) 8px, transparent 8px, transparent 16px); border-left: 1px dashed rgba(255,0,0,0.5); }

  .ph-date { position: absolute; top: 14px; right: 14px; color: var(--p); opacity: 0.85; font-size: 9px; font-weight: 700; z-index: 25; display: flex; align-items: center; gap: 3px; letter-spacing: 0.5px; }
  .ph-date::before { content: '●'; font-size: 7px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

  /* 動画時間バッジ(右上、日付と重ならないように上部左に配置) */
  .duration-badge { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); background: rgba(24,24,27,0.85); border: 1px solid rgba(79,70,229,0.5); color: #a5b4fc; font-size: 9px; font-weight: 900; padding: 3px 8px; border-radius: 4px; z-index: 45; display: flex; align-items: center; gap: 4px; letter-spacing: 0.5px; }
  .duration-badge .clock { font-size: 10px; }

  .ph-brand-small { position: absolute; bottom: 10px; left: 10px; opacity: 0.4; z-index: 40; display: flex; align-items: baseline; gap: 2px; }
  .ph-brand-small .g { color: var(--p); font-weight: 900; font-style: italic; font-size: 13px; line-height: 1; }
  .ph-brand-small .a { color: #a1a1aa; font-weight: 700; font-size: 6px; letter-spacing: 1.5px; text-transform: uppercase; }

  /* 全phase共通ロゴ (左上固定、フェーズ問わず) */
  .brand-logo-fixed {
    position: absolute; top: 10px; left: 14px; z-index: 35;
    display: flex; flex-direction: column; align-items: flex-start; pointer-events: none;
  }
  .brand-logo-fixed .row { display: flex; align-items: baseline; gap: 3px; }
  .brand-logo-fixed .g { color: var(--p); font-weight: 900; font-style: italic; font-size: 15px; line-height: 1; text-shadow: 0 0 6px var(--p-glow); }
  .brand-logo-fixed .title { color: #fff; font-weight: 900; font-size: 9px; letter-spacing: 0.5px; line-height: 1; opacity: 0.9; }
  .brand-logo-fixed .sub { color: var(--p); font-weight: 700; font-size: 6px; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 2px; opacity: 0.6; }

  .content { position: absolute; inset: 0; z-index: 10; }

  /* レイアウト切替時のフェードアニメーション */
  .layout-fade-wrap {
    width: 100%; height: 100%;
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    transition: opacity 0.45s ease-out;
  }
  .layout-fade-wrap.fade-in { opacity: 1; }
  .layout-fade-wrap.fade-out { opacity: 0; }
  .phase { display: none; position: absolute; inset: 0; }
  .phase.active { display: block; }

  /* ================================================================ */
  /* アニメ */
  /* ================================================================ */
  @keyframes hookLineIn {
    0% { opacity: 0; transform: translateY(8px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes hookShake {
    0% { opacity: 0; transform: translate(0,0); }
    3% { opacity: 1; transform: translate(-7px, -4px) rotate(-2deg); }
    6% { transform: translate(7px, 4px) rotate(2deg); }
    9% { transform: translate(-7px, 3px) rotate(-2deg); }
    12% { transform: translate(6px, -4px) rotate(2deg); }
    15% { transform: translate(-6px, 4px) rotate(-2deg); }
    18% { transform: translate(6px, -3px) rotate(1.5deg); }
    21% { transform: translate(-5px, 3px) rotate(-1.5deg); }
    25% { transform: translate(5px, -3px) rotate(1.5deg); }
    30% { transform: translate(-4px, 2px) rotate(-1deg); }
    35% { transform: translate(4px, -2px) rotate(1deg); }
    40% { transform: translate(-4px, 2px) rotate(-1deg); }
    45% { transform: translate(3px, -2px) rotate(1deg); }
    50% { transform: translate(-3px, 1px) rotate(-0.8deg); }
    55% { transform: translate(3px, -1px) rotate(0.8deg); }
    60% { transform: translate(-2px, 1px) rotate(-0.5deg); }
    65% { transform: translate(2px, -1px) rotate(0.5deg); }
    70% { transform: translate(-2px, 0) rotate(-0.3deg); }
    75% { transform: translate(2px, 0) rotate(0.3deg); }
    80% { transform: translate(-1px, 0) rotate(0); }
    85% { transform: translate(1px, 0) rotate(0); }
    100% { opacity: 1; transform: translate(0,0) rotate(0); }
  }

  @keyframes silhouetteBreath {
    0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.18; }
    50% { transform: translateX(-50%) scale(1.03); opacity: 0.24; }
  }

  @keyframes statsWipe {
    0% { clip-path: inset(0 100% 0 0); }
    100% { clip-path: inset(0 0 0 0); }
  }

  @keyframes numberPulse {
    0%, 100% { box-shadow: 0 0 15px var(--p-glow); }
    50% { box-shadow: 0 0 25px var(--p), 0 0 40px var(--p-glow); }
  }

  /* レーダー描画を高速化(1.2s→0.8s) */
  @keyframes radarStrokeDraw {
    0% { stroke-dasharray: 400; stroke-dashoffset: 400; fill-opacity: 0; }
    70% { stroke-dasharray: 400; stroke-dashoffset: 0; fill-opacity: 0; }
    100% { stroke-dasharray: 400; stroke-dashoffset: 0; fill-opacity: 1; }
  }

  @keyframes radarDotPop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.4); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes radarLabelIn {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes telopSlideUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes radarShrink {
    0% { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes cardExpand {
    0% { opacity: 0; transform: translateY(30px) scaleY(0.7); }
    100% { opacity: 1; transform: translateY(0) scaleY(1); }
  }

  @keyframes vertexZoomLight {
    0% { transform: scale(3); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes cardPulse {
    0%, 100% { box-shadow: 0 8px 24px rgba(249,115,22,0.15), inset 0 0 0 1px rgba(249,115,22,0.15); }
    50% { box-shadow: 0 8px 30px rgba(249,115,22,0.35), inset 0 0 0 1px rgba(249,115,22,0.35); }
  }

  @keyframes checkPopIn {
    0% { opacity: 0; transform: scale(0) rotate(-45deg); }
    60% { opacity: 1; transform: scale(1.4) rotate(12deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }

  @keyframes pointSlideIn {
    0% { opacity: 0; transform: translateX(-12px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  @keyframes ctaJiggle {
    0%, 92%, 100% { transform: translateX(0) rotate(0); }
    94% { transform: translateX(-2px) rotate(-0.5deg); }
    96% { transform: translateX(2px) rotate(0.5deg); }
    98% { transform: translateX(-1px) rotate(0); }
  }

  @keyframes shineSweep {
    0%, 60% { transform: translateX(-150%) skewX(-25deg); }
    70%, 100% { transform: translateX(250%) skewX(-25deg); }
  }

  /* ================================================================ */
  /* フェーズA */
  /* ================================================================ */
  .phase-a { background: radial-gradient(ellipse at center 40%, #1a1a1e 0%, #0d0d0f 70%); }

  .hook-silhouette { position: absolute; left: 50%; top: 36%; transform: translateX(-50%); z-index: 5; opacity: 0.2; width: 300px; height: 300px; }
  .phase-a.active .hook-silhouette { animation: silhouetteBreath 4s ease-in-out infinite; }
  .hook-silhouette svg { width: 100%; height: 100%; filter: drop-shadow(0 0 30px var(--p)); }

  .hook-header { position: absolute; top: 14px; left: 14px; right: 14px; z-index: 30; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }
  .hook-brand-strong { display: flex; flex-direction: column; align-items: flex-start; margin-top: 22px; }
  .hook-brand-strong .row { display: flex; align-items: baseline; gap: 4px; }
  .hook-brand-strong .g { color: var(--p); font-weight: 900; font-style: italic; font-size: 22px; line-height: 1; text-shadow: 0 0 10px var(--p-glow); }
  .hook-brand-strong .title { color: #fff; font-weight: 900; font-size: 12px; letter-spacing: 1px; line-height: 1; }
  .hook-brand-strong .sub { color: var(--p); font-weight: 700; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; opacity: 0.8; }

  .hook-player-pill { position: absolute; top: 14px; right: 8px; z-index: 30; background: rgba(24,24,27,0.9); backdrop-filter: blur(8px); border: 1px solid rgba(249,115,22,0.4); border-radius: 10px; padding: 6px 9px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
  .hook-player-pill .num { width: 22px; height: 22px; background: var(--p); color: #fff; font-weight: 900; font-size: 12px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
  .phase-a.active .hook-player-pill .num { animation: numberPulse 1.5s ease-in-out infinite; }
  .hook-player-pill .info { display: flex; flex-direction: column; line-height: 1; }
  .hook-player-pill .pos { color: var(--p); font-size: 7px; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
  .hook-player-pill .name { color: #fff; font-size: 13px; font-weight: 900; letter-spacing: -0.3px; }

  .hook-telop-wrap { position: absolute; top: 36%; left: 50%; transform: translate(-50%, -50%); z-index: 20; width: 100%; padding: 0 12px; }
  .telop-hook { font-size: 46px; font-weight: 900; text-align: center; line-height: 1.05; letter-spacing: -1.5px; color: #fff; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 10px 30px rgba(0,0,0,1); }
  /* 4行モード: フォント縮小 */
  .telop-hook.lines-4 { font-size: 38px; line-height: 1.02; }
  .telop-hook .em-y { color: #FFD700; font-size: 1.3em; letter-spacing: -2.5px; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 30px rgba(255,215,0,0.6); }

  .telop-hook .line { display: block; opacity: 0; margin: 2px 0; }

  /* ポップアップモード */
  .phase-a.active.anim-pop .telop-hook .line-1 { animation: hookLineIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0s forwards; }
  .phase-a.active.anim-pop .telop-hook .line-2 { animation: hookLineIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s forwards; }
  .phase-a.active.anim-pop .telop-hook .line-3 { animation: hookLineIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards; }
  .phase-a.active.anim-pop .telop-hook .line-4 { animation: hookLineIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards; }
  .phase-a.active.anim-pop .telop-hook .line-5 { animation: hookLineIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.4s forwards; }

  /* シェイクモード（1行ずつシェイクイン、1.5秒の長尺シェイク） */
  .phase-a.active.anim-shake .telop-hook .line-1 { animation: hookShake 0.7s cubic-bezier(0.36,0.07,0.19,0.97) 0s forwards; }
  .phase-a.active.anim-shake .telop-hook .line-2 { animation: hookShake 0.7s cubic-bezier(0.36,0.07,0.19,0.97) 0.05s forwards; }
  .phase-a.active.anim-shake .telop-hook .line-3 { animation: hookShake 0.7s cubic-bezier(0.36,0.07,0.19,0.97) 0.1s forwards; }
  .phase-a.active.anim-shake .telop-hook .line-4 { animation: hookShake 0.7s cubic-bezier(0.36,0.07,0.19,0.97) 0.15s forwards; }
  .phase-a.active.anim-shake .telop-hook .line-5 { animation: hookShake 0.7s cubic-bezier(0.36,0.07,0.19,0.97) 0.2s forwards; }

  /* hookAnimation オーバーライド用の追加パターン */
  @keyframes hookSlide {
    0% { opacity: 0; transform: translateX(-100%); }
    60% { opacity: 1; transform: translateX(10px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes hookZoom {
    0% { opacity: 0; transform: scale(2); }
    60% { opacity: 1; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes hookFade {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  .phase-a.active.anim-slide .telop-hook .line-1 { animation: hookSlide 0.5s cubic-bezier(0.16,1,0.3,1) 0s forwards; opacity: 0; }
  .phase-a.active.anim-slide .telop-hook .line-2 { animation: hookSlide 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; opacity: 0; }
  .phase-a.active.anim-slide .telop-hook .line-3 { animation: hookSlide 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; opacity: 0; }
  .phase-a.active.anim-slide .telop-hook .line-4 { animation: hookSlide 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; opacity: 0; }
  .phase-a.active.anim-slide .telop-hook .line-5 { animation: hookSlide 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s forwards; opacity: 0; }
  .phase-a.active.anim-zoom .telop-hook .line-1 { animation: hookZoom 0.6s cubic-bezier(0.34,1.56,0.64,1) 0s forwards; opacity: 0; }
  .phase-a.active.anim-zoom .telop-hook .line-2 { animation: hookZoom 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s forwards; opacity: 0; }
  .phase-a.active.anim-zoom .telop-hook .line-3 { animation: hookZoom 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards; opacity: 0; }
  .phase-a.active.anim-zoom .telop-hook .line-4 { animation: hookZoom 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards; opacity: 0; }
  .phase-a.active.anim-zoom .telop-hook .line-5 { animation: hookZoom 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.4s forwards; opacity: 0; }
  .phase-a.active.anim-fade .telop-hook .line-1 { animation: hookFade 0.5s ease-out 0s forwards; opacity: 0; }
  .phase-a.active.anim-fade .telop-hook .line-2 { animation: hookFade 0.5s ease-out 0.1s forwards; opacity: 0; }
  .phase-a.active.anim-fade .telop-hook .line-3 { animation: hookFade 0.5s ease-out 0.2s forwards; opacity: 0; }
  .phase-a.active.anim-fade .telop-hook .line-4 { animation: hookFade 0.5s ease-out 0.3s forwards; opacity: 0; }
  .phase-a.active.anim-fade .telop-hook .line-5 { animation: hookFade 0.5s ease-out 0.4s forwards; opacity: 0; }

  /* slide/zoom/fade モードでも stats は telopSlideUp で統一 */
  .phase-a.active.anim-slide .hook-stats-big,
  .phase-a.active.anim-zoom .hook-stats-big,
  .phase-a.active.anim-fade .hook-stats-big { animation: telopSlideUp 0.4s ease-out 0.55s forwards; }
  .phase-a.active.anim-slide .hook-stats-grid,
  .phase-a.active.anim-zoom .hook-stats-grid,
  .phase-a.active.anim-fade .hook-stats-grid { animation: statsWipe 0.6s ease-out 0.65s backwards; }

  .hook-stats-big { position: absolute; top: 58%; left: 10px; right: 10px; z-index: 25; opacity: 0; }
  .phase-a.active.anim-pop .hook-stats-big { animation: telopSlideUp 0.4s ease-out 0.55s forwards; }
  .phase-a.active.anim-shake .hook-stats-big { animation: telopSlideUp 0.4s ease-out 0.55s forwards; }
  .hook-stats-big .title { text-align: center; color: var(--p); font-weight: 900; font-size: 10px; letter-spacing: 3px; margin-bottom: 6px; }
  .hook-stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; background: linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.3), rgba(249,115,22,0.15)); border-top: 2px solid rgba(249,115,22,0.6); border-bottom: 2px solid rgba(249,115,22,0.6); padding: 10px 8px; box-shadow: 0 0 20px rgba(249,115,22,0.2); }
  .phase-a.active.anim-pop .hook-stats-grid { animation: statsWipe 0.6s ease-out 0.65s backwards; }
  .phase-a.active.anim-shake .hook-stats-grid { animation: statsWipe 0.6s ease-out 0.65s backwards; }
  .hook-stats-grid .cell { display: flex; flex-direction: column; align-items: center; line-height: 1; gap: 5px; }
  .hook-stats-grid .cell .v { color: #fff; font-family: monospace; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
  .hook-stats-grid .cell .l { color: var(--p); font-size: 10px; font-weight: 900; letter-spacing: 2px; }

  /* ================================================================ */
  /* フェーズB — タイミング短縮+テロップ中央+透過 */
  /* ================================================================ */
  .phase-b-header { position: absolute; top: 14px; left: 0; right: 0; z-index: 25; display: flex; justify-content: center; align-items: center; gap: 6px; pointer-events: none; }
  .phase-b-header .num { width: 24px; height: 24px; background: var(--p); color: #fff; font-weight: 900; font-size: 13px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px var(--p-glow); }
  .phase-b-header .name { color: var(--p); font-size: 17px; font-weight: 900; letter-spacing: -0.3px; line-height: 1; text-shadow: 0 0 8px var(--p-glow); }

  .radar-outer { position: absolute; top: 38px; bottom: 28%; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 0 12px; }
  .radar-svg-box { width: 100%; max-width: 280px; position: relative; }
  .radar-svg-box svg { width: 100%; height: auto; display: block; }

  /* 描画時間 0.8s に短縮 */
  /* レーダー描画アニメ: 全て radarFadeIn (opacity) に統一。
     normal phase 初回のみ発火、highlight ではCSSマッチせず完全無発火 */
  .phase[data-p="normal"].active .radar-main-poly { animation: radarFadeIn 0.5s ease-out forwards; }
  .phase[data-p="normal"].active .radar-sub-poly { animation: radarFadeIn 0.5s ease-out 0.15s backwards; }
  .phase[data-p="normal"].active .radar-dot { animation: radarFadeIn 0.3s ease-out backwards; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(1) { animation-delay: 0.3s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(2) { animation-delay: 0.35s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(3) { animation-delay: 0.4s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(4) { animation-delay: 0.45s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(5) { animation-delay: 0.5s; }
  .phase[data-p="normal"].active .radar-label-group { animation: radarFadeIn 0.3s ease-out backwards; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(1) { animation-delay: 0.55s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(2) { animation-delay: 0.6s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(3) { animation-delay: 0.65s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(4) { animation-delay: 0.7s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(5) { animation-delay: 0.75s; }
  @keyframes radarFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }

  .radar-legend { margin-top: 4px; display: flex; gap: 12px; justify-content: center; opacity: 0; }
  .phase[data-p="normal"].active .radar-legend { animation: telopSlideUp 0.4s ease-out 1.5s forwards; }
  /* highlight phase では legend は即時表示 */
  .phase[data-p="highlight"].active .radar-legend { opacity: 1; }
  .radar-legend-item { display: flex; align-items: center; gap: 7px; background: rgba(24,24,27,0.9); padding: 7px 14px; border-radius: 16px; border: 1px solid rgba(63,63,70,0.6); }
  .radar-legend-item .swatch { width: 18px; height: 4px; border-radius: 2px; flex-shrink: 0; }
  .radar-legend-item.main .swatch { background: var(--p); box-shadow: 0 0 6px var(--p); }
  .radar-legend-item.sub { border-color: rgba(161,161,170,0.3); }
  .radar-legend-item.sub .swatch { height: 2px; border-top: 2px dashed #a1a1aa; background: none; }
  .radar-legend-item .label { font-size: 13px; font-weight: 900; display: flex; flex-direction: column; line-height: 1.1; }
  .radar-legend-item .label .name { font-size: 14px; }
  .radar-legend-item .label .year { font-size: 11px; font-weight: 700; opacity: 0.8; margin-top: 1px; }
  .radar-legend-item.main .label { color: var(--p); }
  .radar-legend-item.sub .label { color: #a1a1aa; }

  /* 成績比較テーブル(平常時) - レーダー直下に密着配置 */
  .stats-table { margin-top: 4px; width: 100%; max-width: 340px; background: rgba(24,24,27,0.88); border: 1px solid rgba(63,63,70,0.6); border-radius: 10px; padding: 6px 8px; opacity: 0; z-index: 15; transition: opacity 0.3s; backdrop-filter: blur(6px); }
  .phase.active .stats-table { animation: telopSlideUp 0.4s ease-out 1.7s forwards; }
  /* テロップ表示時の半透明化は削除 - テロップ位置変更で不要に */
  .stats-grid-compact { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px 6px; }
  .stats-grid-compact .stat-cell { display: flex; flex-direction: column; line-height: 1.2; gap: 1px; align-items: center; }
  .stats-grid-compact .lbl { font-size: 7px; color: #71717a; font-weight: 900; letter-spacing: 0.5px; }
  .stats-grid-compact .vals { display: flex; flex-direction: column; gap: 1px; align-items: center; }
  .stats-grid-compact .main-val { font-family: monospace; font-size: 12px; font-weight: 900; color: var(--p); letter-spacing: -0.3px; line-height: 1; }
  .stats-grid-compact .sub-val { font-family: monospace; font-size: 8px; font-weight: 700; color: #71717a; letter-spacing: -0.3px; line-height: 1; }

  /* テロップ配置: 話者側に寄せる(非話者アイコンと被らないように) */
  /* Shorts右サイドのYouTube UI (いいね・コメント・共有) を避けるため右padding大きめ
     左: ロゴエリア 14px + 余白 / 右: 12% (セーフゾーン想定) */
  .telop-wrap-normal { position: absolute; bottom: 20%; left: 0; right: 0; display: flex; flex-direction: column; z-index: 30; pointer-events: none; padding: 0 14px; align-items: center; }
  .telop-wrap-hl { position: absolute; bottom: 20%; left: 0; right: 0; display: flex; flex-direction: column; z-index: 30; pointer-events: none; padding: 0 14px; align-items: center; }

  /* デフォルト配置=中央 */
  .telop-wrap-normal, .telop-wrap-hl { align-items: center; }
  /* ★v5.15.2★ speaker-a (数原) が喋る場合: より左寄り、右側にセーフゾーン確保
     旧: padding-left:70px / padding-right:14px (右セーフゾーン狭い)
     新: padding-left:62px / padding-right:36px (右側により余裕、Pixelの右端通知やジェスチャー領域回避)
     max-width も 270px → 240px に絞って画面右端への侵食を防止 */
  .telop-wrap-normal:has(.telop-bg[data-speaker="a"]),
  .telop-wrap-hl:has(.telop-bg[data-speaker="a"]) { align-items: flex-start; padding-left: 62px; padding-right: 36px; }
  /* speaker-b (もえか): 対称に左に余裕 */
  .telop-wrap-normal:has(.telop-bg[data-speaker="b"]),
  .telop-wrap-hl:has(.telop-bg[data-speaker="b"]) { align-items: flex-end; padding-left: 36px; padding-right: 62px; }

  .telop-bg { background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); border-radius: 14px; padding: 9px 16px; max-width: 240px; border: 2px solid rgba(255,255,255,0.15); position: relative; box-shadow: 0 4px 16px rgba(0,0,0,0.6); }

  /* speaker-a: オレンジ枠 */
  .telop-bg[data-speaker="a"] { border-color: rgba(249,115,22,0.85); box-shadow: 0 4px 16px rgba(249,115,22,0.35), 0 0 24px rgba(249,115,22,0.15); }
  /* speaker-b: 水色枠 */
  .telop-bg[data-speaker="b"] { border-color: rgba(251,113,133,0.85); box-shadow: 0 4px 16px rgba(251,113,133,0.35), 0 0 24px rgba(251,113,133,0.15); }

  /* 吹き出し尻尾: 話者アバター方向に出す */
  .telop-bg::before, .telop-bg::after { content: ''; position: absolute; width: 0; height: 0; border-style: solid; display: none; }

  /* speaker-a: 左下尻尾(アナリストアバターに向かう) */
  .telop-bg[data-speaker="a"]::before {
    display: block;
    left: 22px; bottom: -14px;
    border-width: 14px 12px 0 0;
    border-color: rgba(249,115,22,0.85) transparent transparent transparent;
  }
  .telop-bg[data-speaker="a"]::after {
    display: block;
    left: 24px; bottom: -11px;
    border-width: 11px 9px 0 0;
    border-color: rgba(0,0,0,0.55) transparent transparent transparent;
  }

  /* speaker-b: 右下尻尾(ファンアバターに向かう、右端から少し離す) */
  .telop-bg[data-speaker="b"]::before {
    display: block;
    right: 30px; bottom: -14px;
    border-width: 14px 0 0 12px;
    border-color: rgba(251,113,133,0.85) transparent transparent transparent;
  }
  .telop-bg[data-speaker="b"]::after {
    display: block;
    right: 32px; bottom: -11px;
    border-width: 11px 0 0 9px;
    border-color: rgba(0,0,0,0.55) transparent transparent transparent;
  }

  .telop-normal { font-weight: 900; text-align: center; line-height: 1.2; letter-spacing: -0.5px; color: #fff; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 6px 14px rgba(0,0,0,1); animation: textFadeIn 0.18s ease-out; }
  @keyframes textFadeIn { 0% { opacity: 0.3; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
  .telop-normal.b { color: #fde047; }
  .telop-normal.size-xl { font-size: 30px; }
  .telop-normal.size-l { font-size: 25px; }
  .telop-normal.size-m { font-size: 21px; }
  .telop-normal.size-s { font-size: 18px; }
  .telop-normal .em-y { color: #FFD700; font-size: 1.25em; letter-spacing: -1.5px; font-weight: 900; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 15px rgba(255,215,0,0.5); }
  .telop-normal .em-o { color: #FF8C00; font-size: 1.15em; }
  .telop-normal .em-r { color: #FF4500; font-size: 1.15em; }
  .telop-normal .em-n { color: #FFD700; font-family: monospace; font-size: 1.2em; letter-spacing: -0.5px; }

  /* テロップを音声開始と同期して即表示(0.3s) */
  .phase.active .telop-wrap-normal .telop-bg { animation: telopSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.3s backwards; }
  .phase.active .telop-wrap-hl .telop-bg { animation: telopSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.3s backwards; }

  /* ================================================================ */
  /* フェーズC — 情報量削減+数値上部配置 */
  /* ================================================================ */
  .phase-c-header { position: absolute; top: 14px; left: 0; right: 0; z-index: 25; display: flex; justify-content: center; align-items: center; gap: 6px; pointer-events: none; }
  .phase-c-header .num { width: 24px; height: 24px; background: var(--p); color: #fff; font-weight: 900; font-size: 13px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px var(--p-glow); }
  .phase-c-header .name { color: var(--p); font-size: 17px; font-weight: 900; letter-spacing: -0.3px; line-height: 1; text-shadow: 0 0 8px var(--p-glow); }

  .hl-radar-outer { position: absolute; top: 60px; left: 0; right: 0; height: 100px; display: flex; justify-content: center; align-items: center; z-index: 10; padding: 0 40px; }
  .hl-radar-svg-box { width: 110px; height: 90px; position: relative; transform-origin: center; opacity: 0.45; }
  .phase.active .hl-radar-svg-box { animation: radarShrink 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .hl-radar-svg-box svg { width: 100%; height: 100%; display: block; }

  .vertex-glow { transform-origin: center; }
  .phase.active .vertex-glow { animation: vertexZoomLight 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s backwards; }

  /* ハイライトカード: 両サイド均等マージンで中央バランス、右のショートUI回避 */
  .highlight-card { position: absolute; top: 175px; left: 28px; right: 32px; background: linear-gradient(180deg, rgba(24,24,27,0.97), rgba(39,39,42,0.92)); border-radius: 16px; border: 2px solid rgba(249,115,22,0.5); padding: 14px 14px 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 24px rgba(249,115,22,0.2); z-index: 20; transform-origin: top; }
  .phase.active .highlight-card { animation: cardExpand 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s backwards, cardPulse 2.5s ease-in-out 1s infinite; }
  .highlight-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--p); box-shadow: 0 0 10px var(--p-glow); border-radius: 4px 0 0 4px; }

  /* 上部: バッジ・kana・IsoD を1行に圧縮 */
  .hl-header-compact { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; min-width: 0; }
  .hl-radar-badge { font-size: 11px; font-weight: 900; color: #fff; background: var(--p); padding: 4px 10px; border-radius: 14px; flex-shrink: 0; white-space: nowrap; }
  .hl-label-group { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; min-width: 0; }
  .hl-label-compact { font-size: 26px; font-weight: 900; color: #fff; letter-spacing: 1px; line-height: 1; flex-shrink: 0; }
  .hl-kana-compact { font-size: 12px; font-weight: 700; color: var(--p); letter-spacing: 0.5px; line-height: 1; }

  /* コンパクト計算式 */
  .hl-formula-compact { display: flex; align-items: center; justify-content: center; gap: 7px; margin-bottom: 6px; padding: 4px 10px; background: rgba(0,0,0,0.35); border: 1px solid rgba(63,63,70,0.6); border-radius: 7px; }
  .hl-formula-compact .eq-label { font-size: 10px; color: #a1a1aa; font-weight: 900; letter-spacing: 1.5px; border-right: 1px solid rgba(63,63,70,0.8); padding-right: 7px; }
  .hl-formula-compact .eq-text { font-size: 13px; color: #fff; font-weight: 900; letter-spacing: 0.3px; }
  .hl-formula-compact .eq-text .op { color: var(--p); margin: 0 3px; }

  /* 数値を大きく・目立つ中央配置 (ハイライト最重要) */
  .hl-values { display: flex; justify-content: center; align-items: baseline; gap: 14px; margin-bottom: 7px; padding: 7px 0; border-top: 1px solid rgba(63,63,70,0.5); border-bottom: 1px solid rgba(63,63,70,0.5); }
  .hl-val-main, .hl-val-sub { display: flex; flex-direction: column; align-items: center; }
  .hl-val-main .num { font-family: monospace; font-size: 38px; font-weight: 900; letter-spacing: -2px; line-height: 1; }
  .hl-val-sub .num { font-family: monospace; font-size: 26px; font-weight: 900; letter-spacing: -1px; line-height: 1; }
  .hl-val-main .tag { font-size: 11px; font-weight: 700; margin-top: 4px; }
  .hl-val-sub .tag { font-size: 11px; font-weight: 700; margin-top: 4px; }

  .hl-val-main.loser .num { color: #fca5a5; text-shadow: 0 0 12px rgba(248,113,113,0.4); }
  .hl-val-main.loser .tag { color: #fca5a5; }
  .hl-val-main.winner .num { color: var(--p); text-shadow: 0 0 20px var(--p-glow); }
  .hl-val-main.winner .tag { color: var(--p); }
  .hl-val-sub.winner .num { color: var(--p); text-shadow: 0 0 15px var(--p-glow); }
  .hl-val-sub.winner .tag { color: var(--p); }
  .hl-val-sub.loser .num { color: #fca5a5; text-shadow: 0 0 8px rgba(248,113,113,0.3); opacity: 0.85; }
  .hl-val-sub.loser .tag { color: #fca5a5; opacity: 0.85; }
  .hl-vs { font-size: 14px; font-weight: 900; color: #52525b; font-style: italic; }

  /* 下部: 「なぜ見るか」を簡潔に */
  .hl-context-row { display: flex; gap: 7px; }
  .hl-why-compact { flex: 1; background: rgba(249,115,22,0.08); border-left: 3px solid var(--p); border-radius: 5px; padding: 7px 10px; }
  .hl-why-compact .label { font-size: 10px; font-weight: 900; color: var(--p); letter-spacing: 1.5px; margin-bottom: 3px; }
  .hl-why-compact .text { font-size: 12px; font-weight: 700; color: #d4d4d8; line-height: 1.35; }
  .hl-why-compact .text strong { color: #FFD700; }

  .hl-criteria-side { background: rgba(0,0,0,0.35); border-radius: 5px; padding: 6px 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-width: 64px; }
  .hl-criteria-side .label { font-size: 10px; color: #a1a1aa; font-weight: 700; letter-spacing: 1px; }
  .hl-criteria-side .value { font-size: 14px; color: #10b981; font-weight: 900; font-family: monospace; }

  @keyframes avatarTalk {
    0%, 100% { transform: scale(1.1); }
    50% { transform: scale(1.22); }
  }

  /* ============================================================
     キャラ感情アニメ: script.animation / emoji から自動選択
     大きな動き・発光・弾み・振動で視聴維持率に貢献
     ============================================================ */

  /* 衝撃: 一瞬巨大化→振動→収束、同時に赤/オレンジ発光 */
  @keyframes avatarShock {
    0%   { transform: scale(1.1) translateY(0) rotate(0deg); filter: brightness(1); }
    8%   { transform: scale(1.55) translateY(-14px) rotate(-3deg); filter: brightness(1.4) drop-shadow(0 0 20px rgba(239,68,68,0.9)); }
    16%  { transform: scale(1.45) translateY(-10px) rotate(4deg); filter: brightness(1.3) drop-shadow(0 0 18px rgba(249,115,22,0.9)); }
    26%  { transform: scale(1.4)  translateY(-8px) rotate(-2deg); filter: brightness(1.2) drop-shadow(0 0 14px rgba(249,115,22,0.7)); }
    40%  { transform: scale(1.25) translateY(-4px) rotate(2deg);  filter: brightness(1.1); }
    70%  { transform: scale(1.12) translateY(-1px) rotate(0deg);  filter: brightness(1); }
    100% { transform: scale(1.1)  translateY(0) rotate(0deg);     filter: brightness(1); }
  }

  /* 頷き: 大きく深く、リズミカル、少し前傾 */
  @keyframes avatarNod {
    0%, 100% { transform: scale(1.1) rotate(0deg) translateY(0); }
    20% { transform: scale(1.15) rotate(-2deg) translateY(-6px); }
    40% { transform: scale(1.18) rotate(8deg)  translateY(5px);  }
    60% { transform: scale(1.15) rotate(-3deg) translateY(-5px); }
    80% { transform: scale(1.18) rotate(7deg)  translateY(4px);  }
  }

  /* 否定・困惑: 激しく左右振動、ブレるような印象 */
  @keyframes avatarShake {
    0%, 100% { transform: scale(1.1) translateX(0)    rotate(0deg); }
    10% { transform: scale(1.15) translateX(-10px) rotate(-6deg); }
    25% { transform: scale(1.15) translateX(10px)  rotate(6deg); }
    40% { transform: scale(1.18) translateX(-12px) rotate(-8deg); }
    55% { transform: scale(1.15) translateX(12px)  rotate(8deg); }
    70% { transform: scale(1.13) translateX(-6px)  rotate(-3deg); }
    85% { transform: scale(1.12) translateX(3px)   rotate(1deg); }
  }

  /* 弾み: 高くジャンプ、着地で弾む、色も明るく */
  @keyframes avatarBounce {
    0%   { transform: scale(1.1)  translateY(0)    rotate(0deg); filter: brightness(1); }
    20%  { transform: scale(1.25) translateY(-24px) rotate(-5deg); filter: brightness(1.25) drop-shadow(0 0 14px rgba(255,215,0,0.85)); }
    35%  { transform: scale(1.3)  translateY(-28px) rotate(5deg); filter: brightness(1.3) drop-shadow(0 0 16px rgba(255,215,0,0.9)); }
    50%  { transform: scale(1.15) translateY(-10px) rotate(-3deg); filter: brightness(1.2); }
    65%  { transform: scale(1.25) translateY(4px)   rotate(2deg);  filter: brightness(1.15); } /* 着地squash */
    78%  { transform: scale(1.18) translateY(-6px)  rotate(-1deg); filter: brightness(1.1); }
    90%  { transform: scale(1.12) translateY(-2px)  rotate(0deg);  filter: brightness(1.05); }
    100% { transform: scale(1.1)  translateY(0)    rotate(0deg); filter: brightness(1); }
  }

  /* 考え込み: ゆっくり左右揺れ + かすかな上下、腕組みしてる感 */
  @keyframes avatarThink {
    0%, 100% { transform: scale(1.1) rotate(0deg) translateY(0); }
    25% { transform: scale(1.1) rotate(-8deg) translateY(-2px); }
    50% { transform: scale(1.1) rotate(0deg)  translateY(-4px); }
    75% { transform: scale(1.1) rotate(8deg)  translateY(-2px); }
  }

  /* 円形背景の光オーラ (shock/bounce時に重ねる) */
  @keyframes circleGlowShock {
    0%   { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 0 rgba(239,68,68,0); }
    15%  { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 30px 12px rgba(239,68,68,0.6); }
    40%  { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 40px 20px rgba(249,115,22,0.4); }
    100% { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 0 rgba(239,68,68,0); }
  }
  @keyframes circleGlowBounce {
    0%   { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 0 rgba(255,215,0,0); }
    30%  { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 30px 12px rgba(255,215,0,0.7); }
    60%  { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 40px 18px rgba(250,204,21,0.5); }
    100% { box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 0 rgba(255,215,0,0); }
  }

  /* emoji を円内で独立に動かす (より派手さup) */
  @keyframes emojiWiggle {
    0%, 100% { transform: scale(1) rotate(0deg); }
    20% { transform: scale(1.3) rotate(-10deg); }
    50% { transform: scale(1.4) rotate(15deg); }
    80% { transform: scale(1.2) rotate(-5deg); }
  }
  @keyframes emojiPop {
    0%   { transform: scale(0.7); opacity: 0.5; }
    30%  { transform: scale(1.5); opacity: 1; }
    60%  { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* data-anim 属性でアニメ切替: アバター本体 + circle + emoji の3層同時発火 */
  .avatar-hl.active[data-anim="shock"] { animation: avatarShock 0.9s cubic-bezier(0.34,1.56,0.64,1) !important; }
  .avatar-hl.active[data-anim="shock"] .circle { animation: circleGlowShock 0.9s ease-out !important; }
  .avatar-hl.active[data-anim="shock"] .emoji { animation: emojiPop 0.9s cubic-bezier(0.34,1.56,0.64,1) !important; }

  .avatar-hl.active[data-anim="nod"] { animation: avatarNod 1.1s ease-in-out infinite !important; }

  .avatar-hl.active[data-anim="shake"] { animation: avatarShake 0.6s ease-in-out 2 !important; }
  .avatar-hl.active[data-anim="shake"] .emoji { animation: emojiWiggle 0.6s ease-in-out 2 !important; }

  .avatar-hl.active[data-anim="bounce"] { animation: avatarBounce 1s cubic-bezier(0.34,1.56,0.64,1) !important; }
  .avatar-hl.active[data-anim="bounce"] .circle { animation: circleGlowBounce 1s ease-out !important; }
  .avatar-hl.active[data-anim="bounce"] .emoji { animation: emojiWiggle 1s ease-in-out !important; }

  .avatar-hl.active[data-anim="think"] { animation: avatarThink 2s ease-in-out infinite !important; }

  .avatar-hl { position: absolute; bottom: 13%; display: flex; flex-direction: column; align-items: center; z-index: 35; transition: all 0.3s; }
  .avatar-hl.a { left: 14px; }
  /* Shorts右サイドUI (いいね等) 避けて 72px確保 */
  .avatar-hl.b { right: 72px; }
  .avatar-hl.active { transform: scale(1.1); animation: avatarTalk 0.6s ease-in-out infinite; }
  .avatar-hl.passive { transform: scale(0.88); opacity: 0.4; }
  .avatar-hl .circle { width: 46px; height: 46px; border-radius: 50%; background: #18181b; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 2px solid #52525b; position: relative; }
  .avatar-hl.a.active .circle { border-color: var(--p); box-shadow: 0 0 16px var(--p-glow); }
  .avatar-hl.b.active .circle { border-color: var(--rose); box-shadow: 0 0 16px rgba(251,113,133,0.6); }
  .avatar-hl .emoji { font-size: 22px; line-height: 1; }

  /* ★アバター名ラベル (v5.11.5 新規) — 数原 / もえか をアイコン下に表示★ */
  .avatar-hl .avatar-name {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1px;
    white-space: nowrap;
    background: rgba(24,24,27,0.85);
    padding: 2px 7px;
    border-radius: 8px;
    backdrop-filter: blur(6px);
    transition: all 0.3s;
  }
  .avatar-hl.a .avatar-name { color: var(--p); border: 1px solid rgba(249,115,22,0.4); }
  .avatar-hl.b .avatar-name { color: var(--rose); border: 1px solid rgba(251,113,133,0.4); }
  .avatar-hl.a.active .avatar-name { color: var(--p); border-color: var(--p); box-shadow: 0 0 8px var(--p-glow); }
  .avatar-hl.b.active .avatar-name { color: var(--rose); border-color: var(--rose); box-shadow: 0 0 8px rgba(251,113,133,0.5); }
  .avatar-hl.passive .avatar-name { opacity: 0.5; }

  /* ================================================================ */
  /* フェーズD — テロップ上部(アバター右)、summary縮小、CTA強調 */
  /* ================================================================ */
  .phase-d { background: linear-gradient(180deg, #0d0d0f 0%, #1a1a1e 100%); }

  .outro-date { position: absolute; top: 14px; right: 14px; color: var(--p); opacity: 0.8; font-size: 9px; font-weight: 700; z-index: 25; display: flex; align-items: center; gap: 4px; }
  .outro-date .ping { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--p); animation: pulse 2s infinite; }

  .outro-avatars { position: absolute; top: 40px; left: 14px; display: flex; gap: 8px; z-index: 35; }
  .outro-avatar { display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all 0.3s; }
  .outro-avatar .circle { width: 42px; height: 42px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; border: 2px solid #52525b; position: relative; transition: all 0.3s; }
  .outro-avatar.active .circle { transform: scale(1.1); }
  .outro-avatar.passive { opacity: 0.5; transform: scale(0.9); }
  .outro-avatar.a.active .circle { border-color: var(--p); box-shadow: 0 0 14px var(--p-glow); }
  .outro-avatar.b.active .circle { border-color: var(--rose); box-shadow: 0 0 14px rgba(251,113,133,0.6); }
  .outro-avatar .emoji { font-size: 22px; line-height: 1; }
  /* ★アウトロアバター名ラベル (v5.11.5 新規)★ */
  .outro-avatar-name { font-size: 9px; font-weight: 900; letter-spacing: 0.5px; line-height: 1; padding: 2px 5px; border-radius: 4px; background: rgba(24,24,27,0.7); }
  .outro-avatar.a .outro-avatar-name { color: var(--p); }
  .outro-avatar.b .outro-avatar-name { color: var(--rose); }

  /* アウトロのテロップ: ABアバターの右横に横長で配置 */
  .telop-wrap-outro { position: absolute; top: 46px; left: 118px; right: 50px; display: flex; align-items: center; z-index: 36; pointer-events: none; min-height: 42px; }
  .telop-wrap-outro .telop-bg { background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border-radius: 12px; padding: 7px 12px; border: 2px solid rgba(255,255,255,0.15); position: relative; width: 100%; max-width: none; box-shadow: 0 4px 12px rgba(0,0,0,0.6); }
  .telop-wrap-outro .telop-bg[data-speaker="a"] { border-color: rgba(249,115,22,0.85); box-shadow: 0 4px 12px rgba(249,115,22,0.35); }
  .telop-wrap-outro .telop-bg[data-speaker="b"] { border-color: rgba(251,113,133,0.85); box-shadow: 0 4px 12px rgba(251,113,133,0.35); }
  /* 尻尾をアバター方向(左)に向ける */
  .telop-wrap-outro .telop-bg::before { content: ''; position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-style: solid; border-width: 10px 12px 10px 0; border-color: transparent; display: block; }
  .telop-wrap-outro .telop-bg[data-speaker="a"]::before { border-right-color: rgba(249,115,22,0.85); }
  .telop-wrap-outro .telop-bg[data-speaker="b"]::before { border-right-color: rgba(251,113,133,0.85); }
  .telop-wrap-outro .telop-bg::after { content: ''; position: absolute; left: -6px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-style: solid; border-width: 7px 9px 7px 0; border-color: transparent rgba(0,0,0,0.6) transparent transparent; display: block; }
  /* アウトロtelopは横長なのでサイズを少し控えめに */
  .telop-wrap-outro .telop-normal { font-size: 16px !important; line-height: 1.2; text-align: left; }
  .telop-wrap-outro .telop-normal.size-xl { font-size: 18px !important; }
  .telop-wrap-outro .telop-normal.size-l { font-size: 16px !important; }
  .telop-wrap-outro .telop-normal.size-m { font-size: 14px !important; }
  .telop-wrap-outro .telop-normal.size-s { font-size: 13px !important; }

  /* アウトロスタック: テロップがトップに移動したので底面にフィット */
  .outro-stack { position: absolute; top: 100px; bottom: 14%; left: 10px; right: 44px; display: flex; flex-direction: column; gap: 7px; z-index: 20; }

  /* === Outro v2 (v5.11.2 改修) === */
  /* まとめパネル (文字を大きく) */
  .outro-summary { flex: 1.5; background: linear-gradient(180deg, rgba(24,24,27,0.95), rgba(39,39,42,0.85)); border-radius: 14px; border: 1px solid rgba(249,115,22,0.35); padding: 12px 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: center; }
  .outro-summary-label { font-size: 10px; color: var(--p); font-weight: 900; letter-spacing: 2px; text-align: center; margin-bottom: 7px; }
  .outro-summary-title { text-align: center; font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 10px; line-height: 1.25; letter-spacing: -0.6px; }
  .outro-summary-title .accent { color: var(--p); }
  .outro-points { display: flex; flex-direction: column; gap: 6px; }
  .outro-point { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #d4d4d8; font-weight: 700; line-height: 1.35; opacity: 0; transform: translateX(-12px); }
  .outro-point .check { color: var(--p); font-weight: 900; font-size: 16px; flex-shrink: 0; display: inline-block; opacity: 0; transform: scale(0) rotate(-45deg); line-height: 1.35; }
  .outro-point strong { color: #fff; font-weight: 900; font-size: 15px; }

  .phase-d.active .outro-point { animation: pointSlideIn 0.4s ease-out forwards; }
  .phase-d.active .outro-point:nth-child(1) { animation-delay: 0.3s; }
  .phase-d.active .outro-point:nth-child(2) { animation-delay: 0.6s; }
  .phase-d.active .outro-point:nth-child(3) { animation-delay: 0.9s; }
  .phase-d.active .outro-point .check { animation: checkPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .phase-d.active .outro-point:nth-child(1) .check { animation-delay: 0.45s; }
  .phase-d.active .outro-point:nth-child(2) .check { animation-delay: 0.75s; }
  .phase-d.active .outro-point:nth-child(3) .check { animation-delay: 1.05s; }

  /* いいね/登録 アクションボタン (★v5.11.2 で復活、目立たせ★) */
  .outro-actions { flex: 1; display: flex; gap: 10px; }
  .outro-action { flex: 1; background: rgba(24,24,27,0.92); border: 2px solid; border-radius: 14px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); justify-content: center; position: relative; overflow: hidden; }
  .outro-action .icon { font-size: 32px; line-height: 1; }
  .outro-action .lbl { font-size: 13px; font-weight: 900; letter-spacing: 0.3px; line-height: 1.2; text-align: center; }

  /* いいねボタン: 赤系 + 鼓動アニメ */
  .outro-action.like { border-color: var(--like); background: linear-gradient(180deg, rgba(239,68,68,0.18), rgba(24,24,27,0.92)); }
  .outro-action.like .icon { color: var(--like); filter: drop-shadow(0 0 10px rgba(239,68,68,0.7)); animation: pulse-like 1.2s ease-in-out infinite; }
  .outro-action.like .lbl { color: #fff; }
  @keyframes pulse-like { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }

  /* 登録ボタン: 赤系 + 光る帯 */
  .outro-action.sub { border-color: var(--like); background: linear-gradient(180deg, rgba(239,68,68,0.25), rgba(24,24,27,0.92)); }
  .outro-action.sub .icon { color: var(--like); filter: drop-shadow(0 0 10px rgba(239,68,68,0.7)); animation: pulse-like 1.2s ease-in-out 0.6s infinite; }
  .outro-action.sub .lbl { color: #fff; }
  .outro-action.sub::before { content: ''; position: absolute; top: 0; left: -50%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); z-index: 2; pointer-events: none; }
  .phase-d.active .outro-action.sub::before { animation: shineSweep 2.5s ease-in-out 1.5s infinite; }

  /* (旧 outro-cta は v2 で廃止) */

  /* 出典: NPB+・スポーツナビに戻す */
  .source { position: absolute; bottom: 10px; right: 10px; color: #71717a; font-size: 8px; font-weight: 700; letter-spacing: 1px; z-index: 40; }
  .progress { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(24,24,27,0.8); z-index: 30; }
  .progress-fill { height: 100%; background: var(--p); box-shadow: 0 0 10px var(--p-glow); transition: width 0.3s; }

  .phase-indicator { display: flex; gap: 4px; margin-top: 4px; }
  .phase-dot { width: 8px; height: 8px; border-radius: 50%; background: #e4e4e7; transition: all 0.3s; }
  .phase-dot.active { background: var(--indigo); box-shadow: 0 0 8px rgba(79,70,229,0.5); transform: scale(1.3); }

  .info-text { font-size: 11px; color: #71717a; text-align: center; margin-top: 8px; }

  /* ============ React向け追加ルール ============ */

  /* フルスクリーン時: ビューポート内で最大表示 */
  .phone.fullscreen {
    width: min(calc(95vh * 9 / 16), 95vw) !important;
    max-width: none !important;
    height: 95vh !important;
    max-height: 95vh !important;
  }
  .phone.fullscreen.square {
    aspect-ratio: 9/16;
  }

  /* プレビュー時のベース font-family (Tailwindに上書きされないように) */
  .phone, .phone * {
    font-family: -apple-system, "Segoe UI", "Noto Sans JP", sans-serif;
  }

  /* Tailwind 明示的リセット: phone 内は box-sizing: border-box に統一 */
  .phone *, .phone *::before, .phone *::after {
    box-sizing: border-box;
  }

  /* デフォルトで phase が 0 opacity などになってたら表示 */
  .phone .phase.active {
    display: block;
  }

  /* PreviewFrame 外側コンテナ(App.jsxから) */
  .preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
`;

export const GlobalStyles = () => <style>{CSS_TEXT}</style>;
