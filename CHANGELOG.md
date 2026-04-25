# Changelog

『数字で見るG党 Studio』 のバージョン履歴。

セマンティックバージョニング (MAJOR.MINOR.PATCH):
- MAJOR: 破壊的変更
- MINOR: 後方互換のある機能追加
- PATCH: バグ修正のみ

---

## [5.6.3] - 2026-04-25 - X (Twitter) リサーチ統合

### 変更
- **★全エージェントに X 活用ルールを統合★**:
  - ワークスペース指示 (`grok-project-instructions.md`) に「X活用ガイド」セクション新規追加
    - 用途4種: ファン感情温度感 / 記者・専門家分析 / 選手発言 / 取材記事発掘
    - 検索のコツ: 感情ワード組合せ / min_faves:50 / 過去24h-7d / @アカウント+投稿日併記
  - **researcher**: 出力フォーマットに「★X上の反応・取材★」セクション追加 (ファン反応・記者解説・選手発言・記事リンク)、ルールに「X活用必須」追加
  - **trend**: 「★Xトレンド分析★」セクション (バズ投稿の RT/いいね数で重要度判定、注目記者ツイート、公式アカウント発信)
  - **master**: データ取得ルールに「★X活用必須★」追加
  - **critic**: 推奨ツールに x_search 追加 (炎上リスク確認用)、ペルソナに「X 上のファン感情も確認」追加

### 効果
- リサーチに**ファンの生の声**が入る (今までは数字+記事だけ)
- 旬度判定の**根拠が定量化**される (バズ数で測れる)
- 監修者が**炎上リスクを事前に**評価できる
- Grok の最大の強み (X 直接アクセス) を活用

---

## [5.6.2] - 2026-04-25 - ランキング改善 + player_spotlight 新レイアウト

### 追加
- **★新レイアウト player_spotlight★**: 1選手にフォーカスして詳細を見せる
  - シルエット + 大きな選手名・番号 + プライマリ指標 (大表示) + サブ指標グリッド + コメント
  - `layoutData.spotlight.players[]` で複数選手を持てる
  - `script.focusEntry` で表示する選手を id/name 切替
  - `primaryStat.isNegative:true` で値を赤色表示 (ワースト動画用)
  - LAYOUT_TYPES に登録 (emoji 🔦)
  - LayoutPanel の amber notice 対応

### 変更
- **ランキングレイアウト改善**:
  - `entry.sub` フィールド追加 (ポジション/打数/状態などの補足情報)
  - 値を絶対値の差でバー視覚化 (負の値は赤バー)
  - `script.focusEntry` で個別選手をフォーカス強調 (scale-1.04)
  - `isMainPlayer` (常時強調) と `isFocused` (動画内で順次切替) を区別
- **Grokエージェント master 大幅改訂** (4,000字制限内ギリギリ):
  - 「★文脈データ厳守★」セクション追加
    - valSub 等は実数値必須 (「.500」「-」など丸めNG)
    - ranking で5人並べたら必ず player_spotlight で深掘り
    - timeline は最低3点
  - レイアウト切替パターンに「順位/比較」「チーム」追加
  - 自己チェック項目に「valSub実数」「ranking後 spotlight」「timeline 3点以上」追加
- **Geminiプロンプト schema 更新**:
  - `ranking.entries[].sub` 追加 (補足情報)
  - `player_spotlight` schema 新規追加 (players[] / primaryStat / stats / comment / silhouette)
  - script schema に `focusEntry` 追加
  - レイアウト切替パターンを更新 (順位型/ワースト診断型/チーム診断型)

### 修正
- (該当なし)

---

## [5.6.1] - 2026-04-25 - 重要バグ修正 + 対決カード再設計

### 修正
- **★レイアウト継承バグ修正★**: scriptで layoutType:"timeline" を指定後、後続のscriptで未指定だと radar_compare に戻ってしまう問題
  → LayoutRouter で scripts を遡り、直近の layoutType 指定を継承する仕組みに変更
  → これで「id:14でtimelineに切替→id:15-20も timeline 継続」が正常に動作

