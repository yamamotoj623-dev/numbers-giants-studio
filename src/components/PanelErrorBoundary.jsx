/**
 * PanelErrorBoundary ()
 *
 * 編集タブパネル (LayoutPanel / ScriptEditorPanel / JsonPanel / TTSPanel / BGMPanel)
 * のいずれかで例外が発生してもアプリ全体が真っ白にならないようにする ErrorBoundary。
 *
 * 主な発生原因:
 * - 古い localStorage の projectData を新スキーマで参照したときの型不一致
 * - layoutData の構造が想定外 (Gemini 出力の継承で発生)
 * - undefined への配列アクセス等
 *
 * エラー時はコンソールに warn を出して、フォールバック UI を表示。
 * 「リセット」ボタンで再試行できる。
 */

import React from 'react';

export class PanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', errorStack: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || String(error),
      errorStack: error?.stack || '',
    };
  }

  componentDidCatch(error, info) {
    console.error(
      `[PanelErrorBoundary] パネル "${this.props.panelName}" で例外発生`,
      { error, info, panelName: this.props.panelName }
    );
  }

  // props.panelName が変わったらリセット (タブ切り替え時)
  componentDidUpdate(prevProps) {
    if (prevProps.panelName !== this.props.panelName && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '', errorStack: '' });
    }
  }

  reset = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm font-black text-red-800 mb-2">
              ⚠️ パネル "{this.props.panelName}" でエラーが発生しました
            </div>
            <div className="text-[11px] font-mono text-red-700 bg-red-100 p-2 rounded mb-2 break-words">
              {this.state.errorMessage}
            </div>
            <details className="text-[10px] text-red-600 mb-3">
              <summary className="cursor-pointer font-bold">スタックトレース</summary>
              <pre className="whitespace-pre-wrap mt-1 max-h-32 overflow-y-auto bg-red-50 p-1.5 rounded">
                {this.state.errorStack.slice(0, 1500)}
              </pre>
            </details>
            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded"
              >
                🔄 再試行
              </button>
              <button
                onClick={() => {
                  if (window.confirm('保存中の編集データを削除して初期状態に戻します。よろしいですか?')) {
                    try {
                      localStorage.removeItem('np-projects');
                    } catch (e) {}
                    window.location.reload();
                  }
                }}
                className="text-xs font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-3 py-1.5 rounded"
              >
                🗑 編集データを削除して再起動
              </button>
            </div>
            <div className="mt-2 text-[10px] text-red-700">
              💡 古い保存データが新スキーマと整合しない場合、「編集データを削除して再起動」で解決することがあります。
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
