/**
 * Characters.jsx (★v5.21.0 新規★)
 *
 * 数原さん / もえかちゃん の SVG キャラデザ
 * - 8 表情パターン
 * - 口パク (mouthOpen prop)
 * - 目の瞬き (CSS animation)
 * - 頭の小揺れ (常時)
 *
 * 設計:
 * - viewBox 200x300 (上半身バストアップ)
 * - 表情 = expression prop (string) で目/口/眉のパス切替
 * - 服装は固定、表情パーツのみ可変
 */

import React from 'react';

// ============================================================
// 数原さん (男性40-50代、データアナリスト)
// ============================================================

const KAZUHARA_FACE_PATHS = {
  // 目: [左目, 右目]
  eyes: {
    normal:    ['M65,140 Q72,135 79,140 M65,142 Q72,140 79,142', 'M121,140 Q128,135 135,140 M121,142 Q128,140 135,142'],  // 普通の目 (ニコ)
    explain:   ['M62,138 L82,138 M62,142 L82,142', 'M118,138 L138,138 M118,142 L138,142'],  // 解説中 (鋭い)
    surprise:  ['M70,138 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0', 'M128,138 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0'],  // 驚き (まん丸)
    confused:  ['M65,140 Q72,143 79,140', 'M121,138 Q128,135 135,138'],  // 疑問 (左下右上)
    convinced: ['M62,138 Q72,144 82,138', 'M118,138 Q128,144 138,138'],  // 納得 (にっこり)
    serious:   ['M62,138 L82,140 M62,143 L82,143', 'M118,140 L138,138 M118,143 L138,143'],  // 真剣
    smile:     ['M62,140 Q72,148 82,140', 'M118,140 Q128,148 138,140'],  // 微笑 (つぶる)
    excited:   ['M65,135 L75,140 L65,145 M75,135 L65,140 L75,145', 'M121,135 L131,140 L121,145 M131,135 L121,140 L131,145'],  // 熱弁 (キラキラ)
  },
  // 眉
  eyebrows: {
    normal:    'M58,125 L82,125 M118,125 L142,125',
    explain:   'M58,123 L82,127 M142,123 L118,127',  // 内向き (説明)
    surprise:  'M58,118 L82,118 M118,118 L142,118',  // 上に
    confused:  'M58,125 L82,121 M142,125 L118,121',  // ハの字
    convinced: 'M58,125 L82,125 M118,125 L142,125',
    serious:   'M58,127 L82,123 M142,127 L118,123',  // しかめ面
    smile:     'M58,127 Q70,125 82,127 M118,127 Q130,125 142,127',
    excited:   'M58,118 Q70,114 82,118 M118,118 Q130,114 142,118',  // 上がりっぱなし
  },
  // 口 (mouthOpen で2状態切替)
  mouths: {
    normal:    { closed: 'M85,180 Q100,184 115,180', open: 'M85,180 Q100,192 115,180 Q100,196 85,180' },
    explain:   { closed: 'M85,182 L115,182', open: 'M88,180 L112,180 L112,188 L88,188 Z' },
    surprise:  { closed: 'M95,180 Q100,178 105,180', open: 'M95,178 Q100,188 105,178 Q100,194 95,178' },
    confused:  { closed: 'M88,184 Q100,182 112,184', open: 'M88,182 Q100,189 112,182' },
    convinced: { closed: 'M85,180 Q100,186 115,180', open: 'M85,180 Q100,192 115,180' },
    serious:   { closed: 'M88,184 L112,184', open: 'M88,182 L112,182 L112,188 L88,188 Z' },
    smile:     { closed: 'M82,180 Q100,192 118,180', open: 'M82,180 Q100,196 118,180 Q100,200 82,180' },
    excited:   { closed: 'M85,180 Q100,190 115,180', open: 'M82,176 Q100,200 118,176 Q100,204 82,176' },
  },
};

