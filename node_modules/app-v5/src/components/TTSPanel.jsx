/**
 * TTS エンジン切替・事前生成・コスト表示パネル
 * 「下書き (Web Speech)」と「本番 (Gemini 3.1 Flash TTS)」を明示的に切替。
 */

import React, { useState } from 'react';
import { Mic2, Volume2, VolumeX, Gauge, Sparkles, Zap, Loader2, Check, DollarSign, Trash2 } from 'lucide-react';
import { getAdapter } from '../lib/ttsAdapter';
import { clearCache, getCacheStats } from '../lib/audioCache';

export function TTSPanel({
  engine, setEngine,
  speechRate, setSpeechRate,
  isVoiceEnabled, setIsVoiceEnabled,
  projectData,
  onPregenComplete,
}) {
  const [pregenStatus, setPregenStatus] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [cacheStats, setCacheStats] = useState({ count: 0, totalBytes: 0 });

  const refreshCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.warn(e);
    }
  };

  React.useEffect(() => { refreshCacheStats(); }, []);

  const handlePregen = async () => {
    setPregenStatus('loading');
    setProgress({ current: 0, total: projectData.scripts.length });
    try {
      const adapter = getAdapter('gemini');
      const result = await adapter.pregenerate(projectData.scripts, (p) => setProgress(p));
      setTotalCost(prev => prev + result.costUsd);
      setPregenStatus(result.errors > 0 ? 'partial' : 'done');
      await refreshCacheStats();
      onPregenComplete?.(result);
    } catch (err) {
      console.error(err);
      setPregenStatus('error');
      alert('事前生成失敗: ' + err.message);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('音声キャッシュを全削除します。よろしいですか？（次回Gemini TTS再生時に再課金されます）')) return;
    await clearCache();
    await refreshCacheStats();
    setPregenStatus('idle');
  };

  return (
    <div className="flex flex-col gap-3 bg-gradient-to-br from-indigo-50 to-white p-4 rounded-lg border border-indigo-100 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-zinc-700 flex items-center gap-2">
          <Mic2 size={16} className="text-indigo-600"/>TTS エンジン
        </span>
        <button
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={`p-1.5 rounded-full transition ${isVoiceEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-200 text-zinc-500'}`}
        >
          {isVoiceEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
        </button>
      </div>

      {isVoiceEnabled && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setEngine('web_speech')}
              className={`text-xs font-bold py-2.5 rounded-lg border-2 transition flex flex-col items-center gap-0.5 ${
                engine === 'web_speech'
                  ? 'border-zinc-600 bg-zinc-50 text-zinc-700 shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-500'
              }`}
            >
              <span className="flex items-center gap-1">🔊 下書き</span>
              <span className="text-[9px] opacity-70 font-normal">無料・即時</span>
            </button>
            <button
              onClick={() => setEngine('gemini')}
              className={`text-xs font-bold py-2.5 rounded-lg border-2 transition flex flex-col items-center gap-0.5 ${
                engine === 'gemini'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-500'
              }`}
            >
              <span className="flex items-center gap-1"><Sparkles size={12}/> 本番</span>
              <span className="text-[9px] opacity-70 font-normal">Gemini 3.1 Flash</span>
            </button>
          </div>

          {engine === 'gemini' && (
            <>
              <button
                onClick={handlePregen}
                disabled={pregenStatus === 'loading'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white text-xs font-bold py-2.5 rounded-lg shadow flex items-center justify-center gap-2 transition"
              >
                {pregenStatus === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin"/>
                    生成中 {progress ? `${progress.current}/${progress.total}` : ''}
                  </>
                ) : pregenStatus === 'done' ? (
                  <><Check size={14}/> 生成完了</>
                ) : pregenStatus === 'partial' ? (
                  <><Check size={14}/> 一部生成完了 (エラーあり)</>
                ) : (
                  <><Zap size={14}/> 全セクションを事前生成</>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white p-2 rounded border flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1"><DollarSign size={10}/>今回コスト</span>
                  <span className="font-mono font-bold text-indigo-600">${totalCost.toFixed(4)}</span>
                </div>
                <div className="bg-white p-2 rounded border flex items-center justify-between">
                  <span className="text-zinc-500">キャッシュ</span>
                  <span className="font-mono font-bold text-zinc-700">{cacheStats.count}件</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 bg-white px-2 py-1.5 rounded border">
                <span>日本円換算: ¥{Math.round(totalCost * 150).toLocaleString()}</span>
                <button
                  onClick={handleClearCache}
                  className="text-red-500 hover:text-red-700 flex items-center gap-0.5 font-bold"
                >
                  <Trash2 size={10}/>キャッシュ削除
                </button>
              </div>
            </>
          )}

          <div className="flex items-center justify-between bg-white p-2 rounded-lg w-full gap-1 border">
            <Gauge size={14} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500">速さ</span>
            <button onClick={() => setSpeechRate(p => Math.max(0.5, +(p - 0.1).toFixed(2)))} className="px-1.5 py-0.5 bg-zinc-200 hover:bg-zinc-300 rounded text-[10px] font-bold text-zinc-600">-0.1</button>
            <input type="range" min="0.5" max="2.5" step="0.05" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="flex-1 cursor-pointer accent-indigo-500"/>
            <button onClick={() => setSpeechRate(p => Math.min(2.5, +(p + 0.1).toFixed(2)))} className="px-1.5 py-0.5 bg-zinc-200 hover:bg-zinc-300 rounded text-[10px] font-bold text-zinc-600">+0.1</button>
            <span className="text-[11px] font-mono font-black text-indigo-600 min-w-[40px] text-right">x{speechRate.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
