/**
 * 台本直接編集パネル (改善版 v5.6.0)
 *
 * 改善点:
 * - layoutType ドロップダウンを各scriptに追加 (動画内切替用)
 * - highlight ドロップダウン (comparisons から選択)
 * - textSize ドロップダウン (s/m/l/xl)
 * - 現在再生中のシーンに自動スクロール
 * - シーン移動 (上↑↓下) ボタン
 * - 削除・複製ボタン
 * - 重要フィールド常時表示、詳細フィールドは折り畳み式
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { SE_PRESETS, LAYOUT_TYPES } from '../lib/config';
import { SCENE_PRESETS } from '../lib/scenePresets';

export function ScriptEditorPanel({ projectData, currentIndex, onChange }) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const containerRef = useRef(null);
  const currentRef = useRef(null);

  // 再生中シーンに自動スクロール
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  const handleChange = (id, field, value) => {
    const updated = {
      ...projectData,
      scripts: (Array.isArray(projectData.scripts) ? projectData.scripts : []).map(s => s.id === id ? { ...s, [field]: value } : s),
    };
    onChange(updated);
  };

  const handleMove = (idx, dir) => {
    const newScripts = [...projectData.scripts];
    const target = idx + dir;
    if (target < 0 || target >= newScripts.length) return;
    [newScripts[idx], newScripts[target]] = [newScripts[target], newScripts[idx]];
    newScripts.forEach((s, i) => { s.id = i + 1; });
    onChange({ ...projectData, scripts: newScripts });
  };

  const handleDuplicate = (idx) => {
    const original = projectData.scripts[idx];
    const newScripts = [...projectData.scripts];
    newScripts.splice(idx + 1, 0, { ...original, id: 0 });
    newScripts.forEach((s, i) => { s.id = i + 1; });
    onChange({ ...projectData, scripts: newScripts });
  };

  const handleDelete = (idx) => {
    if (!window.confirm(`シーン ${idx + 1} を削除しますか?`)) return;
    const newScripts = projectData.scripts.filter((_, i) => i !== idx);
    newScripts.forEach((s, i) => { s.id = i + 1; });
    onChange({ ...projectData, scripts: newScripts });
  };

  const handleAdd = () => {
    const newScript = {
      id: projectData.scripts.length + 1,
      speaker: 'A',
      emoji: '👨‍🏫',
      text: '新しいシーン',
      speech: '新しいシーン',
      highlight: null,
      textSize: 'm',
      se: null,
    };
    onChange({ ...projectData, scripts: [...projectData.scripts, newScript] });
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const comparisons = projectData.comparisons || [];

  // ★v5.18.4★ focusEntry 候補を layoutData から動的取得
  // player_spotlight: spotlight.players[].id / .name
  // ranking: ranking.metrics[].entries[].name
  // versus_card: versus.categoryScores[].label (これは通常 highlight の方が適切なので除外)
  const focusEntryCandidates = (() => {
    const set = new Map();  // key=value, val=label

    // player_spotlight
    const spotlight = projectData.layoutData?.spotlight;
    if (spotlight?.players) {
      for (const p of spotlight.players) {
        if (p.id) set.set(p.id, `[選手] ${p.name || p.id}${p.label ? ` — ${p.label}` : ''}`);
      }
    }

    // ranking
    const ranking = projectData.layoutData?.ranking;
    if (ranking?.metrics) {
      for (const m of ranking.metrics) {
        if (!m.entries) continue;
        for (const e of m.entries) {
          if (e.name && !set.has(e.name)) {
            set.set(e.name, `[Rank] ${e.name}${e.team ? ` (${e.team})` : ''}`);
          }
        }
      }
    }

    return Array.from(set.entries()).map(([value, label]) => ({ value, label }));
  })();

  return (
    <div ref={containerRef} className="p-3 space-y-2">
      <button
        onClick={handleAdd}
        className="w-full bg-indigo-50 hover:bg-indigo-100 border-2 border-dashed border-indigo-300 text-indigo-600 font-bold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1"
      >
        <Plus size={14}/> シーン追加
      </button>

      {(Array.isArray(projectData.scripts) ? projectData.scripts : []).map((script, idx) => {
        const isCurrent = currentIndex === idx;
        const isExpanded = expandedIds.has(script.id);
        const speakerColor = script.speaker === 'B' ? 'bg-sky-50 border-sky-200' : 'bg-orange-50 border-orange-200';
        return (
          <div
            key={script.id}
            ref={isCurrent ? currentRef : null}
            className={`border rounded-lg p-2 shadow-sm transition-all ${isCurrent ? 'ring-2 ring-indigo-500 bg-white' : speakerColor}`}
          >
            <div className="flex justify-between items-center gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isCurrent ? 'bg-indigo-500 text-white' : 'bg-zinc-700 text-white'}`}>
                  #{idx + 1}
                </span>
                {projectData.presentationMode !== 'narration' && (
                  <>
                    <input
                      type="text"
                      maxLength={2}
                      value={script.emoji || ''}
                      onChange={(e) => handleChange(script.id, 'emoji', e.target.value)}
                      className="w-7 h-7 text-[14px] flex items-center justify-center text-center bg-white border border-zinc-200 outline-none rounded-full cursor-pointer shadow-sm focus:ring-1 focus:ring-indigo-400"
                      placeholder="😀"
                    />
                    <select
                      value={script.speaker || 'A'}
                      onChange={(e) => handleChange(script.id, 'speaker', e.target.value)}
                      className={`text-[10px] px-1.5 py-0.5 border outline-none font-black rounded cursor-pointer ${script.speaker === 'B' ? 'bg-sky-100 text-sky-700 border-sky-300' : 'bg-orange-100 text-orange-700 border-orange-300'}`}
                    >
                      <option value="A">A 解説</option>
                      <option value="B">B ファン</option>
                    </select>
                  </>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 p-1" title="上に移動"><ArrowUp size={12}/></button>
                <button onClick={() => handleMove(idx, 1)} disabled={idx === projectData.scripts.length - 1} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 p-1" title="下に移動"><ArrowDown size={12}/></button>
                <button onClick={() => handleDuplicate(idx)} className="text-zinc-400 hover:text-indigo-600 p-1" title="複製"><Copy size={12}/></button>
                <button onClick={() => handleDelete(idx)} className="text-zinc-400 hover:text-red-600 p-1" title="削除"><Trash2 size={12}/></button>
                <button onClick={() => toggleExpand(script.id)} className="text-zinc-500 hover:text-indigo-600 p-1" title="詳細">
                  {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
              </div>
            </div>

            <textarea
              value={script.text || ''}
              onChange={(e) => handleChange(script.id, 'text', e.target.value)}
              className="w-full text-[12px] font-bold text-zinc-800 bg-white/70 border border-zinc-200 rounded p-1.5 outline-none focus:ring-1 focus:ring-indigo-400 leading-relaxed resize-none"
              rows={2}
              placeholder="テロップ表示テキスト (改行可)"
            />

            {/* 簡易プレビュー: layoutType / highlight / focusEntry 等が設定されてれば常時表示 */}
            {!isExpanded && (script.layoutType || script.highlight || script.focusEntry || script.spotlightMode || script.scenePreset) && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {script.scenePreset && (
                  <span className="text-[9px] bg-fuchsia-100 text-fuchsia-700 font-bold px-1.5 py-0.5 rounded">
                    🎬 {script.scenePreset}
                  </span>
                )}
                {script.layoutType && (
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                    🎨 {LAYOUT_TYPES[script.layoutType]?.label || script.layoutType}
                  </span>
                )}
                {script.spotlightMode && (
                  <span className="text-[9px] bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded">
                    👤 {script.spotlightMode}
                  </span>
                )}
                {script.focusEntry && (
                  <span className="text-[9px] bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded">
                    🎯 {script.focusEntry}
                  </span>
                )}
                {script.highlight && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                    ⭐ {comparisons.find(c => c.id === script.highlight)?.label || script.highlight}
                    {script.highlightScope && <span className="ml-0.5 text-amber-600">/{script.highlightScope}</span>}
                  </span>
                )}
                {script.focusMetric && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                    📊 {script.focusMetric}
                  </span>
                )}
                {script.se && (
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                    🔊 {SE_PRESETS.find(s => s.id === script.se)?.label || script.se}
                  </span>
                )}
              </div>
            )}

            {isExpanded && (
              <div className="mt-2 space-y-1.5 border-t pt-2">
                {/* ★v5.19.0★ フック (id:1) 専用: 画像/動画インサート */}
                {script.isCatchy && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
                    <label className="text-[10px] font-bold text-amber-800 block mb-1">
                      🎬 フック画像/動画 (冒頭に一瞬表示されるインサート)
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="text-[10px] flex-1"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const { saveHookMedia } = await import('./HookMediaOverlay.jsx');
                            const type = file.type.startsWith('video') ? 'video' : 'image';
                            await saveHookMedia(file, type);
                            alert(`✅ フック${type === 'video' ? '動画' : '画像'}を登録しました。再読み込みで反映されます。`);
                          } catch (err) {
                            alert('保存に失敗しました: ' + err.message);
                          }
                        }}
                      />
                      <button
                        onClick={async () => {
                          try {
                            const { clearHookMedia } = await import('./HookMediaOverlay.jsx');
                            await clearHookMedia();
                            alert('フックメディアを削除しました');
                          } catch (err) {
                            alert('削除に失敗: ' + err.message);
                          }
                        }}
                        className="text-[9px] bg-zinc-200 hover:bg-red-100 text-zinc-600 hover:text-red-600 px-2 py-1 rounded"
                      >
                        削除
                      </button>
                    </div>
                    <div className="text-[9px] text-amber-700 mt-1">
                      PNG/JPG/WebP/MP4 対応。
                      <span className="text-amber-900 font-bold"> id:1 の TTS が終わるまで自動表示</span>。
                    </div>
                    {/* ★v5.19.0★ 切替アニメーションパターン選択 */}
                    <div className="mt-1.5">
                      <label className="text-[9px] text-amber-700 font-bold">切替パターン:</label>
                      <select
                        value={projectData.hookMediaPattern || 'flash'}
                        onChange={(e) => onChange({ ...projectData, hookMediaPattern: e.target.value })}
                        className="ml-1 text-[10px] bg-white px-1.5 py-0.5 border border-amber-200 rounded outline-none"
                      >
                        <option value="flash">⚡ flash (フラッシュ→ガタガタ揺れ持続)</option>
                        <option value="zoom">🔍 zoom (ズームイン→大胆 Ken Burns)</option>
                        <option value="slide">➡️ slide (スライドイン→揺れ持続)</option>
                        <option value="glitch">🔥 glitch (グリッチ→ノイズ走り続け)</option>
                        <option value="zoom_pulse">💥 zoom_pulse (ドンドン拡縮し続け)</option>
                      </select>
                    </div>
                    {/* ★v5.19.4★ 表示時間調整 */}
                    <div className="mt-1.5">
                      <label className="text-[9px] text-amber-700 font-bold">表示時間:</label>
                      <select
                        value={projectData.hookMediaDurationMs ?? 'auto'}
                        onChange={(e) => {
                          const v = e.target.value;
                          onChange({ ...projectData, hookMediaDurationMs: v === 'auto' ? 'auto' : parseInt(v, 10) });
                        }}
                        className="ml-1 text-[10px] bg-white px-1.5 py-0.5 border border-amber-200 rounded outline-none"
                      >
                        <option value="auto">⏱ auto (id:1 の TTS が終わるまで)</option>
                        <option value="500">0.5 秒 (一瞬)</option>
                        <option value="1000">1.0 秒</option>
                        <option value="1500">1.5 秒</option>
                        <option value="2000">2.0 秒</option>
                        <option value="3000">3.0 秒</option>
                        <option value="5000">5.0 秒</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[9px] text-zinc-500 font-bold flex items-center gap-1 mb-0.5">🔊 読み上げ用テキスト</label>
                  <input
                    type="text"
                    value={script.speech || ''}
                    onChange={(e) => handleChange(script.id, 'speech', e.target.value)}
                    className="w-full text-[11px] text-zinc-700 bg-white p-1.5 rounded border border-zinc-200 outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="難読語はひらがなに"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">テロップサイズ</label>
                    <select
                      value={script.textSize || 'm'}
                      onChange={(e) => handleChange(script.id, 'textSize', e.target.value)}
                      className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                    >
                      <option value="s">S 小</option>
                      <option value="m">M 中</option>
                      <option value="l">L 大</option>
                      <option value="xl">XL 特大</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">効果音 SE</label>
                    <select
                      value={script.se || ''}
                      onChange={(e) => handleChange(script.id, 'se', e.target.value || null)}
                      className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                    >
                      <option value="">なし</option>
                      {SE_PRESETS.map(se => (
                        <option key={se.id} value={se.id}>{se.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ★v5.18.0★ zoomBoost (キーフレームアニメ — Gemini提言: 重要発言時のズーム/シェイク) */}
                <div>
                  <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">
                    💥 キーフレームアニメ (重要発言時の演出)
                  </label>
                  <select
                    value={script.zoomBoost || ''}
                    onChange={(e) => handleChange(script.id, 'zoomBoost', e.target.value || undefined)}
                    className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                  >
                    <option value="">なし</option>
                    <option value="zoom">🔍 ズーム (グッと寄る)</option>
                    <option value="shake">💥 シェイク (衝撃発言)</option>
                    <option value="zoomShake">⚡ ズーム+シェイク (覚醒系・最強)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">🎨 レイアウト切替 (このシーンから)</label>
                  <select
                    value={script.layoutType || ''}
                    onChange={(e) => handleChange(script.id, 'layoutType', e.target.value || undefined)}
                    className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                  >
                    <option value="">継承 (前のシーンと同じ)</option>
                    {Object.entries(LAYOUT_TYPES).map(([key, info]) => (
                      <option key={key} value={key}>{info.emoji || '📊'} {info.label}</option>
                    ))}
                  </select>
                </div>

                {/* ★v5.19.6★ scenePreset: シーン全体の演出を切替 (紙芝居からの脱却) */}
                <div>
                  <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">
                    🎬 演出プリセット (シーン全体の見せ方)
                  </label>
                  <select
                    value={script.scenePreset || ''}
                    onChange={(e) => handleChange(script.id, 'scenePreset', e.target.value || undefined)}
                    className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                  >
                    <option value="">継承 (前のシーンと同じ)</option>
                    {Object.entries(SCENE_PRESETS).map(([id, p]) => (
                      <option key={id} value={id}>{p.label} — {p.description}</option>
                    ))}
                  </select>
                </div>

                {/* ★v5.18.14★ spotlightMode: シーンごとに選手スポットの表示パターンを変更 */}
                <div>
                  <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">
                    👤 スポットモード (選手スポット表示時)
                  </label>
                  <select
                    value={script.spotlightMode || ''}
                    onChange={(e) => handleChange(script.id, 'spotlightMode', e.target.value || undefined)}
                    className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                  >
                    <option value="">継承 (グローバル設定)</option>
                    <option value="default">📊 default (主指標+サブ)</option>
                    <option value="single_metric">💥 single_metric (1指標超巨大)</option>
                    <option value="stats_grid">📋 stats_grid (基本成績網羅)</option>
                    <option value="quote">💬 quote (発言ピック)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">⭐ ハイライト指標</label>
                  <select
                    value={script.highlight || ''}
                    onChange={(e) => handleChange(script.id, 'highlight', e.target.value || null)}
                    className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                  >
                    <option value="">なし (通常表示)</option>
                    {(Array.isArray(comparisons) ? comparisons : []).map(c => (
                      <option key={c.id} value={c.id}>{c.label} {c.kana ? `(${c.kana})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* ★v5.19.6★ ハイライトスコープ — 同じ指標で「対左/対右/今季vs昨季」等を切替 */}
                {(() => {
                  const selectedComp = (Array.isArray(comparisons) ? comparisons : []).find(c => c.id === script.highlight);
                  const variants = Array.isArray(selectedComp?.variants) ? selectedComp.variants : [];
                  if (variants.length === 0) return null;
                  return (
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">
                        🎯 スコープ ({selectedComp.label} の比較対象を切替)
                      </label>
                      <select
                        value={script.highlightScope || ''}
                        onChange={(e) => handleChange(script.id, 'highlightScope', e.target.value || undefined)}
                        className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                      >
                        <option value="">デフォルト (variants[0])</option>
                        {variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.label}: {v.valMain} vs {v.valSub}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* ★v5.18.4★ focusEntry: 選手スポット/ランキングで「どの選手を主役にするか」
                    ★v5.18.7★ 候補が無くても手入力で指定できるように常時表示 + 候補は datalist で補助 */}
                {/* ★v5.19.4★ プルダウン化 — datalist+input より探しやすい
                    候補なし時のみ手入力フォールバック */}
                <div>
                  <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">
                    🎯 フォーカス選手 (選手スポット / ランキング用)
                    {focusEntryCandidates.length === 0 && (
                      <span className="ml-1 font-normal text-amber-600">
                        (候補なし: layoutData 未設定 — 直接 id/名前入力)
                      </span>
                    )}
                  </label>
                  {focusEntryCandidates.length > 0 ? (
                    <select
                      value={script.focusEntry || ''}
                      onChange={(e) => handleChange(script.id, 'focusEntry', e.target.value || undefined)}
                      className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                    >
                      <option value="">継承 (前のシーンと同じ)</option>
                      {focusEntryCandidates.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                      {/* ★ JSON で書かれた値が候補にない場合も表示できるようフォールバック */}
                      {script.focusEntry && !focusEntryCandidates.some(c => c.value === script.focusEntry) && (
                        <option value={script.focusEntry}>⚠️ {script.focusEntry} (候補外)</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={script.focusEntry || ''}
                      onChange={(e) => handleChange(script.id, 'focusEntry', e.target.value || undefined)}
                      placeholder="player.id または entry.name を直接入力"
                      className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                    />
                  )}
                </div>

                {/* ★v5.18.13★ focusQuoteIndex: 同じ player の中で複数 quote を切替 */}
                {(() => {
                  // 現在の focusEntry 選手の quotes を取得
                  const players = projectData.layoutData?.spotlight?.players || [];
                  const currentPlayer = players.find(p => p.id === script.focusEntry || p.name === script.focusEntry);
                  const quotes = Array.isArray(currentPlayer?.quotes) ? currentPlayer.quotes : [];
                  if (quotes.length === 0) return null;
                  return (
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">
                        💬 発言ピック ({currentPlayer.name || script.focusEntry} の quotes)
                      </label>
                      <select
                        value={script.focusQuoteIndex ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          handleChange(script.id, 'focusQuoteIndex', v === '' ? undefined : parseInt(v, 10));
                        }}
                        className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                      >
                        <option value="">継承 (デフォルト先頭)</option>
                        {quotes.map((q, i) => (
                          <option key={i} value={i}>
                            {i + 1}: {(q.text || '').slice(0, 40)}{(q.text || '').length > 40 ? '…' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* ★v5.18.13★ focusMetric: ranking 系で動画中に metric を切り替える時 */}
                {(() => {
                  const metrics = projectData.layoutData?.ranking?.metrics || [];
                  if (metrics.length <= 1) return null;  // 1個以下なら切替不要
                  return (
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">
                        📊 フォーカス指標 (ranking で表示する metric)
                      </label>
                      <select
                        value={script.focusMetric || ''}
                        onChange={(e) => handleChange(script.id, 'focusMetric', e.target.value || undefined)}
                        className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                      >
                        <option value="">継承 (デフォルト先頭)</option>
                        {metrics.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.label || m.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={handleAdd}
        className="w-full bg-indigo-50 hover:bg-indigo-100 border-2 border-dashed border-indigo-300 text-indigo-600 font-bold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1"
      >
        <Plus size={14}/> シーン追加
      </button>
    </div>
  );
}
