/**
 * プレビュー本体の外枠。v5.0.0 UI確定版。
 * - 4フェーズ表示モデル (hook / normal / highlight / outro)
 * - テロップは話者側に寄せた吹き出し
 * - textSize によるサイズ階層 (xl/l/m/s)
 * - pattern 連動のフック出現アニメ
 * - 録画モード: 編集UIを非表示
 */

import React, { useMemo } from 'react';
import { Activity, Clapperboard } from 'lucide-react';
import { THEMES } from '../lib/config';
import { LayoutRouter } from '../layouts/LayoutRouter.jsx';
import { renderFormattedText } from '../lib/textRender.jsx';

function getPhase(currentScript, currentIndex, scripts) {
  if (!currentScript) return 'normal';
  if (currentScript.isCatchy) return 'hook';
  const total = scripts?.length || 0;
  if (total && currentIndex >= total - 2) return 'outro';
  if (currentScript.highlight) return 'highlight';
  return 'normal';
}

function resolveTextSize(script) {
  if (script?.textSize) return script.textSize;
  const t = (script?.text || '').replace(/\n/g, '');
  const len = t.length;
  if (len <= 6) return 'xl';
  if (len <= 10) return 'l';
  if (len <= 15) return 'm';
  return 's';
}

const TELOP_SIZE_PX = { xl: 26, l: 22, m: 19, s: 16 };

