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

import React, { useMemo, useState, useEffect } from 'react';
import { LayoutRouter } from '../layouts/LayoutRouter.jsx';
import { renderFormattedText } from '../lib/textRender.jsx';
import { Silhouette } from './Silhouettes.jsx';
import { HookMediaOverlay, getHookMedia } from './HookMediaOverlay.jsx';
import { formatStat } from '../lib/statFormat';
import { getTeamPreset } from '../lib/config';

function getPhase(currentScript, currentIndex, scripts, projectData) {
  if (!currentScript) return 'normal';
  if (currentScript.isCatchy) return 'hook';
  const total = scripts?.length || 0;
  // ★v5.18.0★ smartLoop=true ならアウトロをスキップ (Gemini提言: 無限ループ)
  // 末尾→冒頭にシームレス遷移するため、最後の2つもhighlight/normalのまま
  if (!projectData?.smartLoop && total && currentIndex >= total - 2) return 'outro';
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

// ★v5.19.6★ テロップ吹き出し — 毎マウント時に異なる entrance アニメを選んで「紙芝居からの脱却」
// 8 種類の entrance アニメを順繰り (id ベース) + 微小な strut アニメ (常時微振動) で生命感を
const TELOP_ENTRANCE_ANIMS = [
  'telopBounceIn',     // 下から弾む
  'telopSlideRight',   // 左から滑る
  'telopSlideLeft',    // 右から滑る
  'telopZoomPop',      // ズームポップ
  'telopRotateIn',     // 回転インとともに
  'telopFlipDown',     // 上から落ちて戻る
  'telopShakeIn',      // 振動して登場
  'telopElasticIn',    // 弾性的にスケール
];
// ★v5.19.7★ テロップ文字単位アニメ — 1文字ずつ順次フェードイン+スケール
// 紙芝居感の解消。発言中も文字が躍動する。
function TelopBubble({ speaker, text, textSize, kind }) {
  // text のハッシュで entrance アニメを決定 (毎シーンで違うアニメに、再現性あり)
  const animIdx = React.useMemo(() => {
    const s = String(text || '') + (kind || '') + (speaker || '');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h) % TELOP_ENTRANCE_ANIMS.length;
  }, [text, kind, speaker]);
  const animName = TELOP_ENTRANCE_ANIMS[animIdx];
  const bubbleAnim = `${animName} 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both, telopStrut 4s ease-in-out 1.2s infinite`;

  return (
    <div
      className="telop-bg"
      data-speaker={(speaker || 'A').toLowerCase()}
      style={{ animation: bubbleAnim }}
    >
      <div className={`telop-normal ${speaker === 'B' ? 'b' : ''} size-${textSize} telop-charwise`}>
        {/* ★v5.19.7★ 文字単位アニメで紙芝居から脱却 */}
        <CharwiseText text={text} speaker={speaker} />
      </div>
    </div>
  );
}

// ★v5.19.9★ 文字単位アニメ展開で例外が起きても真っ白にならない安全網
class CharwiseSafeBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(_err) { return { hasError: true }; }
  componentDidCatch(err, info) { console.warn('[Telop] charwise レンダ失敗、フォールバック:', err); }
  render() {
    if (this.state.hasError) {
      // フォールバック: 装飾無しの素のテキスト
      return <span>{this.props.fallback}</span>;
    }
    return this.props.children;
  }
}

// 1文字ずつ表示するコンポーネント (絵文字・em タグ対応)
function CharwiseText({ text, speaker }) {
  if (!text) return null;
  const formatted = renderFormattedText(text, false, speaker);
  return (
    <CharwiseSafeBoundary fallback={text}>
      <CharwiseWalker node={formatted} startIndex={0} />
    </CharwiseSafeBoundary>
  );
}

