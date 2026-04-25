/**
 * シルエットSVGコンポーネント集
 * projectData.silhouetteType の値で表示するシルエットを切り替え
 *
 * 用意しているパターン:
 * - batter_right: 右打者打撃フォーム (既存)
 * - batter_left: 左打者打撃フォーム
 * - batter_stance: 構えスタンス (どっしり)
 * - runner: 走塁中の野手
 * - pitcher_right: 右投手ワインドアップ
 * - pitcher_left: 左投手ワインドアップ
 * - pitcher_set: セットポジション
 * - catcher: キャッチャー構え
 * - team_huddle: チーム円陣 (チーム全体テーマ用)
 * - team_stadium: 球場/スタンド (打線・順位・チームテーマ用)
 */

import React from 'react';

const COLOR = '#f97316';

// 右打者 (既存、改良)
function BatterRight() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        <ellipse cx="105" cy="38" rx="18" ry="20"/>
        <path d="M 88 40 L 80 42 L 82 46 L 95 45 Z"/>
        <rect x="99" y="55" width="12" height="10"/>
        <path d="M 85 65 L 125 65 L 130 120 L 80 120 Z"/>
        <path d="M 125 70 L 145 75 L 155 65 L 160 50 L 155 45 L 145 50 L 130 65 Z"/>
        <path d="M 85 72 L 70 85 L 72 105 L 80 100 L 90 85 Z"/>
        <path d="M 155 65 L 175 25 L 180 18 L 178 15 L 170 20 L 158 60 Z"/>
        <path d="M 80 120 L 130 120 L 128 140 L 82 140 Z"/>
        <path d="M 82 140 L 78 180 L 68 185 L 70 192 L 92 188 L 98 140 Z"/>
        <path d="M 108 140 L 122 180 L 132 188 L 135 192 L 122 195 L 108 188 L 100 140 Z"/>
      </g>
    </svg>
  );
}

// 左打者 (右打者の左右反転版)
function BatterLeft() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR} transform="scale(-1 1) translate(-200 0)">
        <ellipse cx="105" cy="38" rx="18" ry="20"/>
        <path d="M 88 40 L 80 42 L 82 46 L 95 45 Z"/>
        <rect x="99" y="55" width="12" height="10"/>
        <path d="M 85 65 L 125 65 L 130 120 L 80 120 Z"/>
        <path d="M 125 70 L 145 75 L 155 65 L 160 50 L 155 45 L 145 50 L 130 65 Z"/>
        <path d="M 85 72 L 70 85 L 72 105 L 80 100 L 90 85 Z"/>
        <path d="M 155 65 L 175 25 L 180 18 L 178 15 L 170 20 L 158 60 Z"/>
        <path d="M 80 120 L 130 120 L 128 140 L 82 140 Z"/>
        <path d="M 82 140 L 78 180 L 68 185 L 70 192 L 92 188 L 98 140 Z"/>
        <path d="M 108 140 L 122 180 L 132 188 L 135 192 L 122 195 L 108 188 L 100 140 Z"/>
      </g>
    </svg>
  );
}

// バッター正面構え (どっしりスタンス、バット縦)
function BatterStance() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        {/* 頭 */}
        <ellipse cx="100" cy="38" rx="18" ry="20"/>
        {/* 首 */}
        <rect x="94" y="55" width="12" height="10"/>
        {/* 胴体 */}
        <path d="M 78 65 L 122 65 L 128 125 L 72 125 Z"/>
        {/* 左腕(バット握る) */}
        <path d="M 78 70 L 62 80 L 55 120 L 62 125 L 70 120 L 78 95 Z"/>
        {/* 右腕(バット握る) */}
        <path d="M 122 70 L 138 80 L 145 120 L 138 125 L 130 120 L 122 95 Z"/>
        {/* バット (縦に構える) */}
        <rect x="50" y="15" width="6" height="68" rx="2"/>
        <rect x="46" y="13" width="14" height="8" rx="4"/>
        {/* 腰 */}
        <path d="M 72 125 L 128 125 L 124 145 L 76 145 Z"/>
        {/* 左脚 */}
        <path d="M 78 145 L 74 185 L 66 188 L 68 195 L 92 192 L 96 145 Z"/>
        {/* 右脚 */}
        <path d="M 104 145 L 108 185 L 116 188 L 114 195 L 132 192 L 122 145 Z"/>
      </g>
    </svg>
  );
}

