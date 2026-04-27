/**
 * 共通ハイライトカード - 全レイアウトで使用可能
 *
 * currentScript.highlight で指定された comparison を大カードで深掘り表示
 * レーダー以外のレイアウトでも画面中央にどーんと出す
 *
 * RadarCompareLayout の HighlightView と同じスタイルを使用 (highlight-card CSS)
 */

import React from 'react';
import { isEnglishMetric } from '../lib/metricUtils';

export function HighlightCard({ comp, projectData }) {
  if (!comp) return null;

  // ★v5.15.5★ 英語指標のみ kana/formula 表示 (ユーザー要望)
  const showKanaFormula = isEnglishMetric(comp.label);

  return (
    <div className="highlight-card" key={comp.id}>
      {/* 1行統合ヘッダー */}
      <div className="hl-header-compact">
        <span className="hl-radar-badge">📊 {comp.radarMatch || comp.label}</span>
        <div className="hl-label-group">
          {showKanaFormula && comp.kana && <span className="hl-kana-compact">{comp.kana}</span>}
          <span className="hl-label-compact">{comp.label}</span>
        </div>
      </div>

      {/* 計算式 (英語指標のみ) */}
      {showKanaFormula && comp.formula && (
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
            <div className="label">理由</div>
            <div className="text">{comp.desc}</div>
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
  );
}

function formatFormula(f) {
  if (!f) return null;
  const parts = f.split(/([−\-+×÷\/])/);
  return parts.map((p, i) =>
    /^[−\-+×÷\/]$/.test(p)
      ? <span key={i} className="op">{p === '-' ? '−' : p}</span>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function cleanCriteria(c) {
  if (!c) return '';
  return c.replace(/^[^:：]*[:：]\s*/, '').trim();
}

// レイアウト用ヘルパー: phase==='highlight' で comparison 見つかったら HighlightCard 返す
export function useHighlightComp(projectData, currentScript) {
  const highlightId = currentScript?.highlight || null;
  return highlightId
    ? projectData.comparisons?.find(c => c.id === highlightId)
    : null;
}
