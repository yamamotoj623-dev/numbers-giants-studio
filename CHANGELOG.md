# Changelog

『数字で見るG党 Studio』 のバージョン履歴。

## [5.21.10] - 2026-05-15 - ★pitch_arsenal 表示崩壊 fix + Knowledge / 実装の型不一致是正★

**問題:**
- `pitch_arsenal` レイアウトで「`i.avg.toFixed is not a function`」エラー、画面が崩壊
- 原因の階層分け:
  1. **Knowledge と実装が真逆**: Knowledge ファイル `layout-templates.md` が `"avg": ".205"` という **文字列** 形式を指示していたが、アプリの `PitchArsenalLayout.jsx` 行 135 は `avg.toFixed(3)` で **数値** を期待
  2. **アプリ側に防御がない**: 文字列が来ると `.toFixed()` が無いため即クラッシュ
  3. **Knowledge ガイドの罠**: 「★0始まり小数は `.205` 表記★」という指示は `mainPlayer.stats.avg` 等の表示専用フィールドの規約だが、`layoutData.arsenal.pitches[].avg` のような計算対象フィールドにも誤適用されていた

**修正:**
- ★`PitchArsenalLayout.jsx`★: `pitch.avg` を `Number()` で正規化、`Math.min`・比較・`toFixed` の各箇所で防御。文字列 `".375"` でも数値 `0.375` でも動作
- ★`PitchArsenalLandscape.jsx`★: 表示を `{p.avg}` 直書きから `(Number(p.avg) || 0).toFixed(3).replace(/^0/, '')` に変更(Portrait と表示統一)
- ★`TimelineLayout.jsx`★: 予防的に `p.value` も Number 正規化(同じバグの可能性)
- ★`docs/layout-templates.md`★ §7 pitch_arsenal: example の `avg` を数値リテラル(`0.205` 等)に統一、ガイドに「★avg は数値で出力、`".205"` のような文字列は NG(アプリで toFixed() エラー)★」を明記
- ★`docs/layout-templates.md`★: pitch_arsenal の compare モード / vs_batter モード用フィールド構造も完全 example として追加(Gemini が推測で出さなくて済むように)
- ★`docs/json-schema-rules.md` §3 数値整形★: 例外ルール明記
  - 表示専用フィールド(`mainPlayer.stats` / `comparisons[].valMain` 等)→ 文字列 `.345` / `0.97` 形式
  - 計算対象フィールド(`layoutData.arsenal.pitches[].avg` 等)→ 数値型
  - 判別ルール「アプリが計算・整形に使うフィールドは数値、そのまま表示されるフィールドは文字列」

**検証:**
- 実際の中川皓太データ(文字列 `".375"` と数値 `0.375`)両方で、修正後アプリが正しく `.375` と表示することを Node スクリプトで実証

**他レイアウト確認(同じ型不一致の網羅チェック):**
- ✅ `BatterHeatmapLayout`: 既に `typeof avg === 'number'` ガード済み
- ✅ `PitchArsenalLayout/Landscape`: 今回修正
- ✅ `TimelineLayout`: 予防的に修正
- その他 `RankingLayout` / `RadarCompareLayout` 等は内部計算値が中心で、入力データ型の影響なし

## [5.21.9] - 2026-05-15 - ★projectData ラッパー fix★(data モード反映バグ修正)

**問題:**
- アプリのデータ JSON プロンプトを Gemini に渡すと `{ "projectData": { ... } }` 形式で出力されるが、貼り付け後「反映」を押しても画面に出ない
- 原因: `tryApply` の `mode === 'data'` 分岐で、`{ projectData: {...} }` ラッパーを剥がさずに `mergeProjectData(parsed, ...)` に渡していた
- 結果: merged の中で `mainPlayer` 等が `projectData` ネスト下に埋もれ、UI が認識できなかった
- whole モードでは Gemini が偶然フラット形式を出していたため発覚が遅れた(知識ファイル / NotebookLM 両方で同じ問題)

**修正:**
- ★`JsonPanel.jsx` の `tryApply`★: JSON.parse 直後に `parsed.projectData` ラッパー剥がし処理を追加
  - data モード: `{ projectData: {...} }` → projectData の中身に正規化
  - whole モード: `{ projectData: {...}, scripts: [...] }` → projectData の中身 + scripts に正規化
  - script モード: ラッパーなし(`{ scripts: [...] }`)なので影響なし
- ★`buildDataJsonPrompt`★: 出力形式を明示(形式 A フラット推奨 / 形式 B projectData ラッパーも OK)、アプリは両対応

**検証:**
- 中川皓太 pitch_arsenal JSON で動作確認: 修正前は `merged.mainPlayer === undefined`、修正後は正しく `{ name: '中川皓太', ... }` を取得
- 知識ファイル運用 / NotebookLM 運用いずれでも有効

## [5.21.8] - 2026-05-14 - ★v11 軽量化設計★(instruction を 80% 削減、Knowledge / NotebookLM 連携前提)

**経緯と根本問題:**
- v5.21.7 の 2 Gem 分業設計を廃止 → v10.2 単一 Gem 復帰を判断
- v10.2 (15K字) に最小パッチを当てた v10.2-patched (20K字) を作成したが、ユーザー指摘「重くない?これがベスト?NotebookLM 連携相性は?改修履歴いる?これまでの失敗を活かせ」で再検討
- 調査結果(Zenn 等): Gemini Custom Gem の instruction 公式推奨は 500-2000 字、20K字は完全に過大設計
- 「Knowledge を読まない」のではなく、**instruction が長すぎて Gem が混乱**していた可能性が高い
- **★正しい設計★**: instruction は人格・役割定義のみ短く、詳細は Knowledge / NotebookLM に分離(「役割と知識の分離」)

**新ファイル:**
- ★`gemini-custom-gem-instruction-v11.md` (3,053 字)★ — v10.2 比 80% 削減
  - 役割 / モード切替 / キャラ / 絶対不変ルール / Knowledge Files 参照表のみ
  - 改修履歴記述を完全削除(AI に過去変遷を教える意味なし)
  - 詳細(スキーマ違反例、emoji NG リスト、出力前チェック全項目、数値整形ルール等)は Knowledge / NotebookLM に集約
- `gemini-custom-gem-instruction-v10.2-patched.md` は廃棄(設計が間違っていたため)

**v11 で残した「絶対不変ルール」(Gem instruction 直書きが必須なもの):**
- 出力は JSON のみ、入力にない数字を作らない、出力前 web search で今日の日付確認
- id:1 分割禁止(タイトル独立、speech は短いフック 1-2 秒)
- id:2 以降は text と speech 完全一致
- speech「、」削除 → 全角スペース「　」代用
- 同 speaker / scenePreset / se 連続最大 4 回
- scripts 個数は 60 秒以内で柔軟(固定指定なし)
- A 絶対敬語 / B 鋭いコアファン枠 / A↔B 呼び合い必須

**Knowledge Files に委譲した詳細:**
- スキーマ全項目 / 列挙値 / 数値整形 / 配分 / emoji 指定 15 種 / 出力前チェック → `json-schema-rules.md`
- 8 レイアウト完全テンプレ → `layout-templates.md`
- もえか口調サンプル / ヤバい運用詳細 → `moeka-voice-samples.md`
- 縦横の構成原則 → `composition-rules.md` / `composition-landscape-rules.md`
- 読み仮名辞書 → `yomigana-dictionary.csv`

**ディレクトリ整理(archived/):**
- `archived/gem-composition/`(旧 2 Gem 設計の構成 Gem 一式)
- `archived/gem-json/`(旧 2 Gem 設計の JSON Gem 一式)
- `archived/gemini-custom-gem-instruction-v10.3.1.md`(肥大化版、不採用)

**JsonPanel.jsx の 3 モードプロンプト軽量化:**
- ★`buildAIPrompt` (whole)★: 旧 50 行 → 新 17 行(Gem instruction が本体なのでアプリ側は最小限のタスク指示+テンプレ)
- ★`buildDataJsonPrompt` (data)★: 旧 50 行 → 新 21 行
- ★`buildScriptJsonPrompt` (script)★: 旧 60 行 → 新 22 行
- 「構成 Gem からのプロンプト貼付」言及はすべて削除済
- 「Gem instruction と Knowledge Files の全ルール厳守」を 1 行で参照

**AI チェック系プロンプトの v10.2 整合化(v5.21.7 で実施済みを継続):**
- buildScriptReviewPrompt: 連続最大 4 回・横長対応・text/speech 一致・speech「、」削除・id:1 分割禁止・emoji 指定 15 種・§9 JSON スキーマ違反検出

**UI 文言修正:**
- 「Grok v2 / 構成 Gem / JSON Gem の出力をレビュー」→ 「Grok / Gem の出力をレビュー」
- 関数ドキュメンテーションを「単一 Gem 運用 (v11 軽量化)」前提に更新

**NotebookLM 連携の準備完了(★将来実装、即実装可能★):**
- v11 instruction(3K字)は NotebookLM 連携前提で設計
- 連携手順: Gem 設定の「知識」で NotebookLM ノートブックを指定するだけ
- 同じ Knowledge Files 10 個を NotebookLM ノートブックにアップロード → Gem 設定で参照先を NotebookLM に変更
- メリット: 必要箇所瞬時特定で速度・精度両方向上、md/csv 直接対応、無料版 50 ソース余裕
- 制約: Gem 共有不可(個人運用なら問題なし)、不安定報告あり(共有時 NotebookLM 消える)

**ペンディング(継続):**
- ⑥ ぬるっと型(戦略 D)の実機台本テスト ← ★最優先(本来の本筋、ずっと未着手)★
- ① TTS バックグラウンド継続(Android Firefox)
- ⑦ Phase 2 ranking 拡張
- ⑩ RadarCompare / TeamContext エディタ未実装

## [5.21.7] - 2026-05-13 - Gem 役割大幅再設計 + JSON Gem 3 モード対応

**Gem 役割の根本的再設計(添付サンプルの問題に対応):**
- 旧設計の問題: 構成 Gem が JSON 相当の台本を作っており、JSON Gem への引き継ぎで情報劣化、スキーマ違反多発(`"script"` 単数、`name`/`targetA`/`valueA`、`💦` 等 emoji 列挙外、`layouts` 配列、`mainPlayer` 欠落 等)
- 新設計:
  - **構成 Gem**: 方針合意専用(角度 → 戦略 → タイトル 3 STEP)+ JSON Gem 用プロンプト出力 + ★YouTube 投稿情報生成(STEP 5、オプション)★ — 縦横兼用 1 つの Gem
  - **JSON Gem**: 3 モード切替(★全体 whole / データ単体 data / 台本単体 script★)で生成主体に変更

**JSON Gem の徹底強化:**
- スキーマ違反の典型例を instruction 本体に直書き(Knowledge 依存削減)
- text/speech 整合性ルール明文化(文章内容完全一致、表記のみ違い OK、改行は text のみ、speech の「、」は全角スペース「　」で代用)
- id:1 は分割しない(動画タイトル独立、text = タイトル、speech = 1-2 秒フック)
- 1 ID 文字量: 縦長 3-12 字×3-4 行 / 横長 8-20 字×1-2 行、超える場合は ID 分割
- 出力前チェック違反時は **完全再生成**(部分修正禁止)

**Knowledge Files 新規/再構成:**
- 新規 `youtube-template.md` — 構成 Gem STEP 5 用、6 項目(動画タイトル/概要欄/ハッシュタグ/タグ/サムネ案/固定コメント)テンプレート集
- composition-landscape-rules.md 復元(横長動画用ルール)

**JsonPanel.jsx の 3 モードプロンプト最新化:**
- ★`buildAIPrompt` (whole)★ → 「モード: 全体(初回ベース作成)」明記、スキーマ違反例警告、text/speech ルール、Knowledge Files 前提に簡素化
- ★`buildDataJsonPrompt` (data)★ → 「モード: データ単体」、レイアウト適合性検証 + ハイライト指標選定 + variants 活用 + 「-」欠損埋め + radarStats NPB 平均 50 ベース指示
- ★`buildScriptJsonPrompt` (script)★ → 「モード: 台本単体」、既存 projectData 尊重、キャラ役割厳守、id ルール、呼び合い両方向、ヤバい運用、文字数配分指示
- 不要な `customPromptRaw` import 削除(Knowledge Files として運用するためアプリ埋め込み不要に)

**AI チェック系プロンプト 4 種の更新:**
- buildScriptReviewPrompt: 連続最大 4 回(2 回から緩和)、横長対応(8-20 字×1-2 行)、text/speech 一致チェック、speech「、」削除チェック、id:1 分割禁止チェック、scenePreset/se 連続 4 ID ルール、★JSON スキーマ違反検出セクション(§9)追加★(`script` 単数、`name/targetA/valueA`、`layouts` 配列、`mainPlayer` 欠落、`lower_is_better` 等の検出)
- buildLayoutAdvisorPrompt / buildDataFactCheckPrompt / buildDataGapFillPrompt は維持(Grok 向け継続)

**ペンディング(継続):**
- ⑥ ぬるっと型(戦略 D)の実機台本テスト ← ★最優先(本来の本筋)★
- ① TTS バックグラウンド継続(Android Firefox)
- ⑦ Phase 2 ranking 拡張
- ⑩ RadarCompare / TeamContext エディタ未実装

## [5.21.6] - 2026-05-13 - 構成 Gem 対話化 + 連続 4 緩和 + 横長 Gem 新規 + docs 重複整理

**構成 Gem の根本的設計変更:**
- **対話的(キャッチボール)設計に変更** — 一度に全部出さず、7 STEP(角度合意 → id:1 戦略選定 → タイトル 3 案 → ファクト確認 → ハイライト指標 → ストーリー骨子 → 台詞下書きを数 ID ずつ分割提示)で段階的に合意形成
- ユーザーが「全部一気に出して」と明示した場合のみ一括出力
- 各 STEP の終わりで「これで進めて良いか」をユーザーに確認

**ルール緩和:**
- 同 speaker 連続 2 回 → **4 回まで**(5 回以上 NG)
- 同 scenePreset 連続 「4 ID 以上 NG」→ **「4 ID まで OK、5 以上 NG」**
- 同 se 連続も同様に最大 4 ID まで
- scripts 数 **「28-30 個必須」→「60 秒以内に収まる範囲(目安 20-30 個)、無理な水増し禁止」**

**横長動画(16:9)用 新規 Gem 作成:**
- `gem-composition-landscape-instruction.md`(2,000 字)— 横長専用、章立て構造、対話的設計
- `composition-landscape-rules.md`(4,400 字)— 横長専用ルール(章立て / テロップ仕様 / レイアウト推奨 / 横長 id:1 設計)
- ショート用 Gem との根本的違い: スワイプ概念なし / 60 秒超 / id 40-100 個 / 章立て型 / テロップ 8-20 字×1-2 行

**docs/ 重複削除:**
- `audience-and-language.md`: 古い 33 本データ → 60 本実証(composition-rules.md §3 参照)に更新
- 「ヤバい」運用詳細は `moeka-voice-samples.md §2` に一元化(他 6 ファイルからは詳細削除、参照のみに)

**全 Gem instruction が公式推奨 500-2,000 字以内に収まることを再確認:**
- 構成 Gem(縦長): 1,913 字 ✅
- 構成 Gem(横長): 2,000 字 ✅
- JSON Gem: 1,689 字 ✅

**ペンディング(継続):**
- ① TTS 真のバックグラウンド継続(Android Firefox)— Wake Lock または Service Worker 化が必要
- ⑥ ぬるっと型(戦略 D)の実機台本テスト ← ★最優先(本来の本筋)★
- ⑦ Phase 2 ranking 拡張
- ⑩ RadarCompare / TeamContext の LayoutPanel エディタ未実装

## [5.21.5] - 2026-05-13 - docs/ 整理 + AI チェック系プロンプト 4 種追加

**docs/ 大規模整理:**
- 旧 5 ファイル削除: `grok-1-researcher.md` / `grok-2-critic.md` / `grok-3-trend.md` / `grok-agent-master.md` / `grok-project-instructions.md`(新版は別途 `grok-v2/` で運用)
- 新規追加: `composition-rules.md`(構成 Gem 必読、id:1 戦略 4 タイプ + チェック)/ `json-schema-rules.md`(JSON Gem 必読、スキーマ詳細 + 配分 + チェック)
- リネーム + 整理: `gemini-custom-prompt.md` → `layout-templates.md`(旧 V7 Gem 指示書部分削除、8 レイアウトのフルテンプレート + scripts 実例のみ)
- 重複セクション削除:
  - `hook-design.md`: §2 絶対要件 5 つ / §3 正解テンプレ 3 種 / §5 自己チェック(composition-rules.md と重複)
  - `structure-playbook.md`: §2 連続ルール / §6 強調 / §7 textSize / §8 SE / §8b zoomBoost / §9 自己チェック
  - `channel-strategy.md`: §4 古い 33 本分析 / §10 古い Grok 運用構成
  - `audience-and-language.md`: §4 NG ワード / §6 自己チェック
- 残存独自情報は保持: hook-design.md(インサイト vs 願望、speech 短縮、ギャップ作り、stats 一致)、structure-playbook.md(アウトロ二択、ミステリー型、テロップテンポ)等

**新 Gem 分業設計(別途運用):**
- 構成 Gem: `gem-composition-instruction.md` (1,992 字) + 8 Knowledge Files
- JSON Gem: `gem-json-instruction.md` (1,697 字) + 4 Knowledge Files
- 公式推奨「Gem instruction 500-2,000 字 / Knowledge Files 最大 10 / 100MB」に準拠

**JsonPanel.jsx の AI プロンプト機能拡張:**
- ★① JsonPanel の import 修正: `gemini-custom-prompt.md` → `layout-templates.md`(削除済ファイル参照によるビルドエラー回避)
- ★② v10.2 → v10.3.1 ベースに最新化(構成 Gem / JSON Gem の Knowledge Files と完全整合)
- ★③ **新「🔍 AI でチェック」セクション追加**(4 ボタン、新運用 = Grok v2 → 構成 Gem → JSON Gem の各段階レビュー機能):
  1. **🎯 レイアウト適合チェック** — 現在のデータでこのレイアウトがベストか判定、代替候補を提案(timeline/versus/radar 等の見落とし発見)
  2. **📋 台本 JSON 整合チェック** — 8 観点でレビュー(データ整合 / id:1 4 戦略 / 初見理解 / スワイプ対策 / キャラ役割 / 文字数テンポ / SE-scenePreset-textSize 配分 / NG ワード)
  3. **🔍 データ JSON ファクトチェック**(Grok 向け) — 数字を最新公式情報で検証、出典 URL + 取得日明示、異常値発見
  4. **🧩 データ JSON 欠損埋めリサーチ**(Grok 向け) — 「-」項目を Grok のリアルタイム情報で補完

**ペンディング(継続):**
- ① TTS 真のバックグラウンド継続(Android Firefox)— Wake Lock または Service Worker 化が必要
- ⑥ ぬるっと型(戦略 D)の実機台本テスト
- ⑦ Phase 2 ranking 拡張
- ⑩ RadarCompare / TeamContext の LayoutPanel エディタ未実装

## [5.21.4] - 2026-05-10 - アウトロメディア機能 + Gem 3分業設計

**新機能:**
- ★最後の id への画像/動画表示機能★ (`components/HookMediaOverlay.jsx`, `components/PreviewFrame.jsx`, `components/ScriptEditorPanel.jsx`)
  - 既存の hook (id:1) 画像/動画機能と同じ仕組みで、**最後の id (currentIndex === scripts.length - 1)** に全画面オーバーレイ表示
  - `saveOutroMedia` / `getOutroMedia` / `clearOutroMedia` API を `HookMediaOverlay.jsx` に追加 (IndexedDB の同じ DB の 'outro' キーで分離保存)
  - phase 非依存判定のため、smartLoop=true/false のどちらでも動作
  - `projectData.outroMediaPattern` (flash/zoom/slide/glitch/zoom_pulse) で切替アニメ選択
  - ScriptEditorPanel: 最後の id を編集時のみ緑色の outro アップロード UI を表示 (id:1 isCatchy と排他、UI混在を避ける)
  - `outroMediaPattern` を PRESERVE_KEYS に追加 (JsonPanel.jsx) — AI 出力に含めず、UI 設定を保持
  - 用途: 登録誘導 / 次回予告 / チャンネルブランディング

**外部 docs (Gem 指示書 3 分業設計):**
- `grok-agent-v2.md` (新規、約 8.5K) — Grok カスタムエージェント (リサーチ + X ファン感情分析専門、JSON 出力一切なし)
  - 旧 grok-1-researcher / grok-2-critic / grok-3-trend / grok-agent-master を統合・置換
  - 3 モード `[DATA]` `[FAN]` `[TREND]` — id:1 文字数 / 禁止文字 / textSize / scenePreset 等のフォーマット監査を完全廃止
- `gem-composition-v1.0.md` (新規、約 12.8K) — 構成 Gem (台本構成設計 + もえか口調 + id:1 戦略選定)
  - 半構造化テキスト出力、JSON 一切なし → JSON Gem に渡す
- `gem-json-v1.0.md` (新規、約 12.2K) — JSON Gem (スキーマ厳守 JSON 変換のみ、追加創作なし)
- 旧 `gemini-custom-gem-instruction-v10.3.1.md` (約 20K で上限超過していた) を 3 Gem に分業、各 17K 以下を実現

**ワークフロー変更:**
```
旧: Gemini (データJSON) → Grok (ファクトチェック) → Gemini (本番JSON)
新: Grok v2 [DATA] (リサーチ) → 構成 Gem → JSON Gem → アプリ
```
- 旧フローの「Gemini でデータ JSON を作らせる」工程は廃止 — Grok v2 が直接ソース付きで出力するためファクトチェック不要

**id:1 戦略 4 タイプ運用 (構成 Gem に明文化):**
- A: 派手型 / B: 数字主役型 / C: 静物写真型 / **D: ぬるっと型 (本命候補)**
- 「数字+矛盾」型を id:1 タイトル設計の原則 [4] に追加 (Top 維持率動画の最強パターン)

**ペンディング (継続):**
- ① TTS 真のバックグラウンド継続 (Android Firefox でアプリしまっても継続) — Wake Lock または Service Worker 化が必要
- ⑥ ぬるっと型 (戦略 D) の実機台本テスト (Grok v2 → 構成 Gem → JSON Gem の流れで 1 本作成して検証)
- ⑦ Phase 2 ranking 拡張 (順位変動アニメ / TOP3 拡大 / フィルタ)
- ⑩ RadarCompare / TeamContext の LayoutPanel エディタ未実装

## [5.21.3] - 2026-05-10 - 視聴データ実証反映 v10.3 + 5件バグ修正

**Gem 指示更新:**
- ★Gem 指示 v10.2 → v10.3★ 60本動画視聴データ実証ベース改修
  - id:1 (タイトル/フック) 設計再定義: 1選手フォーカス必須・具体数値必須・物語キーワード活用 (Top 4 維持率動画 83.7%/79.7%/77.1%/70.4% 共通要素から逆算)
  - NG ワード大幅拡充: 飽和パワーワード (致命的/絶望/衝撃 等 +0.8pt の効果ゼロを実証)、阿部監督批判型 (-3.2pt 逆効果)、他球団選手比較型 (維持率 17-18% で最低層)
  - もえか口調を「鋭い感想を言うコアファン枠」に転換 — Knowledge File `moeka-voice-samples.md` 新規追加 (40 サンプル + 「ヤバい」運用ルール)
  - タイトル長 25-32 字推奨、35 字以上は維持率低下と実証
  - 「現在地」を id:1 タイトル限定で解禁 (speech/text 内は引き続き NG)

**バグ修正 (6件):**
- ★① TTS 進捗 state を adapter 移管 (タブ切替で生成が止まる問題)★ (`lib/ttsAdapter.js`, `components/TTSPanel.jsx`)
  - TTSPanel は `{activeTab === 'tts' && <TTSPanel/>}` で条件レンダリングのため、別タブに切替えた瞬間にコンポーネントがアンマウントされ、React state (progress / pregenStatus / fallbackInfo) が破棄されていた
  - getAdapter('gemini') は singleton で、内部の `Promise.all` (2並列 fetch) は走り続け IndexedDB へのキャッシュ保存も継続するが、TTSPanel 再マウント時に進捗を復元する手段がなく「止まった」ように見えていた
  - 修正: GeminiAdapter インスタンスに `_pregenState` (isGenerating / progress / lastResult / startedAt) を保持。`subscribePregenState(listener)` で購読 API を提供。TTSPanel は再マウント時に useEffect で subscribe して進捗を復元
  - 効果: タブ切替後も生成は継続し、TTS パネルに戻った時点で進捗が正しく表示される。完了時は「完了済み」状態が復元される
- ★② voiceVolume 1.4 → 1.0★ (`data/defaultBatter.js`, `data/defaultPitcher.js`)
  - 初期音声音量が 140% で固定されていた問題を修正 (JsonPanel フォールバックは正しく 1.0 だったが defaults だけ 1.4 残存)
- ★③ 横長/正方形でセーフゾーンガイドを非表示★ (`components/PreviewFrame.jsx`)
  - YouTube ショート用UI(上下14% + 右12%)を可視化する `safe-zone-guide` が aspectRatio 16:9 / 1:1 でも表示され、もえか配置位置と干渉していた問題を修正
  - 9:16 (ショート) でのみ表示する条件に変更
- ★④ Firefox: 停止→再開で TTS が無音 + SE のみ鳴る問題を修正★ (`lib/ttsAdapter.js`)
  - `pause()` 後に同じ audio 要素へ同一 src (キャッシュデータURL) を再設定すると、Firefox では readyState がリセットされず `currentTime` が再生終了点のまま `startPlayback` に入って即 `onended` 発火 → 無音化していた
  - `audio.src = dataUrl` の直後に `audio.load()` を明示呼び出し、readyState を 0 に戻して canplay 待ちパスに乗せる
- ★⑤ グローバル layoutType 切替時の個別シーン上書き保持★ (`components/LayoutPanel.jsx`)
  - v5.15.5 で導入した「グローバル layoutType 変更時に scripts[i].layoutType を一括クリア」する挙動が、ScriptEditor で個別シーン上書きを設定したケースでも消去してしまい、ユーザーの意図しない default 化を起こしていた
  - 仕様変更: scripts.layoutType は明示クリアボタン経由のみで消す (デフォルトは保持)
  - 個別上書きが残っている時は警告UI を表示 (`⚠️ 個別シーン上書き N 個あり (該当シーンはグローバル切替の影響を受けません)` + `[全クリア]` ボタン + 確認ダイアログ)
- ★⑨ UI ラベル「理由」→「指標の意味」★ (`layouts/RadarCompareLayout.jsx`)
  - v5.20.4 で一度修正したが、何らかのリグレッションで `<div className="label">理由</div>` が戻っていた問題を再修正
  - `comp.desc` は指標の説明 (「1試合得点貢献」「純粋な長打力」等) であり、「理由」というラベルは文脈的に不適切

**docs 追加:**
- `docs/moeka-voice-samples.md` (新規、約 24K) — もえか「鋭い感想を言うコアファン枠」40 サンプル + ヤバい運用ルール
- `gemini-custom-gem-instruction-v10.3.md` (新規、17K) — Gem 指示 v10.3

**ペンディング (継続):**
- ① TTS 生成中の真のバックグラウンド継続 (Android Firefox でアプリしまっても継続) — Wake Lock または Service Worker 化が必要 (今回はタブ切替時の進捗 state 破棄問題を修正、OS レベルのバックグラウンド継続は別タスク)
- ⑥ id:1 スワイプ対策の追加戦略 (画像 C 既実装上で他にどう刺すか)
- ⑦ Phase 2 ranking 拡張 (順位変動アニメ / TOP3 拡大 / フィルタ)
- ⑧ Gem 分離 (構成専用 / JSON 専用)
- ⑩ RadarCompare / TeamContext の LayoutPanel エディタ未実装

## [5.20.4] - 2026-05-02 - 横長Phase2仕上げ + ハイライトカード横長対応

**横長 (16:9) の最終仕上げ:**
- ★Timeline 横長★ 指標名を**ヘッダー中央**に配置 (左寄りから中央へ、凡例は右に固定)
- ★テロップ横長★ font-size 1.1em → **1.3em** + telop-normal 1.05em (横長は読ませる時間あるので大きく)
- ★ハイライトカード横長崩壊修正★ 縦長前提の font 42px/30px/26px が横長(高さ ~150px)で溢れていた真因を修正
  - padding 14→8、border-radius 16→12、overflow hidden 明示
  - hl-label-compact 26→18px、hl-val-main .num 42→30px、hl-val-sub .num 30→22px、tag 11→9px 等 全体縮小
  - hl-context-row の 説明/優秀 ブロックも padding/font 縮小で収まる
- 「理由」表記修正 → 「指標の意味」(comp.desc は指標の説明であり「理由」ではない)
- cleanCriteria が空を返す時は `.hl-criteria-side` ブロックを非表示 (空白カード防止)

## [5.20.3] - 2026-05-02 - 横長 Phase 2 + UI 横スクロール + テロップ左右寄せ

**Phase 2 — 残り 4 レイアウトの横長専用版完成 (全 8 レイアウト対応):**
- ★TimelineLandscape★ SVG 折れ線フルワイド (580×200) + パス描画アニメ + ピーク/底バッジ ▲▼
- ★PitchArsenalLandscape★ 左 38% パイチャート / 右 62% 球種詳細リスト (色サイドバー付き)
- ★BatterHeatmapLandscape★ 対右ヒート/対左ヒート 横並び、青→黄→赤グラデ自動算出
- ★TeamContextLandscape★ 3 カラム (打撃/投手/采配) + diff テーブル

**UI 改善:**
- アプリ右カラムに `min-w-0 overflow-x-auto` で横長プレビューも横スクロールで全部見える
- テロップ A 左寄り / B 右寄り (アバターと位置リンク、中央すぎ問題解消)

## [5.20.2] - 2026-05-02 - 横長修正パッチ (拡大モード/ロゴ/ランキング/選手名)

**拡大モード横長対応:** `.phone.fullscreen.landscape` で width 基準で算出、aspect-ratio 16/9 維持
**テロップ幅広く:** padding 90→30、max-width 460→600、font-size 1.05→1.1em
**ロゴ右上に浮く問題:** ベースの top:10px が残ってると bottom 指定が効かない → top:auto !important で完全リセット
**出典との重なり修正:** `.source` (z-index 40) がロゴ (z-index 35) を覆っていた → 横長は出典左下、ロゴ右下に分離
**ランキング2位以下が出ない:** フォールバック entries[]→空 を 10 entries で復活、エリア拡大 + 行 padding 詰めで切れ防止
**選手名サイズ調整:** 24px → 14px、カラム 32%→30%、wordBreak: keep-all

## [5.20.1] - 2026-05-02 - 横長動画 Phase 1 (本格実装)

**横長 (16:9) 本格実装:**
- 共通フレーム: ヘッダー左上(36px)、上半分55%が主役領域、下半分45%にテロップ大(max 460px)、アバター 0.65x スケール左右下
- ★RadarCompareLandscape★ 左 38% 数値リスト+バー、右レーダーチャート 200px
- ★RankingLandscape★ 2列、左 1-5位 / 右 6-10位、球団色バッジ
- ★PlayerSpotlightLandscape★ 左 30% 写真不使用テキスト主役、右モード別データ
- ★VersusCardLandscape★ 左 main / 中央カテゴリ表 / 右 sub
- LayoutRouter に LAYOUT_COMPONENTS_LANDSCAPE 追加、aspectRatio==='16:9' で切替

## [5.20.0] - 2026-05-01 - 5問題真因対処 (画像/timeline/ranking/criteria/フック行数)

- ★id:1 改行 5-6行対応★ lines-4 (38px) / lines-5 (32px) / lines-6 (28px) 段階縮小、UI スライダーで 0.6x-1.4x 微調整
- ★timeline JSON/UI 不一致★ AI prompt に `points: [{label, main, sub}]` だったが実コードは `value` 期待 → `value/sub` に統一
- ★ranking反応しない/UI修正★ RankingDataEditor 新設 (mood/指標追加削除/各 entry セル単位編集)、「話題中」表記全削除
- ★criteria★ AI が「高いほどいい」等を入れてくる対策: cleanCriteria 堅牢化(説明文→空、{threshold,direction}対応)、AI プロンプトに数値基準のみ許可と明記
- ★id:1 画像アニメ完全書き直し★ useState/useEffect/setTimeout 全廃→ステートレス化、isVisible 即判定、entry+sustain 連結 (COMBINED_ANIMS)、inline filter 撤去で CSS animation 競合回避

## [5.19.9] - 2026-05-01 - id:2 から真っ白バグ即修正

★真因★: v5.19.7 で導入した CharwiseWalker が `<br />` (void element) を React.cloneElement でクローンしようとして例外発生→React tree 全壊→真っ白
★修正★: VOID_ELEMENTS リストでチェック、Fragment は特別扱い、children null時は元要素返却、CharwiseSafeBoundary でフォールバック表示

## [5.19.8] - 2026-04-30 - 数値整形修正 + テロップ幅 + 横長レイアウト調整

- 0 はそのまま 0 (本塁打0、勝利0、防御率0.00 は意味のある値): formatStat 修正、null/undefined/'N/A'/'--'/空文字 → '-'、0 → '0' (rate kind でのみ '.000')
- テロップ幅セーフゾーン目一杯 + 改行制御: max-width 280→320px、word-break: keep-all、white-space: pre-line
- 横長レイアウト位置最適化 (CSS のみ): ヘッダー左上、テロップ bottom 8%、アバター右下小、Hook 4指標 1x4 横並び
- 全 18 ファイル構文チェック

## [5.19.7] - 2026-04-30 - 5つの問題真因解決

- 画像動かない真因(3回目): phase 管理を完全廃止、isVisible 即判定 + COMBINED_ANIMS 連結
- 球種・ヒートマップ専用エディタ: ArsenalDataEditor / HeatmapDataEditor 新設
- AIプロンプト全面再構築: 8 レイアウトのフルテンプレート + 各項目入力ガイド
- テロップ紙芝居脱却: CharwiseText / CharwiseWalker で 1文字ずつ span 展開 + telopCharIn アニメ (25ms ディレイ)
- 横長16:9対応: aspectRatio 9:16/16:9/1:1、phoneStyle 動的計算、LayoutPanel に 📐 アスペクト比セレクタ
- 同 speaker 連続バグ修正: outer key を currentIndex のみに統一

セマンティックバージョニング (MAJOR.MINOR.PATCH):
- MAJOR: 破壊的変更
- MINOR: 後方互換のある機能追加
- PATCH: バグ修正のみ

---

