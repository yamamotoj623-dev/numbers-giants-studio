# 数字で見るG党 Studio (v5.0.0)

YouTubeチャンネル『数字で見るG党』向け、プロ野球データ分析ショート動画の量産スタジオ。
Pixel 9 Pro Fold 1台で投稿までを10分以内に完結させることを目標とした、スマホファースト設計のReactアプリです。

---

## v4.24.0 からの主な進化

| カテゴリ | v4.24.0 | v5.0.0 |
|---------|---------|--------|
| TTS | Web Speech API 固定 | 下書き(Web Speech) / 本番(Gemini 3.1 Flash TTS) の二層 |
| APIキー | - | GAS プロキシで完全保護 |
| 音声キャッシュ | なし | IndexedDB 永続化で再コスト防止 |
| レイアウト | radar_compare 固定 | **マルチレイアウト（8種類すべて実装済）** |
| BGM | なし | Google Drive 連携ライブラリ |
| SE | なし | 10種類のプリセット + 台本連動 |
| 音響 | なし | Web Audio API ミキサー + 自動ダッキング |
| PWA | 部分対応 | manifest + ホーム画面設置可 |
| 録画 | - | 録画専用モード（UI完全非表示、3秒カウント後自動再生） |

---

## セットアップ

### 前提

- Node.js 18 以上（開発PC または `codespaces.new` 等）
- **初回のみPC推奨**（スマホでも可能だがタイピングが辛い）

### 1. バックエンド（GAS）の構築

`/mnt/user-data/outputs/gas-proxy/` を別途用意してあります。
その中の `SETUP.md` を参照して以下を完了させてください:

- Gemini API キー発行 (Google AI Studio、Paid tier 必須)
- GAS プロジェクトに `Code.gs` を設置
- スクリプトプロパティに `GEMINI_API_KEY`, `AUTH_TOKEN`, `BGM_FOLDER_ID` 設定
- ウェブアプリとしてデプロイ → URL 取得

所要 15 分。

### 2. アプリ側のセットアップ

```bash
# 依存関係をインストール
npm install

# 環境変数ファイルをコピー
cp .env.local.example .env.local

# .env.local を編集:
#   VITE_GAS_ENDPOINT   ← GASの /exec URL
#   VITE_GAS_AUTH_TOKEN ← GASで設定したAUTH_TOKEN
```

### 3. 起動

```bash
# 開発サーバ起動（http://localhost:5173）
npm run dev

# スマホ実機から同じWi-Fi経由でアクセスしたい場合
npm run dev:mobile
# ターミナルに表示される Network: http://192.168.x.x:5173/ を Pixel で開く
```

### 4. 本番デプロイ（Vercel例）

```bash
npm install -g vercel
vercel
# 初回はログイン、設定をガイドに従って進める
# 環境変数 VITE_GAS_ENDPOINT / VITE_GAS_AUTH_TOKEN を Vercel ダッシュボードで登録
```

デプロイ後のURLを Pixel の Chrome で開き、**ホーム画面に追加**でPWAとして常駐できます。

---

## ディレクトリ構成

```
src/
├── App.jsx                        # メインアプリ（全パネル統合）
├── main.jsx                       # エントリポイント
├── index.css                      # Tailwind + 基本スタイル
├── lib/
│   ├── config.js                  # 定数（テーマ、レイアウト、SE、パターン）
│   ├── audioCache.js              # IndexedDB 音声キャッシュ
│   ├── ttsAdapter.js              # TTS抽象化（WebSpeech / Gemini）
│   ├── mixer.js                   # Web Audio API ミキサー
│   ├── gasClient.js               # GAS プロキシクライアント
│   └── textRender.jsx             # テロップ強調レンダリング
├── hooks/
│   └── usePlaybackEngine.js       # 再生ループ統合フック
├── data/
│   ├── defaultBatter.js           # 野手サンプルデータ
│   └── defaultPitcher.js          # 投手サンプルデータ
├── components/
│   ├── PreviewFrame.jsx           # プレビュー外枠（ヘッダー・アバター・テロップ）
│   ├── PentagonRadarChart.jsx     # 五角形レーダー
│   ├── GlobalStyles.jsx           # キーフレームアニメ
│   ├── JsonPanel.jsx              # JSON入出力＋AIプロンプト生成
│   ├── ScriptEditorPanel.jsx      # 台本直接編集
│   ├── LayoutPanel.jsx            # レイアウト選択＋layoutData編集
│   ├── TTSPanel.jsx               # TTS切替＋事前生成＋コスト表示
│   └── BGMPanel.jsx               # BGM選択＋ミキサー＋SE試聴
└── layouts/
    ├── LayoutRouter.jsx           # layoutType分岐（8種類全て登録済）
    ├── RadarCompareLayout.jsx     # v4.24.0 互換・総合比較
    ├── TimelineLayout.jsx         # 時系列推移
    ├── LuckDashboardLayout.jsx    # 運要素分析（擁護型向け）
    ├── SprayChartLayout.jsx       # 打球方向マップ
    ├── PitchHeatmapLayout.jsx     # 9分割配球ヒートマップ
    ├── VersusCardLayout.jsx       # 2選手対決カード
    ├── PitchArsenalLayout.jsx     # 球種別分析
    └── TeamContextLayout.jsx      # 起用・打順考察
```

