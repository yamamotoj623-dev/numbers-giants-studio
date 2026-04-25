/**
 * TTS エンジン切替・事前生成・コスト表示パネル (v2 / v5.11.6)
 *
 * v2 改修点:
 * - ★不足チェック★ scripts のうちキャッシュにないものを検出
 * - ★部分再生成★ 不足分だけまとめて再生成
 * - ★個別再生成★ 特定 id だけピンポイントで再生成
 *
 * 「下書き (Web Speech)」と「本番 (Gemini 3.1 Flash TTS)」を明示的に切替。
 */

import React, { useState } from 'react';
import { Mic2, Volume2, VolumeX, Gauge, Sparkles, Zap, Loader2, Check, DollarSign, Trash2, AlertCircle, RefreshCw, Search } from 'lucide-react';
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

  // ★v5.11.6 新規: 不足チェック関連の state★
  const [missingList, setMissingList] = useState([]);
  const [checkingMissing, setCheckingMissing] = useState(false);
  const [retryingId, setRetryingId] = useState(null);  // 個別再生成中の id

  const refreshCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.warn(e);
    }
  };

  React.useEffect(() => { refreshCacheStats(); }, []);

  // ★scripts が変わったら、不足リストをリセット★
  React.useEffect(() => {
    setMissingList([]);
  }, [projectData?.scripts]);

  const handlePregen = async () => {
    setPregenStatus('loading');
    setProgress({ current: 0, total: projectData.scripts.length });
    try {
      const adapter = getAdapter('gemini');
      // ★v5.11.7: AudioContext を unlock (再生時のレイテンシをゼロに)★
      if (adapter.unlock) await adapter.unlock();
      const result = await adapter.pregenerate(projectData.scripts, (p) => setProgress(p));
      setTotalCost(prev => prev + result.costUsd);
      setPregenStatus(result.errors > 0 ? 'partial' : 'done');
      // エラーがあったら不足リストを自動セット
      if (result.failedIds && result.failedIds.length > 0) {
        const failed = projectData.scripts
          .filter(s => result.failedIds.includes(s.id))
          .map(s => ({ id: s.id, speaker: s.speaker, text: s.speech || s.text, reason: '生成失敗' }));
        setMissingList(failed);
      }
      await refreshCacheStats();
      onPregenComplete?.(result);
    } catch (err) {
      console.error(err);
      setPregenStatus('error');
      alert('事前生成失敗: ' + err.message);
    }
  };

  /**
   * ★v5.11.6 新規: 不足チェック★
   * scripts のうち、キャッシュにないものをリストアップする
   */
  const handleCheckMissing = async () => {
    setCheckingMissing(true);
    try {
      const adapter = getAdapter('gemini');
      const missing = await adapter.findMissing(projectData.scripts);
      setMissingList(missing);
      if (missing.length === 0) {
        alert('全 scripts のキャッシュが揃っています ✅');
      }
    } catch (err) {
      console.error(err);
      alert('不足チェック失敗: ' + err.message);
    } finally {
      setCheckingMissing(false);
    }
  };

  /**
   * ★v5.11.6 新規: 不足分のみ一括再生成★
   */
  const handleRegenerateMissing = async () => {
    if (missingList.length === 0) return;
    if (!confirm(`不足 ${missingList.length} 件を再生成します。よろしいですか？`)) return;

    setPregenStatus('loading');
    setProgress({ current: 0, total: missingList.length });
    try {
      const adapter = getAdapter('gemini');
      const targetIds = missingList.map(m => m.id);
      const result = await adapter.pregenerateOnly(projectData.scripts, targetIds, (p) => setProgress(p));
      setTotalCost(prev => prev + result.costUsd);
      setPregenStatus(result.errors > 0 ? 'partial' : 'done');
      // 残った失敗 id だけ更新
      if (result.failedIds && result.failedIds.length > 0) {
        const stillFailed = projectData.scripts
          .filter(s => result.failedIds.includes(s.id))
          .map(s => ({ id: s.id, speaker: s.speaker, text: s.speech || s.text, reason: '再生成失敗' }));
        setMissingList(stillFailed);
      } else {
        setMissingList([]);  // 全部成功
      }
      await refreshCacheStats();
      onPregenComplete?.(result);
    } catch (err) {
      console.error(err);
      setPregenStatus('error');
      alert('再生成失敗: ' + err.message);
    }
  };

  /**
   * ★v5.11.6 新規: 特定 id だけ個別再生成★
   */
  const handleRegenerateOne = async (id) => {
    setRetryingId(id);
    try {
      const adapter = getAdapter('gemini');
      const result = await adapter.pregenerateOnly(projectData.scripts, [id]);
      setTotalCost(prev => prev + result.costUsd);
      if (result.errors === 0) {
        // 成功、リストから削除
        setMissingList(prev => prev.filter(m => m.id !== id));
      } else {
        alert(`id ${id} の再生成失敗。もう一度試してください。`);
      }
      await refreshCacheStats();
    } catch (err) {
      console.error(err);
      alert(`id ${id} の再生成失敗: ` + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('音声キャッシュを全削除します。よろしいですか？（次回Gemini TTS再生時に再課金されます）')) return;
    await clearCache();
    await refreshCacheStats();
    setPregenStatus('idle');
    setMissingList([]);
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
              {/* メイン: 全セクション事前生成 */}
              <button
                onClick={handlePregen}
                disabled={pregenStatus === 'loading'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white text-xs font-bold py-2.5 rounded-lg shadow flex items-center justify-center gap-2 transition"
              >
                {pregenStatus === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin"/>
                    生成中 {progress ? `${progress.current}/${progress.total}` : ''}
                    {progress?.failedIds?.length > 0 && (
                      <span className="text-yellow-200">(失敗 {progress.failedIds.length})</span>
                    )}
                  </>
                ) : pregenStatus === 'done' ? (
                  <><Check size={14}/> 生成完了</>
                ) : pregenStatus === 'partial' ? (
                  <><AlertCircle size={14}/> 一部失敗 (下で再生成)</>
                ) : (
                  <>
                    <Zap size={14}/>
                    全セクションを事前生成
                    <span className="text-[9px] opacity-70 font-normal">⚡4並列</span>
                  </>
                )}
              </button>

              {/* ★v5.11.6 新規: 不足チェック★ */}
              <button
                onClick={handleCheckMissing}
                disabled={checkingMissing || pregenStatus === 'loading' || !projectData?.scripts?.length}
                className="w-full bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-50 text-zinc-700 text-xs font-bold py-2 rounded-lg border border-zinc-300 flex items-center justify-center gap-2 transition"
              >
                {checkingMissing ? (
                  <><Loader2 size={12} className="animate-spin"/> 確認中...</>
                ) : (
                  <><Search size={12}/> 不足チェック ({projectData?.scripts?.length || 0} scripts)</>
                )}
              </button>

              {/* ★v5.11.6 新規: 不足リスト + 一括再生成 + 個別再生成★ */}
              {missingList.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                      <AlertCircle size={12}/>
                      不足 {missingList.length} 件
                    </span>
                    <button
                      onClick={handleRegenerateMissing}
                      disabled={pregenStatus === 'loading'}
                      className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-300 text-white px-2 py-1 rounded flex items-center gap-1 transition"
                    >
                      <RefreshCw size={10}/> 全て再生成
                    </button>
                  </div>

                  {/* 不足 id リスト (個別再生成可能) */}
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {missingList.map(m => (
                      <div key={m.id} className="bg-white rounded px-2 py-1.5 flex items-center gap-2 border border-amber-200">
                        <span className="text-[10px] font-mono font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">
                          id:{m.id}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          m.speaker === 'A' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {m.speaker === 'A' ? '数原' : 'もえか'}
                        </span>
                        <span className="text-[10px] text-zinc-600 flex-1 truncate" title={m.text}>
                          {m.text || '(空)'}
                        </span>
                        <button
                          onClick={() => handleRegenerateOne(m.id)}
                          disabled={retryingId === m.id || pregenStatus === 'loading'}
                          className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400 px-1 py-0.5 flex-shrink-0"
                          title="この id だけ再生成"
                        >
                          {retryingId === m.id ? (
                            <Loader2 size={10} className="animate-spin"/>
                          ) : (
                            <RefreshCw size={10}/>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
