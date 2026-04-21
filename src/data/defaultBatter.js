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
    // ===== フック (id:1) =====
    { id: 1, speaker: 'A', emoji: '👨‍🏫', text: '増田陸
四球ゼロ
【29打席】', speech: '増田陸四球ゼロ29打席です。', highlight: null, isCatchy: true, se: 'hook_impact' },

    // ===== 平常: 導入 =====
    { id: 2, speaker: 'B', emoji: '😲', text: '先日の「DeNA戦」で
同点ツーラン
打ったのに！？', speech: '先日のディーエヌエー戦で同点ツーラン打ったのに。', highlight: null, textSize: 's', se: null },
    { id: 3, speaker: 'A', emoji: '👨‍🏫', text: '確かに長打は本物
でも中身に注目', speech: '確かに長打は本物。でも中身に注目してください。', highlight: null, textSize: 'm', se: null },
    { id: 4, speaker: 'B', emoji: '🤔', text: '打率も【.276】
ありますよね？', speech: '打率もにわりななぶろくりんありますよね。', highlight: null, textSize: 'm', se: null },
    { id: 5, speaker: 'A', emoji: '👨‍🏫', text: '数字だけ見ると
そう見えますが', speech: '数字だけ見るとそう見えるんです。', highlight: null, textSize: 'm', se: null },

    // ===== ハイライト1: IsoP (長打力が本物) =====
    { id: 6, speaker: 'A', emoji: '👨‍🏫', text: '長打力を示す
「IsoP」を
見てください', speech: '純粋な長打力を示すアイソピーを見てください。', highlight: 'isop', textSize: 's', se: 'highlight_ping' },
    { id: 7, speaker: 'B', emoji: '🧐', text: '長打率から打率を
引いた値ですね', speech: '長打率から打率を引いた値ですね。', highlight: 'isop', textSize: 'm', se: null },
    { id: 8, speaker: 'A', emoji: '👨‍🏫', text: '昨季【.095】が', speech: '昨季はれいてんぜろきゅうご。', highlight: 'isop', textSize: 'l', se: 'stat_reveal' },
    { id: 9, speaker: 'A', emoji: '👨\u200d🏫', text: '今季【.172】に\n大幅上昇', speech: '今季はてんいちななにまで大幅上昇です。', highlight: 'isop', textSize: 'm', se: 'stat_reveal' },
    { id: 10, speaker: 'B', emoji: '🤯', text: 'ほぼ倍
すごい進化！', speech: 'ほぼ倍じゃないですか。すごい進化ですね。', highlight: 'isop', textSize: 'l', se: 'shock_hit' },
    { id: 11, speaker: 'A', emoji: '👨‍🏫', text: '優秀基準【.200】
まであと一歩', speech: '優秀基準のれいてんにぜろぜろまであと一歩です。', highlight: 'isop', textSize: 'm', se: null },

    // ===== 平常: ブリッジ =====
    { id: 12, speaker: 'B', emoji: '😯', text: 'じゃあ問題は
何なんですか？', speech: 'じゃあ何が問題なんですか。', highlight: null, textSize: 'm', se: null },
    { id: 13, speaker: 'A', emoji: '👨‍🏫', text: '出塁力が
致命的です', speech: '出塁力が致命的なんです。', highlight: null, textSize: 'l', se: null },

    // ===== ハイライト2: IsoD (致命的弱点) =====
    { id: 14, speaker: 'A', emoji: '👨‍🏫', text: '出塁力を示す
「IsoD」', speech: '出塁力を測るアイソディーを見ます。', highlight: 'isod', textSize: 'm', se: 'highlight_ping' },
    { id: 15, speaker: 'B', emoji: '🧐', text: '出塁率から打率を
引いた値ですね', speech: '出塁率から打率を引いた値ですね。', highlight: 'isod', textSize: 'm', se: null },
    { id: 16, speaker: 'A', emoji: '👨‍🏫', text: '今季なんと【.000】', speech: '今季はなんとぜろてんぜろぜろぜろ。', highlight: 'isod', textSize: 'm', se: 'warning_alert' },
    { id: 17, speaker: 'B', emoji: '😨', text: '『ゼロ』！？
おかしいですよ', speech: 'ゼロですか。おかしいですよ。', highlight: 'isod', textSize: 'm', se: 'shock_hit' },
    { id: 18, speaker: 'A', emoji: '👨‍🏫', text: '優秀基準は【.080】', speech: '優秀基準はれいてんぜろはちぜろ。', highlight: 'isod', textSize: 'l', se: null },
    { id: 19, speaker: 'A', emoji: '👨‍🏫', text: '程遠い数字です', speech: '程遠い数字です。', highlight: 'isod', textSize: 'l', se: null },
    { id: 20, speaker: 'B', emoji: '😯', text: '29打席で
四死球ゼロ
なんですね', speech: 'にじゅうきゅう打席で四死球ゼロなんですね。', highlight: null, textSize: 'm', se: null },

    // ===== ハイライト3: BB/K (選球眼) =====
    { id: 21, speaker: 'A', emoji: '👨‍🏫', text: '選球眼の
「BB/K」も当然', speech: '選球眼を示すビービーケーも当然です。', highlight: 'bb_k', textSize: 'm', se: 'highlight_ping' },
    { id: 22, speaker: 'A', emoji: '👨‍🏫', text: '四球を三振で
割った比率', speech: '四球を三振で割った比率ですね。', highlight: 'bb_k', textSize: 'm', se: null },
    { id: 23, speaker: 'A', emoji: '👨‍🏫', text: '今季も【0.00】', speech: '今季もぜろてんぜろぜろ。', highlight: 'bb_k', textSize: 'l', se: 'stat_reveal' },
    { id: 24, speaker: 'B', emoji: '🧐', text: 'ボール球にも
手を出しすぎ
なんですね', speech: 'ぼーるだまにも手を出しすぎてるんですね。', highlight: 'bb_k', textSize: 's', se: null },

    // ===== 平常: 反論擁護 =====
    { id: 25, speaker: 'A', emoji: '👨‍🏫', text: '積極性は長所
ですが', speech: '積極性は長所です。ですが。', highlight: null, textSize: 'm', se: null },
    { id: 26, speaker: 'A', emoji: '👨‍🏫', text: '四球も価値ある
武器なんです', speech: '四球も価値ある武器なんです。', highlight: null, textSize: 'm', se: null },
    { id: 27, speaker: 'B', emoji: '😆', text: '長打力は本物
だから…', speech: '長打力は本物ですしね。', highlight: null, textSize: 'l', se: null },
    { id: 28, speaker: 'B', emoji: '🥹', text: '選球眼さえ
身につけば', speech: '選球眼さえ身につけば。', highlight: null, textSize: 'm', se: null },
    { id: 29, speaker: 'A', emoji: '👨‍🏫', text: '有利カウントで
球を絞れば', speech: 'カウント有利時に振る球を絞れば。', highlight: null, textSize: 'm', se: 'success_chime' },
    { id: 30, speaker: 'A', emoji: '👨‍🏫', text: '必ず化けます', speech: '必ず化けます。', highlight: null, textSize: 'l', se: null },
    { id: 31, speaker: 'B', emoji: '🥰', text: 'スタメン定着
楽しみですね！', speech: 'スタメン定着楽しみですね。', highlight: null, textSize: 'm', se: null },

    // ===== 結論 =====
    { id: 32, speaker: 'A', emoji: '👨‍🏫', text: '結論
四球を覚えれば
一流打者へ', speech: '結論。四球を覚えれば一流打者へ進化します。', highlight: null, textSize: 's', se: null },
    { id: 33, speaker: 'B', emoji: '🤩', text: '今後に期待
大ですね！', speech: '今後に期待大ですね。', highlight: null, textSize: 'm', se: null },

    // ===== アウトロ =====
    { id: 34, speaker: 'A', emoji: '👨‍🏫', text: '増田陸の今季
本塁打【何本】
予想しますか？', speech: 'あなたは増田陸今季の本塁打何本予想しますか。', highlight: null, textSize: 's', se: null },
    { id: 35, speaker: 'B', emoji: '🥰', text: '私は10本予想！
皆さんの予想も
コメントで🥰', speech: '私はじゅっぽん予想。皆さんの予想もコメントで教えてください。', highlight: null, textSize: 's', se: 'outro_fade' },
  ]
};
