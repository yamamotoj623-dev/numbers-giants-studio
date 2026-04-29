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
import { splitProjectData, mergeProjectData, normalizeProjectInput } from '../lib/projectSplit';
// ★ docs/gemini-custom-prompt.md を Vite ?raw で読み込み (一本化、v5.10.1)
// これにより、コピーボタンでも docs と同一の内容が出力される
import customPromptRaw from '../../docs/gemini-custom-prompt.md?raw';

export function JsonPanel({ projectData, onApply, onLoadTemplate }) {
  // ★v5.18.12★ 「全体 / データ / 台本」の3モード切替
  // - whole: 1ファイル形式 (旧来通り)
  // - data: メタ + layoutData + comparisons + radarStats のみ (台本は除外)
  // - script: scripts のみ
  const [mode, setMode] = useState('whole');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  // mode が変わるたびに、表示用 JSON を組み立て直す
  useEffect(() => {
    if (mode === 'data') {
      const { data } = splitProjectData(projectData);
      setJsonInput(JSON.stringify(data, null, 2));
    } else if (mode === 'script') {
      const { script } = splitProjectData(projectData);
      setJsonInput(JSON.stringify(script, null, 2));
    } else {
      setJsonInput(JSON.stringify(projectData, null, 2));
    }
    setJsonError('');
  }, [projectData, mode]);

  const flash = (msg) => {
    setCopyStatus(msg);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  /**
   * 入力JSONを mode に応じて適切に解釈して onApply
   * - whole: 1ファイル形式 or { data, script } 形式 を normalize
   * - data: 既存の scripts を保持しつつ、データ部分だけ差し替え
   * - script: 既存のメタ+データを保持しつつ、scripts だけ差し替え
   */
  const tryApply = (text) => {
    try {
      const parsed = JSON.parse(text);
      let merged;
      if (mode === 'data') {
        // データのみ更新 (scripts は既存維持)
        merged = mergeProjectData(parsed, { scripts: projectData.scripts || [] });
      } else if (mode === 'script') {
        // 台本のみ更新 (メタ+データは既存維持)
        const { data: existingData } = splitProjectData(projectData);
        const newScripts = Array.isArray(parsed) ? parsed : (parsed.scripts || []);
        merged = mergeProjectData(existingData, { scripts: newScripts });
      } else {
        // 全体 (1ファイル形式 or 2ファイル形式)
        merged = normalizeProjectInput(parsed);
        if (!merged) throw new Error('JSON 形式を認識できません (scripts または data/script キーが必要)');
      }
      // 必須フィールド補完
      if (!merged.scripts) merged.scripts = [];
      if (!merged.schemaVersion) merged.schemaVersion = '5.0.0';
      if (!merged.layoutType) merged.layoutType = 'radar_compare';
      if (!merged.aspectRatio) merged.aspectRatio = '9:16';
      if (!merged.audio) merged.audio = { bgmId: null, bgmVolume: 0.15, voiceVolume: 1.0, seVolume: 0.6 };
      if (!merged.layoutData) merged.layoutData = {};

      // ★v5.19.5★ ユーザー固有設定 (AI が出力に含めない設定) は既存値で必ず保持
      // これらは UI で設定するもの・メディア紐付け・サウンドなど、AI が消してはいけない
      const PRESERVE_KEYS = [
        'hookMediaPattern',
        'hookMediaDurationMs',
        'hookAnimation',     // フックの揺れ方は AI には触らせない (UI で選ぶ)
        'silhouetteType',    // シルエット種類
        'theme',             // テーマカラー
        'smartLoop',
      ];
      for (const k of PRESERVE_KEYS) {
        // AI 出力に該当キーが無い (undefined) 場合のみ既存値を引き継ぐ
        // AI が明示的に新しい値を出した場合はそれを尊重
        if (merged[k] === undefined && projectData?.[k] !== undefined) {
          merged[k] = projectData[k];
        }
      }
      // audio もパーシャルマージ (AI が部分的にしか出さない場合の安全策)
      if (projectData?.audio) {
        merged.audio = { ...projectData.audio, ...(merged.audio || {}) };
      }

      // mode='whole' の時のみ mainPlayer 必須チェック (data/script 単独時はスキップ)
      if (mode === 'whole' && !merged.mainPlayer) {
        throw new Error('全体JSONには mainPlayer が必要です');
      }
      onApply(merged);
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
    let prompt;
    let flashMsg;
    if (mode === 'data') {
      prompt = buildDataJsonPrompt(projectData, template);
      flashMsg = '★データJSON生成プロンプト★ をコピーしました! Grokに貼り付けてください';
    } else if (mode === 'script') {
      prompt = buildScriptJsonPrompt(projectData, template);
      flashMsg = '★台本JSON生成プロンプト★ をコピーしました! Geminiに貼り付けてください';
    } else {
      prompt = buildAIPrompt(projectData, template);
      flashMsg = 'AIプロンプトをコピーしました! Geminiに貼り付けてください';
    }

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
      flash(flashMsg);
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

      {/* ★v5.18.12★ データ / 台本 分割編集モード */}
      <div className="flex gap-1 mb-2 bg-zinc-100 p-1 rounded-lg">
        {[
          { id: 'whole', label: '全体', desc: '1ファイル' },
          { id: 'data',  label: '📊 データ', desc: 'メタ+layoutData+comparisons' },
          { id: 'script', label: '🎬 台本',  desc: 'scripts のみ' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            title={t.desc}
            className={`flex-1 text-[11px] font-bold py-1.5 rounded transition ${
              mode === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="text-[9px] text-zinc-500 mb-2 px-1">
        {mode === 'whole'  && '全体 JSON。1ファイルで丸ごとコピー/ペーストする旧来の編集モード。'}
        {mode === 'data'   && 'データ部分のみ。台本 (scripts) は既存のものを保持して、データだけ差し替え。'}
        {mode === 'script' && '台本のみ。メタ+データは既存のものを保持して、scripts だけ差し替え。'}
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


/**
 * AI プロンプトを構築 (v5.10.1 で一本化)
 *
 * docs/gemini-custom-prompt.md を Vite ?raw でインポートし、その末尾に
 * - 動画パターン一覧 (VIDEO_PATTERNS から)
 * - レイアウト一覧 (LAYOUT_TYPES から)
 * - 動的な playerType 別の数値読みルール
 * - スキーマテンプレート (templateData)
 * を付加する。
 *
 * これにより、Gemini Custom Gem に Knowledge File として渡す版と
 * このコピーボタンで生成される版が完全に同一の主要ルールを共有する。
 *
 * 推奨運用: docs/gemini-custom-prompt.md を Custom Gem に Knowledge File としてアップロード。
 * 単発の素 Gemini に貼り付ける時のみ、このコピーボタンを使う。
 */
function buildAIPrompt(currentData, templateData) {
  const playerTypeLabel =
    currentData.playerType === 'batter' ? '野手' :
    currentData.playerType === 'pitcher' ? '投手' :
    'チーム';

  // 動的な数値読みルール (playerType 別)
  const numericRules = currentData.playerType === 'batter'
    ? '・打率/出塁率/長打率 (.250, .350): 「にわり・ごぶ」のように【割・分・厘】で記述\n'
    + '・OPSやIsoPなど (.850, .172): 「てんはちごーぜろ」「てんいちななに」\n'
    + '・指標名: IsoP→アイソピー、BB/K→ビービーケー、RC27→アールシーにじゅうなな'
    : currentData.playerType === 'pitcher'
    ? '・防御率やFIP (2.15, 3.50): 「にてんいちご」「さんてんごぜろ」\n'
    + '・K/BBやK/9など (7.00, 10.80): 「ななてんぜろぜろ」「じゅってんはちぜろ」\n'
    + '・指標名: FIP→フィップ、K/BB→ケービービー、WHIP→ウィップ、HR/9→エイチアールナイン'
    : '・打率/防御率/勝率の混合: 各指標ごとに上記2分類を参照\n'
    + '・順位/勝敗: 「いちい」「にい」「さんい」、勝率「ろくわりごぶ」';

  // レイアウト一覧 (動的)
  const layoutList = Object.entries(LAYOUT_TYPES)
    .map(([key, info]) => `  ・${key}: ${info.label} (${info.desc})`)
    .join('\n');

  // 動画パターン一覧 (動的)
  const patternList = VIDEO_PATTERNS
    .map(p => `  ・${p.id} / ${p.label}: ${p.desc}`)
    .join('\n');

  return `${customPromptRaw}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【今回の生成タスク】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
playerType: "${currentData.playerType}" (${playerTypeLabel})
silhouetteType: "${currentData.silhouetteType || '未指定'}"
theme: "${currentData.theme || 'orange'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【利用可能な動画パターン】(1つ選択)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${patternList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【利用可能なレイアウト】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${layoutList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【数値の読みルール (今回は${playerTypeLabel}用)】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${numericRules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【${playerTypeLabel}用スキーマテンプレート】(これを型として出力)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(templateData, null, 2)}
`;
}

/**
 * ★v5.18.12★ データJSON生成プロンプト (Grok 推奨 — リサーチ重視)
 *
 * Grok にリサーチを依頼してデータJSONを生成させるためのプロンプト。
 * - mainPlayer/subPlayer の正確な数字
 * - layoutData (timeline / versus / spotlight / ranking) の中身を充実
 * - comparisons の指標を 5-10 種類用意
 * - 1動画内で使い回せるよう、選手は3-5人入れる
 */
function buildDataJsonPrompt(currentData, templateData) {
  const playerTypeLabel = currentData.playerType === 'batter' ? '野手' : currentData.playerType === 'pitcher' ? '投手' : 'チーム';
  const { data: existingData } = splitProjectData(currentData);
  const numericRules = currentData.playerType === 'batter'
    ? '・打率/出塁率/長打率 (.250, .350): 「にわり・ごぶ」のように【割・分・厘】で記述\n'
    + '・OPSやIsoPなど (.850, .172): 「てんはちごーぜろ」「てんいちななに」'
    : currentData.playerType === 'pitcher'
    ? '・防御率やFIP (2.15, 3.50): 「にてんいちご」「さんてんごぜろ」'
    : '・打率/防御率/勝率の混合: 各指標ごとに上記2分類を参照';

  return `# ★データJSON生成タスク★

## 役割
あなたはプロ野球データの**リサーチ担当**。動画用の「データJSON」を生成してください。
台本(scripts)は別工程で生成するので、**今回は scripts を含めないこと**。

## 動画ストーリーの大枠
${currentData.title || '(動画タイトル)'} — テーマ: ${currentData.theme || '(未指定)'} / 期間: ${currentData.period || '(未指定)'}
プレイヤータイプ: ${playerTypeLabel}

## ★重要★ データを「使い回せる倉庫」として充実させる
1動画内で、以下のような使い分けをしたい:
- 1つの spotlight に **3-5 人分の player 候補** を入れる (シーンごとに別の選手をフォーカス)
- 1人の player に **複数の quote を持たせる** (発言ピックを使い分け、quotes 配列を活用)
- ranking の各 metric には **上位 5-10 人** 入れる
- comparisons は **5-10 種類** の指標を定義 (動画中で使い分けたいハイライトすべて)

## 出力する JSON 構造
\`\`\`json
{
  "schemaVersion": "5.0.0",
  "layoutType": "(初期レイアウト、後で台本側で上書き可)",
  "playerType": "${currentData.playerType || 'batter'}",
  "theme": "${currentData.theme || 'orange'}",
  "period": "${currentData.period || ''}",
  "hookAnimation": "shake",
  "smartLoop": true,
  "audio": { "bgmId": null, "bgmVolume": 0.15, "voiceVolume": 1.0, "seVolume": 0.6 },

  "mainPlayer": { "name": "...", "number": "...", "stats": { "pa": ..., ... } },
  "subPlayer": { ... },
  "radarStats": { /* 5指標 */ },

  "comparisons": [
    /* 5-10種類の指標。台本の script.highlight でこの id を参照 */
    /* ★v5.19.6新★ variants[] でスコープ別 (対左/対右/今季vs昨季/vs他選手) の値を持てる */
    {
      "id": "avg",
      "label": "打率",
      "kana": "だりつ",
      "radarMatch": "打撃力",
      "unit": "",
      "variants": [
        { "id": "overall", "label": "通季", "valMain": ".305", "valSub": ".278", "mainLabel": "今季", "subLabel": "昨季", "winner": "main" },
        { "id": "vs_left", "label": "対左投手", "valMain": ".201", "valSub": ".245", "mainLabel": "今季", "subLabel": "昨季", "winner": "sub" },
        { "id": "vs_right", "label": "対右投手", "valMain": ".342", "valSub": ".289", "mainLabel": "今季", "subLabel": "昨季", "winner": "main" }
      ]
    },
    /* 旧形式 (variants なしで valMain/valSub 直書き) も後方互換 */
    { "id": "isop", "label": "ISO+", "kana": "アイソピ", "valMain": ".172", "valSub": ".095", "winner": "main" },
    ...
  ],

  "layoutData": {
    "spotlight": {
      "players": [
        /* 3-5 人分。台本の script.focusEntry で id を指定して切り替え */
        {
          "id": "okamoto", "name": "岡本和真", "team": "G", "label": "26年(今季)",
          "stats": [...],
          "quotes": [
            /* 複数の発言ピック。台本側で focusQuoteIndex で選択 */
            { "text": "もっと長打を打ちたい", "source": "2026/4 取材" },
            { "text": "守備位置はどこでも", "source": "2026/3 春季練習" },
            ...
          ]
        },
        ...
      ]
    },
    "ranking": {
      "metrics": [
        /* 動画中で使う metric を全部用意 */
        {
          "id": "ops", "label": "OPS", "kana": "オーピーエス",
          "entries": [
            { "rank": 1, "name": "...", "team": "G", "value": "1.013" },
            /* 5-10人 */
            ...
          ]
        },
        ...
      ]
    },
    "timeline": { /* points 配列 */ },
    "versus": { /* categoryScores 配列 */ }
  }
}
\`\`\`

## 数値の読みルール (今回は${playerTypeLabel}用)
${numericRules}

## ★既存データを参考に (このフィールド名・形式で出してください)★
\`\`\`json
${JSON.stringify(existingData, null, 2).slice(0, 4000)}
\`\`\`

## 注意
- **scripts は含めない** (台本は別工程)
- リサーチには web 検索を活用、推測ではなく一次ソース (NPB公式 > 球団 > 大手紙) を優先
- 数値は最新を反映 (期間: ${currentData.period || '(未指定)'})
- ★**以下のフィールドは出力に含めないこと**★ (アプリ側でユーザーが UI から設定する):
  - \`hookMediaPattern\` / \`hookMediaDurationMs\` (id:1 画像/動画の表示設定)
  - \`hookAnimation\` (フックの揺れ方)
  - \`silhouetteType\` (シルエット種類)
  - \`theme\` (テーマカラー)
  - \`smartLoop\` (シームレスループ設定)
  - \`audio\` (BGM/SE 音量)
  もし含めるとアプリ側でユーザー設定が消えてしまう。これらは既に設定済みなので**完全に出力から除外**してください。
- 球団横断ランキングでは entries[].team を必ず入れる
`;
}

/**
 * ★v5.18.12★ 台本JSON生成プロンプト (Gemini 推奨 — 脚本重視)
 *
 * 既に存在するデータJSON を読み込み、シーン構成と台本だけを生成させる。
 */
function buildScriptJsonPrompt(currentData, templateData) {
  const { data: existingData } = splitProjectData(currentData);
  const playerTypeLabel = currentData.playerType === 'batter' ? '野手' : currentData.playerType === 'pitcher' ? '投手' : 'チーム';

  // データの抜粋: 台本生成で参照すべき要素 (comparisons の id, players の id 等)
  const compIds = (existingData.comparisons || []).map(c => `${c.id} (${c.label})`).join(', ') || '(未定義)';
  const playerIds = (existingData.layoutData?.spotlight?.players || [])
    .map(p => `${p.id || p.name} (${p.name}${p.team ? `, ${p.team}` : ''})`)
    .join(', ') || '(未定義)';

  return `# ★台本JSON生成タスク★

## 役割
あなたは脚本担当。データJSON は既に存在しているので、**scripts 配列だけ**を生成してください。

## データJSON の概要 (既に存在)
- mainPlayer: ${existingData.mainPlayer?.name || '(未指定)'}
- subPlayer: ${existingData.subPlayer?.name || '(未指定)'}
- 利用可能な比較指標 (script.highlight に指定): ${compIds}
- 利用可能なフォーカス選手 (script.focusEntry に指定): ${playerIds}
- 動画パターン: ${currentData.pattern || '(未指定)'}
- テーマ: ${currentData.theme || '(未指定)'}

## ★1動画内でデータを使い分け★
1動画内で複数の選手にフォーカスしたり、同じ選手の複数の quote を使い分けたりするのが想定。
- script.layoutType で **シーンごとにレイアウト切替** (radar_compare → player_spotlight → ranking 等)
- script.spotlightMode で **選手スポットの表示パターンをシーンごとに切替** (default/quote/stats_grid/single_metric)
  ★重要★ quote モードにしたいシーンには必ず spotlightMode: "quote" を明記。省略するとグローバル設定 (通常 default) が使われる
- script.focusEntry で **シーンごとに別の player.id** を指定 (★player.id と完全一致させること★)
- script.focusQuoteIndex で **同じ player の中で別の quote** を指定 (player.quotes[idx])
- script.focusMetric で **ranking の metric をシーンごとに切替** (ranking.metrics[].id)
- script.highlight で **シーンごとに別の comparison.id** を指定

## 出力する JSON 構造
\`\`\`json
{
  "scripts": [
    {
      "id": 0,
      "speaker": "A",
      "speech": "...",
      "layoutType": "radar_compare",  // データ側の利用可能レイアウト
      "spotlightMode": "default",     // (任意) 選手スポット表示時のモード切替: default/quote/stats_grid/single_metric
      "scenePreset": "cinematic_zoom",// (任意) ★v5.19.6新★ シーン全体の演出: default/cinematic_zoom/neon_burst/mono_drama/pastel_pop/blackboard/breaking_news ※同じ動画内で 3-5 種類使い分けると紙芝居脱却
      "highlight": "isop",            // 上記の comparisons.id から
      "highlightScope": "vs_left",    // (任意) ★v5.19.6新★ 指標が variants[] を持つ場合のスコープ id (例: overall/vs_left/vs_right/last_year)
      "focusEntry": "okamoto",        // 上記の players.id から (★player.id と完全一致させること★)
      "focusQuoteIndex": 0,           // (任意) quote ピック切替 (player.quotes[idx])
      "focusMetric": "ops",           // (任意) ranking 用 metric 切替 (ranking.metrics[].id)
      "zoomBoost": "shake",           // 重要発言時のみ (1動画 2-3 箇所まで)
      "se": "shock_hit"               // 任意
    },
    ...
  ]
}
\`\`\`

## 注意
- **scripts 配列だけ出力**: \`{"scripts": [...]}\` の形式
- **データ部分 (mainPlayer / layoutData / comparisons / hookMediaPattern / hookAnimation / theme 等) は一切含めない** — それらは既に存在し、AI出力に含まれると上書きされて消える
- 動画長は ${currentData.aspectRatio === '9:16' ? '60-90秒' : '90秒程度'} を目安
- 話者交代を活用 (A=数原さん男性、B=もえかちゃん女性)
- データJSON の comparisons / players に存在しない id は使わない (参照ズレ防止)

## 既存の scripts (参考)
\`\`\`json
${JSON.stringify(currentData.scripts || [], null, 2).slice(0, 3000)}
\`\`\`
`;
}
