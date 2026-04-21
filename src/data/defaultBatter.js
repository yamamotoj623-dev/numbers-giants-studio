/**
 * 野手サンプルデータ（v5.0.0 スキーマ / UI確定版）
 * v4.24.0 からの追加フィールド: schemaVersion, layoutType, pattern, aspectRatio, audio, layoutData, se
 * v5.0.0 UI確定での追加: textSize（script毎にテロップサイズ指定可能）
 */

export const defaultBatterData = {
  schemaVersion: '5.0.0',
  layoutType: 'radar_compare',
  pattern: 'bad_news',
  aspectRatio: '9:16',
  playerType: 'batter',
  presentationMode: 'dialogue',
  theme: 'orange',
  period: '2026.04.14時点',
  audio: { bgmId: null, bgmVolume: 0.15, voiceVolume: 1.0, seVolume: 0.6 },
  mainPlayer: {
    name: '増田 陸', number: '61', label: '26年(今季)',
    stats: { pa: '29', ab: '29', avg: '.276', hr: '1', rbi: '4', ops: '.724' }
  },
  subPlayer: {
    name: '増田 陸', number: '61', label: '25年(昨季)',
    stats: { pa: '286', ab: '260', avg: '.231', hr: '5', rbi: '21', ops: '.598' }
  },
  radarStats: {
    isop:  { main: 65, sub: 40, label: '長打力' },
    isod:  { main: 10, sub: 30, label: '出塁力' },
    bb_k:  { main: 0,  sub: 35, label: '選球眼' },
    rc27:  { main: 55, sub: 30, label: '得点力' },
    ab_hr: { main: 55, sub: 30, label: 'HR率' },
  },
  layoutData: {},
  comparisons: [
    { id: 'rc27', label: 'RC27', kana: 'アールシーにじゅうなな', desc: '1試合得点貢献', formula: '得点能力の総合指標', criteria: '優秀: 6.0以上', radarMatch: '得点力', valMain: '4.60', valSub: '2.70', unit: '点', winner: 'main' },
    { id: 'isop', label: 'IsoP', kana: 'アイソピー', desc: '純粋な長打力', formula: '長打率 - 打率', criteria: '優秀: .200以上', radarMatch: '長打力', valMain: '.172', valSub: '.095', unit: '', winner: 'main' },
    { id: 'isod', label: 'IsoD', kana: 'アイソディー', desc: '選球眼による出塁', formula: '出塁率 - 打率', criteria: '優秀: .080以上', radarMatch: '出塁力', valMain: '.000', valSub: '.041', unit: '', winner: 'sub' },
    { id: 'bb_k', label: 'BB/K', kana: 'ビービーケー', desc: '四球/三振比', formula: '四球 ÷ 三振', criteria: '優秀: 1.0以上', radarMatch: '選球眼', valMain: '0.00', valSub: '0.21', unit: '', winner: 'sub' },
    { id: 'ab_hr', label: 'AB/HR', kana: 'エービー・エイチアール', desc: '本塁打率', formula: '打数 ÷ 本塁打', criteria: '優秀: 15.0以下', radarMatch: 'HR率', valMain: '29.0', valSub: '52.8', unit: '', winner: 'main' },
  ],
  scripts: [
    { id: 1, speaker: 'A', emoji: '👨‍🏫', text: '増田陸\n四球ゼロ\n【29打席】', speech: '増田陸四球ゼロ29打席です。', highlight: null, isCatchy: true, se: 'hook_impact' },
    { id: 2, speaker: 'B', emoji: '😲', text: 'ツーラン\n打ったのに！？', speech: 'え先日のディーエヌエー戦で同点ツーラン打ったのに。', highlight: null, textSize: 'm', se: null },
    { id: 3, speaker: 'A', emoji: '👨‍🏫', text: '長打は\n出ている\nでも内容が', speech: '確かに長打は出ているんです問題は内容です。', highlight: null, textSize: 'l', se: null },
    { id: 4, speaker: 'B', emoji: '🤔', text: '打率.276\n十分では？', speech: '打率もにわりななぶろくりんありますし十分じゃないですか。', highlight: null, textSize: 'l', se: null },
    { id: 5, speaker: 'A', emoji: '👨‍🏫', text: '純粋な長打力\n「IsoP」を\n見てください', speech: '純粋な長打力を示すアイソピーを見てください。', highlight: 'isop', textSize: 'm', se: 'highlight_ping' },
    { id: 6, speaker: 'B', emoji: '🧐', text: '長打率ー打率\nですね', speech: '長打率から打率を引いた指標ですね。', highlight: 'isop', textSize: 'l', se: null },
    { id: 7, speaker: 'A', emoji: '👨‍🏫', text: '昨季.095→\n今季【.172】\n大幅上昇', speech: '昨季のれいてんぜろきゅうごから今季はてんいちななに大幅上昇です。', highlight: 'isop', textSize: 'm', se: 'stat_reveal' },
    { id: 8, speaker: 'B', emoji: '🤯', text: 'ほぼ倍！\nすごい進化', speech: 'ほぼ倍すごい進化ですね。', highlight: 'isop', textSize: 'l', se: 'shock_hit' },
    { id: 9, speaker: 'A', emoji: '👨‍🏫', text: '出塁力の\n「IsoD」が\n深刻な課題', speech: 'しかし出塁力を測るアイソディーは深刻な課題です。', highlight: 'isod', textSize: 'm', se: 'warning_alert' },
    { id: 10, speaker: 'B', emoji: '😨', text: 'なんと\n【ゼロ】！？', speech: 'なんとゼロですか。', highlight: 'isod', textSize: 'l', se: 'shock_hit' },
    { id: 11, speaker: 'A', emoji: '👨‍🏫', text: '基準.080には\n程遠い', speech: '優秀な基準のれいてんぜろはちぜろとは程遠い数字です。', highlight: 'isod', textSize: 'l', se: null },
    { id: 12, speaker: 'B', emoji: '😯', text: '29打席\n四死球ゼロ\nなんですね', speech: '29打席すべて打数で四死球ゼロなんですね。', highlight: null, textSize: 'm', se: null },
    { id: 13, speaker: 'A', emoji: '👨‍🏫', text: '選球眼の\n「BB/K」も\nゼロです', speech: '選球眼を示すビービーケーも当然ゼロです。', highlight: 'bb_k', textSize: 'm', se: 'highlight_ping' },
    { id: 14, speaker: 'B', emoji: '🧐', text: 'ボール球に\n手を出しすぎ\nなんですね', speech: 'なるほどぼーるだまにも手を出しすぎなんですね。', highlight: 'bb_k', textSize: 'm', se: null },
    { id: 15, speaker: 'A', emoji: '👨‍🏫', text: '積極性は長所\n四球も武器', speech: '積極性は長所ですが四球も価値ある武器です。', highlight: null, textSize: 'l', se: null },
    { id: 16, speaker: 'B', emoji: '😆', text: '長打力は本物\n選球眼さえ\n身につけば', speech: '長打力は本物だから選球眼さえ身につけばと。', highlight: null, textSize: 'm', se: null },
    { id: 17, speaker: 'A', emoji: '👨‍🏫', text: '有利カウントで\n振る球を\n絞れば化ける', speech: 'カウント有利時に振るたまを絞れば化けます。', highlight: null, textSize: 'm', se: 'success_chime' },
    { id: 18, speaker: 'B', emoji: '🥰', text: 'スタメン定着\n楽しみですね', speech: 'スタメン定着十分ありそうで楽しみですね。', highlight: null, textSize: 'l', se: null },
    { id: 19, speaker: 'A', emoji: '👨‍🏫', text: '増田陸\n今季本塁打\n【何本】予想？', speech: 'あなたは増田陸今季の本塁打何本予想しますか。', highlight: null, textSize: 'm', se: null },
    { id: 20, speaker: 'B', emoji: '🥰', text: '私は10本！\n皆の予想も\nコメントで🥰', speech: '私は10本予想皆の予想もコメントで教えてください。', highlight: null, textSize: 'm', se: 'outro_fade' },
  ]
};
