/**
 * layoutType に応じて適切なレイアウトコンポーネントを呼び分けるルータ
 * 未対応のlayoutTypeは radar_compare にフォールバック（v4.24.0互換）
 */

import React from 'react';
import { RadarCompareLayout } from './RadarCompareLayout.jsx';
import { TimelineLayout } from './TimelineLayout.jsx';
import { LuckDashboardLayout } from './LuckDashboardLayout.jsx';
import { SprayChartLayout } from './SprayChartLayout.jsx';
import { PitchHeatmapLayout } from './PitchHeatmapLayout.jsx';
import { VersusCardLayout } from './VersusCardLayout.jsx';
import { PitchArsenalLayout } from './PitchArsenalLayout.jsx';
import { TeamContextLayout } from './TeamContextLayout.jsx';

const LAYOUT_COMPONENTS = {
  radar_compare: RadarCompareLayout,
  timeline: TimelineLayout,
  luck_dashboard: LuckDashboardLayout,
  spray_chart: SprayChartLayout,
  pitch_heatmap: PitchHeatmapLayout,
  versus_card: VersusCardLayout,
  pitch_arsenal: PitchArsenalLayout,
  team_context: TeamContextLayout,
};

export function LayoutRouter(props) {
  const layoutType = props.projectData?.layoutType || 'radar_compare';
  const Layout = LAYOUT_COMPONENTS[layoutType] || RadarCompareLayout;
  return <Layout {...props} />;
}
