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
      scripts: projectData.scripts.map(s => s.id === id ? { ...s, [field]: value } : s),
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

  return (
    <div ref={containerRef} className="p-3 space-y-2">
      <button
        onClick={handleAdd}
        className="w-full bg-indigo-50 hover:bg-indigo-100 border-2 border-dashed border-indigo-300 text-indigo-600 font-bold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1"
      >
        <Plus size={14}/> シーン追加
      </button>

      {projectData.scripts.map((script, idx) => {
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

            {/* 簡易プレビュー: layoutType / highlight が設定されてれば常時表示 */}
            {!isExpanded && (script.layoutType || script.highlight) && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {script.layoutType && (
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                    🎨 {LAYOUT_TYPES[script.layoutType]?.label || script.layoutType}
                  </span>
                )}
                {script.highlight && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                    ⭐ {comparisons.find(c => c.id === script.highlight)?.label || script.highlight}
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

                <div>
                  <label className="text-[9px] text-zinc-500 font-bold mb-0.5 block">⭐ ハイライト指標</label>
                  <select
                    value={script.highlight || ''}
                    onChange={(e) => handleChange(script.id, 'highlight', e.target.value || null)}
                    className="w-full text-[10px] bg-white px-1.5 py-1 border border-zinc-200 rounded outline-none"
                  >
                    <option value="">なし (通常表示)</option>
                    {comparisons.map(c => (
                      <option key={c.id} value={c.id}>{c.label} {c.kana ? `(${c.kana})` : ''}</option>
                    ))}
                  </select>
                </div>
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
