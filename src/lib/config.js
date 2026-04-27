/**
 * アプリ全体の定数・テーマ定義
 */

export const APP_VERSION = '5.18.9';

export const GAS_CONFIG = {
  endpoint: import.meta.env.VITE_GAS_ENDPOINT || '',
  authToken: import.meta.env.VITE_GAS_AUTH_TOKEN || '',
};

export const THEMES = {
  orange: { primary: '#f97316', secondary: '#c2410c', text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', glow: 'rgba(249,115,22,0.6)', ring: 'ring-orange-500' },
  blue:   { primary: '#3b82f6', secondary: '#1d4ed8', text: 'text-blue-500',   bg: 'bg-blue-500',   border: 'border-blue-500',   glow: 'rgba(59,130,246,0.6)', ring: 'ring-blue-500' },
  red:    { primary: '#ef4444', secondary: '#b91c1c', text: 'text-red-500',    bg: 'bg-red-500',    border: 'border-red-500',    glow: 'rgba(239,68,68,0.6)',  ring: 'ring-red-500' },
  yellow: { primary: '#eab308', secondary: '#a16207', text: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500', glow: 'rgba(234,179,8,0.6)',  ring: 'ring-yellow-500' },
  green:  { primary: '#10b981', secondary: '#047857', text: 'text-emerald-500',bg: 'bg-emerald-500',border: 'border-emerald-500',glow: 'rgba(16,185,129,0.6)', ring: 'ring-emerald-500' },
  purple: { primary: '#a855f7', secondary: '#7e22ce', text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500', glow: 'rgba(168,85,247,0.6)', ring: 'ring-purple-500' },
};

export const LAYOUT_TYPES = {
  radar_compare:    { label: 'レーダー比較',   desc: '総合能力を5角形で比較',        status: 'ready', emoji: '🎯' },
  timeline:         { label: '時系列推移',     desc: '日週月年で変化を見せる',        status: 'ready', emoji: '📈' },
  ranking:          { label: 'ランキング',     desc: '指標別の順位表 (mood切替)',     status: 'ready', emoji: '🏆' },
  player_spotlight: { label: '選手スポット',   desc: '1選手の主役感を強調',           status: 'ready', emoji: '🔦' },
  versus_card:      { label: '対決カード',     desc: '2選手対決 (mood切替)',          status: 'ready', emoji: '⚔️' },
  team_context:     { label: 'チーム文脈',     desc: 'チームの強み弱み (single/compare)', status: 'ready', emoji: '👥' },
  pitch_arsenal:    { label: '球種分析',       desc: '配球+対右左比較',               status: 'ready', emoji: '🎳' },
  batter_heatmap:   { label: '打者ゾーン',     desc: '9エリア打率ヒート (左右別)',    status: 'ready', emoji: '🔥' },
};

export const SE_PRESETS = [
  { id: 'hook_impact',      label: '衝撃フック',   description: 'id:1 の冒頭フックに' },
  { id: 'highlight_ping',   label: 'ハイライト',   description: '指標強調時に' },
  { id: 'stat_reveal',      label: '数値公開',     description: 'データ初公開時' },
  { id: 'shock_hit',        label: '驚愕',         description: 'Bの驚きピーク時' },
  { id: 'success_chime',    label: '成功チャイム', description: 'ポジティブ結論で' },
  { id: 'warning_alert',    label: '警告',         description: '課題指摘時' },
  { id: 'transition_swoosh',label: '場面転換',     description: 'シーン切替時' },
  { id: 'click_tap',        label: 'クリック',     description: '小さなアクセント' },
  { id: 'radar_ping',       label: 'レーダー脈動', description: 'チャート更新時' },
  { id: 'outro_fade',       label: 'アウトロ',     description: '動画終了直前に' },
];

export const DEFAULT_MIXER_LEVELS = {
  voice: 1.0,
  bgm: 0.15,
  se: 0.6,
  master: 1.0,
  duckingAmount: 0.25,
};

export const VIDEO_PATTERNS = [
  { id: 'future_forecast', label: '未来予測型', desc: '好調選手・知名度高', defaultLayout: 'radar_compare' },
  { id: 'bad_news',        label: '悲報型',     desc: '好調だが内容欠陥',  defaultLayout: 'timeline' },
  { id: 'good_news',       label: '朗報型',     desc: '批判されている選手', defaultLayout: 'timeline' },
  { id: 'versus',          label: '対決型',     desc: '起用争い',          defaultLayout: 'versus_card' },
  { id: 'awakening',       label: '覚醒型',     desc: '昨季→今季の激変',   defaultLayout: 'timeline' },
  { id: 'mystery',         label: '謎解き型',   desc: '常識と逆の結論',    defaultLayout: 'pitch_arsenal' },
  { id: 'defense',         label: '擁護型',     desc: 'ネットで叩かれ中',  defaultLayout: 'radar_compare' },
  { id: 'team_analysis',   label: 'チーム分析', desc: 'チーム全体・編成論', defaultLayout: 'team_context' },
  { id: 'ranking_shock',   label: 'ランキング型', desc: 'ベスト/ワースト発表', defaultLayout: 'ranking' },
];
