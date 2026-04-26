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
  const [fallbackInfo, setFallbackInfo] = useState({ count: 0, ids: [] });  // ★v5.11.9: フォールバック発生の追跡★

  // ★v5.11.6 新規: 不足チェック関連の state★
  const [missingList, setMissingList] = useState([]);
  const [checkingMissing, setCheckingMissing] = useState(false);
  const [retryingId, setRetryingId] = useState(null);  // 個別再生成中の id

  // ★v5.14.2 新規: 全 scripts 操作 (任意選択再生成・個別試聴)★
  const [showAllScripts, setShowAllScripts] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);   // 一括再生成用
  const [cachedSet, setCachedSet] = useState(new Set()); // どの id がキャッシュ済か
  const [previewingId, setPreviewingId] = useState(null); // 個別試聴中の id

  // ★v5.14.4 新規: 録画診断モード★
  const [diagnostic, setDiagnostic] = useState(null);  // { audioCount, currentAudios, lastPlayLog }

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
    setFallbackInfo({ count: 0, ids: [] });  // ★リセット★
    try {
      const adapter = getAdapter('gemini');
      // ★v5.11.7: AudioContext を unlock (再生時のレイテンシをゼロに)★
      if (adapter.unlock) await adapter.unlock();
      const result = await adapter.pregenerate(projectData.scripts, (p) => {
        setProgress(p);
        // ★v5.11.9: フォールバック件数の進捗反映★
        if (p.fallbackCount !== undefined) {
          setFallbackInfo({ count: p.fallbackCount, ids: p.fallbackIds || [] });
        }
      });
      setTotalCost(prev => prev + result.costUsd);
      setPregenStatus(result.errors > 0 ? 'partial' : 'done');
      // ★v5.11.9: 最終的なフォールバック件数を反映★
      setFallbackInfo({
        count: result.fallbackCount || 0,
        ids: result.fallbackIds || []
      });
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

  /**
   * ★v5.14.2 新規: キャッシュ済み一覧を取得 (全 scripts ビュー用)★
   */
  const refreshCachedSet = async () => {
    if (!projectData?.scripts?.length) return;
    try {
      const adapter = getAdapter('gemini');
      const missing = await adapter.findMissing(projectData.scripts);
      const missingIds = new Set(missing.map(m => m.id));
      const cached = new Set(
        projectData.scripts
          .filter(s => !missingIds.has(s.id))
          .map(s => s.id)
      );
      setCachedSet(cached);
    } catch (e) {
      console.warn('refreshCachedSet failed:', e);
    }
  };

  // 全 scripts ビューを開いた時にキャッシュ状況を取得
  React.useEffect(() => {
    if (showAllScripts) refreshCachedSet();
    // eslint-disable-next-line
  }, [showAllScripts, projectData?.scripts]);

  /**
   * ★v5.14.2 新規: 任意 id を個別に試聴 (キャッシュから即時再生)★
   */
  const handlePreviewOne = async (id) => {
    const script = projectData.scripts.find(s => s.id === id);
    if (!script) return;
    const text = script.speech || script.text;
    if (!text) return;

    // 既に試聴中なら停止
    if (previewingId === id) {
      try { getAdapter('gemini').stop(); } catch (e) {}
      setPreviewingId(null);
      return;
    }

    setPreviewingId(id);
    try {
      const adapter = getAdapter('gemini');
      if (adapter.unlock) await adapter.unlock();
      await adapter.speak(text, script.speaker || 'A', {
        rate: speechRate,
        onEnd: () => setPreviewingId(null),
        onError: () => setPreviewingId(null),
      });
    } catch (err) {
      console.error('preview failed:', err);
      setPreviewingId(null);
    }
  };

  /**
   * ★v5.14.2 新規: 任意 id を強制再生成 (キャッシュ済でも上書き)★
   */
  const handleForceRegenerateOne = async (id) => {
    if (!confirm(`id:${id} を再生成します (既存キャッシュを上書き)。よろしいですか？`)) return;
    setRetryingId(id);
    try {
      const adapter = getAdapter('gemini');
      const result = await adapter.pregenerateOnly(projectData.scripts, [id]);
      setTotalCost(prev => prev + result.costUsd);
      if (result.errors === 0) {
        // missingList からも削除 (もし含まれていれば)
        setMissingList(prev => prev.filter(m => m.id !== id));
        await refreshCacheStats();
        await refreshCachedSet();
      } else {
        alert(`id:${id} の再生成失敗。`);
      }
    } catch (err) {
      console.error(err);
      alert(`id:${id} の再生成失敗: ` + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  /**
   * ★v5.14.2 新規: 選択中の id を一括強制再生成★
   */
  const handleRegenerateSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`選択した ${selectedIds.length} 件を再生成します (既存キャッシュを上書き)。よろしいですか？`)) return;

    setPregenStatus('loading');
    setProgress({ current: 0, total: selectedIds.length });
    try {
      const adapter = getAdapter('gemini');
      const result = await adapter.pregenerateOnly(projectData.scripts, selectedIds, (p) => setProgress(p));
      setTotalCost(prev => prev + result.costUsd);
      setPregenStatus(result.errors > 0 ? 'partial' : 'done');
      if (result.failedIds && result.failedIds.length > 0) {
        const stillFailed = projectData.scripts
          .filter(s => result.failedIds.includes(s.id))
          .map(s => ({ id: s.id, speaker: s.speaker, text: s.speech || s.text, reason: '再生成失敗' }));
        setMissingList(stillFailed);
      }
      await refreshCacheStats();
      await refreshCachedSet();
      setSelectedIds([]);  // 選択クリア
      onPregenComplete?.(result);
    } catch (err) {
      console.error(err);
      setPregenStatus('error');
      alert('再生成失敗: ' + err.message);
    }
  };

  /**
   * ★v5.14.2 新規: 選択チェックボックス★
   */
  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds((projectData?.scripts || []).map(s => s.id));
  };

  const clearSelection = () => setSelectedIds([]);

  /**
   * ★v5.14.4 新規: 録画診断 (現状の audio 要素の状態を画面に表示)★
   * - DOM に何個の audio があるか
   * - それぞれの src / volume / playbackRate / paused 状態
   * - これで「DOM attach されてるか」「volume が 0 になってないか」等を確認できる
   */
  const handleDiagnostic = async () => {
    try {
      const adapter = getAdapter('gemini');
      // 1. unlock を実行 (これでメディア permission が取れるはず)
      if (adapter.unlock) await adapter.unlock();

      // 2. テスト音声を生成 + 再生
      const testText = 'テスト';
      const testSpeaker = 'A';
      const log = [];
      log.push(`[${new Date().toLocaleTimeString()}] 診断開始`);
      log.push(`UA: ${navigator.userAgent.substring(0, 80)}`);

      // 3. play 中に DOM を観察
      const observeDom = () => {
        const audios = document.querySelectorAll('audio');
        return {
          count: audios.length,
          details: Array.from(audios).map((a, i) => ({
            i,
            src: (a.src || '').substring(0, 50),
            volume: a.volume,
            playbackRate: a.playbackRate,
            paused: a.paused,
            readyState: a.readyState,
            duration: a.duration,
            currentTime: a.currentTime,
            inDom: document.body.contains(a),
          })),
        };
      };

      log.push(`再生前 DOM audio 数: ${observeDom().count}`);

      // 再生開始
      await adapter.speak(testText, testSpeaker, {
        rate: speechRate,
        onEnd: () => {
          log.push(`[${new Date().toLocaleTimeString()}] 再生終了`);
        },
        onError: (e) => {
          log.push(`再生エラー: ${e?.message || e}`);
        },
      });

      // 再生中に observe (途中で何度か観察)
      setTimeout(() => {
        const obs1 = observeDom();
        log.push(`再生中 DOM audio 数: ${obs1.count}`);
        if (obs1.details.length > 0) {
          const a = obs1.details[0];
          log.push(`  src: ${a.src.startsWith('data:') ? 'data URL ✅' : a.src.startsWith('blob:') ? 'blob URL ⚠️' : 'other'}`);
          log.push(`  volume: ${a.volume.toFixed(2)}, rate: ${a.playbackRate.toFixed(2)}`);
          log.push(`  paused: ${a.paused}, inDom: ${a.inDom}, readyState: ${a.readyState}`);
        }
        setDiagnostic({ logs: log, audios: obs1.details });
      }, 500);
    } catch (err) {
      console.error('diagnostic failed:', err);
      setDiagnostic({ logs: ['診断エラー: ' + err.message], audios: [] });
    }
  };

  const handleClearCache = async () => {
    if (!confirm('音声キャッシュを全削除します。よろしいですか？（次回Gemini TTS再生時に再課金されます）')) return;
    await clearCache();
    await refreshCacheStats();
    await refreshCachedSet();
    setPregenStatus('idle');
    setMissingList([]);
    setSelectedIds([]);
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
                    <span className="text-[9px] opacity-70 font-normal">⚡2並列</span>
                  </>
                )}
              </button>

              {/* ★v5.11.9 新規: フォールバック発生の表示★ */}
              {fallbackInfo.count > 0 && (
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-2 flex items-center gap-2 text-[11px]">
                  <Sparkles size={12} className="text-blue-600 flex-shrink-0"/>
                  <span className="text-blue-900 font-bold">
                    {fallbackInfo.count}件が代替モデル (2.5 Flash) で生成
                  </span>
                  <span className="text-blue-700 text-[9px]">
                    (3.1 quota 切れの自動切替)
                  </span>
                </div>
              )}

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

              {/* ★v5.14.2 新規: 全 scripts ビュー (任意選択して再生成 or 試聴)★ */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowAllScripts(s => !s)}
                  className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-zinc-100 transition"
                >
                  <span className="text-[11px] font-black text-zinc-700 flex items-center gap-1.5">
                    <Mic2 size={11}/>
                    全 scripts ({projectData?.scripts?.length || 0}件)
                    {selectedIds.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                        {selectedIds.length} 選択中
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-zinc-500">{showAllScripts ? '▼ 閉じる' : '▶ 開く'}</span>
                </button>

                {showAllScripts && (
                  <div className="border-t border-zinc-200 bg-white">
                    {/* 一括操作バー */}
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-50 border-b border-zinc-200">
                      <button
                        onClick={selectAll}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 px-1.5"
                      >
                        全選択
                      </button>
                      <button
                        onClick={clearSelection}
                        disabled={selectedIds.length === 0}
                        className="text-[10px] font-bold text-zinc-600 hover:text-zinc-800 disabled:text-zinc-300 px-1.5"
                      >
                        選択解除
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={handleRegenerateSelected}
                        disabled={selectedIds.length === 0 || pregenStatus === 'loading'}
                        className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white px-2 py-1 rounded flex items-center gap-1 transition"
                      >
                        <RefreshCw size={10}/> 選択 {selectedIds.length} 件を再生成
                      </button>
                    </div>

                    {/* scripts リスト */}
                    <div className="flex flex-col max-h-72 overflow-y-auto custom-scrollbar">
                      {(projectData?.scripts || []).map(s => {
                        const isCached = cachedSet.has(s.id);
                        const isSelected = selectedIds.includes(s.id);
                        const isPreviewing = previewingId === s.id;
                        const isRetrying = retryingId === s.id;
                        const text = s.speech || s.text || '';
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-zinc-100 last:border-b-0 ${
                              isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-zinc-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelected(s.id)}
                              className="flex-shrink-0 w-3 h-3 accent-indigo-500"
                            />
                            <span className="text-[10px] font-mono font-black text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded flex-shrink-0 min-w-[32px] text-center">
                              {s.id}
                            </span>
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${
                              s.speaker === 'A' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {s.speaker === 'A' ? '数原' : 'もえか'}
                            </span>
                            {/* キャッシュ状態インジケータ */}
                            <span
                              className={`text-[9px] font-bold flex-shrink-0 w-2 h-2 rounded-full ${
                                isCached ? 'bg-emerald-400' : 'bg-zinc-300'
                              }`}
                              title={isCached ? '生成済' : '未生成'}
                            />
                            <span className="text-[10px] text-zinc-700 flex-1 truncate" title={text}>
                              {text || '(空)'}
                            </span>
                            {/* 試聴ボタン (生成済みのみ) */}
                            <button
                              onClick={() => handlePreviewOne(s.id)}
                              disabled={!isCached || isRetrying}
                              className={`text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0 rounded ${
                                isPreviewing
                                  ? 'bg-rose-500 text-white'
                                  : isCached
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-zinc-300 cursor-not-allowed'
                              }`}
                              title={isPreviewing ? '停止' : (isCached ? '試聴' : '未生成')}
                            >
                              {isPreviewing ? '■' : '▶'}
                            </button>
                            {/* 再生成ボタン (任意で) */}
                            <button
                              onClick={() => handleForceRegenerateOne(s.id)}
                              disabled={isRetrying || pregenStatus === 'loading'}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400 px-1 py-0.5 flex-shrink-0"
                              title={isCached ? 'この id を再生成 (キャッシュ上書き)' : 'この id を生成'}
                            >
                              {isRetrying ? (
                                <Loader2 size={10} className="animate-spin"/>
                              ) : (
                                <RefreshCw size={10}/>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* 凡例 */}
                    <div className="px-2 py-1.5 bg-zinc-50 border-t border-zinc-200 text-[9px] text-zinc-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> 生成済
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-zinc-300" /> 未生成
                      </span>
                      <span className="flex-1" />
                      <span>▶=試聴 / ↻=再生成</span>
                    </div>
                  </div>
                )}
              </div>

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

              {/* ★v5.14.4 新規: 録画診断★ */}
              <details className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                <summary className="px-2.5 py-1.5 text-[10px] font-bold text-amber-800 cursor-pointer hover:bg-amber-100">
                  🔍 録画診断 (TTSが録画されない時)
                </summary>
                <div className="p-2 bg-white border-t border-amber-200 space-y-2">
                  <button
                    onClick={handleDiagnostic}
                    className="w-full text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded"
                  >
                    診断テスト実行 (「テスト」と発声)
                  </button>
                  {diagnostic && (
                    <div className="bg-zinc-900 text-emerald-400 font-mono text-[9px] p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                      {diagnostic.logs.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                  <div className="text-[9px] text-zinc-600 space-y-0.5">
                    <div>📋 <strong>診断ボタンを押した状態で画面録画開始</strong>してください</div>
                    <div>1. 録画開始 → 2. 診断ボタン押下 → 3. 「テスト」音声が鳴る</div>
                    <div>4. 録画停止して動画確認 → 録画されてれば DOM attach は成功</div>
                  </div>
                </div>
              </details>
            </>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between bg-white p-2 rounded-lg w-full gap-1 border">
              <Gauge size={14} className="text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-500">速さ</span>
              <button onClick={() => setSpeechRate(p => Math.max(0.5, +(p - 0.1).toFixed(2)))} className="px-1.5 py-0.5 bg-zinc-200 hover:bg-zinc-300 rounded text-[10px] font-bold text-zinc-600">-0.1</button>
              <input type="range" min="0.5" max="2.5" step="0.05" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="flex-1 cursor-pointer accent-indigo-500"/>
              <button onClick={() => setSpeechRate(p => Math.min(2.5, +(p + 0.1).toFixed(2)))} className="px-1.5 py-0.5 bg-zinc-200 hover:bg-zinc-300 rounded text-[10px] font-bold text-zinc-600">+0.1</button>
              <span className="text-[11px] font-mono font-black text-indigo-600 min-w-[40px] text-right">x{speechRate.toFixed(2)}</span>
            </div>
            {/* ★v5.14.2★ 音程維持の説明 */}
            <div className="text-[9px] text-zinc-500 px-1">
              💡 音程維持 ON (preservesPitch) なので速度を上げても声質は変わりません。
              {speechRate >= 1.4 && <span className="text-amber-600 font-bold ml-1">x1.4以上は早口でも聞き取れる程度に。</span>}
              {speechRate <= 0.7 && <span className="text-amber-600 font-bold ml-1">x0.7以下は冗長になります。</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
