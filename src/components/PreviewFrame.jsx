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
import { Silhouette } from './Silhouettes.jsx';

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

function getHookAnim(projectData) {
  // 明示的な指定があれば優先: 'pop' / 'shake' / 'slide' / 'zoom' / 'fade'
  if (projectData?.hookAnimation) return projectData.hookAnimation;
  // pattern からの自動推測
  const pattern = projectData?.pattern;
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
  showDurationBadge = true,
}) {
  const scripts = projectData?.scripts || [];
  const phase = getPhase(currentScript, currentIndex, scripts);
  const hookAnim = getHookAnim(projectData);
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
      {!isRecordingMode && showDurationBadge && (
        <div className="duration-badge">
          <span className="clock">🎬</span>{estDuration}
        </div>
      )}

      {/* 全phase共通ロゴ (フック以外、フックはhook-headerが代替) */}
      {phase !== 'hook' && (
        <div className="brand-logo-fixed">
          <div className="row">
            <span className="g">G</span>
            <span className="title">数字で見るG党</span>
          </div>
          <span className="sub">Giants Analytics</span>
        </div>
      )}

      {/* ================= フェーズA: フック ================= */}
      {phase === 'hook' && (
        <div className={phaseClassMap.hook} data-p="hook" key={`hook-${animationKey}-${currentIndex}`}>
          <div className="hook-silhouette">
            <Silhouette
              silhouetteType={projectData?.silhouetteType}
              playerType={projectData?.playerType}
            />
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
            {projectData?.playerType === 'team' ? (
              <div className="info">
                <div className="pos">読売ジャイアンツ</div>
                <div className="name">{projectData.mainPlayer?.name || '巨人'}</div>
              </div>
            ) : (
              <>
                <div className="num">{projectData.mainPlayer?.number || ''}</div>
                <div className="info">
                  <div className="pos">NPB / 巨人</div>
                  <div className="name">{projectData.mainPlayer?.name || ''}</div>
                </div>
              </>
            )}
          </div>
          <div className="hook-telop-wrap">
            <div className={`telop-hook ${getHookTextClass(currentScript?.text)}`}>
              {renderHookLines(currentScript?.text)}
            </div>
          </div>
          <div className="hook-stats-big">
            <div className="title">▼ 今季成績</div>
            <div className="hook-stats-grid">
              {renderHookStatsCells(projectData)}
            </div>
          </div>
        </div>
      )}

      {/* ================= フェーズB/C/D: LayoutRouter ================= */}
      {phase !== 'hook' && (
        <div
          className={phaseClassMap[phase]}
          data-p={phase}
          key={`phase-${phase}`}
        >
          {/* 日付 (平常・ハイライトのみ) */}
          {(phase === 'normal' || phase === 'highlight') && (
            <div className="ph-date">{projectData.period || ''}</div>
          )}

          {/* ヘッダー (選手名 or チーム名) */}
          {(phase === 'normal' || phase === 'highlight') && (
            <div className={phase === 'normal' ? 'phase-b-header' : 'phase-c-header'}>
              {projectData?.playerType !== 'team' && (
                <div className="num">{projectData.mainPlayer?.number || ''}</div>
              )}
              <div className="name">{projectData.mainPlayer?.name || ''}</div>
            </div>
          )}

          {/* レイアウト本体 (normal時はkey固定でアニメ発火は初回のみ、
              highlight時は highlight.id ごとに再発火) */}
          <LayoutRouter
            projectData={projectData}
            currentScript={currentScript}
            currentIndex={currentIndex}
            animationKey={animationKey}
            isPlaying={isPlaying}
            phase={phase}
          />

          {/* テロップ (currentIndexでkey更新→id変化のたびにtelopSlideUp発火) */}
          {phase === 'normal' && (
            <div className="telop-wrap-normal" key={`telop-n-${currentScript?.speaker || 'a'}`}>
              <div className="telop-bg" data-speaker={currentScript?.speaker?.toLowerCase() || 'a'}>
                <div
                  className={`telop-normal ${currentScript?.speaker === 'B' ? 'b' : ''} size-${textSize}`}
                  key={`telop-n-inner-${currentIndex}`}
                >
                  {renderFormattedText(currentScript?.text, false, currentScript?.speaker)}
                </div>
              </div>
            </div>
          )}
          {phase === 'highlight' && (
            <div className="telop-wrap-hl" key={`telop-h-${currentScript?.speaker || 'a'}`}>
              <div className="telop-bg" data-speaker={currentScript?.speaker?.toLowerCase() || 'a'}>
                <div
                  className={`telop-normal ${currentScript?.speaker === 'B' ? 'b' : ''} size-${textSize}`}
                  key={`telop-h-inner-${currentIndex}`}
                >
                  {renderFormattedText(currentScript?.text, false, currentScript?.speaker)}
                </div>
              </div>
            </div>
          )}

          {/* アウトロのテロップ */}
          {phase === 'outro' && currentScript?.text && (
            <div className="telop-wrap-outro" key={`telop-o-${currentScript?.speaker || 'a'}`}>
              <div className="telop-bg" data-speaker={currentScript?.speaker?.toLowerCase() || 'a'}>
                <div
                  className={`telop-normal ${currentScript?.speaker === 'B' ? 'b' : ''} size-${textSize}`}
                  key={`telop-o-inner-${currentIndex}`}
                >
                  {renderFormattedText(currentScript?.text, false, currentScript?.speaker)}
                </div>
              </div>
            </div>
          )}

          {/* アバター (平常・ハイライトのみ) */}
          {(phase === 'normal' || phase === 'highlight') && (
            <>
              <div
                className={`avatar-hl a ${currentScript?.speaker === 'A' ? 'active' : 'passive'}`}
                data-anim={currentScript?.speaker === 'A' ? (currentScript?.animation || getAnimFromEmoji(currentEmojiA)) : undefined}
                key={`avatar-a-${currentIndex}`}
              >
                <div className="circle"><span className="emoji">{currentEmojiA}</span></div>
              </div>
              <div
                className={`avatar-hl b ${currentScript?.speaker === 'B' ? 'active' : 'passive'}`}
                data-anim={currentScript?.speaker === 'B' ? (currentScript?.animation || getAnimFromEmoji(currentEmojiB)) : undefined}
                key={`avatar-b-${currentIndex}`}
              >
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

function getHookTextClass(text) {
  if (!text) return '';
  const lines = text.split('\n').length;
  return lines >= 4 ? 'lines-4' : '';
}

function renderHookStatCell(projectData, key, label) {
  const v = projectData?.mainPlayer?.stats?.[key] || '-';
  return (
    <div className="cell" key={key}>
      <span className="v">{v}</span>
      <span className="l">{label}</span>
    </div>
  );
}

function renderHookStatsCells(projectData) {
  const playerType = projectData?.playerType;
  if (playerType === 'pitcher') {
    return (
      <>
        {renderHookStatCell(projectData, 'era', '防御率')}
        {renderHookStatCell(projectData, 'whip', 'WHIP')}
        {renderHookStatCell(projectData, 'so', '奪三振')}
        {renderHookStatCell(projectData, 'win', '勝利')}
      </>
    );
  }
  if (playerType === 'team') {
    // チームテーマ: 順位/勝率/得点/失点 を表示
    return (
      <>
        {renderHookStatCell(projectData, 'rank', '順位')}
        {renderHookStatCell(projectData, 'winRate', '勝率')}
        {renderHookStatCell(projectData, 'runs', '得点')}
        {renderHookStatCell(projectData, 'runsAllowed', '失点')}
      </>
    );
  }
  return (
    <>
      {renderHookStatCell(projectData, 'avg', '打率')}
      {renderHookStatCell(projectData, 'ops', 'OPS')}
      {renderHookStatCell(projectData, 'hr', '本塁打')}
      {renderHookStatCell(projectData, 'rbi', '打点')}
    </>
  );
}

/**
 * emoji からアニメーションタイプを推測
 * (script.animation が明示されてなければこの推測を使う)
 */
function getAnimFromEmoji(emoji) {
  if (!emoji) return null;
  // 衝撃・驚き
  if (/🤯|😱|😨|😲|⚡/.test(emoji)) return 'shock';
  // 疑問・考え込み
  if (/🤔|🧐|💭|🤨/.test(emoji)) return 'think';
  // 喜び・感動
  if (/🤩|😍|🥹|😆|😊|🥰/.test(emoji)) return 'bounce';
  // 否定・困惑
  if (/😵|🙄|😅/.test(emoji)) return 'shake';
  // 納得・賛同
  if (/👍|🎉|✨/.test(emoji)) return 'nod';
  return null; // デフォルト (既存の avatarTalk pulse)
}