// 走塁中の野手
function Runner() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        {/* 頭 (前傾姿勢) */}
        <ellipse cx="105" cy="35" rx="16" ry="18"/>
        {/* 首 */}
        <rect x="99" y="50" width="12" height="8"/>
        {/* 胴体 (前傾) */}
        <path d="M 85 58 L 125 62 L 132 110 L 78 105 Z"/>
        {/* 後ろに流れる腕 */}
        <path d="M 85 65 L 45 95 L 48 105 L 60 100 L 90 85 Z"/>
        {/* 前に出した腕 */}
        <path d="M 125 68 L 160 50 L 170 55 L 163 65 L 130 85 Z"/>
        {/* 腰 */}
        <path d="M 78 110 L 132 110 L 128 128 L 82 128 Z"/>
        {/* 踏み出した前足 */}
        <path d="M 110 128 L 150 155 L 160 158 L 158 165 L 142 162 L 108 140 Z"/>
        {/* 後ろ足 (蹴り出し) */}
        <path d="M 90 128 L 78 178 L 68 182 L 70 190 L 90 188 L 105 135 Z"/>
      </g>
    </svg>
  );
}

// 右投手ワインドアップ (脚上げ)
function PitcherRight() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        {/* 頭 */}
        <ellipse cx="95" cy="38" rx="17" ry="19"/>
        {/* 首 */}
        <rect x="89" y="55" width="12" height="9"/>
        {/* 胴体 (横向き、少しひねり) */}
        <path d="M 80 64 L 115 66 L 120 120 L 73 118 Z"/>
        {/* 右腕(投球腕、後ろに引いてトップ) */}
        <path d="M 115 70 L 150 45 L 170 30 L 172 25 L 165 22 L 145 30 L 118 55 Z"/>
        {/* 左腕(グラブ側、体の前) */}
        <path d="M 80 70 L 60 90 L 68 105 L 80 98 L 88 85 Z"/>
        {/* グラブ */}
        <ellipse cx="65" cy="95" rx="10" ry="8"/>
        {/* 腰 */}
        <path d="M 73 120 L 120 120 L 118 140 L 78 140 Z"/>
        {/* 左脚 (軸脚、地面) */}
        <path d="M 78 140 L 72 185 L 62 190 L 64 195 L 88 192 L 94 140 Z"/>
        {/* 右脚 (高く上げている) */}
        <path d="M 108 140 L 140 115 L 155 105 L 158 100 L 150 98 L 130 108 L 115 140 Z"/>
      </g>
    </svg>
  );
}

// 左投手ワインドアップ (反転版)
function PitcherLeft() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR} transform="scale(-1 1) translate(-200 0)">
        <ellipse cx="95" cy="38" rx="17" ry="19"/>
        <rect x="89" y="55" width="12" height="9"/>
        <path d="M 80 64 L 115 66 L 120 120 L 73 118 Z"/>
        <path d="M 115 70 L 150 45 L 170 30 L 172 25 L 165 22 L 145 30 L 118 55 Z"/>
        <path d="M 80 70 L 60 90 L 68 105 L 80 98 L 88 85 Z"/>
        <ellipse cx="65" cy="95" rx="10" ry="8"/>
        <path d="M 73 120 L 120 120 L 118 140 L 78 140 Z"/>
        <path d="M 78 140 L 72 185 L 62 190 L 64 195 L 88 192 L 94 140 Z"/>
        <path d="M 108 140 L 140 115 L 155 105 L 158 100 L 150 98 L 130 108 L 115 140 Z"/>
      </g>
    </svg>
  );
}