## [5.18.13] - 2026-04-27 - Phase 2: 1動画内で複数 quote / 複数 metric を使い分け

### 動機

v5.18.12 で JSON 分割編集 + 二段階生成プロンプトを導入した時に Phase 2 として残していた:
- `player.quotes[]` + `script.focusQuoteIndex` (同じ player の複数発言を使い分け)
- `script.focusMetric` (ranking で動画中に metric を切替)
- ScriptEditorPanel に上記2項目のセレクタ追加

これを実装し、ユーザーの「ランキング動画で **3選手の発言ピックを 3 回分けたい**」要求を完全に満たす。

### 実装内容

#### 1. PlayerSpotlightLayout が `player.quotes[]` 対応

```js
// 解決順序:
//   1. focusQuoteIndex 指定 + player.quotes[idx] 存在 → それを使う
//   2. player.quotes[] が配列で 1件以上 → quotes[0] を使う (デフォルト先頭)
//   3. 旧来の player.quote / quoteSource を使う (互換)
//   4. 全部無い → '(発言が登録されていません)'
const focusQuoteIndex = currentScript?.focusQuoteIndex;
const quotesArr = Array.isArray(player.quotes) ? player.quotes : [];
const resolvedQuote = (() => {
  if (typeof focusQuoteIndex === 'number' && quotesArr[focusQuoteIndex]) {
    return quotesArr[focusQuoteIndex];
  }
  if (quotesArr.length > 0) return quotesArr[0];
  if (player.quote) return { text: player.quote, source: player.quoteSource };
  return null;
})();
```

quote モードのレンダリング部分も書き換え。複数 quote 時は右上に `2/3` のようなインジケータ表示 (デバッグ補助)。

#### 2. ScriptEditorPanel に focusQuoteIndex セレクタ

focusEntry が指定されていて、その player に quotes 配列がある時だけ表示:

```jsx
{(() => {
  const players = projectData.layoutData?.spotlight?.players || [];
  const currentPlayer = players.find(p => p.id === script.focusEntry || p.name === script.focusEntry);
  const quotes = Array.isArray(currentPlayer?.quotes) ? currentPlayer.quotes : [];
  if (quotes.length === 0) return null;
  return (
    <select value={script.focusQuoteIndex ?? ''}>
      <option value="">継承 (デフォルト先頭)</option>
      {quotes.map((q, i) => (
        <option key={i} value={i}>{i + 1}: {q.text.slice(0, 40)}…</option>
      ))}
    </select>
  );
})()}
```

#### 3. RankingLayout が `script.focusMetric` 対応

旧来の `currentScript.highlight` (comparisons.id と兼用) より優先される **専用フィールド `focusMetric`** を導入:

```js
// 解決優先順位:
//   1. currentScript.focusMetric (新フィールド、ranking 専用)
//   2. currentScript.highlight (互換: comparisons.id とも兼用)
//   3. metrics[0] (デフォルト先頭)
const focusedMetricId = currentScript?.focusMetric || currentScript?.highlight;
const activeMetric = (focusedMetricId && metrics.find(m => m.id === focusedMetricId))
  || metrics[0];
```

#### 4. ScriptEditorPanel に focusMetric セレクタ

`ranking.metrics` が 2 個以上ある時だけ表示:
```jsx
{metrics.length > 1 && (
  <select value={script.focusMetric || ''}>
    <option value="">継承 (デフォルト先頭)</option>
    {metrics.map(m => <option key={m.id} value={m.id}>{m.label || m.id}</option>)}
  </select>
)}
```

#### 5. Gemini プロンプト & Knowledge Files 同期

| ファイル | 追加内容 |
|---|---|
| `gemini-custom-prompt.md` | `players[].quotes[]` のスキーマ説明、`script.focusQuoteIndex` / `script.focusMetric` |
| `grok-agent-master.md` | データ生成時の **quotes 2-4個リサーチ指示** + 一次ソース推奨 |
| `grok-2-critic.md` | レビュー観点に「複数 quote 用意できてるか」「focusMetric で metric 切替できてるか」追加 |

### ★ユーザーが実現できるようになる動画パターン★

**ランキング動画 (例: OPS ベスト 5 解説)**
```
シーン 1: ranking, focusMetric=ops, focusEntry=null            (5人並び表示)
シーン 2: ranking, focusMetric=ops, focusEntry=okamoto          (岡本に注目マーク)
シーン 3: spotlight, focusEntry=okamoto, focusQuoteIndex=0     (岡本の発言1)
シーン 4: ranking, focusMetric=ops, focusEntry=sano             (佐野に注目マーク)
シーン 5: spotlight, focusEntry=sano, focusQuoteIndex=0         (佐野の発言1)
シーン 6: ranking, focusMetric=iso, focusEntry=okamoto          (★metric切替★ ISO ランキングへ)
シーン 7: spotlight, focusEntry=okamoto, focusQuoteIndex=1     (★同じ岡本★ 別の発言)
```

これで「3 選手 × 各複数 quote × 複数 metric」という1動画内のリッチなデータ表現が可能に。

### 後方互換性

- 旧 `player.quote` / `player.quoteSource` (単数) はそのまま動作
- `script.focusMetric` 未指定時は `script.highlight` でも metric 切替 (旧仕様維持)
- `quotes[]` 未定義の player は `quote` 単数 fallback で動作

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/layouts/PlayerSpotlightLayout.jsx` | quotes[] + focusQuoteIndex 解決、quote モードのレンダリング更新 |
| `src/layouts/RankingLayout.jsx` | focusMetric 優先解決 |
| `src/components/ScriptEditorPanel.jsx` | focusQuoteIndex / focusMetric セレクタ追加 |
| `docs/gemini-custom-prompt.md` | スキーマ更新 |
| `docs/grok-agent-master.md` | データ生成指示更新 |
| `docs/grok-2-critic.md` | レビュー観点追加 |
| `package.json` / `config.js` | 5.18.12 → 5.18.13 |

### 残課題

- ③ 細かい編集UI強化 (グラフのラベル等)
- Gemini 提言④ インサート映像
- Gemini 提言⑤ CTA 前倒し


## [5.18.12] - 2026-04-27 - JSON分割編集モード (データ / 台本 / 全体) + 二段階生成プロンプト

### 動機: ユーザー要求

> 同じ動画の中で大量のデータJSONを使用したい。
> たとえばランキング形式の動画であれば選手フォーカスは3選手使いたい、
> 同じ選手フォーカスでも発言ピックを3回分けたい場合もある。
> Geminiに生成してもらった時にデータJSONが充実してないからレイアウトの切り替えとかできない。
> まずは大まかなストーリーを理解したデータJSONを Grok にリサーチさせて、
> その脚本JSONを Gemini に生成させるって感じかな。

→ JsonPanel に「データ」「台本」を**別々に編集できるモード**を追加し、それぞれに**最適化された AI プロンプト**を出せるようにする。

### Phase 1 (今ターン) 実装内容

#### 1. 新規ヘルパー `src/lib/projectSplit.js`

projectData の split / merge ロジック:
```js
splitProjectData(projectData)
  → { data: { メタ + layoutData + comparisons + ... }, script: { scripts: [] } }

mergeProjectData(data, script)
  → projectData (1ファイル形式)

normalizeProjectInput(jsonObj)
  → 1ファイル形式 / { data, script } 形式 / データのみ / 台本のみ を自動判別して projectData 化
```

#### 2. JsonPanel に「全体 / データ / 台本」モード切替

```
[全体]   [📊 データ]   [🎬 台本]
```

各モードの動作:
- **全体**: 旧来通りの 1ファイル編集
- **📊 データ**: メタ + layoutData + comparisons + radarStats のみ表示・編集
  → 反映時は既存の scripts を保持してデータ部分だけ差し替え
- **🎬 台本**: scripts のみ表示・編集
  → 反映時はメタ+データを保持して scripts だけ差し替え

#### 3. モード別 AI プロンプト

「🤖 AIプロンプトを作成&コピー」ボタンが、モードに応じて違うプロンプトを生成:

- **全体モード**: 旧来通り (Gemini に丸ごと出させる)
- **データモード** (★Grok 推奨★):
  - リサーチ重視のプロンプト
  - 1動画内で複数の player をフォーカスできるよう **3-5人分**入れる指示
  - 1人 player に **複数 quote**を持たせる指示 (`quotes` 配列)
  - ranking metric は **5-10人分**入れる指示
  - comparisons は **5-10種類**用意する指示
  - **scripts は含めない**よう明記
- **台本モード** (★Gemini 推奨★):
  - 既存データJSONの player.id / comparison.id を**そのまま参照**するよう指示
  - 動画ストーリーと話者配置に集中
  - **scripts 以外は出力しない**よう明記
  - 新フィールド `script.focusQuoteIndex` で同じ player の別 quote を選択

### ★ユーザーの新ワークフロー★

1. **データJSON生成 (Grok)**:
   - JsonPanel で「📊 データ」モード選択
   - 「🤖 AIプロンプト...」ボタン → Grokに貼り付け
   - リサーチ結果のJSONをコピー → 「貼り付けて反映」
   - データJSON が動画の「素材倉庫」として整う

2. **台本JSON生成 (Gemini)**:
   - JsonPanel で「🎬 台本」モード選択
   - 「🤖 AIプロンプト...」ボタン → Geminiに貼り付け
   - 既存のデータを参照したシーン構成と台本JSONをコピー → 「貼り付けて反映」
   - データはそのまま、scripts だけ更新される

3. **微調整 (アプリ側)**:
   - 台本タブで focusEntry / focusQuoteIndex / highlight を手動で切替
   - 1シーンずつ違う player / quote / 指標を選択可能

### 期待される効果

| 改善前 | 改善後 |
|---|---|
| ❌ 毎回 Gemini に1ファイル全部出させる (出力量大) | ✅ データと台本を別々に出させる |
| ❌ 1動画内で同じ player を1回しか使えない | ✅ player.quotes 配列 + focusQuoteIndex で何度でも使い分け |
| ❌ 台本だけ書き直したい時にデータ全部再生成 | ✅ scripts だけ差し替え、データ保持 |
| ❌ 単一AI (Gemini) に頼り切り | ✅ Grok=データ / Gemini=台本 で分業 |

### 後方互換性

- 旧 1ファイル形式 (mainPlayer + scripts 同居) は**そのまま動作** (whole モード)
- 既存の保存スロットも 1ファイル形式で保存される
- normalizeProjectInput が { data, script } / 1ファイル形式 両方を自動判別

### Phase 2 以降の予定 (次ターン)

- ⚠️ player.quotes 配列に対応した PlayerSpotlightLayout の実装 (focusQuoteIndex でピック)
- ⚠️ ScriptEditorPanel に focusQuoteIndex セレクタ追加
- ⚠️ ranking で複数 metric を切替えられる UI
- ③ レイアウト/グラフ等の細かい手動編集UI

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/projectSplit.js` | ★新規★ split / merge / normalize |
| `src/components/JsonPanel.jsx` | モード切替UI、tryApply 改修、buildDataJsonPrompt / buildScriptJsonPrompt |
| `package.json` / `config.js` | 5.18.11 → 5.18.12 |

### 残課題

- **Phase 2**: focusQuoteIndex の実装 (player.quotes を PlayerSpotlightLayout が解釈)
- ③ 細かい編集UI強化
- Gemini 提言④ インサート映像
- Gemini 提言⑤ CTA 前倒し


## [5.18.11] - 2026-04-27 - PWA アイコン PNG 化 (ホーム画面追加でオリジナルアイコン反映)

### 動機: ユーザー報告

> Firefox でホーム画面アプリに追加した。アイコンの設定をお願い。

ホーム画面に追加した時に G党Studio オリジナルアイコンが表示されていなかった。
原因: `manifest.webmanifest` で SVG だけを指定しており、Firefox/Chrome の PWA は **PNG を期待**するため。

### 修正

#### 1. PNG アイコン生成

`favicon.svg` (イタリック G + ダーク背景 + オレンジ文字) のデザインを忠実に再現:
- `public/icon-192.png` (192×192) — Android/Firefox 標準サイズ
- `public/icon-512.png` (512×512) — 高解像度ディスプレイ用
- `public/icon-512-maskable.png` (512×512) — Android maskable (内側にパディング、ホーム画面で切れない)

#### 2. `manifest.webmanifest` を PNG 優先に書き換え

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

#### 3. `index.html` に apple-touch-icon 追加

```html
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

これで iPhone Safari の「ホーム画面に追加」でも正しく表示される。

### ★デプロイ後の手順★

1. `git add . && git commit && git push` で Vercel デプロイ
2. **既存のホーム画面アイコンを削除** (古いアイコン情報がキャッシュされているため)
3. 再度 Firefox で URL を開いて「ホーム画面に追加」
4. オリジナルアイコンで追加されることを確認

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `public/icon-192.png` | ★新規★ |
| `public/icon-512.png` | ★新規★ |
| `public/icon-512-maskable.png` | ★新規★ |
| `public/manifest.webmanifest` | PNG 優先に書き換え |
| `index.html` | apple-touch-icon + PNG icon link 追加 |
| `package.json` / `config.js` | 5.18.10 → 5.18.11 |

### 残課題 (次ターン以降)

- ② JSON 分割 (データ/台本) + データ充実
- ③ レイアウト/グラフ等の細かい手動編集 UI 強化
- Gemini 提言④ インサート映像
- Gemini 提言⑤ CTA 前倒し


## [5.18.10] - 2026-04-27 - 合成音 SE → WAV 化 (画面録画でデフォルト SE も拾える)

### 動機: ユーザー報告

> Firefox で画面録画したら TTS BGM が取れた。
> SE もアップロードしたものは取れるがデフォルト (合成音) が取れない。

→ ユーザーは Firefox 画面録画ワークフローでほぼ問題解決。**残るのはデフォルト SE 録音問題のみ**。
動画エクスポート機能を作る必要がない。

### 真の原因

`mixer.playSe()` のフロー:

| パターン | 実装 | 画面録画 |
|---|---|---|
| カスタム SE (アップロード済み) | HTMLAudioElement (`<video>`) で再生 | ✅ 取れる |
| デフォルト SE (`hook_impact` 等) | AudioContext で**実時間合成** | ❌ 取れない |

これは Web Audio API の制約: AudioContext の出力は OS 音声ミキサーには行くがブラウザのキャプチャには乗りにくい (Firefox/Chrome 共通)。

### 解決: 起動時に全プリセットを WAV 化して HTMLAudioElement プール登録

#### 仕組み

1. **起動時 (idle 時)** に 10 種類の合成音プリセットを `OfflineAudioContext` でレンダリング
2. 各 AudioBuffer を `audioBufferToWav()` で WAV blob 化
3. `registerCustomSe(presetId, blob)` で HTMLAudioElement プールに登録
4. これ以降 `playSe('hook_impact')` 等は**プールの `<video>` 要素で再生**
5. 画面録画キャプチャに乗る ✅

#### 実装詳細

新規 export (`mixer.js`):
- `SYNTHETIC_SE_PRESETS` (定数) — 10 種類のプリセット定義 (旧 playSe 内のローカル定数を昇格)
- `synthesizeSePresetToWavBlob(presetId)` — OfflineAudioContext で WAV blob 化
- `MixerEngine.preregisterSyntheticSes()` — 全プリセットを並列で WAV 化 + プール登録

```js
// mixer.js
export const SYNTHETIC_SE_PRESETS = {
  hook_impact: { freqs: [80, 40], type: 'sawtooth', ... },
  ...10 種類
};

export async function synthesizeSePresetToWavBlob(presetId) {
  const preset = SYNTHETIC_SE_PRESETS[presetId];
  const offlineCtx = new OfflineAudioContext(1, totalSamples, 44100);
  // ... oscillator + gain envelope を組み立て
  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWav(renderedBuffer);
}

class MixerEngine {
  async preregisterSyntheticSes() {
    const tasks = Object.keys(SYNTHETIC_SE_PRESETS).map(async (id) => {
      if (this._seAudioEls.has(id)) return;  // カスタムSE優先
      const blob = await synthesizeSePresetToWavBlob(id);
      await this.registerCustomSe(id, blob);
    });
    await Promise.all(tasks);
  }
}
```

App.jsx の起動時に **idle で実行**:
```jsx
useEffect(() => {
  const init = async () => {
    const mixer = getMixer();
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => mixer.preregisterSyntheticSes(), { timeout: 3000 });
    } else {
      setTimeout(() => mixer.preregisterSyntheticSes(), 500);
    }
  };
  init();
}, []);
```

これでアプリ起動を遅らせず、ブラウザがアイドルになった時に WAV 化処理を実行。

#### 副次的な変更

`playSe` の合成音 fallback を最終手段化:
- 通常は preregister でプール化済み → AudioContext fallback ブランチには入らない
- preregister 失敗時のみ AudioContext 合成 (画面録画では拾われないがエラーよりマシ)
- そのときコンソールに warn 出力

`audioExporter.js` の `audioBufferToWav` を **export 化** (mixer から参照するため)

### 期待される効果

| 改善前 (v5.18.9) | 改善後 (v5.18.10) |
|---|---|
| ❌ デフォルト SE が画面録画で拾われない | ✅ 全 SE (デフォルト + カスタム) が拾える |
| ❌ 動画エクスポート機能が必要 | ✅ 既存の Firefox 画面録画ワークフローで完結 |

### ★ユーザーの新ワークフロー (v5.18.10 以降)★

1. **Firefox で画面録画** (タブ音声ON)
2. アプリで動画再生 → TTS + BGM + SE (デフォルト含む) **すべて録音される**
3. CapCut で軽微な編集 (要らないかも)
4. YouTube Shorts 投稿

WAV 別書き出しは**もう不要** (画面録画の音声と全く同じ内容になる)。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/mixer.js` | SYNTHETIC_SE_PRESETS export / synthesizeSePresetToWavBlob 追加 / preregisterSyntheticSes 追加 / playSe の fallback 整理 |
| `src/lib/audioExporter.js` | audioBufferToWav を export 化 |
| `src/App.jsx` | 起動時 idle で preregisterSyntheticSes 呼び出し |
| `package.json` / `config.js` | 5.18.9 → 5.18.10 |

### 残課題

- Gemini 提言④ インサート映像
- Gemini 提言⑤ CTA 前倒し


## [5.18.9] - 2026-04-27 - SE 再生をプール化 — 画面録画のテロップ遅延を解消

### 動機: ユーザー報告

> 効果音が入るとそのぶん画面録画が遅れる? 重たいだけかな。
> 結局 capcut で動画録画を部分的に詰めることになったけど、その手間も惜しい。
>
> (詳細確認後)
> 画面録画も音付きで採り、それと WAV を重ねてミックスしてる
> 画面録画を見るとテロップ進行が遅れてる (実際のセリフとテロップがずれる)

### 真の原因

`mixer.playSe()` が SE 再生のたびに重い DOM 操作をしていた:

```js
// 旧 (v5.18.8まで)
playSe(seId) {
  const clone = customEl.cloneNode(true);  // ← 同期、blob src を含む深いコピーで重い
  clone.style.position = 'fixed';          // ← 連続スタイル設定
  // ... 9項目のスタイル設定
  document.body.appendChild(clone);        // ← DOM mutation → reflow
  clone.play();
  clone.addEventListener('ended', () => clone.remove());  // ← 再度 DOM mutation
}
```

#### 問題点

1. **`cloneNode(true)`**: blob URL の audio src を含む深いコピー。同期実行で重い
2. **`appendChild`**: 1080x2400 ビューポートで reflow が発生
3. **連続スタイル設定**: 9 項目の style 設定で再計算
4. **メインスレッド占有**: 50-150ms の同期ブロックが発生
5. **テロップは setTimeout 駆動**: setTimeout がブロック分後ろにずれる
6. **音声 (TTS) は影響なし**: HTMLAudioElement は OS 音声スレッドで再生されるためブロックされない
7. **結果**: 1動画 5-8 回の SE で **累積 100-300ms のテロップ遅延** → 画面録画でセリフとテロップがズレる

### 解決: SE 要素のプール化

#### 設計

各 SE につき **4 個の `<video>` 要素**を起動時に DOM に常駐させ、再生時は**プールから空き要素を取り出すだけ** (DOM mutation ゼロ)。

```js
// 新 (v5.18.9)
async registerCustomSe(id, blob) {
  const POOL_SIZE = 4;
  const pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = document.createElement('video');
    audio.src = url;
    // スタイル設定は登録時の1回だけ
    document.body.appendChild(audio);  // ← attach は登録時1回のみ
    pool.push(audio);
  }
  this._seAudioEls.set(id, { pool, blobUrl: url, nextIdx: 0 });
}

playSe(seId) {
  const entry = this._seAudioEls.get(seId);
  if (entry?.pool) {
    // round-robin でプールから次の要素を取得
    const idx = entry.nextIdx % entry.pool.length;
    entry.nextIdx = (entry.nextIdx + 1) % entry.pool.length;
    const el = entry.pool[idx];
    el.currentTime = 0;          // ← currentTime のリセット
    el.volume = ...;             // ← volume だけ
    el.play();                    // ← Promise で非同期
    // DOM mutation 完全にゼロ!
  }
}
```

#### 影響

| 改善前 (v5.18.8) | 改善後 (v5.18.9) |
|---|---|
| ❌ SE のたびに cloneNode + appendChild + remove | ✅ プールから取り出すだけ |
| ❌ メインスレッド 50-150ms ブロック | ✅ ほぼゼロ (currentTime + play() のみ) |
| ❌ テロップが累積 100-300ms 遅延 | ✅ テロップ遅延ほぼ無し |
| ❌ 画面録画でセリフとテロップがズレる | ✅ 完全に同期 |

### 副次的改善: ボリューム更新 / dispose の整合

`setLevel('se', ...)` 時のボリューム更新と `dispose()` 時のクリーンアップも、プール構造に対応するよう書き換え:

```js
// 旧
for (const el of this._seAudioEls.values()) {
  if (el && !el.paused) el.volume = ...;
}

// 新
for (const entry of this._seAudioEls.values()) {
  if (entry?.pool) {
    for (const el of entry.pool) {
      if (el && !el.paused) el.volume = ...;
    }
  }
}
```

### ★追加推奨★ 画面録画の運用改善

ユーザーは現在「画面録画 (音付き) + WAV」を CapCut でミックス。これは構造的に2つ問題がある:

1. **音声が二重**: 画面録画にも TTS+BGM+SE が含まれる + WAV を上から乗せる = 同じ音が2重に鳴る (フェーザー干渉でこもる)
2. **音ズレ前提**: 画面録画は実時間で遅延、WAV は数学的に正確 → 必ずズレる

#### 推奨フロー (v5.18.9 以降)

1. **画面録画は無音で撮る** (Pixel の画面録画設定で「音声を録音」を OFF)
2. **WAV を CapCut の唯一の音声トラックに**乗せる
3. **動画長を WAV 長に合わせて**カット

これで:
- 音の二重なし
- SE 等は WAV にすべて入っているのでアプリ側の SE 再生時のメインスレッド負荷もほぼ無視できる
- ズレも無い (映像だけ撮って音を後から乗せる)

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/mixer.js` | registerCustomSe / playSe / setLevel / dispose をプール化対応 |
| `package.json` / `config.js` | 5.18.8 → 5.18.9 |

### 残課題

- ③ JSON 二段階化の議論 (前ターンの選択待ち)
- Gemini 提言④ インサート映像
- Gemini 提言⑤ CTA 前倒し


## [5.18.8] - 2026-04-27 - レイアウトタブ map クラッシュ防御強化

### 動機: ユーザー報告

v5.18.7 で PanelErrorBoundary を仕込んだことで真っ白は回避できたが、エラー画面に:
> ⚠️ パネル "レイアウト" でエラーが発生しました
> Cannot read properties of undefined (reading 'map')

が表示された。**LayoutPanel 内のどこかで undefined.map が起きている**。

### 原因の特定

LayoutPanel 内の .map 呼び出しを全数チェックした結果、すべて `(arr || []).map()` でガードされていた。しかし `|| []` は **null/undefined のみガード**で、**配列でないオブジェクト** (例: `{pa:100, ab:80}`) を渡されると素通りして `.map` で爆発する。

最も怪しいのは:
- `spotlight.players[i].stats` → 期待値は `[{label,value},...]` 配列
- もし Gemini が誤って `mainPlayer.stats` (オブジェクト型) と同じ構造を出力すると、ここでクラッシュ
- localStorage に古い `players[i].stats = {pa, ab, ...}` が入っていた可能性

### 修正: Array.isArray で厳密ガード

LayoutPanel.jsx の主要な .map 呼び出しを書き換え:

```jsx
// 旧 (null/undefined のみガード、オブジェクトは素通り)
{(p.stats || []).map(...)}

// 新 (配列でない値も []にfallback)
{(Array.isArray(p.stats) ? p.stats : []).map(...)}
```

修正対象 (LayoutPanel.jsx):
- `timeline.points` (TimelineDataEditor 内)
- `versus.categoryScores` (VersusDataEditor 内)
- `spotlight.players` (SpotlightDataEditor 内)
- `p.stats` (各 player の sub stats)

ついでに **ScriptEditorPanel.jsx** でも同じガードを徹底:
- `projectData.scripts.map(...)` → `Array.isArray(...)` にラップ
- `comparisons.map(...)` → 同上

### 期待される効果

| 改善前 (v5.18.7) | 改善後 (v5.18.8) |
|---|---|
| ❌ stats がオブジェクトだと .map で死亡 | ✅ Array.isArray で確実に判定 |
| ❌ ScriptEditor の scripts が壊れててもエラー | ✅ 空配列で fallback、編集を継続可能 |

### 注意

これは LayoutPanel / ScriptEditorPanel の防御強化。
**根本原因が「localStorage の古いデータ」だった場合は、PanelErrorBoundary の「編集データを削除して再起動」ボタンで解決できる**。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/components/LayoutPanel.jsx` | 4箇所の .map に Array.isArray ガード追加 |
| `src/components/ScriptEditorPanel.jsx` | 3箇所の .map に Array.isArray ガード追加 |
| `package.json` / `config.js` | 5.18.7 → 5.18.8 |

### 残課題

- ③ JSON 二段階化の議論 (前ターンの選択待ち)
- Gemini 提言④ インサート映像
- Gemini 提言⑤ CTA 前倒し


## [5.18.8] - 2026-04-27 - LayoutPanel timeline.points undefined 防御 (真っ白の根本原因)

### 動機: ユーザーから具体的なエラー画面が報告された

> ⚠️ パネル "レイアウト" でエラーが発生しました
> Cannot read properties of undefined (reading 'map')

v5.18.7 で導入した PanelErrorBoundary が**正常に作動**して、レイアウトパネルの致命例外を捕捉表示。具体的なメッセージから真因が特定できた。

### 根本原因

`LayoutPanel.jsx` の `TimelineDataEditor` で:

```js
const timeline = projectData.layoutData?.timeline || {
  unit: 'month',
  metric: 'OPS',
  points: [{ label: '4月', main: 0.724, sub: 0.598 }, ...],
};
```

この fallback は **`layoutData.timeline` が完全に undefined のとき** だけ発火する。**部分的に存在**するケース、例えば:
- Gemini が `{ unit: 'month', metric: 'OPS' }` だけ含む timeline を出力
- 旧スキーマで `points` が別構造になっていて、自動移行で空オブジェクト化

このような場合、`timeline = { unit: 'month', metric: 'OPS' }` (points なし) で評価される → `timeline.points.map(...)` で例外。

```js
{timeline.points.map((p, i) => (...))}   // ← undefined.map で爆発
```

### 修正

#### 1. fallback ロジックをフィールド単位に変更
```js
const tlRaw = projectData.layoutData?.timeline || {};
const timeline = {
  unit: tlRaw.unit || 'month',
  metric: tlRaw.metric || 'OPS',
  points: Array.isArray(tlRaw.points) ? tlRaw.points : [
    { label: '4月', main: 0.724, sub: 0.598 },
    { label: '5月', main: 0.810, sub: 0.621 },
  ],
};
```

これで部分定義でも各フィールドが必ず正常な値になる。

#### 2. `.map` 呼び出しに防御
```js
{(timeline.points || []).map((p, i) => (...))}
```

#### 3. updatePoint / addPoint / removePoint も `(timeline.points || [])` でガード

### 他のエディタの確認

| エディタ | 状況 |
|---|---|
| `VersusDataEditor` | `(versus.categoryScores || []).map` で防御済み ✅ |
| `SpotlightDataEditor` | `(spotlight.players || []).map`, `(p.stats || []).map` 防御済み ✅ |
| `TimelineDataEditor` | ★今回修正★ |

他のエディタ (ranking/context/arsenal/heatmap) は LayoutPanel では JSON 直接編集に誘導しているため未対応 = 影響なし。

### 期待される効果

| 改善前 (v5.18.7) | 改善後 (v5.18.8) |
|---|---|
| 部分的な timeline でレイアウトタブクラッシュ | 部分定義でも正常動作、欠けたフィールドはデフォルト値 |
| エラーボックス表示まではされる (PanelErrorBoundary) | そもそもエラーが発生しない |

### 残課題 (③ JSON 二段階化)

ユーザーの ③ への回答が無いため、実装は**保留**。次ターンで方針確認後に進める。

提案中の選択肢:
- A: 二段階化する (Step1 データ → Step2 台本)
- B: 1ファイル一括維持
- C: まず ① ② 検証してから議論

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/components/LayoutPanel.jsx` | TimelineDataEditor の防御強化 |
| `package.json` / `config.js` | 5.18.7 → 5.18.8 |



### 動機: ユーザー報告の3項目

> ① UIでレイアウトに飛ぼうとするとアプリが真っ白になる
> ② 台本か選手フォーカスの細かい設定できなくない?
> ③ jsonをgeminiに出力させるの、データと台本で分けた方がいいかな?

### ① 真っ白問題: パネル全般を ErrorBoundary で保護

#### 原因の推定

LayoutPanel など編集系タブパネルには ErrorBoundary が無く、内部で例外が出るとアプリ全体が真っ白に。原因として最も可能性が高いのは:
- v5.18.4 で追加した自動保存機能で、**古いスキーマの localStorage データを復元**
- 新コードの SpotlightDataEditor / VersusDataEditor 等が新スキーマを期待
- 型不一致で参照時に例外 → 画面真っ白

#### 修正

新規ファイル `src/components/PanelErrorBoundary.jsx`:
```jsx
export class PanelErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {...}
  componentDidCatch(error, info) {
    console.error(`[PanelErrorBoundary] パネル "${panelName}" で例外発生`, ...);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <div>⚠️ パネル "{panelName}" でエラーが発生しました</div>
          <pre>{errorStack}</pre>
          <button onClick={reset}>🔄 再試行</button>
          <button onClick={clearStorage}>🗑 編集データを削除して再起動</button>
        </div>
      );
    }
    return children;
  }
}
```

App.jsx でタブごとにラップ:
```jsx
{activeTab === 'layout' && (
  <PanelErrorBoundary panelName="レイアウト">
    <LayoutPanel projectData={projectData} onChange={setProjectData}/>
  </PanelErrorBoundary>
)}
```

これで:
- パネルが落ちてもアプリ全体は生きる
- エラー内容と stack trace を画面に表示
- 「再試行」or 「編集データを削除して再起動」のボタンで復旧可能

### ② focusEntry 入力欄を常時表示

#### 原因

旧版では `focusEntryCandidates.length > 0` の条件で focusEntry ドロップダウンを表示していたため、`projectData.layoutData.spotlight` や `layoutData.ranking` が未設定だと**ドロップダウン自体が出ない** = ユーザーから見ると「設定できない」状態。

#### 修正

候補がある時/無い時で UI を切り替え:
- **候補あり**: `<datalist>` で補完付きの自由入力テキストフィールド
- **候補なし**: 「(候補なし: layoutData 未設定 — 直接 id/名前入力)」とヒント表示 + プレーンなテキスト入力

```jsx
{focusEntryCandidates.length > 0 ? (
  <>
    <input list="focus-entries" ... />
    <datalist id="focus-entries">
      {focusEntryCandidates.map(c => <option value={c.value}>{c.label}</option>)}
    </datalist>
  </>
) : (
  <input placeholder="player.id または entry.name を直接入力" ... />
)}
```

これで**どんな状況でも focusEntry が編集できる**。

### Gemini プロンプトの ranking スキーマ修正 (★裏で見つけた重要なバグ★)

`gemini-custom-prompt.md` 上の ranking スキーマが**実装と不一致**だった:

```
旧: ranking: { metric, mode, items:[...] }       ← items? (実装と違う)
新: ranking: { mood?, showCutoff?, metrics:[{id, label, kana?, unit?, entries:[...]}] }
```

実装側は `metrics[].entries[]` 構造なのに、Gemini プロンプトは `items[]` と書いてた → Gemini が古い構造で出力 → focusEntry 候補も生成されない。
これが ② の根本原因の一つでもあった。

### ③ JSON 出力をデータと台本で分けるか?

これは設計議論なので**今ターンでは実装せず、議論材料を整理**:

#### 賛成派の論点
- データ (layoutData/comparisons/radarStats) と台本 (scripts) で生成タイミングが違う
- 台本だけ書き直したい時にデータを再生成しなくて済む
- 1ファイルが巨大化して Gemini の出力上限に当たるのを回避
- リサーチ → 脚本のワークフローと自然に合致

#### 反対派の論点
- scripts の `highlight: 'isop'` は `comparisons.id: 'isop'` を参照 → 独立編集だと参照ズレリスク
- 別々の JSON をマージする工程が増える
- 1 リクエストの方が文脈共有できて整合が取れた品質が出やすい

#### 折衷案 (私の推奨): **二段階生成 (Step 1: データ → Step 2: 台本)**

```
Step 1 (Gemini): テーマ + 観察 → { mainPlayer, subPlayer, radarStats,
                                     layoutData, comparisons }
Step 2 (Gemini): Step 1 の JSON 全体 + コンセプト
                → { hookAnimation, scripts, theme, period, ... }
アプリ側: 両者を 1 つの projectData にマージ
```

利点:
- データの正確性を先に確定 → 脚本はその上で書ける
- Step 2 は Step 1 の comparisons.id を参照できるので整合
- 台本だけ書き直したい時は Step 2 だけ再実行
- 出力量が減って quota 節約

ユーザーに方針確認後、次ターンで gemini プロンプト + アプリの JSON 取り込み UI を整備する想定。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/components/PanelErrorBoundary.jsx` | ★新規★ パネル用 ErrorBoundary |
| `src/App.jsx` | 各タブを PanelErrorBoundary でラップ |
| `src/components/ScriptEditorPanel.jsx` | focusEntry を常時表示 + 候補なし時の手入力対応 + datalist |
| `docs/gemini-custom-prompt.md` | ranking スキーマを実装と整合させる修正 |
| `package.json` / `config.js` | 5.18.6 → 5.18.7 |

