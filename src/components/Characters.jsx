/**
 * Characters.jsx *
 * v5.21.1 → v5.21.2 改良点:
 * 【数原さん】
 * - 顔を「卵型」(下に細くなる)、より人間的なシルエット
 * - 後ろ髪を厚みのある「兜型」に
 * - メガネは目より大きく、レンズに反射
 * - 鼻を鼻翼+影で立体感
 * - ネクタイにストライプ
 * - 笑顔・驚きを自然に
 *
 * 【もえかちゃん】
 * - 目に「ダブルハイライト + キラキラ」で愛嬌大幅 UP
 * - ★睫毛★ 追加 (女性らしさ)
 * - 前髪を3つの毛束パスで構成
 * - ポニーテール: より長く流れる、リボンのループを丁寧に
 * - キャップに立体感 (前面+側面の陰影)
 * - G ロゴを縦長で巨人風に
 * - ユニフォームに袖の境界線
 *
 * 【共通】
 * - 線の太さを 2.2 / 1.4 の2段階に整理
 * - 全パスをスムーズな曲線に統一
 * - 瞬きアニメは目グループ全体に適用
 */

import React from 'react';

const STROKE = 2.2;
const STROKE_THIN = 1.4;
const LINE = '#1a1a1a';

// ============================================================
// 数原さん
// ============================================================

const KAZUHARA_EXPR = {
  normal: {
    leftEye:  '<ellipse cx="80" cy="156" rx="5" ry="6" fill="#1a1a1a"/><circle cx="82" cy="153" r="2" fill="#fff"/><circle cx="79" cy="158" r="0.8" fill="#fff" opacity="0.6"/>',
    rightEye: '<ellipse cx="140" cy="156" rx="5" ry="6" fill="#1a1a1a"/><circle cx="142" cy="153" r="2" fill="#fff"/><circle cx="139" cy="158" r="0.8" fill="#fff" opacity="0.6"/>',
    leftBrow: 'M67,140 Q80,137 93,140',
    rightBrow:'M127,140 Q140,137 153,140',
    mouth:    { closed: 'M97,196 Q110,202 123,196', open: 'M93,194 Q110,210 127,194 Q110,214 93,194' },
  },
  explain: {
    leftEye:  '<path d="M70,154 Q80,158 92,154 M70,158 Q80,162 92,158" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" fill="none"/>',
    rightEye: '<path d="M128,154 Q140,158 152,154 M128,158 Q140,162 152,158" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" fill="none"/>',
    leftBrow: 'M67,138 Q80,134 93,141',
    rightBrow:'M127,141 Q140,134 153,138',
    mouth:    { closed: 'M97,196 L123,196', open: 'M97,192 Q110,196 123,192 L123,202 Q110,206 97,202 Z' },
  },
  surprise: {
    leftEye:  '<circle cx="80" cy="156" r="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/><ellipse cx="80" cy="156" rx="4" ry="5" fill="#1a1a1a"/><circle cx="82" cy="153" r="1.8" fill="#fff"/>',
    rightEye: '<circle cx="140" cy="156" r="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/><ellipse cx="140" cy="156" rx="4" ry="5" fill="#1a1a1a"/><circle cx="142" cy="153" r="1.8" fill="#fff"/>',
    leftBrow: 'M67,128 Q80,124 93,128',
    rightBrow:'M127,128 Q140,124 153,128',
    mouth:    { closed: 'M104,194 Q110,192 116,194', open: 'M100,192 Q110,212 120,192 Q110,218 100,192' },
  },
  confused: {
    leftEye:  '<ellipse cx="80" cy="157" rx="4.5" ry="5" fill="#1a1a1a"/><circle cx="82" cy="155" r="1.6" fill="#fff"/>',
    rightEye: '<ellipse cx="140" cy="153" rx="4.5" ry="5" fill="#1a1a1a"/><circle cx="142" cy="151" r="1.6" fill="#fff"/>',
    leftBrow: 'M67,143 Q80,135 93,138',
    rightBrow:'M127,138 Q140,135 153,143',
    mouth:    { closed: 'M97,200 Q110,196 123,200', open: 'M97,198 Q110,206 123,198' },
  },
  convinced: {
    leftEye:  '<path d="M68,154 Q80,164 92,154" stroke="#1a1a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    rightEye: '<path d="M128,154 Q140,164 152,154" stroke="#1a1a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    leftBrow: 'M67,138 Q80,134 93,138',
    rightBrow:'M127,138 Q140,134 153,138',
    mouth:    { closed: 'M93,194 Q110,208 127,194', open: 'M93,194 Q110,212 127,194 Q110,216 93,194' },
  },
  serious: {
    leftEye:  '<ellipse cx="80" cy="156" rx="3.8" ry="4.5" fill="#1a1a1a"/><circle cx="81" cy="154" r="1.3" fill="#fff"/>',
    rightEye: '<ellipse cx="140" cy="156" rx="3.8" ry="4.5" fill="#1a1a1a"/><circle cx="141" cy="154" r="1.3" fill="#fff"/>',
    leftBrow: 'M67,140 L93,144',
    rightBrow:'M127,144 L153,140',
    mouth:    { closed: 'M97,200 L123,200', open: 'M95,196 Q110,200 125,196 L125,204 Q110,208 95,204 Z' },
  },
  smile: {
    leftEye:  '<path d="M68,156 Q80,164 92,156" stroke="#1a1a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    rightEye: '<path d="M128,156 Q140,164 152,156" stroke="#1a1a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    leftBrow: 'M67,140 Q80,135 93,140',
    rightBrow:'M127,140 Q140,135 153,140',
    mouth:    { closed: 'M90,192 Q110,212 130,192', open: 'M88,192 Q110,218 132,192 Q110,222 88,192' },
  },
  excited: {
    leftEye:  '<path d="M73,150 L87,162 M87,150 L73,162" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>',
    rightEye: '<path d="M133,150 L147,162 M147,150 L133,162" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>',
    leftBrow: 'M67,128 Q80,124 93,130',
    rightBrow:'M127,130 Q140,124 153,128',
    mouth:    { closed: 'M88,192 Q110,210 132,192', open: 'M85,188 Q110,220 135,188 Q110,224 85,188' },
  },
};

