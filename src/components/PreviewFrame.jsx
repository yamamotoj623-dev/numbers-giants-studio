/**
 * v5.0.0 UI確定版 プレビューフレーム
 * デモHTML v15 と1対1対応するReact実装
 *
 * - .phone フレーム (360x640px 固定、9:16)
 * - スクエアモード / 録画モード / フルスクリーンモード対応
 * - 4フェーズ判定 (hook / normal / highlight / outro)
 * - data-p 属性でフェーズを宣言、CSSで切替
 * - data-speaker 属性で吹き出し方向
 */

import React, { useMemo } from 'react';
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
  isSquareMode = false,
  showSafeZone = false,
}) {
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

  const effectiveSquare = isSquareMode || isRecordingMode;
  const effectiveShowSafe = showSafeZone && !isRecordingMode;

  const phoneClasses = [
    'phone',
    effectiveSquare ? 'square' : '',
    isRecordingMode ? 'record-mode' : '',
    isFullscreenMode ? 'fullscreen' : '',
  ].filter(Boolean).join(' ');

  const phoneStyle = isFullscreenMode ? {
    width: 'auto',
    height: '95vh',
    maxHeight: '95vh',
    aspectRatio: effectiveSquare ? '9/16' : '9/16',
  } : {};

  // 現在フェーズのクラス (data-p + anim-pop/shake)
  const phaseClassMap = {
    hook: `phase phase-a active anim-${hookAnim}`,
    normal: 'phase active',
    highlight: 'phase active',
    outro: 'phase phase-d active',
  };

  return (
    <div className={phoneClasses} style={phoneStyle} id="phone-root" key={`phone-${animationKey}`}>

      {/* 動画時間バッジ */}
      {!isRecordingMode && (
        <div className="duration-badge">
          <span className="clock">🎬</span>{estDuration}
        </div>
      )}

      {/* ================= フェーズA: フック ================= */}
      {phase === 'hook' && (
        <div className={phaseClassMap.hook} data-p="hook" key={`hook-${animationKey}-${currentIndex}`}>
          <div className="hook-silhouette">
            <svg viewBox="0 0 200 200">
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
          <div className="hook-header">
            <div className="hook-brand-strong">
              <div className="row">
                <span className="g">G</span>
                <span className="title">数字で見るG党</span>
              </div>
              <span className="sub">Giants Analytics · {new Date().getFullYear().toString().slice(-2)} Season</span>
            </div>
          </div>
          <div className="hook-player-pill">
            <div className="num">{projectData.mainPlayer?.number || ''}</div>
            <div className="info">
              <div className="pos">NPB / 巨人</div>
              <div className="name">{projectData.mainPlayer?.name || ''}</div>
            </div>
          </div>
          <div className="hook-telop-wrap">
            <div className="telop-hook">
              {renderHookLines(currentScript?.text)}
            </div>
          </div>
          <div className="hook-stats-big">
            <div className="title">▼ SEASON STATS</div>
            <div className="hook-stats-grid">
              {renderHookStatCell(projectData, 'avg', 'AVG')}
              {renderHookStatCell(projectData, 'ops', 'OPS')}
              {renderHookStatCell(projectData, 'hr', 'HR')}
              {renderHookStatCell(projectData, 'rbi', 'RBI')}
            </div>
          </div>
        </div>
      )}

      {/* ================= フェーズB/C/D: LayoutRouter ================= */}
      {phase !== 'hook' && (
        <div
          className={phaseClassMap[phase]}
          data-p={phase}
          key={`phase-${phase}-${animationKey}-${currentIndex}`}
        >
          {/* 日付 (平常・ハイライトのみ) */}
          {(phase === 'normal' || phase === 'highlight') && (
            <div className="ph-date">{projectData.period || ''}</div>
          )}

          {/* ヘッダー (選手名) */}
          {(phase === 'normal' || phase === 'highlight') && (
            <div className={phase === 'normal' ? 'phase-b-header' : 'phase-c-header'}>
              <div className="num">{projectData.mainPlayer?.number || ''}</div>
              <div className="name">{projectData.mainPlayer?.name || ''}</div>
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

          {/* テロップ (平常・ハイライトのみ、アウトロはLayout側に内蔵) */}
          {phase === 'normal' && (
            <div className="telop-wrap-normal">
              <div className="telop-bg" data-speaker={currentScript?.speaker?.toLowerCase() || 'a'}>
                <div className={`telop-normal ${currentScript?.speaker === 'B' ? 'b' : ''} size-${textSize}`}>
                  {renderFormattedText(currentScript?.text, false, currentScript?.speaker)}
                </div>
              </div>
            </div>
          )}
          {phase === 'highlight' && (
            <div className="telop-wrap-hl">
              <div className="telop-bg" data-speaker={currentScript?.speaker?.toLowerCase() || 'a'}>
                <div className={`telop-normal ${currentScript?.speaker === 'B' ? 'b' : ''} size-${textSize}`}>
                  {renderFormattedText(currentScript?.text, false, currentScript?.speaker)}
                </div>
              </div>
            </div>
          )}

          {/* アバター (平常・ハイライトのみ) */}
          {(phase === 'normal' || phase === 'highlight') && (
            <>
              <div className={`avatar-hl a ${currentScript?.speaker === 'A' ? 'active' : 'passive'}`}>
                <div className="circle"><span className="emoji">{currentEmojiA}</span></div>
              </div>
              <div className={`avatar-hl b ${currentScript?.speaker === 'B' ? 'active' : 'passive'}`}>
                <div className="circle"><span className="emoji">{currentEmojiB}</span></div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= 共通フッター ================= */}
      {!isRecordingMode && (phase === 'normal' || phase === 'highlight') && (
        <>
          <div className="ph-brand-small">
            <span className="g">G</span>
            <span className="a">ANALYTICS</span>
          </div>
          <div className="source">NPB＋・スポーツナビ</div>
        </>
      )}
      {!isRecordingMode && (
        <div className="progress">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex) / (scripts.length - 1 || 1)) * 100}%` }}
          ></div>
        </div>
      )}

      {/* セーフゾーン (プレビュー時のみ) */}
      {effectiveShowSafe && (
        <>
          <div className="safe-zone-guide top" style={{ display: 'block' }}></div>
          <div className="safe-zone-guide bottom" style={{ display: 'block' }}></div>
          <div className="safe-zone-guide right-actions" style={{ display: 'block' }}></div>
        </>
      )}
    </div>
  );
}

function renderHookLines(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <span key={i} className={`line line-${i + 1}`}>
      {renderFormattedText(line, true, null)}
    </span>
  ));
}

function renderHookStatCell(projectData, key, label) {
  const v = projectData?.mainPlayer?.stats?.[key] || '-';
  return (
    <div className="cell">
      <span className="v">{v}</span>
      <span className="l">{label}</span>
    </div>
  );
}
