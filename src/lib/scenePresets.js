/**
 * scenePresets.js (★v5.19.6 新規★)
 *
 * 1シーン全体の演出を束ねたプリセット。
 * 「紙芝居からの脱却 = 似たような動画にならない仕組み」の核。
 *
 * script.scenePreset で指定。例:
 *   { id: 5, scenePreset: 'cinematic_zoom', text: '...' }
 *
 * これにより同じレイアウト+データでも、シーンごとに見え方が変わる。
 *
 * 各プリセットは以下のCSSクラスを scope-class として PreviewFrame の root に付与:
 *   data-scene-preset="{id}"
 * GlobalStyles.jsx の対応する [data-scene-preset="..."] ルールが効く。
 */

export const SCENE_PRESETS = {
  // 標準 (これまでと同じ)
  default: {
    label: '🎬 default',
    description: '標準演出',
  },
  // 映画的ズーム — 全体が緩やかにズーム+ヴィネット
  cinematic_zoom: {
    label: '🎥 cinematic_zoom',
    description: '映画的ズーム+周辺暗減 (重要発言・印象的シーン向け)',
  },
  // ネオン強調 — ネオングロー+RGB分離
  neon_burst: {
    label: '💫 neon_burst',
    description: 'ネオングロー+色収差 (新指標発表・サプライズ)',
  },
  // モノクロドラマ — 彩度低+1点強調色
  mono_drama: {
    label: '🎞 mono_drama',
    description: 'モノクロ+部分色強調 (悲報・ドラマチック)',
  },
  // パステル — 柔らかく明るく
  pastel_pop: {
    label: '🌸 pastel_pop',
    description: 'パステル明度UP (朗報・新人紹介)',
  },
  // 黒板風 — 解説モード
  blackboard: {
    label: '📚 blackboard',
    description: '黒板風スクラッチ (解説・分析)',
  },
  // 速報風 — 赤ボーダーフラッシュ
  breaking_news: {
    label: '🚨 breaking_news',
    description: '赤ボーダー+速報ベル (衝撃データ・速報)',
  },
};