// セットポジション投手
function PitcherSet() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        {/* 頭 */}
        <ellipse cx="100" cy="38" rx="17" ry="19"/>
        {/* 首 */}
        <rect x="94" y="55" width="12" height="9"/>
        {/* 胴体 */}
        <path d="M 82 64 L 118 64 L 122 120 L 78 120 Z"/>
        {/* 両腕を胸の前に (グラブ構え) */}
        <path d="M 82 72 L 70 95 L 88 110 L 100 105 L 100 75 Z"/>
        <path d="M 118 72 L 130 95 L 112 110 L 100 105 L 100 75 Z"/>
        {/* グラブ(両手で包む) */}
        <ellipse cx="100" cy="102" rx="14" ry="9"/>
        {/* 腰 */}
        <path d="M 78 120 L 122 120 L 118 138 L 82 138 Z"/>
        {/* 左脚 (軸脚) */}
        <path d="M 82 138 L 76 186 L 66 190 L 68 195 L 90 192 L 96 138 Z"/>
        {/* 右脚 (軽く上げてセット) */}
        <path d="M 104 138 L 108 178 L 118 182 L 116 190 L 134 186 L 118 138 Z"/>
      </g>
    </svg>
  );
}

// キャッチャー構え (しゃがんだ姿勢)
function Catcher() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        {/* 頭 (マスク含む) */}
        <ellipse cx="100" cy="50" rx="22" ry="22"/>
        {/* マスクの格子 */}
        <rect x="86" y="44" width="28" height="2" fill="#18181b"/>
        <rect x="86" y="52" width="28" height="2" fill="#18181b"/>
        <rect x="93" y="36" width="2" height="30" fill="#18181b"/>
        <rect x="105" y="36" width="2" height="30" fill="#18181b"/>
        {/* 首・胸当て */}
        <path d="M 78 70 L 122 70 L 128 115 L 72 115 Z"/>
        {/* 右腕 (グラブ構え、前に) */}
        <path d="M 122 78 L 155 100 L 168 105 L 170 112 L 162 115 L 148 110 L 125 95 Z"/>
        {/* グラブ */}
        <ellipse cx="165" cy="108" rx="12" ry="10"/>
        {/* 左腕 (サイン出し) */}
        <path d="M 78 78 L 88 115 L 80 130 L 76 128 L 70 115 Z"/>
        {/* 腰 */}
        <path d="M 72 115 L 128 115 L 130 135 L 70 135 Z"/>
        {/* しゃがんだ脚 (左) */}
        <path d="M 72 135 L 50 160 L 45 180 L 55 185 L 70 175 L 88 150 L 88 138 Z"/>
        {/* しゃがんだ脚 (右) */}
        <path d="M 128 135 L 150 160 L 155 180 L 145 185 L 130 175 L 112 150 L 112 138 Z"/>
      </g>
    </svg>
  );
}

const SILHOUETTE_MAP = {
  batter_right: BatterRight,
  batter_left: BatterLeft,
  batter_stance: BatterStance,
  runner: Runner,
  pitcher_right: PitcherRight,
  pitcher_left: PitcherLeft,
  pitcher_set: PitcherSet,
  catcher: Catcher,
  team_huddle: TeamHuddle,
  team_stadium: TeamStadium,
};