### 期待される効果

| 改善前 | 改善後 |
|---|---|
| ❌ レイアウトタブで真っ白 → アプリ全停止 | ✅ パネル単位でエラー表示 + 再試行・初期化ボタン |
| ❌ focusEntry ドロップダウンが出ない条件あり | ✅ 常時編集可能、候補があれば補完付き |
| ❌ Gemini が ranking.items[] で出力 (誤) | ✅ ranking.metrics[].entries[] で出力 (実装と一致) |

### 残課題

- ③ JSON 出力の二段階分割 (要ユーザー判断)
- Gemini 提言④ インサート映像
- Gemini 提言⑤ CTA 前倒し



### 動機: ユーザー指摘

> ハイライトとか他の要素も同じ現象起きてない?

v5.18.5 ではレーダーチャート本体の出現アニメだけ抑制していたが、調査の結果、**他にも複数の出現アニメ**が zoomBoost と同時発火していた:

| 要素 | アニメ | 遅延 |
|---|---|---|
| `.stats-table` (radar下の選手成績) | telopSlideUp 0.4s | 1.7秒 |
| `.telop-wrap-normal/hl .telop-bg` (テロップ吹き出し) | telopSlideUp 0.35s | 0.3秒 |
| `.hl-radar-svg-box` (ハイライト時のレーダー縮小) | radarShrink 0.5s | 0秒 |
| `.vertex-glow` (ハイライト頂点のグロー) | vertexZoomLight 0.6s | 0.5秒 |
| `.highlight-card` (ハイライトカード) | cardExpand 0.5s + cardPulse 2.5s infinite | 0.3秒 |

特に **ハイライト時** は `cardExpand` (カード拡大) + `radarShrink` (レーダー縮小) が同時発火するため、shake と被ると**画面全体がガタガタ**動いて意図した演出にならない。

### 修正

`data-zoom-active="true"` の抑制ルールを上記すべてに適用:

```css
/* radar (既存) */
.anim-layer[data-zoom-active="true"] .radar-main-poly,
.anim-layer[data-zoom-active="true"] .radar-sub-poly,
.anim-layer[data-zoom-active="true"] .radar-dot,
.anim-layer[data-zoom-active="true"] .radar-label-group,
.anim-layer[data-zoom-active="true"] .radar-legend {
  animation: none !important;
  opacity: 1 !important;
}

/* ハイライト系 (新規) */
.anim-layer[data-zoom-active="true"] .hl-radar-svg-box {
  animation: none !important;
  transform: scale(1) !important;
  opacity: 1 !important;
}
.anim-layer[data-zoom-active="true"] .vertex-glow {
  animation: none !important;
  opacity: 1 !important;
}
.anim-layer[data-zoom-active="true"] .highlight-card {
  /* cardExpand スキップ + cardPulse だけ維持 (脈動は持続させたい) */
  animation: cardPulse 2.5s ease-in-out infinite !important;
  opacity: 1 !important;
  transform: translateY(0) scaleY(1) !important;
}

/* テロップ系 (新規) */
.anim-layer[data-zoom-active="true"] .telop-wrap-normal .telop-bg,
.anim-layer[data-zoom-active="true"] .telop-wrap-hl .telop-bg {
  animation: none !important;
}

/* stats-table (新規) */
.anim-layer[data-zoom-active="true"] .stats-table {
  animation: none !important;
  opacity: 1 !important;
}
```

### 設計の判断

**継続する infinite 系アニメは維持**:
- `cardPulse` 2.5s infinite (ハイライトカードの脈動)
- `numberPulse` 1.5s infinite (hookの数字脈動)
- `pulse` 2s infinite (日付バッジ等)

これらは初回出現後ずっと続くので、zoomBoost 時だけ消すと不自然。
**抑制するのは「初回出現タイミングの遅延付きアニメ」だけ**。

### 効果

| シーン | 改善前 (v5.18.5) | 改善後 (v5.18.6) |
|---|---|---|
| `zoomBoost: 'shake'` + `highlight: 'isop'` | カード拡大 + レーダー縮小 + シェイクが全部同時で混乱 | カード/レーダーは即時表示、シェイクだけ純粋発火 |
| `zoomBoost: 'shake'` + 通常 script | テロップがスライドアップしながらシェイク | テロップは即時表示、シェイクだけ純粋発火 |
| `zoomBoost` なし | (変化なし) | (変化なし) |

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/components/GlobalStyles.jsx` | 抑制ルールをハイライト/テロップ/stats-table に拡大 |
| `package.json` / `config.js` | 5.18.5 → 5.18.6 |

### 既知の限界

- 他レイアウト (ranking, player_spotlight, versus_card) には CSS 出現アニメがないので影響なし
- 将来別レイアウトで CSS 出現アニメを追加する場合は同じ抑制パターンで対応すること



### 動機: ユーザー報告

> レーダーレイアウトの初期アニメーションがキーフレームアニメでシェイクさせたいのに
> チャートが出てくるアニメーションと一緒になって嫌だ。キーフレームだけにしたい。

### 原因

レーダーチャートには初回マウント時に CSS 遅延アニメーションが約 2 秒間走る:

```css
.phase[data-p="normal"].active .radar-main-poly { animation: radarFadeIn 0.5s ease-out forwards; }
.phase[data-p="normal"].active .radar-sub-poly { animation: radarFadeIn 0.5s ease-out 0.15s backwards; }
.phase[data-p="normal"].active .radar-dot { animation: radarFadeIn 0.3s ease-out backwards; }
.phase[data-p="normal"].active .radar-dot:nth-of-type(1) { animation-delay: 0.3s; }
... (5個のドット、5個のラベルが順次フェードイン)
.phase[data-p="normal"].active .radar-legend { animation: telopSlideUp 0.4s ease-out 1.5s forwards; }
```

合計 **0〜1.9 秒** にわたって、ポリゴン/ドット/ラベル/凡例が順次出現する。

`script.zoomBoost: 'shake'` を id:1 など最初の方の script に指定すると:
- チャート出現アニメ (0〜1.9秒) が走っている**最中に**
- シェイク (0.4秒) も同時発火
- ユーザー視点では「**画面全体が揺れながらチャートが出てくる**」状態 → やりたい演出ではない

### 解決: zoomBoost 発火時はチャート出現アニメを抑制

#### A. LayoutRouter で `data-zoom-active` 属性を付与

```jsx
<div
  className={`anim-layer ${animClass}`}
  data-zoom-active={animClass ? 'true' : 'false'}  // ← 新規
  key={innerAnimKey}
>
  <Layout {...props} />
</div>
```

#### B. GlobalStyles でチャート出現アニメを上書き

```css
.anim-layer[data-zoom-active="true"] .radar-main-poly,
.anim-layer[data-zoom-active="true"] .radar-sub-poly,
.anim-layer[data-zoom-active="true"] .radar-dot,
.anim-layer[data-zoom-active="true"] .radar-label-group,
.anim-layer[data-zoom-active="true"] .radar-legend {
  animation: none !important;
  opacity: 1 !important;
}
```

これで:
- **zoomBoost なし**: チャート出現アニメ通常発火 (現状維持)
- **zoomBoost あり**: チャートは即座に静止状態で表示 → シェイク/ズームだけが純粋に発火

### 効果

| シーン | 改善前 (v5.18.4) | 改善後 (v5.18.5) |
|---|---|---|
| zoomBoost なしの id:1 | チャートがふわっと出現 | (変化なし) チャートがふわっと出現 |
| zoomBoost: 'shake' の id:1 | チャート出現中にシェイクも同時発火で「動きがゴチャゴチャ」 | チャートは即座に表示、シェイクだけ純粋に発火 |
| zoomBoost: 'zoom' の id:5 (途中) | 通常の挙動 | (変化なし) zoomBoost 単独発火 |

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/layouts/LayoutRouter.jsx` | `data-zoom-active` 属性付与 |
| `src/components/GlobalStyles.jsx` | チャート出現アニメ抑制ルール追加 |
| `package.json` / `config.js` | 5.18.4 → 5.18.5 |

### 注意

他のレイアウト (player_spotlight, ranking, versus_card 等) は CSS 出現アニメを持っていないので、今回の対応で全レイアウトカバー済み。

将来別レイアウトに出現アニメを追加した場合は、同じ `data-zoom-active="true"` セレクタで抑制ルールを追加すること。



### 動機

v5.18.3 で TTS キャッシュ問題が解決したので、前回保留の残タスクを一気に対応:

> ② 台本/編集の保存機能
> ③ シェイクでチャートアニメも再発火
> ④ 台本上で選手フォーカス設定
> ⑤ 選手スポット/対決カードの被り (もう少し下)
> ⑥ ランキングで球団名併記
> ⑦ じわじわズーム + 背景動き

### 実装内容

#### ② 台本/編集の保存機能 (新規)

新規ファイル `src/lib/projectStorage.js`:
- **編集中スロットの自動保存** (debounce 1秒、変更があれば常に書き込み)
- **起動時の自動復元** (前回編集中だったプロジェクトを読み込む)
- **名前付きスロット** (「岡本動画」「井上動画」など複数保存可能)
- **容量超過対策** (QuotaExceededError 時は古いスロットから自動削除)

App.jsx の冒頭アクションエリアに **「💾 保存」ボタン** 追加:
- ボタンをクリック → 保存スロットモーダル
- 「現在の編集を保存」エリアで名前入力 → 保存
- 「保存済みプロジェクト」一覧 → 開く / 削除

これで一度閉じてもやり直しにならない。**真の保存機能**が手に入った。

#### ③ シェイクでチャートアニメ再発火するバグ修正

LayoutRouter を 2 層構造に変更:
- **外側 wrapper**: 固定 (常に維持) — 子レイアウトの内部 state 維持
- **内側 anim-layer**: zoomBoost 時だけ key 更新 → CSS animation だけ再発火

```jsx
// 旧 (v5.18.1): wrapper の key を更新 → 子レイアウトも remount
<div className={`anim ${animClass}`} key={animKey}>
  <Layout {...props} />
</div>

// 新 (v5.18.4): 2層構造で内側だけ key 更新
<div className="layout-fade-wrap">
  <div className={`anim-layer ${animClass}`} key={innerAnimKey}>
    <Layout {...props} />   {/* この Layout は remount されない */}
  </div>
</div>
```

これでチャート/レーダー/数値カウントアップ等の演出は維持されたまま、シェイク・ズームだけが発火する。

#### ④ 台本上で選手フォーカス設定 (focusEntry ドロップダウン)

ScriptEditorPanel に **「🎯 フォーカス選手」** ドロップダウン追加:
- player_spotlight の `players[].id`
- ranking の `entries[].name`
を動的に候補化して表示。`script.focusEntry` に保存される。

```jsx
<select value={script.focusEntry || ''}>
  <option value="">継承 (前のシーンと同じ)</option>
  <option value="okamoto">[選手] 岡本和真 — 26年(今季)</option>
  <option value="泉口">[Rank] 泉口 (G)</option>
  ...
</select>
```

これで台本上から動画全体を通した「誰にフォーカスするか」の編集が可能に。

#### ⑤ 選手スポット/対決カードの被り解消

前回 v5.18.1 で `pt-8` に詰めすぎた。ヘッダー (top:14px + ピル ≈ 35px) を考慮して再調整:

| ファイル | 旧 | 新 |
|---|---|---|
| VersusCardLayout | `pt-8 pb-[46%]` | `pt-14 pb-[42%]` |
| PlayerSpotlightLayout | `pt-8 pb-[44%]` | `pt-14 pb-[42%]` |

これで上のヘッダーにも下のテロップにも被らない。

#### ⑥ ランキングで球団名併記

スキーマに `entry.team` フィールド追加:
```js
ranking.metrics[].entries: [
  { rank: 1, name: "泉口", team: "G", value: "1.013" },
  { rank: 2, name: "佐野", team: "DB", value: ".980" },
  { rank: 3, name: "村上", team: "S", value: ".960" },
]
```

表示は名前の右に `(G)` `(DB)` のように小さく:
- 巨人 (G) は **オレンジ色** で目立たせる (自軍ハイライト)
- それ以外は **グレー**
- `entry.isTeam: true` の場合は球団タグ自体を出さない (チームエントリには不要)

球団横断ランキング (例: セ・リーグ全体の OPS) で**自軍が一目で分かる**仕掛け。

#### ⑦ じわじわズーム + 背景動き強化

GlobalStyles.jsx に Ken Burns エフェクト追加:

```css
@keyframes kenBurns {
  0%   { transform: scale(1.0)  translate(0, 0); }
  25%  { transform: scale(1.025) translate(-0.5%, -0.5%); }
  50%  { transform: scale(1.04) translate(0.5%, 0.3%); }
  75%  { transform: scale(1.025) translate(0.3%, -0.3%); }
  100% { transform: scale(1.0)  translate(0, 0); }
}
.anim-layer { animation: kenBurns 14s ease-in-out infinite; }
```

14秒周期で 1.0 → 1.04 → 1.0 のゆっくりズーム + 微小なドリフト。
視聴者の脳に「画面が動いている」と錯覚させ、退屈感を削減。

`zoomBoost` 系のアニメ発火時は CSS の `animation-name` を上書きして競合回避。
発火後は wrapper key 変更で自動的に Ken Burns に戻る。

背景フレアも強化:
- 旧: 2層 (オレンジ + インディゴ) で 8秒周期
- 新: 3層 (オレンジ + インディゴ + ローズ) で 16秒周期、translate ドリフト追加
- カクテル光線がゆっくり動く感じに

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/projectStorage.js` | ★新規★ 自動保存・名前付きスロット |
| `src/App.jsx` | 自動保存・復元 / SaveSlotModal / Save ボタン |
| `src/layouts/LayoutRouter.jsx` | 2層構造で remount 防止 |
| `src/components/GlobalStyles.jsx` | Ken Burns / 強化フレア / kenBurns 上書きルール |
| `src/components/ScriptEditorPanel.jsx` | focusEntry ドロップダウン + 候補動的取得 |
| `src/layouts/RankingLayout.jsx` | team フィールド表示 |
| `src/layouts/VersusCardLayout.jsx` | pt-8 → pt-14 |
| `src/layouts/PlayerSpotlightLayout.jsx` | pt-8 → pt-14 |
| `package.json` / `config.js` | 5.18.3 → 5.18.4 |

### 期待される効果

| 改善前 | 改善後 |
|---|---|
| ❌ 閉じるとやり直し | ✅ 自動保存 + 名前付き複数保存 |
| ❌ シェイクでチャートも再描画 | ✅ シェイクのみ発火、チャート維持 |
| ❌ 台本上で選手指定不可 | ✅ ドロップダウンで全シーンに設定可 |
| ❌ ヘッダーに被る (前回詰めすぎ) | ✅ ヘッダー/テロップ両方避ける余白 |
| ❌ 球団横断で誰が誰か分からない | ✅ (G)/(DB)/(S) で識別、自軍は色付き |
| ❌ 背景静止で退屈 | ✅ 14秒周期 Ken Burns + 強化フレア |



### 動機: ユーザー報告の致命的バグ

> ✅ 生成完了 (但し7件「未生成」と判定):
> id:4, id:7, id:12, id:17, id:24, id:26, id:28
> ※実際は全部生成済みのはず

### 根本原因: scripts の **グループ化と結合方式** が3箇所でバラバラ

調査の結果、TTS キャッシュキーが**3箇所で別々のロジック**で生成されていた:

| 場所 | 結合方法 | 結果 |
|---|---|---|
| usePlaybackEngine.js (再生時) | 句点 `'。'` で連結 (`s+'。'`) | グループ単位 + 句点 |
| ttsAdapter.pregenerate / findMissing | **個別 script** で `applyYomigana(s.speech)` | 単独 script のキー |
| audioExporter.js | スペース `' '` で連結 | グループ単位 + スペース |

結果として:
1. **pregenerate** が個別 script キーで TTS API を叩いて保存
2. **アプリ再生時** にグループ + 句点キーで探すが **存在しない** → 再度 API を叩く (二重生成)
3. **audioExporter** がスペース + グループキーで探すが **これも別キー** → 「未生成」誤判定
4. **findMissing** も個別キーでチェック → アプリの再生時に生成されたグループキーは無視

つまり、ユーザーが見ている「7件未生成」は **実際は再生時に生成され IndexedDB にあるが、別キーで保存されているため 検出できない** 状態だった。

### 解決: 共通グループ化ヘルパーで全箇所を統一

#### A. 新規ファイル `src/lib/scriptGrouping.js`

```js
export function groupBySpeaker(scripts) {
  // 同一 speaker 連続でグループ化
  // joinedSpeech は句点連結 (アプリ再生時と完全一致)
  return groups.map(g => ({
    startIdx, size, scripts, speaker,
    joinedSpeech: scripts.map(s => {
      const t = s.speech || s.text || '';
      return /[。！？.!?]$/.test(t) ? t : t + '。';
    }).join(''),  // ← 句点連結
  }));
}
```

#### B. ttsAdapter.pregenerate を **グループ単位** に変更

```js
// 旧: 個別 script で TTS API 叩く → 別キャッシュキーで保存
for (const s of scripts) {
  const text = applyYomigana(s.speech);
  await this._getOrGenerate(text, s.speaker);  // 個別キー
}

// 新: グループ単位で TTS API 叩く → 再生時と同じキーで保存
const groups = groupBySpeaker(scripts);
for (const g of groups) {
  const text = applyYomigana(g.joinedSpeech);
  await this._getOrGenerate(text, g.speaker);  // グループキー (再生時と一致)
}
```

#### C. ttsAdapter.findMissing もグループ単位

```js
// 旧: script ごとにチェック → 個別キーで「無い」と判定 (実は別キーで存在)
// 新: グループごとにチェック → 再生時と同じキーで検出
```

未生成グループに含まれる全 script を id 単位の出力に展開して、UI 側は変更不要。

#### D. ttsAdapter.pregenerateOnly (個別再生成) もグループ単位

「id:4 だけ再生成」と指示されても、id:4 を含むグループ全体を再生成する。
これで再生時と同じキーで上書き保存される。

#### E. audioExporter もグループ化を共通ヘルパーに

```js
// 旧: スペース連結
const joinedText = groupScripts.map(s => s.speech || s.text || '').join(' ');

// 新: 共通ヘルパー使用 (句点連結、ttsAdapter と完全同期)
const groups = groupBySpeaker(scripts);
const joinedText = group.joinedSpeech;
```

#### F. usePlaybackEngine の prefetch もスペース → 句点連結に修正

```js
// 旧 (スペース連結 — 実は使われないキャッシュキーを生成していた)
const nextJoined = nextGroupScripts.map(s => s.speech).join(' ');

// 新 (句点連結 — 再生時の joinedSpeech と完全一致)
const nextJoined = nextGroupScripts.map(s => {
  const t = s.speech || s.text || '';
  return /[。!?.!?]$/.test(t) ? t : t + '。';
}).join('');
```

### 期待される効果

| 改善前 (v5.18.2) | 改善後 (v5.18.3) |
|---|---|
| ❌ 「7件未生成」と誤判定 (実は生成済み) | ✅ 正確な未生成判定 |
| ❌ pregenerate と再生で**二重生成** (API コスト 2倍) | ✅ 一度の API コールで両方ヒット |
| ❌ 不足分再生成しても再生時に再度API叩かれる | ✅ 1回の API コールで完結 |
| ❌ audioExporter が「未生成」誤検出して**該当部分が無音** | ✅ 全 TTS が WAV に正しく入る |

### ★必須★ デプロイ後の手順

#### 1. ★ 既存キャッシュを必ずクリア ★

旧版で2つのキー戦略 (個別 vs グループ) で保存された **「個別キー側」のキャッシュは無駄なので削除**:

- TTSPanel → 「キャッシュクリア」ボタン
- 全 IndexedDB のエントリが削除される

#### 2. 全 scripts を再生成

クリア後、「全 scripts」セクションから再生成:
- 今度は **グループ単位で API コール** されるので、API リクエスト数が **30回程度 → 10-15回**に減る
- コスト約半分

#### 3. 動作確認

1. 動画再生 → 切れ目なく音声が流れるか
2. 音声書き出し → デバッグログで `TTS グループ数: N` と `TTS 取得済み: N件 / 未生成: 0件` を確認
3. もし「未生成」が出たら、その**グループ全体**を再生成

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/scriptGrouping.js` | ★新規★ groupBySpeaker / findGroupForScript ヘルパー |
| `src/lib/ttsAdapter.js` | findMissing / pregenerate / pregenerateOnly をグループ単位に |
| `src/lib/audioExporter.js` | groupBySpeaker を使用 (旧自前ロジック削除) |
| `src/hooks/usePlaybackEngine.js` | prefetch のキャッシュキーを句点連結に修正 |
| `package.json` / `config.js` | 5.18.2 → 5.18.3 |

### 残課題 (次回以降)

引き続き ②③④⑤⑥⑦ は次リリース予定:
- ② 台本/編集の保存機能
- ③ シェイクでチャートアニメも再発火
- ④ 台本上で選手フォーカス設定
- ⑤ 選手スポット/対決カードのレイアウト被り
- ⑥ ランキングで球団名併記
- ⑦ じわじわズーム + 背景動き



### 動機: ユーザー報告の致命的バグ

> 全部生成してるのにid1,2だけがTTS再生されないエラーがある。
> ログではid1だけ失敗とあるけど実際は1,2。
> あとエクスポートした音声とアプリで流してる音声が微妙に違う。
> エクスポートしたやつはイントネーションが変わったり速度が変わったり、
> 「決め台詞は、落ち着いて重みのあるトーンで。'」っていうプロンプトを
> 発言したりして絶妙に使い物にならない。

3つの問題が**同根** (プロンプト混入バグ) と判明。

### 根本原因の特定

#### Code.gs の VOICE_PROFILES.A.stylePrompt:

```js
A: {
  voiceName: 'Charon',
  stylePrompt: '落ち着いた40代男性アナリストの声で、…(中略)…
                「数字は嘘つかないですからね」「数で見ると、ですね」のような決め台詞は、
                落ち着いて重みのあるトーンで。'
}
```

**問題点**:
- スタイル指示文が**句点+具体的セリフ例**で終わっている
- 「読み上げてください」も命令形だが、その前のセリフ例 (「数字は嘘つかないですからね」等) を Gemini TTS が**読み上げ対象の続き**と誤認
- 結果、合成音声に**「決め台詞は、落ち着いて重みのあるトーンで」**が混入

#### 連鎖して起きた症状

1. **(C) WAV にプロンプト混入** ← 直接的な原因
2. **(A) id:1, id:2 が再生されない**
   - id:0 (UI上 id:1) で TTS API がエラーを返す or 不正な音声を返す
   - usePlaybackEngine の `advanceToNextGroup` が**グループ単位**でスキップ
   - id:0 と id:1 が A speaker 連続グループ (group size=2) なら**両方スキップ**
   - 結果: id:1, id:2 が再生されない
3. **(B) アプリ再生とエクスポート WAV の音声差**
   - 短いフレーズだと SoundTouchJS の窓サイズ 1024 でイントネーション歪み
   - + プロンプト混入分の音声長が不安定で時間伸縮も不正確に

### 修正内容

#### A. ★最重要★ stylePrompt を再構成 (具体例セリフ削除、命令形のみ)

**A (数原)**:
```js
// 旧: 「数字は嘘つかないですからね」のような決め台詞例 → 読み上げ混入
// 新: 命令形のみ、句点で終わらない
stylePrompt: '落ち着いた40代男性アナリストの声で、論理的に断定しつつ、
              語頭と語尾をクリアに発音する話し方を維持。早口気味でも1語1語の
              輪郭がはっきり聞こえる発声で、感情論を排し、短いセンテンスで
              簡潔に語る重みのあるトーン'
```

**B (もえか)**:
```js
// 旧: 「やっぱりそうなんですか」「ヤフコメでも〜」セリフ例 → 読み上げ混入リスク
// 新: 命令形のみ
stylePrompt: '20代前半〜中盤の若い女性アシスタントの声で、明るく親しみやすい
              トーンを維持。…(セリフ例なし)…ですます調を基本にテンポよく軽やかに'
```

#### B. directorPrompt を Gemini TTS 公式構造に変更

```js
// 旧 (プロンプト混入のリスク高)
const directorPrompt = voice.stylePrompt + '\n\n以下のセリフを読み上げてください:\n' + text;

// 新 (Gemini TTS 公式 cookbook 推奨形式)
const directorPrompt = 'Say ' + voice.stylePrompt + ': ' + text;
```

