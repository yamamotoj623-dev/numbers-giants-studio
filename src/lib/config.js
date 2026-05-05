/**
 * アプリ全体の定数・テーマ定義
 */

export const APP_VERSION = '5.20.13';

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
  { id: 'hook_impact',      label: '衝撃フック',     description: 'id:1 の冒頭フックに' },
  { id: 'highlight_ping',   label: 'ハイライト',     description: '指標強調時に' },
  { id: 'stat_reveal',      label: '数値公開',       description: 'データ初公開時' },
  { id: 'shock_hit',        label: '驚愕',           description: 'Bの驚きピーク時' },
  { id: 'success_chime',    label: '成功チャイム',   description: 'ポジティブ結論で' },
  { id: 'warning_alert',    label: '警告',           description: '課題指摘時' },
  { id: 'transition_swoosh',label: '場面転換',       description: 'シーン切替時' },
  { id: 'click_tap',        label: 'クリック',       description: '小さなアクセント' },
  { id: 'radar_ping',       label: 'レーダー脈動',   description: 'チャート更新時' },
  { id: 'outro_fade',       label: 'アウトロ',       description: '動画終了直前に' },
  // ★v5.20.13 追加バリエーション★
  { id: 'sparkle_up',       label: 'キラキラ上昇',   description: '朗報・好調話の頂点' },
  { id: 'drum_roll',        label: 'ドラムロール',   description: '発表前の溜め' },
  { id: 'whoosh_in',        label: '勢い登場',       description: '新指標・選手登場時' },
  { id: 'soft_pop',         label: 'ソフトポップ',   description: '軽い気付き・追加情報' },
  { id: 'heavy_thud',       label: '重低音',         description: '深刻な悲報・致命傷' },
  { id: 'ding_correct',     label: '正解音',         description: '結論の確信表明' },
  { id: 'low_buzz',         label: '低音バズ',       description: '違和感・疑問提示' },
  { id: 'crystal_chime',    label: 'クリスタル',     description: '美しい数字・支配的成績' },
];

export const DEFAULT_MIXER_LEVELS = {
  // ★v5.20.13: ご要望どおり voice 1.4x / ducking 50%★
  voice: 1.4,
  bgm: 0.15,
  se: 0.6,
  master: 1.0,
  duckingAmount: 0.5,
};

// ★v5.20.13: チームプリセット (リーグ/チーム/カラー)★
// number/league/team を選択するとプレビューの選手色が自動で切り替わる
export const TEAM_PRESETS = [
  // NPB セ・リーグ
  { id: 'npb_giants',    league: 'NPB', team: 'G',     label: '巨人',       primary: '#f97316', secondary: '#c2410c', textColor: '#fb923c' },
  { id: 'npb_tigers',    league: 'NPB', team: 'T',     label: '阪神',       primary: '#eab308', secondary: '#a16207', textColor: '#facc15' },
  { id: 'npb_dragons',   league: 'NPB', team: 'D',     label: '中日',       primary: '#3b82f6', secondary: '#1d4ed8', textColor: '#60a5fa' },
  { id: 'npb_carp',      league: 'NPB', team: 'C',     label: '広島',       primary: '#ef4444', secondary: '#b91c1c', textColor: '#f87171' },
  { id: 'npb_baystars',  league: 'NPB', team: 'DB',    label: '横浜DeNA',   primary: '#1e40af', secondary: '#172554', textColor: '#3b82f6' },
  { id: 'npb_swallows',  league: 'NPB', team: 'S',     label: 'ヤクルト',   primary: '#0ea5e9', secondary: '#0c4a6e', textColor: '#38bdf8' },
  // NPB パ・リーグ
  { id: 'npb_buffaloes', league: 'NPB', team: 'Bs',    label: 'オリックス', primary: '#7c2d12', secondary: '#451a03', textColor: '#a16207' },
  { id: 'npb_marines',   league: 'NPB', team: 'M',     label: 'ロッテ',     primary: '#1e293b', secondary: '#0f172a', textColor: '#475569' },
  { id: 'npb_eagles',    league: 'NPB', team: 'E',     label: '楽天',       primary: '#7f1d1d', secondary: '#450a0a', textColor: '#dc2626' },
  { id: 'npb_lions',     league: 'NPB', team: 'L',     label: '西武',       primary: '#1e3a8a', secondary: '#172554', textColor: '#2563eb' },
  { id: 'npb_hawks',     league: 'NPB', team: 'H',     label: 'ソフトバンク', primary: '#fbbf24', secondary: '#b45309', textColor: '#facc15' },
  { id: 'npb_fighters',  league: 'NPB', team: 'F',     label: '日本ハム',   primary: '#0891b2', secondary: '#0e7490', textColor: '#22d3ee' },
  // MLB ナ・リーグ (主要)
  { id: 'mlb_dodgers',   league: 'MLB', team: 'LAD',   label: 'ドジャース', primary: '#1e40af', secondary: '#0c4a6e', textColor: '#3b82f6' },
  { id: 'mlb_padres',    league: 'MLB', team: 'SD',    label: 'パドレス',   primary: '#a16207', secondary: '#451a03', textColor: '#eab308' },
  { id: 'mlb_cubs',      league: 'MLB', team: 'CHC',   label: 'カブス',     primary: '#1e3a8a', secondary: '#172554', textColor: '#3b82f6' },
  { id: 'mlb_mets',      league: 'MLB', team: 'NYM',   label: 'メッツ',     primary: '#ea580c', secondary: '#7c2d12', textColor: '#fb923c' },
  // MLB ア・リーグ (主要)
  { id: 'mlb_yankees',   league: 'MLB', team: 'NYY',   label: 'ヤンキース', primary: '#1e293b', secondary: '#0f172a', textColor: '#475569' },
  { id: 'mlb_redsox',    league: 'MLB', team: 'BOS',   label: 'レッドソックス', primary: '#dc2626', secondary: '#7f1d1d', textColor: '#f87171' },
  { id: 'mlb_bluejays',  league: 'MLB', team: 'TOR',   label: 'ブルージェイズ', primary: '#1e40af', secondary: '#0c4a6e', textColor: '#3b82f6' },
  { id: 'mlb_angels',    league: 'MLB', team: 'LAA',   label: 'エンゼルス', primary: '#dc2626', secondary: '#7f1d1d', textColor: '#f87171' },
  { id: 'mlb_mariners',  league: 'MLB', team: 'SEA',   label: 'マリナーズ', primary: '#0d9488', secondary: '#134e4a', textColor: '#2dd4bf' },
  // カスタム (空)
  { id: 'custom',        league: '',    team: '',      label: 'カスタム',   primary: '#6b7280', secondary: '#374151', textColor: '#9ca3af' },
];

export function getTeamPreset(id) {
  return TEAM_PRESETS.find(p => p.id === id) || TEAM_PRESETS[0];
}

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
