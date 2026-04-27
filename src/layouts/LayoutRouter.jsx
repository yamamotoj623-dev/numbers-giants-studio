/**
 * layoutType に応じて適切なレイアウトコンポーネントを呼び分けるルータ (v2)
 *
 * 8レイアウト体制:
 * - radar_compare:    レーダー比較
 * - timeline:         時系列推移
 * - ranking:          順位表
 * - player_spotlight: 選手スポット
 * - versus_card:      対決カード
 * - team_context:     チーム文脈
 * - pitch_arsenal:    球種パレット
 * - batter_heatmap:   打者ゾーン (旧 pitch_heatmap をリネーム)
 *
 * 削除済み (互換性のため radar_compare へリダイレクト + console警告):
 * - luck_dashboard
 * - spray_chart
 * - pitch_heatmap (→ batter_heatmap へリダイレクト)
 */

import React, { useEffect, useState, useRef } from 'react';
import { RadarCompareLayout } from './RadarCompareLayout.jsx';
import { TimelineLayout } from './TimelineLayout.jsx';
import { VersusCardLayout } from './VersusCardLayout.jsx';
import { PitchArsenalLayout } from './PitchArsenalLayout.jsx';
import { TeamContextLayout } from './TeamContextLayout.jsx';
import { RankingLayout } from './RankingLayout.jsx';
import { PlayerSpotlightLayout } from './PlayerSpotlightLayout.jsx';
import { BatterHeatmapLayout } from './BatterHeatmapLayout.jsx';
import { LayoutErrorBoundary } from '../components/LayoutErrorBoundary.jsx';

const LAYOUT_COMPONENTS = {
  radar_compare: RadarCompareLayout,
  timeline: TimelineLayout,
  versus_card: VersusCardLayout,
  pitch_arsenal: PitchArsenalLayout,
  team_context: TeamContextLayout,
  ranking: RankingLayout,
  player_spotlight: PlayerSpotlightLayout,
  batter_heatmap: BatterHeatmapLayout,
};

// 削除/リネーム対応
const LEGACY_REDIRECT = {
  luck_dashboard: 'radar_compare',  // 削除 → radar へ
  spray_chart: 'radar_compare',     // 削除 → radar へ
  pitch_heatmap: 'batter_heatmap',  // リネーム
};

const LEGACY_WARNED = new Set();

function resolveLayout(layoutType) {
  if (LEGACY_REDIRECT[layoutType]) {
    if (!LEGACY_WARNED.has(layoutType)) {
      console.warn(`[LayoutRouter] レイアウト "${layoutType}" は廃止/リネームされました。"${LEGACY_REDIRECT[layoutType]}" にリダイレクトします。Gemini プロンプトを更新してください。`);
      LEGACY_WARNED.add(layoutType);
    }
    return LEGACY_REDIRECT[layoutType];
  }
  return layoutType;
}

export function LayoutRouter(props) {
  // ★継承ロジック: scriptsを遡って直近の layoutType 指定を探す★
  const scripts = props.projectData?.scripts || [];
  const currentIndex = props.currentIndex ?? 0;
  let scriptLayout = null;
  for (let i = currentIndex; i >= 0; i--) {
    if (scripts[i]?.layoutType) {
      scriptLayout = scripts[i].layoutType;
      break;
    }
  }
  const projectLayout = props.projectData?.layoutType;
  const desiredLayoutRaw = scriptLayout || projectLayout || 'radar_compare';
  const desiredLayout = resolveLayout(desiredLayoutRaw);

  // フェード切替
  const [activeLayout, setActiveLayout] = useState(desiredLayout);
  const [fadeState, setFadeState] = useState('in');
  const prevLayoutRef = useRef(desiredLayout);

  useEffect(() => {
    if (desiredLayout !== prevLayoutRef.current) {
      setFadeState('out');
      const t = setTimeout(() => {
        setActiveLayout(desiredLayout);
        prevLayoutRef.current = desiredLayout;
        setFadeState('in');
      }, 480);
      return () => clearTimeout(t);
    }
  }, [desiredLayout]);

  const Layout = LAYOUT_COMPONENTS[activeLayout] || RadarCompareLayout;

  // ★v5.18.0★ キーフレームアニメ (Gemini提言: 重要発言時のズーム/シェイク)
  //   'zoom'    - グッと寄る
  //   'shake'   - 揺れる
  //   'zoomShake' - ズーム+揺れ (最強)
  //   undefined - 何もしない
  //
  // ★v5.18.1 バグ修正★
  // 旧 (v5.18.0): animKey = `${animClass}-${currentIndex}-${animationKey}` だったため、
  //   currentIndex が変わるたびに wrapper の key が変わり、
  //   zoomBoost 未指定でも子レイアウトが毎回 remount → 全アニメ再発火するバグ。
  // 新 (v5.18.1): zoomBoost 指定がある時だけ key を更新する。
  //   未指定なら固定 key にして、子レイアウトの内部 state / アニメは継続。
  const currentScript = scripts[currentIndex];
  const zoomBoost = currentScript?.zoomBoost;
  const animClass = zoomBoost === 'zoom' ? 'anim-zoom-boost'
                  : zoomBoost === 'shake' ? 'anim-impact-shake'
                  : zoomBoost === 'zoomShake' ? 'anim-zoom-shake'
                  : '';
  // zoomBoost がある script に来た時だけ key 更新 → アニメ発火
  // 無指定なら 'stable' (固定値) で remount を防止
  const animKey = animClass
    ? `${animClass}-${currentIndex}-${props.animationKey || 0}`
    : 'stable';

  return (
    <div
      className={`layout-fade-wrap ${fadeState === 'out' ? 'fade-out' : 'fade-in'} ${animClass}`}
      key={animKey}
    >
      {/* ★Error Boundary でラップ★
          レイアウトコンポーネントが throw してもアプリ全体が真っ白にならないように。
          activeLayout を key にすることで、レイアウト切替時にバウンダリ状態をリセット */}
      <LayoutErrorBoundary key={activeLayout} layoutType={activeLayout}>
        <Layout {...props} />
      </LayoutErrorBoundary>
    </div>
  );
}