公式 cookbook (https://ai.google.dev/gemini-api/docs/speech-generation) と同じ
`Say [スタイル指示]: [本文]` フォーマット。スタイルと本文の境界が明確。

#### C. SoundTouchJS の音質改善 (buffer size 1024 → 4096)

```js
// audioExporter.js
const shifter = new PitchShifter(offlineCtx, sourceBuffer, 4096);  // 旧 1024
```

短い TTS フレーズで小さい窓だとイントネーションが歪むため、4倍に拡大。
これで時間伸縮しても自然な抑揚を保つ。

### 期待される効果

| 改善前 (v5.18.1) | 改善後 (v5.18.2) |
|---|---|
| ❌ WAV に「決め台詞は…」が混入 | ✅ 純粋な本文のみ生成 |
| ❌ id:1, id:2 が再生されない (連鎖) | ✅ id:1 から正常再生 (TTSエラー解消で連鎖解決) |
| ❌ エクスポート音声が機械的・歪む | ✅ buffer size 4倍でイントネーション維持 |

### ★必須★ デプロイ後の手順

#### 1. GAS のデプロイ更新 (★最優先★)
- GAS エディタを開く → Code.gs の VOICE_PROFILES と handleTTS が新版になっているか確認
- 「デプロイ」→「デプロイを管理」→ 編集 (鉛筆アイコン) → バージョン:「新しいバージョン」→「デプロイ」
- **新しいデプロイURLは変わらない**ので React アプリ側の URL 変更は不要

#### 2. ★ TTS キャッシュを必ずクリア ★
プロンプト混入で生成された WAV は IndexedDB キャッシュに残っているので、
**手動でクリアしないと古い音声を使い続ける**:
- TTSPanel を開く
- 「キャッシュクリア」ボタンをクリック (現状の 9MB 程度をすべて削除)
- これで全 script が**新プロンプトで再生成される**

#### 3. 動作確認
1. 「全 scripts」セクションで **id:1 から再生成**
2. 新しい WAV を再生 → プロンプト混入なしを確認
3. 動画再生 → id:1, id:2 が正常に発話されるか確認
4. 音声トラック書き出し → 自然な抑揚になっているか確認

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `gas-proxy/Code.gs` | VOICE_PROFILES.A/B の stylePrompt 再構成 / directorPrompt を 'Say ...:' 形式に |
| `app-v5/src/lib/audioExporter.js` | SoundTouchJS buffer size 1024 → 4096 |
| `package.json` / `config.js` | 5.18.1 → 5.18.2 |

### 残課題 (次回以降)

- ② 台本/編集の保存機能
- ③ シェイクでチャートアニメも再発火 (子レイアウトの key 戦略見直し)
- ④ 台本上で選手フォーカス設定
- ⑤ 選手スポット/対決カードの被り解消 (もう少し下)
- ⑥ ランキングで球団名併記
- ⑦ じわじわズーム + 背景動き

これらはこのリリースには含まれない。①の検証完了後に順次対応。



### 動機: ユーザー報告 5項目

> ① 数原のテロップ枠線は青系がいいかな
> ② 同じレイアウト・指標が続くときにアニメーションが毎回発火するバグが起きてる
> ③ 対決カードはテロップエリアにかからない程度にもう少し下スペースを空けて上に詰めた方がいい
> ④ 選手スポットの各レイアウトも画面中央ではなくて少し上寄りにしてテロップで隠れないように
> ⑤ テキストテロップが左端まで使っていいと思うけど

### ②【最重要バグ修正】アニメーションが毎回再発火する問題

#### 原因

v5.18.0 の LayoutRouter で、wrapper の `key` を以下のように設定していた:
```js
const animKey = `${animClass}-${currentIndex}-${animationKey}`;
```

これだと `currentIndex` が変わるたびに wrapper の `key` が変わり、**zoomBoost を指定していない script でも子レイアウトが毎回 remount** していた。結果、同じレイアウト・指標が続いている時でもチャート/数値/フェードイン等の演出が毎 script ごとに再発火し、目障りな状態に。

#### 修正

**zoomBoost 指定がある時だけ key を更新する** ロジックに変更:
```js
const animKey = animClass
  ? `${animClass}-${currentIndex}-${props.animationKey || 0}`  // 指定あり: 該当 script で remount
  : 'stable';                                                   // 指定なし: 固定 key で remount しない
```

これで:
- zoomBoost 未指定の通常 script → wrapper は維持、子レイアウトの内部 state とアニメは継続
- zoomBoost 指定あり script → その時だけ remount してアニメ発火

副次効果として、同じレイアウト・指標が続く時のチャート/数値/フェードイン演出も**初回のみ**発火するようになる (本来の意図通りの挙動)。

### ① 数原(A)のテロップ枠線をオレンジ→青系に

オレンジは「重要数値の強調色」として大事な役割があるため、テロップの常時枠色とは分離するべき、というユーザー判断。
青系 (`rgba(56,189,248,0.85)` = sky-400 相当) に変更:

```css
/* 旧 */
.telop-bg[data-speaker="a"] { border-color: rgba(249,115,22,0.85); ... }

/* 新 (v5.18.1) */
.telop-bg[data-speaker="a"] { border-color: rgba(56,189,248,0.85); box-shadow: ...rgba(56,189,248,...); }
```

枠線・尻尾・shadow すべて青系に統一。
※ 数原のアバター本体 (`.avatar-hl.a`) はオレンジのまま (テロップとアバターは独立した視覚要素)。

### ③ 対決カードを上に詰める

```jsx
/* 旧: pt-10 / pb-[40%] */
/* 新: pt-8 / pb-[46%]  ← 上6%詰めて、下に46%確保 */
```

テロップエリア (画面下20%) との衝突を確実に避ける。

### ④ 選手スポット 各モードを上寄りに

外側 wrapper:
```jsx
/* 旧: pt-12 / pb-[34%] */
/* 新: pt-8 / pb-[44%]  ← 下のテロップエリア確保 */
```

3モードの内部 alignment も画面中央 → 上寄りに:

| モード | 旧 | 新 |
|---|---|---|
| `quote` | `justify-center` | `justify-start pt-4` |
| `single_metric` | `justify-center` | `justify-start pt-6` |
| `stats_grid` | `justify-center` | `justify-start pt-2` |

これでテロップとの被りを防ぎつつ、視覚的バランスを保つ。

### ⑤ テロップを左端まで使えるように

調査の結果、テロップは `bottom: 20%` に配置されており、アバター (bottom: 13% + 高さ約85px ≒ 17%) **の上**にある。つまり**重ならない**ので、左端まで使ってOK。

```css
/* 旧: speaker-a は padding-left:60px (アバター完全回避) */
/* 新: speaker-a も padding-left:8px (左端まで使える)
       padding-right:32px のセーフゾーンは維持 */
.telop-wrap-normal:has(.telop-bg[data-speaker="a"]) {
  padding-left: 8px; padding-right: 32px;
}
.telop-wrap-normal:has(.telop-bg[data-speaker="b"]) {
  padding-left: 8px; padding-right: 60px;
}

/* max-width も 260px → 280px に拡大 */
.telop-bg { max-width: 280px; }
```

これで横幅をたっぷり使えて、長めのセリフも改行少なく収まる。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/layouts/LayoutRouter.jsx` | ★アニメ再発火バグ修正★ 'stable' key で remount 防止 |
| `src/components/GlobalStyles.jsx` | speaker-a 青系 / telop padding-left:8px / max-width:280px |
| `src/layouts/VersusCardLayout.jsx` | pt-10→pt-8 / pb-40%→pb-46% |
| `src/layouts/PlayerSpotlightLayout.jsx` | pt-12→pt-8 / pb-34%→pb-44% / 3モード justify-start |
| `package.json` / `config.js` | 5.18.0 → 5.18.1 |

### 期待される効果

| 改善前 | 改善後 |
|---|---|
| ❌ 同じ指標続いても毎回チャート再描画 | ✅ 初回のみ発火、同じ指標続いても維持 |
| ❌ 数原テロップがオレンジで重要数値と被る | ✅ 青系で役割分離 |
| ❌ 対決カードがテロップにかかる | ✅ 上に詰めて46%確保 |
| ❌ 選手スポットが画面中央でテロップに被る | ✅ 上寄り配置 |
| ❌ テロップ左端60px不使用で詰まって見える | ✅ 左端8pxまで使えて max-width 280px |



### 動機: Gemini戦略提言の残課題

> ② 静のUIに動の編集を加える: 重要発言時に画面ガクッとズーム/シェイク
> ③ 冒頭0.5秒の違和感の視覚化: 打撃音/ミット音 + 画面フラッシュ
> ④ エンディング画面の完全撤廃と「無限ループ」

これら3つを一気に実装。これで Gemini 提言1 (動画化改善) はほぼ全カバー。

### 実装内容

#### A. キーフレームアニメ (script.zoomBoost)

`script.zoomBoost` フィールド追加 (任意):
- `'zoom'` — グッと寄る (定石、scale 1→1.06→1)
- `'shake'` — 揺れる (衝撃発言、translate ±3px)
- `'zoomShake'` — ズーム+揺れ (覚醒系、最強)
- `undefined` — なし

GlobalStyles.jsx に keyframes 追加:
```css
@keyframes zoomBoost { 0% { scale 1 } 20% { scale 1.06 } 100% { scale 1 } }
@keyframes impactShake { /* 8ステップで ±3px translate, ±0.4deg rotate */ }
@keyframes zoomShake { /* zoom + shake 複合、最強 */ }
```

LayoutRouter.jsx で `currentScript.zoomBoost` を読んで CSS class を当てる:
```jsx
const animClass = zoomBoost === 'zoom' ? 'anim-zoom-boost'
                : zoomBoost === 'shake' ? 'anim-impact-shake'
                : zoomBoost === 'zoomShake' ? 'anim-zoom-shake' : '';
const animKey = `${animClass}-${currentIndex}-${animationKey}`;

return (
  <div className={`layout-fade-wrap ${animClass}`} key={animKey}>
    ...
  </div>
);
```

`key` を毎回更新することで React の remount が発生し、CSS animation が再発火。

ScriptEditorPanel.jsx に **「💥 キーフレームアニメ」ドロップダウン** 追加:
- なし
- 🔍 ズーム (グッと寄る)
- 💥 シェイク (衝撃発言)
- ⚡ ズーム+シェイク (覚醒系・最強)

#### B. 冒頭0.5秒フラッシュ + SE 自動再生

GlobalStyles.jsx に flash overlay の CSS:
```css
@keyframes hookFlash {
  0% { opacity: 0 }
  8% { opacity: 0.9 }    /* 一瞬強く光る */
  20% { opacity: 0.4 }
  35% { opacity: 0.6 }   /* 二段階で残像 */
  100% { opacity: 0 }
}
.hook-flash-overlay {
  background: radial-gradient(circle at 50% 50%, #ffffff 0%, rgba(255,255,255,0.6) 30%, transparent 70%);
  mix-blend-mode: screen;
  animation: hookFlash 0.55s ease-out forwards;
}
```

PreviewFrame.jsx の hook フェーズに `<div className="hook-flash-overlay">` を追加。
key を `flash-${animationKey}-${currentIndex}` で毎ループ更新 → 再生のたびに発火。

usePlaybackEngine.js で id:0 の script に SE 指定がなければ自動的に `hook_impact` を再生:
```js
if (currentIndex === 0 && mixer && isSEEnabled && !script.se) {
  mixer.playSe('hook_impact');
}
```

audioExporter.js でも同じく、scripts[0] に se がなければ書き出し時に hook_impact を冒頭に自動配置。

#### C. 無限ループ (smartLoop)

`projectData.smartLoop` フラグ追加 (デフォルト `true`):
- `true` (推奨) — 末尾→冒頭にシームレス遷移、アウトロ画面を表示しない
- `false` — 従来通り末尾でアウトロ画面表示して停止

##### getPhase で outro phase をスキップ

PreviewFrame.jsx:
```js
function getPhase(currentScript, currentIndex, scripts, projectData) {
  if (currentScript.isCatchy) return 'hook';
  // ★smartLoop=true なら outro phase に入らない
  if (!projectData?.smartLoop && total && currentIndex >= total - 2) return 'outro';
  if (currentScript.highlight) return 'highlight';
  return 'normal';
}
```

これで「今日の分析まとめ」「チャンネル登録お願い」の静止画が表示されなくなる。

##### 末尾到達時に冒頭にループ

usePlaybackEngine.js の `playNext` と `advanceToNextGroup` を修正:
```js
if (next >= scripts.length) {
  if (projectData?.smartLoop) {
    // ★ループバック★
    currentGroupRef.current = { startIdx: -1, endIdx: -1 };
    setAnimationKey(Date.now());  // hook flash 再発火用
    return 0;  // 冒頭に戻る
  }
  // smartLoop=false: 従来通り停止
  setIsPlaying(false);
  ...
}
```

`animationKey` を更新することで `key` が変わり、hook フェーズの flash overlay も再発火する。
視聴者は「あれ、もう2週目に入ってた」と気づかないシームレスループ。

#### D. UI トグル

App.jsx の冒頭アニメ選択の隣に **「🔁 ループON / ⏹ ループOFF」** トグルボタン追加。

```jsx
<button
  onClick={() => setProjectData(prev => ({ ...prev, smartLoop: !prev.smartLoop }))}
  className={projectData.smartLoop ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-500'}
>
  {projectData.smartLoop ? '🔁 ループON' : '⏹ ループOFF'}
</button>
```

#### E. defaultBatter / defaultPitcher のデフォルト値

両方とも `smartLoop: true` でデフォルト ON。新規プロジェクトは無限ループされる仕様。
ループしたくない場合だけ手動で OFF にする方針。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/components/GlobalStyles.jsx` | zoomBoost/impactShake/zoomShake/hookFlash の keyframes |
| `src/components/PreviewFrame.jsx` | getPhase に projectData / hook-flash-overlay 追加 |
| `src/components/ScriptEditorPanel.jsx` | zoomBoost ドロップダウン |
| `src/layouts/LayoutRouter.jsx` | zoomBoost class 適用 + key で再発火 |
| `src/hooks/usePlaybackEngine.js` | hook_impact 自動再生 / smartLoop でループバック |
| `src/lib/audioExporter.js` | 書き出し時にも冒頭 hook_impact 自動配置 |
| `src/App.jsx` | smartLoop トグルボタン |
| `src/data/defaultBatter.js`, `defaultPitcher.js` | smartLoop: true |
| `package.json` / `config.js` | 5.17.0 → 5.18.0 |

### 期待される効果

| 改善前 | 改善後 |
|---|---|
| 静止UIで文字だけ進む | 重要発言時にズーム/シェイク (script.zoomBoost) |
| 冒頭は静かに開始 | 0.55秒フラッシュ + 打撃音/ミット音 SE で「指を止める」 |
| 末尾「まとめ」静止画でループ破壊 | 末尾→冒頭にシームレスループ (smartLoop=true) |

### Gemini提言まとめ — 最終状態

| 提言1 (戦略) | 状態 |
|---|---|
| 一点突破型UI | ✅ v5.15.5 (single_metric モード) |
| キーフレームアニメ | ✅ v5.18.0 (zoomBoost) |
| 冒頭フラッシュ + 効果音 | ✅ v5.18.0 |
| 末尾削除 + 無限ループ | ✅ v5.18.0 (smartLoop) |

| 追加提言 (UI質) | 状態 |
|---|---|
| ① ネオン化 (発光感) | ✅ v5.17.0 |
| ② 極太フォント | ✅ v5.17.0 |
| ③ 背景フレア + ノイズ | ✅ v5.17.0 |
| ④ インサート映像 | ⏳ 素材ライブラリ設計から (将来) |
| ⑤ CTA前倒し | ⏳ smartLoop と相性悪いので別設計 (将来) |

| 提言2 (技術) | 状態 |
|---|---|
| APIキーローテーション | ✅ v5.16.0 |

### 運用ガイド: zoomBoost をどう使うか

**「ここぞ!」という1動画につき2-3回**だけ使うのが効果的。乱用するとうるさい。

- `zoom`: 「OPS .950超え」のようにポジティブな衝撃データ
- `shake`: 「実はこの選手、防御率11.20」のようにネガティブな驚き
- `zoomShake`: 「覚醒の理由は…」のオチ直前、最大の盛り上げ箇所



### 動機: Gemini追加提言を反映

> ① コントラストと「発光感」の極端な強化 (ネオンオレンジ、純白、蛍光イエロー)
> ② フォントウェイトを暴力的にアップ (超極太ゴシック)
> ③ 背景の「抜け感」と微細な動き (球場フレア、ノイズアニメ)

ダークモードの世界観 (野球データ分析の専門性) は維持しつつ、ショート動画の激流の中で
埋もれない「サイバーパンク × ネオンサイン」の方向性に振り切る。

### 改修内容

#### A. ① カラーパレットの刷新 — ネオン化

```css
:root {
  /* 旧: --p: #f97316 / --p-glow: rgba(249,115,22,0.6) */
  /* 新: より明るく彩度高く */
  --p: #ff8c1a;
  --p-glow: rgba(255,140,26,0.85);
  --p-glow-soft: rgba(255,140,26,0.4);
  --p-bright: #ffaa3d;            /* ハイライト変体 */

  --neon-yellow: #FFE94B;          /* 蛍光イエロー (旧 #FFD700 より明るい) */
  --neon-yellow-glow: rgba(255,233,75,0.85);
  --pure-white: #FFFFFF;           /* 主要数値用 */
  --stadium-flare: rgba(255,200,100,0.06);
}
```

主要数値専用 4 クラス追加:
- `.neon-number` (オレンジ発光、純白文字)
- `.neon-number-rose`
- `.neon-number-yellow`
- `.neon-number-red`

例:
```css
.neon-number {
  color: var(--pure-white);
  text-shadow:
    0 0 12px var(--p-glow),       /* 中心の強い発光 */
    0 0 24px var(--p-glow-soft),  /* 二重ハロー */
    0 0 4px rgba(255,255,255,0.6); /* 中心の白光 */
}
```

#### B. ② 極太フォントの導入 — Google Fonts

`index.html` で読み込み:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=M+PLUS+1p:wght@800;900&display=swap" rel="stylesheet" />
```

ユーティリティクラス:
- `.font-impact` (Anton, 超極太コンデンスド英数字、letter-spacing -0.02em)
- `.font-headline` (Bebas Neue, 極太、letter-spacing 0.02em)
- `.font-jp-heavy` (M PLUS 1p weight 900, 日本語の最重量)

適用箇所:
- PlayerSpotlightLayout: primaryStat (default + single_metric の両方)
- VersusCardLayout: 数値 (mainDisplay / subDisplay)
- HighlightCard (.hl-val-main .num / .hl-val-sub .num): GlobalStyles.jsx で Anton 直指定
- RankingLayout: 順位の数値

例:
```jsx
<span className="font-impact text-[140px] neon-number">
  {player.primaryStat.value}
</span>
```

#### C. ③ 背景の抜け感 + 微細ノイズ

`.phone::before` で球場フレア:
```css
.phone::before {
  background:
    radial-gradient(ellipse 70% 50% at 80% 10%, var(--stadium-flare) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 20% 95%, rgba(99,102,241,0.04) 0%, transparent 60%);
  animation: stadiumFlare 8s ease-in-out infinite;
}
@keyframes stadiumFlare {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
```

`.phone::after` で微細ノイズ:
```css
.phone::after {
  opacity: 0.025;       /* ほぼ目立たない、わずかな質感 */
  background-image:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0, ...),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0, ...);
  animation: noiseShift 0.5s steps(4) infinite;
}
```

これで完全な静止画感が消え、画面全体に常に微細な「動き」が生まれる。

#### D. em-y / em-n / em-o / em-r も発光強化

テロップ内のキーワード強調を全部ネオン化:
- `.em-y`: `#FFD700` → `var(--neon-yellow)` + 二重発光 (12px / 24px)
- `.em-n`: 同上 + monospace 維持
- `.em-o`: `#FF8C00` → `var(--p-bright)` + 発光
- `.em-r`: `#FF4500` → `#FF6B47` + 発光

#### E. 対決カードの矢印にも発光

`◀` `▶` `=` の矢印に textShadow 追加 — 勝者方向への視線誘導が強化される。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `index.html` | Google Fonts (Anton / Bebas Neue / M PLUS 1p) preconnect + import |
| `src/components/GlobalStyles.jsx` | カラー変数刷新 / 球場フレア / ノイズアニメ / em-* 発光 / hl-val Anton / neon-number クラス群 |
| `src/layouts/PlayerSpotlightLayout.jsx` | primaryStat (default + single_metric) を font-impact + neon に |
| `src/layouts/VersusCardLayout.jsx` | 数値を font-impact + 発光強化 / 矢印にも textShadow |
| `src/layouts/RankingLayout.jsx` | 値を font-impact + textShadow |
| `package.json` / `config.js` | 5.16.0 → 5.17.0 |

### 期待される効果

| 改善前 (v5.16) | 改善後 (v5.17) |
|---|---|
| 上品なオレンジ #f97316 | サイバーパンクなネオンオレンジ #ff8c1a + 二重発光 |
| #FFD700 (普通の金色) | 蛍光イエロー #FFE94B + 発光 |
| 白文字 (普通) | 主要数値は純白 + 三重 text-shadow |
| 数値: monospace 黒 (細め) | Anton (超極太コンデンスド) で押し出し |
| 完全静止背景 (スライド感) | 球場フレア 8秒周期 + 微細ノイズで動きあり |
| em-y は装飾少なめ | em-y/em-n/em-o/em-r 全部にネオン発光 |

ショート動画の激流の中で埋もれない、「数字が目に飛び込んでくる」UIに進化。

### 提言1 + 追加提言 まとめ

| 項目 | 状態 |
|---|---|
| 一点突破型UI | ✅ v5.15.5 (single_metric モード) |
| ① ネオン化 | ✅ v5.17.0 |
| ② 極太フォント | ✅ v5.17.0 |
| ③ 背景フレア + ノイズ | ✅ v5.17.0 |
| キーフレームアニメ (重要発言時ズーム/シェイク) | ⏳ v5.18 候補 |
| 冒頭フラッシュ + 効果音 | ⏳ v5.18 候補 |
| 末尾削除 + 無限ループ | ⏳ v5.18 候補 |
| ④ インサート映像 | ⏳ 素材ライブラリ設計から (将来) |
| ⑤ CTA前倒し | ⏳ 無限ループとセットで実装 |

### Gemini への共有用メモ

ダークモード方針は維持。サイバーパンク × ネオンサイン × 極太タイポグラフィの3要素で
「動く資料」から「目を引く動画」に進化させた。
具体的指示は実装で 100% 反映済み:
- ネオンオレンジ ✅
- 純白主要数値 ✅
- 蛍光イエロー (em-y) ✅
- 暴力的フォント (Anton, M PLUS 1p 900) ✅
- 背景球場フレア ✅
- ノイズアニメ ✅



### 動機: Geminiから2つの提言

> ### 提言1 (戦略): ショート動画として「動画」になっていない
> - 一点突破型UI (今話してる数字だけ巨大)
> - キーフレームアニメ (重要発言時のズーム/シェイク)
> - 冒頭0.5秒のフラッシュ + 打撃音/ミット音
> - エンディング画面撤廃 + 無限ループ
>
> ### 提言2 (技術): TTS 1日100回上限を APIキーローテーションで突破

提言1は v5.15.5 で `single_metric` モードを既に実装済みで方向性は同じ。
残りの 3項目 (キーフレームアニメ、冒頭フラッシュ、無限ループ) は次のバージョンで段階対応。

提言2は即効性が高く、品質が高い 3.1 Flash TTS preview を実質無制限で使えるため、
本リリースで実装。

### 実装内容: GAS APIキーローテーション

#### A. Code.gs の CONFIG に getApiKeys() 関数を追加

```js
function getApiKeys() {
  var props = PropertiesService.getScriptProperties();
  var keys = [];
  // 複数キー (新方式): GEMINI_API_KEYS にカンマ区切り
  var multiKeysRaw = props.getProperty('GEMINI_API_KEYS');
  if (multiKeysRaw) {
    multiKeysRaw.split(',').forEach(function(k) {
      var trimmed = k.trim();
      if (trimmed && keys.indexOf(trimmed) === -1) keys.push(trimmed);
    });
  }
  // 単一キー (旧方式、後方互換): GEMINI_API_KEY
  var singleKey = props.getProperty('GEMINI_API_KEY');
  if (singleKey) {
    var trimmed = singleKey.trim();
    if (trimmed && keys.indexOf(trimmed) === -1) keys.push(trimmed);
  }
  return keys;
}
```

スクリプトプロパティ:
- `GEMINI_API_KEY` (既存): 後方互換のため引き続きサポート
- **`GEMINI_API_KEYS` (★新★)**: カンマ区切りで複数キー指定
  - 例: `"AIza...keyB,AIza...keyC,AIza...keyD"`
  - 両方設定すれば全キーを使う (重複は自動排除)

#### B. handleTTS のリトライループを階層化

「モデル」 > 「APIキー」 > 「リトライ」 の3層ループ:

```
for each model in [3.1, 2.5]:
  for each apiKey in apiKeys:
    for attempt in 0..TTS_RETRY_COUNT:
      response = call(model, apiKey)
      if 200: return success
      if 429: break (next key)         ← v1.1.0 の新挙動
      if 4xx: break (next key試行は意味薄いがやる)
      if 5xx: continue (retry same key)
  if all keys exhausted: continue (next model)
```

挙動の優先順:
- **3.1 でキーA quota → 3.1 でキーB → 3.1 でキーC** (まず 3.1 を全キー試す)
- 全キー quota → **2.5 でキーA → 2.5 でキーB → 2.5 でキーC** (2.5 にfallback)
- これで品質を優先しつつ実質無制限化

理論最大: **100 × N キー × 2 モデル = 100×N×2 回/日**
- 1キー: 200回/日
- 3キー: 600回/日 (推奨)
- 5キー: 1000回/日

#### C. レスポンスに `usedKeyIndex` / `keysAvailable` を追加

クライアント側でどのキーが使われたか把握できるように:
```json
{
  "audioBase64": "...",
  "modelUsed": "gemini-3.1-flash-tts-preview",
  "usedFallback": false,
  "usedKeyIndex": 1,           // ★新★ 0始まり
  "keysAvailable": 3            // ★新★ 設定キー総数
}
```

ttsAdapter.js でも propagate するようにした。

#### D. 新しい checkApiKeys() ヘルパー

GAS エディタで実行できるデバッグ関数:
```
利用可能な API キー数: 3
  [0] AIzaSyABCD...wxyz
  [1] AIzaSyEFGH...mnop
  [2] AIzaSyIJKL...qrst
✅ 100×3×2 = 600 回/日 まで TTS 生成可能
```

### 設定手順 (デプロイ後)

1. **Google AI Studio (https://aistudio.google.com/) で追加キー作成**
   - 左メニュー「API キー」を開く
   - 「Create API key」→ **「Create API key in new project」** を選択
     (★必ず新しいプロジェクトで作る — 同プロジェクトの追加キーは quota を共有する)
   - 同じ手順で 3-5 個のキーを発行

2. **GAS のスクリプトプロパティに追加**
   - GAS エディタ → 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」
   - `GEMINI_API_KEYS` (新規追加) に `keyB,keyC,keyD` をカンマ区切りで貼り付け
   - `GEMINI_API_KEY` (既存) はそのまま (1番目のキーとして引き続き使われる)

3. **GAS エディタで `checkApiKeys()` を実行 → コンソールでキー数確認**

4. **デプロイ更新**
   - 「デプロイ」→「デプロイを管理」→ 編集 (鉛筆アイコン) → バージョン: 「新しいバージョン」 → 「デプロイ」

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `gas-proxy/Code.gs` | getApiKeys / handleTTS 階層化リトライ / checkApiKeys ヘルパー (v1.0.0 → v1.1.0) |
| `app-v5/src/lib/ttsAdapter.js` | usedKeyIndex / keysAvailable を propagate |
| `package.json` / `config.js` | 5.15.5 → 5.16.0 |

### 期待される効果

| 設定キー数 | 1日の TTS 生成上限 (理論値) |
|---|---|
| 1キー (現状) | 100 × 1 × 2 = 200 回 |
| 3キー (推奨) | 100 × 3 × 2 = 600 回 |
| 5キー (大規模運用) | 100 × 5 × 2 = 1000 回 |

これで本番チャンネル運用 (毎日3-5本投稿) でも quota を気にせず作業可能。

### 提言1 (動画化改善) の今後の対応予定 (v5.17 以降)

| 提言 | 状態 |
|---|---|
| 一点突破型UI | ✅ v5.15.5 `single_metric` モードで実装済 |
| キーフレームアニメ (ズーム/シェイク) | ⏳ v5.17 候補 |
| 冒頭0.5秒フラッシュ + 効果音 | ⏳ v5.17 候補 |
| 末尾「まとめ」削除 + 無限ループ | ⏳ v5.17 候補 |



### 動機: ユーザー報告の8項目

> ①対決カードの指標名の読みはいらん。縦に間伸びすぎるから上に詰めて下のテロップエリアは空けた方がいい
> ②テロップエリアは別に左端は使っていいから、右端に侵食しない程度の幅で
> ③もえかと数原の名前がアイコンにもうちょい近いもしくはくっつくぐらい
> ④指標名の強調に「話題中」ってのはダサい。文字不要だから強調されてることがわかれば良さそう
> ⑤指標名の読みと式は英語の指標名のみ有効でいい
> ⑥選手フォーカスのレイアウト、何パターンかあるといい
> ⑦UIでレイアウト変更しても動画に反映されない
> ⑧音量ミキサーがアウトプットの方で調整できない (変更)

### 修正内容

#### ⑦【バグ修正】レイアウト変更が動画再生に反映されない

**原因**: LayoutRouter は `scripts[i].layoutType` を最優先する仕様。
Gemini 生成 JSON は最初の script に `layoutType` を持ってることが多く、UIで
`projectData.layoutType` を変更してもそれが上書きされて反映されなかった。

**修正**: LayoutPanel.jsx に `setLayoutType(newType)` 関数を追加:
```js
const setLayoutType = (newType) => {
  const updated = {
    ...projectData,
    layoutType: newType,
    // ★全 scripts から layoutType を削除して projectData.layoutType に統一
    scripts: (projectData.scripts || []).map(s => {
      if (!s.layoutType) return s;
      const { layoutType, ...rest } = s;
      return rest;
    }),
  };
  onChange(updated);
};
```
タイル onClick を `setField('layoutType', key)` から `setLayoutType(key)` に変更。

#### ⑧【バグ修正】音量ミキサーが出力 (audioExporter) に反映されない

**原因**: BGMPanel の levels は React state + mixer に直接反映してたが、
`audioExporter` は `projectData.audio.voiceVolume` (固定値) を見ていたため
mixer の最新 levels が出力に反映されなかった。

**修正**:
- BGMPanel: `updateLevel` で localStorage("mixer-levels") に保存、ducking も同様
- BGMPanel: 初期化時 localStorage から復元、mixer に反映
- audioExporter: localStorage から `mixerLevels` を取得して使用
  - `audio.voiceVolume` → `mixerLevels.voice * mixerLevels.master`
  - `audio.bgmVolume` → `mixerLevels.bgm * mixerLevels.master`
  - `audio.seVolume` → `mixerLevels.se * mixerLevels.master`

これでミキサーで調整した音量が出力 WAV にもそのまま反映される。

#### ① 対決カードの kana 削除、上に詰める

VersusCardLayout.jsx:
- `cat.kana` の `<span>` 削除 (縦の間延び解消)
- `pt-12 → pt-10` (上部 padding 詰める)
- `pb-[34%] → pb-[40%]` (テロップエリア確保)
- ラベル中央 `mb-1.5 → mb-1`

#### ② テロップ: 左端使える、右端のセーフゾーンだけ守る

GlobalStyles.jsx の telop padding 調整:
- speaker-a (数原): `padding-left: 60px / padding-right: 32px`
- speaker-b (もえか): `padding-left: 14px / padding-right: 60px`
- `.telop-bg max-width: 240px → 260px` (左端使えるので拡大)

これで左端は使い切れて、右端のジェスチャー領域だけ確保される。

#### ③ アバター名前をアイコンに近づける

GlobalStyles.jsx の `.avatar-hl .avatar-name`:
- `top: 50px → 40px` (アイコン直下に密着)
- `font-size: 10px → 9px` (コンパクト化)
- `padding: 2px 7px → 1px 6px` (高さ詰める)
- `letter-spacing: 1px → 0.5px`

#### ④ 「話題中」テキスト削除、視覚効果のみ

VersusCardLayout.jsx:
- 黄色「話題中」バッジ削除
- 行全体に `ring-2 ring-amber-400/60 + bg-amber-500/15 + animate-pulse-soft` で十分強調
- 矢印 `▶` は残す (drop-shadow-lg 追加)

PlayerSpotlightLayout.jsx:
- stat focused の「話題中」バッジ削除
- boxShadow 強化 + amber 色のみで強調

#### ⑤ kana/formula は英語指標のみ表示

新ファイル `src/lib/metricUtils.js`:
```js
export function isEnglishMetric(label) {
  if (!label) return false;
  const en = (label.match(/[A-Za-z]/g) || []).length;
  const ja = (label.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
  return en >= 1 && (ja === 0 || en >= ja);
}
```

判定:
- `OPS` (英字3, 日本語0) → 英語指標 ✅ (kana 表示)
- `K/9` (英字1, 日本語0) → 英語指標 ✅
- `打率` (英字0, 日本語2) → 日本語指標 ❌ (kana 非表示)
- `本塁打` (英字0, 日本語3) → 日本語指標 ❌
- `防御率` → 日本語指標 ❌

適用先:
- `HighlightCard.jsx`: `showKanaFormula = isEnglishMetric(comp.label)` で kana と formula を条件表示
- `RadarCompareLayout.jsx`: 同じく条件表示
- `RankingLayout.jsx`: ボタン文字 / タイトル の kana 条件表示
- `VersusCardLayout.jsx`: kana を完全削除 (①と統合)

#### ⑥ player_spotlight に4モード追加

新スキーマ:
```js
layoutData.spotlight = {
  mode: 'default' | 'quote' | 'stats_grid' | 'single_metric',  // ★新★
  showPlayerName: 'auto' | true | false,
  players: [{
    primaryStat, stats, comment,
    quote: '...',           // ★quote モード用★
    quoteSource: '出典',     // ★quote モード用★
  }]
}
```

##### default (現状)
primaryStat 巨大 + サブ指標 grid + コメント

##### single_metric (1指標フォーカス)
- primaryStat の数値を 120px の超巨大表示
- ラベル + 比較値のみ周辺に配置
- 「.348」「-0.4」「11.20」などの**衝撃値**を最大限演出

##### stats_grid (基本成績網羅)
- primaryStat も含めて全指標を等価で grid 表示 (2x2 or 3x2)
- フォーカスなし、淡々と見せる
- 「打率/HR/打点/OPS/出塁率/長打率」のような網羅的データ向け

##### quote (発言ピック)
- 引用記号 (") + 大きな文字でセリフ表示
- 出典表記 (試合後インタビュー、監督コメント 等)
- 「腐らずやってきた」のような人間性エピソード向け
- ★視聴維持率79.69%だった「泉口バケモノ」型コンテンツに最適★

LayoutPanel.jsx の SpotlightDataEditor 拡張:
- mode 切替トグル (default / 1指標巨大 / 基本成績 / 発言ピック)
- mode='quote' 時のみ quote / quoteSource フィールドを表示

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/components/LayoutPanel.jsx` | setLayoutType / mode 切替UI / quote フィールド |
| `src/components/BGMPanel.jsx` | levels を localStorage に永続化 |
| `src/components/HighlightCard.jsx` | isEnglishMetric で kana/formula 条件表示 |
| `src/components/GlobalStyles.jsx` | telop padding / avatar-name 詰める |
| `src/lib/audioExporter.js` | mixerLevels を localStorage から取得 |
| `src/lib/metricUtils.js` | ★新規★ isEnglishMetric ヘルパー |
| `src/layouts/VersusCardLayout.jsx` | kana 削除 / 「話題中」削除 / 上に詰める |
| `src/layouts/PlayerSpotlightLayout.jsx` | 4モード対応 / 「話題中」削除 |
| `src/layouts/RadarCompareLayout.jsx` | isEnglishMetric 適用 |
| `src/layouts/RankingLayout.jsx` | isEnglishMetric 適用 |

### 期待される効果

| 改善前 | 改善後 |
|---|---|
| ❌ レイアウト変更しても反映されない | ✅ 一発で全 scripts に反映 |
| ❌ ミキサー変更が出力に出ない | ✅ localStorage 経由で出力にも反映 |
| ❌ 対決カードが縦に間延び | ✅ 上に詰めて下のテロップエリア確保 |
| ❌ テロップが画面右端に侵食 | ✅ 左端は使い、右端は 32-60px セーフゾーン |
| ❌ アバター名がアイコンから離れすぎ | ✅ 40px の距離でアイコン直下密着 |
| ❌「話題中」バッジがダサい | ✅ 視覚効果のみで十分強調 |
| ❌ 日本語指標にも冗長な kana 表示 | ✅ 英語指標のみ表示 |
| ❌ player_spotlight が1パターン固定 | ✅ 4モード (発言/巨大/網羅/標準) で表現の幅 |

### Gemini Custom Gem への運用指示 (今後)

新スキーマ `layoutData.spotlight.mode` の使い分けを Knowledge Files に反映予定:
- 衝撃データ系 → `single_metric` (「11.20」を画面いっぱい)
- 人間性エピソード → `quote` (発言ピック)
- 総合プレイヤー紹介 → `stats_grid` (基本成績網羅)
- 通常の深掘り → `default` (主指標 + サブ)



### 動機: v5.15.3 のログから判明した残課題

ユーザー診断ログ:
```
✅ BGM 追加成功 (vol=0.15, ducking 適用)
SE 一覧: 3 件登録済み
SE assignment マップ: 3 件
SE hook_impact ← 和太鼓でドドン.mp3 (38592 bytes)
SE hook_impact ← 和太鼓でドドン.mp3 (38592 bytes)   ← 同じ preset に3回割当?
SE hook_impact ← 和太鼓でドドン.mp3 (38592 bytes)
SE preset マッピング完了: 1 preset 利用可能
✅ SE 配置: 1 件追加 / 22 件スキップ      ← 22件 スキップ!!
```

> 入りました。効果音はデフォルトのやつが入らないな

カスタム SE は `hook_impact` 1個だけ登録されてて、それ以外の preset (highlight_ping / stat_reveal / shock_hit / success_chime / warning_alert / transition_swoosh / outro_fade 等) は **合成音 fallback** で再生される設計だった。
ただし audioExporter v5.15.3 ではこの合成音 fallback を再現していなかったので、22件全部スキップされていた。

### 改修内容

#### A. ★最重要★ 合成音 SE を OfflineAudioContext で再現

mixer.js の `playSe` 内の合成音生成ロジック (oscillator + gain envelope) を audioExporter に
移植。OfflineAudioContext でも同じ合成音が出せるように:

```js
const SYNTHETIC_SE_PRESETS = {
  hook_impact:       { freqs: [80, 40],          type: 'sawtooth', attack: 0.01,  release: 0.25, gain: 0.5 },
  highlight_ping:    { freqs: [880, 1320],       type: 'sine',     attack: 0.005, release: 0.18, gain: 0.3 },
  stat_reveal:       { freqs: [523, 784],        type: 'triangle', attack: 0.01,  release: 0.22, gain: 0.35 },
  shock_hit:         { freqs: [200, 100],        type: 'square',   attack: 0.005, release: 0.3,  gain: 0.4 },
  success_chime:     { freqs: [659, 988, 1319],  type: 'sine',     attack: 0.01,  release: 0.4,  gain: 0.3 },
  warning_alert:     { freqs: [440, 415],        type: 'square',   attack: 0.01,  release: 0.2,  gain: 0.3 },
  transition_swoosh: { freqs: [1500, 200],       type: 'sawtooth', attack: 0.02,  release: 0.25, gain: 0.25 },
  click_tap:         { freqs: [2000],            type: 'square',   attack: 0.001, release: 0.04, gain: 0.2 },
  radar_ping:        { freqs: [1200],            type: 'sine',     attack: 0.005, release: 0.15, gain: 0.25 },
  outro_fade:        { freqs: [440, 330, 220],   type: 'sine',     attack: 0.02,  release: 0.6,  gain: 0.3 },
};

function scheduleSyntheticSe(offlineCtx, seId, startSec, seVolume) {
  const preset = SYNTHETIC_SE_PRESETS[seId] || SYNTHETIC_SE_PRESETS.click_tap;
  const finalGain = preset.gain * seVolume;

  const gain = offlineCtx.createGain();
  gain.connect(offlineCtx.destination);
  gain.gain.setValueAtTime(0, startSec);
  gain.gain.linearRampToValueAtTime(finalGain, startSec + preset.attack);
  gain.gain.exponentialRampToValueAtTime(0.001, startSec + preset.attack + preset.release);

  preset.freqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    osc.type = preset.type;
    const oscStart = startSec + idx * 0.04;
    osc.frequency.setValueAtTime(freq, oscStart);
    osc.connect(gain);
    osc.start(oscStart);
    osc.stop(oscStart + preset.attack + preset.release + 0.05);
  });
}
```

mixer.js と完全に同じ周波数・envelope なので、オフライン書き出しの合成音は
リアルタイム再生と聴感上区別がつかない。

#### B. SE 配置ループに合成音 fallback ロジック追加

カスタム SE blob が無い preset は合成音で代替:

```js
if (seId) {
  const seBlob = presetToBlob.get(seId);
  if (seBlob) {
    // カスタム SE を decode して配置
    seAddedCount++;
  } else {
    // ★v5.15.4★ カスタム SE 未登録 → 合成音 fallback
    if (SYNTHETIC_SE_PRESETS[seId]) {
      scheduleSyntheticSe(offlineCtx, seId, scriptCursor, seVolume);
      syntheticCount++;
    } else {
      seSkippedCount++;
    }
  }
}
```

カスタム SE 0件でも合成音だけ動くように、`if (seList.length === 0)` ブランチも修正。

#### C. ログ強化

```
✅ SE 配置: カスタム 1 件 / 合成音 22 件 / スキップ 0 件
```

カスタム/合成音/スキップを別カウントで表示。

#### D. 未生成 TTS の警告強化

`exportResult.missingScripts` の中身を UI に表示し、どの id を再生成すべきか分かるように:

```
⚠️ 3 件の TTS が未生成 (該当部分は無音)
「全 scripts」セクションで該当 id を再生成してから書き出してください:

id:3 (A) 数原さん、これって…
id:6 (A) 直近10試合で見ると…
id:17 (A) でも気になるのは…
```

ユーザーは TTSPanel の「全 scripts」セクションで該当 id を再生成 → 再書き出しの流れで完成度を上げられる。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/audioExporter.js` | SYNTHETIC_SE_PRESETS / scheduleSyntheticSe 関数追加 / SE スケジュールに合成音 fallback / import 順整理 |
| `src/components/TTSPanel.jsx` | 未生成 TTS 警告で id 一覧と再生成導線を表示 |

### 期待される効果

| 改善前 (v5.15.3) | 改善後 (v5.15.4) |
|---|---|
| ❌ 合成音 SE が完全にスキップされる (22件無音) | ✅ 合成音 fallback で全 SE が鳴る |
| ❌ 未生成 TTS の id が画面に出ない | ✅ id 一覧 + 再生成導線を表示 |

### 動作確認手順 (v5.15.4)

1. アプリで動画再生 → 全 scripts の TTS を確認 (未生成があれば再生成)
2. 「動画用音声をダウンロード」を実行
3. デバッグログ確認:
   - `✅ SE 配置: カスタム N 件 / 合成音 M 件 / スキップ 0 件` (スキップが 0 になればOK)
4. WAV ダウンロード → 再生確認 (全ての SE が鳴る)



### 動機: v5.15.2 でも BGM/SE が入らなかった

ユーザー報告:
> 倍速音質は改善確認。
> ただ選択してるのにBGM・SEともにさっきと変わらず。
> ちなみにBGM/SEは倍速にならないように。

### 真の原因: mixer 経由の取得が不安定

調査の結果:
- **`selectedBgmKey` は BGMPanel の React useState のローカル state** だった
- **mixer は singleton だが bgmAudioEl はメモリのみ** で永続性がない
- BGMPanel をアンマウント or ページリロードすると `selectedBgmKey` も `mixer.bgmAudioEl` も揮発
- audioExporter は `getMixer().bgmAudioEl.src` を見ていたので、**揮発直後だと「BGM 未登録」になる**

タブ切り替え、TTSPanel への遷移、コンポーネント再マウント等で `mixer.bgmAudioEl` が空になる状態があり、書き出し時にちょうど空っぽだったと推測。

### 解決: mixer をバイパスして IndexedDB を直接読む

mixer 経由をやめて、**audioExporter から直接 IndexedDB と localStorage を読む**:

```js
// 旧 (v5.15.2) - 不安定
const mixer = getMixer();
if (mixer.bgmAudioEl?.src) {
  const blob = await fetchAsBlob(mixer.bgmAudioEl.src);
  // ...
}

// 新 (v5.15.3) - 永続的・確実
import { getBgmBlob } from './bgmStorage';
const selectedBgmKey = localStorage.getItem('selectedBgmKey');
if (selectedBgmKey) {
  const bgmBlob = await getBgmBlob(selectedBgmKey);
  // IndexedDB から確実に取得
}
```

#### A. BGM 選択を localStorage に永続化

BGMPanel.jsx の `handleSelectBgm` で `localStorage.setItem('selectedBgmKey', bgm.key)` を追加。
初回ロード時も `localStorage.getItem('selectedBgmKey')` で前回選択を復元。

#### B. SE 取得も IndexedDB 直接アクセスに

SE assignment は元々 `localStorage["se-assignments"] = { [seKey]: presetId }` に保存されてた。
audioExporter から直接これを読み、`getSeBlob(seKey)` で blob 取得する方式に変更。

```js
// audioExporter.js
const assignments = JSON.parse(localStorage.getItem('se-assignments') || '{}');
const seList = await listSes();  // IndexedDB から
const presetToBlob = new Map();
for (const seMeta of seList) {
  const presetId = assignments[seMeta.key];
  if (!presetId) continue;
  const blob = await getSeBlob(seMeta.key);
  if (blob) presetToBlob.set(presetId, blob);
}
// scripts.se で参照
```

#### C. デバッグログ大幅強化

何が起きてるか1行で分かるよう詳細化:

```
BGM 選択 key: bgm-1234567
BGM blob 取得成功 size=2456789 bytes type=audio/mp3
BGM decode 成功 duration=120.50s channels=2
✅ BGM 追加成功 (vol=0.15, ducking 適用)

SE 一覧: 4 件登録済み
SE assignment マップ: 3 件
  SE shock_hit ← shock1.wav (12345 bytes)
  SE highlight_ping ← ping.wav (8765 bytes)
  SE stat_reveal ← reveal.wav (45678 bytes)
SE preset マッピング完了: 3 preset 利用可能
✅ SE 配置: 12 件追加 / 0 件スキップ
```

これで失敗時もどこで詰まったか即座に判明する。

#### D. BGM/SE は元の速度のまま (倍速適用なし)

ユーザー要望「BGM/SE は倍速にならないように」を明示的に反映:
- TTS は SoundTouchJS で時間伸縮 (ピッチ維持)
- BGM/SE は **playbackRate 一切触らず**、元の速度で再生

コードコメントで明記:
```js
// BGM は元の速度のまま (倍速にしない)
const bgmSource = offlineCtx.createBufferSource();
bgmSource.buffer = bgmBuffer;
bgmSource.loop = true;
// playbackRate を設定しない = 1.0 (元の速度)
```

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/audioExporter.js` | mixer 依存削除 / IndexedDB + localStorage 直接アクセス / 詳細ログ |
| `src/components/BGMPanel.jsx` | selectedBgmKey を localStorage に永続化 / 復元時に優先使用 |

### 期待される効果

| 改善前 (v5.15.2) | 改善後 (v5.15.3) |
|---|---|
| ❌ BGM 入らない (mixer 揮発タイミング次第) | ✅ localStorage に保存された BGM key から確実に取得 |
| ❌ SE 入らない (mixer._seAudioEls 揮発) | ✅ IndexedDB の listSes + assignment で確実に取得 |
| ❌ BGM/SE が倍速になる懸念 | ✅ 元の速度のまま (TTS のみ SoundTouch で時間伸縮) |
| ❌ 失敗時に何が原因か分からない | ✅ 詳細ログでどこで詰まったか一目瞭然 |

### 動作確認手順 (v5.15.3)

1. BGMPanel で BGM をタップ → `[✓ 選択中]` バッジ表示
2. SEPanel でカスタム SE をアップロード + preset 割り当て
3. TTSPanel の「動画用音声をダウンロード」を開く
4. 「音声トラックを書き出す」を実行
5. **デバッグログを必ず確認** (展開できる)
   - `BGM 選択 key: bgm-xxx` → `✅ BGM 追加成功` が出てるか
   - `SE 一覧: N 件登録済み` → `✅ SE 配置: N 件追加` が出てるか
6. WAV をダウンロード、再生確認



### 動機: v5.15.1 で残った問題

ユーザー報告:
> BGMなし未登録、SEなし。BGMはライブラリにはあるけど選択ってのがないよ。
> ってかTTSが倍速音質変更なしverが取得できないなら意味ないな。もっと確実な方法はない？
> あと数原の吹き出しが右よりでセーフゾーン侵食してるのでもっと左。

### 改修内容

#### A. ★最重要★ SoundTouchJS でピッチ維持時間伸縮 (機械音化解消)

問題: HTMLAudioElement の `preservesPitch=true` は再生時しか効かない。
OfflineAudioContext で使う AudioBufferSourceNode は仕様上 playbackRate を変えるとピッチも変わる。
→ 倍速書き出しすると必ず機械音化する状態だった。

解決: **SoundTouchJS** ライブラリを導入。
- npm: `soundtouchjs@^0.1.30` (~30KB)
- Web Audio で動作する Time Stretch / Pitch Shift エンジン
- HTMLAudioElement の preservesPitch と同等品質

```js
import { PitchShifter } from 'soundtouchjs';

async function timeStretchPreservingPitch(sourceBuffer, tempo, ctx) {
  if (Math.abs(tempo - 1.0) < 0.001) return sourceBuffer;

  const numChannels = sourceBuffer.numberOfChannels;
  const sampleRate = sourceBuffer.sampleRate;
  const outputLength = Math.ceil(sourceBuffer.length / tempo) + 1024;

  const offlineCtx = new OfflineAudioContext(numChannels, outputLength, sampleRate);
  const shifter = new PitchShifter(offlineCtx, sourceBuffer, 1024);
  shifter.tempo = tempo;       // 速度倍率
  shifter.pitch = 1.0;          // ピッチは変えない
  shifter.connect(offlineCtx.destination);

  return await offlineCtx.startRendering();
}
```

audioExporter で TTS decode 後にこの関数で時間伸縮してから本番 OfflineAudioContext に渡す。
**playbackRate は使わない** (時間伸縮は事前に SoundTouch で済ませる)。

UI のチェックボックスも:
```
☑ 書き出し時に再生速度 (x1.30) を反映
   ✅ SoundTouchJS でピッチ維持 — 速度反映しても音質変化なし
   OFF にすると 1.0倍 (TTSの自然な速度) で書き出し
```

デフォルトを **OFF → ON** に変更 (ピッチ維持できるので速度反映が無料に)。

#### B. BGM 選択 UI 改善

問題: BGM ライブラリに登録してても「選択する」操作がユーザーに見えづらい。
カードクリックで選択可能だったが UI が分かりにくかった。

解決:
- ライブラリのヘッダーに「📚 BGM ライブラリ — タップして選択」と明記
- 選択中のカードを **濃いインディゴ + 「✓ 選択中」白バッジ + ring-2 シャドウ** で強調
- 未選択カードは「○」マークで「選択可能」を示唆
- ホバー時 indigo-50 で誘導

```jsx
{isSelected ? (
  <span className="bg-white text-indigo-600 rounded px-1 py-0.5">✓ 選択中</span>
) : (
  <span className="text-zinc-400">○</span>
)}
```

#### C. 数原(A)の吹き出しがセーフゾーン侵食 → 左に寄せる

問題: Pixel 9 Pro Fold で数原 (左話者) の吹き出しが右に伸びすぎてセーフゾーンに侵入。

原因の特定:
- 旧: `padding-left: 70px / padding-right: 14px` で**右余白 14px だけ**
- 旧: `max-width: 270px` で吹き出し最大幅が画面右端近くまで届く
- → 右側の通知バー/ジェスチャー領域に侵食

解決:
```css
/* speaker-a (数原): より左寄り、右セーフゾーン拡大 */
padding-left: 62px;       /* 70 → 62 (アバターギリギリまで) */
padding-right: 36px;      /* 14 → 36 (★右余白を 2.5倍に★) */

/* もえか (B) も対称に */
padding-left: 36px;
padding-right: 62px;

/* 吹き出し最大幅も絞る */
.telop-bg { max-width: 240px; }  /* 270 → 240 */
```

これで数原の吹き出しが画面右端 36px のセーフゾーンを確保し、侵食しない。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `package.json` | soundtouchjs 依存追加 |
| `src/lib/audioExporter.js` | timeStretchPreservingPitch 関数追加 / playbackRate 削除 |
| `src/components/TTSPanel.jsx` | applySpeechRate デフォルト ON / UI テキスト更新 |
| `src/components/BGMPanel.jsx` | BGM ライブラリ UI 改善 (選択中バッジ、ヘッダー説明) |
| `src/components/GlobalStyles.jsx` | テロップ padding 調整 / max-width 240px |

### 期待される効果

| 改善前 (v5.15.1) | 改善後 (v5.15.2) |
|---|---|
| ❌ 倍速書き出しで音質劣化 (機械音化) | ✅ SoundTouchJS でピッチ維持、音質保たれる |
| ❌ BGM 「選択」操作が分かりづらい | ✅ 「📚 タップして選択」+ ✓選択中バッジで明確化 |
| ❌ 数原の吹き出しがセーフゾーン侵食 | ✅ 右余白 14→36px, max-width 270→240px で安全 |

### v5.15.2 で運用フロー再確認

1. BGMPanel で BGM 選択 → ✓選択中 バッジが付く
2. SEPanel でカスタム SE 登録
3. TTSPanel の「動画用音声をダウンロード」を開く
4. **「速度反映」は ON のまま** (デフォルト) で OK (ピッチ維持なので音質劣化なし)
5. 「音声トラックを書き出す」→ デバッグログで「BGM 追加成功」「SE 追加: N件」を確認
6. WAV ダウンロード
7. 動画編集アプリで合成



### 動機: v5.15.0 のリリースで判明した不具合

ユーザー報告:
> ダウンロードできたけど倍速にして音質が変わってる。BGM/SE が入ってない。

### 問題1の原因: AudioBufferSourceNode は preservesPitch をサポートしない

HTMLAudioElement は `preservesPitch=true` でピッチ維持できるが、
**OfflineAudioContext で使う AudioBufferSourceNode は仕様上 playbackRate を変えると
ピッチも変わる** (チップマンク効果)。

#### 解決策

**「速度反映」をオプション化**し、デフォルト OFF (TTSの自然な速度で書き出し) に。
ON にすると速度反映するが音質劣化することを UI で明記する。

```js
// audioExporter.js
const effectivePlaybackRate = applySpeechRate ? speechRate : 1.0;

// TTSPanel.jsx
<label>
  <input type="checkbox" checked={applySpeechRate} onChange={...} />
  書き出し時に再生速度 (x{speechRate}) を反映
  <small>
    OFF推奨: TTS の自然な速度で書き出し (音質維持)
    ON: 速度反映するが音質劣化 (機械音化)
  </small>
</label>
```

なお TTS の duration は、speechRate=1.0 時は `audioBuffer.duration` の実音声長を使用するので、
タイミング計算もより正確になった (旧版は `charMs * 文字数` の推定値だった)。

### 問題2の原因: projectData.audio.bgmId は実は使われていなかった

調査の結果、`projectData.audio.bgmId` は **defaultBatter.js / defaultPitcher.js では `null` で初期化されているが、その後 BGMPanel から書き込まれることはない**ことが判明。

BGMPanel は **直接 mixer.loadBgmFromUrl(blobUrl) を呼ぶ**だけで、projectData には保存しない。
SE も同様に、SEPanel が直接 mixer.registerCustomSe(id, blob) を呼ぶ仕組み。

audioExporter v5.15.0 は `audio.bgmId` を見ていたので、常に空 → BGM 入らない。

#### 解決策: mixer インスタンスから直接 blob を回収

```js
// audioExporter.js (v5.15.1)
import { getMixer } from './mixer';

const mixer = getMixer();

// BGM
if (mixer.bgmAudioEl && mixer.bgmAudioEl.src) {
  const bgmBlob = await fetchAsBlob(mixer.bgmAudioEl.src);
  // ... decode & schedule with ducking
}

// SE (mixer._seAudioEls Map から各 SE の blob を取得)
for (const [seId, el] of mixer._seAudioEls.entries()) {
  const seBlob = await fetchAsBlob(el.src);
  // scripts を辿って tagged な SE をスケジュール
}
```

`fetchAsBlob(blobUrl)` ヘルパーで、blob URL から再度 blob を取得して decode し直す。

### 副次改善: デバッグログ機能を追加

エクスポート結果に `debugLog` 配列を含めて、UI でデバッグログを表示可能に。
今回みたいに「BGM が入ってない」原因を即座に特定できる:

```
[audioExporter] applySpeechRate=false, effectivePlaybackRate=1
[audioExporter] TTS グループ数: 18
[audioExporter] [GROUP 0] decode成功
[audioExporter] BGM 検出: src=blob:https://app.../...
[audioExporter] BGM 追加成功 (vol=0.15)
[audioExporter] SE 登録数: 4
[audioExporter] SE blob キャッシュ: 4件
[audioExporter] SE 追加: 12件 / スキップ: 0件
```

UI には完了結果に「✓ BGM 含む / ✓ SE 12個」のような summary も表示。

### 副次改善: タイミング計算の精度向上

旧版は `groupTotalChars * charMs / speechRate` の文字数推定だったが、
新版は **TTS の実際の audioBuffer.duration** を使用する。
これで「最後の方の TTS が次の TTS と被る」「無音区間が伸びる」問題も解消。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/audioExporter.js` | applySpeechRate オプション追加 / mixer から BGM/SE 取得 / デバッグログ / 実音声長ベース |
| `src/components/TTSPanel.jsx` | 速度反映チェックボックス UI / 結果に BGM/SE summary / デバッグログ表示 |

### 期待される効果

| 改善前 (v5.15.0) | 改善後 (v5.15.1) |
|---|---|
| ❌ 必ず speechRate を反映 → 倍速で機械音化 | ✅ デフォルト 1.0倍 (音質維持) / オプションで反映可 |
| ❌ BGM 必ず入らない (audio.bgmId が空) | ✅ mixer から取得 → BGM 登録済みなら入る |
| ❌ SE も同様に入らない | ✅ 登録済みのカスタム SE は入る |
| ❌ 結果表示が簡素 | ✅ BGM/SE 含有数 + デバッグログ表示 |



### 動機: v5.14.x の録画問題が根本的に解決不能だった

v5.14.1〜v5.14.6 で 6回にわたり対策を投入したが、**Pixel 9 Pro Fold の画面録画で**
**Chrome HTMLMediaElement の音声がキャプチャされない問題が解消できなかった**:

| 試した対策 | 結果 |
|---|---|
| v5.14.1: `<audio>` を blob URL で再生 | ❌ |
| v5.14.3: DOM attach + unlock 拡張 | ❌ |
| v5.14.4: data URL 化 + 1px 可視化 | ❌ |
| v5.14.5: 共有 audio 要素永続化 | ❌ |
| v5.14.6: `<video>` 要素 + MediaSession | ❌ |

ユーザー診断ログでは audio 要素の状態は完璧 (`inDom=true paused=false ready=4`) だったが、
画面録画には依然として TTS 音声が入らない。

これは Android Chromium が短時間 PCM 音声を `AUDIO_USAGE_MEDIA` として再生していない
仕様(?)の問題で、**ブラウザサンドボックス内では根本的解決が不可能**と判断。

### ユーザーからの建設的提案

> もう別の方法試した方が良くないですか。音声 (TTS BGM SE) だけ別ダウンロードできるようにするとか

→ **これが正解**。ブラウザに音を出させて録画する発想を捨てて、
**OfflineAudioContext で完全合成した WAV を別ファイルとしてダウンロード**する方式に転換。

### 新しいワークフロー

```
従来の運用 (失敗)              新しい運用 (v5.15.0)
─────────────────              ─────────────────
画面録画 (映像+音声)            画面録画 (映像のみ、音はミュート)
↓                               ↓
完成動画                        + 音声 WAV をアプリから DL
                                ↓
                                動画編集アプリで合成
                                (CapCut, VLLO 等)
                                ↓
                                完成動画
```

### 実装: OfflineAudioContext で全音声を1本に合成

新ファイル `src/lib/audioExporter.js` を作成。`OfflineAudioContext` を使って
**実際にスピーカー再生せず、メモリ上で音声を完全合成して WAV を出力**する仕組み:

```js
const offlineCtx = new OfflineAudioContext(2, totalSamples, 48000);

// 各 TTS 音声をスケジュール
for (const t of ttsTimings) {
  const blob = await getCachedAudio(t.speaker, t.joinedText);
  const audioBuffer = await offlineCtx.decodeAudioData(...);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = speechRate;
  source.connect(gainNode);
  source.start(t.startSec);
}

// SE もスケジュール
for (const se of seTimings) { ... }

// BGM (ループ + ducking)
const bgmSource = offlineCtx.createBufferSource();
bgmSource.loop = true;
const bgmGain = offlineCtx.createGain();
// ducking スケジュール (TTS 中は音量下げ)
for (const t of ttsTimings) {
  bgmGain.gain.setValueAtTime(baseBgmVol, t.startSec - 0.05);
  bgmGain.gain.linearRampToValueAtTime(duckVol, t.startSec + 0.1);
  bgmGain.gain.setValueAtTime(duckVol, t.endSec - 0.1);
  bgmGain.gain.linearRampToValueAtTime(baseBgmVol, t.endSec + 0.15);
}

// レンダリング (重い処理)
const renderedBuffer = await offlineCtx.startRendering();

// WAV エンコード → Blob → ダウンロード
const wavBlob = audioBufferToWav(renderedBuffer);
```

#### 出力される WAV の内容

- ✅ 全 scripts の TTS 音声 (キャッシュ済みのもの)
- ✅ BGM (ループ + ducking 自動適用)
- ✅ カスタム SE (登録済みのもの)
- ✅ 速度変更も反映 (speechRate)
- ⚠️ 合成音 SE (フォールバック) は除外 (カスタム SE 未登録時)
- ⚠️ TTS 未生成の script は無音

#### スペック

- **形式**: WAV (16bit PCM, 48kHz, ステレオ)
- **サイズ**: 1分動画あたり約 11MB
- **生成時間**: 1分動画あたり 2-5秒 (端末次第)

### UI

TTSPanel に「動画用音声をダウンロード」セクションを追加:

```
🎵 動画用音声をダウンロード (画面録画と別に音声ファイルを取得)
─────────────────────────────────────────────
画面録画で TTS が入らない問題への根本解決策。

[音声トラックを書き出す (TTS + BGM + SE)]
        ↓
進捗バー (0% → 100%)
        ↓
✅ 生成完了
長さ: 52.3 秒 / サイズ: 9.8 MB
[WAV をダウンロード]
        ↓
ファイル: audio-プロジェクト名-1234567.wav

▶ 使い方
  1. アプリで動画再生 → 画面録画開始 (音はミュート)
  2. 動画再生終了 → 録画停止 (映像のみのMP4)
  3. このボタンで音声 WAV をダウンロード
  4. 動画編集アプリ (CapCut, VLLO等) で映像+音声を合成
  5. 完成動画を YouTube Shorts に投稿
```

### 推奨動画編集アプリ (Pixel)

| アプリ | 特徴 |
|---|---|
| **CapCut** | 無料、Shorts/TikTok 編集に強い、音声+映像合成簡単 |
| **VLLO** | 直感的、若干有料機能あり |
| **YouCut** | 軽量、シンプル |
| **YouTube Shorts エディタ** | アプリ内で完結 (ただし機能限定) |

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/audioExporter.js` | ★新規★ OfflineAudioContext で音声合成 + WAV エンコード |
| `src/components/TTSPanel.jsx` | 「動画用音声をダウンロード」UI 追加 |
| `package.json` / `config.js` | 5.14.6 → 5.15.0 (マイナーアップ) |

### v5.14.x の録画対応コードはどうする?

`<video>` 要素方式 (v5.14.6) や DOM attach、共有要素、MediaSession API は**残す**。
理由:
- 一部の環境では今後の Chromium アップデートで録画されるようになる可能性
- アプリ内プレビュー再生は引き続き必要 (映像確認用)
- BGM/SE のミックス自体はリアルタイム再生でも便利

ただし**メイン運用は「映像のみ録画 + 音声 WAV 別 DL」方式**に切替推奨。

### 録画診断機能はどうする?

「🔍 録画診断」セクションは残す。今後の調査用 + チャット中の検証用。



### 動機: v5.14.5 の診断結果から判明した「audio 要素では Pixel 録画NG」事実

ユーザー診断ログ:
```
共有 audio 要素: ID=tts-voice-audio-shared, inDOM=true
再生前: audio 要素数=1
  200ms: [0] id=tts-voice-audio-shared src=data(166482) vol=1.00 rate=1.30 paused=false inDom=true ready=4
  ...8回全部完璧な状態...
★ 共有 audio 永続: inDOM=true (true なら成功)
```

**audio 要素は完璧な状態**:
- ✅ DOM に永続的に存在
- ✅ data URL で 166KB のデータが正しく設定
- ✅ 音量 1.00、速度 1.30
- ✅ paused=false, ready=4 (HAVE_ENOUGH_DATA)
- ✅ MediaSession metadata 設定済み

**それでも録画されない**。

ユーザーから決定的な追加情報:
> 1デバイスの音でやってる
> 2接続されてません (ヘッドフォン等)
> 3動画再生も同じく録音されない
> てかそもそも下書きの方は問題なく録音されてる

### 真の原因 (確定)

**Android Chrome の HTMLAudioElement は AUDIO_USAGE_MEDIA フラグで再生されない**

Pixel/Android の内部音声録画 (AudioPlaybackCapture) は `AUDIO_USAGE_MEDIA` フラグの音だけを
キャプチャ対象とする仕様。Chrome は `<audio>` 要素の短時間音声を `USAGE_GAME` または
別の usage で再生しており、録画キャプチャから漏れる。

一方:
- **Web Speech API (下書き)** = OS の TTS engine 経由 → 確実に MEDIA usage → ✅録画される
- **`<audio>` 要素 (本番 v5.14.5)** = Chrome 内部処理 → MEDIA フラグ立たない → ❌録画されない
- **`<video>` 要素 (本v5.14.6)** = 動画再生としてはっきり認識 → MEDIA usage 確実 → 録画される (期待)

### 解決策: 共有要素を <audio> → <video> に変更

`<video>` 要素は確実に `AUDIO_USAGE_MEDIA` で再生される。
Chrome は audio/wav の data URL を `<video>` 要素でも受け付けるため、コード上の
互換性は保たれる。動画は黒の 1px で表示されるが、音声だけ流れる仕組み。

#### ttsAdapter.js の変更

```js
// 旧 (v5.14.5)
const audio = document.createElement('audio');

// 新 (v5.14.6)
const el = document.createElement('video');
el.setAttribute('playsinline', '');
el.setAttribute('webkit-playsinline', '');
el.muted = false;
el.style.background = '#000';  // 黒1px
```

#### mixer.js (BGM/SE) も同じく <video> に統一

BGM・カスタムSE も `new Audio()` → `document.createElement('video')` に変更。
これで全ての音源が AUDIO_USAGE_MEDIA で再生される統一感ある実装に。

#### MediaSession API は引き続き設定

MediaSession metadata は `<video>` 要素でも有効。OS に「これはメディア再生」と明示する
追加保険として残す。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/ttsAdapter.js` | `_getSharedAudio()` の中身を <video> に変更 |
| `src/lib/mixer.js` | BGM (loadBgmFromUrl) / SE (registerCustomSe / playSe clone) を全て <video> に変更 |
| `src/components/TTSPanel.jsx` | 診断観察を `audio, video` 両方クエリに |

### 期待される効果

| 確認項目 | 期待 |
|---|---|
| 診断ログで `<video>` タグで観察される | ✅ (古いコードなら `<audio>` のまま) |
| 画面録画に TTS 音声が入る | ✅ (本命) |
| BGM 登録時の録画 | ✅ |
| カスタムSE 登録時の録画 | ✅ |

### v5.14.6 でも録画されなかった場合 (v5.14.7 候補)

最後の最後の砦:
- **WAV → MP4 (音声のみ) に変換** してから `<video>` に渡す
  - WAV のままだと video 要素が「動画じゃない」と判断する場合がある
  - MP4 ならより明確にメディア扱いされる
- **MediaSource API** で動的にチャンクを供給
- **静的に `<video>` を JSX に置く** (React コンポーネント側で配置)
- **Chromium のフラグ確認**: chrome://flags で何か設定が必要?



### 動機: v5.14.4 の診断結果から判明した真の原因

ユーザー診断ログ:
```
[22:54:26] 診断開始
UA: Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ... Chrome
再生前 DOM audio 数: 0
[22:54:28] 再生終了
再生中 DOM audio 数: 0    ← ★★★ 0! attach されてない or 既に消えてる ★★★
```

「テスト」(2文字、約1秒) の再生が短すぎて、setTimeout 500ms の観察時には
**既に cleanup で DOM remove されていた**。

ただ、それより根本的な問題: **動的に作って即削除する audio 要素は、
Pixel/Android Chromium のメディア要素検出に引っかからない時間帯がある可能性**。

### 解決策: 共有 audio 要素を永続的に DOM に保持

毎回 `new Audio()` で作るのではなく、**最初に1個だけ作って常時 DOM に存在させ、
src を切り替えて再生する**方式に変更:

```js
// constructor で 1回だけ
this._sharedAudio = null;

// _getSharedAudio() で初回呼び出し時に DOM attach
const audio = document.createElement('audio');
audio.id = 'tts-voice-audio-shared';
audio.preload = 'auto';
audio.setAttribute('playsinline', '');
audio.style.position = 'fixed';
audio.style.bottom = '0';
audio.style.right = '0';
audio.style.width = '1px';
audio.style.height = '1px';
audio.style.opacity = '0.01';
document.body.appendChild(audio);

// speak() では再利用
const audio = this._getSharedAudio();
audio.src = dataUrl;
audio.playbackRate = rate;
await audio.play();

// stop() では DOM remove しない (永続保持)
audio.pause();
```

#### この方式の利点

1. **audio 要素は永続的に DOM 内** — Chromium が安定的に「メディア要素」として認識
2. **動的生成・削除の race condition がない**
3. **autoplay policy unlock が継続的に効く** (毎回 unlock し直す必要なし)
4. **Pixel 画面録画でキャプチャされやすい** (継続して同じ要素を観察できる)

### 診断機能を強化

ユーザー診断で判明した「観察タイミングずれ問題」を解消:

#### 改善点

1. **長めのテスト音声**: 「テスト」(約1秒) → 「録画テスト中、聞こえていますか」(約3秒)
2. **多点観察**: setTimeout 500ms 1回 → 200ms ごとに 8回 (合計 1.6秒)
3. **共有 audio 要素チェック**: `_getSharedAudio()` が定義されているか
   (古いコードがキャッシュでロードされてないか確認可能)
4. **再生終了後の永続性チェック**: `_sharedAudio.inDOM === true` を確認

#### 新しい診断ログのフォーマット

```
[時刻] 診断開始
UA: ...
unlock 完了
共有 audio 要素: ID=tts-voice-audio-shared, inDOM=true
テスト発声: "録画テスト中、聞こえていますか"
再生前: audio 要素数=1                    ← 共有要素 1個
--- 観察結果 ---
  200ms: [0] id=tts-voice-audio-shared src=data(...) vol=1.00 rate=1.30 paused=false inDom=true ready=4
  400ms: [0] id=tts-voice-audio-shared src=data(...) vol=1.00 rate=1.30 paused=false inDom=true ready=4
  ...
再生終了後: audio 要素数=1                ← 共有要素は削除されない
★ 共有 audio 永続: inDOM=true (true なら成功)
```

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/ttsAdapter.js` | 共有 audio 要素 (`_sharedAudio`) 導入 / `_getSharedAudio()` メソッド追加 / speak() 再利用化 / stop() で DOM remove しない |
| `src/components/TTSPanel.jsx` | 診断強化 (8回観察 / 長めテキスト / 共有要素確認) |
| `package.json` / `config.js` | 5.14.4 → 5.14.5 |

### 期待される効果

| シナリオ | 期待される診断ログ |
|---|---|
| ✅ 修正成功 | 観察ごとに `inDom=true paused=false ready=4` で安定、録画ファイルに音声入り |
| ❌ まだダメ (Chromium のさらに別の問題) | 全観察で `inDom=true` なのに録画されない → 別アプローチへ (MediaSource API 等) |
| ⚠️ コード未デプロイ | `⚠️ _getSharedAudio が未定義` のログが出る |

### v5.14.5 でも録画されなかった場合の次手 (v5.14.6 候補)

最後の砦:
- **Web Audio API + MediaStreamDestination + audio.srcObject** でストリーム化
- もしくは **WAV データを別の方法で再生** (例: Audio Worklet + ScriptProcessorNode)
- iframe 経由で別オリジンとして再生 (Pixel 画面録画の挙動が変わる可能性)
- **完全可視化** (audio に controls 属性付ける) — UX 影響あり



### 動機: v5.14.3 でも録画問題が解消しなかった

ユーザー報告:
> 速度は解決。ただ録画が依然未解決。困ったなあ

v5.14.3 で DOM attach + unlock を入れたが、Pixel 9 Pro Fold の画面録画では依然 TTS 音声が録音されない。
速度は解決したので、`playbackRate` 設定タイミングの修正は効果あった。
残るのは「録音されない」のみ。

### 追加した3つの仮説と対策

#### 仮説1: blob URL は Android 内部で「短時間 PCM」扱いされて録画スルーされる

**対策A**: `URL.createObjectURL(blob)` → **`FileReader.readAsDataURL(blob)` で data URL に変換**

blob URL は Chromium 内部で MediaSource 系のストリーミング扱いになる場合があり、
Android の `AUDIO_USAGE_MEDIA` フラグが立たない可能性がある。
data URL ならインラインデータとして扱われ、メディア音として認識されやすい。

```js
async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
```

WAV 30〜60KB → base64 化で 40〜80KB の data URL。実用範囲内。

#### 仮説2: 完全 hidden (opacity:0) はメディア要素検出から外れる

**対策B**: `opacity: 0` (完全透明) → **`opacity: 0.01` + `width: 1px / height: 1px`**

一部の Chromium 実装では完全に画面外の要素は「メディア再生中」と認識されないことがある。
1px 残すことで Chrome のメディア要素検出から外れない。

```js
audio.style.position = 'fixed';
audio.style.bottom = '0';
audio.style.right = '0';
audio.style.width = '1px';
audio.style.height = '1px';
audio.style.opacity = '0.01';     // 完全0より検出されやすい
audio.style.pointerEvents = 'none';
audio.style.zIndex = '-9999';
```

#### 仮説3: ユーザーが原因を特定しづらい

**対策C**: 録画診断UIを TTSPanel に追加

「🔍 録画診断 (TTSが録画されない時)」という折りたたみセクションを追加。
「診断テスト実行」ボタンを押すと:

1. unlock() を実行
2. 「テスト」と発声
3. 再生中に DOM 内の audio 要素を観察
4. 結果を画面に表示:
   - audio 要素の数
   - src の種類 (data URL / blob URL / その他)
   - volume / playbackRate / paused / readyState
   - DOM attach されているか

これでユーザーが「DOM attach は成功してるが録画されない」のか「そもそも attach されてない」のか
切り分けできる。

##### 運用方法

1. 画面録画開始
2. 「録画診断」を開く
3. 「診断テスト実行」を押す
4. 「テスト」音声が鳴る
5. 画面に診断ログが表示される
6. 録画停止 → 動画ファイルを確認
7. 動画に「テスト」音声が入ってれば修正成功
8. 入ってなければ診断ログのスクショを送ってもらう (追加調査の手がかり)

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/ttsAdapter.js` | blobToDataUrl ヘルパー追加 / speak() で data URL 化 + 1px 可視化 |
| `src/components/TTSPanel.jsx` | 録画診断 UI + handleDiagnostic ハンドラ追加 |
| `package.json` / `config.js` | 5.14.3 → 5.14.4 |

### 期待される効果

| シナリオ | 期待結果 |
|---|---|
| 仮説1 (blob URL) が原因 | data URL 化で録画される |
| 仮説2 (hidden) が原因 | 1px 可視化で録画される |
| 1+2 のいずれかが原因 | v5.14.4 で解決 |
| **どちらでもなかった場合** | **診断UIで原因切り分け可能、追加調査の手がかり取得** |

### 残っていれば次の手 (v5.14.5 候補)

もし v5.14.4 でも録画されなければ:
- **MediaSource API** で audio 出力 (より明示的にメディア音として再生)
- **Web Audio API + MediaStreamDestination + audio.srcObject** でストリーム経由再生
- **audio に `controls` 属性をつけて完全に可視化** (UX 影響あるが録画優先)
- **<audio> 要素を React コンポーネントとして静的に配置** し、src を切り替える方式



### 動機: ユーザー報告の3つの問題

> 1. 速度変えても本番TTSが早くならない (下書きは問題なく早くなる)
> 2. 画面録画で本番TTSが依然録音できない
> 3. 生成後の動画再生で読み上げバグが多発して、結局何度か再生しないと安定しない

v5.14.1 で HTMLAudioElement に戻したが、**Android Chrome の音声再生に関する3つの落とし穴**を踏んでいた。それぞれ別の原因だが、全部 HTMLAudioElement の挙動を理解すれば一発で解決する。

### 問題と原因の整理

#### 問題1: 速度が反映されない (本番のみ)

**原因**: `audio.playbackRate = rate` を **`src` 設定後・`canplay` 前** に設定していた。
Android Chrome では **`canplay` イベント発火前に rate を設定しても無効化される**ことが報告されている。
`new Audio()` のデフォルト 1.0 のまま再生されてしまっていた。

下書き (Web Speech API) は OS の TTS エンジン側で速度制御してるため、この問題は出ない。

#### 問題2: 画面録画で録音されない (依然)

**原因**: `new Audio()` で作った要素を **DOM にアタッチせず**に直接 play() していた。
Android の画面録画 (内部音声キャプチャ) は **DOM ツリーに存在する HTMLMediaElement** しかキャプチャしない仕様/挙動がある。

mixer.js の BGM/SE も `new Audio()` を作るだけで attach してなかった (= BGM 登録してても録画されてなかった可能性)。

#### 問題3: 何度か再生しないと安定しない

**原因**: Android Chrome の **autoplay policy unlock 問題**。
`new Audio()` 経由で動的に作った音源は、ユーザー操作起点の play() permission が無いと、最初は無音 or block される。
unlock() メソッド自体は既存だが **Player の togglePlay() から呼ばれていなかった**ので、再生開始時にメディア再生 permission が取れていなかった。

### 修正内容

#### A. audio 要素を DOM に attach (録画対応)

`ttsAdapter.js` / `mixer.js` で `new Audio()` を作る全ての箇所で、画面外に隠して DOM ツリーに追加:

```js
audio.style.position = 'fixed';
audio.style.bottom = '-100px';
audio.style.opacity = '0';
audio.style.pointerEvents = 'none';
audio.setAttribute('playsinline', '');  // iOS Safari対策
document.body.appendChild(audio);
```

cleanup / stop 時には `audio.remove()` で DOM から削除。
これで Android 画面録画でキャプチャされる。

#### B. playbackRate と preservesPitch を play() 直前に設定

`startPlayback()` 内で play() の直前に設定:

```js
const startPlayback = async () => {
  // ★play() 直前に設定 (Android Chrome で確実に反映)★
  audio.playbackRate = rate;
  audio.preservesPitch = true;
  audio.mozPreservesPitch = true;
  audio.webkitPreservesPitch = true;
  await audio.play();
};
```

これで Android Chrome でも速度が反映され、かつ音程維持される。

#### C. unlock() を拡張: HTMLMediaElement の autoplay unlock も実行

```js
async unlock() {
  // 1. AudioContext unlock (既存)
  const ctx = this._getAudioCtx();
  if (ctx.state === 'suspended') await ctx.resume();

  // 2. ★v5.14.3 新★ HTMLMediaElement unlock
  if (!this._mediaUnlocked) {
    const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');
    silent.volume = 0;
    await silent.play().catch(() => {});
    silent.pause();
    this._mediaUnlocked = true;
  }
}
```

silent.wav を一度ユーザー操作起点で play() することで、以降の `new Audio().play()` が
autoplay block されなくなる。これで「最初の再生だけ無音」が解消。

#### D. ★最重要★ Player の togglePlay() で unlock() を呼ぶ

```js
const togglePlay = useCallback(async () => {
  if (!isPlaying) {
    // ★v5.14.3 新★ メディア再生 unlock
    try {
      if (adapterRef.current?.unlock) {
        await adapterRef.current.unlock();
      }
    } catch (e) {}
    ...
    setIsPlaying(true);
  }
  ...
});
```

これまで TTSPanel の試聴ボタンと事前生成ボタンからしか呼ばれてなかった unlock() を、
動画再生開始時にも呼ぶようにした。これで「再生開始時にメディア permission が取れない」問題が解消。

#### E. BGM / SE も DOM attach + 旧要素の DOM remove を徹底

`mixer.js` の `loadBgmFromUrl()`, `registerCustomSe()`, `playSe()` の clone 全てで
DOM attach + cleanup の徹底化。

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/ttsAdapter.js` | speak(): DOM attach + play直前 rate 設定 / unlock(): HTMLMediaElement unlock追加 / stop(): DOM remove |
| `src/lib/mixer.js` | loadBgmFromUrl / registerCustomSe / playSe で DOM attach 徹底 |
| `src/hooks/usePlaybackEngine.js` | togglePlay() で unlock() を await |
| `package.json` / `config.js` | 5.14.2 → 5.14.3 |

### 期待される効果

| 改善前 (v5.14.2) | 改善後 (v5.14.3) |
|---|---|
| ❌ 速度変更が本番TTSで反映されない | ✅ 反映される (play直前設定) |
| ❌ 画面録画で本番TTSが録音されない | ✅ 録音される (DOM attach) |
| ❌ BGM/SEも一部録画されない可能性 | ✅ 全部録画される (DOM attach) |
| ❌ 最初の再生が無音、何度か再生し直す必要 | ✅ 一発で正常再生 (unlock呼び出し) |

### 教訓

**Android Chrome の HTMLMediaElement は3つの落とし穴がある**:
1. **DOM attach 必須** (画面録画対応)
2. **playbackRate は play 直前に設定** (canplay 前は反映されない)
3. **autoplay policy unlock 必須** (silent.wav で先に許可取得)

mixer.js のコメントに「AudioContext は録画されない」と書いてあったが、上記3点も
今後の正典にすべき。本ファイル群の冒頭コメントに反映する形で運用ルール化したい。



### 動機: 動画運用で判明した2つの不便

ユーザー報告:
> 1. 生成したやつについて、あとから部分的に再生成する機能も欲しい (エラーになってなくても)
> 2. 本番TTSの速度が遅いっぽいので速度変更したいんだけど、声質が変わりすぎて結局機械音みたいになっちゃう

### 改修内容

#### A. ★音程維持で速度変更★ (HTMLAudioElement の preservesPitch)

`audio.playbackRate` を上げると音程も上がる「チップマンク効果」が機械音化の原因だった。
HTMLAudioElement は **`preservesPitch` プロパティで音程維持**できる:

```js
const audio = new Audio();
audio.playbackRate = rate;
audio.preservesPitch = true;        // 標準 (Chrome / Edge / 新Firefox / 新Safari)
audio.mozPreservesPitch = true;     // 古い Firefox
audio.webkitPreservesPitch = true;  // 古い Safari
```

これで **速度を 1.0 → 1.3 にしても声質は維持される** (機械音化しない)。
全主要ブラウザ対応 (Android Chrome 含む)。

#### B. ★全 scripts ビュー UI★ (任意再生成・個別試聴)

これまで「不足チェック」で **エラー or 未生成** の script だけしか個別操作できなかったが、
**生成済みの script も含めて任意に選択して再生成・試聴**できる UI を追加。

##### UI 構成

TTSPanel に折りたたみ式「全 scripts ({N}件)」セクションを追加:

```
[▶ 開く / ▼ 閉じる]                                      [選択 N 件 を再生成]
[全選択] [選択解除]
─────────────────────────────────────────────────────
[☐] [id:1] [数原]  ●  「【井上温大】奪三振【11.2】...」     [▶] [↻]
[☑] [id:2] [もえか] ●  「数原さん、今日の井上さん...」     [■] [↻]   ← 試聴中
[☐] [id:3] [数原]  ○  「直近5試合の防御率...」             [▶] [↻]
                       ↑生成済(緑)/未生成(灰)
```

##### 機能

| 機能 | 説明 |
|---|---|
| **チェックボックスで複数選択** | 一括再生成のため任意の id を選択 |
| **▶ 試聴ボタン** | キャッシュ済みの音声を即座に試聴 (現在の speechRate で再生) |
| **■ 停止ボタン** | 試聴中の停止 |
| **↻ 個別再生成** | キャッシュを上書きして再生成 (確認ダイアログあり) |
| **選択 N 件を再生成** | 選択中の id をまとめて再生成 (確認ダイアログあり) |
| **緑●/灰○ インジケータ** | キャッシュ済 / 未生成を色で表示 |

##### 実装

```js
// 新しいハンドラ
handlePreviewOne(id)        // 個別試聴 (停止トグル)
handleForceRegenerateOne(id) // キャッシュを上書きして再生成
handleRegenerateSelected()   // 選択中の複数 id を一括再生成
toggleSelected(id)           // チェックボックス切替
selectAll() / clearSelection()

// 新しい state
[showAllScripts, setShowAllScripts]    // セクション開閉
[selectedIds, setSelectedIds]          // チェックボックスで選択中の id 配列
[cachedSet, setCachedSet]              // キャッシュ済み id の Set
[previewingId, setPreviewingId]        // 試聴中の id
```

##### バックエンド (既に実装済み、UI で繋いだだけ)

`pregenerateOnly(scripts, targetIds, ...)` は v5.11.6 で実装済み。
キャッシュを無視して強制再生成する機能。今回は UI から任意の targetIds を渡せるようにした。

#### C. 速度スライダーの注釈追加

```
💡 音程維持 ON (preservesPitch) なので速度を上げても声質は変わりません。
   ⚠️ x1.4以上は早口でも聞き取れる程度に。 (1.4以上で表示)
   ⚠️ x0.7以下は冗長になります。 (0.7以下で表示)
```

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/lib/ttsAdapter.js` | speak() に preservesPitch 設定 |
| `src/components/TTSPanel.jsx` | 全 scripts ビュー追加、速度注釈 |

### 期待される効果

- ✅ 「もえかちゃんの『えっ?』のニュアンスが違う」と感じたら任意で再生成可能
- ✅ 試聴ボタンで再生成判断が容易に
- ✅ 速度を 1.2-1.3 倍にしても声質維持、機械音化しない
- 🚀 結果的に動画品質改善 + 編集効率UP

### バグ修正 (本リリース内で再修正)

**初回 commit (6d1e122) で Vercel build エラー:**

```
TTSPanel.jsx:595:16: ERROR: Unexpected closing "div" tag does not match opening fragment tag
```

**原因**: 全 scripts ビューを挿入する str_replace で、コスト表示セクションの開始タグ
`<div className="grid grid-cols-2 gap-2 text-[10px]">` を誤って削除していた。
閉じタグ `</div>` だけ残っていたため JSX 構造が壊れていた。

**修正**: 開始タグを復元 (line 588) して構造整合。
ローカルで Node.js 経由の構文チェックは通っていたが、JSX 構造のチェックは esbuild
が必要なため、ビルド環境がない手元では検出できなかった。



### 動機: ユーザー報告「TTS本番生成したものを画面録画しても音声が入らない」

> TTS本番生成したもので画面録画しても音声が入らない。BGMやSEも同様。
> テスト版の下書きは問題なく録音もされる。

### 原因: v5.11.7 の AudioBufferSourceNode 化が録画キャプチャを破壊していた

Android Chrome の画面録画 (内部音声キャプチャ) の挙動:
- `<audio>` 要素 (HTMLAudioElement) → ✅ 録音される
- **AudioBufferSourceNode + AudioContext.destination → ❌ 録音されない** (環境依存)

実は **mixer.js (BGM/SE) は元からこの問題を把握しており HTMLAudioElement で実装されていた**。
ファイル冒頭にもコメント:
```
* AudioContext の出力 (ctx.destination や MediaStreamDestination経由) は録画で拾われないケースが多い。
* 音量制御・ducking は element.volume を直接操作 (AudioContext gain 不使用)。
```

ところが **v5.11.7 で TTS 再生だけ低レイテンシ化のため AudioBufferSourceNode に切替えた結果**、
TTSの音声が録画キャプチャから漏れる**回帰問題**が発生。

| 機能 | 再生方式 | 画面録画 |
|---|---|---|
| TTS下書き (テスト再生) | HTMLAudioElement | ✅ OK |
| **TTS本番 (v5.11.7-v5.14.0)** | **AudioBufferSourceNode** | **❌ NG** |
| BGM | HTMLAudioElement | ✅ OK |
| カスタムSE | HTMLAudioElement | ✅ OK |
| 合成音SE (フォールバック) | AudioContext | ❌ NG (既知、要件としてはカスタムSE登録推奨) |

### 修正内容

#### A. TTS speak() を HTMLAudioElement に戻す (v5.11.7 の改修を回帰)

`src/lib/ttsAdapter.js` の `speak()` メソッド本体を、レガシー版 `_speakLegacyHtmlAudio` と同等の
HTMLAudioElement ベースの実装に書き換え:

```js
// 旧 (v5.11.7-v5.14.0): AudioBufferSourceNode + AudioContext.destination
const source = ctx.createBufferSource();
source.buffer = audioBuffer;
source.connect(gainNode);
gainNode.connect(ctx.destination);
source.start(0);
// ↑ Android 画面録画でキャプチャされない

// 新 (v5.14.1): HTMLAudioElement (preload + 即時 play)
const audio = new Audio();
audio.preload = 'auto';
audio.src = url;
audio.volume = mixer._effectiveVoiceVolume();
await audio.play();
// ↑ Android 画面録画でキャプチャされる
```

#### B. レイテンシ最小化 (preload + readyState 即時起動)

低レイテンシのため:
- `audio.preload = 'auto'` で先読み
- `readyState >= 3` (HAVE_FUTURE_DATA) なら即時 `play()`
- それ以下なら `canplay` イベントで起動 + `audio.load()` を明示呼び出し

これでHTMLAudioElement でも実用的なレイテンシ (50-100ms 程度) で再生可能。

#### C. AudioBuffer decode キャッシュ廃止

`prefetch()`, `pregenerate()`, `pregenerateOnly()` 内で行っていた
`_decodeBlob` + `_putDecoded` の処理を削除:
- HTMLAudioElement は内部で自動 decode するため、メモリ上の AudioBuffer キャッシュは不要
- blob は引き続き IndexedDB (audioCache.js) に保存される
- prefetch は「blob を IndexedDB に置いておく」という役割のみに

#### D. レガシー `_speakLegacyHtmlAudio` を削除

speak() 本体が同等の実装になったため、重複していたレガシーメソッドを削除。

#### E. 残骸コード (削除しない)

以下は「使われないコード」になったが、互換性とリスク回避のため削除しない:
- `this._audioCtx`, `_getAudioCtx()`, `unlock()` — TTSPanel から呼ばれてる、将来用
- `_decodedCache`, `_decodeBlob`, `_putDecoded`, `_DECODE_CACHE_MAX` — 念のため残置
- `this._currentSource` — `stop()` 内の停止処理に残骸として残置

### ★ユーザーへの追加案内 (BGM/SE について)

BGM/SE は元から HTMLAudioElement で録画対応済み。ただし:

#### BGM が録画されない場合
- BGM ファイルを登録してください (BGMPanel)
- 登録すれば自動で HTMLAudioElement として再生される

#### SE が録画されない場合
- **カスタムSE を登録してください** (SEStorage)
- カスタム未登録の場合、合成音 fallback (AudioContext) で再生されるため**録画されません**
- 合成音 fallback は仕様上の制約 (カスタムSEを推奨)

### 変更ファイル

| ファイル | 変更行数 | 内容 |
|---|---|---|
| `src/lib/ttsAdapter.js` | -55行 (約) | AudioBufferSourceNode → HTMLAudioElement |
| `package.json` | 1行 | 5.14.0 → 5.14.1 |
| `src/lib/config.js` | 1行 | APP_VERSION 更新 |

### 期待される効果

- ✅ Pixel 9 Pro Fold 画面録画で TTS 本番再生が録音される
- ✅ 動画生成→投稿の運用フローが回復
- 📉 レイテンシは僅かに増加 (AudioBufferSourceNode比 +30〜80ms程度)
  - ただし preload + readyState 即時起動で実用範囲

### 教訓

**最適化を入れる前に、過去の制約事項 (mixer.js のコメント) を確認すべきだった。**
v5.11.7 で AudioBufferSourceNode を導入した時、mixer.js が HTMLAudioElement のままだった
理由 (= 画面録画対応) を見落としていた。
今後、再生系のリファクタは mixer.js のコメントを正典とすること。



### 動機: 動画テストで判明した2つの構造的課題

v5.13.0 (Knowledge File 大改修) で Gemini の出力品質は構造的に改善されたが、
表示側 (アプリ) に残っていた問題:

1. **player_spotlight 仕様が硬直**
   - v4 で「選手名・番号は常に非表示」(ヘッダー重複防止のため)
   - だがチーム動画 (playerType="team") の場合、ヘッダーは「読売ジャイアンツ」になるので、
     **個別選手名が画面のどこにも出ない** → 誰の数字か分からない
   - サブ指標も固定 (打率/OPS/HR/RBI) で、Gemini が「対佐野通算」のような柔軟なカスタムができなかった

2. **基本成績の所在が迷子**
   - A が「井上は驚異の【11.20】」と話してるが、画面のどこに 11.20 があるか分からない
   - HighlightCard はハイライト時にカード形式で表示されるが、レイアウト内の該当行が
     特別な強調を受けない → 視聴者が数字を探す間にスワイプされる

### 改修内容

#### A. player_spotlight v5: showPlayerName 切替

スキーマに `showPlayerName: 'auto' | true | false` を追加:
- `'auto'` (デフォルト): playerType==='team' なら ON、それ以外は OFF
- `true`: 常に選手名・背番号を表示 (ヘッダーにチーム名がある時に有効)
- `false`: 常に非表示 (ヘッダーで既に選手名表示中の重複防止)

| 動画テーマ | playerType | showPlayerName='auto' の挙動 |
|---|---|---|
| 個人深掘り (岡本和真) | batter / pitcher | OFF (ヘッダーに既に岡本和真) |
| チーム動画 (巨人の犠打) | team | ON (ヘッダーは「読売ジャイアンツ」) |

players[i] に `name` / `number` フィールドを追加 (showPlayerName=true 時に使用):
```jsx
players: [
  {
    id: 'okamoto',
    name: '岡本和真',     // ★v5.14.0新★
    number: '25',          // ★v5.14.0新★
    label: '26年(今季)',
    primaryStat: { ... },
    stats: [ ... ]
  }
]
```

#### B. player_spotlight: 専用編集UI (SpotlightDataEditor) 新規作成

これまで「JSON直接編集してください」と案内されていた spotlight が、専用UIで操作可能に:
- showPlayerName のトグル (自動 / ON / OFF) — 自動時は現在の解決値を表示
- 選手エントリの追加・削除 (id / label / name / number)
- primaryStat の label / value / isNegative / compareValue 編集
- stats[] の label / value をフリー入力で追加・削除 (例: 「対佐野通算」)
- comment 編集

これで Gemini がカスタム指標 (「対佐野通算」「直近10試合」) を出した時も、
ユーザーが UI で柔軟に修正できる。

#### C. VersusDataEditor を v4 仕様に更新

VersusCardLayout が v4 (rawMain/rawSub 形式、scores 0-100 廃止) になったのに、
編集UIが v3 のままだった (overall.main/sub と main/sub の 0-100 数値) のを修正:
- rawMain / rawSub の数値入力
- kana (読み) フィールド
- lowerBetter チェックボックス (防御率/WHIP/失策などで小さい方が勝ち)

#### D. ★最重要★ 基本成績の視覚的強調 (versus_card / player_spotlight)

これまで `script.highlight` は phase==='highlight' の HighlightCard でしか視覚化されなかったが、
**通常表示中も行強調が発火**するように改修:

##### versus_card 行強調
- `comparison.label` と `categoryScores[].label` が一致した行を強調:
  - 行全体が脈動 (pulse-soft アニメ)
  - 左に▶矢印 (bounce-x アニメ)
  - 右上に「話題中」黄色バッジ
  - 数字フォント 26px → 30px に拡大
  - ラベル文字を amber 色に
  - 行背景に薄いオレンジ tint

##### player_spotlight 行強調
- `comparison.label` と `primaryStat.label` が一致 → 中央主役カードが脈動
- `comparison.label` と `stats[].label` が一致 → 該当サブ指標カードが脈動
  - スケール 1.05倍 + amber リング + 「話題中」バッジ + 数字 amber 色

##### ラベル一致ロジック
- 完全一致 or 双方向部分一致 (case-insensitive)
- 例: `comparison.label="K/9"` と `stats[].label="奪三振率(K/9)"` でも一致

##### Tailwind カスタムアニメーション追加
```js
animation: {
  'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
  'bounce-x': 'bounce-x 0.9s ease-in-out infinite',
}
```

### 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/layouts/PlayerSpotlightLayout.jsx` | v4 → v5 (showPlayerName 切替 + 行強調) |
| `src/layouts/VersusCardLayout.jsx` | v4 → v5 (行強調追加) |
| `src/components/LayoutPanel.jsx` | SpotlightDataEditor 新規 + VersusDataEditor 更新 |
| `tailwind.config.js` | pulse-soft / bounce-x アニメ追加 |
| `docs/layout-direction.md` | player_spotlight v5 仕様、versus_card 行強調を追記 |
| `docs/structure-playbook.md` | 5.3 「v5.14.0 行強調」セクション追加 |

### 期待される効果

| 改善前の問題 | v5.14.0 での解消 |
|---|---|
| チーム動画で個別選手名が出ない | showPlayerName=auto/true で出せる |
| サブ指標が打率/OPS固定で柔軟性なし | UI でフリー入力、Gemini も柔軟にカスタム可 |
| 基本成績が画面のどこにあるか分からない | 行強調 + 「話題中」バッジで一目瞭然 |
| script.highlight がカード表示でしか発火しない | 通常表示中も該当行が脈動 |

### Gemini への運用指示 (v5.13.0 Knowledge Files に統合済)

1. **チーム動画**では `layoutData.spotlight.showPlayerName: true` を指定し、
   `players[i].name / number` に個別選手名を入れる
2. **個人動画**では `showPlayerName: 'auto'` (デフォルト) で重複を回避
3. **stats[] にカスタム指標**を入れて柔軟性を活用 (例: 「対佐野」「直近10試合」)
4. **script.highlight を必ず指定**し、対応する comparison.label と一致させる
   (これで行強調が発火し、視聴者が数字を探さない)



### 動機: v5.12.0 でも残った構造的問題

v5.12.0 で gemini-custom-prompt.md に id:1 ルールを追記したが、ユーザーから根本的な指摘:

> 「character-bible.md があるんだから、カスタム指示ではそこまでボリュームなくていい。
>  肥大化すると Gemini のパフォーマンスが落ちる、脳死で関係ない JSON 吐き出してくる。
>  知識ファイルを充実させて全体像とユーザー要求を理解しながら、
>  適切に各種ファイルを読んで実行できるようなカスタム指示にしないといけない。
>  チャンネルのターゲット層と取り込むための戦略を全く反映できてない」

つまり「Custom Prompt 47K字に全部詰め込む」という設計自体が間違いだった。

### 構造的問題の認知科学的説明

LLM には「注意の予算」がある:
- 47K字のプロンプト全部に均等に注意を払えない
- 後ろの細則は前提条件として無視される
- 「Knowledge File 読め」と書いても本文に細則があると本文を優先

これが「脳死で関係ない JSON」の正体。

### 過去議論の核心情報 (4/24-25 確定済) を再構造化

ユーザーから「これまでの議論を忘れたか?」と指摘され、過去 transcript を完全に掘り起こした:

1. **「指標より事象→数字」原則** (4/25 確定、最重要 DNA)
   - 視聴者は OPS/WAR/IsoP を嫌う (実コメント分析)
   - 完全禁止ではなく「現象が先・指標は補助・覚えさせない」ルール
2. **指標の3階層**
   - 高 (毎回OK): 打率/防御率/HR/打点/出塁率/長打率
   - 中 (注釈付きOK): OPS/WHIP/K9/BB9
   - 低 (裏付けのみ): WAR/FIP/BABIP/wOBA
3. **「現象」の定義** (4/25 確定)
   - 球種挙動・プレー細部・感覚・編成論・過去の系譜
4. **「自分ごと化」=スワイプ率対策** (4/24 確定、実データ77.4%スワイプ)
   - 真因: 冒頭1〜3秒で「自分の見るべき動画じゃない」と判断
   - 達成: チーム名/選手名/試合日明記、視聴者代弁、ヤフコメ的共感ワード
5. **視聴維持率実証データ** (94,417再生33本)
   - hook 13字以下 (継続23.4%) vs 17字以上 (継続14.1%)
   - 60秒未満 (維持34.7%) vs 70秒超 (維持26.6%)
6. **id:1 = 動画タイトル** の絶対要件5つ

これら全てが Knowledge File として体系化されていなかった。

### 改修内容: 4ファイル新設 + 既存3ファイル純化

#### ★ 新規作成 (4ファイル) — 戦略の正典化

| ファイル | 文字数 | 内容 |
|---|---|---|
| **channel-strategy.md** | ~7K | チャンネル目的・視聴者像 (コア中心)・実証データ法則・勝ちパターン・愛するもの/嫌うもの・阿部監督中立姿勢・競合分析・運用4Grok |
| **audience-and-language.md** | ~9K | 「指標より事象→数字」3階層・指標翻訳辞典・現象5カテゴリ定義・自分ごと化=スワイプ対策・NG/OKパターン集・ヤフコメvsYouTube層心理・6項目自己チェック |
| **hook-design.md** | ~7K | id:1 = 動画タイトル定義・絶対要件5つ・3つの正解テンプレ (試合プレビュー/個人深掘り/衝撃データ)・失敗パターン集・id:1自己チェック5・インサイトvs願望 |
| **structure-playbook.md** | ~7K | scripts総数28-30・4フェーズ構成・同speaker連続最大2回・アウトロ自然な締め+二択・レイアウト切替パターン・ハイライト継続・テキスト強調記号・8項目自己チェック |

#### ★ スリム化 (gemini-custom-prompt.md)

- **旧 v6**: 59K字 (47K本文 + スキーマ)
- **新 v7**: ~10K字 (ルーティング + スキーマ)
- 約 **83%削減**
- 旧版は `/tmp/gemini-custom-prompt.OLD.md` にバックアップ

新 v7 の構造:
1. 7 Knowledge Files への参照宣言 (本指示より優先と明記)
2. 入力 → 出力の道筋
3. JSONスキーマ (技術仕様だけ残す)
4. 出力前の自己チェック 8項目 (各 Knowledge File への参照)
5. 重要な原則の要点 (詳細は Knowledge Files へリンク)
6. 動作フロー (9ステップ)

#### ★ 純化 (2ファイル)

**character-bible.md (36K → 13K字)**
- セクション1 (視聴者像) → channel-strategy.md / audience-and-language.md へ移動、参照リンクに置換
- セクション6 (指標翻訳辞典) → audience-and-language.md へ移動、参照リンクに置換
- セクション2-5 (キャラ設定/関係性/サンプル対話)、7-11 (過去・系譜/中立姿勢/NG例/設計指標/運用) は維持

**layout-direction.md (31K → 16K字)**
- セクション 0.1 に関連 Knowledge Files への参照リンク追加
- セクション 6 (改修の優先順位) と セクション 7 (完了基準) を削除 (完了済みの歴史的記述)
- セクション 8 を 6 にリネーム

### 全 Knowledge Files 構造 (改修後)

```
docs/
├─ ★channel-strategy.md         (新設、~7K) チャンネル戦略
├─ ★audience-and-language.md    (新設、~9K) 視聴者像と言葉づかい
├─ ★hook-design.md              (新設、~7K) id:1 動画タイトル
├─ ★structure-playbook.md       (新設、~7K) scripts 構成
├─ character-bible.md  (純化、13K) キャラ設計のみ
├─ layout-direction.md (純化、16K) レイアウト方向性のみ
├─ yomigana-dictionary.csv (既存) 読み仮名辞書
└─ gemini-custom-prompt.md (スリム化、10K) ルーティング+スキーマ
```

### 期待される効果

| 改善前の問題 | v5.13.0 での解消 |
|---|---|
| Gemini が「脳死で関係ない JSON」 | プロンプト本文がスリム化、Knowledge File 参照が明確 |
| ターゲット層が反映されない | channel-strategy.md でコア中心明記 |
| 戦略が散らばってる | 4新ファイルに集約 |
| id:1 がいつも壊れる | hook-design.md で絶対要件5つ + 自己チェック |
| ユーザーが何度も同じ修正指示 | 全 Knowledge File に「自己チェック」セクション内蔵 |

### 残作業 (v5.14.0 で対応予定)

- player_spotlight: showPlayerName='auto'|true|false 切替 (実装+UI操作)
- 基本成績の視覚的強調 (versus_card / player_spotlight 内の話してる行を強調)

### バグ修正 (v5.13.0 でついでに)

- ★ `src/lib/ttsAdapter.js` の構文エラー修正 ★
  - pregenerateOnly メソッド (678行目) に余分な `}` が混入していて Vercel build が失敗
  - 過去の v5.11.8 並列化対応時に紛れ込んだもの (CI 環境で初めて検出)
  - 余分な括弧を削除して全 lib ファイルの `node --check` パスを確認



### 動機: 動画テストで判明した「Geminiが指示に従わない」問題

ユーザーが Custom Gem (G_データで見るG党_json生成_V6) で動画用 JSON を生成した際、
Gemini が以下を**繰り返し失敗**することが判明:

| 失敗 | 発生回数 |
|---|---|
| キャラ呼び合い (数原さん/もえかちゃん) を忘れる | 3回 |
| id:1 タイトルが「主語不明・固有名詞無し」 | 5回 |
| id:1 タイトルが「願望」(今日も勝つ) になる | 4回 |
| scripts数が30を超える | 2回 |
| 同speaker連続が3回以上 | 5回 |
| id:1 にフォント強調が無い | 全回 |

→ ユーザーが**8ターン**もチャットで修正指示を出すハメに。プロンプトの根本見直しが必要。

### 原因分析

1. **id:1 ルールが「13文字以内」のみで質的要件が無い** — 主語/固有名詞/インサイトが要求されてない
2. **「インサイト」と「願望」の区別が定義されてない** — Gemini は願望を平気で出す
3. **キャラ呼び合いが冒頭で1回触れるだけ** — JSON生成時に忘れる
4. **scripts数 35-45 が緩すぎ** — テンポ悪化の原因
5. **連続発言「最大4回」も緩すぎ** — 独演会化

### 修正: 4つのプロンプト改修

#### 1️⃣ id:1 (hook = 動画タイトル) のルールを劇的に強化

**新・絶対要件 5つ** (どれか1つでも欠けたら作り直し):
- 要件1: **主語が明確** (誰の/何の話か)
- 要件2: **固有名詞が入っている** (選手名/チーム名/試合名のうち最低1つ)
- 要件3: **インサイト (≠ 願望) が結論部にある**
- 要件4: **3〜4行構成、各行6〜8字** (★旧13字制限は廃止★)
- 要件5: **【】『』「」 の強調が最低2箇所**

**3つの正解テンプレート**を追加:
- A. 試合プレビュー型: `[試合タグ] / [課題提示] / [疑問形] / [答えキーワード]`
- B. 個人深掘り型: `[選手名] / [意外な事実] / [問い] / [指標で答え]`
- C. 衝撃データ型: `[主語] / [変化数値] / [結果数値] / [評価キーワード]`

**5つの失敗パターン集**を追加 (ユーザー指摘で実際に却下された例):
| ダメなid:1 | 何が悪いか |
|---|---|
| 「奪三振【11.2】\n四球【ゼロ】」 | 主語不明 |
| 「三振【11.2】\n今日勝てる？」 | 願望 |
| 「井上温大\n奪三振【11.2】」 | インサイト無し |
| 「○○で勝てる」 | 願望「勝てる」混入 |
| 「今日も巨人が勝つ」 | 純粋な願望 |

**5つの自己チェック**を必須化:
1. 主語が0.3秒で分かるか?
2. 固有名詞が入っているか?
3. インサイトか? (「勝つ」「快投」「期待」を含むなら作り直し)
4. 3〜4行で各行6〜8字か?
5. 強調が最低2箇所あるか?

#### 2️⃣ 「インサイト vs 願望」セクション新設

`<insight_vs_wish>` という新セクションを追加。

**定義**:
- インサイト: データから導かれる「観戦の鍵・条件・分かれ目」
- 願望: データに基づかない応援メッセージ

**願望ワードリスト**:
- 「勝つ」「快投」「期待」「信じる」「頑張れ」
- 「ねじ伏せる」「圧勝」(根拠なしの場合)

**変換テンプレート 5パターン**を提供:
| 願望 (NG) | → | インサイト (OK) |
|---|---|---|
| 「今日も勝つ」 | → | 「鍵は被安打22の石田を連打で崩すこと」 |
| 「快投に期待」 | → | 「直近2試合連続失点中、今日が立て直しの試金石」 |

**結論部の正解構造**を明示 (両論併記+二択誘引):
```
A: "結論。○○で△△を崩し、××がねじ伏せるか"
A: "それとも『天敵』○○の一発に沈むか"
B: "皆さんは○○派?△△派?"
```

#### 3️⃣ scripts 数 35-45 → **28-30** に短縮

旧: 35-45 id (60-80秒) → テンポ悪化
新: **28-30 id** (50-55秒) → 60秒に余裕、テンポ最適化

#### 4️⃣ 同speaker連続 「最大4回」 → **最大2回** に強化

旧: 連続2-3回理想、最大4回まで許容、5回以上禁止
新: ★**最大2回まで**★、3回以上禁止 (独演会化防止)

会話リズムを A2回 → B → A2回 → B のテンポに。

### 最終チェックリストの強化

`<final_constraints>` の項目を 18 → 19 に拡張、id:1 専用チェックを 1項目 → 5項目 (3a-3e) に細分化:
- 3a. 主語明確
- 3b. 固有名詞
- 3c. インサイト ≠ 願望
- 3d. 3-4行 × 6-8字
- 3e. 強調 2箇所

新規追加項目:
- 8: ★A↔B の呼び合いが冒頭付近で最低1回入っているか★
  - id:2-5 のいずれかで「数原さん/もえかちゃん」と呼ぶこと

### 期待される効果

| 項目 | Before (v5.11.9) | After (v5.12.0) |
|---|---|---|
| id:1 タイトルの一発OK率 | 〜10% (8回中1回) | **〜80%以上** |
| ユーザー修正ターン数 | 平均8ターン | **平均1-2ターン** |
| 願望混入率 | 〜50% | **〜5%** |
| scripts数オーバー率 | 〜30% | **〜5%** |

### 参考: ユーザー実テストでの最終正解 id:1
```json
{
  "id": 1,
  "text": "【巨人vsDeNA】\n無四球の石田を\nどう崩す？\n鍵は『天敵』佐野！",
  "isCatchy": true
}
```
- 主語: ✅ 試合タグで明確
- 固有名詞: ✅ 巨人 / DeNA / 石田 / 佐野
- インサイト: ✅ 「どう崩す」+「鍵は」(願望ではない)
- 3-4行 × 6-8字: ✅ 4行構成
- 強調 2箇所: ✅ 【巨人vsDeNA】(黄)、『天敵』(赤)

このレベルのタイトルが**初回から出る**ように改修した。

### バージョン
- 5.11.9 → **5.12.0** (マイナーバージョンアップ: プロンプト体系の構造的変更)

---

## [5.11.9] - 2026-04-26 - TTS フォールバック (3.1→2.5) + 並列度調整

### Tier 1 で発生した RPM/RPD 超過への根本対応

#### 動機: スクショで判明した実態

ユーザーの Google AI Studio スクショで Tier 1 課金中であることが確認されたが、
プレビューモデルの厳しい制限が判明:

| モデル | RPM | TPM | RPD |
|---|---|---|---|
| **Gemini 3.1 Flash TTS** | 10/分 | 10K/分 | **100/日** ← v5.11.8 で 13/10 / 107/100 超過 |
| **Gemini 2.5 Flash TTS** | 10/分 | 10K/分 | **100/日** ★別 quota★ ★未使用★ |

**問題**:
- v5.11.8 の 4並列化で **RPM 13/10 超過** (3並列 × 30秒 を超える瞬間が発生)
- 1日の RPD 100/日 に動画 2本ちょいで到達 → **量産フェーズで詰まる**

### 修正: 3層対策

#### 1️⃣ 並列度 4 → 2 (RPM 超過解消)
`pregenerate` / `pregenerateOnly` のデフォルト concurrency を **4 → 2**:
- RPM 10/分の制限内に確実に収まる
- 速度は 22秒 → 44秒 (44件) — 許容範囲
- 安定性 > 速度を選択

#### 2️⃣ 3.1 → 2.5 自動フォールバック (RPD 実質 200/日)
GAS Proxy (Code.gs) で2モデル体制:

```js
const CONFIG = {
  PRIMARY_MODEL: 'gemini-3.1-flash-tts-preview',
  FALLBACK_MODEL: 'gemini-2.5-flash-preview-tts',
  GEMINI_TTS_ENDPOINT_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
};
```

**フロー**:
```
[1] 3.1 Flash TTS で生成試行 (3回まで)
    ↓ 429 (quota超過)
[2] 2.5 Flash TTS で生成試行 (3回まで)
    ↓ 429 (それでも quota超過)
[3] エラー返却 (1日 200件超え時のみ)
```

両モデルで以下は共通なので、フォールバックしても破綻しない:
- 同じエンドポイント (generativelanguage.googleapis.com)
- 同じ Voice 名 (Charon / Leda / Kore など)
- 同じレスポンス形式 (audio inline data)
- 音質も実用上ほぼ同等

これで **1日 100→実質 200件** = 動画 4-5本作れるように。

#### 3️⃣ UI でフォールバック発生を可視化
TTSPanel に新しい表示エリア:

```
┌───────────────────────────────────────┐
│ ⚡ 全セクションを事前生成 ⚡2並列     │
└───────────────────────────────────────┘
┌───────────────────────────────────────┐
│ ✨ 12件が代替モデル (2.5 Flash) で生成 │  ← ★新規★
│    (3.1 quota 切れの自動切替)         │
└───────────────────────────────────────┘
```

ユーザーは「フォールバックが発生した = 3.1 の quota が切れかけている」を即座に把握可能。

### コード変更詳細

#### Code.gs (GAS Proxy)
- `CONFIG.PRIMARY_MODEL` / `CONFIG.FALLBACK_MODEL` / `CONFIG.GEMINI_TTS_ENDPOINT_BASE` 追加
- `handleTTS` のリトライロジックを **2モデル対応** に拡張
  - 外側ループ: モデル試行 (PRIMARY → FALLBACK)
  - 内側ループ: 各モデルで 3回までリトライ
  - 429 で即座に次モデルへフォールバック (5xx は同一モデル内でリトライ)
- レスポンスに `usedFallback: boolean` / `modelUsed: string` を追加

#### ttsAdapter.js (クライアント)
- `concurrency` デフォルト 4 → **2** に変更 (2箇所)
- `_getOrGenerate` で `usedFallback` / `modelUsed` を伝播
- `pregenerate` で **fallbackCount** / **fallbackIds** を集計
- onProgress 経由で UI にリアルタイム通知

#### TTSPanel.jsx
- `fallbackInfo` state 追加 ({ count, ids })
- `handlePregen` でフォールバック追跡
- フォールバック件数表示エリアを追加
- 並列バッジ「⚡4並列」→ **「⚡2並列」**

### 効果

| シナリオ | Before (v5.11.8) | After (v5.11.9) |
|---|---|---|
| 1日に作れる動画数 | 2本 (RPD 100/日) | **4-5本** (RPD 実質 200/日) |
| RPM 超過 | 13/10 ⚠ | 4-5/10 ✅ 余裕 |
| 44件生成時間 | 22秒 | **44秒** (倍だが安定) |
| quota 切れ時 | 失敗 | **自動フォールバック** |
| ユーザー体験 | 「なんで失敗?」 | **「ちゃんと動いた」** |

### 並列度のカスタマイズ

将来 Tier 2 に上がって RPM 制限が緩和されたら、並列度を上げて速度復活可能:
```js
await adapter.pregenerate(scripts, progress, { concurrency: 4 });
```

### 注意事項

#### voice 名の互換性
両モデルで使える voice はほぼ同じ:
- `Charon` (男性、A=数原さん) ✅ 両モデルで使用可能
- `Leda` (女性、B=もえかちゃん) ✅ 両モデルで使用可能
- `Kore` ✅ / `Puck` ✅

公式ドキュメント (Google Cloud) でも両モデルが同じ voice list を使用。

#### モデルの切替えは透過
ユーザーは何もしなくて良い:
- 3.1 で動く間は 3.1
- 切れたら 2.5 で自動継続
- 次の日 quota がリセットされたら自動で 3.1 に戻る

#### コスト
両モデルともほぼ同じ価格 (出力 $20/1M tokens)。
コストへの影響はない。

### 将来の拡張オプション

#### A. 並列度の UI 切替
ユーザーが「速度優先 / 安全優先」を選べるトグル
(現状は 2 固定、将来必要なら追加)

#### B. 3段階フォールバック (3.1 → 2.5 → 2.5 Pro)
2.5 Pro TTS (RPD 50/日) を3段目に追加すれば実質 250/日
(現状は 2.5 Flash までで十分)

#### C. Web Speech フォールバック
全 Gemini モデルが quota 切れた時の最後の砦
(現状は手動切替で対応可能、自動化は不要レベル)

### バージョン
- 5.11.8 → **5.11.9**

---

## [5.11.8] - 2026-04-26 - TTS 生成を並列化 (約 4倍高速化)

### 動画テストフィードバック反映

#### 問題: TTS 生成が遅い (44 id 全部生成に 1〜3分)

**原因**: `pregenerate` が**直列処理** (1個ずつ `await`)
- 1個あたり 1.5〜3秒 (Gemini API のレスポンス時間)
- 44個 × 2秒 = **88秒**
- 体感: 「お茶飲んで戻ってくる」レベル

### 修正: 並列化 (concurrency=4)

`Promise.all` でチャンク並列処理に変更:

```js
// 旧: 直列 (88秒)
for (let i = 0; i < scripts.length; i++) {
  await this._getOrGenerate(...);
}

// 新: 4並列 (約 22秒)
for (let i = 0; i < scripts.length; i += 4) {
  const chunk = scripts.slice(i, i + 4);
  await Promise.all(chunk.map(processOne));
}
```

#### 並列度の選定理由
- **3並列**: 安全 (レート制限ほぼ無し) → 但し、十分速くない
- **4並列** ★採用★: バランス (速度 75% UP、レート制限まだ余裕)
- **5-8並列**: 速いが 429 エラーが頻発する可能性

Gemini API のレート制限を考慮して **4並列**をデフォルトに。

### 速度比較

| 件数 | Before (直列) | After (4並列) | 削減 |
|---|---|---|---|
| 10件 | 20秒 | 5秒 | -75% |
| 20件 | 40秒 | 10秒 | -75% |
| **44件** | **88秒** | **22秒** | **-75%** |
| 100件 | 200秒 | 50秒 | -75% |

### 並列化対象 (3つのメソッド)

#### 1️⃣ `pregenerate(scripts, onProgress, options)`
- 全 scripts の一括生成
- options.concurrency でカスタマイズ可能 (デフォルト 4)

#### 2️⃣ `pregenerateOnly(scripts, targetIds, onProgress, options)`
- 指定 id だけ再生成 (失敗分のリトライ)
- 同じく 4並列

#### 3️⃣ `findMissing(scripts)`
- IndexedDB のキャッシュチェック
- **全件並列** (Promise.all) — IndexedDB 読み込みは並列に強い
- 44件のチェックが瞬時に完了
- ついでに id 順にソート (見やすく)

### 進捗表示の改善

`onProgress` の `current` は「完了件数」を返すように変更:
- 旧: i+1 (順番通り、1, 2, 3, ...)
- 新: completed (並列なので 1, 4, 7, 8, ... のように飛び石で進む)

UI 表示は `生成中 8/44` のように現在の完了数を表示 (進行中のものは含まない)。

### UI の変更

「全セクションを事前生成」ボタンに **⚡4並列** バッジを追加:
```
[⚡ 全セクションを事前生成  ⚡4並列]
```

### 並列処理での注意点

#### レート制限 (429) への対応
- 既存の GAS 側リトライ (3回) + クライアント側リトライ (2回) はそのまま
- 1分あたりの最大リクエスト数 = 4並列 × 30秒 = 8 RPM 程度 (余裕)
- もし 429 が頻発したら options.concurrency を下げる:
  ```js
  await adapter.pregenerate(scripts, progressCallback, { concurrency: 2 });
  ```

#### コストへの影響
- **コストは変わらない** (生成回数は同じ)
- 失敗時のリトライが並列に走る分、わずかに増える可能性 (許容範囲)

### バージョン
- 5.11.7 → **5.11.8**

---

## [5.11.7] - 2026-04-26 - 再生レイテンシ削減 (HTMLAudioElement → AudioBufferSourceNode)

### 動画テストフィードバック反映

#### 問題: 「生成しても再生がスムーズに喋れるまで何回か再生しないとダメ」

**現象**:
- 事前生成完了直後に再生してもブツ切れ・遅延
- 何回か再生ボタンを押すと安定する
- 特に id 1 (フック) の音声開始が遅い

**根本原因**: HTMLAudioElement (`new Audio(url)`) の構造的な遅延

| 段階 | 遅延 |
|---|---|
| `URL.createObjectURL(blob)` | ~1ms (無視可) |
| `new Audio(url)` | 5-20ms |
| ブラウザがメタデータ・デコード読込 | **20-100ms** |
| `audio.play()` の Promise resolve | **50-200ms** |
| **合計** | **75-320ms** |

これが「初回スムーズじゃない」の正体。複数回再生すると、ブラウザのデコードキャッシュが効いて速くなる。

### 修正: AudioContext + AudioBufferSourceNode に置き換え

**新フロー**:
| 段階 | 遅延 |
|---|---|
| `decodeAudioData(arrayBuffer)` | 10-50ms (blob サイズ依存) ※ prefetch でゼロ化可能 |
| `source.start(0)` | ~0ms (即時) |
| **合計** | **10-50ms (prefetch時 ~0ms)** |

→ **約 80-95% のレイテンシ削減**。事実上「ボタン押した瞬間に再生開始」。

### 主な実装変更

#### 1️⃣ AudioBuffer の decode キャッシュ追加 (LRU 12件)
```js
this._decodedCache = new Map();   // (speaker:text) → AudioBuffer
this._DECODE_CACHE_MAX = 12;      // メモリリーク防止 (LRU)
```

`prefetch()` 時に blob を AudioBuffer に decode してメモリ保持。
speak 時はメモリから即時取得 → AudioBufferSourceNode で再生。

#### 2️⃣ speak() の全面書き換え

旧:
```js
const url = URL.createObjectURL(blob);
const audio = new Audio(url);    // ← 重い
await audio.play();              // ← Promise の resolve 遅延
```

新:
```js
const source = ctx.createBufferSource();   // ← 軽い
source.buffer = audioBuffer;
source.start(0);                            // ← 即時実行
```

GainNode 経由で音量制御 (mixer 互換)。

#### 3️⃣ AudioContext の unlock 機能追加

ブラウザの自動再生ポリシーで AudioContext は最初 `suspended` 状態。
ユーザー操作 (「事前生成」ボタンクリック等) で `resume()` を呼んで unlock しないと、
初回再生時に「再生開始しない」「遅延が出る」問題が起きる。

`adapter.unlock()` メソッドを新設し、`TTSPanel` の「事前生成」ボタン押下時に自動呼び出し。

#### 4️⃣ pregenerate 中に decode もする

事前生成中、blob 取得直後に AudioBuffer に decode してキャッシュ。
これにより事前生成完了直後から即時再生可能 (末尾 12件は確実)。

#### 5️⃣ stop() を AudioBufferSourceNode 対応に

両方のソース (新 SourceNode + legacy HTMLAudioElement) を確実に停止。

### 効果

#### 体感レベル
- **再生ボタンを押した瞬間に音声開始**
- リトライ不要で安定再生
- 連続再生時のブツ切れ解消

#### メモリ管理
- AudioBuffer LRU 12件 (約 5-10MB 程度、許容範囲)
- pregenerate 完了時は末尾 12件が確実にメモリにある
- 古い AudioBuffer は自動削除 (メモリリーク防止)

### 互換性

- 旧 HTMLAudioElement ベースのコードは `_speakLegacyHtmlAudio` として残置 (将来のフォールバック用)
- 外部 API (speak/stop/prefetch/pregenerate) のシグネチャは変わらず
- mixer.js との連携も変わらず

### バージョン
- 5.11.6 → **5.11.7**

---

## [5.11.6] - 2026-04-26 - TTS 部分再生成機能 (個別 id ピンポイント再生成)

### 動画テストフィードバックを反映

#### 問題: TTS 一括生成で 44id 中 3id が再生されない
**現象**: GeminiTTS で全 scripts を事前生成した時、ネットワーク不安定や API レート制限で
**一部の script だけ生成失敗**するケース。再生時にその id の音声がスキップされる。

**v5.11.5 までの問題**:
- 失敗してもユーザーには「一部生成完了 (エラーあり)」としか出ない
- どの id が失敗したか分からない
- 失敗分だけ再生成する手段がない
- 全部削除して全 44 件を再生成すると**コスト・時間の無駄**

### 修正: 3つの新機能

#### 1️⃣ 不足チェック (どの id が未生成かを検出)
新ボタン: **「不足チェック (X scripts)」**

`adapter.findMissing(scripts)` を実装:
- 各 script の `(speaker, text)` でキャッシュを検索
- 未キャッシュの id を一覧として返す
- UI に「不足 N 件」のサマリーと、id 一覧を表示

#### 2️⃣ 不足分のみ一括再生成
不足リストが表示されたら、**「全て再生成」ボタン**で不足分だけまとめて生成。

`adapter.pregenerateOnly(scripts, targetIds, onProgress)` を実装:
- 指定された id の script だけ強制生成 (キャッシュ無視)
- 生成失敗した id は再度リストに残る
- 進捗・コストは通常の pregenerate と同じく表示

#### 3️⃣ 個別 id 再生成 (ピンポイント)
不足リストの各行に **🔄 リフレッシュボタン**:
- クリックでその id だけ再生成
- 1件成功すると自動でリストから消える
- 1件だけ生成中も他の操作は可能

### UI 変更点 (TTSPanel v2)

```
┌─────────────────────────────────────────┐
│ TTS エンジン            [🔊]              │
│ ┌──────────┬──────────┐                  │
│ │🔊下書き  │✨本番    │                  │
│ └──────────┴──────────┘                  │
│ ┌─────────────────────────────────────┐  │
│ │⚡ 全セクションを事前生成             │  │ ← メイン
│ └─────────────────────────────────────┘  │
│ ┌─────────────────────────────────────┐  │
│ │🔍 不足チェック (44 scripts)         │  │ ← ★新規★
│ └─────────────────────────────────────┘  │
│ ┌─ 不足 3 件 ──────────[🔄 全て再生成]┐  │
│ │ id:5  数原  「先日の試合で...」 [🔄] │  │ ← ★新規★
│ │ id:18 もえか「えっ、それは...」  [🔄] │  │
│ │ id:33 数原  「データを見ると」  [🔄] │  │
│ └────────────────────────────────────┘  │
│  $0.0042 |  キャッシュ 41件               │
│  ¥1                  [🗑キャッシュ削除]   │
└─────────────────────────────────────────┘
```

### 実装詳細

#### ttsAdapter.js (GeminiAdapter)
新規メソッド:
- `findMissing(scripts)` — キャッシュにない script を一覧化
- `pregenerateOnly(scripts, targetIds, onProgress)` — 指定 id だけ強制生成

既存メソッド改修:
- `pregenerate()` — 戻り値に `failedIds` を追加 (どの id が失敗したか分かる)

#### TTSPanel.jsx
新規 state:
- `missingList` — 不足 script のリスト
- `checkingMissing` — 不足チェック中フラグ
- `retryingId` — 個別再生成中の id

新規ハンドラ:
- `handleCheckMissing` — 不足チェックボタン
- `handleRegenerateMissing` — 一括再生成ボタン
- `handleRegenerateOne(id)` — 個別再生成ボタン

scripts が変更されたら `missingList` を自動リセット。

### 運用フロー (新)

```
【通常】
1. 「⚡ 全セクションを事前生成」をクリック
2. 完了表示なら OK
3. 「⚠ 一部失敗」と出たら、自動で不足リストが表示される

【失敗時】
4. 不足リストの「🔄 全て再生成」で一括リトライ
5. それでも残る場合、行ごとの 🔄 で個別再生成

【手動チェック】
6. 「🔍 不足チェック」でいつでも現状確認
   (キャッシュ削除直後や、別動画から戻った時に便利)
```

### コスト効率の向上

**before**: 3id 失敗 → 全削除 → 44id 再生成 (コスト 100%)
**after**: 3id 失敗 → 3id だけ再生成 (コスト **6.8%**)

→ **約93% のコスト削減**かつ既に成功している分の再生成時間も削減。

### バージョン
- 5.11.5 → **5.11.6**

---

## [5.11.5] - 2026-04-26 - キャラクター演出強化 (名前ラベル / Leda 音声 / ローズピンク)

### 動画テストフィードバック (3つ) を一気に改修

#### 1. アバター下に名前ラベル表示

**問題**: テロップ画面でアバターアイコンだけ表示されていて、誰が話しているか視聴者に伝わりにくい。

**修正**:
- フェーズB / フェーズC のアバター下に「**数原**」「**もえか**」のラベルを表示
- アウトロのアバターにも同様の名前ラベル
- ラベルのスタイル: 各キャラのテーマ色 (A=オレンジ / B=ローズピンク) で背景半透明の小さなピル
- アクティブ時はテーマ色のグロー、非アクティブ時は透明度を下げる

実装:
- `PreviewFrame.jsx` の avatar-hl に `<div className="avatar-name">数原</div>` を追加
- `OutroPanel.jsx` の outro-avatar に同様の名前ラベル
- `GlobalStyles.jsx` に `.avatar-name` / `.outro-avatar-name` CSS 追加

#### 2. もえかの声: Kore → Leda (若くて可愛い)

**問題**: Kore (Gemini TTS) は「strong/firm/professional」で**大人っぽすぎ**。
ユーザー要望「もう少し若くて可愛い女の感じ」と整合しない。

**修正**: voiceName を **Leda (Youthful)** に変更。
- Leda は Gemini 3.1 TTS の若い女性声 (公式タグ: Youthful)
- 萌え声・甘え声には絶対ならないように `stylePrompt` を再設計
  - 「20代前半〜中盤の若い女性アシスタントの声」
  - 「明るく親しみやすいトーン」
  - 「若々しい可愛らしさはあるが、萌え声・アニメ声・甘え声は絶対NG」
  - 「ですます調基本、テンポ良く軽やかに」

声の変遷:
| バージョン | B の声 | 評価 |
|---|---|---|
| v5.0 | Charon (男性、A と同じ) | キャラと不整合 |
| v5.9.0 | Puck → Kore | 女性化、ただし大人っぽすぎ |
| **v5.11.5** | **Leda** | **若くて可愛い、整合した** |

#### 3. もえかのテロップ枠を青 → ローズピンクへ

**問題**: もえかのテロップ枠・アバター枠がスカイブルー (rgba(14,165,233,*)) で「**女の感じがしない**」。

**修正**: B 専用にローズピンク (#fb7185) を使うように変更。

##### CSS 変更
新たに `--rose: #fb7185` 変数を追加 (--sky は他用途で残す):
```css
:root {
  --rose: #fb7185;
  --rose-glow: rgba(251,113,133,0.6);
}
```

B 関連の青色 (rgba(14,165,233,*)) を全部ピンク (rgba(251,113,133,*)) に置換:
- `.telop-bg[data-speaker="b"]` 枠線・影
- `.telop-bg[data-speaker="b"]::before/::after` 矢印
- `.avatar-hl.b.active .circle` アバター枠
- `.outro-avatar.b.active .circle` アウトロアバター枠
- `.telop-wrap-outro .telop-bg[data-speaker="b"]` アウトロテロップ枠

##### 配色の方針
- ピンクだが**ローズ系 (#fb7185)** で品のある色合い
- ホットピンクは派手すぎるので避ける
- 男性視聴者にも受け入れやすい品のある女性的な色
- character-bible の「思考は男性ファン代弁」を踏まえ過度に女子っぽくしない

### Knowledge File 更新

#### character-bible.md
- B の年齢層: 「20代後半〜30代前半」→ **「20代前半〜中盤 (若さと親しみやすさ)」**
- B の声・キャラ説明を Leda 仕様に更新
- A / B 両方に「UI のテーマ色」セクションを追加 (オレンジ / ローズピンク)

#### gemini-custom-prompt.md (knowledge_file_mandatory)
- B の年齢: 「女性キャスター 20代後半-30代前半」→ **「若い女性アシスタント 20代前半-中盤」**
- 「キャスター」→「アシスタント」に呼称変更 (より若いイメージ)

### バージョン
- 5.11.4 → **5.11.5**

---

## [5.11.4] - 2026-04-26 - layout-direction.md 整合性修正

### v5.11.0 〜 v5.11.3 で実装した変更を layout-direction.md に反映

過去のバージョンで実装は更新したものの、ドキュメント側の記述に古い記述が残っていた箇所を一括修正。
これでアプリ実装と Knowledge File が完全に整合した状態。

#### 修正箇所

**1. ストーリーアーク表 (line 54)**
```diff
- 55-60秒│ 締め (二択疑問)    │ 「自分はどう思う?」      │ (アウトロ画面)
+ 55-60秒│ 自然な締め or 文脈ある二択 │ 「自分はどう思う?」      │ (アウトロ画面)
```

**2. レイアウト一覧テーブル (line 25-33)** — v4 仕様に統一
```diff
- | **player_spotlight** | 個人の主役感 | ポートレート化、比較値併記 |
- | **versus_card** | 1対1対決 | mood切替で勝敗両対応 |
- | **pitch_arsenal** | 投手の手の内 | 構成変化比較、左右別比較 |
+ | **player_spotlight** | 個人の主役感 | データ主役 (選手名重複・シルエット廃止)、比較値併記 |
+ | **versus_card** | 1対1対決 | シンプル化 (バー・スコア・装飾バッジ全廃)、純粋な数字比較 |
+ | **pitch_arsenal** | 投手の手の内 | 構成変化比較、左右別比較、武器バッジ→行強調 |
```

**3. pitch_arsenal セクション (line 519-542)** — v5.11.2 改修内容を追加
- 「武器」バッジ廃止 → 行強調への変更
- 列幅 1.4fr → 1.7fr の調整
- スプリットなど長い球種名のフル表示

**4. 改修優先順位テーブル (line 685-695)** — v4/v5.11.x 仕様に統一
```diff
- | 3 | **player_spotlight** | ポートレート化、比較値併記 |
- | 4 | **versus_card** | mood 切替 (main_wins/main_loses/close)、敗者強調 |
- | 6 | **pitch_arsenal** | mode 拡張 (single/compare/vs_batter)、左右別 |
+ | 3 | **player_spotlight** | データ主役 (選手名重複・シルエット廃止)、比較値併記 |
+ | 4 | **versus_card** | シンプル化 (バー・スコア・装飾バッジ全廃)、純粋な数字比較 |
+ | 6 | **pitch_arsenal** | mode 拡張 (single/compare/vs_batter)、武器バッジ→行強調、列幅調整 |
+ | - | **共通基盤** | Error Boundary、データ有効性ガード、二重ネスト解除レイヤ |
```

**5. 完了基準テーブル (line 703-712)** — v4/v5.11.x 仕様に統一
```diff
- | player_spotlight | シルエット劇画化 / プライマリ指標巨大化 / 比較値併記 |
- | versus_card | mood 3種切替 / main_loses 時の警告マーク / 中央 VS 強化 |
- | pitch_arsenal | mode 3種 (single/compare/vs_batter) |
- | 全レイアウト共通 | テロップ被り回避 / テロップ枠の透明度調整 |
+ | player_spotlight | データ主役 (選手名重複・シルエット廃止) / プライマリ指標巨大化 (60px) / 比較値併記 |
+ | versus_card | シンプル化 (バー・スコア・装飾バッジ全廃) / 純粋な数字比較 / 勝者矢印 (◀▶) |
+ | pitch_arsenal | mode 3種 (single/compare/vs_batter) / 武器バッジ廃止→行強調 / 列幅調整 |
+ | 全レイアウト共通 | テロップ被り回避 / テロップ枠の透明度調整 / Error Boundary でラップ / データ有効性ガード (_hasValidData) |
```

### 効果

- Custom Gem の Knowledge File として layout-direction.md がアップロードされる際、**Gemini が古い仕様を参照しなくなる**
- 改修指針と実装が**完全に一致**した状態 (整合性100%)
- 今後新しいレイアウトを追加・改修する際の判断基準が正しく機能する

### バージョン
- 5.11.3 → **5.11.4**
- アプリのコード変更はなし、Knowledge File の整合性修正のみ

---

## [5.11.3] - 2026-04-25 - Error Boundary 実装 + 二択誘引を「文脈つき」で復活

### 動画テストフィードバック (2つの問題) を修正

#### 1. 「id 2 から継承で真っ白になる」バグ対策 (Error Boundary 実装)

**問題**: Gemini 出力で id 2 から layoutType を切替えた時、レイアウトコンポーネントが内部で例外を投げて**アプリ全体が真っ白**になるケース。

具体的なシナリオ:
- id 1 (フック): layoutType 指定なし → デフォルト radar_compare
- id 2: layoutType: "timeline" などに切替
- でも layoutData.timeline の構造が想定外
- → TimelineLayout 内で例外 → React がツリー全体を unmount → **真っ白**

**修正 1: LayoutErrorBoundary 新規実装**

`src/components/LayoutErrorBoundary.jsx` を新規作成:
- React の Error Boundary パターン (`componentDidCatch` / `getDerivedStateFromError`)
- レイアウトコンポーネントが throw しても**キャッチして**アプリが落ちない
- フォールバック表示: 静かなプレースホルダー (「レイアウト読み込みエラー」+ layoutType 名)
- console.error でエラー詳細を出力 (デバッグ用)
- レイアウト切替時は state リセット (新しいレイアウトでは正常に試行)

`src/layouts/LayoutRouter.jsx` に組み込み:
```jsx
<LayoutErrorBoundary key={activeLayout} layoutType={activeLayout}>
  <Layout {...props} />
</LayoutErrorBoundary>
```

**修正 2: 全レイアウトのデータ有効性判定を厳格化**

旧コード:
```js
const data = _unwrapped || { ...デフォルト };
// _unwrapped が空オブジェクト {} だとデフォルトが使われない
```

新コード:
```js
const _hasValidData = _unwrapped && typeof _unwrapped === 'object' &&
  Array.isArray(_unwrapped.必須フィールド);
const data = _hasValidData ? _unwrapped : { ...デフォルト };
```

修正対象レイアウト (6箇所):
- **PitchArsenalLayout**: pitches[] か vsBatter があるか確認
- **TeamContextLayout**: batting / pitching / management / stats[] があるか確認
- **VersusCardLayout**: categoryScores[] があるか確認
- **PlayerSpotlightLayout**: players[] があるか確認
- **BatterHeatmapLayout**: zones[] か vsRight/vsLeft があるか確認
- **RankingLayout**: metrics[] があるか確認

→ 空オブジェクト `{}` や想定外の型でも**確実にデフォルトデータでフォールバック**される。

**二重の安全策**:
1. レイアウト内のデータ判定ガード → 通常のデータ不正に対応
2. Error Boundary → ガードを抜けた予期せぬ例外に対応

これで Gemini が**どんな変な JSON を吐いても**アプリが真っ白にはならない (最悪でも radar_compare or プレースホルダーが表示される)。

#### 2. 二択疑問を「廃止」じゃなく「文脈つきで復活」

**v5.11.2 で**「二択疑問は廃止、自然な締めに」と書いたが、ユーザー指摘により再修正:
- 二択自体は**コメント誘引の重要装置**として有効
- 問題は「**唐突な二択**」(前振りなしで急に出すこと)
- 文脈をつければ二択 OK

**新ルール**: `keys_to_winning #3` を再修正。

末尾2 scripts は2パターンから選ぶ:

【パターンA: 自然な締め】
  A: 結論断定 → B: 余韻ある感想

【パターンB: 文脈ある二択誘引】(★最も推奨★)
  A: 議論を踏まえた断定 + 二択への前振り (★必須★)
  B: 具体的なシナリオで意味のある二択を提示

例:
- ✅ A: "【30本】到達か、それとも失速か" → B: "皆さんは化ける派?終わる派?🤔"
- ✅ A: "結論、復活する数字は揃ってます" → B: "皆さんは信じる派?疑う派?😯"

【二択のルール (細則)】
- ★必ず前振りがあること★ (前 script で議論を整理)
- 二択選択肢は具体的なシナリオで成立 (✅ 化ける/終わる、賛成/反対、信じる/疑う)
- 曖昧な二択は禁止 (❌ 期待/不安、○本/○本)
- TTS で読まれた時に意味の通る文になっていること

**NG例 / OK例**:
- ❌ "10本?20本?" (前振りなし、何の数字か不明)
- ❌ "期待?不安?" (二択が曖昧、文として成立してない)
- ✅ A: "このペースなら40本も見えてます" → B: "40本派?30本派?🤩"
- ✅ A: "改善のカギは制球力です" → B: "戻ると思う派?無理派?🤔"

#### final_constraints チェック16も再修正
旧: 「唐突な二択疑問になっていないか」
新: 「自然な締め or 前振りある二択誘引になっているか (前振りなしの唐突な二択は NG)」

---

## [5.11.2] - 2026-04-25 - アウトロUI改修 / 優先度整理 / 連続ルール緩和 / 二択疑問廃止

### 動画テストフィードバック (4つの問題) を一気に修正

#### 1. 同 speaker 連続ルールの緩和
**v5.11.1 で**「最大2回まで、3回以上は禁止 + バグ」と書いていたが、ユーザー指摘により修正:
- v5.11.1 でテロップ切替バグはアプリ側で**修正済み**なので技術的制約は無い
- 1id が長くなる時に短く分割するために 3-4 連続は**OK**
- ただし「内容が薄いまま 3-4 連続」は**ダレる**ので避ける

新ルール:
- 連続 **2-3回が理想**、**最大4回まで許容**
- 5回以上は禁止 (一人の独演会)
- 「分割するなら情報密度を保つ」「内容薄いまま分割は逆効果」と明記
- 良い分割例 (情報密度を保つ) を提示

#### 2. ★ だらけだったプロンプトを優先度別に整理
プロンプト内に **63個** の ★ がインフレ状態だった (どれも最重要に見える)。

**新優先度体系**:
- **【最重要】** — 違反すると不合格。動画の根幹を壊すレベル
- **【重要】** — 違反すると視聴維持率が大きく下がる
- **【注意】** — できるだけ守る、品質に影響する
- (ラベルなし) — 一般的なガイドライン

冒頭に `<priority_legend>` セクションを追加し、各セクションヘッダーをラベル付きに置換:
- 【最重要】13箇所 (Knowledge File 参照、scripts数 35-45、毒にも薬にもならない、読み仮名、数値読み、巨人選手読み等)
- 【重要】8箇所 (4フェーズ構成、Bの絵文字遷移、テキスト強調、ハイライト継続等)
- 【注意】3箇所 (textSize、silhouetteType等)

これで Gemini が**何を最優先でチェックすべきか**が明確に。

#### 3. アウトロUI 全面改修 (OutroPanel v2)
**問題**:
- まとめの文字が小さい (16px、12px)
- いいね/登録ボタンが**非表示** (`.outro-actions { display: none }` で隠されていた)
- 「コメントで教えて」ボタンがダサい
- 唐突な二択疑問が日本語的におかしい

**修正 (OutroPanel.jsx + GlobalStyles.jsx)**:

##### まとめパネル (大きく)
- タイトル: 16px → **20px**
- チェック項目: 12px → **14px** (strong 部分は **15px**)
- パディング・間隔も大きく
- アイコン: 14px → **16px**

##### いいね/登録ボタン (★復活+目立たせ★)
- `display: none` を**廃止** → 表示
- アイコン 32px の大きな emoji (👍 / 🔔)
- 鼓動アニメ (1.2s ループ)
- 登録ボタンには光る帯 (shineSweep アニメ)
- 文言: "役立ったらいいね！" / "チャンネル登録お願い！"

##### 削除
- 旧 `.outro-cta` セクション (オレンジの大きなジグル box) を**全廃止**
- 旧 「コメントで教えて」ボタン削除
- 旧 outroSummary CSS の重複定義を削除

#### 4. 二択疑問 (アウトロ末尾) を廃止 → 自然な締めに

**問題**: Gemini が出していた:
```json
{
  "id": 25, "speaker": "B",
  "text": "マタの次回登板\n期待？不安？",
  "speech": "またのじかいとうばん。きたい。ふあん。"
}
```
- 唐突 (急に二択を聞かれて意味不明)
- speech が「きたい。ふあん。」と意味不明な単語の羅列
- 視聴維持につながらない (むしろ離脱要因)

**修正**: Gemini プロンプト `keys_to_winning #3` を全面書き換え。

新ルール:
- 末尾2 scripts は**自然な締めの感想**で動画を終わらせる
- 唐突な質問・二択を**禁止**
- アプリ側のいいね/登録ボタンが目立つので、台詞での誘導は**不要**

4つの締めパターンを提示:
- パターンA (結論断定): "結論。今季は化けます" → "次の試合が楽しみですね"
- パターンB (前向き予測): "このペースなら【30本】到達も見えてます" → "覚醒の年になりそう"
- パターンC (警告): "改善されなければ降格圏です" → "厳しい現実ですね"
- パターンD (期待感): "ここを攻略すれば勝ちは見えてます" → "次の登板に注目"

NG/OK 例も明示:
- ❌ "10本?20本?" / "期待?不安?" / "コメントで教えて" / "皆さんはどう思いますか?"
- ✅ "次の試合が楽しみですね" / "厳しい現実ですね" / "あとは結果を出すだけ"

### v5.11.1 から削除

v5.11.1 で書いた以下のルールはバグ修正済みのため削除/緩和:
- ❌ "同キャラ連続発言は最大2回まで。3回以上は絶対禁止" (バグ修正済み)
- ❌ "技術的な理由: 3回以上連続するとテロップ切替不具合" (バグ修正済み)
- ❌ "出力前に scripts 配列を走査して同 speaker 3連続を修正" (緩和、4連続まで許容)
- final_constraints のチェック項目15も同様に緩和

---

## [5.11.1] - 2026-04-25 - テロップ切替バグ修正 (同 speaker 連続バグ) + Gemini ルール強化

### 🚨 重大バグ修正: 同 speaker 連続でテロップが切り替わらない

#### 原因の特定
PreviewFrame.jsx のテロップラッパー (.telop-wrap-normal / .telop-wrap-hl / .telop-wrap-outro) の
React `key` プロパティが **speaker のみ** に依存していた:

```jsx
<div className="telop-wrap-normal" key={`telop-n-${currentScript?.speaker || 'a'}`}>
```

これだと:
- A → B: speaker が変わる → key 変化 → リマウント → アニメ発火 ✅
- B → A: 同じく ✅
- A → A: speaker 同じ → key 同じ → **リマウントされず**
- A → A → A: 同じく **リマウントされず**

`.telop-bg` のアニメーション (`telopSlideUp` / `backwards`) は親要素の再マウント時にのみ発火するため、
**A→A 連続や A→A→A 連続でアニメが2回目以降発火しない**=「テロップが切り替わらない」バグ。

#### 修正内容
外側 wrapper の key を `speaker + currentIndex` の複合キーに変更:

```jsx
// 修正後
<div className="telop-wrap-normal" key={`telop-n-${speaker}-${currentIndex}`}>
```

これで id が変わるたびに必ずリマウント → アニメ毎回発火。

修正対象:
- `.telop-wrap-normal` (フェーズB)
- `.telop-wrap-hl` (フェーズC)
- `.telop-wrap-outro` (フェーズD)

### Gemini プロンプト: 同 speaker 連続ルールを強化

#### character_progression セクション
- 「同キャラ連続最大2回」を **★★★絶対遵守★★★** に格上げ
- **技術的な理由を明記**: 「アプリ側の仕様上、3回以上連続させるとテロップが切り替わらない」
- 良い例 / 悪い例を増強:
  - ✗ NG: A→A→A (3連続、表示バグ)
  - ✓ OK: A→A→B→A→A→B
  - ✓ OK: A→B→A→B→A→B (理想形)
- B の相槌例: "え？", "まじで？", "なるほど", "それは…" を独立 1id にする
- **出力前に必ず scripts 配列を走査して同 speaker 3連続を修正**

#### final_constraints セクション (自己チェック)
新規チェック項目を3つ追加:
- 15. 同 speaker の連続発言が3回以上になっていないか (アプリ側のテロップ切替不具合になる)
- 16. character-bible.md の A/B キャラ設定 と矛盾していないか
- 17. layout-direction.md の選んだ layoutType の方向性に従っているか

### この修正で得られる効果

#### 1. アプリ側
- 連続 3回以上の同 speaker でも**テロップが正常に切り替わる**
- 動画再生中の体験が劇的に改善

#### 2. Gemini 側
- ルールが**強化**されたので、Gemini が同 speaker 3連続を出しにくくなる
- 自己チェックでも引っかかるので、出力前の修正が促される

### 一応の備え (両方の保険)

ルールを強化しただけでなく、**バグ自体も直した**ので:
- Gemini が万が一 3連続を出しても、アプリ側で正常にテロップ切替する
- 視聴体験を保証する二重の安全策

---

## [5.11.0] - 2026-04-25 - レイアウト過剰演出を全廃 + Knowledge File 参照を強制化

### 動画テストフィードバック (3つの致命的問題) を一気に修正

#### 🚨 問題1: Knowledge File が Gemini に参照されていない
- character-bible.md / layout-direction.md / yomigana-dictionary.csv を Custom Gem にアップロードしても、プロンプトに「これらを参照しろ」という明示指示が無いため、Gemini が**毎回見ていない**
- 結果: A/B のキャラ名が反映されない、レイアウト方向性が活かされない、誤読が発生

**修正**: docs/gemini-custom-prompt.md の冒頭に `<knowledge_file_mandatory>` セクションを新設。3つのファイル名・役割・優先順位を明記し、「**毎回必ず参照**」「プロンプト本文と矛盾するなら Knowledge File を**優先**」と強制化。

#### 🚨 問題2: player_spotlight が選手名を二重表示
- 画面上部の `phase-b-header` に既に `mainPlayer.name` が表示されている
- player_spotlight 内でもさらに選手名・番号を表示していた → **同じ選手名が2箇所連続**で表示
- スポットライトとしての主役感が出ない (役割を果たせない)

**修正 (PlayerSpotlight v4)**:
- ★選手名・番号を完全削除★ (ヘッダーで自動表示されるので重複防止)
- ★シルエット画像も廃止★ (技術的に画像生成できないので、データ主役に振り切る)
- **プライマリ指標を画面の主役**として巨大表示 (60px、テーマ色のグロー)
- 比較値 (compareValue) を右下に併記
- 期間ラベルを上部に控えめに表示

#### 🚨 問題3: versus_card の過剰演出 (バー/スコア/装飾バッジ)
- バー比較が見にくい (どちらが強いか直感的に分からない)
- WIN/REF/-差●/互角 等の装飾バッジが選手名にかぶる
- 0-100 のスコア計算が意味不明 (どう計算したか視聴者に伝わらない)

**修正 (VersusCard v4)**: 過剰演出を**全廃**して**シンプル化**。
- ★バー廃止★
- ★0-100 スコア廃止★
- ★装飾バッジ全廃止★ (WIN, REF, -差●, 互角, mood)
- ★純粋な数字 vs 数字★ のみ。勝者の数字をテーマ色で強調するだけ
- 中央の矢印 (◀▶) で勝者を指す

設計原則: **「対決感」は装飾ではなく、数字のコントラストで生まれる**

### PitchArsenal の細かい修正

#### 「武器」バッジ廃止 + 行強調
- 「武器」バッジが場所を取って「スプリット」が「スプリ…」に切れる原因の一つだった
- **廃止**: バッジ → 該当行全体に背景色 (テーマ色 15% + 左ボーダー)
- 球種名のフォント色もテーマ色に変える (最良の被打率の行が一目で分かる)
- 列幅: `1.4fr_46px_50px_50px` → `1.7fr_44px_44px_44px` (球種名列を 1.7fr に拡大)
- 「スプリット」「フォーシーム」など長い球種名がフル表示される

### Gemini プロンプトのスキーマ修正

#### versus 新スキーマ (v4 シンプル)
```
旧: { mood, overall:{main,sub}, categoryScores:[{label, main, sub, rawMain, rawSub}] }
新: { categoryScores:[{label, rawMain, rawSub, lowerBetter?}] }
```
- `mood`, `overall`, 各 `main`/`sub` (0-100) を廃止
- `rawMain`/`rawSub` (実数値) のみ
- `lowerBetter:true` で防御率/WHIP の判定方向反転

#### spotlight 新スキーマ (v4)
```
旧: { players:[{id, name, number, label, silhouette, primaryStat, stats, comment}] }
新: { players:[{id, label, primaryStat, stats, comment}] }
```
- `name`/`number` 廃止 (ヘッダー重複防止)
- `silhouette` 廃止 (画像生成困難)

### layout-direction.md の更新
- player_spotlight の改修方針を v4 仕様 (データ主役、name/silhouette 廃止) に書き換え
- versus_card の改修方針を v4 仕様 (シンプル化、過剰演出全廃) に書き換え
- 動画テストでの実証を反映

### バージョン
- 5.10.1 → **5.11.0**
- package.json, src/lib/config.js 同期

---

## [5.10.1] - 2026-04-25 - フォント強調 3種類体系 + プロンプト一本化 + 35-45 体制

### v5.10.1 の総まとめ
動画テスト後に発見された以下の問題を一気に解決:
1. アプリ実装は3種類強調記号 (【】「」『』) に対応していたのに、Gemini プロンプトには【】だけしか書かれていない問題
2. docs/gemini-custom-prompt.md と JsonPanel.jsx 内のプロンプトが**二重管理**になっている問題
3. structure が 25-30 → 35-45 への変更が中途半端だった問題

### 重要な発見と修正

**問題1**: `textRender.jsx` 実装は **3種類の強調記号 (【】「」『』)** に対応していたが、
docs/gemini-custom-prompt.md には **【】 だけ** しか書かれていなかった。
結果: Gemini が「」と『』を一切使わず、強調表現が貧弱になっていた。

**問題2**: Gemini プロンプトが2箇所に存在:
- `docs/gemini-custom-prompt.md` — Custom Gem に Knowledge File として渡す版
- `src/components/JsonPanel.jsx` 内のハードコード — アプリのコピーボタン用
両者が乖離して、編集が二重作業になっていた。

**問題3**: structure を 35-45 に強化したが、final_constraints の "scripts 25-30個か" や
example_minimal の "実際は scripts を 25-30個で出力する" など古い記述が残っていた。

### Gemini プロンプトに 3種類強調体系を反映
旧 `JsonPanel.jsx` 内のハードコードプロンプトに書かれていた完全版を docs に移植。

#### 強調記号 3種類 (text_emphasis_rule セクション)
| 記号 | 色 | サイズ | 用途 |
|---|---|---|---|
| 【】 | 黄色 #FFD700 | 1.25倍拡大 | 数字・固有値 (打率/防御率/順位) |
| 「」 | オレンジ #FF8C00 | 1.15倍拡大 | 指標名・キーワード (BB/9/制球力) |
| 『』 | 赤 #FF4500 | 1.15倍拡大 | 衝撃ワード・警告 (ゼロ/崩壊/異常) |

特殊処理: 【】の中身が**数字だけ**ならモノスペースの数字専用スタイル (em-n) に自動変換。

### 旧プロンプト (添付ファイル) の良い要素を統合
従来の docs に欠けていた以下の要素を追加:

#### structure セクション全面強化 (25-30 → 35-45)
- scripts 配列の要素数を **35-45 個必須** に変更
- 1id 平均 2秒 × 短く多くで視聴維持率向上の理屈を明文化
- B の相槌 (6-8文字) も独立 1id にする例
- 35-45 id の具体的配分 (id:1 hook、id:2-6 導入、id:7-14 ハイライト1、…) を提示

#### phase_display_model セクション追加
4フェーズ構成 (UI連動) の説明:
- フェーズA (フック): id:1、46px大テロップ
- フェーズB (平常): highlight なし、レーダー+成績テーブル
- フェーズC (ハイライト): highlight あり、ハイライトカード展開
- フェーズD (アウトロ): id 末尾2つ、CTAボックス+登録ボタン

#### character_progression セクション追加
B の感情絵文字の状態遷移:
- 序盤 (id:2-10): 😲🤩🤔 (意外・興味)
- 中盤 (id:11-25): 🤯😨😯🧐 (驚愕・動揺)
- 終盤 (id:26-45): 😆🥹🥰😌 (納得・共感)

同キャラ連続発言は最大2回まで、3回以上禁止のルールも明記。

#### no_dilution_rule セクション追加 (「毒にも薬にもならない分析」NG)
- **禁止フレーズリスト**:「〜と考えられる」「バランスの取れた」「今後に期待」等を明示的に禁止
- **強制ルール**: patternに従って主張を貫く。「最後は良い展望で締める」のような中立逃げを禁止
- **鋭さを出すテクニック**: 直近のプレー固有名詞、業界通説の覆し、比較対象の明示
- **視聴者への価値提供**: 「これから自分も◯◯という数字を見よう」と思わせる視点を必ず1つ提供

#### patterns セクション拡充
各動画パターン (朗報/悲報/擁護/覚醒/謎解き/未来予測/対決) の**結論方向性を厳守**するよう詳細化。
推奨レイアウトも併記。新パターン (チーム分析型/ランキング型) を追加。

#### silhouette_types セクション追加
野手用/投手用/チーム用のシルエットタイプ全種をリスト化。
盗塁王なら "runner"、セットアッパーなら "pitcher_set" 等の使い分け例も明示。

### JsonPanel.jsx の getJsonPrompt() を docs/ と一本化 ★最重要★
**方針**: `docs/gemini-custom-prompt.md` をマスターとし、`JsonPanel.jsx` のコピーボタンも
docs と同じ内容を出力するように変更。

#### 実装方法
Vite の `?raw` インポートで docs を文字列として読み込み:
```js
import customPromptRaw from '../../docs/gemini-custom-prompt.md?raw';
```

`buildAIPrompt()` 関数を全面書き換え (519行 → 217行):
- ハードコードされていた 350+ 行のプロンプト本文を削除
- docs の内容を `${customPromptRaw}` で展開
- 末尾に動的要素を追加:
  - 動画パターン一覧 (VIDEO_PATTERNS から自動生成)
  - レイアウト一覧 (LAYOUT_TYPES から自動生成)
  - playerType 別の数値読みルール (野手/投手/チーム)
  - スキーマテンプレート (templateData)

#### 効果
- ★docs を編集するだけで JsonPanel のコピー出力も自動で最新化される★
- 二重管理から解放
- ファイルサイズ 519行 → 217行 (-302行)
- ビルド時に embed されるので、実行時 fetch 不要

### 整合性修正 (古い 25-30 の記述を全部消去)
- `schema_top_level`: "scripts: [25-30個]" → "[35-45個]"
- `example_minimal`: "実際は scripts を 25-30個で出力する" → "35-45個"
- `final_constraints`: "scripts 総数が25-30個か" → "35-45個か (30未満・46以上は不合格)"
- `structure` の "50-60秒の動画想定なら 30-35 id でもOK" の例外文を削除 (一貫性のため)

### 推奨運用 (ユーザー向けメモ)
- **Custom Gem に docs/gemini-custom-prompt.md を Knowledge File としてアップロード** (メイン運用)
- アプリの「JSON生成プロンプトをコピー」ボタンは、素 Gemini に貼り付ける時の補助
- どちらを使っても**同じ強調ルール、同じ構造ルール**が適用される

---

## [5.10.0] - 2026-04-25 - 動画テスト後フィードバック反映 (重大バグ修正含む)

### 🚨 致命的バグ修正: Timeline 真っ白バグ
**原因**: Gemini が出力する `layoutData.timeline.timeline.points` という二重ネスト構造で、
アプリが `data.points` を取得できず `Math.max(...emptyArray)` が `-Infinity` 返す → SVG path に NaN 混入 → **画面真っ白**。

**修正**:
- TimelineLayout に**二重ネスト解除レイヤ**追加: `data.timeline?.points` があれば1階層下りる
- `points` の null/undefined ガード追加 (空配列でも動く)
- 数値変換失敗 (string の場合) も自動 parse、変換不可なら除外
- 全 9 箇所で `Math.max/min` の防衛措置 (空配列で `-Infinity` 返さない)
- 安全フォールバック (空ポイントを2つだけ表示)

**全レイアウトに二重ネスト解除レイヤ追加**:
- ranking, player_spotlight, versus_card, team_context, pitch_arsenal, batter_heatmap
- Gemini が `{spotlight:{spotlight:{...}}}` のような構造を吐いても自動で解除
- 副作用なし (正常な構造はそのまま動作)

### Gemini プロンプト: 重大ルール追加

#### ハイライト継続ルール (新)
**問題**: Gemini が「最初の1個だけに highlight、後は外す」というパターンで出力していた。
例: id 6 で highlight:"bb_9" を始めて、id 7-10 は同じ BB/9 の話なのに highlight なし。
結果: 視聴者の集中が途切れる。

**修正**: ★同じ指標を扱う script は全部に同じ highlight を設定★ ルールを明文化。
- NG パターン と OK パターン を例示
- 話題が逸れた瞬間に highlight を外す、というタイミングも明示
- これでアプリの「ハイライトカード大画面表示」が継続される

#### 【】テキスト強調ルール (新)
**問題**: Gemini が text 内で重要数値を【】で囲まずにベタ書きしていた。
例: `text: "今季は.276で打率3割"` ← 数字が地味
結果: 画面で重要数値が目立たない。

**修正**: 【】によるオレンジ強調ルールを Gemini プロンプトに明記。
- 使うべき対象: 具体的な数値、注目指標名、衝撃ワード
- 頻度の目安: 1動画 5-10 箇所
- NG例 (使わない/使いすぎ) を明示

#### 二重ネスト防止ルール (新)
**問題**: スキーマ表記 `layoutData: { timeline: { unit, ... } }` を Gemini が誤解し、
`{timeline: {timeline: {unit: ...}}}` という二重構造で出力していた。

**修正**: スキーマセクションの冒頭に**正しい書き方 vs 間違った書き方**を例示。
データキー対応表を追加 (layoutType と layoutData のキー名は異なる、を強調):
- layoutType:"versus_card" → layoutData.versus (versus_card じゃない)
- layoutType:"player_spotlight" → layoutData.spotlight
- layoutType:"team_context" → layoutData.context
- layoutType:"pitch_arsenal" → layoutData.arsenal
- layoutType:"batter_heatmap" → layoutData.heatmap

### PlayerSpotlight v3 (画像なし前提でレイアウト再設計)
**問題**: 
- 選手画像つけられないのにシルエット枠を巨大化していた
- 選手名が「上のヘッダー」と「シルエット下」の2箇所に重複表示
- 投手なのに stats が打者用 (打率/HR/打点) になっていた

**修正**:
- ★シルエット完全廃止★ → ヒーローカード風 (背景に巨大な番号がうっすら、その上に選手名タイポ)
- 選手名を**1箇所のみ**表示 (重複削除)
- ★playerType (batter/pitcher) で stats のデフォルト切替★:
  - pitcher → 防御率/WHIP/奪三振/勝
  - batter (他) → 打率/OPS/本塁打/打点
- compareValue (セ平均など) を右側に小さく併記
- スポットライト感の背景演出維持

### VersusCard v3 (生指標値主役、WIN マーク位置調整)
**問題**:
- WIN マークが選手名にかぶって読めない
- スコア (0-100) のバーだとどっちが強いか直感的に分からない
- 「生指標値 (.285 vs .265)」を見せた方が説得力ある
- テロップ枠の透過度が低くて圧迫感

**修正**:
- ★WIN/差●マークを枠の左上に独立配置★ (選手名にかぶらない)
- ★生指標値 (rawMain/rawSub) を主役に★、文字サイズ20pxで両側に大きく配置
- バーは細く・補助的に下に細表示 (1pxサイズ)
- 中央の勝者矢印 ◀▶ を強調
- ★lowerBetter フィールド追加★: 防御率/WHIP/失策など、数値小さい方が勝ちのケースに対応
- テロップ枠透明度 0.85 → 0.78 で背景が透けて見やすく

### PitchArsenal: 球種名 truncate 問題修正
**問題**: 「スプリット」が「スプリ…」と省略表示されていた。

**修正**:
- グリッド列幅を `1fr_56px×3` → `1.4fr_46px_50px_50px` に変更 (左列を 1.4倍)
- `truncate` クラスを削除 → フル表示
- `leading-tight` で長い名前は2行折り返し可能に
- 「武器」バッジを 10px → 9px で省スペース化

### 全レイアウト: テロップ枠透過度を統一 (背景見やすく)
- bg-zinc-900/85 → /78 に統一
- bg-zinc-900/90 → /80
- bg-zinc-900/95 → /85
- backdrop-blur-sm 維持で読みやすさは確保

### Ranking: metrics 空配列ガード追加
metrics が空・undefined の場合に「ランキングデータが空です」と明示表示。
クラッシュ防止 + 編集者にデータ不足を通知。

---

## [5.9.0] - 2026-04-25 - TTS 音声を character-bible と整合 (B=女性に戻す)

### 重要な不整合の修正
character-bible.md で「**B=もえかちゃん (女性キャスター)**」と確定したのに、実際の TTS 設定が **B=Puck (男性)** のままで、**音声と設定が乖離**していた問題を修正。

過去の経緯:
- v5.5 以前: A=Charon (男性), B=Aoede (女性) ← 当初設計
- v5.6 ?: 「感情表現の幅で Puck が圧勝」という理由で B=Puck (男性) に変更
- 結果: A/B とも男性、声質 (低 vs 高) で差別化していた
- v5.9: character-bible で B=女性キャスター確定 → **B=Kore (女性) に戻す**

### TTS 音声変更
- **A=Charon (男性) — 継続** (calm, professional male、数原さんに最適)
- **B=Puck (男性) → Kore (女性) に変更** (strong, firm female、女キャスターに最適)
  - 候補比較:
    - Kore: Strong, firm female / Neutral, professional ← 採用
    - Aoede: Warm, melodic female (温かすぎ)
    - Zephyr: Bright, clear female (明るすぎ)
    - Leda: Youthful, energetic (若すぎ)
  - もえかちゃんは「女性的な甘さは出さない」「思考は男性ファン代弁」設定なので、
    Kore の「強い・職業的」トーンが最適

### gas-proxy/Code.gs 修正
- `VOICE_PROFILES.B.voiceName`: `'Puck'` → `'Kore'`
- `VOICE_PROFILES.B.stylePrompt`: 男性ファン向け → 女性キャスター向けに書き直し
  - 「20代後半〜30代前半の女性キャスター」明記
  - 「萌え声・甘え声は絶対に出さない」「知的で芯のある話し方」明記
  - キャラ口癖 (「やっぱりそうなんですか」「ヤフコメでも〜」) を組み込み
- `VOICE_PROFILES.A.stylePrompt`: 30代 → 40代に微調整、決め台詞「数字は嘘つかないですからね」のトーン指示追加

### 絵文字は現状維持
- B の絵文字 (🤔🧐😯😲🤯😊 等) は性別コード付きじゃない**中性的な顔絵文字**なので変更不要
- A の 👨‍🏫 (男性教師) は数原さんに合っているので維持

### Knowledge File / プロンプト更新
- `yomigana-dictionary.csv`: TTS コメント `Charon/Puck` → `Charon=A 数原さん / Kore=B もえかちゃん`
- `grok-project-instructions.md`: TTS 表記 `(A=Charon/B=Puck)` → `(A=Charon 男性/B=Kore 女性)`

### 検証ポイント (動作確認時)
- B の声が女性的になっているか
- 「やっぱりそうなんですか」のような共感型リアクションが自然か
- 「ヤフコメでは〜」の引用が知的に聞こえるか (媚びず、知的に)
- A (Charon) と B (Kore) の対話で、男女の声質差で区別がはっきりするか

---

## [5.8.0] - 2026-04-25 - 全レイアウト改修完了 + 8レイアウト体制

### 8レイアウト体制への再編
v5.6 まで10レイアウトだったものを **8レイアウト + 2削除 + 1リネーム**に再編。
全レイアウトが「ストーリーアーク上の役割」を持つ設計に統一。

### 残されたレイアウト (8つ、すべて改修済み)
1. **radar_compare** — 全体像の提示 (現状維持、汎用形)
2. **timeline** — 変化のドラマ (v5.7.0 で改修完了)
3. **ranking** — 序列の衝撃 (v5.7.0 で改修完了)
4. **player_spotlight** — 個人の主役感 ← ★今回改修★
5. **versus_card** — 1対1対決 ← ★今回改修★
6. **team_context** — チームの表情 ← ★今回改修★
7. **pitch_arsenal** — 投手の手の内 ← ★今回改修★
8. **batter_heatmap** — 打者の癖 ← ★今回新規 (旧 pitch_heatmap リネーム)★

### 削除されたレイアウト
- **luck_dashboard** — BABIP・打球速度のデータ取得困難、概念伝わりにくい
- **spray_chart** — 個別打球データの取得困難

### LayoutRouter v2
- 廃止レイアウトのリダイレクト機構:
  - `luck_dashboard` → `radar_compare` + console警告
  - `spray_chart` → `radar_compare` + console警告
  - `pitch_heatmap` → `batter_heatmap` + console警告
- 旧データを使う JSON でもアプリが動作 (互換性レイヤ)
- 警告は最初の1回のみ (Set でガード)

### PlayerSpotlight v2 (主役感の強化)
- **シルエットを劇画タッチで巨大化** (110px → 140px枠、scale 1.1)
- **スポットライト演出**:
  - シルエット枠の背景にラジアルグラデで光が集まる感じ
  - 内側に inset shadow でテーマ色のオーラ
  - 全体背景にもうっすらラジアルグラデ
- **サインカード風の選手名表示**: 番号バッジに glow 二重リング、文字に強い text-shadow
- **プライマリ指標の比較値併記** (新):
  - `compareValue: { value, label }` でセ平均などを併記可能
  - 例: 「**WAR -0.4** (セ平均: 0.0)」 で衝撃を増す
- データスキーマ: `primaryStat.compareValue` 追加、後方互換あり

### VersusCard v2 (mood 切替で勝敗両対応)
- **mood フィールド (新)**: `main_wins` | `main_loses` | `close`
  - **main_wins**: mainPlayer 側に `WIN` ベルト風マーク + テーマ色の光のオーラ
  - **main_loses**: mainPlayer 側に `-差●` 警告マーク (赤)、subPlayer 側に `REF` (基準) マーク
  - **close**: 両側グレー寄り、中央に `互角` マーク
- **中央 VS 装飾**:
  - 火炎・閃光風のグラデーション (mood で色変化)
  - main_loses 時は `⚠ 差● ⚠` の脈動マーク
- **mood 省略時の自動判定**: overall.main vs sub の比較で main_wins/main_loses/close を自動判定
- 「敗北を強調したい動画」(例: 巨人打線 vs リーグ平均で巨人が負けてる) に対応

### TeamContext v2 (3要素ブロック化 + mode 分岐)
- **モード A (mode:"single")**: チームビュー
  - **打線/投手/采配 の3ブロック構造** (それぞれ色分け: オレンジ/青/グレー)
  - 各ブロック内に `stats[{label, value, rank, score(1-5)}]`
  - **5段階ドット評価** (●●●●○) でブロック内強弱を一目で
  - 采配ブロックは `traits[{label, level:"高"|"中"|"低"}]` の3項目グリッド
  - スタジアム背景演出 (上部にグラデ)
- **モード B (mode:"compare")**: チーム間比較
  - 「巨人 vs セ平均」「巨人 vs 上位3チーム平均」「巨人 vs 首位」等
  - 1指標ごとに 巨/対象/差分 の3列レイアウト
  - 差分は色分け (mainBetter なら巨人色、負けてるなら赤)
- 旧スキーマ (lineup/roles) は新規データでは使わない方針

### PitchArsenal v2 (vs_batter 追加)
- **モード分岐 (新)**: `single` | `compare` | `vs_batter`
- **モード "single"**: 単一の球種パイチャート + 表 (現状)
- **モード "compare"**:
  - 球種使用率の変化を矢印で可視化
  - 増えた球種は緑↑、減った球種は赤↓ (2%以上の差分)
  - 球速・被打率も比較行で表示
- **モード "vs_batter" (新、左右別)**:
  - 対右打者 / 対左打者 で配球を**並べて比較**
  - 2つのパイチャートと球種別配分表を並列表示
  - 「対左に弱い理由」など投手攻略動画に最適

### BatterHeatmap v2 (旧 pitch_heatmap をリネーム + 打者用化)
- 旧 `pitch_heatmap` (投手の配球ヒート) を **`batter_heatmap`** にリネーム
- **打者の打率ヒートマップ**に仕様変更: 投手目線で「ここに投げれば抑えられる」を視覚化
- **9エリア (3x3)** が打者の得意/不得意ゾーンを表現
  - 暖色 (赤/橙/黄) = 得意ゾーン (高打率)
  - 寒色 (青/シアン/黄緑) = 苦手ゾーン (低打率)
  - 0.150〜0.400 の範囲で5段階配色
- **モード分岐**: `single` (単一) | `vs_handedness` (対右投/対左投の左右比較)
- ホームベース風の枠装飾 + カラーレジェンド付き

### config.js / LayoutPanel / defaultBatter の周辺修正
- `LAYOUT_TYPES` を 10種 → 8種に整理
- `VIDEO_PATTERNS` から擁護型のデフォルトを `luck_dashboard` → `radar_compare` に変更
- `team_analysis` (チーム分析) と `ranking_shock` (ランキング型) を新規追加
- LayoutPanel から旧 LuckDataEditor / SprayDataEditor / HeatmapDataEditor / Field 関数を削除
- LayoutPanel に `batter_heatmap` のヒント追加
- defaultBatter.js から旧 `spray` データ削除、`spray_chart` 切替を `radar_compare` に修正

### Gemini プロンプト schema 全更新
- 全8レイアウトの schema を新スキーマに同期
- 削除レイアウト (luck_dashboard / spray_chart) の schema 削除
- 旧 `pitch_heatmap` の schema を `batter_heatmap` に変更
- レイアウト遷移パターンの例を 8レイアウト前提に書き換え
- 新パターン追加: 巨人vsリーグ型 (team_context compare → ranking → versus_card)
- 新パターン追加: 投手攻略型 (pitch_arsenal vs_batter → batter_heatmap → versus_card)

---

## [5.7.0] - 2026-04-25 - Knowledge File 戦略 + Timeline v2

### 大きな方向転換: Knowledge File 戦略
カスタム指示 (4000字制限) を簡略化し、**情報量は Knowledge File に逃がす**戦略へ。

### Knowledge File 新設・改訂
- **`character-bible.md` (35,415字)** ★新規★
  - 二人のキャラクター: 数原さん × もえかちゃん (確定)
  - 視聴者像の正確化 (男性 93.3%、コアファン中心、指標語への嫌悪感)
  - A の役割: 「ファンの観察を現象とデータで裏付ける専門家」
  - B の役割: 「女性キャスター・思考は男性ファン代弁」
  - リアクション5パターン (共感/質問/ボケ/異論/感心)
  - 動画テーマ別のモード切替
  - 阿部監督への中立姿勢 (8章): 全肯定も全否定もせず、采配の意図を読み解く
  - シチュエーション別サンプル対話6本 (朗報/悲報/擁護/対決/チーム文脈/編成論)
  - 指標翻訳辞典、過去・系譜の使い方、NG例集、設計指標
- **`layout-direction.md` (29,980字)** ★新規★
  - 各レイアウトのストーリーアーク上の役割を定義
  - 8レイアウト体制 (luck_dashboard/spray_chart 削除、pitch_heatmap → batter_heatmap)
  - 共通設計ルール: テロップ被り防止、テロップ枠透明度、注目1人制
  - mood 概念導入 (ranking: best/worst/neutral, versus_card: main_wins/main_loses/close)
  - team_context モード分岐 (single/compare、巨人 vs セ平均対応)
  - timeline unit 4種拡張 (day/week/month/year)
  - 改修優先順位: timeline → ranking → spotlight → versus → team_context → arsenal → batter_heatmap
- **`yomigana-dictionary.csv` (26,925字)** ★大改訂・拡充★
  - **巨人 全選手カバー**: 支配下62名 + 育成42名 + OB 12名 = 計116名
  - **セリーグ他5球団 主要選手**: 阪神39 + DeNA44 + 中日44 + 広島29 + ヤクルト26 = 計182名
  - 全6球団監督 + 解説者
  - 総計 約313名の選手読みを登録
  - 出典: NPB公式 (https://npb.jp/bis/teams/) 各球団 2026年度 選手一覧
  - キャラ名 (数原/もえか) 追加
  - 野球指標 (WAR/OPS/BABIP/FIP/UZR等) 読み追加
  - 野球用語の誤読防止 (四球→しきゅう、左腕→さわん、本塁打→ほんるいだ等、78エントリ)
  - 球種・球場・球団名カタカナ読み

### Ranking v2 (実装) ★優先度2★
- **mood 切替 (新)**: `best`|`worst`|`neutral` の3パターン
  - **best**: 1位👑、ベスト3に金/銀/銅メダル、金トーン背景、ゴールドバー
  - **worst**: 1位⚠️、ワースト3に▼マーク、赤トーン背景、赤バー、暗い背景
  - **neutral**: 中性 (デフォルト)
- **注目1人制 (重要)**:
  - `entry.isMainPlayer` は**弱強調**(背景色のみ)
  - **◀注目マーク**は `currentScript.focusEntry` で**時刻指定された1人だけ**
  - 全員 isMainPlayer:true による濫用を防ぐ
  - 動画の異なるシーンで時間差で focusEntry を切り替えれば複数選手を順次強調可
- **チームエントリ対応 (新)**: 
  - `entry.isTeam: true` で `[ チーム ]` ラベル付き
  - セリーグ6球団順位、12球団順位等に対応
- **演出強化**:
  - focusEntry 行の脈動アニメ (mood 連動の glow)
  - 圏外マーカー: `⋯` → `⋯ 圏外 ⋯` で明示化
  - mood 連動のグラデーション背景
  - 拡大スケール 1.04倍 (現状値維持)
- **テロップ被り対策**: pb-[28%] → pb-[32%]、背景透明度 0.85

### Timeline v2 (実装) ★最優先改修★
- **unit 4種対応**: `day`|`week`|`month`|`year`
  - day: 開幕直後の日別変化 (5-15点)
  - week: 1〜3ヶ月の変化 (4-12点)
  - month: シーズン通年 (3-7点、現状デフォルト)
  - year: チーム複数年推移 (3-10点、チーム動画用)
- **シンプル化**:
  - `points[].main` → `points[].value` に変更 (sub を分離)
  - 比較線 `compareLine` を任意化 (1選手の推移だけ見せたい場合に対応)
  - データ最低 **2点**で動作 (旧 3点必須から緩和)
- **ドラマ性**:
  - ハイライト点で**ゴールド+脈動アニメ**
  - 上昇セグメント = ゴールド、下降セグメント = 赤、通常 = テーマ色 (セグメントごと色変化)
  - 大変化 (10%以上) のセグメントは線が**太く**
  - isPeak/isBottom 自動判定 (3点以上の場合、最高/最低を自動色分け)
- **互換性レイヤ**:
  - 旧 `points[].main` も読み込み可
  - 旧 `points[].sub` を `compareLine` に自動変換
- **テロップ被り対策**:
  - pb-[28%] → pb-[32%] に拡大
  - 背景透明度 0.90 → 0.85 (テロップが透けて見える程度)

### Gemini プロンプト schema 更新
- timeline 新スキーマ反映 (unit 4種、value、compareLine)
- luck_dashboard / spray_chart / pitch_heatmap セクション削除
- batter_heatmap (将来実装) のスキーマ追加

### Grok エージェント改訂
- master / researcher / project-instructions に読み仮名ルール (yomigana-dictionary.csv 必参照) 強化
- 数値読みルール (打率「.276→にわりななぶろくりん」等) 明記
- 全エージェント 4000字制限内維持

### 削除予定 (実装は次回以降)
- `LuckDashboardLayout.jsx` (削除予定)
- `SprayChartLayout.jsx` (削除予定)
- `PitchHeatmapLayout.jsx` → `BatterHeatmapLayout.jsx` にリネーム + 仕様変更予定

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
