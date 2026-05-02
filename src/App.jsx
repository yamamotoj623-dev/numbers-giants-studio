import React, { useState, useEffect } from 'react';
import { Settings, Play, Square, ChevronDown, ChevronUp, Maximize2, RotateCcw, Monitor, Code, FileText, Mic2, Music, Layers, Radio, Shield, SquareStack, Volume2, VolumeX, Download, Loader2, Save, FolderOpen } from 'lucide-react';

import { APP_VERSION } from './lib/config';
import { defaultBatterData } from './data/defaultBatter';
import { defaultPitcherData } from './data/defaultPitcher';
import { usePlaybackEngine } from './hooks/usePlaybackEngine';
import { useVideoRecorder } from './hooks/useVideoRecorder';
import { GlobalStyles } from './components/GlobalStyles.jsx';
import { PreviewFrame } from './components/PreviewFrame.jsx';
import { TTSPanel } from './components/TTSPanel.jsx';
import { BGMPanel } from './components/BGMPanel.jsx';
import { JsonPanel } from './components/JsonPanel.jsx';
import { ScriptEditorPanel } from './components/ScriptEditorPanel.jsx';
import { LayoutPanel } from './components/LayoutPanel.jsx';
import { PanelErrorBoundary } from './components/PanelErrorBoundary.jsx';
import { autoSaveEditing, loadEditing, saveToSlot, loadFromSlot, listSlots, deleteSlot } from './lib/projectStorage';

const TABS = [
  { id: 'json',   label: 'JSON',    icon: <Code size={14}/> },
  { id: 'script', label: '台本',    icon: <FileText size={14}/> },
  { id: 'layout', label: 'レイアウト', icon: <Layers size={14}/> },
  { id: 'tts',    label: '音声',    icon: <Mic2 size={14}/> },
  { id: 'audio',  label: 'BGM/SE',  icon: <Music size={14}/> },
];

