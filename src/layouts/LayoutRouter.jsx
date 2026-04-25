/**
 * layoutType に応じて適切なレイアウトコンポーネントを呼び分けるルータ
 *
 * 優先順位:
 *   1. currentScript.layoutType (script単位の切替指示)
 *   2. projectData.layoutType    (動画全体のデフォルト)
 *   3. radar_compare             (フォールバック)
 *
 * 切替時はフェードアニメで視聴体験を滑らかに保つ
 */

import React, { useEffect, useState, useRef } from 'react';
import { RadarCompareLayout } from './RadarCompareLayout.jsx';
import { TimelineLayout } from './TimelineLayout.jsx';
import { LuckDashboardLayout } from './LuckDashboardLayout.jsx';
import { SprayChartLayout } from './SprayChartLayout.jsx';
import { PitchHeatmapLayout } from './PitchHeatmapLayout.jsx';
import { VersusCardLayout } from './VersusCardLayout.jsx';
import { PitchArsenalLayout } from './PitchArsenalLayout.jsx';
import { TeamContextLayout } from './TeamContextLayout.jsx';
import { RankingLayout } from './RankingLayout.jsx';

const LAYOUT_COMPONENTS = {
  radar_compare: RadarCompareLayout,
  timeline: TimelineLayout,
  luck_dashboard: LuckDashboardLayout,
  spray_chart: SprayChartLayout,
  pitch_heatmap: PitchHeatmapLayout,
  versus_card: VersusCardLayout,
  pitch_arsenal: PitchArsenalLayout,
  team_context: TeamContextLayout,
  ranking: RankingLayout,
};

export function LayoutRouter(props) {
  // script 優先 → projectData → fallback
  const scriptLayout = props.currentScript?.layoutType;
  const projectLayout = props.projectData?.layoutType;
  const desiredLayout = scriptLayout || projectLayout || 'radar_compare';

  // フェード切替: 表示中のlayoutTypeをstateで管理
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

  return (
    <div className={`layout-fade-wrap ${fadeState === 'out' ? 'fade-out' : 'fade-in'}`}>
      <Layout {...props} />
    </div>
  );
}
