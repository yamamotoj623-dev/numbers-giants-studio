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
    // ★v5.20.13★ Firefox 互換性向上 — 大きい JSON では readText がタイムアウト/失敗する事例あり
    //   クリップボード API が使えない/失敗時は textarea にフォーカス→Cmd+V (Ctrl+V) を促す
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      const ta = document.querySelector('textarea[data-json-input]');
      if (ta) { ta.focus(); ta.select(); }
      flash('テキストエリアにペースト → 「反映」を押してください');
      return;
    }
    // 5秒タイムアウト付き readText (Firefox の長文ハング対策)
    const readWithTimeout = () => Promise.race([
      navigator.clipboard.readText(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('clipboard read timeout (5s)')), 5000)),
    ]);
    try {
      const text = await readWithTimeout();
      if (!text || !text.trim()) {
        flash('クリップボードが空です');
        return;
      }
      setJsonInput(text);
      if (tryApply(text)) flash('貼り付けて反映しました');
    } catch (err) {
      console.warn('[Clipboard] readText failed:', err?.message || err);
      const ta = document.querySelector('textarea[data-json-input]');
      if (ta) {
        ta.focus(); ta.select();
        flash('テキストエリアにペースト (Cmd+V または Ctrl+V) → 「反映」');
      } else {
        flash('クリップボード読取不可。テキストエリアにペーストしてください');
      }
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
        data-json-input
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

  // ★v10.2★ 動的な数値読みルール (playerType 別)
  const numericRules = currentData.playerType === 'batter'
    ? '・★打率系は .333 形式★ 打率/出塁率/長打率/OPS/被打率/IsoP\n'
    + '・打率 .333 → 「さんわりさんぶさんりん」、.305 → 「さんわりれいぶごりん」\n'
    + '・OPS .945 → 「れいてんきゅうよんご」、.207 → 「にわりれいぶしちりん」\n'
    + '・指標名カタカナ: IsoP→アイソピー、BB/K→ビービーケー、RC27→アールシーにじゅうなな'
    : currentData.playerType === 'pitcher'
    ? '・★防御率系は 0.97 形式★ ERA/WHIP/FIP/K/9/BB/9\n'
    + '・防御率 1.90 → 「いってんきゅうれい」、0.97 → 「れいてんきゅうなな」\n'
    + '・WHIP 0.97 → 「ダブリュエイチアイピー、れいてんきゅうなな」\n'
    + '・K/9 9.51 → 「ケーナイン、きゅうてんごいち」、1.00 → 「いってんれい」\n'
    + '・指標名カタカナ: FIP→フィップ、K/BB→ケービービー、WHIP→ダブリュエイチアイピー、HR/9→エイチアールナイン'
    : '・打率系 (.333 形式) と防御率系 (0.97 形式) の両方を使用\n'
    + '・順位/勝敗: 「いちい」「にい」「さんい」、勝率 .655 → 「ろくわりごぶごりん」';

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

  return `# データJSON生成タスク (Grok 推奨)

## 役割
プロ野球データのリサーチ担当として、動画用「データJSON」を生成する。
台本(scripts)は別工程なので **出力に含めない**。

## 動画ストーリー
- タイトル: ${currentData.title || '(未指定)'}
- テーマ: ${currentData.theme || '(未指定)'}
- 期間: ${currentData.period || '(未指定)'}
- 選手タイプ: ${playerTypeLabel}

## 数値表記ルール (★絶対守る★)
- 打率 / 出塁率 / 長打率 / OPS / IsoP / IsoD / 防御率 / WHIP : 先頭の0を省略 → 例: \`0.305\` ではなく \`".305"\`、\`0.000\` ではなく \`"-"\`
- データが0または不明 → \`"-"\` (アプリ側で「データなし」表現)
- 打席数 / 本塁打 / 打点 / 三振 等の整数 → そのまま整数 (例: 152)
- 全ての数値は **文字列で出力** (例: \`"value": ".305"\`)。アプリで再フォーマットしない。

## 出力 JSON (フルテンプレート)
以下の **すべての項目** を埋めて出力してください。
データが取れない指標は省略可、ただし comparisons は最低 5 種、spotlight.players は最低 3 人。

\`\`\`json
{
  "schemaVersion": "5.0.0",
  "playerType": "${currentData.playerType || 'batter'}",
  "period": "${currentData.period || '2026.04時点'}",

  "mainPlayer": {
    "name": "選手名",
    "number": "背番号 (文字列)",
    "label": "今季",
    "stats": {
      ${currentData.playerType === 'pitcher'
        ? '"era": "2.45", "whip": "1.05", "so": 156, "win": 12, "ip": "120.0", "sv": 0'
        : currentData.playerType === 'team'
        ? '"rank": 1, "winRate": ".615", "runs": 412, "runsAllowed": 305, "games": 60, "hr": 78'
        : '"pa": 245, "ab": 220, "avg": ".305", "hr": 18, "rbi": 52, "ops": ".945"'}
    }
  },
  "subPlayer": {
    "name": "比較対象 (昨季の同選手 or ライバル)",
    "label": "昨季",
    "stats": { /* mainPlayer と同じ stats キーを揃える */ }
  },

  "radarStats": {
    /* 5 軸のレーダーチャート用、各 main/sub は 0-100 の偏差値 */
    "isop":  { "main": 75, "sub": 60, "label": "長打力" },
    "isod":  { "main": 65, "sub": 55, "label": "選球眼" },
    "bb_k":  { "main": 70, "sub": 50, "label": "三振率" },
    "rc27":  { "main": 80, "sub": 65, "label": "得点創出" },
    "ab_hr": { "main": 72, "sub": 58, "label": "本塁打率" }
  },

  "comparisons": [
    /* ハイライト指標。台本 script.highlight で id 参照。最低 5 種類入れる。
       同じ指標で **対左/対右/通季** を変えたい場合は variants[] を使う。
       単純な比較しかしない指標は variants なしで valMain/valSub 直書き OK。 */
    {
      "id": "avg",
      "label": "打率",
      "kana": "だりつ",
      "desc": "打席で安打を打つ確率。野球の最も基本的な指標。",
      "criteria": "優秀: .300以上",
      "radarMatch": "打撃力",
      "unit": "",
      "variants": [
        { "id": "overall",  "label": "通季",     "valMain": ".305", "valSub": ".278", "mainLabel": "今季", "subLabel": "昨季", "winner": "main" },
        { "id": "vs_left",  "label": "対左投手", "valMain": ".201", "valSub": ".245", "mainLabel": "今季", "subLabel": "昨季", "winner": "sub" },
        { "id": "vs_right", "label": "対右投手", "valMain": ".342", "valSub": ".289", "mainLabel": "今季", "subLabel": "昨季", "winner": "main" }
      ]
    },
    {
      "id": "isop",
      "label": "ISO+",
      "kana": "アイソピー",
      "desc": "長打率と打率の差。純粋な長打力。",
      "formula": "長打率 - 打率",
      "criteria": "優秀: .200以上",
      "radarMatch": "長打力",
      "unit": "",
      "valMain": ".172",
      "valSub": ".095",
      "winner": "main"
    }
    /* 残り 3-8 種類: ISO-D, BB/K, OPS, OPS+, RC27, 出塁率, 長打率 等を網羅 */
  ],

  "layoutData": {
    /* 各レイアウト用のデータ。使わないレイアウトは省略可 */

    "timeline": {
      "unit": "month",
      "metric": "OPS",
      "points": [
        { "label": "4月", "main": ".724", "sub": ".598" },
        { "label": "5月", "main": ".810", "sub": ".621" }
      ]
    },

    "versus": {
      "categoryScores": [
        /* 各 category は label/main/sub。winner はアプリで自動判定 */
        { "label": "打率",   "kana": "だりつ", "main": ".305", "sub": ".278", "rawMain": ".305", "rawSub": ".278" },
        { "label": "本塁打", "main": 18, "sub": 12 },
        { "label": "OPS",    "main": ".945", "sub": ".812" }
      ]
    },

    "spotlight": {
      "players": [
        {
          "id": "okamoto",
          "name": "岡本和真",
          "team": "G",
          "label": "26年 (今季)",
          "primaryStat": { "label": "OPS", "value": ".945", "compareValue": { "label": "リーグ平均", "value": ".712" } },
          "stats": [
            { "label": "打率",   "value": ".305" },
            { "label": "本塁打", "value": 18 },
            { "label": "打点",   "value": 52 },
            { "label": "出塁率", "value": ".385" }
          ],
          "quotes": [
            /* 1選手 2-4 個の発言。台本 focusQuoteIndex で切替 */
            { "text": "もっと長打を打ちたい", "source": "2026/4 取材" },
            { "text": "守備位置はどこでも", "source": "2026/3 春季練習" },
            { "text": "監督の信頼に応えたい", "source": "2026/4 ヒーローインタビュー" }
          ]
        }
        /* 残り 2-4 人 (シーン毎に focusEntry で別選手にフォーカス) */
      ]
    },

    "ranking": {
      "metrics": [
        {
          "id": "ops",
          "label": "OPS",
          "kana": "オーピーエス",
          "unit": "",
          "entries": [
            { "rank": 1, "name": "選手名", "team": "G", "value": "1.013" },
            { "rank": 2, "name": "選手名", "team": "T", "value": ".945" }
            /* 5-10 人。team は球団略称 (G/T/D/S/B/E/L/F/H/M) */
          ]
        }
        /* 動画内で切替えたい metric を 2-3 個 */
      ]
    },

    "arsenal": {
      /* pitch_arsenal レイアウト用。投手データのみ */
      "mode": "single",
      "pitches": [
        { "name": "ストレート", "pct": 48, "avg": ".205", "velocity": 152, "color": "#ef4444" },
        { "name": "スプリット", "pct": 22, "avg": ".150", "velocity": 138, "color": "#3b82f6" },
        { "name": "スライダー", "pct": 18, "avg": ".180", "velocity": 132, "color": "#10b981" },
        { "name": "カーブ",     "pct": 8,  "avg": ".250", "velocity": 118, "color": "#f59e0b" }
      ]
    },

    "heatmap": {
      /* batter_heatmap レイアウト用。打者データのみ */
      "mode": "vs_handedness",
      "vsRight": [".180", ".240", ".290",   ".220", ".310", ".340",   ".150", ".220", ".260"],
      "vsLeft":  [".200", ".260", ".280",   ".210", ".280", ".320",   ".170", ".230", ".240"]
      /* 9 値 = 上段3 (内角・真中・外角) + 中段3 + 下段3 */
    }
  }
}
\`\`\`

## ★各項目の入力ガイド★
| 項目 | 内容 | 必須 |
|---|---|---|
| mainPlayer.name | 選手名 (例: "岡本和真") | ✅ |
| mainPlayer.stats | playerType 別キー (上記参照) | ✅ |
| comparisons | 5-10 種類の指標。各 id 一意、kana 必須 (TTS用) | ✅ |
| comparisons[].variants | 同指標で対左/対右/通季を持ちたい時のみ。なければ valMain/valSub 直書き | 任意 |
| layoutData.spotlight.players | 3-5 人、各 id 一意。quotes 2-4 個、stats 4-6 個 | spotlight 使うなら必須 |
| layoutData.ranking.metrics | 動画内で切替えたい metric。各 entries 5-10 人 | ranking 使うなら必須 |
| layoutData.timeline.points | 月別 or 試合別の推移 | timeline 使うなら必須 |
| layoutData.versus.categoryScores | 比較カテゴリ 5-7 個 | versus_card 使うなら必須 |
| layoutData.arsenal.pitches | 球種 4-6 種類 | pitch_arsenal 使うなら必須 |
| layoutData.heatmap.zones (single) または vsRight/vsLeft (vs_handedness) | 9 値の打率配列 | batter_heatmap 使うなら必須 |

## ★出力に含めない項目★ (UIで設定済、出力すると上書きで消える)
- hookMediaPattern / hookMediaDurationMs / hookAnimation / hookStats
- silhouetteType / theme / smartLoop / audio / aspectRatio / pattern
- scripts (台本は別工程)
- defaultScenePreset

## 既存データ (参考、フィールド名と形式を揃える)
\`\`\`json
${JSON.stringify(existingData, null, 2).slice(0, 3500)}
\`\`\`

## リサーチ
- web 検索で一次ソース (NPB 公式 > 球団公式 > 大手紙) を優先
- 数値は ${currentData.period || '直近'} 時点
- 推測でなく実数値を出す
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

## ★必須ルール (v10.2)★

### キャラ口調
- A=数原さん (男性40-50代、★必ず敬語★、「〜なんですよ」「〜ですね」「〜と言えますね」)
  ❌ NG: 「〜だよ」「〜だね」「〜だぞ」
- B=もえかちゃん (女性20代、基本敬語+感情で崩す、「〜ですね」「すごすぎませんか?」)

### 数値読み (speech)
- 打率系 (.333 形式): 打率/OPS/出塁率/被打率 → 「さんわりさんぶさんりん」
- 防御率系 (0.97 形式): ERA/WHIP/K/9/BB/9 → 「れいてんきゅうなな」/「いってんきゅうれい」
- 指標名はカタカナ: WHIP→ダブリュエイチアイピー, OPS→オーピーエス
- 選手名・チーム名はひらがな: 井上温大→いのうえはると
- 「実は」→「じつは」(誤読対策)

### emoji
- A は必ず "👨‍🏫" 固定
- B は 😲🤔🤯😨😯🧐😆🥹🥰😌🤩🥺😭😤😅 から1つ
- ❌ "A"/"B"/空文字/絵文字以外 NG

### 配分 (★30個前後、配分必須★)
- textSize: xl=1 (id:1のみ) / l=5-7 / m=18-22 / s=2-4
- scenePreset: default 12個以上、連続 4 ID 以上 NG
- se: 12-15 箇所、id:1=hook_impact 必須、id:30=outro_fade 必須
- zoomBoost: 2-3 箇所のみ、id:1 不要、文字列 "zoom"/"shake"

### id:1 (フック)
- 必ず主語 (選手名/チーム名)
- isCatchy: true、textSize: "xl"、se: "hook_impact"、zoomBoost なし
- 強調記号 【】「」『』 を 2 箇所以上
- 1ID あたり 3-12 字 × 3-4 行

### id:2-5 で A↔B 呼び合い両方向必須
- B → A: 「数原さん」呼び 1 回以上
- A → B: 「もえかちゃん」呼び 1 回以上

### text (テロップ)
- 句点「。」禁止
- 数値は【.305】、指標名は「OPS」、衝撃ワードは『覚醒』で囲う

## ★1動画内でデータを使い分け★
1動画内で複数の選手にフォーカスしたり、同じ選手の複数の quote を使い分けたりするのが想定。
- script.layoutType で **シーンごとにレイアウト切替** (radar_compare → player_spotlight → ranking 等)
- script.spotlightMode で **選手スポットの表示パターンをシーンごとに切替** (default/quote/stats_grid/single_metric)
  ★重要★ quote モードにしたいシーンには必ず spotlightMode: "quote" を明記。省略するとグローバル設定 (通常 default) が使われる
- script.focusEntry で **シーンごとに別の player.id** を指定 (★player.id と完全一致させること★)
- script.focusQuoteIndex で **同じ player の中で別の quote** を指定 (player.quotes[idx])
- script.focusMetric で **ranking の metric をシーンごとに切替** (ranking.metrics[].id)
- script.highlight で **シーンごとに別の comparison.id** を指定 (★3-5 ID 連続で同じ id を使う、id:1-3 と id:26-30 は省略★)

## ★ハイライト紐付け重要★
comparisons には台本で言及する全指標を含めること (5-7 個推奨)。
例: 台本で「援護率」を言及するなら comparisons に run_support を必ず入れる。

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