function estimateDuration(scripts) {
  const total = (scripts || []).reduce((sum, s) => sum + ((s?.speech || '').length), 0);
  const sec = Math.round(total * 0.15);
  const mm = Math.floor(sec / 60).toString().padStart(2, '0');
  const ss = (sec % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function getHookAnim(pattern) {
  const shakePatterns = ['bad_news', 'mystery'];
  return shakePatterns.includes(pattern) ? 'shake' : 'pop';
}

export function PreviewFrame({
  projectData,
  currentScript,
  currentIndex,
  isPlaying,
  animationKey,
  isFullscreenMode = false,
  isRecordingMode = false,
}) {
  const themeClass = THEMES[projectData.theme] || THEMES.orange;
  const scripts = projectData?.scripts || [];

  const phase = getPhase(currentScript, currentIndex, scripts);
  const hookAnim = getHookAnim(projectData.pattern);
  const textSize = resolveTextSize(currentScript);
  const estDuration = useMemo(() => estimateDuration(scripts), [scripts]);

  const currentEmojiA = useMemo(() => {
    for (let i = currentIndex; i >= 0; i--) {
      if (scripts[i]?.speaker === 'A' && scripts[i]?.emoji) return scripts[i].emoji;
    }
    return '👨‍🏫';
  }, [currentIndex, scripts]);

  const currentEmojiB = useMemo(() => {
    for (let i = currentIndex; i >= 0; i--) {
      if (scripts[i]?.speaker === 'B' && scripts[i]?.emoji) return scripts[i].emoji;
    }
    return '😲';
  }, [currentIndex, scripts]);

  const aspectClass = projectData.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';
  const frameBorderClass = isRecordingMode
    ? 'rounded-none border border-transparent'
    : 'rounded-[2rem] border-[6px] border-zinc-900 ring-4 ring-black/5';
  const frameClass = isFullscreenMode
    ? `h-[95vh] ${aspectClass}`
    : `w-full max-w-[420px] ${aspectClass} ${frameBorderClass}`;

  const showPlayerHeader = phase === 'normal' || phase === 'highlight';
  const showAvatars = phase === 'normal' || phase === 'highlight';
  const showTelop = !currentScript?.isCatchy && phase !== 'outro';

  const telopAlignClass = currentScript?.speaker === 'A'
    ? 'items-start pl-[60px] pr-[100px]'
    : currentScript?.speaker === 'B'
      ? 'items-end pl-[100px] pr-[75px]'
      : 'items-center px-[75px]';

  const telopBubbleSpeakerClass = currentScript?.speaker === 'A'
    ? 'bubble-speaker-a'
    : currentScript?.speaker === 'B'
      ? 'bubble-speaker-b'
      : '';

  return (
    <div className={`relative bg-[#0d0d0f] flex flex-col font-sans overflow-hidden shadow-2xl transition-all duration-300 ${frameClass}`}>

      {!isRecordingMode && (
        <div className="absolute top-3 left-3 z-40 bg-zinc-900/85 border border-indigo-500/50 text-indigo-300 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 tracking-wider">
          <Clapperboard size={10} />
          {estDuration}
        </div>
      )}

      {/* フェーズA: フック */}
      {phase === 'hook' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-3">
          <div className="absolute left-1/2 top-[36%] -translate-x-1/2 w-[80%] h-[80%] opacity-20 pointer-events-none hook-silhouette-breath z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 30px #f97316)' }}>
              <g fill="#f97316">
                <ellipse cx="105" cy="38" rx="18" ry="20"/>
                <path d="M 88 40 L 80 42 L 82 46 L 95 45 Z"/>
                <rect x="99" y="55" width="12" height="10"/>
                <path d="M 85 65 L 125 65 L 130 120 L 80 120 Z"/>
                <path d="M 125 70 L 145 75 L 155 65 L 160 50 L 155 45 L 145 50 L 130 65 Z"/>
                <path d="M 85 72 L 70 85 L 72 105 L 80 100 L 90 85 Z"/>
                <path d="M 155 65 L 175 25 L 180 18 L 178 15 L 170 20 L 158 60 Z"/>
                <path d="M 80 120 L 130 120 L 128 140 L 82 140 Z"/>
                <path d="M 82 140 L 78 180 L 68 185 L 70 192 L 92 188 L 98 140 Z"/>
                <path d="M 108 140 L 122 180 L 132 188 L 135 192 L 122 195 L 108 188 L 100 140 Z"/>
              </g>
            </svg>
          </div>

          <div className="absolute top-3 left-3 right-3 z-30 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col items-start mt-5">
              <div className="flex items-baseline gap-1">
                <span className={`${themeClass.text} font-black italic text-[22px] leading-none`} style={{ textShadow: `0 0 10px ${themeClass.glow}` }}>G</span>
                <span className="text-white font-black text-[12px] tracking-wider leading-none">数字で見るG党</span>
              </div>
              <span className={`${themeClass.text} font-bold text-[8px] tracking-widest uppercase mt-1 opacity-80`}>Giants Analytics</span>
            </div>
          </div>

          <div className="absolute top-[58px] right-4 z-30 bg-zinc-900/90 backdrop-blur-md border border-orange-500/40 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg">
            <div className={`w-6 h-6 ${themeClass.bg} text-white font-black text-[12px] rounded-md flex items-center justify-center hook-pill-number`}>
              {projectData.mainPlayer.number}
            </div>
            <div className="flex flex-col leading-none">
              <span className={`${themeClass.text} text-[7px] font-bold tracking-wider mb-0.5`}>NPB / 巨人</span>
              <span className="text-white text-[13px] font-black tracking-tight">{projectData.mainPlayer.name}</span>
            </div>
          </div>

          <div className="relative z-20 w-full text-center px-3">
            <div
              className={`font-black leading-[1.15] tracking-tighter ${hookAnim === 'shake' ? 'hook-telop-shake' : 'hook-telop-pop'}`}
              style={{
                fontSize: 46,
                color: '#fff',
                textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 10px 30px rgba(0,0,0,1)'
              }}
            >
              {renderFormattedText(currentScript?.text, true, null)}
            </div>
          </div>

          <div className="absolute bottom-[25%] left-2 right-2 z-25 hook-stats-wipe">
            <div className={`${themeClass.text} text-center font-black text-[10px] tracking-[3px] mb-1.5 opacity-80`}>▼ SEASON STATS</div>
            <div
              className="grid grid-cols-4 gap-1.5 px-2 py-2.5 border-t-2 border-b-2"
              style={{
                background: 'linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.3), rgba(249,115,22,0.15))',
                borderColor: 'rgba(249,115,22,0.6)',
                boxShadow: '0 0 20px rgba(249,115,22,0.2)'
              }}
            >
              {renderHookStat(projectData, 'avg', 'AVG')}
              {renderHookStat(projectData, 'ops', 'OPS')}
              {renderHookStat(projectData, 'hr', 'HR')}
              {renderHookStat(projectData, 'rbi', 'RBI')}
            </div>
          </div>
        </div>
      )}

      {/* 通常ヘッダー (日付・選手名) */}
      {showPlayerHeader && (
        <div className="pt-3 pb-0 px-4 flex flex-col items-center relative z-20">
          <div className={`absolute top-3 right-4 ${themeClass.text} opacity-80 text-[9px] font-bold flex items-center gap-1`}>
            <Activity size={10} className="animate-pulse" /> {projectData.period}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-[26px] h-[26px] ${themeClass.bg} text-white font-black text-[13px] rounded-md flex items-center justify-center`} style={{ boxShadow: `0 0 12px ${themeClass.glow}` }}>{projectData.mainPlayer.number}</span>
            <span className={`${themeClass.text} text-[22px] font-black tracking-tight leading-none`}>{projectData.mainPlayer.name}</span>
          </div>
        </div>
      )}

      {/* レイアウト本体 */}
      <LayoutRouter
        projectData={projectData}
        currentScript={currentScript}
        currentIndex={currentIndex}
        animationKey={animationKey}
        isPlaying={isPlaying}
        phase={phase}
      />

      {/* アバター (平常/ハイライトのみ) */}
      {showAvatars && (
        <>
          <div className={`absolute bottom-[13%] left-4 flex flex-col items-center transition-all duration-300 z-40 ${currentScript?.speaker === 'A' ? 'avatar-talking' : 'scale-90 opacity-40'}`}>
            <div
              className="w-[46px] h-[46px] rounded-full border-2 flex items-center justify-center bg-zinc-900 relative overflow-hidden"
              style={{
                borderColor: currentScript?.speaker === 'A' ? '#f97316' : '#52525b',
                boxShadow: currentScript?.speaker === 'A' ? '0 0 16px rgba(249,115,22,0.6)' : '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <span className="text-[22px] leading-none drop-shadow-md z-10">{currentEmojiA}</span>
            </div>
          </div>

          <div className={`absolute bottom-[13%] right-[14px] flex flex-col items-center transition-all duration-300 z-40 ${currentScript?.speaker === 'B' ? 'avatar-talking' : 'scale-90 opacity-40'}`}>
            <div
              className="w-[46px] h-[46px] rounded-full border-2 flex items-center justify-center bg-zinc-900 relative overflow-hidden"
              style={{
                borderColor: currentScript?.speaker === 'B' ? '#0ea5e9' : '#52525b',
                boxShadow: currentScript?.speaker === 'B' ? '0 0 16px rgba(14,165,233,0.6)' : '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <span className="text-[22px] leading-none drop-shadow-md z-10">{currentEmojiB}</span>
            </div>
          </div>
        </>
      )}

      {/* テロップ (吹き出し) */}
      {showTelop && (
        <div
          className={`absolute left-0 right-0 flex flex-col z-30 pointer-events-none px-4 ${telopAlignClass}`}
          style={{ bottom: phase === 'highlight' ? '20%' : '19%' }}
        >
          <div key={currentIndex} className={`bubble-wrapper ${telopBubbleSpeakerClass}`}>
            <div
              className="rounded-2xl px-4 py-2.5 border-2 relative bubble-bg"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                maxWidth: 210,
                borderColor: currentScript?.speaker === 'A' ? 'rgba(249,115,22,0.85)' : currentScript?.speaker === 'B' ? 'rgba(14,165,233,0.85)' : 'rgba(255,255,255,0.15)',
                boxShadow: currentScript?.speaker === 'A'
                  ? '0 4px 16px rgba(249,115,22,0.35), 0 0 24px rgba(249,115,22,0.15)'
                  : currentScript?.speaker === 'B'
                    ? '0 4px 16px rgba(14,165,233,0.35), 0 0 24px rgba(14,165,233,0.15)'
                    : '0 4px 16px rgba(0,0,0,0.6)'
              }}
            >
              <div
                className="font-black text-center tracking-tight leading-[1.2]"
                style={{
                  fontSize: TELOP_SIZE_PX[textSize],
                  color: currentScript?.speaker === 'B' ? '#fde047' : '#fff',
                  textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 6px 14px rgba(0,0,0,1)'
                }}
              >
                {renderFormattedText(currentScript?.text, false, projectData.presentationMode === 'dialogue' ? currentScript?.speaker : null)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* フッター */}
      {!isRecordingMode && (
        <>
          <div className="absolute bottom-2 right-3 text-[8px] text-zinc-500 font-bold z-40 tracking-widest pointer-events-none">
            NPB＋・スポーツナビ
          </div>
          <div className="h-1 flex z-30 absolute bottom-0 w-full bg-zinc-900/80">
            <div
              className={`h-full ${themeClass.bg} transition-all duration-300 ease-linear`}
              style={{
                boxShadow: `0 0 10px ${themeClass.glow}`,
                width: `${((currentIndex) / (scripts.length - 1 || 1)) * 100}%`
              }}
            ></div>
          </div>
        </>
      )}
    </div>
  );
}

function renderHookStat(projectData, key, label) {
  const v = projectData?.mainPlayer?.stats?.[key] || '-';
  return (
    <div className="flex flex-col items-center leading-none gap-1">
      <span className="text-white font-mono text-[22px] font-black tracking-tight" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>{v}</span>
      <span className="text-orange-500 text-[10px] font-black tracking-widest">{label}</span>
    </div>
  );
}
