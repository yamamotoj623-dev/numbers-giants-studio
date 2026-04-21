/**
 * BGM / SE ミキサーパネル
 * - ボイス/BGM/SE の音量調整（Web Audio API経由）
 * - ダッキング強度調整
 * - Google Drive連携のBGMライブラリ表示・選択
 */

import React, { useState, useEffect } from 'react';
import { Music, RefreshCw, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { getMixer } from '../lib/mixer';
import { fetchBgmLibrary } from '../lib/gasClient';
import { GAS_CONFIG, SE_PRESETS } from '../lib/config';

export function BGMPanel() {
  const [bgmList, setBgmList] = useState([]);
  const [selectedBgm, setSelectedBgm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [levels, setLevels] = useState({ voice: 1.0, bgm: 0.15, se: 0.6, master: 1.0 });
  const [duckingAmount, setDuckingAmount] = useState(0.25);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);

  const mixer = getMixer();

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
      if (files.length === 0) setError('BGMが1つも見つかりませんでした。Driveフォルダを確認してください。');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleLoadLibrary(); }, []);

  const handleSelectBgm = async (bgm) => {
    setSelectedBgm(bgm);
    setIsBgmPlaying(false);
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

  return (
    <div className="flex flex-col gap-3">

      <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-zinc-700 flex items-center gap-2">
            <Music size={16} className="text-purple-600"/>BGM ライブラリ
          </span>
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

        <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
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

        {selectedBgm && (
          <button
            onClick={handleToggleBgm}
            className={`mt-2 w-full py-2 rounded text-xs font-bold transition ${
              isBgmPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isBgmPlaying ? '■ BGM停止' : '▶ BGM試聴'}
          </button>
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