// React node tree を再帰的に walk して、文字レベルで span に分解
// ★v5.19.9 修正★ <br />, Fragment, void 要素の cloneElement エラーで真っ白になっていたバグ
function CharwiseWalker({ node, startIndex = 0 }) {
  if (node == null || typeof node === 'boolean') return null;
  // 文字列 → 1文字ずつ span に
  if (typeof node === 'string' || typeof node === 'number') {
    const str = String(node);
    return (
      <>
        {Array.from(str).map((ch, i) => (
          <span
            key={`c-${i}`}
            className="telop-char"
            style={{ animationDelay: `${(startIndex + i) * 0.025}s` }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </>
    );
  }
  // 配列 → 各要素を再帰
  if (Array.isArray(node)) {
    let consumed = 0;
    return (
      <>
        {node.map((child, idx) => {
          const elem = <CharwiseWalker key={idx} node={child} startIndex={startIndex + consumed} />;
          consumed += countChars(child);
          return elem;
        })}
      </>
    );
  }
  if (React.isValidElement(node)) {
    // ★ void 要素 (<br/>, <hr/>, <img/> 等) は children を持てないのでそのまま返す
    // ★ Fragment は cloneElement で props を保持できないので、children だけ walk して新しい Fragment にする
    const VOID_ELEMENTS = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    if (typeof node.type === 'string' && VOID_ELEMENTS.includes(node.type)) {
      return node;
    }
    if (node.type === React.Fragment) {
      return (
        <React.Fragment>
          <CharwiseWalker node={node.props?.children} startIndex={startIndex} />
        </React.Fragment>
      );
    }
    // 通常の React element → children を walk して props を維持
    const children = node.props?.children;
    if (children == null) return node;  // children なしの要素はそのまま
    return React.cloneElement(node, {}, <CharwiseWalker node={children} startIndex={startIndex} />);
  }
  return null;
}

function countChars(node) {
  if (node == null || typeof node === 'boolean') return 0;
  if (typeof node === 'string' || typeof node === 'number') return String(node).length;
  if (Array.isArray(node)) return node.reduce((s, c) => s + countChars(c), 0);
  if (React.isValidElement(node)) return countChars(node.props?.children);
  return 0;
}

// ★v5.20.13★ #f97316 のような hex を rgba に変換 (CSS 変数の glow 計算用)
function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(255,140,26,${alpha})`;
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return `rgba(255,140,26,${alpha})`;
  const [r, g, b] = m.map(h => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
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
  const phase = getPhase(currentScript, currentIndex, scripts, projectData);
  const hookAnim = getHookAnim(projectData);
  const textSize = resolveTextSize(currentScript);
  const estDuration = useMemo(() => estimateDuration(scripts), [scripts]);

  // ★v5.19.0★ Hook メディア (画像/動画) のロード
  const [hookMedia, setHookMedia] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getHookMedia().then(m => {
      if (!cancelled && m?.blob) {
        setHookMedia({ url: URL.createObjectURL(m.blob), type: m.type });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  // ★v5.19.7★ aspectRatio 対応 — projectData.aspectRatio で 9:16 / 16:9 / 1:1 切替
  const aspectRatio = projectData?.aspectRatio || '9:16';
  const isLandscape = aspectRatio === '16:9';
  const isSquare1to1 = aspectRatio === '1:1';

  const effectiveSquare = isSquareMode || isRecordingMode || isSquare1to1;
  const effectiveShowSafe = showSafeZone && !isRecordingMode;

  const phoneClasses = [
    'phone',
    effectiveSquare ? 'square' : '',
    isLandscape ? 'landscape' : '',
    isRecordingMode ? 'record-mode' : '',
    isFullscreenMode ? 'fullscreen' : '',
  ].filter(Boolean).join(' ');

  const arRatio = isLandscape ? '16/9' : isSquare1to1 ? '1/1' : '9/16';
  // ★v5.20.13★ チームプリセットの色を CSS変数 --p に注入
  // teamPreset='custom' or 未設定 → デフォルト (オレンジ) を使う
  const teamPreset = getTeamPreset(projectData?.teamPreset || 'npb_giants');
  const teamCssVars = teamPreset.id === 'custom' ? {} : {
    '--p': teamPreset.primary,
    '--p-glow': hexToRgba(teamPreset.primary, 0.85),
    '--p-glow-soft': hexToRgba(teamPreset.primary, 0.4),
    '--p-bright': teamPreset.textColor,
  };
  const phoneStyle = isFullscreenMode ? {
    width: isLandscape ? '95vw' : 'auto',
    height: isLandscape ? 'auto' : '95vh',
    maxHeight: '95vh',
    maxWidth: isLandscape ? '95vw' : undefined,
    aspectRatio: arRatio,
    ...teamCssVars,
  } : {
    aspectRatio: arRatio,
    ...teamCssVars,
  };

  // 現在フェーズのクラス (data-p + anim-pop/shake)
  const phaseClassMap = {
    hook: `phase phase-a active anim-${hookAnim}`,
    normal: 'phase active',
    highlight: 'phase active',
    outro: 'phase phase-d active',
  };

  return (
    <div className={phoneClasses}
         style={phoneStyle}
         id="phone-root"
         data-scene-preset={currentScript?.scenePreset || projectData?.defaultScenePreset || 'default'}
         key={`phone-${animationKey}`}>

      {/* ★v5.19.0★ 浮遊ボケ光パーティクル — 常にぬるっと動いて視覚退屈を防ぐ */}
      <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden" aria-hidden="true">
        {[
          { x: 30, y: -80, s: 0.6, d: 12, l: 25, t: 15, sz: 6, c: 'rgba(249,115,22,0.15)' },
          { x: -40, y: -60, s: 0.4, d: 18, l: 70, t: 40, sz: 4, c: 'rgba(56,189,248,0.12)' },
          { x: 50, y: -100, s: 0.3, d: 15, l: 15, t: 60, sz: 8, c: 'rgba(251,113,133,0.10)' },
          { x: -30, y: -50, s: 0.7, d: 20, l: 80, t: 25, sz: 5, c: 'rgba(99,102,241,0.12)' },
          { x: 20, y: -70, s: 0.5, d: 14, l: 50, t: 75, sz: 7, c: 'rgba(249,115,22,0.10)' },
          { x: -50, y: -90, s: 0.35, d: 22, l: 35, t: 50, sz: 3, c: 'rgba(56,189,248,0.08)' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.l}%`,
              top: `${p.t}%`,
              width: p.sz,
              height: p.sz,
              background: p.c,
              boxShadow: `0 0 ${p.sz * 3}px ${p.c}`,
              '--fx': `${p.x}px`,
              '--fy': `${p.y}px`,
              '--fs': String(p.s),
              animation: `floatParticle ${p.d}s ease-in-out infinite`,
              animationDelay: `${i * 2.3}s`,
            }}
          />
        ))}
      </div>

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
          {/* ★v5.18.0★ Gemini提言: 冒頭0.5秒フラッシュ — 視聴者の指を止めるため
              key を毎ループ更新して再生のたびに発火 */}
          <div className="hook-flash-overlay" key={`flash-${animationKey}-${currentIndex}`} />

          {/* ★v5.20★ ユーザーアップロード画像/動画インサート (hook のみ)
              isVisible だけで描画判定、phase が hook のあいだ表示し続ける */}
          {hookMedia && (
            <HookMediaOverlay
              mediaUrl={hookMedia.url}
              mediaType={hookMedia.type}
              pattern={projectData?.hookMediaPattern || 'flash'}
              isVisible={phase === 'hook'}
            />
          )}

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
                <div className="pos">{teamPreset.league === 'NPB' && teamPreset.label === '巨人' ? '読売ジャイアンツ' : `${teamPreset.league} / ${teamPreset.label}`}</div>
                <div className="name">{projectData.mainPlayer?.name || teamPreset.label}</div>
              </div>
            ) : (
              <>
                <div className="num">{projectData.mainPlayer?.number || ''}</div>
                <div className="info">
                  <div className="pos">{teamPreset.league || 'NPB'} / {teamPreset.label || '巨人'}</div>
                  <div className="name">{projectData.mainPlayer?.name || ''}</div>
                </div>
              </>
            )}
          </div>
          <div className="hook-telop-wrap">
            <div
              className={`telop-hook ${getHookTextClass(currentScript?.text)}`}
              style={projectData?.hookFontScale ? { fontSize: `calc(46px * ${projectData.hookFontScale})` } : undefined}
            >
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

          {/* テロップ
              ★v5.19.6★ 動かない問題の真因対策 — class + style 両方つけ、アニメ名は CSS 統一、
              key は currentScript.id (確実にユニーク) で完全 remount */}
          {phase === 'normal' && (
            <div className="telop-wrap-normal" key={`telop-n-${currentIndex}`}>
              <TelopBubble
                speaker={currentScript?.speaker}
                text={currentScript?.text}
                textSize={textSize}
                kind="normal"
              />
            </div>
          )}
          {phase === 'highlight' && (
            <div className="telop-wrap-hl" key={`telop-h-${currentIndex}`}>
              <TelopBubble
                speaker={currentScript?.speaker}
                text={currentScript?.text}
                textSize={textSize}
                kind="hl"
              />
            </div>
          )}

          {/* アウトロのテロップ */}
          {phase === 'outro' && currentScript?.text && (
            <div className="telop-wrap-outro" key={`telop-o-${currentIndex}`}>
              <TelopBubble
                speaker={currentScript?.speaker}
                text={currentScript?.text}
                textSize={textSize}
                kind="outro"
              />
            </div>
          )}

          {/* アバター (平常・ハイライトのみ) — 数原(A) / もえか(B) のラベル付き */}
          {(phase === 'normal' || phase === 'highlight') && (
            <>
              <div
                className={`avatar-hl a ${currentScript?.speaker === 'A' ? 'active' : 'passive'}`}
                data-anim={currentScript?.speaker === 'A' ? (currentScript?.animation || getAnimFromEmoji(currentEmojiA)) : undefined}
                key={`avatar-a-${currentIndex}`}
              >
                <div className="circle"><span className="emoji">{currentEmojiA}</span></div>
                <div className="avatar-name">数原</div>
              </div>
              <div
                className={`avatar-hl b ${currentScript?.speaker === 'B' ? 'active' : 'passive'}`}
                data-anim={currentScript?.speaker === 'B' ? (currentScript?.animation || getAnimFromEmoji(currentEmojiB)) : undefined}
                key={`avatar-b-${currentIndex}`}
              >
                <div className="circle"><span className="emoji">{currentEmojiB}</span></div>
                <div className="avatar-name">もえか</div>
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
  // ★v5.20★ 4行/5行/6行+ で段階的にフォントを小さく
  if (lines >= 6) return 'lines-6';
  if (lines >= 5) return 'lines-5';
  if (lines >= 4) return 'lines-4';
  return '';
}

function renderHookStatCell(projectData, key, label) {
  const raw = projectData?.mainPlayer?.stats?.[key];
  // ★v5.19.7★ 0 / null / undefined → '-'、0始まり小数 → '.xxx'
  const formatted = formatStat(raw,
    ['avg', 'ops', 'era', 'whip', 'winRate'].includes(key) ? 'rate' : 'auto'
  );
  return (
    <div className="cell" key={key}>
      <span className="v">{formatted}</span>
      <span className="l">{label}</span>
    </div>
  );
}

function renderHookStatsCells(projectData) {
  // ★v5.19.7★ projectData.hookStats でカスタマイズ可能 — 例: [{key:'avg', label:'打率'}, ...]
  const customCells = Array.isArray(projectData?.hookStats) ? projectData.hookStats : null;
  if (customCells && customCells.length > 0) {
    return (
      <>
        {customCells.slice(0, 4).map(cell => (
          renderHookStatCell(projectData, cell.key, cell.label)
        ))}
      </>
    );
  }

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
