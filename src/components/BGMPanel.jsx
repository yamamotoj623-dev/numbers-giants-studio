/**
 * BGM / SE ミキサーパネル
 * - ボイス/BGM/SE の音量調整（Web Audio API経由、リアルタイム反映）
 * - ダッキング強度調整
 * - ローカルファイルアップロード+IndexedDB永続保存
 * - 動画再生と連動、停止するとBGMも停止
 */

import React, { useState, useEffect, useRef } from 'react';
import { Music, Loader2, Volume2, AlertCircle, Upload, X, HardDrive } from 'lucide-react';
import { getMixer } from '../lib/mixer';
import { SE_PRESETS } from '../lib/config';
import { saveBgm, listBgms, getBgmBlob, deleteBgm, getBgmStats } from '../lib/bgmStorage';

export function BGMPanel() {
  const [bgmList, setBgmList] = useState([]);  // { key, name, size, mimeType, createdAt }
  const [selectedBgmKey, setSelectedBgmKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [levels, setLevels] = useState({ voice: 1.0, bgm: 0.15, se: 0.6, master: 1.0 });
  const [duckingAmount, setDuckingAmount] = useState(0.25);
  const [isPreviewingBgm, setIsPreviewingBgm] = useState(false);
  const [stats, setStats] = useState({ count: 0, totalBytes: 0 });
  const fileInputRef = useRef(null);
  const currentBlobUrlRef = useRef(null); // 現在ロードしたBGMのblob URL (メモリ管理用)

  const mixer = getMixer();

  // 起動時: 保存済みBGM一覧を復元
  useEffect(() => {
    (async () => {
      try {
        const saved = await listBgms();
        setBgmList(saved);
        const s = await getBgmStats();
        setStats(s);
        // 最初のBGMを自動選択 (一番新しいもの)
        if (saved.length > 0) {
          await handleSelectBgm(saved[0]);
        }
      } catch (err) {
        setError('BGM読み込み失敗: ' + err.message);
      }
    })();
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    };
  }, []);

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

  const updateLevel = (track, val) => {
    setLevels(prev => ({ ...prev, [track]: val }));
    mixer.setLevel(track, val);
  };

  const updateDucking = (val) => {
    setDuckingAmount(val);
    mixer.setDuckingAmount(val);
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
          <div className="mt-3 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
            {bgmList.map(bgm => (
              <div
                key={bgm.key}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                  selectedBgmKey === bgm.key
                    ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400'
                    : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200'
                }`}
                onClick={() => handleSelectBgm(bgm)}
              >
                <span className="truncate flex-1">{bgm.name}</span>
                <span className="text-[9px] font-normal text-zinc-500 ml-2 whitespace-nowrap">
                  {formatBytes(bgm.size)}
                </span>
                <button
                  onClick={(e) => handleRemoveBgm(bgm.key, e)}
                  className="ml-2 text-zinc-400 hover:text-red-500"
                  title="削除"
                >
                  <X size={12}/>
                </button>
              </div>
            ))}
          </div>
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

      {/* SE プリセット */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-sm text-zinc-700">SE プリセット確認</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {SE_PRESETS.map(se => (
            <button
              key={se.id}
              onClick={() => mixer.playSe(se.id)}
              className="text-[10px] px-2 py-1.5 bg-zinc-50 hover:bg-amber-50 border border-zinc-200 hover:border-amber-300 rounded text-zinc-700 font-bold transition text-left"
              title={se.description}
            >
              {se.label}
            </button>
          ))}
        </div>
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

