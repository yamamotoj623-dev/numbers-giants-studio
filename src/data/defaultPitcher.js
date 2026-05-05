/**
 * 投手サンプルデータ（v5.0.0 スキーマ）
 */

export const defaultPitcherData = {
  schemaVersion: '5.0.0',
  layoutType: 'radar_compare',
  pattern: 'awakening',
  hookAnimation: 'zoom',  // 選択可: pop / shake / slide / zoom / fade
  aspectRatio: '9:16',
  playerType: 'pitcher',
  silhouetteType: 'pitcher_right',  // 選択可: pitcher_right / pitcher_left / pitcher_set / catcher
  presentationMode: 'dialogue',
  theme: 'orange',
  // ★v5.20.13★ チームプリセット (リーグ・チーム・カラー) — UI から切替可能
  teamPreset: 'npb_giants',
  period: '2026.04.13時点',
  // ★v5.18.0★ Gemini提言: シームレスループ
  smartLoop: true,
  audio: { bgmId: null, bgmVolume: 0.15, voiceVolume: 1.4, seVolume: 0.6, duckingAmount: 0.5 },
  outroCta: {
    title: '則本の今季',
    big: '何勝',
    suffix: 'いける？'
  },
  mainPlayer: {
    name: '則本 昂大', number: '43', label: '26年(今季)',
    stats: { g: '1', ip: '7.0', era: '2.57', win: '0', lose: '0', sv: '0', hld: '0', so: '5', whip: '0.71' }
  },
  subPlayer: {
    name: '則本 昂大', number: '14', label: '25年(昨季)',
    stats: { g: '56', ip: '56.0', era: '3.05', win: '3', lose: '2', sv: '32', hld: '5', so: '43', whip: '1.43' }
  },
  radarStats: {
    fip:  { main: 55,  sub: 65, label: 'DIPS(内容)' },
    hr_9: { main: 40,  sub: 70, label: '本塁打回避' },
    bb_9: { main: 100, sub: 80, label: '制球力' },
    k_bb: { main: 100, sub: 85, label: '制圧力(K/BB)' },
    k_9:  { main: 55,  sub: 60, label: '奪三振力' },
  },
  layoutData: {
    timeline: {
      unit: 'season',
      metric: 'BB/9',
      points: [
        { label: '24年', main: 1.85, sub: 1.85, highlight: false },
        { label: '25年', main: 1.45, sub: 1.45, highlight: false },
        { label: '26年4月', main: 0.50, sub: 1.45, highlight: false },
        { label: '初登板', main: 0.00, sub: 1.45, highlight: true },
      ],
    },
    arsenal: {
      pitches: [
        { name: 'ストレート', pct: 48, avg: 0.205, velocity: 152, color: '#ef4444' },
        { name: 'スプリット', pct: 22, avg: 0.150, velocity: 138, color: '#3b82f6' },
        { name: 'スライダー', pct: 18, avg: 0.180, velocity: 132, color: '#10b981' },
        { name: 'カーブ', pct: 8, avg: 0.250, velocity: 118, color: '#f59e0b' },
        { name: 'チェンジアップ', pct: 4, avg: 0.300, velocity: 128, color: '#a855f7' },
      ],
    },
  },
  comparisons: [
    { id: 'fip',  label: 'DIPS', kana: 'ディップス',        desc: '守備から独立した防御率', formula: '本塁打・四死球・三振で評価',     criteria: 'エース級: 3.00以下',    radarMatch: 'DIPS(内容)',    valMain: '3.55', valSub: '3.31', unit: '', winner: 'sub' },
    { id: 'hr_9', label: 'HR/9', kana: 'エイチアールナイン', desc: '被本塁打率',              formula: '9イニングあたりの被本塁打',     criteria: '優秀: 0.80以下',         radarMatch: '本塁打回避',   valMain: '1.29', valSub: '0.96', unit: '本', winner: 'sub' },
    { id: 'bb_9', label: 'BB/9', kana: 'ビービーナイン',    desc: '与四球率',                formula: '9イニングあたりの与四球',       criteria: '非常に優秀: 2.00以下',   radarMatch: '制球力',       valMain: '0.00', valSub: '1.45', unit: '', winner: 'main' },
    { id: 'k_bb', label: 'K/BB', kana: 'ケービービー',      desc: '奪三振と与四球の比率',     formula: '奪三振 ÷ 与四球',               criteria: '優秀: 3.50以上',         radarMatch: '制圧力(K/BB)', valMain: 'MAX',  valSub: '4.78', unit: '', winner: 'main' },
    { id: 'k_9',  label: 'K/9',  kana: 'ケーナイン',        desc: '奪三振率',                formula: '9イニングあたりの奪三振',       criteria: '優秀: 8.0以上',          radarMatch: '奪三振力',     valMain: '6.43', valSub: '6.91', unit: '', winner: 'sub' },
  ],
  scripts: [
    // ===== フック =====
    { id: 1, speaker: 'A', emoji: '👨‍🏫', text: '則本昂大\n昨季とは\n完全に別人です', speech: '則本昂大昨季とは完全に別人です。', highlight: null, isCatchy: true, se: 'hook_impact' },

    // ===== 平常: 導入 =====
    { id: 2, speaker: 'B', emoji: '🤩', text: '先発転向の初登板で\n7回無四球', speech: '先発転向の初登板で7回無四球。', highlight: null, textSize: 's', se: null },
    { id: 3, speaker: 'B', emoji: '🤩', text: '圧巻でしたね', speech: '圧巻でしたね。', highlight: null, textSize: 'l', se: null },
    { id: 4, speaker: 'A', emoji: '👨‍🏫', text: '昨季のリリーフ時代と\nスタイルが激変\nしてます', speech: '昨季のリリーフ時代とスタイルが激変してます。', highlight: null, textSize: 's', se: null },
    { id: 5, speaker: 'B', emoji: '🤔', text: 'どう\n変わったんですか？', speech: 'どう変わったんですか。', highlight: null, textSize: 'm', se: null },

    // ===== ハイライト1: K/9 =====
    { id: 6, speaker: 'A', emoji: '👨‍🏫', text: '奪三振率を示す\n「K/9」を見ます', speech: '奪三振率を示すケーナインを見ます。', highlight: 'k_9', textSize: 'm', se: 'highlight_ping' },
    { id: 7, speaker: 'B', emoji: '😯', text: 'むしろ昨季より\n下がってますね', speech: 'むしろ昨季より下がってますね。', highlight: 'k_9', textSize: 'm', se: null },
    { id: 8, speaker: 'A', emoji: '👨‍🏫', text: '三振を狙う投球では\nなくなったんです', speech: '三振を狙う投球ではなくなったんです。', highlight: 'k_9', textSize: 's', se: null },

    // ===== ハイライト2: BB/9 (★ここでtimeline切替、制球力推移) =====
    { id: 9, speaker: 'A', emoji: '👨‍🏫', layoutType: 'timeline', text: '最大の変化は\n制球力です', speech: '最大の変化は制球力です。', highlight: 'bb_9', textSize: 'm', se: 'transition_swoosh' },
    { id: 10, speaker: 'A', emoji: '👨‍🏫', text: '「BB/9」を\n見てください', speech: 'ビービーナインを見てください。', highlight: 'bb_9', textSize: 'm', se: null },
    { id: 11, speaker: 'B', emoji: '🧐', text: '1試合あたりの\n与四球率ですね', speech: '1試合あたりの与四球率ですね。', highlight: 'bb_9', textSize: 'm', se: null },
    { id: 12, speaker: 'A', emoji: '👨‍🏫', text: '今季はなんと\n【0.00】です', speech: '今季はなんとぜろてんぜろぜろです。', highlight: 'bb_9', textSize: 'm', se: 'stat_reveal' },
    { id: 13, speaker: 'B', emoji: '🤯', text: '7回投げて\n四球ゼロですか', speech: '7回投げて四球ゼロですか。', highlight: 'bb_9', textSize: 'm', se: 'shock_hit' },
    { id: 14, speaker: 'B', emoji: '🤯', text: '完璧すぎますよ', speech: '完璧すぎますよ。', highlight: 'bb_9', textSize: 'l', se: null },

    // ===== ハイライト3: K/BB =====
    { id: 15, speaker: 'A', emoji: '👨‍🏫', text: '「K/BB」は\n測定不能', speech: 'ケービービーは測定不能。', highlight: 'k_bb', textSize: 'm', se: 'highlight_ping' },
    { id: 16, speaker: 'A', emoji: '👨‍🏫', text: '【MAX】値を\n記録しました', speech: 'マックス値を記録しました。', highlight: 'k_bb', textSize: 'm', se: 'stat_reveal' },
    { id: 17, speaker: 'B', emoji: '😆', text: '四球からの自滅が\n全く無いんですね', speech: '四球からの自滅が全く無いんですね。', highlight: 'k_bb', textSize: 's', se: null },

    // ===== ハイライト4: HR/9 (★ここでpitch_arsenal切替、球種別の被打率) =====
    { id: 18, speaker: 'A', emoji: '👨‍🏫', layoutType: 'pitch_arsenal', text: 'ただし\n弱点もあります', speech: 'ただし弱点もあります。', highlight: null, textSize: 'm', se: 'transition_swoosh' },
    { id: 19, speaker: 'A', emoji: '👨‍🏫', text: '被弾率の\n「HR/9」が\n悪化してます', speech: '被弾率のエイチアールナインが悪化してます。', highlight: 'hr_9', textSize: 's', se: 'warning_alert' },
    { id: 20, speaker: 'B', emoji: '😨', text: '「DIPS」も実際の\n防御率より悪いですね', speech: 'ディップスも実際の防御率より悪いですね。', highlight: 'fip', textSize: 's', se: null },

    // ===== 平常: 擁護 =====
    { id: 21, speaker: 'A', emoji: '👨‍🏫', text: 'でもこれは\n致命傷では\nありません', speech: 'でもこれは致命傷ではありません。', highlight: null, textSize: 'm', se: null },
    { id: 22, speaker: 'A', emoji: '👨‍🏫', text: '四球がないので\nソロ被弾で\n済んでます', speech: '四球がないのでソロ被弾で済んでます。', highlight: null, textSize: 's', se: null },
    { id: 23, speaker: 'B', emoji: '😲', text: 'WHIPも【0.71】', speech: 'ウィップもぜろてんなないち。', highlight: null, textSize: 'm', se: 'success_chime' },
    { id: 24, speaker: 'B', emoji: '😲', text: '抜群の安定感\nですね', speech: '抜群の安定感ですね。', highlight: null, textSize: 'm', se: null },

    // ===== 総括と展望 =====
    { id: 25, speaker: 'A', emoji: '👨‍🏫', text: '球数を抑えて\n長いイニングを\n投げれてます', speech: '球数を抑えて長いイニングを投げれてます。', highlight: null, textSize: 's', se: null },
    { id: 26, speaker: 'A', emoji: '👨‍🏫', text: '先発への\n見事な適応です', speech: '先発への見事な適応です。', highlight: null, textSize: 'm', se: null },
    { id: 27, speaker: 'B', emoji: '🥰', text: '戸郷離脱の穴を\n埋める存在に\nなりそうです', speech: '戸郷離脱の穴を埋める存在になりそうです。', highlight: null, textSize: 's', se: null },
    { id: 28, speaker: 'A', emoji: '👨‍🏫', text: '若手投手陣にも\n好影響を与えます', speech: '若手投手陣にも好影響を与えます。', highlight: null, textSize: 's', se: null },

    // ===== 結論 =====
    { id: 29, speaker: 'A', emoji: '👨‍🏫', text: '結論\n制球力で完全に\n別人投手に\nなりました', speech: '結論。制球力で完全に別人投手になりました。', highlight: null, textSize: 's', se: null },
    { id: 30, speaker: 'B', emoji: '🤩', text: 'リリーフ時代から\n完全に脱皮ですね', speech: 'リリーフ時代から完全に脱皮ですね。', highlight: null, textSize: 's', se: null },
    { id: 31, speaker: 'A', emoji: '👨‍🏫', text: 'ローテーション定着は\n確実でしょう', speech: 'ローテーション定着は確実でしょう。', highlight: null, textSize: 's', se: null },
    { id: 32, speaker: 'B', emoji: '🥰', text: '今後が本当に\n楽しみですね', speech: '今後が本当に楽しみですね。', highlight: null, textSize: 'm', se: null },

    // ===== アウトロ (二択疑問でブツ切り) =====
    { id: 33, speaker: 'A', emoji: '👨‍🏫', text: '今季の則本\n何勝予想?', speech: '今季の則本何勝予想。', highlight: null, textSize: 'm', se: null },
    { id: 34, speaker: 'B', emoji: '🤔', text: '【10勝?\n15勝?】', speech: 'じゅっしょうか。じゅうごしょうか。', highlight: null, textSize: 'l', se: 'outro_fade' },
  ]
};