export function Kazuhara({ expression = 'normal', mouthOpen = false, size = 200, headBob = true }) {
  const exp = KAZUHARA_FACE_PATHS.eyes[expression] ? expression : 'normal';
  const eyes = KAZUHARA_FACE_PATHS.eyes[exp];
  const eyebrows = KAZUHARA_FACE_PATHS.eyebrows[exp];
  const mouth = mouthOpen ? KAZUHARA_FACE_PATHS.mouths[exp].open : KAZUHARA_FACE_PATHS.mouths[exp].closed;

  return (
    <svg viewBox="0 0 200 300" width={size} height={size * 1.5} style={{
      animation: headBob ? 'charHeadBob 4s ease-in-out infinite' : 'none',
      transformOrigin: '100px 250px',
      overflow: 'visible',
    }}>
      <defs>
        <linearGradient id="kz-suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e3a5f"/><stop offset="1" stopColor="#15294a"/>
        </linearGradient>
      </defs>

      {/* ===== 体 (スーツ) ===== */}
      {/* 首 */}
      <path d="M85,200 L85,225 L115,225 L115,200 Z" fill="#f4d4a8"/>
      {/* スーツ襟 (V字) */}
      <path d="M50,235 L100,260 L150,235 L160,300 L40,300 Z" fill="url(#kz-suit)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 白シャツ V */}
      <path d="M85,235 L100,260 L115,235 L115,300 L85,300 Z" fill="#fff" stroke="#000" strokeWidth="2"/>
      {/* ネクタイ (橙) */}
      <path d="M93,240 L107,240 L110,260 L100,265 L90,260 Z M90,260 L100,300 L110,260 Z" fill="#ff8c1a" stroke="#000" strokeWidth="1.8"/>

      {/* ===== 顔 ===== */}
      {/* 髪 (後ろ) */}
      <path d="M50,100 Q40,160 55,200 L55,180 Q50,140 60,110 Z M150,100 Q160,160 145,200 L145,180 Q150,140 140,110 Z" fill="#2a2a2a"/>
      {/* 顔肌 */}
      <path d="M58,120 Q58,200 100,210 Q142,200 142,120 Q142,90 100,85 Q58,90 58,120 Z" fill="#f4d4a8" stroke="#000" strokeWidth="2.5"/>
      {/* 髪 (前髪・横分け) */}
      <path d="M55,105 Q70,75 110,80 Q145,82 148,110 Q145,95 105,90 Q75,98 65,115 Z" fill="#2a2a2a" stroke="#000" strokeWidth="2"/>
      {/* 白髪 (こめかみ) */}
      <path d="M58,118 Q60,135 62,150" fill="none" stroke="#a0a0a0" strokeWidth="2.5"/>
      <path d="M142,118 Q140,135 138,150" fill="none" stroke="#a0a0a0" strokeWidth="2.5"/>
      {/* 耳 */}
      <ellipse cx="55" cy="150" rx="6" ry="11" fill="#f4d4a8" stroke="#000" strokeWidth="2"/>
      <ellipse cx="145" cy="150" rx="6" ry="11" fill="#f4d4a8" stroke="#000" strokeWidth="2"/>
      {/* 鼻 */}
      <path d="M98,155 Q97,170 95,175 Q100,180 105,175 Q103,170 102,155" fill="none" stroke="#000" strokeWidth="2" strokeLinejoin="round"/>

      {/* ===== メガネ ===== */}
      <rect x="55" y="128" width="35" height="22" rx="3" fill="rgba(255,255,255,0.1)" stroke="#000" strokeWidth="2.5"/>
      <rect x="110" y="128" width="35" height="22" rx="3" fill="rgba(255,255,255,0.1)" stroke="#000" strokeWidth="2.5"/>
      <line x1="90" y1="138" x2="110" y2="138" stroke="#000" strokeWidth="2.5"/>

      {/* ===== 表情パーツ (差し替え) ===== */}
      {/* 眉 */}
      <path d={eyebrows} fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
      {/* 目 (瞬き対応で別グループ) */}
      <g className="char-eyes">
        <path d={eyes[0]} fill="#000" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={eyes[1]} fill="#000" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      {/* 口 */}
      <path d={mouth} fill={mouthOpen ? '#7a3030' : 'none'} stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ============================================================
// もえかちゃん (女性20代、ユニフォーム + ポニテ)
// ============================================================

const MOEKA_FACE_PATHS = {
  eyes: {
    normal:    ['M62,148 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0', 'M138,148 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0'],
    surprise:  ['M62,148 m-9,0 a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0', 'M138,148 m-9,0 a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0'],
    confused:  ['M55,150 Q62,144 70,150', 'M130,144 Q138,150 146,144'],
    happy:     ['M55,148 Q62,142 70,148', 'M130,148 Q138,142 146,148'],  // 弓型 ^_^
    moved:     ['M55,150 Q62,156 70,150', 'M130,150 Q138,156 146,150'],  // 涙目 ;_;
    sad:       ['M62,150 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0', 'M138,150 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0'],
    excited:   ['M55,143 L70,148 L55,153 M70,143 L55,148 L70,153', 'M130,143 L146,148 L130,153 M146,143 L130,148 L146,153'],  // キラキラ
    blank:     ['M59,148 L65,148 M135,148 L141,148'],  // きょとん 一本線
  },
  eyebrows: {
    normal:    'M52,128 Q62,125 72,128 M128,128 Q138,125 148,128',
    surprise:  'M52,118 Q62,115 72,118 M128,118 Q138,115 148,118',
    confused:  'M52,128 L72,124 M148,128 L128,124',
    happy:     'M52,125 Q62,121 72,125 M128,125 Q138,121 148,125',
    moved:     'M52,128 L72,131 M148,128 L128,131',
    sad:       'M52,128 L72,135 M148,128 L128,135',
    excited:   'M52,118 Q62,115 72,118 M128,118 Q138,115 148,118',
    blank:     'M52,130 L72,130 M128,130 L148,130',
  },
  mouths: {
    normal:    { closed: 'M88,188 Q100,194 112,188', open: 'M85,188 Q100,200 115,188 Q100,206 85,188' },
    surprise:  { closed: 'M95,188 Q100,184 105,188', open: 'M93,184 Q100,200 107,184 Q100,206 93,184' },
    confused:  { closed: 'M88,190 Q100,188 112,190', open: 'M88,188 Q100,196 112,188' },
    happy:     { closed: 'M82,184 Q100,200 118,184', open: 'M82,184 Q100,204 118,184 Q100,210 82,184' },
    moved:     { closed: 'M85,188 Q100,194 115,188', open: 'M85,188 Q100,200 115,188' },
    sad:       { closed: 'M88,194 Q100,190 112,194', open: 'M88,192 Q100,200 112,192' },
    excited:   { closed: 'M82,184 Q100,200 118,184', open: 'M80,180 Q100,210 120,180 Q100,216 80,180' },
    blank:     { closed: 'M95,190 L105,190', open: 'M93,190 L107,190 L107,196 L93,196 Z' },
  },
};

export function Moeka({ expression = 'normal', mouthOpen = false, size = 200, headBob = true }) {
  const exp = MOEKA_FACE_PATHS.eyes[expression] ? expression : 'normal';
  const eyes = MOEKA_FACE_PATHS.eyes[exp];
  const eyebrows = MOEKA_FACE_PATHS.eyebrows[exp];
  const mouth = mouthOpen ? MOEKA_FACE_PATHS.mouths[exp].open : MOEKA_FACE_PATHS.mouths[exp].closed;

  return (
    <svg viewBox="0 0 200 300" width={size} height={size * 1.5} style={{
      animation: headBob ? 'charHeadBob 4s ease-in-out infinite reverse' : 'none',
      transformOrigin: '100px 250px',
      overflow: 'visible',
    }}>
      <defs>
        <linearGradient id="mk-uniform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdfdfd"/><stop offset="1" stopColor="#e0e0e0"/>
        </linearGradient>
      </defs>

      {/* ===== ポニテ (後ろから出る) ===== */}
      <path d="M155,90 Q190,120 175,200 Q170,225 165,200 Q172,150 145,105 Z" fill="#5a3a2a" stroke="#000" strokeWidth="2"/>

      {/* ===== 体 (ユニフォーム) ===== */}
      <path d="M85,210 L85,230 L115,230 L115,210 Z" fill="#f8d4b6"/>
      {/* ユニフォーム本体 (白) */}
      <path d="M40,240 Q100,225 160,240 L165,300 L35,300 Z" fill="url(#mk-uniform)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 巨人 G ロゴ (左胸) */}
      <text x="65" y="275" fontSize="22" fontWeight="900" fill="#ff8c1a" stroke="#000" strokeWidth="0.5" fontFamily="serif">G</text>
      {/* オレンジ縦ライン (襟元) */}
      <path d="M97,235 L97,300 M103,235 L103,300" stroke="#ff8c1a" strokeWidth="2"/>
      {/* 襟 */}
      <path d="M85,232 L100,250 L115,232" fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>

      {/* ===== 顔 ===== */}
      {/* 顔肌 */}
      <path d="M55,135 Q55,210 100,220 Q145,210 145,135 Q145,95 100,90 Q55,95 55,135 Z" fill="#f8d4b6" stroke="#000" strokeWidth="2.5"/>
      {/* 髪 (前髪) */}
      <path d="M50,110 Q60,75 100,72 Q140,75 150,110 Q145,90 110,80 Q90,82 80,90 Q70,98 65,108 Q60,115 55,118 Z" fill="#5a3a2a" stroke="#000" strokeWidth="2.5"/>
      {/* 髪 (横サイド) */}
      <path d="M50,108 Q45,150 50,180 L55,180 Q53,150 55,118 Z" fill="#5a3a2a" stroke="#000" strokeWidth="2"/>
      <path d="M150,108 Q155,150 150,180 L145,180 Q147,150 145,118 Z" fill="#5a3a2a" stroke="#000" strokeWidth="2"/>
      {/* 耳 */}
      <ellipse cx="50" cy="158" rx="5" ry="9" fill="#f8d4b6" stroke="#000" strokeWidth="2"/>
      <ellipse cx="150" cy="158" rx="5" ry="9" fill="#f8d4b6" stroke="#000" strokeWidth="2"/>
      {/* 鼻 */}
      <path d="M97,165 Q98,175 96,180 Q100,184 104,180 Q102,175 103,165" fill="none" stroke="#000" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* チーク (ピンク) */}
      <ellipse cx="65" cy="175" rx="9" ry="5" fill="#ff9999" opacity="0.5"/>
      <ellipse cx="135" cy="175" rx="9" ry="5" fill="#ff9999" opacity="0.5"/>

      {/* ===== キャップ (巨人) ===== */}
      <path d="M40,100 Q40,55 100,55 Q160,55 160,100 L155,108 Q100,98 45,108 Z" fill="#1a1a1a" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* つば */}
      <path d="M30,108 Q100,118 170,108 L165,115 Q100,124 35,115 Z" fill="#1a1a1a" stroke="#000" strokeWidth="2"/>
      {/* G ロゴ (中央) */}
      <text x="93" y="92" fontSize="20" fontWeight="900" fill="#ff8c1a" stroke="#000" strokeWidth="0.6" fontFamily="serif">G</text>

      {/* ===== 表情パーツ ===== */}
      <path d={eyebrows} fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      <g className="char-eyes">
        <path d={eyes[0]} fill="#000" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={eyes[1]} fill="#000" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <path d={mouth} fill={mouthOpen ? '#a04848' : 'none'} stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ============================================================
// emoji → expression マッピング
// 既存スクリプトの emoji 値からキャラ表情を導出
// ============================================================

export const EMOJI_TO_KAZUHARA_EXPR = {
  '👨‍🏫': 'explain',
  '🧐': 'serious',
  '🤔': 'confused',
  '😲': 'surprise',
  '😯': 'surprise',
  '😆': 'excited',
  '🤯': 'surprise',
  '😌': 'convinced',
  '🥹': 'smile',
  '🥰': 'smile',
  '🤩': 'excited',
  '😤': 'serious',
  '😨': 'surprise',
  '😭': 'serious',
  '🥺': 'confused',
  '😅': 'smile',
};

export const EMOJI_TO_MOEKA_EXPR = {
  '😲': 'surprise',
  '😯': 'surprise',
  '🤔': 'confused',
  '🧐': 'confused',
  '🤯': 'surprise',
  '🥹': 'moved',
  '🥺': 'sad',
  '😭': 'sad',
  '😆': 'excited',
  '🤩': 'excited',
  '😌': 'happy',
  '🥰': 'happy',
  '😤': 'excited',
  '😅': 'confused',
  '😨': 'sad',
  '👨‍🏫': 'normal',
};

export function getExpressionForCharacter(speaker, emoji) {
  if (speaker === 'A') return EMOJI_TO_KAZUHARA_EXPR[emoji] || 'explain';
  if (speaker === 'B') return EMOJI_TO_MOEKA_EXPR[emoji] || 'normal';
  return 'normal';
}