### 変更
- **対決カード (versus_card) を抜本再設計**:
  - 旧: 2カード横並び (PlayerCard 高さ100px×2) + カテゴリ別比較が縦2バー → 縦スペース不足で見切れ
  - 新: 上部はサマリー帯1段 (60px、左 vs 右で総合スコア対比) + 下部は1行で左右対比 (バー右寄せ⇔バー左寄せ)
  - 各指標が「main数値[バー右寄せ] ◀/▶ [バー左寄せ]sub数値」で左右の差分が一目で分かる
  - 6指標まで余裕で収まる縦圧縮
  - 「差●」を中央 VS の下に表示

---

## [5.6.0] - 2026-04-25 - スマホShorts視聴最適化 + 台本UI刷新

### 追加
- **シルエット選択UI** (LayoutPanel): 選手タイプ (打者/投手/チーム) ごとにシルエットをタップ選択
- **レイアウト切替を台本UIで** (ScriptEditorPanel): 各シーンに layoutType ドロップダウン追加
- **台本UI 刷新**:
  - 現在再生中シーンに自動スクロール
  - シーン移動 (↑↓) / 複製 / 削除 / 追加ボタン
  - 詳細フィールド折り畳み式 (基本=text/speaker、詳細=speech/textSize/SE/layoutType/highlight)
  - 簡易プレビュー: layoutType/highlight/SE がバッジ表示
  - speakerごとに背景色 (A=オレンジ系、B=スカイ系)

### 変更 (見た目: スマホShorts視聴に最適化)
- **フック成績の単位日本語化**: AVG→打率、ERA→防御率、HR→本塁打、K→奪三振 等
- **ハイライトカード位置を上寄り**: top 245→**175px** (より中央寄り)
- **ハイライトカード内テキスト全部UP**: label 22→26px、val 32→38px、kana 10→12px
- **レーダーチャート大型化**: max-width 220→**280px**
- **時系列グラフ大型化**: 130→170高、ポイント上に値表示追加
- **ランキング大型化**: 順位14→18、選手名12→15、値14→17px
- **VS カード「左vs右」明確化**: 中央VSと「差●」表示、PlayerCard 16→18px / 40→48px
- **VS カテゴリ別比較大型化**: バー高 2.5→3、テキスト 10→13、12→15px
- **打球方向 上余白 + テロップ被り解消**: pt-7→pt-12、pb-[30%]→pb-[32%]
- **テロップ自体のフォントUP**: xl 26→30、l 22→25、m 19→21、s 16→18px
- **選手名表示UP**: name 14→17、num 20→24px
- **LuckDashboard 数値拡大**: 不運度 44→52px、各MetricCard 18→22px
- **TeamContext / PitchArsenal / PitchHeatmap 内テキスト全部 +2px**
- **アニメーション緩和**: フェード 0.28→**0.45秒** (切替が速すぎ問題)
- **全レイアウト pt-12 統一** (上余白で選手名と被らない)

### 修正
- (該当なし)

---

## [5.5.0] - 2026-04-25 - Grokエージェント運用 + 読み仮名対応

### 追加
- **Grok 4.3 Beta カスタムエージェント 4枠分割**
  - `grok-agent-master.md` (全自動エージェント、5モード判定)
  - `grok-1-researcher.md` / `grok-2-critic.md` / `grok-3-trend.md` (専用モード)
  - 各ファイル4,000字制限内に最適化
- **読み仮名辞書 + applyYomigana 関数**
  - `docs/yomigana-dictionary.csv` (約170件、Google Sheets 連携可)
  - `src/lib/yomigana.js` (TTS 直前の自動置換)
  - 例: 泉口→いずぐち、左腕→さわん、何勝→なんしょう
- `docs/workflow.md` に方式A/B 2運用フロー記載
- Geminiプロンプト XML 構造化 (Gemini 3 公式推奨準拠、257行/14k tokens)

### 変更
- Gemini プロンプトに「強ワード/数字を1-2行目に」「stats と hook テーマ整合」追加
- NGワード追加: 「だった!?」「驚愕の」「ヤバい」

---

## [5.4.0] - 2026-04-24 - UI/UX 大幅改善

