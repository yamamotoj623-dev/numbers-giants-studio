/**
 * RadarCompareLayout v5.0.0 UI確定版
 * デモHTML v15 と1対1対応
 *
 * - hook フェーズは PreviewFrame が処理 (ここは null)
 * - normal: radar-outer > radar-svg-box + radar-legend + stats-table
 * - highlight: hl-radar-outer + highlight-card
 * - outro: OutroPanel (別コンポーネント)
 */

import React from 'react';
import { RadarChartSVG } from '../components/RadarChartSVG.jsx';
import { OutroPanel } from '../components/OutroPanel.jsx';

export function RadarCompareLayout({ projectData, currentScript, currentIndex, phase = 'normal', animationKey, isPlaying }) {
  if (phase === 'hook') return null;
  if (phase === 'outro') return <OutroPanel projectData={projectData} />;

  const highlightId = currentScript?.highlight || null;
  const highlightComp = highlightId
    ? projectData.comparisons?.find(c => c.id === highlightId)
    : null;

  if (phase === 'highlight' && highlightComp) {
    return (
      <HighlightView
        projectData={projectData}
        comp={highlightComp}
      />
    );
  }

  return <NormalView projectData={projectData} />;
}

// ==================== Normal ====================
function NormalView({ projectData }) {
  return (
    <div className="radar-outer">
      <div className="radar-svg-box">
        <RadarChartSVG
          stats={projectData.radarStats}
          highlight={null}
          comparisons={projectData.comparisons}
          compact={false}
        />
      </div>

      <div className="radar-legend">
        <div className="radar-legend-item main">
          <span className="swatch"></span>
          <div className="label">
            <span className="name">{projectData.mainPlayer?.name || ''}</span>
            <span className="year">{projectData.mainPlayer?.label || ''}</span>
          </div>
        </div>
        <div className="radar-legend-item sub">
          <span className="swatch"></span>
          <div className="label">
            <span className="name">{projectData.subPlayer?.name || ''}</span>
            <span className="year">{projectData.subPlayer?.label || ''}</span>
          </div>
        </div>
      </div>

      <StatsTable projectData={projectData} />
    </div>
  );
}

function StatsTable({ projectData }) {
  const isBatter = projectData.playerType === 'batter';
  const m = projectData.mainPlayer?.stats || {};
  const s = projectData.subPlayer?.stats || {};

  const rows = isBatter ? [
    { key: 'pa', label: '打席' },
    { key: 'ab', label: '打数' },
    { key: 'avg', label: '打率' },
    { key: 'ops', label: 'OPS' },
    { key: 'hr', label: '本塁打' },
    { key: 'rbi', label: '打点' },
  ] : [
    { key: 'g', label: '登板' },
    { key: 'ip', label: '投球回' },
    { key: 'era', label: '防御率' },
    { key: 'whip', label: 'WHIP' },
    { key: 'so', label: '奪三振' },
    { key: 'win', label: '勝利' },
  ];

  return (
    <div className="stats-table">
      <div className="stats-grid-compact">
        {rows.map(r => (
          <div key={r.key} className="stat-cell">
            <span className="lbl">{r.label}</span>
            <div className="vals">
              <span className="main-val">{m[r.key] ?? '-'}</span>
              <span className="sub-val">{s[r.key] ?? '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Highlight ====================
function HighlightView({ projectData, comp }) {
  // comparisonsとradarStatsのキー整合を取る: radarLabelで判定
  const highlightId = comp.id;

  return (
    <>
      {/* 小レーダー */}
      <div className="hl-radar-outer">
        <div className="hl-radar-svg-box">
          <RadarChartSVG
            stats={projectData.radarStats}
            highlight={highlightId}
            comparisons={projectData.comparisons}
            compact={true}
          />
        </div>
      </div>

      {/* ハイライトカード */}
      <div className="highlight-card">
        {/* 1行統合ヘッダー */}
        <div className="hl-header-compact">
          <span className="hl-radar-badge">📊 {comp.radarMatch || comp.label}</span>
          <span className="hl-label-compact">{comp.label}</span>
          <span className="hl-kana-compact">{comp.kana}</span>
        </div>

        {/* 計算式 */}
        {comp.formula && (
          <div className="hl-formula-compact">
            <span className="eq-label">式</span>
            <span className="eq-text">{formatFormula(comp.formula)}</span>
          </div>
        )}

        {/* 値 vs 値 */}
        <div className="hl-values">
          <div className={`hl-val-main ${comp.winner === 'main' ? 'winner' : 'loser'}`}>
            <div className="num">{comp.valMain}{comp.unit || ''}</div>
            <div className="tag">{projectData.mainPlayer?.label || '今季'}</div>
          </div>
          <div className="hl-vs">vs</div>
          <div className={`hl-val-sub ${comp.winner === 'sub' ? 'winner' : 'loser'}`}>
            <div className="num">{comp.valSub}{comp.unit || ''}</div>
            <div className="tag">{projectData.subPlayer?.label || '昨季'}</div>
          </div>
        </div>

        {/* WHY + 基準 */}
        <div className="hl-context-row">
          {comp.desc && (
            <div className="hl-why-compact">
              <div className="label">WHY</div>
              <div className="text">{renderWhyText(comp.desc)}</div>
            </div>
          )}
          {comp.criteria && (
            <div className="hl-criteria-side">
              <div className="label">優秀</div>
              <div className="value">{cleanCriteria(comp.criteria)}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// フォーミュラ記号変換
function formatFormula(f) {
  if (!f) return null;
  const parts = f.split(/([−\-+×÷\/])/);
  return parts.map((p, i) =>
    /^[−\-+×÷\/]$/.test(p)
      ? <span key={i} className="op">{p === '-' ? '−' : p}</span>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

// WHY内の<strong>対応 (プレーンテキストから太字抽出)
function renderWhyText(text) {
  if (!text) return null;
  // 「xx力」「xx率」など特徴的な単語を太字化できるがデフォルトはそのまま
  return text;
}

// "優秀: .080+" → ".080+"
function cleanCriteria(c) {
  if (!c) return '';
  return c.replace(/^[^:：]*[:：]\s*/, '').trim();
}
