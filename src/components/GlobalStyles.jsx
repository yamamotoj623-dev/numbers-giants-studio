import React from 'react';

/**
 * v5.0.0 UI確定版 グローバルスタイル
 * - 13種類の視線誘導アニメーション
 * - 話者吹き出し (A=オレンジ / B=水色)
 * - フック出現2モード (pop / shake)
 * - レーダー描画シーケンス
 * - カウントアップ、CTAジグル、チャンネル登録光スイープ
 */

export const GlobalStyles = () => (
  <style>{`
    /* ==================== 基本アニメ ==================== */
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes valueBounce { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0px); } }
    @keyframes flash { 0% { background-color: rgba(255,255,255,0.1); } 100% { background-color: transparent; } }
    @keyframes bgScroll { 0% { background-position: 0px 0px; } 100% { background-position: 0px 150px; } }

    /* ==================== フック出現: ポップ ==================== */
    @keyframes hookLineIn {
      0% { opacity: 0; transform: translateY(20px) scale(0.85); filter: blur(4px); }
      60% { opacity: 1; transform: translateY(-3px) scale(1.05); filter: blur(0); }
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    .hook-telop-pop > span { display: block; opacity: 0; animation: hookLineIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .hook-telop-pop > span:nth-of-type(1) { animation-delay: 0.3s; }
    .hook-telop-pop > span:nth-of-type(2) { animation-delay: 0.8s; }
    .hook-telop-pop > span:nth-of-type(3) { animation-delay: 1.3s; }

    /* ==================== フック出現: シェイク ==================== */
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
      40% { transform: translate(4px, -2px) rotate(1deg); }
      50% { transform: translate(-3px, 1px) rotate(-0.8deg); }
      60% { transform: translate(2px, -1px) rotate(0.5deg); }
      70% { transform: translate(-2px, 0) rotate(-0.3deg); }
      80% { transform: translate(1px, 0) rotate(0); }
      100% { opacity: 1; transform: translate(0,0) rotate(0); }
    }
    .hook-telop-shake > span { display: block; opacity: 0; animation: hookShake 1.5s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
    .hook-telop-shake > span:nth-of-type(1) { animation-delay: 0.3s; }
    .hook-telop-shake > span:nth-of-type(2) { animation-delay: 0.7s; }
    .hook-telop-shake > span:nth-of-type(3) { animation-delay: 1.1s; }

    /* ==================== シルエット呼吸 ==================== */
    @keyframes silhouetteBreath {
      0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.18; }
      50% { transform: translateX(-50%) scale(1.03); opacity: 0.24; }
    }
    .hook-silhouette-breath { animation: silhouetteBreath 4s ease-in-out infinite; }

    /* ==================== 背番号脈動 ==================== */
    @keyframes numberPulse {
      0%, 100% { box-shadow: 0 0 15px rgba(249,115,22,0.6); }
      50% { box-shadow: 0 0 25px rgba(249,115,22,1), 0 0 40px rgba(249,115,22,0.6); }
    }
    .hook-pill-number { animation: numberPulse 1.5s ease-in-out infinite; }

    /* ==================== スタッツワイプイン ==================== */
    @keyframes statsWipe {
      0% { clip-path: inset(0 100% 0 0); opacity: 0; }
      20% { opacity: 1; }
      100% { clip-path: inset(0 0 0 0); opacity: 1; }
    }
    .hook-stats-wipe { animation: statsWipe 0.9s ease-out 0.9s backwards; }

    /* ==================== レーダー描画 ==================== */
    @keyframes radarStrokeDraw {
      0% { stroke-dasharray: 400; stroke-dashoffset: 400; fill-opacity: 0; }
      70% { stroke-dasharray: 400; stroke-dashoffset: 0; fill-opacity: 0; }
      100% { stroke-dasharray: 400; stroke-dashoffset: 0; fill-opacity: 1; }
    }
    .radar-main-poly { animation: radarStrokeDraw 0.8s cubic-bezier(0.65,0,0.35,1) forwards; }
    .radar-sub-poly { animation: radarStrokeDraw 0.8s cubic-bezier(0.65,0,0.35,1) 0.2s backwards; }

    @keyframes radarDotPop {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .radar-dot { animation: radarDotPop 0.35s cubic-bezier(0.34,1.56,0.64,1) backwards; transform-origin: center; transform-box: fill-box; }
    .radar-dot:nth-of-type(1) { animation-delay: 0.7s; }
    .radar-dot:nth-of-type(2) { animation-delay: 0.78s; }
    .radar-dot:nth-of-type(3) { animation-delay: 0.86s; }
    .radar-dot:nth-of-type(4) { animation-delay: 0.94s; }
    .radar-dot:nth-of-type(5) { animation-delay: 1.02s; }

    @keyframes radarLabelIn {
      0% { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .radar-label-group { animation: radarLabelIn 0.35s ease-out backwards; }
    .radar-label-group:nth-of-type(1) { animation-delay: 1.1s; }
    .radar-label-group:nth-of-type(2) { animation-delay: 1.18s; }
    .radar-label-group:nth-of-type(3) { animation-delay: 1.26s; }
    .radar-label-group:nth-of-type(4) { animation-delay: 1.34s; }
    .radar-label-group:nth-of-type(5) { animation-delay: 1.42s; }

    /* ==================== テロップスライドイン ==================== */
    @keyframes telopSlideUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .bubble-wrapper { animation: telopSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.3s backwards; }

    /* ==================== 吹き出し尻尾 ==================== */
    .bubble-speaker-a .bubble-bg::before,
    .bubble-speaker-a .bubble-bg::after,
    .bubble-speaker-b .bubble-bg::before,
    .bubble-speaker-b .bubble-bg::after {
      content: ''; position: absolute; width: 0; height: 0; border-style: solid;
    }
    .bubble-speaker-a .bubble-bg::before {
      left: 22px; bottom: -14px;
      border-width: 14px 12px 0 0;
      border-color: rgba(249,115,22,0.85) transparent transparent transparent;
    }
    .bubble-speaker-a .bubble-bg::after {
      left: 24px; bottom: -11px;
      border-width: 11px 9px 0 0;
      border-color: rgba(0,0,0,0.55) transparent transparent transparent;
    }
    .bubble-speaker-b .bubble-bg::before {
      right: 30px; bottom: -14px;
      border-width: 14px 0 0 12px;
      border-color: rgba(14,165,233,0.85) transparent transparent transparent;
    }
    .bubble-speaker-b .bubble-bg::after {
      right: 32px; bottom: -11px;
      border-width: 11px 0 0 9px;
      border-color: rgba(0,0,0,0.55) transparent transparent transparent;
    }

    /* ==================== アバター話し中パルス ==================== */
    @keyframes avatarTalk {
      0%, 100% { transform: scale(1.1); }
      50% { transform: scale(1.18); }
    }
    .avatar-talking { animation: avatarTalk 0.6s ease-in-out infinite; z-index: 40; }

    /* ==================== ハイライトカード展開 ==================== */
    @keyframes cardExpand {
      0% { opacity: 0; transform: translateY(30px) scaleY(0.7); }
      100% { opacity: 1; transform: translateY(0) scaleY(1); }
    }
    @keyframes cardPulse {
      0%, 100% { box-shadow: 0 8px 24px rgba(249,115,22,0.15), inset 0 0 0 1px rgba(249,115,22,0.15); }
      50% { box-shadow: 0 8px 30px rgba(249,115,22,0.35), inset 0 0 0 1px rgba(249,115,22,0.35); }
    }
    .highlight-card {
      animation: cardExpand 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s backwards,
                 cardPulse 2.5s ease-in-out 1s infinite;
      transform-origin: top;
    }

    /* ==================== レーダー縮小(ハイライト移行時) ==================== */
    @keyframes radarShrink {
      0% { transform: scale(1.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .hl-radar-shrink { animation: radarShrink 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; transform-origin: center; }

    /* ==================== 該当頂点ズームイン光 ==================== */
    @keyframes vertexZoomLight {
      0% { transform: scale(3); opacity: 0; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .vertex-glow { animation: vertexZoomLight 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s backwards; transform-origin: center; transform-box: fill-box; }

    /* ==================== アウトロ: チェックマーク順次ポップ ==================== */
    @keyframes checkPopIn {
      0% { opacity: 0; transform: scale(0) rotate(-45deg); }
      60% { opacity: 1; transform: scale(1.4) rotate(12deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    @keyframes pointSlideIn {
      0% { opacity: 0; transform: translateX(-12px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    .outro-point { animation: pointSlideIn 0.4s ease-out forwards; opacity: 0; transform: translateX(-12px); }
    .outro-point:nth-child(1) { animation-delay: 0.3s; }
    .outro-point:nth-child(2) { animation-delay: 0.6s; }
    .outro-point:nth-child(3) { animation-delay: 0.9s; }
    .outro-point .check { animation: checkPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; opacity: 0; display: inline-block; transform: scale(0) rotate(-45deg); }
    .outro-point:nth-child(1) .check { animation-delay: 0.45s; }
    .outro-point:nth-child(2) .check { animation-delay: 0.75s; }
    .outro-point:nth-child(3) .check { animation-delay: 1.05s; }

    /* ==================== CTAジグル ==================== */
    @keyframes ctaJiggle {
      0%, 92%, 100% { transform: translateX(0) rotate(0); }
      94% { transform: translateX(-2px) rotate(-0.5deg); }
      96% { transform: translateX(2px) rotate(0.5deg); }
      98% { transform: translateX(-1px) rotate(0); }
    }
    .outro-cta-jiggle { animation: ctaJiggle 3s ease-in-out 1.3s infinite; }

    /* ==================== いいねパルス ==================== */
    @keyframes pulseLike {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.25); }
    }
    .outro-like-pulse { animation: pulseLike 1s infinite; }

    /* ==================== チャンネル登録光スイープ ==================== */
    @keyframes shineSweep {
      0%, 60% { transform: translateX(-150%) skewX(-25deg); }
      70%, 100% { transform: translateX(250%) skewX(-25deg); }
    }
    .outro-sub-shine::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      width: 50%; z-index: 2; pointer-events: none;
      animation: shineSweep 2.5s ease-in-out 1.5s infinite;
    }

    /* ==================== 既存互換 ==================== */
    @keyframes shake {
      0% { transform: translate(1px, 1px) rotate(0deg); }
      10% { transform: translate(-1px, -2px) rotate(-1deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      30% { transform: translate(3px, 2px) rotate(0deg); }
      40% { transform: translate(1px, -1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      70% { transform: translate(3px, 1px) rotate(-1deg); }
      80% { transform: translate(-1px, -1px) rotate(1deg); }
      90% { transform: translate(1px, 2px) rotate(0deg); }
      100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .animate-shake { animation: shake 0.5s infinite; }
    .animate-float { animation: float 4s ease-in-out infinite; }

    /* ==================== スクロールバー ==================== */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #cbd5e1; border-radius: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
  `}</style>
);
