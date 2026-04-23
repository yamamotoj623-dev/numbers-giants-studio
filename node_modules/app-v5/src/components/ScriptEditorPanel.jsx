/**
 * 台本直接編集パネル
 * v4.24.0 のスクリプトエディタを踏襲しつつ、SE プロパティ編集を追加。
 */

import React from 'react';
import { SE_PRESETS } from '../lib/config';

export function ScriptEditorPanel({ projectData, currentIndex, onChange }) {
  const handleChange = (id, field, value) => {
    const updated = {
      ...projectData,
      scripts: projectData.scripts.map(s => s.id === id ? { ...s, [field]: value } : s),
    };
    onChange(updated);
  };

  return (
    <div className="p-4 space-y-3">
      {projectData.scripts.map((script, idx) => (
        <div key={script.id} className={`bg-white border rounded-lg p-3 shadow-sm transition-all ${currentIndex === idx ? `ring-2 ring-indigo-400 bg-indigo-50/30` : ''}`}>
          <div className="flex justify-between items-center mb-2 border-b pb-1">
            <span className="text-[10px] font-bold text-zinc-400">シーン {idx + 1}</span>
            {projectData.presentationMode === 'dialogue' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={2}
                  value={script.emoji || ''}
                  onChange={(e) => handleChange(script.id, 'emoji', e.target.value)}
                  className="w-7 h-7 text-[14px] flex items-center justify-center text-center bg-zinc-100 border border-zinc-200 outline-none rounded-full cursor-pointer shadow-sm focus:ring-1 focus:ring-indigo-400"
                  placeholder="😀"
                  title="表情絵文字"
                />
                <select
                  value={script.speaker || 'A'}
                  onChange={(e) => handleChange(script.id, 'speaker', e.target.value)}
                  className="text-[10px] bg-zinc-100 px-2 py-0.5 border-none outline-none font-bold text-zinc-600 rounded cursor-pointer"
                >
                  <option value="A">スピーカー A</option>
                  <option value="B">スピーカー B</option>
                </select>
              </div>
            )}
          </div>
          <textarea
            value={script.text}
            onChange={(e) => handleChange(script.id, 'text', e.target.value)}
            className="w-full text-[12px] font-bold text-zinc-800 bg-transparent border-none outline-none leading-relaxed resize-none"
            rows={3}
          />
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px]">🔊</span>
            <input
              type="text"
              value={script.speech}
              onChange={(e) => handleChange(script.id, 'speech', e.target.value)}
              className="w-full text-[10px] text-zinc-600 bg-zinc-50 p-1.5 rounded border border-dashed outline-none"
              placeholder="読み上げ用テキスト"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-zinc-400">SE:</span>
            <select
              value={script.se || ''}
              onChange={(e) => handleChange(script.id, 'se', e.target.value || null)}
              className="text-[10px] bg-zinc-50 px-2 py-1 border border-zinc-200 rounded outline-none flex-1"
            >
              <option value="">なし</option>
              {SE_PRESETS.map(se => (
                <option key={se.id} value={se.id}>{se.label}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
