/**
 * 投手サンプルデータ（v5.0.0 スキーマ）
 */

export const defaultPitcherData = {
  schemaVersion: '5.0.0',
  layoutType: 'radar_compare',
  pattern: 'awakening',
  aspectRatio: '9:16',
  playerType: 'pitcher',
  presentationMode: 'dialogue',
  theme: 'orange',
  period: '2026.04.13時点',
  audio: { bgmId: null, bgmVolume: 0.15, voiceVolume: 1.0, seVolume: 0.6 },
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
  layoutData: {},
  comparisons: [
    { id: 'fip',  label: 'DIPS', kana: 'ディップス',        desc: '守備から独立した防御率', formula: '本塁打・四死球・三振で評価',     criteria: 'エース級: 3.00以下',    radarMatch: 'DIPS(内容)',    valMain: '3.55', valSub: '3.31', unit: '', winner: 'sub' },
    { id: 'hr_9', label: 'HR/9', kana: 'エイチアールナイン', desc: '被本塁打率',              formula: '9イニングあたりの被本塁打',     criteria: '優秀: 0.80以下',         radarMatch: '本塁打回避',   valMain: '1.29', valSub: '0.96', unit: '本', winner: 'sub' },
    { id: 'bb_9', label: 'BB/9', kana: 'ビービーナイン',    desc: '与四球率',                formula: '9イニングあたりの与四球',       criteria: '非常に優秀: 2.00以下',   radarMatch: '制球力',       valMain: '0.00', valSub: '1.45', unit: '', winner: 'main' },
    { id: 'k_bb', label: 'K/BB', kana: 'ケービービー',      desc: '奪三振と与四球の比率',     formula: '奪三振 ÷ 与四球',               criteria: '優秀: 3.50以上',         radarMatch: '制圧力(K/BB)', valMain: 'MAX',  valSub: '4.78', unit: '', winner: 'main' },
    { id: 'k_9',  label: 'K/9',  kana: 'ケーナイン',        desc: '奪三振率',                formula: '9イニングあたりの奪三振',       criteria: '優秀: 8.0以上',          radarMatch: '奪三振力',     valMain: '6.43', valSub: '6.91', unit: '', winner: 'sub' },
  ],
  scripts: [
    { id: 1, speaker: 'A', emoji: '👨‍🏫', text: '則本昂大\n昨季とは\n完全に別人', speech: '則本昂大昨季とは完全に別人です。', highlight: null, isCatchy: true, se: 'hook_impact' },
    { id: 2, speaker: 'B', emoji: '🤩', text: '先発初登板\n7回無四球', speech: '先発転向初登板で7回無四球。', highlight: null, textSize: 'l', se: null },
    { id: 3, speaker: 'B', emoji: '🤩', text: '圧巻\nでしたね', speech: '圧巻でしたね。', highlight: null, textSize: 'l', se: null },
    { id: 4, speaker: 'A', emoji: '👨‍🏫', text: '昨季リリーフと\nスタイル激変', speech: '昨季のリリーフ時代とはスタイルが激変してます。', highlight: null, textSize: 'l', se: null },
    { id: 5, speaker: 'B', emoji: '🤔', text: 'どう\n変わった？', speech: 'どう変わったんですか。', highlight: null, textSize: 'l', se: null },
    { id: 6, speaker: 'A', emoji: '👨‍🏫', text: '奪三振率\n「K/9」を\n見ます', speech: '奪三振率を示すケーナインを見ます。', highlight: 'k_9', textSize: 'm', se: 'highlight_ping' },
    { id: 7, speaker: 'B', emoji: '😯', text: '昨季より\n下がってる', speech: 'むしろ昨季より下がってますね。', highlight: 'k_9', textSize: 'l', se: null },
    { id: 8, speaker: 'A', emoji: '👨‍🏫', text: '三振狙い\nではない\n投球に', speech: '三振を狙う投球ではなくなったんです。', highlight: 'k_9', textSize: 'm', se: null },
    { id: 9, speaker: 'A', emoji: '👨‍🏫', text: '最大の変化は\n制球力', speech: '最大の変化は制球力です。', highlight: 'bb_9', textSize: 'l', se: 'highlight_ping' },
    { id: 10, speaker: 'A', emoji: '👨‍🏫', text: '「BB/9」を\n見て', speech: 'ビービーナインを見てください。', highlight: 'bb_9', textSize: 'l', se: null },
    { id: 11, speaker: 'B', emoji: '🧐', text: '1試合の\n与四球率', speech: '1試合あたりの与四球率ですね。', highlight: 'bb_9', textSize: 'l', se: null },
    { id: 12, speaker: 'A', emoji: '👨‍🏫', text: '今季なんと\n【0.00】', speech: '今季はなんとぜろてんぜろぜろ。', highlight: 'bb_9', textSize: 'l', se: 'stat_reveal' },
    { id: 13, speaker: 'B', emoji: '🤯', text: '7回四球\n【ゼロ】', speech: '7回で四球ゼロ。', highlight: 'bb_9', textSize: 'l', se: 'shock_hit' },
    { id: 14, speaker: 'B', emoji: '🤯', text: '完璧\nすぎる！', speech: '完璧すぎるじゃないですか。', highlight: 'bb_9', textSize: 'l', se: null },
    { id: 15, speaker: 'A', emoji: '👨‍🏫', text: '「K/BB」は\n測定不能', speech: 'ケービービーは測定不能。', highlight: 'k_bb', textSize: 'l', se: 'highlight_ping' },
    { id: 16, speaker: 'A', emoji: '👨‍🏫', text: '【MAX】\n記録', speech: 'マックス値を記録しました。', highlight: 'k_bb', textSize: 'l', se: 'stat_reveal' },
    { id: 17, speaker: 'B', emoji: '😆', text: '四球自滅\n全く無し', speech: '四球からの自滅が全く無いんですね。', highlight: 'k_bb', textSize: 'l', se: null },
    { id: 18, speaker: 'A', emoji: '👨‍🏫', text: 'ただし\n弱点も', speech: 'ただし弱点もあります。', highlight: null, textSize: 'l', se: null },
    { id: 19, speaker: 'A', emoji: '👨‍🏫', text: '被弾率\n「HR/9」悪化', speech: '被弾率エイチアールナインが悪化してます。', highlight: 'hr_9', textSize: 'm', se: 'warning_alert' },
    { id: 20, speaker: 'B', emoji: '😨', text: '「DIPS」も\n実際より悪い', speech: 'ディップスも実際の防御率より悪い。', highlight: 'fip', textSize: 'l', se: null },
    { id: 21, speaker: 'A', emoji: '👨‍🏫', text: 'でも\n致命傷では', speech: 'でもこれは致命傷ではありません。', highlight: null, textSize: 'l', se: null },
    { id: 22, speaker: 'A', emoji: '👨‍🏫', text: '四球無く\nソロ被弾', speech: '四球が無いのでソロ被弾で済んでます。', highlight: null, textSize: 'm', se: null },
    { id: 23, speaker: 'B', emoji: '😲', text: 'WHIP\n【0.71】', speech: 'ウィップもぜろてんなないち。', highlight: null, textSize: 'l', se: 'success_chime' },
    { id: 24, speaker: 'B', emoji: '😲', text: '抜群の\n安定感', speech: '抜群の安定感ですね。', highlight: null, textSize: 'l', se: null },
    { id: 25, speaker: 'A', emoji: '👨‍🏫', text: '球数を抑え\n長いイニング', speech: '球数を抑え長いイニングを投げれてます。', highlight: null, textSize: 'm', se: null },
    { id: 26, speaker: 'A', emoji: '👨‍🏫', text: '先発への\n見事な適応', speech: '先発への見事な適応です。', highlight: null, textSize: 'l', se: null },
    { id: 27, speaker: 'B', emoji: '🥰', text: '戸郷離脱の\n穴を埋める', speech: '戸郷離脱の穴を埋める存在になりそう。', highlight: null, textSize: 'l', se: null },
    { id: 28, speaker: 'A', emoji: '👨‍🏫', text: '若手投手陣\nにも好影響', speech: '若手投手陣にも良い影響を与えます。', highlight: null, textSize: 'm', se: null },
    { id: 29, speaker: 'A', emoji: '👨‍🏫', text: '結論\n制球力で\n完全別人', speech: '結論は制球力で完全に別人投手です。', highlight: null, textSize: 'm', se: null },
    { id: 30, speaker: 'B', emoji: '🤩', text: 'リリーフ時代\nから脱皮', speech: 'リリーフ時代から完全に脱皮ですね。', highlight: null, textSize: 'l', se: null },
    { id: 31, speaker: 'A', emoji: '👨‍🏫', text: 'ローテ\n定着確実', speech: 'ローテーション定着は確実でしょう。', highlight: null, textSize: 'l', se: null },
    { id: 32, speaker: 'B', emoji: '🥰', text: '今後が\n楽しみ！', speech: '今後が本当に楽しみですね。', highlight: null, textSize: 'l', se: null },
    { id: 33, speaker: 'A', emoji: '👨‍🏫', text: '則本今季\n【何勝】\n期待？', speech: 'あなたは則本に今季何勝を期待しますか。', highlight: null, textSize: 'm', se: null },
    { id: 34, speaker: 'B', emoji: '🥰', text: '私は10勝！\n皆の予想は？', speech: '私は10勝予想皆の予想もコメントで教えて。', highlight: null, textSize: 'l', se: 'outro_fade' },
  ]
};
