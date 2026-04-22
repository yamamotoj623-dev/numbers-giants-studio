/**
 * BGM / SE ミキサーパネル
 * - ボイス/BGM/SE の音量調整（Web Audio API経由）
 * - ダッキング強度調整
 * - ローカルファイルアップロード (primary) + Google Drive連携 (optional fallback)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Music, RefreshCw, Loader2, Volume2, AlertCircle, Upload, X } from 'lucide-react';
import { getMixer } from '../lib/mixer';
import { fetchBgmLibrary } from '../lib/gasClient';
import { GAS_CONFIG, SE_PRESETS } from '../lib/config';

export function BGMPanel() {
  const [bgmList, setBgmList] = useState([]);
  const [localBgms, setLocalBgms] = useState([]); // { id, name, url, size }
  const [selectedBgm, setSelectedBgm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [levels, setLevels] = useState({ voice: 1.0, bgm: 0.15, se: 0.6, master: 1.0 });
  const [duckingAmount, setDuckingAmount] = useState(0.25);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [showDriveSection, setShowDriveSection] = useState(false);
  const fileInputRef = useRef(null);

  const mixer = getMixer();

  // ローカルファイル選択
  const handleLocalFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    const added = files.map(file => ({
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      genre: 'ローカル',
      isLocal: true,
    }));
    setLocalBgms(prev => [...prev, ...added]);
    // 最初のファイルを自動選択
    if (added.length > 0 && !selectedBgm) {
      handleSelectBgm(added[0]);
    }
    e.target.value = ''; // re-select same file enabled
  };

  const handleRemoveLocal = (id, e) => {
    e?.stopPropagation();
    setLocalBgms(prev => {
      const target = prev.find(b => b.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(b => b.id !== id);
    });
    if (selectedBgm?.id === id) {
      mixer.stopBgm();
      setSelectedBgm(null);
      setIsBgmPlaying(false);
    }
  };

  // Drive連携 (オプション)
  const handleLoadLibrary = async () => {
    if (!GAS_CONFIG.endpoint) {
      setError('GAS endpoint が設定されていません (.env.local 参照)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const files = await fetchBgmLibrary();
      setBgmList(files);
      if (files.length === 0) setError('BGMが見つかりませんでした');
    } catch (err) {
      setError(`Drive連携失敗: ${err.message}。ローカルファイルアップロードをご利用ください。`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBgm = async (bgm) => {
    setSelectedBgm(bgm);
    setIsBgmPlaying(false);
    setError(null);
    try {
      await mixer.loadBgmFromUrl(bgm.url);
    } catch (err) {
      setError('BGM読み込み失敗: ' + err.message);
    }
  };

  const handleToggleBgm = () => {
    if (isBgmPlaying) {
      mixer.stopBgm();
      setIsBgmPlaying(false);
    } else {
      mixer.playBgm(true);
      setIsBgmPlaying(true);
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

  // cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      localBgms.forEach(b => {
        if (b.isLocal) URL.revokeObjectURL(b.url);
      });
    };
  }, []);

  const allBgms = [...localBgms, ...bgmList];

  return (
    <div className="flex flex-col gap-3">

      {/* ローカルファイルアップロード (推奨) */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-lg border border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-zinc-700 flex items-center gap-2">
            <Upload size={16} className="text-indigo-600"/>BGM アップロード <span className="text-[10px] font-normal text-indigo-600">(推奨)</span>
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
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg border-2 border-dashed border-indigo-300 transition flex items-center justify-center gap-2"
        >
          <Upload size={14}/> MP3/WAV/OGG ファイルを選択
        </button>
        <div className="text-[10px] text-zinc-500 mt-2">
          ローカルファイルはブラウザ内だけで処理、サーバーには送信されません
        </div>

        {localBgms.length > 0 && (
          <div className="mt-3 space-y-1">
            {localBgms.map(bgm => (
              <div
                key={bgm.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                  selectedBgm?.id === bgm.id
                    ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400'
                    : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200'
                }`}
                onClick={() => handleSelectBgm(bgm)}
              >
                <span className="truncate flex-1">{bgm.name}</span>
                <span className="text-[9px] font-normal text-zinc-500 ml-2 whitespace-nowrap">
                  {(bgm.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <button
                  onClick={(e) => handleRemoveLocal(bgm.id, e)}
                  className="ml-2 text-zinc-400 hover:text-red-500"
                  title="削除"
                >
                  <X size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedBgm && (
          <button
            onClick={handleToggleBgm}
            className={`mt-3 w-full py-2 rounded text-xs font-bold transition ${
              isBgmPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isBgmPlaying ? '■ BGM停止' : '▶ BGM試聴'}
          </button>
        )}
      </div>

      {/* Google Drive連携 (オプション、折りたたみ) */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
        <button
          onClick={() => setShowDriveSection(v => !v)}
          className="w-full flex items-center justify-between text-sm font-bold text-zinc-600 hover:text-zinc-800"
        >
          <span className="flex items-center gap-2">
            <Music size={14}/> Google Drive BGM <span className="text-[10px] font-normal text-zinc-500">(オプション・動作不安定)</span>
          </span>
          <span className="text-xs">{showDriveSection ? '▲' : '▼'}</span>
        </button>

        {showDriveSection && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-zinc-500">GAS経由でDrive連携</span>
              <button
                onClick={handleLoadLibrary}
                disabled={loading}
                className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 disabled:opacity-50 transition"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-[10px] font-bold mb-2 flex items-center gap-1 bg-red-50 p-2 rounded">
                <AlertCircle size={12}/> {error}
              </div>
            )}

            {!error && bgmList.length === 0 && (
              <div className="text-[10px] text-zinc-500 bg-zinc-50 p-2 rounded">
                Google Drive連携は CORS/外部抽出防止で動作不安定です。
                ローカルファイルアップロードをご利用ください。
              </div>
            )}

            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 mt-2">
              {bgmList.map(bgm => (
                <button
                  key={bgm.id}
                  onClick={() => handleSelectBgm(bgm)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center justify-between ${
                    selectedBgm?.id === bgm.id
                      ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-400'
                      : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200'
                  }`}
                >
                  <span className="truncate">{bgm.name}</span>
                  <span className="text-[9px] font-normal text-zinc-500 ml-2 whitespace-nowrap">{bgm.genre}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 size={16} className="text-zinc-600"/>
          <span className="font-bold text-sm text-zinc-700">音量ミキサー</span>
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