export function Kazuhara({ expression = 'normal', mouthOpen = false, size = 200, headBob = true }) {
  const exp = KAZUHARA_EXPR[expression] ? expression : 'normal';
  const e = KAZUHARA_EXPR[exp];
  const mouthD = mouthOpen ? e.mouth.open : e.mouth.closed;

  return (
    <svg viewBox="0 0 220 320" width={size} height={size * (320/220)} style={{
      animation: headBob ? 'charHeadBob 4.2s ease-in-out infinite' : 'none',
      transformOrigin: '110px 280px',
      overflow: 'visible',
    }}>
      <defs>
        <linearGradient id="kz-suit2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a4170"/><stop offset="1" stopColor="#152244"/>
        </linearGradient>
        <linearGradient id="kz-hair2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a2a"/><stop offset="1" stopColor="#0f0f0f"/>
        </linearGradient>
        <radialGradient id="kz-cheek2" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e88060" stopOpacity="0.4"/>
          <stop offset="1" stopColor="#e88060" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="kz-tie" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8c1a"/><stop offset="0.5" stopColor="#ff8c1a"/><stop offset="1" stopColor="#e07015"/>
        </linearGradient>
        <pattern id="kz-tie-stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#162548" strokeWidth="1.5" opacity="0.4"/>
        </pattern>
        <filter id="char-shadow-k" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.25"/>
        </filter>
      </defs>

      <g filter="url(#char-shadow-k)">

        {/* ===== 後ろ髪 (兜型、首から上に膨らむ) ===== */}
        <path d="M50,140 Q40,180 50,225 Q58,238 75,232 L70,180 Q60,140 75,108 Q60,115 50,140 Z"
              fill="url(#kz-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        <path d="M170,140 Q180,180 170,225 Q162,238 145,232 L150,180 Q160,140 145,108 Q160,115 170,140 Z"
              fill="url(#kz-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>

        {/* ===== 首 ===== */}
        <path d="M93,213 Q92,234 110,238 Q128,234 127,213 Z" fill="#f4d4a8" stroke={LINE} strokeWidth={STROKE}/>
        {/* 首の影 */}
        <path d="M93,217 Q110,225 127,217" fill="none" stroke="#c9a47a" strokeWidth={STROKE_THIN} opacity="0.6"/>

        {/* ===== スーツ・体 ===== */}
        {/* 肩 (丸く) */}
        <path d="M30,275 Q35,250 65,242 Q90,238 100,260 L110,272 L120,260 Q130,238 155,242 Q185,250 190,275 L190,320 L30,320 Z"
              fill="url(#kz-suit2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* 白シャツ V */}
        <path d="M93,242 L110,275 L127,242 L127,320 L93,320 Z" fill="#fafaf5" stroke={LINE} strokeWidth={STROKE}/>
        {/* 襟の折り目 */}
        <path d="M93,242 L78,295 M127,242 L142,295" fill="none" stroke="#0d1830" strokeWidth={STROKE_THIN} opacity="0.55"/>

        {/* ネクタイ */}
        <g>
          <path d="M101,250 L119,250 L122,268 L110,275 L98,268 Z" fill="url(#kz-tie)" stroke={LINE} strokeWidth={STROKE_THIN}/>
          <path d="M98,268 L104,320 L116,320 L122,268 L110,275 Z" fill="url(#kz-tie)" stroke={LINE} strokeWidth={STROKE_THIN}/>
          {/* ストライプ模様 */}
          <path d="M101,250 L119,250 L122,268 L110,275 L98,268 Z M98,268 L104,320 L116,320 L122,268 L110,275 Z" fill="url(#kz-tie-stripe)"/>
          {/* ノット (結び目) のハイライト */}
          <path d="M104,253 Q110,257 116,253" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4"/>
        </g>

        {/* ===== 顔 (卵型: 下に細くなる) ===== */}
        <path d="M68,142 Q66,205 78,222 Q92,236 110,237 Q128,236 142,222 Q154,205 152,142 Q150,98 110,93 Q70,98 68,142 Z"
              fill="#f4d4a8" stroke={LINE} strokeWidth={STROKE}/>
        {/* 顎下の影 (自然に) */}
        <path d="M82,222 Q92,232 110,234 Q128,232 138,222 Q132,234 110,238 Q88,234 82,222 Z"
              fill="#c9a47a" opacity="0.25"/>

        {/* ===== 前髪 (横分け、3つの毛束) ===== */}
        <path d="M62,108 Q72,82 110,88 Q150,84 158,108 L155,118 Q145,98 130,98 Q125,108 115,108 Q105,108 95,98 Q80,98 70,118 Z"
              fill="url(#kz-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* 毛束のディテール */}
        <path d="M75,105 Q85,98 95,108" fill="none" stroke="#3f3f3f" strokeWidth={STROKE_THIN} opacity="0.7"/>
        <path d="M120,108 Q135,98 145,110" fill="none" stroke="#3f3f3f" strokeWidth={STROKE_THIN} opacity="0.7"/>
        {/* 白髪 (こめかみ、もみあげ) */}
        <path d="M64,128 Q63,148 65,168" fill="none" stroke="#a8a8a8" strokeWidth={STROKE_THIN}/>
        <path d="M156,128 Q157,148 155,168" fill="none" stroke="#a8a8a8" strokeWidth={STROKE_THIN}/>

        {/* ===== 耳 ===== */}
        <path d="M62,168 Q56,172 56,182 Q58,190 65,188 Q66,180 64,170 Z" fill="#f4d4a8" stroke={LINE} strokeWidth={STROKE}/>
        <path d="M62,176 Q60,180 62,184" fill="none" stroke="#c9a47a" strokeWidth={STROKE_THIN}/>
        <path d="M158,168 Q164,172 164,182 Q162,190 155,188 Q154,180 156,170 Z" fill="#f4d4a8" stroke={LINE} strokeWidth={STROKE}/>
        <path d="M158,176 Q160,180 158,184" fill="none" stroke="#c9a47a" strokeWidth={STROKE_THIN}/>

        {/* ===== チーク ===== */}
        <ellipse cx="78" cy="182" rx="11" ry="6" fill="url(#kz-cheek2)"/>
        <ellipse cx="142" cy="182" rx="11" ry="6" fill="url(#kz-cheek2)"/>

        {/* ===== 鼻 (鼻翼+鼻筋+影) ===== */}
        <path d="M108,168 Q107,178 105,184 M112,168 Q113,178 115,184" fill="none" stroke={LINE} strokeWidth={STROKE_THIN} strokeLinecap="round"/>
        <path d="M105,184 Q108,188 110,188 Q112,188 115,184" fill="none" stroke={LINE} strokeWidth={STROKE_THIN}/>
        <path d="M104,184 Q108,182 116,184" fill="#c9a47a" opacity="0.3"/>

        {/* ===== メガネ (大きめ、目を包む) ===== */}
        <g>
          <rect x="62" y="142" width="36" height="24" rx="5" fill="rgba(255,255,255,0.08)" stroke={LINE} strokeWidth={STROKE}/>
          <rect x="122" y="142" width="36" height="24" rx="5" fill="rgba(255,255,255,0.08)" stroke={LINE} strokeWidth={STROKE}/>
          {/* ブリッジ */}
          <path d="M98,154 Q110,150 122,154" fill="none" stroke={LINE} strokeWidth={STROKE}/>
          {/* テンプル */}
          <line x1="62" y1="148" x2="58" y2="160" stroke={LINE} strokeWidth={STROKE}/>
          <line x1="158" y1="148" x2="162" y2="160" stroke={LINE} strokeWidth={STROKE}/>
          {/* レンズの光反射 (左上) */}
          <path d="M67,146 L73,152" stroke="#fff" strokeWidth="1.6" opacity="0.7"/>
          <path d="M127,146 L133,152" stroke="#fff" strokeWidth="1.6" opacity="0.7"/>
          {/* レンズの底面ハイライト */}
          <path d="M65,162 Q80,164 96,162" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.3"/>
          <path d="M125,162 Q140,164 156,162" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.3"/>
        </g>

        {/* ===== 表情パーツ ===== */}
        <path d={e.leftBrow} fill="none" stroke={LINE} strokeWidth={STROKE * 1.2} strokeLinecap="round"/>
        <path d={e.rightBrow} fill="none" stroke={LINE} strokeWidth={STROKE * 1.2} strokeLinecap="round"/>
        <g className="char-eyes" dangerouslySetInnerHTML={{__html: e.leftEye + e.rightEye}}/>
        <path d={mouthD} fill={mouthOpen ? '#7a3030' : 'none'} stroke={LINE} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

// ============================================================
// もえかちゃん (リファイン v2)
// ============================================================

const MOEKA_EXPR = {
  normal: {
    leftEye:  '<ellipse cx="76" cy="160" rx="7" ry="9" fill="#1a1a1a"/><circle cx="78" cy="156" r="3" fill="#fff"/><circle cx="74" cy="163" r="1.5" fill="#fff" opacity="0.7"/><path d="M68,148 Q76,144 84,148" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>',
    rightEye: '<ellipse cx="144" cy="160" rx="7" ry="9" fill="#1a1a1a"/><circle cx="146" cy="156" r="3" fill="#fff"/><circle cx="142" cy="163" r="1.5" fill="#fff" opacity="0.7"/><path d="M136,148 Q144,144 152,148" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>',
    leftBrow: 'M62,138 Q76,133 90,138',
    rightBrow:'M130,138 Q144,133 158,138',
    mouth:    { closed: 'M99,202 Q110,208 121,202', open: 'M95,200 Q110,214 125,200 Q110,220 95,200' },
  },
  surprise: {
    leftEye:  '<circle cx="76" cy="160" r="10" fill="#fff" stroke="#1a1a1a" stroke-width="2"/><circle cx="76" cy="160" r="6" fill="#1a1a1a"/><circle cx="78" cy="157" r="2.5" fill="#fff"/><path d="M66,148 Q76,144 86,148" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>',
    rightEye: '<circle cx="144" cy="160" r="10" fill="#fff" stroke="#1a1a1a" stroke-width="2"/><circle cx="144" cy="160" r="6" fill="#1a1a1a"/><circle cx="146" cy="157" r="2.5" fill="#fff"/><path d="M134,148 Q144,144 154,148" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>',
    leftBrow: 'M62,124 Q76,118 90,124',
    rightBrow:'M130,124 Q144,118 158,124',
    mouth:    { closed: 'M104,200 Q110,196 116,200', open: 'M100,194 Q110,216 120,194 Q110,222 100,194' },
  },
  confused: {
    leftEye:  '<path d="M64,162 Q76,156 88,162" fill="none" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>',
    rightEye: '<ellipse cx="144" cy="158" rx="6" ry="8" fill="#1a1a1a"/><circle cx="146" cy="155" r="2.5" fill="#fff"/><path d="M134,148 Q144,144 154,148" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>',
    leftBrow: 'M62,143 L90,135',
    rightBrow:'M158,143 L130,135',
    mouth:    { closed: 'M99,206 Q110,202 121,206', open: 'M99,202 Q110,210 121,202' },
  },
  happy: {
    leftEye:  '<path d="M64,158 Q76,150 88,158" fill="none" stroke="#1a1a1a" stroke-width="2.6" stroke-linecap="round"/>',
    rightEye: '<path d="M132,158 Q144,150 156,158" fill="none" stroke="#1a1a1a" stroke-width="2.6" stroke-linecap="round"/>',
    leftBrow: 'M62,136 Q76,131 90,136',
    rightBrow:'M130,136 Q144,131 158,136',
    mouth:    { closed: 'M88,196 Q110,216 132,196', open: 'M86,196 Q110,222 134,196 Q110,228 86,196' },
  },
  moved: {
    leftEye:  '<ellipse cx="76" cy="160" rx="7" ry="9" fill="#1a1a1a"/><circle cx="78" cy="156" r="3" fill="#fff"/><circle cx="74" cy="163" r="1.5" fill="#fff" opacity="0.7"/><path d="M70,168 Q73,174 76,170" fill="none" stroke="#5db4ff" stroke-width="1.8"/>',
    rightEye: '<ellipse cx="144" cy="160" rx="7" ry="9" fill="#1a1a1a"/><circle cx="146" cy="156" r="3" fill="#fff"/><circle cx="142" cy="163" r="1.5" fill="#fff" opacity="0.7"/><path d="M142,168 Q145,174 148,170" fill="none" stroke="#5db4ff" stroke-width="1.8"/>',
    leftBrow: 'M62,142 Q76,138 90,142',
    rightBrow:'M130,142 Q144,138 158,142',
    mouth:    { closed: 'M95,200 Q110,206 125,200', open: 'M95,200 Q110,212 125,200' },
  },
  sad: {
    leftEye:  '<ellipse cx="76" cy="162" rx="6" ry="7" fill="#1a1a1a"/><circle cx="78" cy="159" r="2" fill="#fff"/>',
    rightEye: '<ellipse cx="144" cy="162" rx="6" ry="7" fill="#1a1a1a"/><circle cx="146" cy="159" r="2" fill="#fff"/>',
    leftBrow: 'M62,138 L90,148',
    rightBrow:'M158,138 L130,148',
    mouth:    { closed: 'M99,210 Q110,204 121,210', open: 'M99,208 Q110,214 121,208' },
  },
  excited: {
    leftEye:  '<g><path d="M68,150 L84,166 M84,150 L68,166" stroke="#1a1a1a" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="76" cy="158" r="2" fill="#ff8c1a"/></g>',
    rightEye: '<g><path d="M136,150 L152,166 M152,150 L136,166" stroke="#1a1a1a" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="144" cy="158" r="2" fill="#ff8c1a"/></g>',
    leftBrow: 'M62,124 Q76,118 90,124',
    rightBrow:'M130,124 Q144,118 158,124',
    mouth:    { closed: 'M88,196 Q110,212 132,196', open: 'M84,194 Q110,222 136,194 Q110,228 84,194' },
  },
  blank: {
    leftEye:  '<line x1="68" y1="160" x2="84" y2="160" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>',
    rightEye: '<line x1="136" y1="160" x2="152" y2="160" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>',
    leftBrow: 'M62,144 L90,144',
    rightBrow:'M130,144 L158,144',
    mouth:    { closed: 'M104,204 L116,204', open: 'M102,202 L118,202 L118,210 L102,210 Z' },
  },
};

export function Moeka({ expression = 'normal', mouthOpen = false, size = 200, headBob = true }) {
  const exp = MOEKA_EXPR[expression] ? expression : 'normal';
  const e = MOEKA_EXPR[exp];
  const mouthD = mouthOpen ? e.mouth.open : e.mouth.closed;

  return (
    <svg viewBox="0 0 220 320" width={size} height={size * (320/220)} style={{
      animation: headBob ? 'charHeadBob 4.2s ease-in-out infinite reverse' : 'none',
      transformOrigin: '110px 280px',
      overflow: 'visible',
    }}>
      <defs>
        <linearGradient id="mk-uniform2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff"/><stop offset="0.5" stopColor="#f5f5f0"/><stop offset="1" stopColor="#d8d8d0"/>
        </linearGradient>
        <linearGradient id="mk-cap2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1f1f"/><stop offset="1" stopColor="#000"/>
        </linearGradient>
        <linearGradient id="mk-cap-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000"/><stop offset="1" stopColor="#1f1f1f"/>
        </linearGradient>
        <linearGradient id="mk-hair2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e4a36"/><stop offset="1" stopColor="#4a2f1f"/>
        </linearGradient>
        <radialGradient id="mk-cheek2" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffaaaa" stopOpacity="0.65"/>
          <stop offset="1" stopColor="#ffaaaa" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="mk-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9c2a"/><stop offset="1" stopColor="#e07015"/>
        </linearGradient>
        <filter id="char-shadow-m" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.25"/>
        </filter>
      </defs>

      <g filter="url(#char-shadow-m)">

        {/* ===== ポニーテール (長く流れる) ===== */}
        <path d="M155,100 Q205,118 200,175 Q198,220 180,238 Q170,222 178,190 Q195,150 148,108 Z"
              fill="url(#mk-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* ポニテに毛束のハイライト */}
        <path d="M168,118 Q190,150 188,200" fill="none" stroke="#8a5d44" strokeWidth={STROKE_THIN} opacity="0.7"/>
        <path d="M178,128 Q195,170 187,210" fill="none" stroke="#8a5d44" strokeWidth="1" opacity="0.5"/>

        {/* リボン (橙、立体的) */}
        <g>
          <ellipse cx="170" cy="118" rx="14" ry="7" fill="url(#mk-ribbon)" stroke={LINE} strokeWidth={STROKE_THIN}/>
          {/* リボンの結び目中央 */}
          <ellipse cx="170" cy="118" rx="3" ry="6" fill="#c25510" stroke={LINE} strokeWidth="0.8"/>
          {/* リボンのテール */}
          <path d="M165,124 Q160,134 163,142 L168,140 Q166,132 169,124 Z" fill="url(#mk-ribbon)" stroke={LINE} strokeWidth={STROKE_THIN}/>
          <path d="M175,124 Q180,134 177,142 L172,140 Q174,132 171,124 Z" fill="url(#mk-ribbon)" stroke={LINE} strokeWidth={STROKE_THIN}/>
        </g>

        {/* ===== 首 ===== */}
        <path d="M97,222 Q97,240 110,243 Q123,240 123,222 Z" fill="#fce0c4" stroke={LINE} strokeWidth={STROKE}/>

        {/* ===== ユニフォーム ===== */}
        <path d="M30,275 Q40,255 75,250 Q92,250 110,253 Q128,250 145,250 Q180,255 190,275 L190,320 L30,320 Z"
              fill="url(#mk-uniform2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* 袖の境界線 (肩から下に) */}
        <path d="M50,260 Q55,290 60,320 M170,260 Q165,290 160,320" fill="none" stroke="#bbb" strokeWidth={STROKE_THIN} opacity="0.7"/>
        {/* 襟 (V字、しっかり) */}
        <path d="M93,250 L110,278 L127,250" fill="none" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        <path d="M91,253 L110,283 L129,253" fill="none" stroke="#666" strokeWidth={STROKE_THIN} opacity="0.6"/>
        {/* オレンジ縦ライン */}
        <line x1="105" y1="258" x2="105" y2="320" stroke="#ff8c1a" strokeWidth="3"/>
        <line x1="115" y1="258" x2="115" y2="320" stroke="#ff8c1a" strokeWidth="3"/>
        {/* 巨人 G ロゴ (左胸、縦長で本物っぽく) */}
        <g transform="translate(58,290)">
          <path d="M0,-13 A13,13 0 1,0 0,13 A13,13 0 0,0 13,2 L5,2 L5,5 L9,5"
                fill="none" stroke="#ff8c1a" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
        </g>

        {/* ===== 顔 (女性的に丸く小さく、頬幅狭め) ===== */}
        <path d="M64,150 Q64,200 80,222 Q94,238 110,239 Q126,238 140,222 Q156,200 156,150 Q156,102 110,98 Q64,102 64,150 Z"
              fill="#fce0c4" stroke={LINE} strokeWidth={STROKE}/>
        {/* 顎下の影 */}
        <path d="M82,224 Q94,234 110,236 Q126,234 138,224 Q132,236 110,239 Q88,236 82,224 Z"
              fill="#e0b896" opacity="0.3"/>

        {/* ===== 前髪 (3つの毛束で構成) ===== */}
        {/* メイン後ろ */}
        <path d="M55,118 Q70,80 110,80 Q150,80 165,118 L162,128 Q150,98 110,98 Q70,98 58,128 Z"
              fill="url(#mk-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* 左毛束 */}
        <path d="M58,108 Q72,98 90,108 Q88,118 75,128 Q65,118 58,108 Z"
              fill="url(#mk-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* 中央毛束 */}
        <path d="M92,98 Q108,82 122,108 Q120,120 110,128 Q100,120 92,108 Z"
              fill="url(#mk-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* 右毛束 */}
        <path d="M130,108 Q145,98 162,108 Q160,118 145,128 Q132,118 130,108 Z"
              fill="url(#mk-hair2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* ハイライト */}
        <path d="M75,108 Q82,114 84,118" fill="none" stroke="#a0735a" strokeWidth={STROKE_THIN} opacity="0.6"/>
        <path d="M105,100 Q110,108 112,118" fill="none" stroke="#a0735a" strokeWidth={STROKE_THIN} opacity="0.6"/>
        <path d="M140,108 Q145,114 145,118" fill="none" stroke="#a0735a" strokeWidth={STROKE_THIN} opacity="0.6"/>

        {/* 横サイド (顔の輪郭沿い) */}
        <path d="M58,128 Q52,170 56,200 L62,200 Q60,170 62,140 Z" fill="url(#mk-hair2)" stroke={LINE} strokeWidth={STROKE}/>
        <path d="M162,128 Q168,170 164,200 L158,200 Q160,170 158,140 Z" fill="url(#mk-hair2)" stroke={LINE} strokeWidth={STROKE}/>

        {/* ===== 耳 ===== */}
        <path d="M58,170 Q52,176 53,186 Q57,193 63,190 Q64,182 62,172 Z" fill="#fce0c4" stroke={LINE} strokeWidth={STROKE}/>
        <path d="M58,180 Q57,184 59,188" fill="none" stroke="#d4a890" strokeWidth={STROKE_THIN}/>
        <path d="M162,170 Q168,176 167,186 Q163,193 157,190 Q156,182 158,172 Z" fill="#fce0c4" stroke={LINE} strokeWidth={STROKE}/>
        <path d="M162,180 Q163,184 161,188" fill="none" stroke="#d4a890" strokeWidth={STROKE_THIN}/>

        {/* ===== チーク (女性的にはっきり) ===== */}
        <ellipse cx="78" cy="187" rx="13" ry="7" fill="url(#mk-cheek2)"/>
        <ellipse cx="142" cy="187" rx="13" ry="7" fill="url(#mk-cheek2)"/>

        {/* ===== 鼻 (小さい点) ===== */}
        <path d="M108,182 Q110,184 112,182" fill="none" stroke="#d4a890" strokeWidth={STROKE_THIN} strokeLinecap="round"/>

        {/* ===== キャップ (立体感) ===== */}
        {/* キャップ本体 (側面に陰影) */}
        <path d="M48,108 Q48,52 110,50 Q172,52 172,108 L168,118 Q120,100 52,118 Z"
              fill="url(#mk-cap2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* キャップの側面ハイライト (右側) */}
        <path d="M150,60 Q170,65 170,105" fill="none" stroke="#444" strokeWidth={STROKE_THIN} opacity="0.7"/>
        {/* キャップのバンド (帯) */}
        <path d="M48,108 Q110,118 172,108" fill="none" stroke="#3a3a3a" strokeWidth="2.5"/>
        {/* つば */}
        <path d="M28,118 Q110,138 192,118 L188,128 Q110,144 32,128 Z"
              fill="url(#mk-cap2)" stroke={LINE} strokeWidth={STROKE} strokeLinejoin="round"/>
        {/* つばの裏面 (影) */}
        <path d="M30,124 Q110,138 190,124" fill="none" stroke="#444" strokeWidth={STROKE_THIN} opacity="0.6"/>

        {/* G ロゴ (キャップ中央、縦長で本物っぽく) */}
        <g transform="translate(110,90)">
          <path d="M-10,-12 A12,12 0 1,0 -10,12 A12,12 0 0,0 4,2 L-3,2 L-3,5 L1,5"
                fill="none" stroke="#ff8c1a" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
          {/* ハイライト */}
          <path d="M-10,-12 A12,12 0 0,1 0,-10" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
        </g>

        {/* キャップのトップボタン */}
        <circle cx="110" cy="56" r="3.5" fill="#1a1a1a" stroke={LINE} strokeWidth={STROKE_THIN}/>
        <circle cx="110" cy="56" r="1.5" fill="#3a3a3a"/>

        {/* ===== 表情パーツ ===== */}
        <path d={e.leftBrow} fill="none" stroke={LINE} strokeWidth={STROKE * 1.1} strokeLinecap="round"/>
        <path d={e.rightBrow} fill="none" stroke={LINE} strokeWidth={STROKE * 1.1} strokeLinecap="round"/>
        <g className="char-eyes" dangerouslySetInnerHTML={{__html: e.leftEye + e.rightEye}}/>
        <path d={mouthD} fill={mouthOpen ? '#a04848' : 'none'} stroke={LINE} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

// ============================================================
// emoji → expression マッピング
// ============================================================

export const EMOJI_TO_KAZUHARA_EXPR = {
  '👨‍🏫': 'explain', '🧐': 'serious', '🤔': 'confused', '😲': 'surprise',
  '😯': 'surprise', '😆': 'excited', '🤯': 'surprise', '😌': 'convinced',
  '🥹': 'smile', '🥰': 'smile', '🤩': 'excited', '😤': 'serious',
  '😨': 'surprise', '😭': 'serious', '🥺': 'confused', '😅': 'smile',
};

export const EMOJI_TO_MOEKA_EXPR = {
  '😲': 'surprise', '😯': 'surprise', '🤔': 'confused', '🧐': 'confused',
  '🤯': 'surprise', '🥹': 'moved', '🥺': 'sad', '😭': 'sad',
  '😆': 'excited', '🤩': 'excited', '😌': 'happy', '🥰': 'happy',
  '😤': 'excited', '😅': 'confused', '😨': 'sad', '👨‍🏫': 'normal',
};

export function getExpressionForCharacter(speaker, emoji) {
  if (speaker === 'A') return EMOJI_TO_KAZUHARA_EXPR[emoji] || 'explain';
  if (speaker === 'B') return EMOJI_TO_MOEKA_EXPR[emoji] || 'normal';
  return 'normal';
}
