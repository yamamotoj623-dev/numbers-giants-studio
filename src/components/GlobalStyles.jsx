/**
 * v5.0.0 UI確定版グローバルスタイル
 * デモHTML v15 の CSS をそのまま React に移植
 * (クラス名・アニメーション名・CSS変数すべてデモと1対1で対応)
 */
import React from 'react';

const CSS_TEXT = `
  :root {
    /* ★v5.17.0★ ネオン/サイバーパンク化: より明るく発光感のある値に */
    /* 旧: --p: #f97316 (普通のオレンジ) */
    /* 新: --p: #ff8c1a (より明るく彩度高め)、--p-glow も強化 */
    --p: #ff8c1a;
    --p-glow: rgba(255,140,26,0.85);
    --p-glow-soft: rgba(255,140,26,0.4);
    --p-bright: #ffaa3d;          /* ハイライト用さらに明るい変体 */

    --indigo: #6366f1;             /* やや明るく */
    --sky: #38bdf8;                 /* 同上 */
    --rose: #fb7185;
    --rose-glow: rgba(251,113,133,0.85);
    --rose-bright: #ffa1ad;

    --like: #ef4444;
    /* ★新★ 蛍光イエロー (キーワード強調用) */
    --neon-yellow: #FFE94B;
    --neon-yellow-glow: rgba(255,233,75,0.85);
    /* ★新★ 純白 (主要数値用) */
    --pure-white: #FFFFFF;
    /* ★新★ 球場フレア用 */
    --stadium-flare: rgba(255,200,100,0.06);
  }
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

  .phone { width: 360px; max-width: 92vw; aspect-ratio: 9/16; background: #0a0a0c; border-radius: 32px; border: 6px solid #18181b; box-shadow: 0 15px 40px rgba(0,0,0,0.18); overflow: hidden; position: relative; transition: border-radius 0.3s, border 0.3s; }
  .phone.square { border-radius: 0; border: 1px solid #e4e4e7; }
  /* ★v5.19.7★ 横長 (16:9) 対応 — YouTube 通常動画向け */
  .phone.landscape { width: 640px; max-width: 95vw; aspect-ratio: 16/9; }

  /* ★v5.20★ 横長 (16:9) レイアウト — 完全別構図
     構図:
       ┌─────────────────────────────────┐
       │ ヘッダー (左上: 選手名 / 右上: 日付)│ 上 36px
       │                                 │
       │   主役データ (上半分、主にチャート)│ 中央 56% (高さ ~200px)
       │                                 │
       │ ┌──────[テロップ大]──────┐       │
       │ │A  text                B│ 下 38% (高さ ~135px)
       │ │ avatar               avatar    │
       │ └────────────────────────┘       │
       └─────────────────────────────────┘
  */

  /* ヘッダー */
  .phone.landscape .phase-b-header,
  .phone.landscape .phase-c-header {
    top: 10px; left: 12px; right: auto; justify-content: flex-start;
  }
  .phone.landscape .ph-date { top: 10px; right: 12px; font-size: 11px; }
  /* ★v5.20.2★ ロゴ: top を明示的に auto にして bottom に固定 (top:10px が残ってると右上に浮く) */
  .phone.landscape .brand-logo-fixed {
    top: auto !important;
    bottom: 6px !important;
    left: auto !important;
    right: 8px !important;
    transform: scale(0.8);
    transform-origin: bottom right;
    align-items: flex-end;
  }
  /* ★v5.20.2★ 出典 (source) が右下でロゴと重なる → 横長は左下に移動 */
  .phone.landscape .source {
    right: auto !important;
    left: 10px !important;
    bottom: 6px !important;
  }

  /* ★v5.20.2★ テロップ: 横を広く使う — max-width 460→640、padding を 30px に詰める */
  .phone.landscape .telop-wrap-normal,
  .phone.landscape .telop-wrap-hl {
    bottom: 8%;
    top: auto;
    left: 0; right: 0;
    align-items: center !important;
    padding: 0 30px !important;
    z-index: 25;
  }
  .phone.landscape .telop-wrap-outro {
    bottom: 10%;
    align-items: center !important;
    padding: 0 30px !important;
  }
  /* ★v5.20.4★ テロップ本体: 横長は max 600px、文字も縦長より大きく */
  .phone.landscape .telop-bg {
    max-width: 600px;
    font-size: 1.3em;       /* 1.1 → 1.3 (横長は読ませる時間あるので大きめが映える) */
    padding: 12px 20px;     /* パディングも増やす */
  }
  /* 横長テロップの telop-normal 内文字も連動して大きく */
  .phone.landscape .telop-bg .telop-normal {
    font-size: 1.05em;
    line-height: 1.35;
  }
  /* ★v5.20.3★ speaker 別に左右へ寄せる (中央すぎ問題対策) */
  /* speaker-a (数原・男性): 左寄り */
  .phone.landscape .telop-wrap-normal:has(.telop-bg[data-speaker="a"]),
  .phone.landscape .telop-wrap-hl:has(.telop-bg[data-speaker="a"]) {
    align-items: flex-start !important;
    padding-left: 60px !important;   /* 左アバター A の右側から始める */
    padding-right: 100px !important;
  }
  /* speaker-b (もえか・女性): 右寄り */
  .phone.landscape .telop-wrap-normal:has(.telop-bg[data-speaker="b"]),
  .phone.landscape .telop-wrap-hl:has(.telop-bg[data-speaker="b"]) {
    align-items: flex-end !important;
    padding-left: 100px !important;
    padding-right: 100px !important; /* 右アバター B + ロゴを避ける */
  }

  /* ★v5.20.2★ アバター: テロップの両脇 (左下/右下) に小さく */
  .phone.landscape .avatar-wrapper {
    bottom: 2% !important;
    transform: scale(0.55) !important;
  }
  .phone.landscape .avatar-wrapper.left {
    left: -16px !important; right: auto !important;
    transform-origin: bottom left !important;
  }
  .phone.landscape .avatar-wrapper.right {
    /* ロゴ (右下) と被らないよう右端から少し離す */
    right: 60px !important; left: auto !important;
    transform-origin: bottom right !important;
  }

  /* 上半分 = 主役データ領域 (各レイアウトの inset を上半分に絞る) */
  .phone.landscape .anim-layer .phase {
    /* 上半分のみが主役表示エリア */
  }

  /* ★v5.20.6★ ハイライトカード横長 — もっと縦に侵食、横は中央でコンパクトに
     - bottom 46% → 28% (テロップ直前まで下に伸ばす)
     - width 75% → 60% (横を更に絞ってコンパクト感)
     - z-index は 20 (テロップ 25 より下層) なので衝突時は自動でテロップ優先 */
  .phone.landscape .highlight-card {
    top: 38px;
    bottom: 28%;
    width: 60%;
    max-width: 440px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    padding: 8px 12px;
    border-radius: 12px;
    transform-origin: center top;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 20;
  }
  /* phase.active のアニメと translateX(-50%) を両立 */
  .phone.landscape .phase.active .highlight-card {
    animation: cardExpandLandscape 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s backwards, cardPulse 2.5s ease-in-out 1s infinite !important;
  }
  /* ヘッダー (1行: バッジ + 指標名) */
  .phone.landscape .hl-header-compact { gap: 6px; margin-bottom: 6px; flex-shrink: 0; }
  .phone.landscape .hl-radar-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; }
  .phone.landscape .hl-label-group { flex-direction: row; align-items: baseline; gap: 6px; }
  /* ★v5.20.9★ 指標名を更に大きく */
  .phone.landscape .hl-label-compact { font-size: 28px; line-height: 1; letter-spacing: 0.5px; }
  .phone.landscape .hl-kana-compact { font-size: 11px; }
  /* 計算式 (あれば 1 行) */
  .phone.landscape .hl-formula-compact { padding: 2px 8px; margin-bottom: 5px; flex-shrink: 0; }
  .phone.landscape .hl-formula-compact .eq-label { font-size: 8px; padding-right: 5px; }
  .phone.landscape .hl-formula-compact .eq-text { font-size: 12px; }

  /* ★v5.20.9★ 値比較: card の残り高さを全部使う + 縦中央寄せ */
  .phone.landscape .highlight-card > .hl-values {
    flex: 1;
    align-items: center;
    margin-bottom: 0;
    padding: 6px 0;
  }
  .phone.landscape .hl-values { gap: 14px; }
  /* ★v5.20.9★ 指標値を更に大きく (空きスペースを活用) */
  .phone.landscape .hl-val-main .num { font-size: 50px; letter-spacing: -1px; }
  .phone.landscape .hl-val-sub .num { font-size: 34px; }
  .phone.landscape .hl-val-main .tag,
  .phone.landscape .hl-val-sub .tag { font-size: 11px; margin-top: 3px; }
  .phone.landscape .hl-vs { font-size: 14px; }

  /* ★v5.20.9★ 下部 context: 下に張り付かせる (margin-top: auto) */
  .phone.landscape .hl-context-row {
    gap: 5px;
    flex: none;
    margin-top: auto;       /* ★card の最下部に押し付ける */
    min-height: 0;
    max-height: 36px;
    align-items: stretch;
  }
  .phone.landscape .hl-why-compact { padding: 3px 8px; min-width: 0; overflow: hidden; }
  .phone.landscape .hl-why-compact .label { font-size: 8px; margin-bottom: 1px; }
  .phone.landscape .hl-why-compact .text {
    font-size: 9.5px; line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .phone.landscape .hl-criteria-side {
    padding: 3px 8px;
    min-width: 64px;
    max-width: 90px;
    flex-shrink: 0;
  }
  .phone.landscape .hl-criteria-side .label { font-size: 8px; white-space: nowrap; }
  .phone.landscape .hl-criteria-side .value { font-size: 12px; white-space: nowrap; }

  /* ★v5.20.5★ hook (id:1) — 横長専用配置
     ベースの top: 36% + transform: translate(-50%, -50%) を活かして垂直中央寄せ
     横長は画面が低いのでテロップを縦中央〜上寄り、stats を下半分に */
  .phone.landscape .hook-telop-wrap {
    top: 38%;
    padding: 0 8%;
    /* transform: translate(-50%, -50%) は base から継承 */
  }
  .phone.landscape .hook-stats-big {
    top: auto;
    bottom: 6%;
    left: 6%; right: 6%;
  }
  .phone.landscape .hook-silhouette {
    top: 50%; width: 180px; height: 180px; opacity: 0.1;
    left: 50%; transform: translate(-50%, -50%);
  }
  .phone.landscape .hook-header {
    top: 10px; left: 12px; right: 12px;
  }
  /* hook stats を 1x4 横並びに */
  .phone.landscape .hook-stats-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
  /* 録画モード: 編集用UIを全て非表示 */
  .phone.record-mode .duration-badge { display: none; }
  .phone.record-mode .safe-zone-guide { display: none !important; }

  /* ★v5.17.0★ 球場フレア (Gemini提言③: 背景の抜け感) — 右上から差し込む光
     ★v5.18.4★ より動きを強化: 3層フレア + ゆっくり移動でカクテル光線感 */
  .phone::before {
    content: '';
    position: absolute;
    inset: -10%;  /* スケール時のはみ出し対応 */
    z-index: 1;
    pointer-events: none;
    background:
      radial-gradient(ellipse 60% 40% at 75% 15%, rgba(255,200,100,0.10) 0%, transparent 55%),
      radial-gradient(ellipse 50% 35% at 25% 25%, rgba(99,102,241,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 55% 35% at 50% 90%, rgba(251,113,133,0.05) 0%, transparent 60%);
    animation: stadiumFlareDrift 16s ease-in-out infinite;
  }
  @keyframes stadiumFlareDrift {
    0%   { opacity: 0.6; transform: translate(0, 0) scale(1); }
    25%  { opacity: 0.9; transform: translate(2%, -1%) scale(1.05); }
    50%  { opacity: 1.0; transform: translate(-1%, 2%) scale(1.08); }
    75%  { opacity: 0.85; transform: translate(-2%, -1%) scale(1.04); }
    100% { opacity: 0.6; transform: translate(0, 0) scale(1); }
  }

  /* ★v5.17.0★ 微細なノイズアニメ (Gemini提言③) — 動きを錯覚させる */
  .phone::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0.025;
    background-image:
      repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px),
      repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px);
    animation: noiseShift 0.5s steps(4) infinite;
  }
  @keyframes noiseShift {
    0% { transform: translate(0, 0); }
    25% { transform: translate(-1px, 1px); }
    50% { transform: translate(1px, -1px); }
    75% { transform: translate(-1px, -1px); }
    100% { transform: translate(0, 0); }
  }

  /* ★v5.18.4★ Ken Burns エフェクト: レイアウト全体にじわじわズーム
     12秒周期で 1.0 → 1.04 → 1.0 のゆっくりした動き
     視聴者の脳に「画面が動いている」と錯覚させ、退屈感を削減 */
  @keyframes kenBurns {
    0%   { transform: scale(1.0)  translate(0, 0); }
    25%  { transform: scale(1.025) translate(-0.5%, -0.5%); }
    50%  { transform: scale(1.04) translate(0.5%, 0.3%); }
    75%  { transform: scale(1.025) translate(0.3%, -0.3%); }
    100% { transform: scale(1.0)  translate(0, 0); }
  }
  /* anim-layer に kenBurns を常時適用 (zoomBoost と被らない範囲で) */
  .anim-layer {
    animation: kenBurns 14s ease-in-out infinite;
    transform-origin: center center;
    will-change: transform;
  }
  /* zoomBoost 系のアニメが効く時は kenBurns は一旦消す (重複防止) */
  .anim-layer.anim-zoom-boost,
  .anim-layer.anim-impact-shake,
  .anim-layer.anim-zoom-shake {
    animation-name: zoomBoost;  /* zoomBoost 用クラスで上書き */
  }
  .anim-layer.anim-impact-shake { animation-name: impactShake; animation-duration: 0.4s; }
  .anim-layer.anim-zoom-shake { animation-name: zoomShake; animation-duration: 0.5s; }
  .anim-layer.anim-zoom-boost { animation-name: zoomBoost; animation-duration: 0.6s; }
  /* zoomBoost 終了後に kenBurns へ自然に戻すには、zoomBoost のクラスが外れた時に再度 kenBurns になる
     現状は wrapper key 変更で remount → 自動で kenBurns 再開 */

  /* 録画モードではフレア・ノイズも消す (素材として邪魔になり得るが、お好みで - 一旦は付けたまま) */

  .safe-zone-guide { position: absolute; left: 0; right: 0; pointer-events: none; z-index: 100; display: none; }
  .safe-zone-guide.top { top: 0; height: 14%; background: repeating-linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,0,0,0.1) 10px, transparent 10px, transparent 20px); border-bottom: 1px dashed rgba(255,0,0,0.5); }
  .safe-zone-guide.bottom { bottom: 0; height: 14%; background: repeating-linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,0,0,0.1) 10px, transparent 10px, transparent 20px); border-top: 1px dashed rgba(255,0,0,0.5); }
  .safe-zone-guide.right-actions { top: 14%; bottom: 14%; right: 0; left: auto; width: 12%; background: repeating-linear-gradient(135deg, rgba(255,0,0,0.08), rgba(255,0,0,0.08) 8px, transparent 8px, transparent 16px); border-left: 1px dashed rgba(255,0,0,0.5); }

  .ph-date { position: absolute; top: 14px; right: 14px; color: var(--p); opacity: 0.85; font-size: 9px; font-weight: 700; z-index: 25; display: flex; align-items: center; gap: 3px; letter-spacing: 0.5px; }
  .ph-date::before { content: '●'; font-size: 7px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

  /* ★v5.18.0★ Gemini提言: キーフレームアニメ (重要発言時のズーム/シェイク) */
  /* zoomBoost: 一瞬グッと寄る (0.6秒) */
  @keyframes zoomBoost {
    0% { transform: scale(1); }
    20% { transform: scale(1.06); }
    35% { transform: scale(1.04); }
    55% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .anim-zoom-boost { animation: zoomBoost 0.6s ease-out; }

  /* impactShake: 衝撃発言 (0.4秒) */
  @keyframes impactShake {
    0%, 100% { transform: translate(0, 0) rotate(0); }
    10% { transform: translate(-3px, -1px) rotate(-0.4deg); }
    20% { transform: translate(3px, 1px) rotate(0.4deg); }
    30% { transform: translate(-2px, 1px) rotate(-0.3deg); }
    40% { transform: translate(2px, -1px) rotate(0.3deg); }
    50% { transform: translate(-1px, 0) rotate(-0.2deg); }
    60% { transform: translate(1px, 0) rotate(0.2deg); }
    80% { transform: translate(0, 0); }
  }
  .anim-impact-shake { animation: impactShake 0.4s ease-out; }

  /* zoomShake: 衝撃+ズーム (0.5秒、最強) */
  @keyframes zoomShake {
    0% { transform: scale(1) translate(0, 0); }
    15% { transform: scale(1.08) translate(-2px, -1px); }
    30% { transform: scale(1.06) translate(2px, 1px); }
    50% { transform: scale(1.07) translate(-1px, 0); }
    70% { transform: scale(1.05) translate(1px, 0); }
    100% { transform: scale(1) translate(0, 0); }
  }
  .anim-zoom-shake { animation: zoomShake 0.5s ease-out; }

  /* ★v5.18.0★ 冒頭フラッシュ (打撃音/ミット音と同時に画面が一瞬白く光る) */
  @keyframes hookFlash {

  /* ★v5.19.0★ Hook メディアオーバーレイ遷移パターン */
  @keyframes hookMediaFlashIn {
    0% { opacity: 0; filter: brightness(3); }
    30% { opacity: 1; filter: brightness(2); }
    100% { opacity: 1; filter: brightness(1); }
  }
  @keyframes hookMediaFlashOut {
    0% { opacity: 1; filter: brightness(1); }
    70% { opacity: 1; filter: brightness(2.5); }
    100% { opacity: 0; filter: brightness(3); }
  }
  @keyframes hookMediaZoomIn {
    0% { opacity: 0; transform: scale(1.8) rotate(2deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes hookMediaZoomOut {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.6); filter: blur(8px); }
  }
  @keyframes hookMediaSlideIn {
    0% { opacity: 0; transform: translateX(-100%); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes hookMediaSlideOut {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(100%); }
  }
  @keyframes hookMediaGlitchIn {
    0% { opacity: 0; clip-path: inset(0 100% 0 0); }
    12% { opacity: 1; clip-path: inset(30% 60% 40% 0); }
    25% { clip-path: inset(0 30% 60% 20%); }
    37% { clip-path: inset(50% 0 10% 50%); }
    50% { clip-path: inset(20% 20% 30% 10%); }
    75% { clip-path: inset(5% 5% 5% 5%); }
    100% { clip-path: inset(0 0 0 0); }
  }
  @keyframes hookMediaGlitchOut {
    0% { clip-path: inset(0 0 0 0); }
    30% { clip-path: inset(20% 20% 30% 10%); }
    60% { clip-path: inset(50% 0 10% 50%); }
    100% { opacity: 0; clip-path: inset(0 100% 0 0); }
  }
  /* ★v5.20★ HookMediaOverlay の入場アニメ — 持続アニメと連結する用に簡素化 */
  @keyframes hookEntryFade {
    0% { opacity: 0; filter: brightness(2.5); }
    100% { opacity: 1; filter: brightness(1); }
  }
  @keyframes hookEntryZoom {
    0% { opacity: 0; transform: scale(1.5); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes hookEntrySlide {
    0% { opacity: 0; transform: translateX(-100%); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes hookEntryGlitch {
    0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
    25%  { opacity: 1; clip-path: inset(20% 0 60% 0); }
    50%  { clip-path: inset(50% 0 30% 0); }
    75%  { clip-path: inset(70% 0 10% 0); }
    100% { opacity: 1; clip-path: inset(0 0 0 0); }
  }
  /* ★v5.19.5★ 表示中の持続アニメ — 画面が揺れるレベルにインパクト強化 */
  @keyframes hookMediaKenBurns {
    0%   { transform: scale(1) translate(0, 0); }
    25%  { transform: scale(1.15) translate(-2%, -3%); }
    50%  { transform: scale(1.25) translate(2%, -1%) rotate(0.5deg); }
    75%  { transform: scale(1.18) translate(-1%, 2%) rotate(-0.3deg); }
    100% { transform: scale(1.3) translate(3%, -2%) rotate(0.4deg); }
  }
  @keyframes hookMediaShakeIdle {
    0%, 100% { transform: translate(0, 0) rotate(0) scale(1.05); }
    10% { transform: translate(-8px, 4px) rotate(-1deg) scale(1.06); }
    20% { transform: translate(7px, -3px) rotate(0.8deg) scale(1.07); }
    30% { transform: translate(-5px, -4px) rotate(-0.6deg) scale(1.05); }
    40% { transform: translate(6px, 3px) rotate(0.5deg) scale(1.08); }
    50% { transform: translate(-7px, 2px) rotate(-0.7deg) scale(1.06); }
    60% { transform: translate(4px, -5px) rotate(0.4deg) scale(1.05); }
    70% { transform: translate(-6px, 4px) rotate(-0.5deg) scale(1.07); }
    80% { transform: translate(5px, -2px) rotate(0.3deg) scale(1.06); }
    90% { transform: translate(-4px, 3px) rotate(-0.4deg) scale(1.05); }
  }
  @keyframes hookMediaGlitchIdle {
    0%, 80%, 100% { clip-path: inset(0 0 0 0); transform: translate(0, 0) scale(1.05); filter: hue-rotate(0); }
    82% { clip-path: inset(20% 0 60% 0); transform: translate(8px, 0) scale(1.08); filter: hue-rotate(20deg); }
    84% { clip-path: inset(60% 0 20% 0); transform: translate(-8px, 0) scale(1.06); filter: hue-rotate(-20deg); }
    86% { clip-path: inset(40% 0 30% 0); transform: translate(4px, 0) scale(1.07); filter: hue-rotate(10deg); }
    88% { clip-path: inset(0 0 0 0); transform: translate(0, 0) scale(1.05); filter: hue-rotate(0); }
  }
  /* ★v5.19.5★ 新パターン: ズームパルス (ドンドン拡大縮小) */
  @keyframes hookMediaZoomPulse {
    0%, 100% { transform: scale(1.05); }
    25% { transform: scale(1.18) rotate(0.5deg); }
    50% { transform: scale(1.10); }
    75% { transform: scale(1.20) rotate(-0.4deg); }
  }
    0% { opacity: 0; }
    8% { opacity: 0.9; }
    20% { opacity: 0.4; }
    35% { opacity: 0.6; }
    100% { opacity: 0; }
  }
  .hook-flash-overlay {
    position: absolute;
    inset: 0;
    z-index: 60;
    pointer-events: none;
    background: radial-gradient(circle at 50% 50%, #ffffff 0%, rgba(255,255,255,0.6) 30%, transparent 70%);
    mix-blend-mode: screen;
    animation: hookFlash 0.55s ease-out forwards;
  }

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
    /* ★v5.19.0★ レイアウト切替を fade + scale + slide でリッチに */
    transition: opacity 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: scale(1) translateY(0);
  }
  .layout-fade-wrap.fade-in { opacity: 1; transform: scale(1) translateY(0); }
  .layout-fade-wrap.fade-out { opacity: 0; transform: scale(0.96) translateY(6px); }
  .phase { display: none; position: absolute; inset: 0; }
  .phase.active { display: block; }

  /* ================================================================ */
  /* ★v5.19.0★ バネアニメーション基盤                                */
  /* ================================================================ */
  :root {
    --spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
    --spring-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --spring-snappy: cubic-bezier(0.68, -0.55, 0.27, 1.55);
    --spring-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  }

  /* ★ ランキング行のスタガードバネ入場 ★ */
  @keyframes rankRowIn {
    0% { opacity: 0; transform: translateX(-30px) scale(0.9); }
    60% { opacity: 1; transform: translateX(4px) scale(1.02); }
    80% { transform: translateX(-2px) scale(0.99); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  .rank-row-anim {
    opacity: 0;
    animation: rankRowIn 0.5s var(--spring-bounce) forwards;
  }
  .rank-row-anim:nth-child(1) { animation-delay: 0.05s; }
  .rank-row-anim:nth-child(2) { animation-delay: 0.12s; }
  .rank-row-anim:nth-child(3) { animation-delay: 0.19s; }
  .rank-row-anim:nth-child(4) { animation-delay: 0.26s; }
  .rank-row-anim:nth-child(5) { animation-delay: 0.33s; }
  .rank-row-anim:nth-child(6) { animation-delay: 0.40s; }
  .rank-row-anim:nth-child(7) { animation-delay: 0.47s; }
  .rank-row-anim:nth-child(8) { animation-delay: 0.54s; }
  .rank-row-anim:nth-child(9) { animation-delay: 0.61s; }
  .rank-row-anim:nth-child(10){ animation-delay: 0.68s; }

  /* ★ バーのバネ伸長 ★ */
  @keyframes barSpring {
    0% { transform: scaleX(0); transform-origin: left; }
    65% { transform: scaleX(1.08); }
    82% { transform: scaleX(0.96); }
    92% { transform: scaleX(1.02); }
    100% { transform: scaleX(1); }
  }
  .bar-spring {
    /* ★v5.19.3★ 0.6s → 1.1s に延長、視認できる速さに */
    animation: barSpring 1.1s var(--spring-bounce) forwards;
    transform: scaleX(0);
    transform-origin: left;
  }

  /* ★ 数値カウントアップ用の弾むパルス ★ */
  /* ★v5.19.3★ 一瞬すぎ問題: 期間を倍に、scale 倍率も大きく */
  @keyframes numReveal {
    0% { opacity: 0; transform: scale(0.3) translateY(12px); }
    35% { opacity: 1; transform: scale(1.4) translateY(-4px); }
    55% { transform: scale(0.85) translateY(2px); }
    75% { transform: scale(1.08) translateY(-1px); }
    90% { transform: scale(0.97); }
    100% { transform: scale(1) translateY(0); }
  }
  .num-spring { animation: numReveal 0.9s var(--spring-bounce) forwards; }

  /* ★ テロップ入場 強化 (バウンスイン) ★ */
  @keyframes telopBounceIn {
    0% { opacity: 0; transform: translateY(20px) scale(0.85); }
    50% { opacity: 1; transform: translateY(-3px) scale(1.03); }
    70% { transform: translateY(1px) scale(0.99); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  /* ★v5.19.6★ 8種類のテロップ entrance アニメ — 毎シーンで異なる動きに */
  @keyframes telopSlideRight {
    0% { opacity: 0; transform: translateX(-80px) scale(0.92); }
    60% { opacity: 1; transform: translateX(8px) scale(1.04); }
    80% { transform: translateX(-3px) scale(0.99); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes telopSlideLeft {
    0% { opacity: 0; transform: translateX(80px) scale(0.92); }
    60% { opacity: 1; transform: translateX(-8px) scale(1.04); }
    80% { transform: translateX(3px) scale(0.99); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes telopZoomPop {
    0% { opacity: 0; transform: scale(0.3); }
    50% { opacity: 1; transform: scale(1.18); }
    70% { transform: scale(0.92); }
    85% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  @keyframes telopRotateIn {
    0% { opacity: 0; transform: rotate(-12deg) scale(0.7) translateY(15px); }
    60% { opacity: 1; transform: rotate(3deg) scale(1.06) translateY(-2px); }
    80% { transform: rotate(-1deg) scale(0.98); }
    100% { opacity: 1; transform: rotate(0) scale(1) translateY(0); }
  }
  @keyframes telopFlipDown {
    0% { opacity: 0; transform: translateY(-30px) rotateX(-60deg); }
    60% { opacity: 1; transform: translateY(5px) rotateX(10deg); }
    80% { transform: translateY(-2px) rotateX(-3deg); }
    100% { opacity: 1; transform: translateY(0) rotateX(0); }
  }
  @keyframes telopShakeIn {
    0% { opacity: 0; transform: translate(-40px, -10px) rotate(-3deg); }
    20% { opacity: 1; transform: translate(8px, 3px) rotate(2deg); }
    40% { transform: translate(-5px, -2px) rotate(-1.5deg); }
    60% { transform: translate(3px, 1px) rotate(1deg); }
    80% { transform: translate(-1px, 0) rotate(-0.3deg); }
    100% { opacity: 1; transform: translate(0, 0) rotate(0); }
  }
  @keyframes telopElasticIn {
    0% { opacity: 0; transform: scaleX(0) scaleY(2); }
    40% { opacity: 1; transform: scaleX(1.2) scaleY(0.7); }
    60% { transform: scaleX(0.92) scaleY(1.1); }
    80% { transform: scaleX(1.04) scaleY(0.97); }
    100% { transform: scaleX(1) scaleY(1); }
  }
  /* 表示後の strut: 微小なふわつき (生命感) */
  @keyframes telopStrut {
    0%, 100% { transform: translate(0, 0) scale(1) rotate(0); }
    25% { transform: translate(-1px, -1px) scale(1.005) rotate(-0.2deg); }
    50% { transform: translate(1px, 0) scale(0.998) rotate(0.2deg); }
    75% { transform: translate(0, 1px) scale(1.005) rotate(-0.1deg); }
  }
  /* ★v5.19.7★ テロップ文字単位アニメ — 1文字ずつスケールイン (紙芝居脱却) */
  @keyframes telopCharIn {
    0% { opacity: 0; transform: translateY(8px) scale(0.5); filter: blur(2px); }
    60% { opacity: 1; transform: translateY(-2px) scale(1.1); filter: blur(0); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .telop-char {
    display: inline-block;
    opacity: 0;
    animation: telopCharIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  /* ★ カード/パネル出現 (弾むスケール) ★ */
  /* ★v5.19.3★ 0.45s → 0.7s に延長 */
  @keyframes cardBounceIn {
    0% { opacity: 0; transform: scale(0.7) translateY(20px); }
    50% { opacity: 1; transform: scale(1.06) translateY(-3px); }
    70% { transform: scale(0.96) translateY(2px); }
    85% { transform: scale(1.02) translateY(-1px); }
    100% { transform: scale(1) translateY(0); }
  }

  /* ★ バッジ・ピル 脈動 (微小スケール呼吸) ★ */
  @keyframes badgeBreath {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
  }

  /* ★ ランキングフォーカス行のグロー脈動 ★ */
  @keyframes focusRowGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
    50% { box-shadow: 0 0 12px 2px rgba(249,115,22,0.25); }
  }

  /* ★ spotlight: 主指標の値が弾んで出現 ★ */
  /* ★v5.19.3★ 一瞬すぎ問題: 0.65s → 1.2s、scale 0→1.5 で大胆に */
  @keyframes heroValuePop {
    0% { opacity: 0; transform: scale(0) rotate(-15deg); }
    35% { opacity: 1; transform: scale(1.5) rotate(5deg); }
    55% { transform: scale(0.85) rotate(-3deg); }
    72% { transform: scale(1.12) rotate(1.5deg); }
    87% { transform: scale(0.96) rotate(-0.5deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  .hero-value-pop { animation: heroValuePop 1.2s var(--spring-elastic) forwards; }

  /* ★ レーダーポリゴンの弾む描画 ★ */
  @keyframes radarPolyBounce {
    0% { opacity: 0; transform: scale(0); }
    55% { opacity: 1; transform: scale(1.08); }
    75% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  /* ★ 浮遊パーティクル (常時) — ボケ光が漂う ★ */
  @keyframes floatParticle {
    0% { transform: translate(0, 0) scale(1); opacity: 0; }
    10% { opacity: 0.6; }
    90% { opacity: 0.6; }
    100% { transform: translate(var(--fx, 30px), var(--fy, -60px)) scale(var(--fs, 0.5)); opacity: 0; }
  }

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
  /* ★v5.20.5★ 横長: translateX(-50%) を維持しつつ scale */
  @keyframes cardExpandLandscape {
    0% { opacity: 0; transform: translateX(-50%) translateY(20px) scaleY(0.7); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0) scaleY(1); }
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
  /* ★v5.20★ 行数別の自動縮小 (4/5/6行+ サポート) */
  .telop-hook.lines-4 { font-size: 38px; line-height: 1.02; }
  .telop-hook.lines-5 { font-size: 32px; line-height: 1.0; letter-spacing: -1.8px; }
  .telop-hook.lines-6 { font-size: 28px; line-height: 0.98; letter-spacing: -2px; }
  /* ★v5.20★ UI から手動でフォントスケール (0.7-1.3) — projectData.hookFontScale */
  #phone-root[data-hook-font-scale="0.7"] .telop-hook { font-size: 0.7em; }
  .telop-hook .em-y { color: var(--neon-yellow); font-size: 1.3em; letter-spacing: -2.5px; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 18px var(--neon-yellow-glow), 0 0 36px rgba(255,233,75,0.5); }
  /* ★v5.19.2★ hook 用の em-o / em-r / em-n が未定義だったバグ修正 */
  .telop-hook .em-o { color: var(--p-bright); font-size: 1.25em; letter-spacing: -1.5px; font-weight: 900; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 14px var(--p-glow), 0 0 28px rgba(249,115,22,0.5); }
  .telop-hook .em-r { color: #FF6B47; font-size: 1.25em; letter-spacing: -1.5px; font-weight: 900; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 14px rgba(255,107,71,0.8), 0 0 28px rgba(255,107,71,0.4); }
  .telop-hook .em-n { color: var(--neon-yellow); font-family: monospace; font-size: 1.3em; letter-spacing: -1px; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 12px var(--neon-yellow-glow); }

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
  /* ★v5.19.0★ レーダー描画アニメを fade → バネバウンスに昇格
     ポリゴンが scale(0) から弾んで出現、ドットは順次ポップイン */
  .phase[data-p="normal"].active .radar-main-poly {
    animation: radarPolyBounce 0.6s var(--spring-bounce) forwards;
    transform-origin: center;
  }
  .phase[data-p="normal"].active .radar-sub-poly {
    animation: radarPolyBounce 0.5s var(--spring-bounce) 0.15s backwards;
    transform-origin: center;
  }
  /* ドット: 小さく → ポンッと出現 */
  @keyframes radarDotSpring {
    0% { opacity: 0; transform: scale(0); }
    60% { opacity: 1; transform: scale(1.4); }
    80% { transform: scale(0.85); }
    100% { transform: scale(1); }
  }
  .phase[data-p="normal"].active .radar-dot { animation: radarDotSpring 0.3s var(--spring-bounce) backwards; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(1) { animation-delay: 0.3s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(2) { animation-delay: 0.37s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(3) { animation-delay: 0.44s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(4) { animation-delay: 0.51s; }
  .phase[data-p="normal"].active .radar-dot:nth-of-type(5) { animation-delay: 0.58s; }
  /* ラベル: ふわっとスライドイン */
  @keyframes labelSlideIn {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .phase[data-p="normal"].active .radar-label-group { animation: labelSlideIn 0.3s var(--spring-smooth) backwards; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(1) { animation-delay: 0.55s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(2) { animation-delay: 0.6s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(3) { animation-delay: 0.65s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(4) { animation-delay: 0.7s; }
  .phase[data-p="normal"].active .radar-label-group:nth-of-type(5) { animation-delay: 0.75s; }
  @keyframes radarFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }

  /* ★v5.18.5★ zoomBoost (shake/zoom) 発火時は出現アニメを完全抑制
     ★v5.18.6★ ハイライト系・テロップ・stats-table も追加 (出現アニメすべて)
     キーフレームアニメだけが純粋に走るようにする (シェイクが「描画途中の動き」と被らない)
     注: 継続する infinite 系アニメ (cardPulse, numberPulse 等) は止めない
         → 初回出現タイミングだけ即時化
  */
  /* radar 系 (チャート本体) */
  .anim-layer[data-zoom-active="true"] .radar-main-poly,
  .anim-layer[data-zoom-active="true"] .radar-sub-poly,
  .anim-layer[data-zoom-active="true"] .radar-dot,
  .anim-layer[data-zoom-active="true"] .radar-label-group,
  .anim-layer[data-zoom-active="true"] .radar-legend {
    animation: none !important;
    opacity: 1 !important;
  }
  /* ハイライト系 (radar 縮小 + 頂点グロー + ハイライトカード)
     ※ cardPulse 2.5s infinite は維持したいので、cardExpand だけスキップしたい
       → highlight-card は animation を上書きして cardPulse 単独に */
  .anim-layer[data-zoom-active="true"] .hl-radar-svg-box {
    animation: none !important;
    transform: scale(1) !important;  /* radarShrink の終了状態 */
    opacity: 1 !important;
  }
  .anim-layer[data-zoom-active="true"] .vertex-glow {
    animation: none !important;
    opacity: 1 !important;
  }
  .anim-layer[data-zoom-active="true"] .highlight-card {
    /* cardExpand スキップ + cardPulse だけ無限再生 */
    animation: cardPulse 2.5s ease-in-out infinite !important;
    opacity: 1 !important;
    transform: translateY(0) scaleY(1) !important;
  }
  /* ★v5.20.12★ 横長は translateX(-50%) で中央配置するため、zoom時も translateX を維持 */
  .phone.landscape .anim-layer[data-zoom-active="true"] .highlight-card {
    transform: translateX(-50%) translateY(0) scaleY(1) !important;
  }
  /* テロップ吹き出し (常時 0.3s 遅延スライドアップ) */
  .anim-layer[data-zoom-active="true"] .telop-wrap-normal .telop-bg,
  .anim-layer[data-zoom-active="true"] .telop-wrap-hl .telop-bg {
    animation: none !important;
  }
  /* stats-table (radar の下にある選手成績テーブル、1.7s遅延) */
  .anim-layer[data-zoom-active="true"] .stats-table {
    animation: none !important;
    opacity: 1 !important;
  }

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
  /* ★v5.18.1★ テロップは bottom:20% の位置にあり、アバター(bottom:13% +高さ85px≒17%) より上にあるので
     左端まで使ってよい。アバターの真上を通過しても重ならない。
     - speaker-a (数原): 左端〜右端32pxまで使える
     - speaker-b (もえか): 左端14px〜右端60px (Shorts右UI回避) */
  .telop-wrap-normal:has(.telop-bg[data-speaker="a"]),
  .telop-wrap-hl:has(.telop-bg[data-speaker="a"]) { align-items: flex-start; padding-left: 6px; padding-right: 22px; }
  /* speaker-b (もえか): 右側のセーフゾーン確保 (Shorts UI 用) */
  .telop-wrap-normal:has(.telop-bg[data-speaker="b"]),
  .telop-wrap-hl:has(.telop-bg[data-speaker="b"]) { align-items: flex-end; padding-left: 6px; padding-right: 50px; }

  /* ★v5.19.8★ テロップ幅をセーフゾーン目一杯に + 日本語の自動改行を制御 (変な位置で折り返さない)
     - speaker-a 側 padding 32px → speaker-b 側 padding 60px の差分を考慮:
       phone width 360px、左端 8px + 右側UI 60px ≒ 292px 取れる
     - max-width: 320px に拡大 (一部 UI とは重なる、ただ視認最優先) */
  .telop-bg {
    background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); border-radius: 14px; padding: 9px 16px;
    max-width: 320px;
    border: 2px solid rgba(255,255,255,0.15); position: relative; box-shadow: 0 4px 16px rgba(0,0,0,0.6);
  }
  /* ★v5.19.8★ telop-normal は word-break: keep-all でブラウザの自動改行を抑制
     (\n を入れた箇所だけで改行、不要な縦長化を防ぐ) */
  .telop-bg .telop-normal {
    word-break: keep-all;
    overflow-wrap: break-word;  /* どうしても入らない時だけ break */
    white-space: pre-line;       /* \n を改行に、連続スペースは1つに */
  }
  /* 横長 (16:9) ではテロップを横に長く許可 */
  .phone.landscape .telop-bg { max-width: 540px; }

  /* ★v5.18.1★ speaker-a (数原): オレンジ→青系へ (オレンジは数値強調用に取っておく) */
  .telop-bg[data-speaker="a"] { border-color: rgba(56,189,248,0.85); box-shadow: 0 4px 16px rgba(56,189,248,0.4), 0 0 24px rgba(56,189,248,0.2); }
  /* speaker-b (もえか): ローズピンク枠 (変更なし) */
  .telop-bg[data-speaker="b"] { border-color: rgba(251,113,133,0.85); box-shadow: 0 4px 16px rgba(251,113,133,0.35), 0 0 24px rgba(251,113,133,0.15); }

  /* 吹き出し尻尾: 話者アバター方向に出す */
  .telop-bg::before, .telop-bg::after { content: ''; position: absolute; width: 0; height: 0; border-style: solid; display: none; }

  /* ★v5.18.1★ speaker-a: 尻尾も青系に */
  .telop-bg[data-speaker="a"]::before {
    display: block;
    left: 22px; bottom: -14px;
    border-width: 14px 12px 0 0;
    border-color: rgba(56,189,248,0.85) transparent transparent transparent;
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
  .telop-normal .em-y { color: var(--neon-yellow); font-size: 1.25em; letter-spacing: -1.5px; font-weight: 900; text-shadow: 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 12px var(--neon-yellow-glow), 0 0 24px rgba(255,233,75,0.5); }
  .telop-normal .em-o { color: var(--p-bright); font-size: 1.15em; text-shadow: 0 0 10px var(--p-glow); }
  .telop-normal .em-r { color: #FF6B47; font-size: 1.15em; text-shadow: 0 0 10px rgba(255,107,71,0.7); }
  .telop-normal .em-n { color: var(--neon-yellow); font-family: monospace; font-size: 1.2em; letter-spacing: -0.5px; text-shadow: 0 0 8px var(--neon-yellow-glow); }

  /* ★v5.19.5★ テロップアニメは React 側 inline style で確実に再発火させる方式に変更
     ここの CSS animation 設定はコメントアウト (inline style と競合させない)
  .phase.active .telop-wrap-normal .telop-bg { animation: telopBounceIn 0.5s var(--spring-bounce) 0.25s backwards !important; }
  .phase.active .telop-wrap-hl .telop-bg { animation: telopBounceIn 0.5s var(--spring-bounce) 0.25s backwards !important; }
  */

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
  .hl-val-main .num { font-family: 'Anton', 'Bebas Neue', 'Impact', monospace; font-size: 42px; font-weight: 400; letter-spacing: -1px; line-height: 1; }
  .hl-val-sub .num { font-family: 'Anton', 'Bebas Neue', 'Impact', monospace; font-size: 30px; font-weight: 400; letter-spacing: -0.5px; line-height: 1; }
  .hl-val-main .tag { font-size: 11px; font-weight: 700; margin-top: 4px; }
  .hl-val-sub .tag { font-size: 11px; font-weight: 700; margin-top: 4px; }

  .hl-val-main.loser .num { color: #fca5a5; text-shadow: 0 0 12px rgba(248,113,113,0.4); }
  .hl-val-main.loser .tag { color: #fca5a5; }
  .hl-val-main.winner .num { color: var(--p-bright); text-shadow: 0 0 12px var(--p-glow), 0 0 28px var(--p-glow-soft), 0 0 6px rgba(255,255,255,0.5); }
  .hl-val-main.winner .tag { color: var(--p-bright); }
  .hl-val-sub.winner .num { color: var(--p-bright); text-shadow: 0 0 10px var(--p-glow), 0 0 20px var(--p-glow-soft); }
  .hl-val-sub.winner .tag { color: var(--p-bright); }
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

  /* ★アバター名ラベル (v5.15.5 修正) — アイコン直下に近づける&セーフエリア対策 */
  .avatar-hl .avatar-name {
    position: absolute;
    top: 40px;             /* 旧 50px → 40px (アイコン直下に密着) */
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;        /* 旧 10px → 9px (コンパクト化) */
    font-weight: 900;
    letter-spacing: 0.5px;
    white-space: nowrap;
    background: rgba(24,24,27,0.92);
    padding: 1px 6px;      /* 旧 2px 7px → 1px 6px (高さ詰める) */
    border-radius: 6px;
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
  /* ★v5.20.2★ 横長 (16:9) フルスクリーン: 幅基準で算出 (高さは 9/16 で決まる) */
  .phone.fullscreen.landscape {
    width: min(95vw, calc(95vh * 16 / 9)) !important;
    height: auto !important;
    aspect-ratio: 16/9 !important;
  }
  /* ★v5.20.4★ 録画モード横長: ピクセル比固定 (1280x720 想定、固定幅で出力安定化) */
  .phone.record-mode.landscape {
    width: 1280px !important;
    height: 720px !important;
    max-width: none !important;
    max-height: none !important;
    aspect-ratio: 16/9 !important;
    border-radius: 0 !important;
    border: none !important;
  }
  /* 録画モード縦長: 720x1280 */
  .phone.record-mode:not(.landscape):not([data-ar="1:1"]) {
    width: 720px !important;
    height: 1280px !important;
    max-width: none !important;
    max-height: none !important;
    aspect-ratio: 9/16 !important;
    border-radius: 0 !important;
    border: none !important;
  }
  /* ★v5.20.2★ 正方 (1:1) フルスクリーン */
  .phone.fullscreen:not(.landscape).square[data-ar="1:1"] {
    width: min(95vw, 95vh) !important;
    height: auto !important;
    aspect-ratio: 1/1 !important;
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

  /* ★v5.17.0★ Gemini提言②: 暴力的にフォントを太く
     - .font-impact: 数値専用 (Anton, 超極太コンデンスド英数字)
     - .font-headline: ヘッドライン (Bebas Neue, 細長い極太)
     - .font-jp-heavy: 日本語の最重量 (M PLUS 1p weight 900)

     注: 既存の font-family: monospace は維持。
     ショート動画として最大インパクトを狙う箇所だけ font-impact を選択的適用。 */
  .font-impact {
    font-family: 'Anton', 'Bebas Neue', 'Impact', 'Helvetica Neue', sans-serif;
    font-weight: 400;       /* Anton は 400 が最大 (デザイン的に十分極太) */
    letter-spacing: -0.02em;
    font-stretch: condensed;
  }
  .font-headline {
    font-family: 'Bebas Neue', 'Anton', 'Impact', sans-serif;
    font-weight: 400;
    letter-spacing: 0.02em;
  }
  .font-jp-heavy {
    font-family: 'M PLUS 1p', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  /* ★v5.17.0★ ネオン主要数値クラス (player_spotlight の primary-stat 等で使う) */
  .neon-number {
    color: var(--pure-white);
    text-shadow:
      0 0 12px var(--p-glow),
      0 0 24px var(--p-glow-soft),
      0 0 4px rgba(255,255,255,0.6);
  }
  .neon-number-rose {
    color: var(--pure-white);
    text-shadow:
      0 0 12px var(--rose-glow),
      0 0 24px rgba(251,113,133,0.4),
      0 0 4px rgba(255,255,255,0.6);
  }
  .neon-number-yellow {
    color: var(--neon-yellow);
    text-shadow:
      0 0 12px var(--neon-yellow-glow),
      0 0 24px rgba(255,233,75,0.4);
  }
  .neon-number-red {
    color: #ff8a8a;
    text-shadow:
      0 0 12px rgba(248,113,113,0.85),
      0 0 24px rgba(248,113,113,0.4),
      0 0 4px rgba(255,255,255,0.5);
  }

  /* ★v5.19.2★ 勝者数値のシマー (光の筋が横切る) — VS カード等で利用 */
  /* ★v5.19.3★ 2.5s → 3.8s にゆっくり、目で追える速度に */
  @keyframes shimmerSweep {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .num-shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.3) 40%,
      rgba(255,255,255,0.7) 50%,
      rgba(255,255,255,0.3) 60%,
      transparent 100%
    );
    background-size: 200% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    animation: shimmerSweep 3.8s ease-in-out infinite;
  }

  /* ★v5.19.2★ 数値のきらりん (1回だけ光る) */
  @keyframes numFlash {
    0% { filter: brightness(1); }
    15% { filter: brightness(1.8); }
    30% { filter: brightness(1); }
    100% { filter: brightness(1); }
  }
  .num-flash { animation: numFlash 0.6s ease-out; }

  /* ★v5.19.6★ scenePreset — 1シーン全体の演出を束ねたバリアント
     phone-root に data-scene-preset="..." が付与され、ここで上書き */

  /* cinematic_zoom: 全体ズーム + 周辺暗減 */
  #phone-root[data-scene-preset="cinematic_zoom"]::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 5;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%);
    animation: scenePresetVignette 3s ease-in-out infinite alternate;
  }
  /* ★v5.20.14★ scenePresetSlowZoom を .anim-layer に当てると kenBurns と競合し、
     scenePreset 切替時に animation 切り替えが発生 → 中の cardBounceIn 等の子要素が再発火する。
     解決策: scenePresetSlowZoom は背景レイヤー (anim-layer ではない) で表現するか、
     #phone-root 自体に当てる。ここでは #phone-root にだけ当てる方式に変更。 */
  #phone-root[data-scene-preset="cinematic_zoom"] {
    animation: scenePresetSlowZoom 8s ease-in-out infinite alternate;
  }
  @keyframes scenePresetVignette {
    0% { opacity: 0.7; } 100% { opacity: 1; }
  }
  @keyframes scenePresetSlowZoom {
    0% { transform: scale(1); } 100% { transform: scale(1.05); }
  }

  /* neon_burst: ネオングロー + 色収差 */
  #phone-root[data-scene-preset="neon_burst"]::before {
    content: ''; position: absolute; inset: -10%; pointer-events: none; z-index: 6;
    background: radial-gradient(circle at 30% 20%, rgba(249,115,22,0.18), transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(56,189,248,0.18), transparent 50%);
    mix-blend-mode: screen;
    animation: scenePresetNeonShift 4s ease-in-out infinite;
  }
  #phone-root[data-scene-preset="neon_burst"] .anim-layer {
    filter: drop-shadow(2px 0 0 rgba(255,80,80,0.4)) drop-shadow(-2px 0 0 rgba(80,200,255,0.4));
  }
  @keyframes scenePresetNeonShift {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(8%, -5%); }
    66% { transform: translate(-6%, 4%); }
  }

  /* mono_drama: モノクロ+赤強調 */
  #phone-root[data-scene-preset="mono_drama"] .anim-layer {
    filter: grayscale(0.85) contrast(1.15);
  }
  #phone-root[data-scene-preset="mono_drama"]::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 6;
    background: linear-gradient(to bottom, transparent 0%, rgba(255,40,40,0.12) 100%);
  }

  /* pastel_pop: 明度+彩度上げ */
  #phone-root[data-scene-preset="pastel_pop"] .anim-layer {
    filter: brightness(1.08) saturate(0.85) hue-rotate(-5deg);
  }
  #phone-root[data-scene-preset="pastel_pop"]::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 6;
    background: linear-gradient(135deg, rgba(255,200,220,0.15) 0%, rgba(200,230,255,0.15) 100%);
  }

  /* blackboard: 黒板テクスチャ */
  #phone-root[data-scene-preset="blackboard"] {
    background: #1a2820 !important;
  }
  #phone-root[data-scene-preset="blackboard"] .anim-layer {
    filter: sepia(0.2) contrast(1.1);
  }
  #phone-root[data-scene-preset="blackboard"]::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 6;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px, transparent 18px,
      rgba(255,255,255,0.02) 18px, rgba(255,255,255,0.02) 19px
    );
  }

  /* breaking_news: 赤ボーダーフラッシュ */
  #phone-root[data-scene-preset="breaking_news"]::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 6;
    border: 4px solid rgba(220,38,38,0.9);
    box-shadow: inset 0 0 30px rgba(220,38,38,0.4);
    animation: scenePresetBreakingFlash 0.6s ease-in-out infinite alternate;
  }
  @keyframes scenePresetBreakingFlash {
    0% { opacity: 0.6; } 100% { opacity: 1; }
  }
`;

export const GlobalStyles = () => <style>{CSS_TEXT}</style>;
