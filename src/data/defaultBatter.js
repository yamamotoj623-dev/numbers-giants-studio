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
    { id: 2, speaker: 'B', emoji: '😲', text: 'え！？\nホント？', speech: 'え本当ですか。', highlight: null, textSize: 'xl', se: null },
    { id: 3, speaker: 'B', emoji: '🤔', text: 'ツーラン\n打ったのに', speech: 'でもこの前ディーエヌエー戦で同点ツーラン打ちましたよ。', highlight: null, textSize: 'l', se: null },
    { id: 4, speaker: 'A', emoji: '👨‍🏫', text: '長打は本物\nでも内容が', speech: '確かに長打は本物ですでも中身に問題があります。', highlight: null, textSize: 'l', se: null },
    { id: 5, speaker: 'B', emoji: '😤', text: '打率.276\n十分では？', speech: '打率にわりななぶろくりんありますよ十分じゃないですか。', highlight: null, textSize: 'l', se: null },
    { id: 6, speaker: 'A', emoji: '👨‍🏫', text: '打率だけでは\n見抜けない', speech: '打率だけでは長打力は見抜けません。', highlight: null, textSize: 'm', se: null },
    { id: 7, speaker: 'A', emoji: '👨‍🏫', text: '「IsoP」を\n見ます', speech: '純粋長打力の指標アイソピーを見てください。', highlight: 'isop', textSize: 'l', se: 'highlight_ping' },
    { id: 8, speaker: 'B', emoji: '🧐', text: '長打率\n−打率', speech: '長打率から打率を引いた数字ですね。', highlight: 'isop', textSize: 'l', se: null },
    { id: 9, speaker: 'A', emoji: '👨‍🏫', text: '昨季は\n.095', speech: '昨季はれいてんぜろきゅうごでした。', highlight: 'isop', textSize: 'l', se: null },
    { id: 10, speaker: 'A', emoji: '👨‍🏫', text: '今季\n【.172】', speech: '今季はてんいちななにです。', highlight: 'isop', textSize: 'xl', se: 'stat_reveal' },
    { id: 11, speaker: 'B', emoji: '🤯', text: 'ほぼ倍！\nすごい', speech: 'ほぼ倍じゃないですかすごい。', highlight: 'isop', textSize: 'xl', se: 'shock_hit' },
    { id: 12, speaker: 'A', emoji: '👨‍🏫', text: '長打スタイル\nに変身', speech: 'バッティングが完全に長打スタイルに進化しました。', highlight: 'isop', textSize: 'm', se: null },
    { id: 13, speaker: 'B', emoji: '😊', text: 'じゃあ\n問題なし？', speech: 'じゃあ問題ないんじゃないですか。', highlight: null, textSize: 'l', se: null },
    { id: 14, speaker: 'A', emoji: '👨‍🏫', text: 'そこに落とし穴\nがあります', speech: 'ここに大きな落とし穴があるんです。', highlight: null, textSize: 'm', se: 'warning_alert' },
    { id: 15, speaker: 'A', emoji: '👨‍🏫', text: '「IsoD」\n出塁力', speech: '次は出塁力の指標アイソディーを見ます。', highlight: 'isod', textSize: 'l', se: 'highlight_ping' },
    { id: 16, speaker: 'B', emoji: '🧐', text: '出塁率\n−打率', speech: '出塁率から打率を引いた数字ですね。', highlight: 'isod', textSize: 'l', se: null },
    { id: 17, speaker: 'A', emoji: '👨‍🏫', text: 'なんと\n【.000】', speech: '今季はなんとれいてんれいれいれいです。', highlight: 'isod', textSize: 'xl', se: 'stat_reveal' },
    { id: 18, speaker: 'B', emoji: '😨', text: 'ゼロ！？\nマジ？', speech: 'えゼロですか本当に。', highlight: 'isod', textSize: 'xl', se: 'shock_hit' },
    { id: 19, speaker: 'A', emoji: '👨‍🏫', text: '基準は\n.080以上', speech: '優秀な基準はれいてんぜろはち以上です。', highlight: 'isod', textSize: 'l', se: null },
    { id: 20, speaker: 'B', emoji: '😰', text: '程遠い\nですね', speech: '基準から程遠いですね。', highlight: 'isod', textSize: 'l', se: null },
    { id: 21, speaker: 'A', emoji: '👨‍🏫', text: '29打席で\n四死球ゼロ', speech: '29打席すべてで四死球がありません。', highlight: null, textSize: 'm', se: null },
    { id: 22, speaker: 'B', emoji: '😲', text: '初球から\n振ってる？', speech: '初球からどんどん振ってるんでしょうか。', highlight: null, textSize: 'm', se: null },
    { id: 23, speaker: 'A', emoji: '👨‍🏫', text: '選球眼\n「BB/K」も', speech: '選球眼を示すビービーケーも見てみましょう。', highlight: 'bb_k', textSize: 'm', se: 'highlight_ping' },
    { id: 24, speaker: 'A', emoji: '👨‍🏫', text: '四球÷三振\nで算出', speech: '四球を三振で割った指標です。', highlight: 'bb_k', textSize: 'l', se: null },
    { id: 25, speaker: 'A', emoji: '👨‍🏫', text: 'こちらも\n【0.00】', speech: 'こちらも当然ぜろてんぜろぜろです。', highlight: 'bb_k', textSize: 'l', se: 'stat_reveal' },
    { id: 26, speaker: 'B', emoji: '🤔', text: 'ボール球も\n振ってる？', speech: 'もしかしてぼーるだまにも手を出してますか。', highlight: 'bb_k', textSize: 'm', se: null },
    { id: 27, speaker: 'A', emoji: '👨‍🏫', text: '積極性が\n裏目に', speech: '積極性がいまは裏目に出ています。', highlight: null, textSize: 'l', se: null },
    { id: 28, speaker: 'B', emoji: '🥲', text: '攻め過ぎ\nってこと？', speech: '攻め過ぎってことですか。', highlight: null, textSize: 'l', se: null },
    { id: 29, speaker: 'A', emoji: '👨‍🏫', text: '四球も\n「武器」', speech: '四球もバッターにとっては立派な武器です。', highlight: null, textSize: 'l', se: null },
    { id: 30, speaker: 'A', emoji: '👨‍🏫', text: '1試合\n1四球分', speech: '1試合1四球増えるだけで打点も増えます。', highlight: null, textSize: 'l', se: null },
    { id: 31, speaker: 'B', emoji: '🧐', text: 'なるほど\n大事だ', speech: 'なるほど四球って大事なんですね。', highlight: null, textSize: 'l', se: null },
    { id: 32, speaker: 'A', emoji: '👨‍🏫', text: '長打力は\n本物です', speech: 'ただし長打力は本物です。', highlight: null, textSize: 'l', se: null },
    { id: 33, speaker: 'B', emoji: '🥹', text: '選球眼さえ\n身につけば', speech: '選球眼さえ身につけば完璧ですね。', highlight: null, textSize: 'm', se: null },
    { id: 34, speaker: 'A', emoji: '👨‍🏫', text: '3ボール時\n振らない', speech: 'まずさんぼーる時は振らないことから。', highlight: null, textSize: 'l', se: null },
    { id: 35, speaker: 'A', emoji: '👨‍🏫', text: '有利カウントで\n球を絞る', speech: '有利なカウントで振るたまを絞りましょう。', highlight: null, textSize: 'm', se: 'success_chime' },
    { id: 36, speaker: 'B', emoji: '🤩', text: 'これで\n化ける！', speech: 'これで一気に化けるかもしれませんね。', highlight: null, textSize: 'xl', se: null },
    { id: 37, speaker: 'A', emoji: '👨‍🏫', text: 'レギュラー\n定着も見える', speech: 'レギュラー定着も十分見えてきます。', highlight: null, textSize: 'm', se: null },
    { id: 38, speaker: 'B', emoji: '🥰', text: '楽しみ！\n期待大', speech: '楽しみですね期待してます。', highlight: null, textSize: 'l', se: null },
    { id: 39, speaker: 'A', emoji: '👨‍🏫', text: '増田陸\n今季HR予想', speech: 'あなたは増田陸今季の本塁打何本予想しますか。', highlight: null, textSize: 'm', se: null },
    { id: 40, speaker: 'B', emoji: '🥰', text: '私は10本！\nコメントで🥰', speech: '私は10本予想皆さんの予想もコメントで教えてください。', highlight: null, textSize: 'm', se: 'outro_fade' },
  ]
};