// チーム円陣 (3人並んだ後ろ姿、チーム全体テーマ向け)
function TeamHuddle() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        {/* 左の選手 */}
        <ellipse cx="55" cy="55" rx="14" ry="16"/>
        <path d="M 41 75 L 69 75 L 73 130 L 37 130 Z"/>
        <path d="M 37 130 L 33 180 L 28 188 L 32 192 L 48 188 L 52 130 Z"/>
        <path d="M 58 130 L 62 180 L 70 188 L 67 192 L 53 188 Z"/>
        {/* 中央の選手 (一番大きい) */}
        <ellipse cx="100" cy="48" rx="16" ry="18"/>
        <path d="M 84 70 L 116 70 L 120 130 L 80 130 Z"/>
        <path d="M 80 130 L 76 185 L 70 192 L 75 196 L 92 192 L 95 130 Z"/>
        <path d="M 105 130 L 110 185 L 118 192 L 115 196 L 100 192 Z"/>
        {/* 右の選手 */}
        <ellipse cx="145" cy="55" rx="14" ry="16"/>
        <path d="M 131 75 L 159 75 L 163 130 L 127 130 Z"/>
        <path d="M 127 130 L 123 180 L 118 188 L 122 192 L 138 188 L 142 130 Z"/>
        <path d="M 148 130 L 152 180 L 160 188 L 157 192 L 143 188 Z"/>
      </g>
    </svg>
  );
}

// 球場・スタンド (打線・順位・チームテーマ向け)
function TeamStadium() {
  return (
    <svg viewBox="0 0 200 200">
      <g fill={COLOR}>
        {/* スタンド屋根 */}
        <path d="M 20 40 Q 100 15 180 40 L 180 55 Q 100 28 20 55 Z"/>
        {/* スタンド本体 */}
        <path d="M 20 55 Q 100 28 180 55 L 180 110 L 20 110 Z" opacity="0.85"/>
        {/* スタンドの座席ライン */}
        <path d="M 30 75 Q 100 52 170 75" stroke={COLOR} strokeWidth="1.5" fill="none" opacity="0.4"/>
        <path d="M 30 90 Q 100 67 170 90" stroke={COLOR} strokeWidth="1.5" fill="none" opacity="0.4"/>
        {/* グラウンド (ダイヤモンド) */}
        <path d="M 100 130 L 145 155 L 100 180 L 55 155 Z" opacity="0.7"/>
        {/* ピッチャーマウンド */}
        <ellipse cx="100" cy="155" rx="6" ry="3" opacity="0.9"/>
        {/* ホームベース */}
        <path d="M 95 178 L 105 178 L 105 184 L 100 188 L 95 184 Z"/>
      </g>
    </svg>
  );
}

// プレイヤータイプからデフォルトシルエット推測
function getDefaultSilhouette(playerType) {
  if (playerType === 'pitcher') return 'pitcher_right';
  if (playerType === 'team') return 'team_stadium';
  return 'batter_right';
}

/**
 * メインのシルエット表示コンポーネント
 */
export function Silhouette({ silhouetteType, playerType }) {
  const type = silhouetteType || getDefaultSilhouette(playerType);
  const Comp = SILHOUETTE_MAP[type] || BatterRight;
  return <Comp />;
}

// エクスポート用: AI プロンプトで使えるリスト
export const SILHOUETTE_OPTIONS = [
  { id: 'batter_right', label: '右打者 打撃フォーム', hint: '右打者の強打者向け' },
  { id: 'batter_left', label: '左打者 打撃フォーム', hint: '左打者の強打者向け' },
  { id: 'batter_stance', label: '打者 構え', hint: 'どっしりした構え、全打者向け' },
  { id: 'runner', label: '走塁中', hint: '盗塁・走塁アピール時' },
  { id: 'pitcher_right', label: '右投手 ワインドアップ', hint: '右投手・脚上げ全力投球' },
  { id: 'pitcher_left', label: '左投手 ワインドアップ', hint: '左投手・脚上げ全力投球' },
  { id: 'pitcher_set', label: '投手 セットポジション', hint: 'リリーフ投手・走者あり' },
  { id: 'catcher', label: 'キャッチャー 構え', hint: '捕手・守備' },
  { id: 'team_huddle', label: 'チーム円陣', hint: 'チーム全体テーマ・複数選手' },
  { id: 'team_stadium', label: '球場・スタンド', hint: '打線/順位/チーム全体テーマ' },
];
