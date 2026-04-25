/**
 * LayoutErrorBoundary v5.11.3
 *
 * レイアウトコンポーネントが throw した時に、
 * アプリ全体が真っ白になるのを防ぐ React Error Boundary。
 *
 * 主な落ちパターン:
 * - layoutData の構造が想定外 (Gemini 出力の継承で発生)
 * - layoutData が undefined / null
 * - 数値変換失敗 (NaN が SVG path に混入)
 *
 * エラー時はコンソールに警告を出し、子コンポーネントを非表示にする。
 * (LayoutRouter 側で fallback として radar_compare を表示)
 */

import React from 'react';

export class LayoutErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', layoutType: null };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || String(error),
    };
  }

  componentDidCatch(error, info) {
    console.error(
      `[LayoutErrorBoundary] レイアウト "${this.props.layoutType}" で例外発生 → fallback (radar_compare) 表示`,
      { error, info, layoutType: this.props.layoutType }
    );
  }

  // props.layoutType が変わったらリセット (別レイアウトに切り替わる時)
  componentDidUpdate(prevProps) {
    if (prevProps.layoutType !== this.props.layoutType && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      // フォールバック表示: 静かなプレースホルダー
      // (本来は LayoutRouter が radar_compare を表示するが、念のため安全な表示)
      return (
        <div className="flex-1 flex items-center justify-center relative z-10 w-full pt-12 pb-[34%] px-3">
          <div className="bg-zinc-900/85 rounded-xl border border-zinc-700/50 p-4 text-center backdrop-blur-sm max-w-[90%]">
            <div className="text-[12px] font-bold text-zinc-300 mb-1">
              レイアウト読み込みエラー
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mb-2">
              {this.props.layoutType || '不明'}
            </div>
            <div className="text-[10px] text-zinc-600 leading-relaxed">
              {this.state.errorMessage.slice(0, 100)}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
