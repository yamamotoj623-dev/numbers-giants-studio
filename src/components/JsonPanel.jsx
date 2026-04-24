/**
 * JSON 入出力パネル
 * - AI プロンプト生成（v5.0.0 スキーマ対応 / UI確定版）
 *   - 4フェーズ表示モデル（フック/平常/ハイライト/アウトロ）対応
 *   - 話者配置（a=左オレンジ / b=右水色）対応
 *   - テロップサイズ階層（xl/l/m/s）対応
 *   - パターン連動のフック出現アニメ（ポップ/シェイク）対応
 *   - highlight詳細スキーマ対応（計算式/WHY/基準/勝者指定）
 * - 貼り付け＆反映、手動反映、クリア
 * - JSONエディタ
 */

import React, { useState, useEffect } from 'react';
import { Code, AlertCircle, Sparkles, Check, Trash2, ClipboardPaste } from 'lucide-react';
import { LAYOUT_TYPES, VIDEO_PATTERNS } from '../lib/config';
import { defaultBatterData } from '../data/defaultBatter';
import { defaultPitcherData } from '../data/defaultPitcher';

export function JsonPanel({ projectData, onApply, onLoadTemplate }) {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setJsonInput(JSON.stringify(projectData, null, 2));
  }, [projectData]);

  const flash = (msg) => {
    setCopyStatus(msg);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const tryApply = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed.scripts || !parsed.mainPlayer) throw new Error('必須フィールド(scripts / mainPlayer)がありません');
      if (!parsed.schemaVersion) parsed.schemaVersion = '5.0.0';
      if (!parsed.layoutType) parsed.layoutType = 'radar_compare';
      if (!parsed.aspectRatio) parsed.aspectRatio = '9:16';
      if (!parsed.audio) parsed.audio = { bgmId: null, bgmVolume: 0.15, voiceVolume: 1.0, seVolume: 0.6 };
      if (!parsed.layoutData) parsed.layoutData = {};
      onApply(parsed);
      setJsonError('');
      return true;
    } catch (e) {
      setJsonError(e.message);
      return false;
    }
  };

  const handleApply = () => {
    if (tryApply(jsonInput)) flash('反映しました');
  };

  const handlePasteAndApply = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      if (tryApply(text)) flash('貼り付けて反映しました');
    } catch {
      setJsonError('クリップボードの読み取り権限がありません。下のエリアに直接ペーストしてください。');
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setJsonError('');
  };

  const handleCopyAIPrompt = () => {
    const template = projectData.playerType === 'batter' ? defaultBatterData : defaultPitcherData;
    const prompt = buildAIPrompt(projectData, template);

    const textArea = document.createElement('textarea');
    textArea.value = prompt;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      flash('AIプロンプトをコピーしました！Geminiに貼り付けてください');
    } catch {
      setJsonError('クリップボードへのコピーに失敗しました');
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onLoadTemplate('batter')}
          className={`flex-1 text-xs font-bold py-2 rounded transition border shadow-sm ${projectData.playerType === 'batter' ? 'bg-orange-50 text-orange-700 border-orange-300' : 'bg-white text-zinc-600 border-zinc-200'}`}
        >
          ⚾ 野手テンプレ
        </button>
        <button
          onClick={() => onLoadTemplate('pitcher')}
          className={`flex-1 text-xs font-bold py-2 rounded transition border shadow-sm ${projectData.playerType === 'pitcher' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-zinc-600 border-zinc-200'}`}
        >
          ⚾ 投手テンプレ
        </button>
      </div>

      <button
        onClick={handleCopyAIPrompt}
        className="w-full mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition transform active:scale-[0.98]"
      >
        <Sparkles size={16}/> 🤖 AIプロンプトを作成＆コピー
      </button>

      <div className="flex gap-2 mb-2">
        <button onClick={handleClear} className="flex-[0.5] bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold py-2 rounded shadow-sm flex items-center justify-center gap-1 transition">
          <Trash2 size={14}/> クリア
        </button>
        <button onClick={handlePasteAndApply} className="flex-[1] bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold py-2 rounded shadow-sm flex items-center justify-center gap-1 transition">
          <ClipboardPaste size={14}/> 貼り付けて反映
        </button>
        <button onClick={handleApply} className="flex-[0.8] bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded shadow-sm flex items-center justify-center gap-1 transition">
          <Check size={14}/> 手動で反映
        </button>
      </div>

      {copyStatus && <div className="text-emerald-600 text-[10px] font-bold text-center mb-2 animate-pulse">{copyStatus}</div>}
      {jsonError && <div className="text-red-500 text-[10px] font-bold mb-2 flex items-center gap-1 bg-red-50 p-2 rounded"><AlertCircle size={12}/> {jsonError}</div>}

      <textarea
        className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar shadow-inner min-h-[300px]"
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        spellCheck="false"
      />
    </div>
  );
}

