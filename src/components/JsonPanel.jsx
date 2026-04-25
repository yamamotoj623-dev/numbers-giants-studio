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
// ★ docs/gemini-custom-prompt.md を Vite ?raw で読み込み (一本化、v5.10.1)
// これにより、コピーボタンでも docs と同一の内容が出力される
import customPromptRaw from '../../docs/gemini-custom-prompt.md?raw';

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
