# Changelog

『数字で見るG党 Studio』 のバージョン履歴。

セマンティックバージョニング (MAJOR.MINOR.PATCH):
- MAJOR: 破壊的変更
- MINOR: 後方互換のある機能追加
- PATCH: バグ修正のみ

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
