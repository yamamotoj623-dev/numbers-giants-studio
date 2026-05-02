/**
 * 共通ハイライトカード - 全レイアウトで使用可能
 *
 * currentScript.highlight で指定された comparison を大カードで深掘り表示
 * レーダー以外のレイアウトでも画面中央にどーんと出す
 *
 * ★v5.19.6★ スコープ対応:
 *   comparison.variants[] に複数スコープ (例: 通季 / 対左 / 対右 / vs他選手) を持たせ、
 *   currentScript.highlightScope で表示する variant を切り替え。
 *   旧来の comp.valMain/valSub も引き続きデフォルト variant として動作。
 *
 * RadarCompareLayout の HighlightView と同じスタイルを使用 (highlight-card CSS)
 */

import React from 'react';
import { isEnglishMetric } from '../lib/metricUtils';

/**
 * comparison から表示用 variant を解決
 * @param {object} comp - comparison オブジェクト
 * @param {string} scopeId - currentScript.highlightScope の値 ('overall' | 'vs_left' | 'vs_right' | 'last_year' | 'vs_player_xxx' 等)
 * @returns {{ valMain, valSub, mainLabel, subLabel, winner, scopeLabel }}
 */
function resolveVariant(comp, scopeId) {
  // 新形式: variants[] 配列を持つ場合
  if (Array.isArray(comp?.variants) && comp.variants.length > 0) {
    const target = (scopeId && comp.variants.find(v => v.id === scopeId)) || comp.variants[0];
    return {
      valMain:    target.valMain,
      valSub:     target.valSub,
      mainLabel:  target.mainLabel,
      subLabel:   target.subLabel,
      winner:     target.winner,
      scopeLabel: target.label,  // 「対左投手」「今季 vs 昨季」等
    };
  }
  // 旧形式: comp 直下の valMain/valSub
  return {
    valMain:    comp.valMain,
    valSub:     comp.valSub,
    mainLabel:  comp.mainLabel,
    subLabel:   comp.subLabel,
    winner:     comp.winner,
    scopeLabel: null,
  };
}

export function HighlightCard({ comp, projectData, currentScript }) {
  if (!comp) return null;

  const variant = resolveVariant(comp, currentScript?.highlightScope);

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
          {/* ★v5.19.6★ スコープラベル (例: 対左投手 / 今季vs昨季) を併記 */}
          {variant.scopeLabel && (
            <span className="ml-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
              {variant.scopeLabel}
            </span>
          )}
        </div>
      </div>

      {/* 計算式 (英語指標のみ) */}
      {showKanaFormula && comp.formula && (
        <div className="hl-formula-compact">
          <span className="eq-label">式</span>
          <span className="eq-text">{formatFormula(comp.formula)}</span>
        </div>
      )}

      {/* 値 vs 値 (★v5.19.6★ scope に応じた variant を表示) */}
      <div className="hl-values">
        <div className={`hl-val-main ${variant.winner === 'main' ? 'winner' : 'loser'}`}>
          <div className="num">{variant.valMain}{comp.unit || ''}</div>
          <div className="tag">{variant.mainLabel || projectData.mainPlayer?.label || '今季'}</div>
        </div>
        <div className="hl-vs">vs</div>
        <div className={`hl-val-sub ${variant.winner === 'sub' ? 'winner' : 'loser'}`}>
          <div className="num">{variant.valSub}{comp.unit || ''}</div>
          <div className="tag">{variant.subLabel || projectData.subPlayer?.label || '昨季'}</div>
        </div>
      </div>

      {/* WHY + 基準 */}
      <div className="hl-context-row">
        {comp.desc && (
          <div className="hl-why-compact">
            <div className="label">指標の意味</div>
            <div className="text">{comp.desc}</div>
          </div>
        )}
        {comp.criteria && cleanCriteria(comp.criteria) && (
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

// ★v5.20★ criteria 表示の堅牢化 — AI が「高いほどいい」等を混入させても自然に表示
//   1. 文字列 "優秀: .300以上"           → ".300以上"
//   2. 文字列 "高いほどいい"               → '' (空)
//   3. 文字列 ".300以上"                   → ".300以上"
//   4. オブジェクト {threshold,direction}  → ".300以上" / "2.50以下"
function cleanCriteria(c) {
  if (!c) return '';
  // オブジェクト形式
  if (typeof c === 'object') {
    if (c.threshold) {
      const dir = String(c.direction || '').toLowerCase();
      const arrow = (dir.includes('lower') || dir.includes('low')) ? '以下' : '以上';
      return `${c.threshold}${arrow}`;
    }
    return '';
  }
  const s = String(c).trim();
  // 「高い/低い ほど良い/いい」だけの説明文は捨てる
  if (/^(高|低)[いく]?(ほど)?(良い|いい|優秀|有利|好)$/.test(s)) return '';
  // 「: 」区切りなら後半を取る
  const colon = s.split(/[:::]\s*/);
  if (colon.length >= 2) {
    const after = colon.slice(1).join(': ').trim();
    return /(以上|以下|以内|超|未満)/.test(after) ? after : (after.length <= 12 ? after : '');
  }
  // 数値基準が含まれていればそのまま
  if (/(以上|以下|以内|超|未満)/.test(s)) return s;
  // それ以外の長文説明は捨てる
  return '';
}

// レイアウト用ヘルパー: phase==='highlight' で comparison 見つかったら HighlightCard 返す
export function useHighlightComp(projectData, currentScript) {
  const highlightId = currentScript?.highlight || null;
  return highlightId
    ? projectData.comparisons?.find(c => c.id === highlightId)
    : null;
}
