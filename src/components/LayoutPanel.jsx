/**
 * レイアウト選択＆layoutData編集パネル
 * - 8種類のlayoutTypeから選択（未実装は選択不可）
 * - 選択したlayoutTypeに応じた追加データ入力フォーム
 * - aspectRatio (9:16 / 16:9) 切替
 */

import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { LAYOUT_TYPES } from '../lib/config';

export function LayoutPanel({ projectData, onChange }) {
  const setField = (path, value) => {
    const keys = path.split('.');
    const updated = { ...projectData };
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = { ...(obj[keys[i]] || {}) };
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    onChange(updated);
  };

  return (
    <div className="p-4 space-y-4">

      <div className="bg-white p-3 rounded-lg border border-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={14} className="text-zinc-600"/>
          <span className="font-bold text-sm text-zinc-700">レイアウトタイプ</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(LAYOUT_TYPES).map(([key, info]) => {
            const selected = projectData.layoutType === key;
            const planned = info.status === 'planned';
            return (
              <button
                key={key}
                disabled={planned}
                onClick={() => setField('layoutType', key)}
                title={info.desc}
                className={`text-center px-1.5 py-2 rounded-lg border transition ${
                  selected
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300'
                    : planned
                    ? 'bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <div className="text-xl leading-tight mb-0.5">{info.emoji || '📊'}</div>
                <div className={`text-[10px] font-bold leading-tight ${selected ? 'text-indigo-700' : 'text-zinc-700'}`}>
                  {info.label}
                </div>
              </button>
            );
          })}
        </div>
        {projectData.layoutType && LAYOUT_TYPES[projectData.layoutType] && (
          <div className="mt-2 px-2 py-1.5 bg-indigo-50 rounded text-[10px] text-indigo-700">
            <span className="font-bold">{LAYOUT_TYPES[projectData.layoutType].label}:</span>
            <span className="ml-1">{LAYOUT_TYPES[projectData.layoutType].desc}</span>
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded-lg border border-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-sm text-zinc-700">選手タイプ・シルエット</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { id: 'batter', label: '打者', emoji: '🏏' },
            { id: 'pitcher', label: '投手', emoji: '⚾' },
            { id: 'team', label: 'チーム', emoji: '👥' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setField('playerType', t.id)}
              className={`py-1.5 text-xs font-bold rounded-lg border transition ${projectData.playerType === t.id ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-300' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
            >
              <div className="text-base mb-0.5">{t.emoji}</div>
              <div className="text-[10px]">{t.label}</div>
            </button>
          ))}
        </div>
        {/* シルエット選択 (タイプに応じて) */}
        <div className="text-[10px] font-bold text-zinc-500 mt-3 mb-1">シルエット</div>
        <div className="grid grid-cols-4 gap-1">
          {(() => {
            const t = projectData.playerType || 'batter';
            const options =
              t === 'batter' ? [
                { id: 'batter_right', label: '右打' },
                { id: 'batter_left', label: '左打' },
                { id: 'batter_stance', label: '構え' },
                { id: 'runner', label: '走塁' },
              ] : t === 'pitcher' ? [
                { id: 'pitcher_right', label: '右投' },
                { id: 'pitcher_left', label: '左投' },
                { id: 'pitcher_set', label: 'セット' },
                { id: 'catcher', label: '捕手' },
              ] : [
                { id: 'team_huddle', label: '円陣' },
                { id: 'team_stadium', label: '球場' },
              ];
            return options.map(opt => (
              <button
                key={opt.id}
                onClick={() => setField('silhouetteType', opt.id)}
                className={`py-1.5 text-[10px] font-bold rounded border transition ${projectData.silhouetteType === opt.id ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
              >
                {opt.label}
              </button>
            ));
          })()}
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-sm text-zinc-700">画面比率</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setField('aspectRatio', '9:16')}
            className={`py-2 text-xs font-bold rounded border transition ${projectData.aspectRatio === '9:16' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400' : 'bg-white border-zinc-200 text-zinc-600'}`}
          >
            📱 9:16 縦<br/><span className="text-[9px] font-normal">YouTube Shorts</span>
          </button>
          <button
            onClick={() => setField('aspectRatio', '16:9')}
            className={`py-2 text-xs font-bold rounded border transition ${projectData.aspectRatio === '16:9' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400' : 'bg-white border-zinc-200 text-zinc-600'}`}
          >
            🖥 16:9 横<br/><span className="text-[9px] font-normal">YouTube 本編（将来）</span>
          </button>
        </div>
        {projectData.aspectRatio === '16:9' && (
          <div className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1 bg-amber-50 p-2 rounded">
            <AlertCircle size={12}/> 16:9 レイアウトは v5.0.0 では暫定対応です（フェーズ4で完全対応）
          </div>
        )}
      </div>

      {projectData.layoutType === 'timeline' && (
        <TimelineDataEditor projectData={projectData} onChange={onChange} />
      )}
      {projectData.layoutType === 'versus_card' && (
        <VersusDataEditor projectData={projectData} onChange={onChange} />
      )}
      {(projectData.layoutType === 'pitch_arsenal' || projectData.layoutType === 'team_context' || projectData.layoutType === 'ranking' || projectData.layoutType === 'player_spotlight' || projectData.layoutType === 'batter_heatmap') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
          <div className="font-bold mb-1">📝 {
            projectData.layoutType === 'pitch_arsenal' ? '球種データ' :
            projectData.layoutType === 'team_context' ? 'チーム文脈データ' :
            projectData.layoutType === 'ranking' ? 'ランキングデータ' :
            projectData.layoutType === 'batter_heatmap' ? '打者ゾーンデータ' :
            'スポットライトデータ'
          }</div>
          <div>JSONパネルで <code className="bg-amber-100 px-1 rounded">layoutData.{
            projectData.layoutType === 'pitch_arsenal' ? 'arsenal' :
            projectData.layoutType === 'team_context' ? 'context' :
            projectData.layoutType === 'ranking' ? 'ranking' :
            projectData.layoutType === 'batter_heatmap' ? 'heatmap' :
            'spotlight'
          }</code> を直接編集してください{
            projectData.layoutType === 'ranking' ? '。mood:"best"|"worst"|"neutral"でトーン切替。' :
            projectData.layoutType === 'player_spotlight' ? '。複数選手を入れて script.focusEntry で切替可能。' :
            projectData.layoutType === 'team_context' ? '。mode:"single"でチームビュー、mode:"compare"でセ平均比較。' :
            projectData.layoutType === 'pitch_arsenal' ? '。mode:"single"|"compare"|"vs_batter"。' :
            projectData.layoutType === 'batter_heatmap' ? '。mode:"single"|"vs_handedness"。' :
            '（サンプルデータがデフォルト）。'
          }</div>
        </div>
      )}

    </div>
  );
}

function TimelineDataEditor({ projectData, onChange }) {
  const timeline = projectData.layoutData?.timeline || {
    unit: 'month',
    metric: 'OPS',
    points: [
      { label: '4月', main: 0.724, sub: 0.598 },
      { label: '5月', main: 0.810, sub: 0.621 },
    ],
  };

  const update = (newTimeline) => {
    onChange({
      ...projectData,
      layoutData: { ...(projectData.layoutData || {}), timeline: newTimeline },
    });
  };

  const updatePoint = (index, field, value) => {
    const points = [...timeline.points];
    points[index] = { ...points[index], [field]: field === 'label' ? value : parseFloat(value) || 0 };
    update({ ...timeline, points });
  };

  const addPoint = () => update({ ...timeline, points: [...timeline.points, { label: '', main: 0, sub: 0 }] });
  const removePoint = (i) => update({ ...timeline, points: timeline.points.filter((_, idx) => idx !== i) });

  return (
    <div className="bg-white p-3 rounded-lg border border-zinc-200">
      <div className="font-bold text-sm text-zinc-700 mb-2">時系列データ</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="text-[10px] text-zinc-600">
          単位
          <select
            value={timeline.unit}
            onChange={(e) => update({ ...timeline, unit: e.target.value })}
            className="w-full mt-0.5 text-xs border border-zinc-200 rounded px-2 py-1"
          >
            <option value="month">月別</option>
            <option value="week">週別</option>
          </select>
        </label>
        <label className="text-[10px] text-zinc-600">
          指標名
          <input
            type="text"
            value={timeline.metric}
            onChange={(e) => update({ ...timeline, metric: e.target.value })}
            className="w-full mt-0.5 text-xs border border-zinc-200 rounded px-2 py-1"
          />
        </label>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
        {timeline.points.map((p, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input type="text" value={p.label} onChange={(e) => updatePoint(i, 'label', e.target.value)} className="w-12 text-[11px] border border-zinc-200 rounded px-1.5 py-1" placeholder="月" />
            <input type="number" step="0.001" value={p.main} onChange={(e) => updatePoint(i, 'main', e.target.value)} className="flex-1 text-[11px] border border-zinc-200 rounded px-1.5 py-1" />
            <input type="number" step="0.001" value={p.sub} onChange={(e) => updatePoint(i, 'sub', e.target.value)} className="flex-1 text-[11px] border border-zinc-200 rounded px-1.5 py-1" />
            <button onClick={() => removePoint(i)} className="text-red-500 text-xs font-bold px-1">×</button>
          </div>
        ))}
      </div>
      <button onClick={addPoint} className="mt-2 w-full text-xs bg-zinc-100 hover:bg-zinc-200 py-1.5 rounded font-bold text-zinc-600">＋ データ点を追加</button>
    </div>
  );
}


function VersusDataEditor({ projectData, onChange }) {
  const versus = projectData.layoutData?.versus || {
    overall: { main: 85, sub: 78 },
    categoryScores: [
      { label: '打撃', main: 82, sub: 75 },
      { label: '守備', main: 88, sub: 70 },
      { label: '走塁', main: 85, sub: 89 },
      { label: '総合', main: 85, sub: 78 },
    ],
  };

  const update = (newVersus) => {
    onChange({ ...projectData, layoutData: { ...(projectData.layoutData || {}), versus: newVersus } });
  };

  const updateOverall = (side, value) => {
    update({ ...versus, overall: { ...versus.overall, [side]: parseInt(value) || 0 } });
  };

  const updateCat = (i, field, value) => {
    const cats = [...versus.categoryScores];
    cats[i] = { ...cats[i], [field]: field === 'label' ? value : parseInt(value) || 0 };
    update({ ...versus, categoryScores: cats });
  };

  const addCat = () => update({ ...versus, categoryScores: [...versus.categoryScores, { label: '新項目', main: 50, sub: 50 }] });
  const removeCat = (i) => update({ ...versus, categoryScores: versus.categoryScores.filter((_, idx) => idx !== i) });

  return (
    <div className="bg-white p-3 rounded-lg border border-zinc-200">
      <div className="font-bold text-sm text-zinc-700 mb-2">対決カード</div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="border border-orange-200 bg-orange-50 rounded p-2">
          <div className="text-[10px] font-bold text-orange-600 mb-1">Main総合スコア</div>
          <input
            type="number"
            min="0" max="100"
            value={versus.overall.main}
            onChange={(e) => updateOverall('main', e.target.value)}
            className="w-full text-[16px] font-mono font-black text-orange-700 border border-orange-200 rounded px-2 py-1 text-center"
          />
        </div>
        <div className="border border-sky-200 bg-sky-50 rounded p-2">
          <div className="text-[10px] font-bold text-sky-600 mb-1">Sub総合スコア</div>
          <input
            type="number"
            min="0" max="100"
            value={versus.overall.sub}
            onChange={(e) => updateOverall('sub', e.target.value)}
            className="w-full text-[16px] font-mono font-black text-sky-700 border border-sky-200 rounded px-2 py-1 text-center"
          />
        </div>
      </div>

      <div className="text-[11px] font-bold text-zinc-600 mb-1">カテゴリ別比較</div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
        {versus.categoryScores.map((cat, i) => (
          <div key={i} className="flex items-center gap-1">
            <input type="text"   value={cat.label} onChange={(e) => updateCat(i, 'label', e.target.value)} className="w-20 text-[11px] border border-zinc-200 rounded px-1.5 py-1" />
            <input type="number" min="0" max="100" value={cat.main} onChange={(e) => updateCat(i, 'main', e.target.value)} className="w-14 text-[11px] font-mono border border-orange-200 bg-orange-50 rounded px-1.5 py-1 text-right" />
            <span className="text-[10px] text-zinc-400">vs</span>
            <input type="number" min="0" max="100" value={cat.sub}  onChange={(e) => updateCat(i, 'sub', e.target.value)}  className="w-14 text-[11px] font-mono border border-sky-200 bg-sky-50 rounded px-1.5 py-1 text-right" />
            <button onClick={() => removeCat(i)} className="text-red-500 text-xs font-bold px-1">×</button>
          </div>
        ))}
      </div>
      <button onClick={addCat} className="mt-2 w-full text-xs bg-zinc-100 hover:bg-zinc-200 py-1.5 rounded font-bold text-zinc-600">＋ カテゴリを追加</button>
    </div>
  );
}