function buildAIPrompt(currentData, templateData) {
  const playerTypeLabel = currentData.playerType === 'batter' ? '野手' : currentData.playerType === 'pitcher' ? '投手' : 'チーム';

  const numericRules = currentData.playerType === 'batter'
    ? '・打率/出塁率/長打率 (.250, .350): 「にわり・ごぶ」のように【割・分・厘】で記述\n'
    + '・OPSやIsoPなど (.850, .172): 「てんはちごーぜろ」「てんいちななに」\n'
    + '・指標名: IsoP→アイソピー、BB/K→ビービーケー、RC27→アールシーにじゅうなな'
    : '・防御率やFIP (2.15, 3.50): 「にてんいちご」「さんてんごぜろ」\n'
    + '・K/BBやK/9など (7.00, 10.80): 「ななてんぜろぜろ」「じゅってんはちぜろ」\n'
    + '・指標名: FIP→フィップ、K/BB→ケービービー、WHIP→ウィップ、HR/9→エイチアールナイン';

  const layoutList = Object.entries(LAYOUT_TYPES)
    .map(([key, info]) => `  ・${key}: ${info.label} (${info.desc})${info.status === 'planned' ? ' ※実装予定' : ''}`)
    .join('\n');

  const patternList = VIDEO_PATTERNS.map(p => `  ・${p.id} / ${p.label}: ${p.desc}`).join('\n');

  return `あなたは「プロ野球データ分析ショート動画」のメインアナリスト兼構成作家です。
ターゲットは30代〜60代の男性巨人ファン。感情論を排したロジカルな考察を提供します。
本動画はYouTube Shorts（9:16、〜60秒）として、視聴維持率・離脱阻止を最優先に設計します。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【前提】チーム状況
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・2026年 読売ジャイアンツ。スローガン「前進 〜GIANTS CHALLENGE〜」。
・長嶋茂雄終身名誉監督への日本一報告が至上命題。
・野手: 2番キャベッジ、4番ダルベックの適応、5番問題、若手（泉口・浦田）依存増。
・投手: 戸郷不調、山崎・ハワード離脱、ドラ1竹丸開幕、ブルペン負荷増。
※ チーム状況はテーマ直結時のみ触れ、それ以外は文脈補強として裏に置く。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【表示モデル】4フェーズ構成（UI連動・重要）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
動画は自動的に以下の4フェーズを切り替えて表示されます。各 script を書く際は、どのフェーズで表示されるかを意識してください。

◆ フェーズA（フック）: id:1 のみ（isCatchy:true）
  - 大テロップ（46px）＋選手ブランド情報＋成績リボン
  - レーダー・比較表・アバターは非表示
  - 目的: 冒頭0〜3秒の離脱阻止。固有名詞＋衝撃数字で一撃

◆ フェーズB（平常）: id:2〜18 のうち highlight指定なしの script
  - レーダー＋凡例＋成績テーブル表示
  - 目的: 選手の全体像を見せながら対話でストーリー進行

◆ フェーズC（ハイライト）: id:2〜18 のうち highlight指定ありの script
  - レーダー縮小＋ハイライトカード展開（指標名・計算式・値・基準・WHY）
  - 目的: 特定指標に画面集中させて深掘り
  - 数値カウントアップ演出、該当頂点の金色ズームイン光あり

◆ フェーズD（アウトロ）: id:19, 20（末尾2つ）
  - 分析まとめカード（チェックポイント3つ）＋CTAボックス＋いいね/登録ボタン
  - 目的: CTA到達率向上、次動画誘導

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【キャラクター設定】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A（データアナリスト / speaker:"A" / 左側オレンジ枠）:
  一人称「私」固定。口調「〜です」「〜なんです」。落ち着いた断定口調。
  曖昧な表現を嫌う。数字を武器にして斬り込む役。Bの誤信を容赦なく覆す。
  「〜かもしれない」のような予防線は張らない。

B（視聴者代弁者のファン / speaker:"B" / 右側水色枠）:
  一人称「私」固定。口調は自然な話し言葉「〜ですね」「〜じゃないですか」。
  Bは「視聴者の先入観を代弁してAに論破される」役割。必ずBが誤信→発見→納得→共感の4段階を経る。
  毎回Bが素直に同意したら失敗作。最低2〜3回はAに反論・抵抗する。
  Bのtextには感情絵文字（🤯😲🥹😨🤔など）を必ず1個含める。状態遷移が見える絵文字選び:
    序盤: 😲🤩🤔 (意外・興味)
    中盤: 🤯😨😯 (驚愕・動揺)
    終盤: 😆🥹🥰 (納得・共感)

同キャラの連続発言は最大2回まで（3回以上禁止）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【構成】script数は必ず35〜45個 ★★★超重要★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 必須ルール:
・scripts配列の要素数は必ず 35個以上・45個以下。30個未満は不合格。
・idは1から連番で、欠番禁止。
・「20個でまとめる」「25個に収める」等、数を減らす判断は絶対に禁止。

■ なぜ多いほうが良いか (理由を理解して従うこと):
・1idの表示時間は平均2秒。50秒動画で25個だと1id=2秒×25=50秒で足りるが、
  視聴者は同じテロップが長く出ると「まだ同じ話か」と感じて離脱する。
・1idを短く多くすると、テロップが次々変わり飽きが減る→視聴維持率向上。
・特にBのリアクションは短い相槌(6〜8文字)でも1idを占めて良い。
  例:「え！？」「まじで」「ほぼ倍じゃないですか」など独立した1idにする。

■ 分割の具体例:
✗ 悪い例 (1idに詰め込みすぎ):
  text: "純粋な長打力のIsoPを見てください。昨季.095が今季.172に大幅上昇です"

✓ 良い例 (3idに分割):
  id:6 A: text="純粋な長打力を示す\n「IsoP」を\n見てください"
  id:7 A: text="昨季は【.095】"
  id:8 A: text="今季は【.172】に\nまで大幅上昇"
  (さらに id:9 で B の驚きリアクションを1id割く)

■ 構成の目安 (35〜45idを割り当てる配分):
・id:1: フック (1個)
・id:2〜6: 導入・Bの誤信 (4〜5個)
・id:7〜14: ハイライト1の深掘り (6〜8個、AとBの応答で細かく割る)
・id:15〜22: ハイライト2の深掘り (6〜8個、同上)
・id:23〜28: ハイライト3の深掘り (4〜6個)
・id:29〜35: 擁護・総括・結論 (5〜7個、A/B交互)
・最後から2番目: A 問いかけ
・最後: B 予測+登録促進

■ 1script粒度:
・text: 6〜12文字/1行、最大3行
・speech: textとほぼ同内容 (textの強調記号を外し、数字/英字をひらがな化したもの)
・表示時間 1.5〜2.5秒
・視聴者が「まだ同じ話か」と感じる前に次へ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【動画パターン】（今回のテーマに最適な1つを選択）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${patternList}
※ 同一パターンの2本連続使用は禁止。
※ patternは「フック出現アニメーション」にも連動します:
   朗報型/擁護型/未来予測型/覚醒型 → ポップアニメ（バウンスしながら出現）
   悲報型/謎解き型 → シェイクアニメ（震えながら衝撃出現）

※ patternごとに結論の方向性を厳守すること（曖昧にぼかさない）:
   ・朗報型: 「なぜ凄いか」を数字で証明しきる。最後も「この数字が続けば一線級になる」など強気の断定
   ・悲報型: 「何がダメか」を最後まで掘る。「このままでは◯◯な結末」と警告で締める。甘くしない
   ・擁護型: 「批判は的外れ、本当は◯◯」と論破する流れ。反証データで押し切る
   ・覚醒型: 「昨季と別人」を具体的な数値変化で描く。何が変わったかを1〜2点に絞って提示
   ・謎解き型: 冒頭で謎を提示→中盤で数字の真相を明かす→最後に「だから◯◯なんです」で納得
   ・未来予測型: 現在のトレンドから具体的な数字予測（例: 「このペースなら40本塁打」）を断定
   ※ いずれも「評価を保留する」「両論併記する」は禁止

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【レイアウトタイプ】（テーマに応じて最適なもの選択）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${layoutList}
※ 選択したパターンと整合するレイアウトを選ぶこと。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【text と speech の原則】★最重要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
◆ text と speech は内容をほぼ一致させる。
  text を過度に要約してはいけない。
  サイレント(音なし)視聴者が text だけで内容を完全理解できること。
  ショート動画の半数以上は音声なしで再生されるため、これは視聴維持率に直結する。

◆ text と speech の違いは次の2点のみ:
  1. text: 改行(\\n)で視認性確保 + 強調記号(【】「」『』)を付与 + アルファベット/漢字は漢字のまま
  2. speech: 改行/強調記号を全て削除 + 数字やアルファベットをひらがな読みに変換

◆ 悪い例（要約しすぎで意味不明）:
  text: "ツーラン打ったのに" ← 誰が？いつ？
  speech: "先日のディーエヌエー戦で同点ツーラン打ったのに"

◆ 良い例（内容一致・改行で視認性）:
  text: "先日の「DeNA戦」で\\n同点ツーラン\\n打ったのに！？"
  speech: "先日のディーエヌエー戦で同点ツーラン打ったのに。"

◆ text の許容範囲（視認性を保つため）:
  - 1行10〜15文字まで許容（短ければなお良し）
  - 最大3行
  - 「。」禁止、「！？」「!?」は可
  - Bは感情絵文字1個必須（行末推奨）

◆ speech のルール:
  - 句読点は文末「。」のみ
  - 改行や強調記号は削除
  - 装飾語を削ぎ落としすぎない（textと同じ情報量を保つ）

◆ 数字の読み: ${numericRules}
◆ ひらがな化の例: 球→たま、四球→しきゅう or ふぉあぼーる、ボール球→ぼーるだま、打数→だすう
◆ 球団の読み: DeNA→ディーエヌエー、巨→きょじん、神→はんしん

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【テロップ強調記号とサイズ階層】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
◆ 強調記号（text内で使用）:
  【】 黄色 #FFD700 / 1.25倍拡大 → 最重要（数字・決定的な語）
  「」 オレンジ #FF8C00 / 1.15倍拡大 → 指標名・キーワード
  『』 赤 #FF4500 / 1.15倍拡大 → 警告・驚きの語

◆ テロップサイズ（script 内 "textSize" プロパティで指定）:
  "xl" (26px): 〜6文字の極短文、最大インパクト
  "l"  (22px): 7〜10文字、標準短文
  "m"  (19px): 11〜15文字、標準（多くのscriptはこれ）
  "s"  (16px): 16文字以上、情報量多めの時
  ※ フェーズA(id:1)は固定で46pxなので textSize 不要
  ※ textSize を省略した場合は文字数から自動選択（l相当）
  ※ scriptが多く短いほど視聴維持率が上がる。長文でsizeを小さくするより、
     短文に分割して sizeを大きく保つほうが良い。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【視聴維持率・離脱阻止のための原則】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・冒頭3秒（id:1）の離脱阻止が最重要。具体的数字・固有名詞・意外性のあるフレーズを必ず含める
・id:2〜4は「Bの誤信・驚き」で視聴者を引き込む。Bの最初の反応は強めに（😲🤯等）
・同じトーンが3発言以上続くと離脱しやすいので、A↔Bの切替と感情起伏を意識
・highlight指定で「今から核心に入る」合図を視覚的に出せるので、ここぞの指標で使う（全scriptに付けない）
・末尾のCTA（最後の2script）では具体的な問いかけで「コメントしたい」を誘発

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【重要】「毒にも薬にもならない分析」を絶対に作らないこと
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
これは最重要ルールです。以下を厳守してください。

■ 禁止フレーズ（一切使用禁止）:
  ・「〜と考えられる」「〜と思われる」「〜かもしれない」「〜の可能性がある」
  ・「〜が重要」「〜が鍵」「〜が課題」（単体で結論として使うのは禁止。数値根拠が必須）
  ・「バランスの取れた」「多角的に見て」「総合的に判断すると」
  ・「状況を見守りたい」「今後に期待」「改善の余地がある」
  ・「一概には言えない」「評価が分かれる」「賛否両論」
  ・「良い面もある」「悪い面もある」の両論併記

■ 強制ルール:
  ・必ず明確な立場・結論を1つに絞って主張する
  ・patternが「悲報型」なら「ダメな理由を最後まで掘り下げる」、朗報型なら「なぜ凄いかを数字で証明する」
  ・中立・曖昧な言い回しで逃げることを禁止。「〜です」「〜なんです」で断定
  ・根拠無しの抽象論は禁止。全ての主張に数字 or 具体的プレーの裏付けを添える
  ・「最後は良い展望で締める」をよく結論にしがちだが、それは雑。patternに従って主張を貫く
    例: 悲報型なら最後も「改善点はここ、それが無ければ厳しい」で締める。「でも期待してます」は逃げ

■ Bの役割を正しく使う（視聴者の没入度を上げる装置）:
  ・Bは「多くの視聴者が先入観で思ってること」を声に出す役
  ・「打率.276あるから十分じゃないですか？」のように具体的な誤信をぶつける
  ・Bが毎回「そうですね」「なるほど」で同意し続けたら失敗。必ず1〜3回は反論・抵抗する
  ・Bの感情絵文字は状態遷移を示す: 疑問🤔→驚愕🤯→納得😯→共感🥰 のような変化を作る

■ Aの役割を正しく使う（強い論者）:
  ・Aは数字を武器に持つ専門家。「断定してからの根拠提示」が基本
  ・「〜です。なぜなら〜」の順で話す
  ・曖昧に予防線を張らない。「優秀基準にあと一歩」までは良いが、「まだ様子見」は禁止
  ・同じ数字を2回以上繰り返さない（視聴者は覚えている前提）

■ 「鋭さ」を出すテクニック:
  ・直近のプレーや事件を固有名詞で触れる（例: 「先日のDeNA戦で同点2ラン打ったのに」）
  ・業界内で語られる通説を覆す形にする（「長打力はあるように見えて実は…」）
  ・比較対象を明示する（「昨季と比べて」「リーグ平均と比べて」「同ポジションのXX選手と比べて」）
  ・単に指標を紹介するのではなく、その指標が示す「意外な真実」を主張にする

■ 視聴者への価値提供を明確にする:
  この動画を見た人が持ち帰るものは何か？ 新しい見方・知識・判断基準。
  「なんとなく良さそう/悪そう」で終わる動画は価値ゼロ。
  視聴後に「これから自分も◯◯という数字を見よう」と思わせる視点を必ず1つは提供する。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力要件】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・JSON ブロックのみ出力（説明文禁止）。
・schemaVersion "5.0.0" を先頭に含める。
・layoutType, pattern, aspectRatio "9:16", audio プロパティを含める。
・playerType: "${currentData.playerType}"
・silhouetteType: 選手の特徴に合わせて以下から1つ選ぶ (フック画面の影絵):
  - 野手用: "batter_right" (右打者打撃) / "batter_left" (左打者打撃) /
            "batter_stance" (打者構え・全打者向け) / "runner" (走塁・盗塁アピール時)
  - 投手用: "pitcher_right" (右投手ワインドアップ) / "pitcher_left" (左投手ワインドアップ) /
            "pitcher_set" (セットポジション・リリーフ) / "catcher" (捕手構え)
  デフォルト: 野手→batter_right / 投手→pitcher_right
  例: 盗塁王なら "runner"、セットアッパーなら "pitcher_set"、左腕エースなら "pitcher_left"
・outroCta: アウトロのオレンジ枠の問いかけ。必ず含める。分析内容に応じて文言変化させる:
  { title: "選手名の", big: "強調される短い語", suffix: "接続詞や疑問詞" }
  【良い例】
    - HR注目の強打者: { title: "増田陸の", big: "HR", suffix: "何本いく？" }
    - 盗塁型: { title: "丸の", big: "盗塁", suffix: "何個？" }
    - 先発投手: { title: "戸郷の今季", big: "何勝", suffix: "いける？" }
    - 課題ありの選手: { title: "坂本の", big: "打率", suffix: "戻る？" }
    - リリーフ: { title: "大勢の今季", big: "何セーブ", suffix: "？" }
    - 覚醒型: { title: "船迫は", big: "ブレイク", suffix: "する？" }
  【NG: ワンパターン禁止】
    - 全員「今季予想は？」「期待できる？」のような同じ文言
    - bigが抽象的 (例: "活躍" "頑張れ") → 必ず数字 or 具体動作
  title+big+suffix で20文字程度に収める (オレンジ枠が小さいため)
・hookAnimation: 冒頭フック(id:1)のテロップ登場アニメーション。以下から選ぶ:
  - "pop"   : 弾けるような出現 (デフォルト、朗報/擁護/覚醒向け)
  - "shake" : 激しく揺れる (悲報/緊急/謎解き向け、インパクト強)
  - "slide" : 横からスライドイン (データ系/解説系、洗練感)
  - "zoom"  : ズームイン+ブラー解除 (衝撃事実/大発見向け、ドラマチック)
  - "fade"  : フェードイン (落ち着いた導入、課題分析向け、上品)
  【選択ガイド】
    - 視聴維持率を上げたい派手さ優先 → pop/shake/zoom
    - 落ち着いた分析 → fade/slide
    - pattern と組み合わせて:
      bad_news+shake / awakening+zoom / good_news+pop / mystery+slide / defense+fade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【視聴データ駆動の勝ちパターン - 最重要】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
実データ(94,417再生33本分析)から判明した継続率パターン:

▼ 継続率TOP3の共通点 (冒頭でスワイプされなかった動画):
  1位 継続34.4% 「山瀬降格→小林昇格『非情な理由』」  感情ワード+対比
  2位 継続23.0% 「田中マー君、去年とは別人」          変化ワード+具体対比
  3位 継続21.7% 「守備率10割!吉川の穴を埋める」       具体数字+穴埋め

▼ 継続率WORST3の共通点 (冒頭スワイプ多発):
  13.0% 「竹丸vs櫻井、本当の勝者とは?」     ❌結論ぼかし+「本当の〜」
  13.7% 「左腕に勝てない絶望的な弱点」      ❌曖昧+チーム全体ネタ
  15.7% 「岡本の穴ダルベックの現在地」      ❌「現在地」系は弱い

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【★統計的に証明: hook text は13文字以内】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hook text (id:1) の文字数と継続率は **強い負の相関 (-0.558)**:
  13字以下 → 平均継続率 23.4% (n=5) ✅
  14-16字  → 平均継続率 17.4% (n=2) ⚠
  17字以上 → 平均継続率 14.1% (n=3) ❌

▼ id:1 の hook text は ★改行込みで全13文字以内★ を厳守:
  ✅「非情な降格\n小林誠司昇格」(12字)
  ✅「田中マー君\n別人」(8字)
  ✅「守備率10割\n吉川の穴」(10字)
  ❌「防御率の罠ドラ1竹丸vs中日櫻井本当の勝者」(20字)
  ❌「巨人が今年も左腕に勝てない理由絶望的な弱点」(21字)

極限まで言葉を削ぎ落とす。形容詞や説明文は削除。
結論・衝撃ワード・具体数字だけを残す。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【hook text 必須構造】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ hook text 必須構造 (継続率を上げる):
  ✅ 感情ワード: 「非情」「残酷」「別人」「覚醒」「バケモノ化」「異常」「衝撃」
  ✅ 具体数字を冒頭に: 「防御率0.00」「被打率.357」「四球ゼロ29打席」「IsoP 1.7倍」
  ✅ 対比明示: 「A降格 vs B昇格」「去年 vs 今年」「名選手2世」
  ✅ 「致命的」「異常な」「謎」などの強いフック語

▼ 絶対NG (スワイプ率を上げる):
  ❌ 「本当の勝者とは?」「本当の理由」 = 結論ぼかしで離脱
  ❌ 「現在地」「可能性」「現実的」 = 予想系は信用されない
  ❌ 「〜とは言えません」= 否定スタート
  ❌ 「〜2世がいます」= 「誰?」で離脱
  ❌ チーム全体ネタ(左腕に勝てない等) = 選手個人にフォーカス

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【★アウトロ設計: ラスト3秒で離脱させない】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
現状問題: 「コメントで教えて!」「チャンネル登録もよろしく」= 定型句が
「動画の終わり」を明示してしまい、最後の視聴維持率が急落。

▼ outroCta / 最終script の設計ルール:
  ❌ 「いいね・チャンネル登録・シェアもぜひ!」= 定型句は即スワイプ
  ❌ 「あなたはどう思いますか?」= 曖昧すぎて反応なし
  ✅ 「ダルベック5番、賛成?反対?」= 具体的な二択
  ✅ 「増田陸の今季HR何本?」= 数字予測を迫る
  ✅ 「〇〇の起用、あなたなら続投?降格?」= 判断を迫る

▼ 議論が白熱した瞬間でブツッと終わらせる (余韻なし):
  最終scriptの次に「?」だけ残してフェードアウト。
  「動画の終わりを悟らせず、コメント欄を開きたくなる」構成。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

・scripts は ★必ず25〜30項目★ で出力（20未満・35超は不合格）。id は1から連番、欠番禁止。
  ※ 動画長60秒以内に収めるため短縮。60秒未満が維持率良好のデータ実証済み。
・フェーズ判定は自動:
  - id:1 & isCatchy:true → フェーズA（フック）
  - 最後から2番目・最後のscript → フェーズD（アウトロ）
  - highlight指定あり → フェーズC
  - それ以外 → フェーズB
・各 script に以下のプロパティを含める:
  - id (1〜30)
  - speaker ("A" or "B"、大文字)
  - emoji (話者の表情絵文字、Bは多彩な感情絵文字を使い分け)
  - text (改行\\n込み、強調記号あり)
  - speech (TTS用、句読点は「。」のみ)
  - textSize ("xl" | "l" | "m" | "s" 任意、省略可)
  - isCatchy (id:1のみ true)
  - highlight (該当時のみ、comparisons[i].id の文字列を指定。例: "isop" / "isod" / "bb_k")
  - se (null許容、主なSE: hook_impact / highlight_ping / stat_reveal / shock_hit /
       success_chime / warning_alert / transition_swoosh / outro_fade)
・comparisons は 5項目必須（レーダーの5頂点と対応）。
  各comparisonには id / label / kana / desc / formula / criteria / radarMatch /
  valMain / valSub / unit / winner ("main" | "sub") を含める。
・推定動画時間はscripts全体のspeech文字数 × 0.15秒で自動計算されます（JSON出力不要）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【${playerTypeLabel}用スキーマテンプレート】（これを型として出力）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(templateData, null, 2)}
`;
}