---

## 運用フロー（10分完結）

1. **データ入力** (1分): 
   - 「JSON」タブ → 「AIプロンプトを作成＆コピー」
   - Geminiアプリに貼り付け → JSON取得 → アプリに「貼り付けて反映」

2. **台本調整** (3〜5分):
   - TTSパネルで「下書き」エンジン選択（無料・即時）
   - 再生ボタン → 違和感あれば「台本」タブで修正
   - OKになるまで繰り返す

3. **レイアウト選択** (30秒):
   - 「レイアウト」タブでテーマに合う layoutType 選択
   - 必要ならデータ点数や不運スコアを微調整

4. **本番音声生成** (2分):
   - TTSパネルで「本番」エンジンに切替
   - 「全セクションを事前生成」→ キャッシュ完了
   - 2回目以降はキャッシュ利用で再コストなし

5. **BGM・SE設定** (30秒):
   - 「BGM/SE」タブで曲選択・音量調整
   - SE はスクリプトの se プロパティで自動再生

6. **画面録画** (1分):
   - ヘッダーの「録画」ボタン → 3秒カウント後自動再生
   - Pixel標準の画面録画（クイック設定）を併用
   - 再生終了後に終了ボタン

7. **YouTube投稿** (1分):
   - Pixel のギャラリーから動画選択
   - Shorts アプリから投稿

---

## 音声コストの目安

Gemini 3.1 Flash TTS の公式料金に基づく試算:

- 1動画60秒・試行3回込み: 約 $0.005 (¥0.75)
- 月60本投稿: 約 $0.30 (¥45)
- 年720本投稿: 約 $3.60 (¥540)

IndexedDBキャッシュによって同一セリフの再生成は発生しないため、
イテレーションコストは実質ゼロです。

---

## 既知の制約

1. **MP4 エクスポートは非搭載**: ffmpeg.wasm はモバイルで実用的でないため、Pixel標準の画面録画を前提にしています。
2. **16:9 レイアウトは暫定対応**: フェーズ4（将来）で本格対応予定。現状は比率だけ変わります。
3. **Gemini TTSはプレビュー版**: 稀に500エラー、話者と出力の不一致が起きる可能性。フォールバックでWeb Speechへ自動切替します。
4. **オフラインでは Gemini TTS 不可**: キャッシュ済み音声のみ再生可能。

---

## トラブルシューティング

### "GAS endpoint not configured" エラー
→ `.env.local` が無いか VITE_GAS_ENDPOINT 未設定。開発サーバ再起動が必要。

### Gemini TTS が失敗する
→ GAS の `testTTS` 関数を GAS エディタから直接実行して疎通確認。
Paid tier 未切替 or APIキー誤りの可能性。

### BGM一覧が空
→ Google Drive の BGM フォルダに MP3 が入っているか確認。
ファイルのMIMEが audio/mpeg であることも確認。

### PWAホーム画面追加がグレーアウト
→ HTTPS 経由でアクセスしていない可能性。
ローカル開発時は Chrome DevTools → Application → Manifest で Install を強制可能。

### 音声がスマホのバックグラウンドで停止する
→ iOS Safari/Android Chrome の仕様。画面をアクティブに保つ必要あり。
録画中は画面が点灯している前提なので影響なし。

---

## ロードマップ

- **フェーズ3（完了）**: ✅ 8レイアウトすべて実装完了
- **フェーズ4（次）**: 16:9 完全対応、長尺動画対応、ffmpeg.wasm でのPC向けMP4エクスポート
- **フェーズ5**: 生成履歴ダッシュボード、バックエンドでの運用分析、多球団対応

---

## ライセンス

個人運用向けプライベートプロジェクト。
