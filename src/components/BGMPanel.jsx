/**
 * BGM / SE ミキサーパネル
 * - ボイス/BGM/SE の音量調整（Web Audio API経由、リアルタイム反映）
 * - ダッキング強度調整
 * - ローカルファイルアップロード+IndexedDB永続保存
 * - 動画再生と連動、停止するとBGMも停止
 */

import React, { useState, useEffect, useRef } from 'react';
import { Music, Loader2, Volume2, AlertCircle, Upload, X, HardDrive, Zap } from 'lucide-react';
import { getMixer } from '../lib/mixer';
import { SE_PRESETS } from '../lib/config';
import { saveBgm, listBgms, getBgmBlob, deleteBgm, getBgmStats } from '../lib/bgmStorage';
import { saveSe, listSes, getSeBlob, deleteSe, getSeStats } from '../lib/seStorage';

export function BGMPanel() {
  const [bgmList, setBgmList] = useState([]);  // { key, name, size, mimeType, createdAt }
  const [selectedBgmKey, setSelectedBgmKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [levels, setLevels] = useState(() => {
    // ★v5.15.5★ localStorage から復元
    try {
      const saved = localStorage.getItem('mixer-levels');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { voice: 1.0, bgm: 0.15, se: 0.6, master: 1.0 };
  });
  const [duckingAmount, setDuckingAmount] = useState(0.25);
  const [isPreviewingBgm, setIsPreviewingBgm] = useState(false);
  const [stats, setStats] = useState({ count: 0, totalBytes: 0 });
  const fileInputRef = useRef(null);
  const seFileInputRef = useRef(null);
  const [seList, setSeList] = useState([]); // { key, name, size, mimeType }
  const [seStats, setSeStats] = useState({ count: 0, totalBytes: 0 });
  const [seError, setSeError] = useState(null);
  const [seLoading, setSeLoading] = useState(false);
  const [overrideSeId, setOverrideSeId] = useState(null); // アップロードSEを割り当てるpreset ID
  const currentBlobUrlRef = useRef(null); // 現在ロードしたBGMのblob URL (メモリ管理用)

  const mixer = getMixer();

  // 起動時: 保存済みBGM一覧を復元
  useEffect(() => {
    // ★v5.15.5★ localStorage の levels を mixer に反映
    try {
      Object.entries(levels).forEach(([track, val]) => mixer.setLevel(track, val));
    } catch (e) {}
    (async () => {
      try {
        const saved = await listBgms();
        setBgmList(saved);
        const s = await getBgmStats();
        setStats(s);
        if (saved.length > 0) {
          // ★v5.15.3★ localStorage に保存された選択を優先復元
          let toSelect = null;
          try {
            const savedKey = localStorage.getItem('selectedBgmKey');
            if (savedKey) toSelect = saved.find(b => b.key === savedKey);
          } catch (e) {}
          // なければ一番新しいものを自動選択
          if (!toSelect) toSelect = saved[0];
          await handleSelectBgm(toSelect);
        }
      } catch (err) {
        setError('BGM読み込み失敗: ' + err.message);
      }
      // SE 起動時ロード
      try {
        const savedSes = await listSes();
        setSeList(savedSes);
        setSeStats(await getSeStats());
        // 既に登録したSEをmixerに再バインド
        for (const se of savedSes) {
          const blob = await getSeBlob(se.key);
          if (blob && se.assignedPresetId) {
            await mixer.registerCustomSe(se.assignedPresetId, blob);
          }
        }
      } catch (err) {
        setSeError('SE読み込み失敗: ' + err.message);
      }
    })();
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    };
  }, []);

  // SE ファイル選択 + preset ID割り当て
  const handleSeFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !overrideSeId) return;
    setSeError(null);
    setSeLoading(true);
    try {
      const file = files[0];
      // DBに保存 (assignedPresetId 付きで)
      const key = await saveSe(file);
      // SE に preset ID を紐付け (別テーブルにするほどじゃないのでメモリ中のmetaで管理)
      // IndexedDB側のname にpreset IDを残すため、nameを preset:file.name 形式に書き換え
      // 簡易実装: metaに assignedPresetId を保存するため bgmStorage ではなくここで直接管理
      // → 本来 seStorage で拡張が正しいが時間節約で assignedId を localStorage に保存
      const assignments = JSON.parse(localStorage.getItem('se-assignments') || '{}');
      assignments[key] = overrideSeId;
      localStorage.setItem('se-assignments', JSON.stringify(assignments));
      // mixerに登録
      const blob = await getSeBlob(key);
      await mixer.registerCustomSe(overrideSeId, blob);
      // UI更新
      const updated = await listSes();
      // assignedPresetId を meta にマージ
      const enriched = updated.map(s => ({ ...s, assignedPresetId: assignments[s.key] }));
      setSeList(enriched);
      setSeStats(await getSeStats());
      setOverrideSeId(null);
    } catch (err) {
      setSeError('SE保存失敗: ' + err.message);
    } finally {
      setSeLoading(false);
      e.target.value = '';
    }
  };

  const handleRemoveSe = async (key, e) => {
    e?.stopPropagation();
    try {
      const assignments = JSON.parse(localStorage.getItem('se-assignments') || '{}');
      const presetId = assignments[key];
      delete assignments[key];
      localStorage.setItem('se-assignments', JSON.stringify(assignments));
      if (presetId) mixer.unregisterCustomSe(presetId);
      await deleteSe(key);
      const updated = await listSes();
      const enriched = updated.map(s => ({ ...s, assignedPresetId: assignments[s.key] }));
      setSeList(enriched);
      setSeStats(await getSeStats());
    } catch (err) {
      setSeError('SE削除失敗: ' + err.message);
    }
  };

  const triggerSeUpload = (presetId) => {
    setOverrideSeId(presetId);
    setTimeout(() => seFileInputRef.current?.click(), 10);
  };

  // ローカルファイル選択 → IndexedDBに永続保存
  const handleLocalFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const newKeys = [];
      for (const file of files) {
        const key = await saveBgm(file);
        newKeys.push(key);
      }
      const updated = await listBgms();
      setBgmList(updated);
      setStats(await getBgmStats());
      // 最初のアップロードファイルを自動選択
      if (newKeys.length > 0) {
        const first = updated.find(b => b.key === newKeys[0]);
        if (first) await handleSelectBgm(first);
      }
    } catch (err) {
      setError('BGM保存失敗: ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = ''; // 同一ファイル再選択可能に
    }
  };

  const handleRemoveBgm = async (key, e) => {
    e?.stopPropagation();
    try {
      await deleteBgm(key);
      const updated = await listBgms();
      setBgmList(updated);
      setStats(await getBgmStats());
      if (selectedBgmKey === key) {
        mixer.stopBgm();
        setSelectedBgmKey(null);
        setIsPreviewingBgm(false);
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }
      }
    } catch (err) {
      setError('削除失敗: ' + err.message);
    }
  };

  const handleSelectBgm = async (bgm) => {
    setError(null);
    try {
      const blob = await getBgmBlob(bgm.key);
      if (!blob) {
        setError('BGM blob が見つかりません');
        return;
      }
      // 既存のblob URLを解放
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      currentBlobUrlRef.current = url;
      setSelectedBgmKey(bgm.key);
      // ★v5.15.3★ 選択された BGM key を localStorage に永続化 (audioExporter から参照可能に)
      try { localStorage.setItem('selectedBgmKey', bgm.key); } catch (e) {}
      setIsPreviewingBgm(false);
      mixer.stopBgm();
      await mixer.loadBgmFromUrl(url);
    } catch (err) {
      setError('BGM読み込み失敗: ' + err.message);
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewingBgm) {
      mixer.stopBgm();
      setIsPreviewingBgm(false);
    } else {
      mixer.playBgm(true);
      setIsPreviewingBgm(true);
    }
  };

  // ★v5.15.5★ レベル変更時に localStorage にも保存 (audioExporter から参照可能に)
  const updateLevel = (track, val) => {
    setLevels(prev => {
      const next = { ...prev, [track]: val };
      try { localStorage.setItem('mixer-levels', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    mixer.setLevel(track, val);
  };

  const updateDucking = (val) => {
    setDuckingAmount(val);
    mixer.setDuckingAmount(val);
    try { localStorage.setItem('mixer-ducking', String(val)); } catch (e) {}
  };

  const formatBytes = (b) => {
    if (b < 1024) return b + 'B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + 'KB';
    return (b / 1024 / 1024).toFixed(1) + 'MB';
  };

  return (
    <div className="flex flex-col gap-3">

      {/* BGM ライブラリ (IndexedDB永続) */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-lg border border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-zinc-700 flex items-center gap-2">
            <HardDrive size={16} className="text-indigo-600"/>BGM ライブラリ
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {stats.count}件 · {formatBytes(stats.totalBytes)}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleLocalFile}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg border-2 border-dashed border-indigo-300 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
          MP3/WAV/OGG を追加
        </button>
        <div className="text-[10px] text-zinc-500 mt-2">
          ブラウザ内に永続保存、リロードしても残ります
        </div>

        {error && (
          <div className="text-red-500 text-[10px] font-bold mt-2 flex items-center gap-1 bg-red-50 p-2 rounded">
            <AlertCircle size={12}/> {error}
          </div>
        )}

        {bgmList.length > 0 && (
          <>
            <div className="mt-3 text-[10px] font-bold text-zinc-600 flex items-center gap-1">
              <span>📚 BGM ライブラリ</span>
              <span className="text-zinc-400 font-normal">— タップして選択</span>
            </div>
            <div className="mt-1 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
              {bgmList.map(bgm => {
                const isSelected = selectedBgmKey === bgm.key;
                return (
                  <div
                    key={bgm.key}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500 text-white ring-2 ring-indigo-700 shadow'
                        : 'bg-white hover:bg-indigo-50 text-zinc-700 border border-zinc-200'
                    }`}
                    onClick={() => handleSelectBgm(bgm)}
                  >
                    {isSelected ? (
                      <span className="flex-shrink-0 text-[10px] font-black bg-white text-indigo-600 rounded px-1 py-0.5">
                        ✓ 選択中
                      </span>
                    ) : (
                      <span className="flex-shrink-0 text-[10px] font-normal text-zinc-400">
                        ○
                      </span>
                    )}
                    <span className="truncate flex-1">{bgm.name}</span>
                    <span className={`text-[9px] font-normal whitespace-nowrap ${isSelected ? 'text-indigo-100' : 'text-zinc-500'}`}>
                      {formatBytes(bgm.size)}
                    </span>
                    <button
                      onClick={(e) => handleRemoveBgm(bgm.key, e)}
                      className={`flex-shrink-0 ${isSelected ? 'text-indigo-200 hover:text-white' : 'text-zinc-400 hover:text-red-500'}`}
                      title="削除"
                    >
                      <X size={12}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {selectedBgmKey && (
          <button
            onClick={handleTogglePreview}
            className={`mt-3 w-full py-2 rounded text-xs font-bold transition ${
              isPreviewingBgm
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isPreviewingBgm ? '■ 試聴停止' : '▶ BGM試聴（この設定で動画再生時にも鳴ります）'}
          </button>
        )}
      </div>

      {/* 音量ミキサー */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 size={16} className="text-zinc-600"/>
          <span className="font-bold text-sm text-zinc-700">音量ミキサー (リアルタイム反映)</span>
        </div>

        <VolumeSlider label="ボイス"       value={levels.voice}  onChange={v => updateLevel('voice', v)}  accent="bg-indigo-500"/>
        <VolumeSlider label="BGM"          value={levels.bgm}    onChange={v => updateLevel('bgm', v)}    accent="bg-purple-500"/>
        <VolumeSlider label="SE"           value={levels.se}     onChange={v => updateLevel('se', v)}     accent="bg-amber-500"/>
        <VolumeSlider label="マスター"     value={levels.master} onChange={v => updateLevel('master', v)} accent="bg-zinc-700"/>

        <div className="mt-3 pt-3 border-t border-zinc-200">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 mb-1">
            <span>ダッキング強度</span>
            <span className="font-mono text-indigo-600">{Math.round((1 - duckingAmount) * 100)}%減衰</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={duckingAmount}
            onChange={(e) => updateDucking(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="text-[9px] text-zinc-500 mt-0.5">ボイス再生中のBGM音量自動減衰</div>
        </div>
      </div>

      {/* SE プリセット & カスタムSE */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm text-zinc-700 flex items-center gap-2">
            <Zap size={16} className="text-amber-600"/>SE (効果音)
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            カスタム{seStats.count}件
          </span>
        </div>
        <div className="text-[10px] text-zinc-500 mb-2">
          クリックで試聴。📁アイコンでMP3/WAVをアップロード、合成音を上書き。
        </div>

        <input
          ref={seFileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleSeFile}
          className="hidden"
        />

        {seError && (
          <div className="text-red-500 text-[10px] font-bold mb-2 flex items-center gap-1 bg-red-50 p-2 rounded">
            <AlertCircle size={12}/> {seError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {SE_PRESETS.map(se => {
            const custom = seList.find(s => s.assignedPresetId === se.id);
            return (
              <div key={se.id} className="relative group">
                <button
                  onClick={() => mixer.playSe(se.id)}
                  className={`w-full text-[10px] px-2 py-1.5 border rounded font-bold transition text-left pr-7 ${
                    custom
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-zinc-50 hover:bg-amber-50 border-zinc-200 hover:border-amber-300 text-zinc-700'
                  }`}
                  title={custom ? `カスタム: ${custom.name}` : se.description}
                >
                  {custom ? '🎵 ' : ''}{se.label}
                </button>
                <button
                  onClick={() => custom ? handleRemoveSe(custom.key) : triggerSeUpload(se.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded text-[10px] bg-white border border-zinc-300 hover:bg-amber-100 flex items-center justify-center"
                  title={custom ? 'カスタムSE削除' : 'SEファイルをアップロード'}
                  disabled={seLoading}
                >
                  {seLoading ? <Loader2 size={10} className="animate-spin"/> : (custom ? <X size={10}/> : <Upload size={10}/>)}
                </button>
              </div>
            );
          })}
        </div>

        {seList.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zinc-200 text-[9px] text-zinc-500">
            アップロード済: {seList.map(s => s.name).slice(0, 3).join(', ')}{seList.length > 3 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

function VolumeSlider({ label, value, onChange, accent }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 mb-1">
        <span>{label}</span>
        <span className="font-mono">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full accent-indigo-500`}
      />
    </div>
  );
}