### 追加
- VS カードの kana / rawMain / rawSub サポート (指標カスタマイズ)
- pitch_arsenal の comparePitches 比較対応 (昨季vs今季 / 他投手比較)
- 増田陸テンプレート: timeline → spray_chart に切替パターン適用
- 則本昂大テンプレート: timeline → pitch_arsenal に切替パターン適用

### 変更
- ハイライト指標名・読みを **中央揃え + 縦配置**
- ハイライトカード上部に余白追加 (top 235→245px)
- VS カードのカテゴリ別比較を **縦2本バー + 優勢マーク** に刷新
- 球種別パイチャートを縮小 (85%→60%、テロップ被り解消)
- レイアウト選択UI を **3列グリッド** + 絵文字付きに刷新
- 英語ラベル全部日本語化: WHY→理由、SEASON STATS→今季成績、UNLUCKY SCORE→不運度スコア
- 全 `uppercase` クラス撤去 (BABIP等の指標名は形保持)
- テロップ max-width 210→270px (改行頻度減)
- B のテロップ右寄せ修正 (padding-right 90→70px)
- 末尾アウトロを **二択疑問** に: 「コメントで教えて」→「10本?20本?」
- スクエアモード デフォルトON、時間バッジ デフォルトOFF

### 修正
- **回帰バグ**: 標準チャート最初以外でアニメしない問題を修正
  (RadarCompareLayout で animationKey ごとに re-mount)

---

## [5.3.0] - 2026-04-23 - 新機能 (動画出力 + ランキング)

### 追加
- **ranking レイアウト** 新規追加
  - mode: "single" / "multi" で1指標/複数指標切替
  - mainPlayer フォーカス + 注目マーク
  - 1〜3位は王冠 + 色分け
  - 最大10件表示、注目選手が圏外なら「⋯」+追加表示
- **動画ダウンロード機能**
  - `src/hooks/useVideoRecorder.js` 新規
  - getDisplayMedia API でタブ録画 + タブ音声
  - **mp4 直接出力対応** (Chrome系) / webm 自動フォールバック
  - 再生終了で自動停止 → 自動ダウンロード
- LAYOUT_TYPES に `ranking` 追加 + emoji フィールド

---

## [5.2.0] - 2026-04-22 - チームテーマ対応

### 追加
- silhouette `team_huddle` (3人円陣) と `team_stadium` (球場) 新規
- playerType `team` サポート
- hook の番号バッジ非表示、「読売ジャイアンツ」表示 (team時)
- hook stats を team時に {rank, winRate, runs, runsAllowed} に切替
- phase-b-header の番号も team時非表示

### 変更
- Geminiプロンプトに チーム型推奨レイアウト追加: team_context → timeline → versus_card

---

## [5.1.0] - 2026-04-21 - 視聴維持率対策の基盤改善

### 追加
- LayoutRouter で **script単位 layoutType 切替** + 0.28秒フェードアニメ
- マンネリ防止 (1動画で2-3レイアウト切替)

### 修正
- **致命バグ**: hookLineIn の `filter:blur(4px)` 削除
  → 0.5秒時点で hook が読めない問題解消 (視聴16%→改善見込み)
- hookShake 1.5秒 → 0.7秒 (振動中に読めない問題解消)
- hookZoom blur(8px) も削除

### 変更
- テロップ位置 19%/15% → 20% 統一 (size-xl 3行も収まる)
- 上部ヘッダー再構築 (brand-logo / 選手名 / ph-date が並列)
- HighlightCard 全レイアウト対応化、末尾 comparisons テーブル削除

---

## [5.0.0] - 2026-04-10 - 初版 (チャンネル開設)

### 追加
- React + Vite + Tailwind 構成
- 8レイアウト: radar_compare / timeline / luck_dashboard / spray_chart / pitch_heatmap / versus_card / pitch_arsenal / team_context
- Gemini 3.1 Flash TTS 連携 (Charon=A, Puck=B)
- Web Speech フォールバック (下書き用)
- BGM/SE永続再生 (HTMLAudioElement 純粋化)
- IndexedDB 音声キャッシュ (SHA-1 key)
- Gemini Custom Gem プロンプト初版

### 仕様
- スマホ Pixel 9 Pro Fold 1台で投稿まで15-20分完結
- ターゲット: 30-60代男性巨人ファン (ミーハー6:コア4)
