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
      {projectData.layoutType === 'player_spotlight' && (
        <SpotlightDataEditor projectData={projectData} onChange={onChange} />
      )}
      {(projectData.layoutType === 'pitch_arsenal' || projectData.layoutType === 'team_context' || projectData.layoutType === 'ranking' || projectData.layoutType === 'batter_heatmap') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
          <div className="font-bold mb-1">📝 {
            projectData.layoutType === 'pitch_arsenal' ? '球種データ' :
            projectData.layoutType === 'team_context' ? 'チーム文脈データ' :
            projectData.layoutType === 'ranking' ? 'ランキングデータ' :
            projectData.layoutType === 'batter_heatmap' ? '打者ゾーンデータ' :
            'データ'
          }</div>
          <div>JSONパネルで <code className="bg-amber-100 px-1 rounded">layoutData.{
            projectData.layoutType === 'pitch_arsenal' ? 'arsenal' :
            projectData.layoutType === 'team_context' ? 'context' :
            projectData.layoutType === 'ranking' ? 'ranking' :
            projectData.layoutType === 'batter_heatmap' ? 'heatmap' :
            'data'
          }</code> を直接編集してください{
            projectData.layoutType === 'ranking' ? '。mood:"best"|"worst"|"neutral"でトーン切替。' :
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
  // ★v5.14.0★ rawMain/rawSub の v4 仕様に対応 (overall/main/sub スコアは廃止済)
  const versus = projectData.layoutData?.versus || {
    categoryScores: [
      { label: '打率',   rawMain: '.285', rawSub: '.265' },
      { label: '本塁打', rawMain: '12',   rawSub: '5' },
      { label: '打点',   rawMain: '38',   rawSub: '21' },
      { label: 'OPS',    rawMain: '.812', rawSub: '.620' },
    ],
  };

  const update = (newVersus) => {
    onChange({ ...projectData, layoutData: { ...(projectData.layoutData || {}), versus: newVersus } });
  };

  const updateCat = (i, field, value) => {
    const cats = [...(versus.categoryScores || [])];
    cats[i] = { ...cats[i], [field]: value };
    update({ ...versus, categoryScores: cats });
  };

  const toggleLowerBetter = (i) => {
    const cats = [...(versus.categoryScores || [])];
    cats[i] = { ...cats[i], lowerBetter: !cats[i].lowerBetter };
    update({ ...versus, categoryScores: cats });
  };

  const addCat = () => update({
    ...versus,
    categoryScores: [...(versus.categoryScores || []), { label: '新指標', rawMain: '', rawSub: '' }],
  });

  const removeCat = (i) => update({
    ...versus,
    categoryScores: (versus.categoryScores || []).filter((_, idx) => idx !== i),
  });

  return (
    <div className="bg-white p-3 rounded-lg border border-zinc-200">
      <div className="font-bold text-sm text-zinc-700 mb-2">対決カード (純粋な数字 vs 数字)</div>

      <div className="text-[10px] text-zinc-500 mb-2">
        左 = {projectData.mainPlayer?.name || 'main'} ({projectData.mainPlayer?.label || ''})
        / 右 = {projectData.subPlayer?.name || 'sub'} ({projectData.subPlayer?.label || ''})
      </div>

      <div className="text-[11px] font-bold text-zinc-600 mb-1">指標別比較</div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {(versus.categoryScores || []).map((cat, i) => (
          <div key={i} className="border border-zinc-200 bg-zinc-50 rounded p-1.5 space-y-1">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={cat.label || ''}
                onChange={(e) => updateCat(i, 'label', e.target.value)}
                placeholder="指標名"
                className="flex-1 text-[11px] border border-zinc-200 rounded px-1.5 py-1 font-bold"
              />
              <input
                type="text"
                value={cat.kana || ''}
                onChange={(e) => updateCat(i, 'kana', e.target.value)}
                placeholder="読み"
                className="w-20 text-[10px] border border-zinc-200 rounded px-1.5 py-1"
              />
              <button onClick={() => removeCat(i)} className="text-red-500 text-xs font-bold px-1">×</button>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={cat.rawMain || ''}
                onChange={(e) => updateCat(i, 'rawMain', e.target.value)}
                placeholder=".285"
                className="flex-1 text-[12px] font-mono font-black border border-orange-200 bg-orange-50 rounded px-1.5 py-1 text-center"
              />
              <span className="text-[10px] text-zinc-400">vs</span>
              <input
                type="text"
                value={cat.rawSub || ''}
                onChange={(e) => updateCat(i, 'rawSub', e.target.value)}
                placeholder=".265"
                className="flex-1 text-[12px] font-mono font-black border border-sky-200 bg-sky-50 rounded px-1.5 py-1 text-center"
              />
              <label className="flex items-center gap-1 text-[9px] text-zinc-600 whitespace-nowrap" title="防御率/WHIP/失策など、小さい方が勝ち">
                <input
                  type="checkbox"
                  checked={!!cat.lowerBetter}
                  onChange={() => toggleLowerBetter(i)}
                />
                小↓勝ち
              </label>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addCat} className="mt-2 w-full text-xs bg-zinc-100 hover:bg-zinc-200 py-1.5 rounded font-bold text-zinc-600">
        ＋ 指標を追加
      </button>

      <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-800">
        💡 <code className="bg-amber-100 px-1 rounded">script.highlight</code> の comparison ラベルと一致する指標は
        「話題中」マーク付きでパルス強調されます (v5.14.0 新)。
      </div>
    </div>
  );
}


// ★v5.14.0 新規★ SpotlightDataEditor — player_spotlight 専用編集UI
function SpotlightDataEditor({ projectData, onChange }) {
  const spotlight = projectData.layoutData?.spotlight || {
    showPlayerName: 'auto',
    players: [
      {
        id: 'sample',
        label: '26年(今季)',
        primaryStat: { label: '打率', value: '.285' },
        stats: [
          { label: 'OPS', value: '.812' },
          { label: '本塁打', value: '12' },
          { label: '打点', value: '38' },
          { label: '対佐野', value: '.348' },
        ],
        comment: '',
      },
    ],
  };

  const update = (newSpotlight) => {
    onChange({ ...projectData, layoutData: { ...(projectData.layoutData || {}), spotlight: newSpotlight } });
  };

  const setShowName = (val) => update({ ...spotlight, showPlayerName: val });

  const updatePlayer = (i, field, value) => {
    const players = [...(spotlight.players || [])];
    players[i] = { ...players[i], [field]: value };
    update({ ...spotlight, players });
  };

  const updatePrimary = (i, field, value) => {
    const players = [...(spotlight.players || [])];
    players[i] = { ...players[i], primaryStat: { ...(players[i].primaryStat || {}), [field]: value } };
    update({ ...spotlight, players });
  };

  const updateCompareValue = (i, field, value) => {
    const players = [...(spotlight.players || [])];
    const cur = players[i].primaryStat?.compareValue || {};
    const next = { ...cur, [field]: value };
    // 全部空なら compareValue 削除
    if (!next.value && !next.label) {
      const { compareValue, ...rest } = (players[i].primaryStat || {});
      players[i] = { ...players[i], primaryStat: rest };
    } else {
      players[i] = { ...players[i], primaryStat: { ...(players[i].primaryStat || {}), compareValue: next } };
    }
    update({ ...spotlight, players });
  };

  const updateStat = (pi, si, field, value) => {
    const players = [...(spotlight.players || [])];
    const stats = [...(players[pi].stats || [])];
    stats[si] = { ...stats[si], [field]: value };
    players[pi] = { ...players[pi], stats };
    update({ ...spotlight, players });
  };

  const addStat = (pi) => {
    const players = [...(spotlight.players || [])];
    const stats = [...(players[pi].stats || []), { label: '新指標', value: '' }];
    players[pi] = { ...players[pi], stats };
    update({ ...spotlight, players });
  };

  const removeStat = (pi, si) => {
    const players = [...(spotlight.players || [])];
    const stats = (players[pi].stats || []).filter((_, idx) => idx !== si);
    players[pi] = { ...players[pi], stats };
    update({ ...spotlight, players });
  };

  const addPlayer = () => {
    update({
      ...spotlight,
      players: [...(spotlight.players || []), {
        id: `p${(spotlight.players?.length || 0) + 1}`,
        label: '',
        primaryStat: { label: '', value: '' },
        stats: [],
      }],
    });
  };

  const removePlayer = (i) => {
    update({ ...spotlight, players: (spotlight.players || []).filter((_, idx) => idx !== i) });
  };

  const showNameVal = spotlight.showPlayerName ?? 'auto';
  const isTeam = projectData.playerType === 'team';
  const autoResolved = showNameVal === 'auto' ? (isTeam ? 'ON (team自動)' : 'OFF (個人自動)') : null;

  return (
    <div className="bg-white p-3 rounded-lg border border-zinc-200 space-y-3">
      <div className="font-bold text-sm text-zinc-700">選手スポット</div>

      {/* 選手名表示トグル */}
      <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
        <div className="text-[11px] font-bold text-indigo-800 mb-1.5">
          選手名表示 (ヘッダー重複防止)
          {autoResolved && <span className="ml-1.5 text-[10px] font-normal text-indigo-600">→ 現在: {autoResolved}</span>}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { val: 'auto', label: '自動', desc: 'team→ON / 個人→OFF' },
            { val: true,   label: 'ON',   desc: '常に表示' },
            { val: false,  label: 'OFF',  desc: '常に非表示' },
          ].map(opt => (
            <button
              key={String(opt.val)}
              onClick={() => setShowName(opt.val)}
              title={opt.desc}
              className={`text-[11px] font-bold py-1.5 rounded transition ${
                showNameVal === opt.val
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 選手リスト */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
        {(spotlight.players || []).map((p, pi) => (
          <div key={pi} className="border border-zinc-200 bg-zinc-50 rounded-lg p-2 space-y-2">
            {/* ヘッダー: id + label + 削除 */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={p.id || ''}
                onChange={(e) => updatePlayer(pi, 'id', e.target.value)}
                placeholder="id"
                className="w-20 text-[11px] border border-zinc-200 rounded px-1.5 py-1 font-mono"
              />
              <input
                type="text"
                value={p.label || ''}
                onChange={(e) => updatePlayer(pi, 'label', e.target.value)}
                placeholder="期間ラベル (例: 26年(今季))"
                className="flex-1 text-[11px] border border-zinc-200 rounded px-1.5 py-1"
              />
              <button onClick={() => removePlayer(pi)} className="text-red-500 text-xs font-bold px-1.5">×</button>
            </div>

            {/* 選手名/番号 (showPlayerName=true 時に使用) */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={p.name || ''}
                onChange={(e) => updatePlayer(pi, 'name', e.target.value)}
                placeholder="選手名 (showName=ON時)"
                className="flex-1 text-[11px] border border-zinc-200 rounded px-1.5 py-1"
              />
              <input
                type="text"
                value={p.number || ''}
                onChange={(e) => updatePlayer(pi, 'number', e.target.value)}
                placeholder="背番号"
                className="w-16 text-[11px] border border-zinc-200 rounded px-1.5 py-1"
              />
            </div>

            {/* primaryStat */}
            <div className="border border-orange-200 bg-orange-50 rounded p-2 space-y-1.5">
              <div className="text-[10px] font-bold text-orange-700">プライマリ指標 (画面中央の主役)</div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={p.primaryStat?.label || ''}
                  onChange={(e) => updatePrimary(pi, 'label', e.target.value)}
                  placeholder="ラベル (例: WAR / 対佐野通算)"
                  className="flex-1 text-[11px] border border-orange-200 rounded px-1.5 py-1"
                />
                <input
                  type="text"
                  value={p.primaryStat?.value || ''}
                  onChange={(e) => updatePrimary(pi, 'value', e.target.value)}
                  placeholder="数値"
                  className="w-20 text-[11px] font-mono font-black text-orange-700 border border-orange-200 rounded px-1.5 py-1 text-center"
                />
              </div>
              <label className="flex items-center gap-1.5 text-[10px] text-orange-700">
                <input
                  type="checkbox"
                  checked={!!p.primaryStat?.isNegative}
                  onChange={(e) => updatePrimary(pi, 'isNegative', e.target.checked)}
                />
                ネガティブ表示 (赤色 + 警告グロー)
              </label>
              {/* 比較値 */}
              <div className="flex gap-1.5 pt-1 border-t border-orange-200">
                <input
                  type="text"
                  value={p.primaryStat?.compareValue?.label || ''}
                  onChange={(e) => updateCompareValue(pi, 'label', e.target.value)}
                  placeholder="比較ラベル (例: セ平均)"
                  className="flex-1 text-[10px] border border-orange-200 rounded px-1.5 py-1"
                />
                <input
                  type="text"
                  value={p.primaryStat?.compareValue?.value || ''}
                  onChange={(e) => updateCompareValue(pi, 'value', e.target.value)}
                  placeholder="比較値"
                  className="w-20 text-[10px] font-mono border border-orange-200 rounded px-1.5 py-1 text-center"
                />
              </div>
            </div>

            {/* sub stats */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-zinc-600">サブ指標 (周囲の補助情報、Geminiが柔軟にカスタム可)</div>
              <div className="space-y-1">
                {(p.stats || []).map((stat, si) => (
                  <div key={si} className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => updateStat(pi, si, 'label', e.target.value)}
                      placeholder="例: 打率 / 対佐野 / 直近10試合"
                      className="flex-1 text-[11px] border border-zinc-200 rounded px-1.5 py-1"
                    />
                    <input
                      type="text"
                      value={stat.value || ''}
                      onChange={(e) => updateStat(pi, si, 'value', e.target.value)}
                      placeholder="数値"
                      className="w-20 text-[11px] font-mono border border-zinc-200 rounded px-1.5 py-1 text-center"
                    />
                    <button onClick={() => removeStat(pi, si)} className="text-red-500 text-xs font-bold px-1">×</button>
                  </div>
                ))}
              </div>
              <button onClick={() => addStat(pi)} className="w-full text-[10px] bg-zinc-100 hover:bg-zinc-200 py-1 rounded font-bold text-zinc-600">＋ サブ指標を追加</button>
            </div>

            {/* comment */}
            <input
              type="text"
              value={p.comment || ''}
              onChange={(e) => updatePlayer(pi, 'comment', e.target.value)}
              placeholder="コメント (任意、画面下部に表示)"
              className="w-full text-[11px] border border-zinc-200 rounded px-1.5 py-1"
            />
          </div>
        ))}
      </div>

      <button onClick={addPlayer} className="w-full text-xs bg-indigo-100 hover:bg-indigo-200 py-1.5 rounded font-bold text-indigo-700">
        ＋ 選手エントリを追加 (script.focusEntry で切替)
      </button>

      <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-800">
        💡 <strong>ヒント</strong>: <code className="bg-amber-100 px-1 rounded">script.focusEntry</code> で表示する選手を切替できます。
        ラベルが <code className="bg-amber-100 px-1 rounded">script.highlight</code> の comparison ラベルと一致すると、
        該当指標が「話題中」マーク付きでパルス強調されます。
      </div>
    </div>
  );
}