const App = () => {
  // ★v5.18.4★ 初期化時に localStorage から自動復元 (前回編集中だったプロジェクト)
  const [projectData, setProjectData] = useState(() => {
    const saved = loadEditing();
    return saved || defaultBatterData;
  });
  const [activeTab, setActiveTab] = useState('json');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  // ★v5.18.4★ 保存スロット管理用
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [savedSlots, setSavedSlots] = useState(() => listSlots());

  // ★v5.18.4★ projectData 変更時に localStorage へ自動保存 (debounce: 1秒)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSaveEditing(projectData);
    }, 1000);
    return () => clearTimeout(timer);
  }, [projectData]);

  // ★v5.18.10★ 起動時に合成音 SE プリセットを WAV 化して HTMLAudioElement プールに登録
  // → 画面録画でデフォルト SE も拾えるようになる (Firefox 画面録画ワークフロー対応)
  // 一度きりの実行 (depending: [])
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { getMixer } = await import('./lib/mixer');
        const mixer = getMixer();
        // idle 時に実行 (アプリ起動を遅らせない)
        const run = async () => {
          if (cancelled) return;
          const result = await mixer.preregisterSyntheticSes();
          console.log('[App] synthetic SE preregister:', result);
        };
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(run, { timeout: 3000 });
        } else {
          setTimeout(run, 500);
        }
      } catch (err) {
        console.error('[App] preregisterSyntheticSes init failed:', err);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const [ttsEngine, setTtsEngine] = useState('web_speech');
  const [speechRate, setSpeechRate] = useState(1.6);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSEEnabled, setIsSEEnabled] = useState(true);
  const [isBgmEnabled, setIsBgmEnabled] = useState(true);
  const [showDurationBadge, setShowDurationBadge] = useState(false);

  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(0);
  const [isSquareMode, setIsSquareMode] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState(null);

  // TTS quota 超過イベントをリッスン
  useEffect(() => {
    const handler = (ev) => {
      setQuotaWarning(ev.detail?.message || 'TTS quota超過');
      // 15秒後に自動で消す
      setTimeout(() => setQuotaWarning(null), 15000);
    };
    window.addEventListener('tts-quota-exceeded', handler);
    return () => window.removeEventListener('tts-quota-exceeded', handler);
  }, []);

  const {
    isPlaying,
    currentIndex,
    currentScript,
    elapsedTime,
    animationKey,
    togglePlay,
    reset,
  } = usePlaybackEngine(projectData, { ttsEngine, speechRate, isVoiceEnabled, isSEEnabled, isBgmEnabled });

  // 動画録画
  const { isRecording, errorMessage: recordError, startRecording, stopRecording } = useVideoRecorder();
  const [recordRequested, setRecordRequested] = useState(false);

  // 録画中に再生が終わったら自動停止
  useEffect(() => {
    if (recordRequested && isRecording && !isPlaying && elapsedTime > 1) {
      // 再生が止まり、かつ少しでも経過してる → 終了したと判断
      const t = setTimeout(() => {
        stopRecording();
        setRecordRequested(false);
      }, 500);  // 末尾余韻
      return () => clearTimeout(t);
    }
  }, [isPlaying, elapsedTime, isRecording, recordRequested, stopRecording]);

  const handleRecordVideo = async () => {
    if (isRecording) {
      stopRecording();
      setRecordRequested(false);
      return;
    }
    if (isPlaying) togglePlay();  // 再生中なら一旦停止
    reset();
    const playerName = projectData?.mainPlayer?.name || 'shorts';
    const today = new Date().toISOString().slice(0, 10);
    const filename = `${playerName}_${today}.mp4`.replace(/[\\/:*?"<>|\s]/g, '_');
    const ok = await startRecording({ filename });
    if (ok) {
      setRecordRequested(true);
      // 少し待って自動再生
      setTimeout(() => togglePlay(), 300);
    }
  };

  const loadTemplate = (type) => {
    const tpl = type === 'batter' ? defaultBatterData : defaultPitcherData;
    setProjectData(tpl);
    reset();
  };

  const startRecordingMode = () => {
    setIsFullscreenMode(true);
    setIsRecordingMode(true);
    setRecordingCountdown(3);
  };

  const exitRecordingMode = () => {
    setIsRecordingMode(false);
    setRecordingCountdown(0);
    reset();
  };

  useEffect(() => {
    if (recordingCountdown <= 0 || !isRecordingMode) return;
    const t = setTimeout(() => {
      if (recordingCountdown === 1) {
        reset();
        setTimeout(() => togglePlay(), 100);
      }
      setRecordingCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [recordingCountdown, isRecordingMode]);

  return (
    <div className={`min-h-screen ${isFullscreenMode ? 'bg-black flex justify-center items-center' : 'bg-zinc-100 p-4 md:p-8 flex flex-col md:flex-row gap-6 overflow-x-auto'} font-sans transition-colors duration-500`}>
      <GlobalStyles />

      {/* Gemini TTS quota超過 warning */}
      {quotaWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-amber-500 text-white px-5 py-3 rounded-lg shadow-xl font-bold text-sm max-w-lg flex items-center gap-3 animate-pulse">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <div className="text-xs font-normal opacity-90">Gemini TTS 制限到達</div>
            <div>{quotaWarning}</div>
          </div>
          <button onClick={() => setQuotaWarning(null)} className="text-white hover:bg-amber-600 rounded p-1 text-xs">✕</button>
        </div>
      )}

      {/* 録画状態 / エラー */}
      {(isRecording || recordError) && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] ${isRecording ? 'bg-red-500' : 'bg-rose-600'} text-white px-5 py-3 rounded-lg shadow-xl font-bold text-sm max-w-lg flex items-center gap-3`}>
          {isRecording ? (
            <>
              <Loader2 size={20} className="animate-spin"/>
              <div className="flex-1">
                <div className="text-xs font-normal opacity-90">動画録画中…</div>
                <div>動画は再生終了後に自動でダウンロードされます</div>
              </div>
            </>
          ) : (
            <>
              <span className="text-xl">⚠️</span>
              <div className="flex-1">{recordError}</div>
            </>
          )}
        </div>
      )}

      {!isFullscreenMode && (
        <div className={`w-full md:w-[450px] lg:w-[500px] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-zinc-200 shrink-0 transition-all duration-300 ${isPanelOpen ? 'h-auto md:h-[90vh]' : 'h-auto'}`}>
          <div className="bg-zinc-800 p-4 flex items-center justify-between shadow-md z-10 cursor-pointer select-none" onClick={() => setIsPanelOpen(!isPanelOpen)}>
            <h2 className="text-white font-bold flex items-center gap-2">
              <Settings size={18}/> 数字で見るG党 Studio
              <span className="text-[10px] bg-indigo-600 px-1.5 py-0.5 rounded ml-1">v{APP_VERSION}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setIsFullscreenMode(true); }}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 transition shadow"
                title="プレビュー拡大"
              >
                <Maximize2 size={12}/> 拡大
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); startRecordingMode(); }}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 transition shadow"
                title="録画モード開始"
              >
                <Radio size={12}/> 録画
              </button>
              {isPanelOpen ? <ChevronUp size={18} className="text-white"/> : <ChevronDown size={18} className="text-white"/>}
            </div>
          </div>

          {isPanelOpen && (
            <>
              <div className="flex border-b bg-zinc-50 shrink-0 overflow-x-auto">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[70px] py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? `border-indigo-600 text-indigo-700 bg-white`
                        : `border-transparent text-zinc-500 hover:bg-zinc-100`
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto bg-zinc-50 relative custom-scrollbar">
                {/* ★v5.18.7★ 各パネルを ErrorBoundary でラップ
                    パネル内で例外が出てもアプリ全体が真っ白にならないようにする */}
                {activeTab === 'json' && (
                  <PanelErrorBoundary panelName="JSON">
                    <JsonPanel
                      projectData={projectData}
                      onApply={(p) => { setProjectData(p); reset(); }}
                      onLoadTemplate={loadTemplate}
                    />
                  </PanelErrorBoundary>
                )}
                {activeTab === 'script' && (
                  <PanelErrorBoundary panelName="台本">
                    <ScriptEditorPanel
                      projectData={projectData}
                      currentIndex={currentIndex}
                      onChange={setProjectData}
                    />
                  </PanelErrorBoundary>
                )}
                {activeTab === 'layout' && (
                  <PanelErrorBoundary panelName="レイアウト">
                    <LayoutPanel projectData={projectData} onChange={setProjectData}/>
                  </PanelErrorBoundary>
                )}
                {activeTab === 'tts' && (
                  <div className="p-4">
                    <PanelErrorBoundary panelName="音声">
                      <TTSPanel
                        engine={ttsEngine}
                        setEngine={setTtsEngine}
                        speechRate={speechRate}
                        setSpeechRate={setSpeechRate}
                        isVoiceEnabled={isVoiceEnabled}
                        setIsVoiceEnabled={setIsVoiceEnabled}
                        projectData={projectData}
                      />
                    </PanelErrorBoundary>
                  </div>
                )}
                {activeTab === 'audio' && (
                  <div className="p-4">
                    <PanelErrorBoundary panelName="BGM/SE">
                      <BGMPanel />
                    </PanelErrorBoundary>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className={`flex flex-col items-center justify-start transition-all duration-500 ${isFullscreenMode ? 'w-full h-[100dvh] justify-center bg-black' : 'flex-1 pt-2 min-w-0'}`}>

        {isFullscreenMode && !isRecordingMode && (
          <div className={`absolute top-4 left-4 z-[100] flex gap-2 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
            <button onClick={() => setIsFullscreenMode(false)} className="bg-zinc-800/80 hover:bg-zinc-700 text-white p-2.5 rounded-full backdrop-blur-md transition shadow-xl border border-white/10" title="縮小画面に戻る">
              <Monitor size={20}/>
            </button>
            <button onClick={togglePlay} className={`${isPlaying ? 'bg-red-500' : 'bg-indigo-600'} text-white p-2.5 rounded-full shadow-xl transition-colors`} title="再生/停止">
              {isPlaying ? <Square size={20}/> : <Play size={20}/>}
            </button>
          </div>
        )}

        {isRecordingMode && recordingCountdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
            <div className="text-white text-[180px] font-black tracking-tighter animate-pulse" style={{ textShadow: '0 0 40px rgba(239,68,68,0.8)' }}>
              {recordingCountdown}
            </div>
          </div>
        )}

        {isRecordingMode && (
          <button
            onClick={exitRecordingMode}
            className="absolute top-4 right-4 z-[100] bg-red-600/90 hover:bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl opacity-30 hover:opacity-100 transition"
          >
            録画モード終了
          </button>
        )}

        <PreviewFrame
          projectData={projectData}
          currentScript={currentScript}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          animationKey={animationKey}
          isFullscreenMode={isFullscreenMode}
          isRecordingMode={isRecordingMode}
          isSquareMode={isSquareMode}
          showSafeZone={showSafeZone}
          showDurationBadge={showDurationBadge}
        />

        {!isFullscreenMode && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-5 bg-white px-6 py-3 rounded-full shadow-lg border border-zinc-200">
              <button onClick={togglePlay} className={`w-14 h-14 ${isPlaying ? 'bg-red-500' : 'bg-indigo-600'} hover:opacity-90 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-90`}>
                {isPlaying ? <Square size={24} fill="currentColor"/> : <Play size={28} fill="currentColor" className="ml-1"/>}
              </button>
              <div className="flex flex-col items-center justify-center w-24">
                <span className="text-zinc-800 font-mono text-2xl font-black leading-none">00:{elapsedTime.toString().padStart(2, '0')}</span>
                <span className="text-zinc-400 font-bold text-[10px] mt-1">SCENE {currentIndex + 1} / {projectData.scripts.length}</span>
              </div>
              <button onClick={reset} className="text-zinc-400 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 p-3 rounded-full transition">
                <RotateCcw size={18}/>
              </button>
              <button
                onClick={handleRecordVideo}
                className={`p-3 rounded-full transition ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                title={isRecording ? '録画停止 (自動停止します)' : '動画ダウンロード (画面共有→自動再生→自動保存)'}
              >
                {isRecording ? <Loader2 size={18} className="animate-spin"/> : <Download size={18}/>}
              </button>
            </div>

            {/* プレビューモードトグル */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setIsSquareMode(v => !v)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition flex items-center gap-1 ${isSquareMode ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'}`}
                title="スクエアモード"
              >
                <SquareStack size={12}/> スクエア
              </button>
              <button
                onClick={() => setShowSafeZone(v => !v)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition flex items-center gap-1 ${showSafeZone ? 'bg-red-500 text-white border-red-500' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'}`}
                title="セーフゾーン表示"
              >
                <Shield size={12}/> セーフゾーン
              </button>
              <button
                onClick={() => setIsSEEnabled(v => !v)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition flex items-center gap-1 ${isSEEnabled ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-100'}`}
                title={isSEEnabled ? '効果音オン' : '効果音オフ'}
              >
                {isSEEnabled ? <Volume2 size={12}/> : <VolumeX size={12}/>} {isSEEnabled ? 'SE オン' : 'SE オフ'}
              </button>
              <button
                onClick={() => setShowDurationBadge(v => !v)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition flex items-center gap-1 ${showDurationBadge ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-100'}`}
                title="動画時間バッジ表示"
              >
                🎬 時間
              </button>
              <div className="flex items-center gap-1 bg-zinc-50 rounded-full px-2 py-1 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-500 mr-1">冒頭:</span>
                {[
                  { id: 'pop', label: '🎈 弾' },
                  { id: 'shake', label: '💥 揺' },
                  { id: 'slide', label: '➡ 滑' },
                  { id: 'zoom', label: '🔍 拡' },
                  { id: 'fade', label: '🌫 淡' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setProjectData(prev => ({ ...prev, hookAnimation: opt.id }))}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                      (projectData.hookAnimation || 'pop') === opt.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white text-zinc-500 hover:bg-zinc-100'
                    }`}
                    title={`冒頭アニメーション: ${opt.id}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* ★v5.18.0★ smartLoop トグル (Gemini提言: 無限ループ) */}
              <button
                onClick={() => setProjectData(prev => ({ ...prev, smartLoop: !prev.smartLoop }))}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition flex items-center gap-1 border ${
                  projectData.smartLoop
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                }`}
                title={projectData.smartLoop
                  ? '無限ループON: 末尾→冒頭にシームレス遷移 (アウトロ画面なし)'
                  : '無限ループOFF: 末尾でアウトロ画面表示して停止'}
              >
                {projectData.smartLoop ? '🔁 ループON' : '⏹ ループOFF'}
              </button>

              {/* ★v5.18.4★ 保存スロット (台本/編集の永続化) */}
              <button
                onClick={() => {
                  setSavedSlots(listSlots());
                  setShowSavePanel(true);
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-full transition flex items-center gap-1 border bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                title="台本/編集を保存・復元 (ブラウザ内に保管)"
              >
                <Save size={11}/> 保存
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5">
              エンジン: <span className={ttsEngine === 'gemini' ? 'text-indigo-600' : 'text-zinc-700'}>
                {ttsEngine === 'gemini' ? 'Gemini 3.1 Flash TTS (本番)' : 'Web Speech (下書き)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ★v5.18.4★ 保存スロット モーダル */}
      {showSavePanel && (
        <SaveSlotModal
          projectData={projectData}
          slots={savedSlots}
          onClose={() => setShowSavePanel(false)}
          onSave={(name) => {
            saveToSlot(name, projectData);
            setSavedSlots(listSlots());
          }}
          onLoad={(name) => {
            const data = loadFromSlot(name);
            if (data) {
              setProjectData(data);
              setShowSavePanel(false);
            }
          }}
          onDelete={(name) => {
            deleteSlot(name);
            setSavedSlots(listSlots());
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// 保存スロット モーダル (★v5.18.4★)
// ============================================================================
function SaveSlotModal({ projectData, slots, onClose, onSave, onLoad, onDelete }) {
  const [newName, setNewName] = useState('');
  const defaultName = projectData?.title || projectData?.mainPlayer?.name || '';

  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-indigo-900 flex items-center gap-1.5">
            <Save size={14}/> 台本/編集の保存・復元
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-800 text-lg leading-none">✕</button>
        </div>

        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
          <div className="text-[10px] text-emerald-800 mb-1.5 font-bold">💾 現在の編集を保存</div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newName}
              placeholder={defaultName || '保存名 (例: 岡本動画)'}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 border border-emerald-200 rounded outline-none"
            />
            <button
              onClick={() => {
                const name = newName.trim() || defaultName;
                if (!name) return;
                onSave(name);
                setNewName('');
              }}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded"
            >
              保存
            </button>
          </div>
          <div className="text-[9px] text-zinc-600 mt-1">
            ※ 編集中はリアルタイムで自動保存されているので、閉じても次回起動時に復元されます。
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="text-[10px] font-bold text-zinc-500 mb-1">📚 保存済みプロジェクト ({slots.length})</div>
          {slots.length === 0 ? (
            <div className="text-[11px] text-zinc-400 py-4 text-center">まだ保存されていません</div>
          ) : (
            <div className="space-y-1">
              {slots.map(slot => (
                <div key={slot.name} className="flex items-center gap-1.5 p-2 bg-zinc-50 hover:bg-indigo-50 border border-zinc-200 rounded">
                  <FolderOpen size={12} className="text-indigo-500 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-800 truncate">{slot.name}</div>
                    <div className="text-[9px] text-zinc-500">
                      {slot.title} · {slot.scriptsCount}件 · {formatDate(slot.savedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => onLoad(slot.name)}
                    className="text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
                  >
                    開く
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`「${slot.name}」を削除しますか?`)) onDelete(slot.name);
                    }}
                    className="text-[10px] font-bold bg-zinc-200 hover:bg-red-100 text-zinc-600 hover:text-red-600 px-2 py-1 rounded"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
