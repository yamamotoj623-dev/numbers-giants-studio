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
// ★v5.21.7★ customPromptRaw の import 廃止
// 旧版は docs/layout-templates.md を素 Gemini 向けプロンプトに埋め込んでいたが、
// 新版は Gem の Knowledge Files として運用するため、アプリ側で埋め込む必要なし。

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
      let parsed = JSON.parse(text);

      // ★v5.21.8 FIX★ Gemini が { "projectData": {...} } 形式で出力した場合、ラッパーを剥がす
      //   - data モード: { projectData: {...} } → projectData の中身に正規化
      //   - whole モード: { projectData: {...}, scripts: [...] } → projectData の中身 + scripts に正規化
      //   - script モード: { scripts: [...] } はラッパーなしなのでそのまま
      // これがないと「データだけ反映押しても画面に出ない」問題が起きる(projectData ネストのままで mergeProjectData が中身を見つけられない)
      if (parsed && typeof parsed === 'object' && parsed.projectData && typeof parsed.projectData === 'object') {
        const scriptsOutside = Array.isArray(parsed.scripts) ? parsed.scripts : null;
        parsed = { ...parsed.projectData };
        if (scriptsOutside) {
          parsed.scripts = scriptsOutside;
        }
      }

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
        'outroMediaPattern', // ★v5.21.4★ アウトロメディアの揺れ方も AI に触らせない
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
    copyToClipboard(prompt, flashMsg);
  };

  // ★v5.21.5★ チェック系プロンプトのコピー(汎用ヘルパー)
  const copyToClipboard = (text, flashMsg) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
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

  // ★v5.21.5★ 各チェック系プロンプトのハンドラ
  const handleCopyLayoutAdvisor = () => {
    copyToClipboard(buildLayoutAdvisorPrompt(projectData), '🎯 レイアウト適合チェックをコピーしました! AI に貼り付けてください');
  };
  const handleCopyDataFactCheck = () => {
    copyToClipboard(buildDataFactCheckPrompt(projectData), '🔍 データファクトチェックをコピーしました! Grok に貼り付けてください');
  };
  const handleCopyDataGapFill = () => {
    copyToClipboard(buildDataGapFillPrompt(projectData), '🧩 データ欠損埋めリサーチをコピーしました! Grok に貼り付けてください');
  };
  const handleCopyScriptReview = () => {
    copyToClipboard(buildScriptReviewPrompt(projectData), '📋 台本整合チェックをコピーしました! AI に貼り付けてください');
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

      {/* ★v5.21.8★ AI でチェック系プロンプト(v10.2-patched 単一 Gem 運用、Grok リサーチ + 各種チェック) */}
      <details className="mb-3 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden" open={false}>
        <summary className="text-[11px] font-bold text-amber-900 px-3 py-2 cursor-pointer hover:bg-amber-100 select-none flex items-center gap-1">
          🔍 AI でチェック (Grok / Gem の出力をレビュー)
        </summary>
        <div className="p-2 grid grid-cols-2 gap-1.5">
          <button
            onClick={handleCopyLayoutAdvisor}
            title="現在のデータで、このレイアウトがベストか?他に適したレイアウト候補がないか判定"
            className="text-[10px] font-bold py-2 px-2 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded shadow-sm transition flex items-center justify-center gap-1 text-left leading-tight"
          >
            🎯 レイアウト<br/>適合チェック
          </button>
          <button
            onClick={handleCopyScriptReview}
            title="台本JSON を 8 観点でレビュー: 文字数・初見理解・スワイプ対策・キャラ役割・SE/レイアウト配置・NGワード"
            className="text-[10px] font-bold py-2 px-2 bg-white hover:bg-violet-50 border border-violet-200 text-violet-800 rounded shadow-sm transition flex items-center justify-center gap-1 text-left leading-tight"
          >
            📋 台本JSON<br/>整合チェック
          </button>
          <button
            onClick={handleCopyDataFactCheck}
            title="Grok で データJSON の数字を最新公式情報で検証(ファクトチェック + ソース明示)"
            className="text-[10px] font-bold py-2 px-2 bg-white hover:bg-sky-50 border border-sky-200 text-sky-800 rounded shadow-sm transition flex items-center justify-center gap-1 text-left leading-tight"
          >
            🔍 データ<br/>ファクトチェック
          </button>
          <button
            onClick={handleCopyDataGapFill}
            title="Grok でデータJSON の「-」項目をリサーチで埋める"
            className="text-[10px] font-bold py-2 px-2 bg-white hover:bg-cyan-50 border border-cyan-200 text-cyan-800 rounded shadow-sm transition flex items-center justify-center gap-1 text-left leading-tight"
          >
            🧩 データ欠損<br/>埋めリサーチ
          </button>
        </div>
        <div className="px-3 pb-2 text-[9px] text-amber-700">
          ★レイアウト/台本チェックは Gemini や Claude が向く / ファクトチェック・欠損埋めは Grok 向け
        </div>
      </details>

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
 * ★v5.21.8★ Gem 全体モード用プロンプト (whole)
 *
 * v10.2-patched 単一 Gem 向け、初回ベース作成用の全体 JSON 生成プロンプト。
 *
 * 推奨運用:
 * 1. Grok でリサーチ → FULL_AUTO 出力をユーザーに提示
 * 2. このボタンで生成した「アプリ側プロンプト」をコピー
 * 3. Grok 出力 + アプリ側プロンプトを Gem に貼り付け
 * 4. Gem が初回ベース JSON を出力
 */
function buildAIPrompt(currentData, templateData) {
  const playerTypeLabel =
    currentData.playerType === 'batter' ? '野手' :
    currentData.playerType === 'pitcher' ? '投手' :
    'チーム';

  return `# タスク

★モード: 全体(初回ベース作成 = projectData + scripts 一括)★

## 動画基本情報
- aspectRatio: ${currentData.aspectRatio || '9:16'}(出力 JSON には含めない、設計判断のみ)
- playerType: "${currentData.playerType}"(${playerTypeLabel})
- theme: "${currentData.theme || 'orange'}"(出力には含めない)

## ${playerTypeLabel}用スキーマテンプレート(これを型として projectData を埋め、scripts を生成)
\`\`\`json
${JSON.stringify(templateData, null, 2)}
\`\`\`

★ Gem instruction と Knowledge Files(特に json-schema-rules.md / layout-templates.md)の全ルール厳守。出力前チェック必須。★
`;
}

/**
 * ★v5.21.7-11★ Gem データ単体モード用プロンプト (data)
 *
 * 既存データ JSON を入力として渡し、レイアウト/ハイライト/表現の調整を依頼。
 * 出力は projectData のみ(scripts は出力しない)。
 */
function buildDataJsonPrompt(currentData, templateData) {
  const playerTypeLabel = currentData.playerType === 'batter' ? '野手' : currentData.playerType === 'pitcher' ? '投手' : 'チーム';
  const { data: existingData } = splitProjectData(currentData);
  const currentLayout = currentData.layoutType || 'radar_compare';

  // ★v5.21.10★ layoutData の正確なスキーマ例(レイアウト別)
  // これがないと Gemini が推測で ratio/speed や ".375" 文字列を出してしまう
  const layoutDataExamples = {
    pitch_arsenal: `"layoutData": {
  "arsenal": {
    "mode": "single",           // 省略可: "single" / "compare" / "vs_batter"
    "pitches": [
      { "name": "ストレート", "pct": 48, "avg": 0.205, "velocity": 152, "color": "#ef4444" },
      { "name": "フォーク",   "pct": 22, "avg": 0.150, "velocity": 138, "color": "#3b82f6" }
    ]
  }
}
★重要★ avg / pct / velocity は **数値型**(0.205 / 48 / 152)。文字列 ".205" / "48%" は NG(アプリで toFixed() エラー)`,

    batter_heatmap: `"layoutData": {
  "heatmap": {
    "mode": "single",  // または "vs_handedness"
    "zones": [0.180, 0.240, 0.290, 0.220, 0.310, 0.340, 0.150, 0.220, 0.260]  // 数値推奨
  }
}`,

    radar_compare: `"layoutData": {}  // radarStats を使うのでここは空 OK`,

    timeline: `"layoutData": {
  "timeline": {
    "label": "月別打率",
    "points": [
      { "x": "4月", "value": 0.250 },
      { "x": "5月", "value": 0.320 }
    ]
  }
}
★avg/value は数値型★`,

    versus_card: `"layoutData": {
  "versus": {
    "headerLabel": "対戦成績",
    "rows": [
      { "label": "打率", "valA": ".333", "valB": ".280" },
      { "label": "防御率", "valA": "2.10", "valB": "3.50" }
    ]
  }
}`,

    player_spotlight: `"layoutData": {
  "spotlight": {
    "primaryStat": { "label": "打率", "value": ".345" },
    "stats": [ { "label": "OPS", "value": ".945" } ],
    "quotes": [ { "text": "...", "source": "..." } ]
  }
}`,

    ranking: `"layoutData": {
  "ranking": {
    "label": "セ・リーグ打率トップ",
    "entries": [
      { "rank": 1, "name": "選手A", "value": ".345" },
      { "rank": 2, "name": "選手B", "value": ".333" }
    ]
  }
}`,

    team_context: `"layoutData": {
  "context": {
    "title": "チーム順位推移",
    "rows": [ { "label": "...", "value": "..." } ]
  }
}`,
  };

  const layoutExample = layoutDataExamples[currentLayout] || layoutDataExamples.radar_compare;

  return `# タスク

★モード: データ単体(scripts は出力しない、データ部分のみ)★

## 動画基本情報
- aspectRatio: ${currentData.aspectRatio || '9:16'}(出力 JSON には含めない)
- playerType: "${currentData.playerType}"(${playerTypeLabel})
- 現在の layoutType: "${currentLayout}"(変えても OK)

## 出力形式(★以下のいずれかで出力★、アプリは両方を自動認識)
\`\`\`json
// 形式 A: フラット(推奨)
{
  "layoutType": "${currentLayout}",
  "playerType": "${currentData.playerType}",
  "teamPreset": "...",
  "mainPlayer": { ... },
  "subPlayer": { ... },
  "radarStats": { ... },
  "comparisons": [ ... ],
  "layoutData": { ... }
}
// 形式 B: projectData ラッパー(OK)
{ "projectData": { ...上記と同じ中身... } }
\`\`\`

## ★現在の layoutType "${currentLayout}" の layoutData スキーマ例★(★ここから外れた構造は NG★)
\`\`\`json
${layoutExample}
\`\`\`

## 重点チェック項目
1. layoutType がデータに最適か検証(timeline / radar_compare / versus_card / spotlight 等)。変更時は ★その layoutType 専用の layoutData スキーマ★ を Knowledge \`layout-templates.md\` で確認
2. comparisons 5-10 個、radarMatch=true は 1-5 個、variants[] でスコープ切替を活用
3. comparisons の valMain / valSub は **文字列**(打率 ".345" / 防御率 "0.97" / 整数 "13")
4. layoutData 内の avg / pct / velocity / value / value 系は **数値型**(0.205 / 48 / 152)、文字列 ".205" は NG
5. 「-」項目を可能なら埋める(web 検索で最新値)、無理なら "-" 明示
6. radarStats は NPB 平均 50 ベースの偏差値(優秀 70+ / 突出 85+)

## 既存データ(参考、フィールド名と形式を揃える)
\`\`\`json
${JSON.stringify(existingData, null, 2).slice(0, 3500)}
\`\`\`

★ Gem instruction と Knowledge Files(\`json-schema-rules.md\` §3 数値整形 / \`layout-templates.md\` レイアウト別)の全ルール厳守。出力前チェック必須。違反時は完全再生成。★
`;
}

function buildScriptJsonPrompt(currentData, templateData) {
  const { data: existingData } = splitProjectData(currentData);
  const playerTypeLabel = currentData.playerType === 'batter' ? '野手' : currentData.playerType === 'pitcher' ? '投手' : 'チーム';

  // データの抜粋: 台本生成で参照すべき要素 (comparisons の id, players の id 等)
  const compIds = (existingData.comparisons || []).map(c => `${c.id} (${c.label})`).join(', ') || '(未定義)';
  const playerIds = (existingData.layoutData?.spotlight?.players || [])
    .map(p => `${p.id || p.name} (${p.name}${p.team ? `, ${p.team}` : ''})`)
    .join(', ') || '(未定義)';

  return `# タスク

★モード: 台本単体(scripts 配列のみ出力、projectData は出力しない)★

## 動画基本情報
- aspectRatio: ${currentData.aspectRatio || '9:16'}(出力 JSON には含めない)
- playerType: "${currentData.playerType}"(${playerTypeLabel})
- mainPlayer: ${existingData.mainPlayer?.name || '(未指定)'}
- subPlayer: ${existingData.subPlayer?.name || '(未指定)'}
- script.highlight に指定可能な比較 ID: ${compIds}
- script.focusEntry に指定可能な選手 ID: ${playerIds}

## 重点
- 既存 projectData を完全尊重(変えない、参照のみ)
- script.highlight には既存 comparisons の id を指定(参照ズレ NG)

## 既存 projectData(参照のみ、変更しない)
\`\`\`json
${JSON.stringify(existingData, null, 2).slice(0, 4000)}
\`\`\`

★ Gem instruction と Knowledge Files の全ルール厳守(キャラ口調 / id ルール / text-speech 一致 / 出力前チェック)。違反時は完全再生成。★
`;
}
// ============================================================================
// ★v5.21.8★ AI チェック系プロンプト (4 種)
// v10.2-patched 単一 Gem 運用 (Grok リサーチ → Gem 単独で生成) の各段階で
// 「見落とし発見」「ファクトチェック」「整合確認」をするためのプロンプト集。
// ============================================================================

/**
 * ★v5.21.5★ ① データレイアウト適合チェック
 * 現在の data + layoutType を見て、最適なレイアウトを使えているか判定。
 * 「このデータならレーダー使った方がいいよね」的な見落とし発見が目的。
 */
function buildLayoutAdvisorPrompt(currentData) {
  const { data: dataPart } = splitProjectData(currentData);
  const currentLayout = currentData.layoutType || '(未指定)';
  const layoutCatalog = Object.entries(LAYOUT_TYPES)
    .map(([key, info]) => `  - ${key}: ${info.label} — ${info.desc}`)
    .join('\n');

  return `# データレイアウト適合チェック

以下の data JSON と現在の layoutType を見て、最適なレイアウトを使えているか判定してください。

## 現在の layoutType: \`${currentLayout}\`

## 使える 8 種のレイアウト
${layoutCatalog}

## 判定してほしいこと
1. **現在の layoutType が、このデータの強みを最大限活かせているか?**
2. **より適したレイアウト候補があれば、どれか + なぜそちらが良いか?**
3. **データに対して「このレイアウトじゃないと活きない指標」の見落としがないか?**
   - 例: 月別推移データがあるのに timeline を使っていない
   - 例: 対左/対右の variants があるのに versus_card を使っていない
   - 例: 5 軸の偏差値が radarStats にあるのに radar_compare を使っていない
   - 例: 複数選手の player_spotlight 用データがあるのに ranking を使っている

## data JSON
\`\`\`json
${JSON.stringify(dataPart, null, 2).slice(0, 6000)}
\`\`\`

## 出力形式 (Markdown)
- ★判定結果★: 適切 / 改善余地あり / 不適切
- ★推奨レイアウト★: <現在維持 or 別レイアウト>
- ★根拠★: データのどの部分が、なぜそのレイアウトに最も合うか
- ★他の選択肢★: 2 番目に良いレイアウト + 短所
- ★アクション★: layoutType を変える場合の追加データ補完項目
`;
}

/**
 * ★v5.21.5★ ② データ JSON ファクトチェック (Grok 向け)
 * 数字の正確性を Grok のリアルタイム情報で検証。
 */
function buildDataFactCheckPrompt(currentData) {
  const { data: dataPart } = splitProjectData(currentData);

  return `# データ JSON ファクトチェック (Grok 向け)

以下の data JSON の **すべての数字** を最新の公式情報で検証してください。

## 検証してほしいこと
1. **各数字の正確性** — NPB 公式 / スポナビ / 1.02 / 球団公式で最新値と一致するか
2. **出典 URL と取得日を明示** — 数字ごとにソースを示す
3. **異常値・矛盾値の発見**
   - 例: 防御率 0.50 だが WHIP 1.40 → 整合性疑問
   - 例: 打率 .500 だが OPS .800 → 数値ズレ可能性
4. **「-」になっている項目** — 取得可能なら値とソースを提案
5. **古い数字** — 2-3 試合分の古いスナップショットになっていないか

## data JSON
\`\`\`json
${JSON.stringify(dataPart, null, 2).slice(0, 8000)}
\`\`\`

## 出力形式 (Markdown)
- ★全体判定★: 問題なし / 軽微な誤り / 重大な誤り
- ★誤り一覧★: \`項目名\` 現値 → 正値 (出典 URL, 取得日)
- ★「-」項目の埋め提案★: \`項目名\` → 取得値 or 「取得不可」
- ★整合性疑問点★: 矛盾するように見える数字の組み合わせ
- ★修正版 data JSON★ (誤りがあった場合のみ): 修正済みの完全な JSON
`;
}

/**
 * ★v5.21.5★ ③ データ JSON 欠損埋めリサーチ (Grok 向け)
 * 「-」項目をリサーチで埋めるための依頼。
 */
function buildDataGapFillPrompt(currentData) {
  const { data: dataPart } = splitProjectData(currentData);

  // 「-」項目をざっくり検出
  const dataStr = JSON.stringify(dataPart);
  const dashCount = (dataStr.match(/"-"/g) || []).length;

  return `# データ JSON 欠損埋めリサーチ (Grok 向け)

以下の data JSON で **値が "-" になっている項目** をリサーチで埋めてください。

## 検出された "-" 項目数: 約 ${dashCount} 個

## やってほしいこと
1. **「-」になっている項目を全部発見**
2. **NPB 公式 / 各球団 / 1.02 / スポナビ で値を取得**
3. **ソース URL と取得日を明示**
4. **取得不可な項目は理由を明記**(有料データ要、公開なし、計算困難 等)
5. **取得した値の整合性チェック** — 他の項目と矛盾しないか

## 重要ルール
- ★打率系 (avg/obp/slg/OPS/被打率/BABIP/IsoP) は \`.345\` 形式★ (先頭 0 省略)
- ★防御率系 (ERA/WHIP/FIP/K9) は \`0.97\` 形式★ (先頭 0 残す)
- 整数 0 → "0" のまま (本塁打 0、勝利 0 等は意味のある値)
- 取得不可は "-" のまま
- すべての数値は **文字列で出力**

## data JSON
\`\`\`json
${JSON.stringify(dataPart, null, 2).slice(0, 8000)}
\`\`\`

## 出力形式 (Markdown)
- ★埋まった項目★: \`項目名\` → 値 (出典 URL, 取得日)
- ★依然「-」の項目★: \`項目名\` → 取得不可 (理由)
- ★修正版 data JSON★: 完全な JSON (整形ルール厳守)
`;
}

/**
 * ★v5.21.5★ ④ 台本 JSON 整合チェック
 * data + scripts を見て、複数観点でレビュー。
 */
function buildScriptReviewPrompt(currentData) {
  const scripts = currentData.scripts || [];

  return `# 台本 JSON 整合チェック (構成・スワイプ対策・キャラ役割)

以下の data + scripts を見て、複数の観点で問題を発見してください。

## チェック観点(★全て検証★)

### 1. データ前提との整合性
- scripts で言及している数字が data JSON と一致しているか
- comparisons に台本言及全指標が含まれているか
- 数値整形(打率系 .345 / 防御率系 0.97)が守られているか

### 2. id:1 (タイトル/フック) の設計
- **4 原則チェック**: 1 選手フォーカス / 具体数値 or 物語キーワード / タイトル長 25-32 字 / 「数字+矛盾」型を優先検討
- **NG パターン**: 結論先出し型(「もう打てません」「大苦戦する理由」)、阿部監督批判型、他球団選手比較型、飽和パワーワード単独使用(致命的/絶望/衝撃/異常事態/完全崩壊)
- **戦略適合**: id:1 戦略 A 派手 / B 数字主役 / C 静物 / D ぬるっと のうちどれが選ばれていて、textSize/scenePreset/se が整合しているか

### 3. 初見でも理解できるか
- 専門用語(Stuff+ / WHIP / BABIP / IsoP 等)に説明があるか
- 抽象的すぎないか
- 「現象 → 数字」の順で語れているか(audience-and-language.md §1 原則)

### 4. スワイプ率・視聴維持率対策
- id:1 が 0.5-1 秒で「謎・疑問」を提示しているか
- id:4-7 で核心数字を最速提示しているか
- id:23-26 で「アハ体験(根本原因)」になっているか
- id:27-30 のアウトロが文脈ある二択 or 問いかけで終わるか
- 阿部監督批判型 (-3.2pt 逆効果) / 他球団選手 vs 巨人選手 (維持率 17-18%) のような失敗パターンを踏んでないか

### 5. キャラの役割が守られているか
- A (数原さん) が **全部敬語**か、タメ口が混入してないか
- B (もえか) が「鋭い感想を言うコアファン枠」として動いているか(萌え寄りではない)
- 「ヤバい」は B のみ、1 動画 1-2 回まで、疑問形 + 敬語、直前に冷静観察文
- 同 speaker 連続最大 4 回まで(5 回以上 NG)
- 同 scenePreset / se も連続最大 4 ID まで
- id:2-5 で **A↔B 呼び合い両方向**(A→B「もえかちゃん」、B→A「数原さん」)
- emoji: A は \`👨‍🏫\`、B は指定 15 種(😲🤔🤯😨😯🧐😆🥹🥰😌🤩🥺😭😤😅)から 1 つ。指定外(💦🔥👇📺💪🎯📈⚾❓💡⚠️ 等)は NG

### 6. 文字数とテンポ(text プロパティ)
- 1 ID あたり: 縦長 **3-12 字 × 3-4 行(合計 12-30 字)** / 横長 **8-20 字 × 1-2 行**
- 句点「。」が text に入ってないか
- 数値は【】、指標名は「」、衝撃ワードは『』で囲ってあるか
- 長すぎ・短すぎの ID 一覧
- ★text と speech の文章内容が完全一致しているか(表記のみ違いは OK: \`75%\` ⇄ \`ななじゅうごぱーせんと\`)★
- ★speech 内の「、」が極力削られているか(全角スペース「　」で代用)★
- ★id:1 が分割されず動画タイトルとして独立しているか(text = タイトル / speech = 1-2 秒フック)★

### 7. SE / scenePreset / textSize 配分(★ベスト配置か★)
- **textSize**: xl=1 (id:1 のみ、戦略 A/B のみ) / l=5-7 / m=18-22 / s=2-4
- **scenePreset**: default を半数以上、連続最大 4 ID まで(5 ID 以上 NG)
- **SE**: 12-15 箇所、hook_impact (or stat_reveal) 必須 (id:1)、outro_fade 必須 (id 最終)
- **shock_hit を 3 回以上使ってないか**(過剰演出)
- **同 SE が 5 ID 連続してないか**(連続最大 4 ID)
- **連続 5 ID 以上 SE 無しになってないか**
- **zoomBoost** が 2-3 箇所のみ使われているか、★文字列 \`"zoom"\`/\`"shake"\` か★(boolean NG)
- ★se の値が定義 18 種から選ばれているか★(\`title_call\` \`pop_up\` \`action\` \`analytical\` \`emotional\` は列挙値違反)

### 8. NG ワード混入
- 願望系(期待 / 応援 / 頑張れ / 信じる)
- 誇張系(本当の / 可能性 / 驚愕 / コメントで教えて)
- 飽和パワーワード(致命的 / 絶望 / 衝撃 / 異常事態 / 完全崩壊 / 暴く)

### 9. ★JSON スキーマ違反検出★(構造レベル)
- ルートキー: \`"scripts"\`(複数)になっているか(\`"script"\` 単数 NG)
- comparisons のキー: \`label\` / \`valMain\` / \`valSub\` / \`winner\`(\`name\` / \`targetA\` / \`valueA\` NG)
- \`mainPlayer\` が projectData 内に存在するか
- \`layoutType\` が単一文字列か(\`layouts\` 配列 NG)
- projectData に \`theme\` \`aspectRatio\` \`hookStats\` 等の「出力に含めない項目」が混入してないか
- criteria が数値表現か(\`lower_is_better\` 等 NG)

## data JSON (抜粋)
\`\`\`json
${JSON.stringify({
  layoutType: currentData.layoutType,
  playerType: currentData.playerType,
  mainPlayer: currentData.mainPlayer,
  subPlayer: currentData.subPlayer,
  comparisons: currentData.comparisons,
}, null, 2).slice(0, 4000)}
\`\`\`

## scripts JSON
\`\`\`json
${JSON.stringify(scripts, null, 2).slice(0, 12000)}
\`\`\`

## 出力形式 (Markdown)
各観点で **◎(問題なし)/ ◯(軽微)/ △(要改善)/ ✕(致命的)** で判定。
- ★総合判定★: そのまま使える / 微調整推奨 / 大幅修正必要
- ★観点別評価★: 1-8 を順番に評価、問題があれば具体的な ID と修正案
- ★優先修正 TOP 3★: 最も視聴維持率に影響しそうな箇所
- ★推奨修正版★ (任意): 修正版の scripts 抜粋(問題があった ID のみ)
`;
}

