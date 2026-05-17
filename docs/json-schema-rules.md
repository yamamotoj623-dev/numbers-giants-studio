# Gem 詳細ルール集 (json-schema-rules.md)

★ Gem の Knowledge File として参照される。スキーマ詳細・数値整形・配分ルール・出力前チェックを集約。
★ 各レイアウトの **完全テンプレート例** は `layout-templates.md` 参照。

---

## 1. スキーマ全体

```json
{
  "schemaVersion": "5.0.0",
  "layoutType": "<10種>",
  "playerType": "batter|pitcher|team",
  "teamPreset": "<リーグ_チームID>",
  "mainPlayer": { "name", "number", "label": "今季", "stats": {playerType別キー} },
  "subPlayer":  { "name", "number", "label": "昨季", "stats": {同} },
  "radarStats": {                          ← ★オブジェクト! 配列NG
    "key1": {"label": "日本語", "main": 数値, "sub": 数値},
    ... 5個
  },
  "comparisons": [
    {"id","label","kana","desc","formula","criteria","radarMatch","unit","valMain","valSub","winner","variants?"}
  ],
  "layoutData": { spotlight/ranking/timeline/versus/radar/arsenal/context/heatmap },
  "scripts": [ ... 動画長 60 秒に収まる範囲(目安 20-30 個) ... ]
}
```

### stats のキー
- batter: `pa, ab, avg, hr, rbi, ops`
- pitcher: `era, whip, so, win, ip, sv`
- team: `rank, winRate, runs, runsAllowed, games, hr`

### radarStats 標準 5 軸キー(打者の例)
- `isop` (純粋長打力), `isod` (選球眼), `bb_k` (BB/K), `rc27` (RC/27), `ab_hr` (AB/HR)
- 各々: `{label: "日本語", main: 0-100, sub: 0-100}` の偏差値(リーグ中央 50、優秀 70+、突出 85+)
- ※ トップレベル `radarStats` と `layoutData.radar.stats` は内容を揃える

### comparisons の完全構造
```
{
  "id": 1, "label": "WHIP", "kana": "ダブリュエイチアイピー",
  "desc": "1回あたり許す走者数", "formula": "(被安打+四球)/投球回",
  "criteria": "1.00以下が優秀",   ← 数値表現のみ(後述)
  "radarMatch": true, "unit": "",
  "valMain": "0.97", "valSub": "1.23", "winner": "main",
  "variants": [...]  ← オプション(対左/対右/通季などのスコープ切替時のみ)
}
```

### variants[] — 同指標の複数スコープ切替
同じ指標で「対左 / 対右 / 通季 / 対○○」のような切替を持たせたい時に使う。
```json
"variants": [
  {"id":"overall",  "label":"通季",     "valMain":".305", "valSub":".278", "winner":"main"},
  {"id":"vs_left",  "label":"対左投手", "valMain":".201", "valSub":".245", "winner":"sub"},
  {"id":"vs_right", "label":"対右投手", "valMain":".342", "valSub":".289", "winner":"main"}
]
```
台本で `script.highlightScope: "vs_left"` のように variant.id を指定すると該当 variant が表示される。
単一比較しかしない指標は variants なしで valMain/valSub 直書きで OK。

### layoutData.spotlight.players[]
```json
{
  "id": "...", "name": "...", "team": "G", "label": "今季",
  "primaryStat": {"label": "防御率", "value": "2.12",
                  "compareValue": {"label": "昨季", "value": "2.76"}},
  "stats": [{"label": "WHIP", "value": ".97"}, ...],
  "comment": "...",
  "quotes": [{"text": "...", "source": "..."}]
}
```

### comparisons.criteria は数値表現のみ
- ✅ `"2.50以下が優秀"` `".300以上"` `"1.000以上"`
- ❌ `"lower_is_better"` `"高いほど良い"` `"高ければ高いほど良い"`

---

## 2. 列挙値(これ以外禁止)

| キー | 値 |
|---|---|
| layoutType | `radar_compare\|timeline\|ranking\|versus_card\|player_spotlight\|pitch_arsenal\|team_context\|batter_heatmap\|freetalk\|verdict_card` |
| scenePreset | `default\|cinematic_zoom\|neon_burst\|mono_drama\|pastel_pop\|blackboard\|breaking_news` |
| spotlightMode | `default\|single_metric\|stats_grid\|quote` |
| textSize | `xl\|l\|m\|s`(large/medium 禁止) |
| zoomBoost | `"zoom"\|"shake"` 文字列のみ(boolean 禁止) |
| silhouetteType | `batter_right\|batter_left\|batter_stance\|runner\|pitcher_right\|pitcher_left\|pitcher_set\|catcher\|team_huddle\|team_stadium` |
| pattern | `bad_news\|good_news\|defense\|versus\|awakening\|mystery\|future_forecast` (UI 設定保持) |
| aspectRatio | `9:16\|16:9\|1:1` (UI 設定保持) |
| se(18種) | `hook_impact\|highlight_ping\|stat_reveal\|shock_hit\|success_chime\|warning_alert\|transition_swoosh\|outro_fade\|click_tap\|radar_ping\|sparkle_up\|drum_roll\|whoosh_in\|soft_pop\|heavy_thud\|ding_correct\|low_buzz\|crystal_chime` |

### emoji ★絶対遵守★
**指定リスト以外の絵文字は絶対に出力しない。** Grok リサーチに指定リスト外の絵文字があっても、Gem は指定リスト内に置き換える(下記マッピング参照)。

#### A (数原さん) は必ず `"👨‍🏫"`
他の絵文字は使わない。固定。

#### B (もえか) は感情に応じて以下 15 種から 1 つだけ選ぶ
```
😲 (驚き・衝撃)
🤔 (疑問・考え込み)
🤯 (大衝撃・想定外)
😨 (不安・恐れ)
😯 (軽い驚き・気づき)
🧐 (観察・分析)
😆 (痛快・嬉しい)
🥹 (感極まる)
🥰 (温かい・愛おしい)
😌 (納得・安堵)
🤩 (興奮・憧れ)
🥺 (切ない・お願い)
😭 (大泣き・大絶望)
😤 (闘志・憤り)
😅 (苦笑い・冷や汗)
```

#### ★絶対 NG な絵文字★(Grok リサーチにあっても置換すること)
- ❌ `💦` (汗) → 感情に応じて 😅 (苦笑) or 😨 (不安) に置換
- ❌ `🔥` (炎) → 😤 (闘志) or 🤩 (興奮) に置換
- ❌ `👇` (下指差し) → 削除 or 🤔 (問いかけ) に置換
- ❌ `📺` (テレビ) → 削除 or 😌 (案内) に置換
- ❌ `💪` (筋肉) → 😤 (闘志) に置換
- ❌ `🎯` (的) → 🧐 (観察) に置換
- ❌ `📈📉📊` (グラフ) → 🧐 or 😯 (気づき) に置換
- ❌ `⚾` (野球ボール) → 🤔 or 😆 に置換(野球テーマだから絵文字も野球は冗長)
- ❌ `❓❗` → 🤔 (疑問) or 😲 (驚き) に置換
- ❌ `💡` (電球) → 😯 (気づき) or 🤩 (発見) に置換
- ❌ `⚠️` (警告) → 😨 (不安) に置換
- ❌ `🔑` (鍵) → 🧐 or 😯 に置換
- ❌ `🗣️` (発話) → 削除 or 🤔 に置換
- ❌ `🏢` (ビル) → 削除
- ❌ `📱` (スマホ) → 削除
- ❌ `👑` (王冠) → 🤩 (憧れ) に置換
- ❌ `✨💎🎉🎊` などの装飾系 → 削除 or 感情系に置換
- ❌ アルファベット `"A"`, `"B"`, 数字, 記号 (`?`, `!`, `*`) → 必ず絵文字に置換
- ❌ 空文字 `""` → 文脈から感情系を 1 つ選ぶ
- ❌ 複数絵文字 `"😨💦"` → 1 つ目を選ぶ、または感情に最も近い 1 つに置換

#### Grok リサーチからの入力対応
Gem の中間判断に `emotion: "困惑"` `emotion: "驚き"` のような感情指示があれば、対応する emoji を選ぶ。
Gem の中間判断に **指定リスト外の emoji** が直接書かれていれば、上記 NG リストに従って置換する。

### teamPreset
- NPB セ: `npb_giants` / `npb_tigers` / `npb_dragons` / `npb_carp` / `npb_baystars` / `npb_swallows`
- NPB パ: `npb_buffaloes` / `npb_marines` / `npb_eagles` / `npb_lions` / `npb_hawks` / `npb_fighters`
- MLB: `mlb_dodgers` / `mlb_padres` / `mlb_cubs` / `mlb_mets` / `mlb_yankees` / `mlb_redsox` / `mlb_bluejays` / `mlb_angels` / `mlb_mariners`
- `custom`

### hookStats? (id:1 の 4 指標カスタマイズ、オプション)
省略時は playerType 別デフォルト:
- 打者: `[{key:"avg"},{key:"ops"},{key:"hr"},{key:"rbi"}]`
- 投手: `[{key:"era"},{key:"whip"},{key:"so"},{key:"win"}]`
- チーム: `[{key:"rank"},{key:"winRate"},{key:"runs"},{key:"runsAllowed"}]`

### 出力に含めない項目(UI 設定保持)
`hookMediaPattern, hookMediaDurationMs, hookStats, hookFontScale, hookAnimation, outroMediaPattern, aspectRatio, theme, silhouetteType, audio, smartLoop, defaultScenePreset, pattern`

---

## 3. 数値整形

| 系統 | 表記 | 該当指標 |
|---|---|---|
| **打率系** | `.333` 形式(先頭 0 省略、★文字列★) | avg / obp / slg / OPS / 被打率 / BABIP / IsoP |
| **防御率系** | `0.97` 形式(先頭 0 残す、★文字列★) | ERA / WHIP / FIP / K/9 / BB/9 |

整数 0 → `"0"` / 不明 → `"-"`

| 指標 | ❌NG | ✅正しい |
|---|---|---|
| 打率 | `0.333` | `.333` |
| OPS | `0.945` | `.945` |
| WHIP | `.97` | `0.97` |
| 防御率 | `1.9` | `1.90` |

★上記は `mainPlayer.stats` / `subPlayer.stats` / `comparisons[].valMain` / `comparisons[].valSub` のような**画面に文字列としてそのまま表示される値**のルール。

★例外: `layoutData` 内の **計算・整形対象の数値フィールド**は **数値(number)型** で出力すること★

| レイアウト | 数値型必須フィールド | 例 |
|---|---|---|
| `pitch_arsenal` | `arsenal.pitches[].avg` `arsenal.pitches[].pct` `arsenal.pitches[].velocity` | `"avg": 0.205`(★文字列 `".205"` は NG、アプリで toFixed() エラー★) |
| `batter_heatmap` | `heatmap.zones[]` `heatmap.vsRight[]` `heatmap.vsLeft[]` | 元仕様は文字列 `.205` だが、新規データは数値推奨 |
| `radarStats` | 各キーの `main` / `sub` | `"main": 75`(偏差値、数値) |

判別ルール: **「アプリが計算・整形に使う」フィールドは数値**、**「そのまま表示される」フィールドは文字列**。迷ったら `layout-templates.md` のレイアウト別 example を見る。

---

## 4. speech(TTS)読み変換 ★最重要(誤読対策)★

### ★絶対ルール: speech は自然な日本語(漢字混じり)で書く★

★全文ひらがな化は厳禁★。TTS は漢字混じりの自然な日本語の方が正しいイントネーション・単語境界を推定でき、カタコト化しない。
ひらがな化するのは **以下の限定リストに該当する箇所のみ**:

1. ★数値の読み★(0.84 / .333 / 11.20 等)→ 表のとおりに展開
2. ★選手名・チーム名・球場名★(漢字だと TTS が誤読する固有名詞)
3. ★誤読しやすい語★(「実は」「凄い」「今季」など、下記リスト)
4. ★指標略語★(WHIP / OPS / ERA など、カタカナ化)

★それ以外の一般語・野球用語(打者 / 投手 / 防御率 / 奪三振 / 無失点 / 登板 / 連続 等)はすべて漢字維持★。
これらを漢字で書けば TTS が自然なイントネーションで読む。ひらがな化すると逆に読みが崩れる。

### ★絶対禁止: 感情指示・状態指示の文字列を speech に埋め込まない★

Gemini Flash TTS は LLM ベースのため、speech に埋め込まれた指示文字列を **そのまま読み上げてしまう** 事故が発生する。
以下は ★絶対に書かない★:

❌ NG パターン:
```
"speech": "(明るく)中川皓太、13試合連続無失点!"
"speech": "[驚いた声で]えっ、本当ですか?"
"speech": "<excited>すごい数字ですね</excited>"
"speech": "感情:興奮 / 中川皓太、13試合連続無失点!"
```
→ いずれも TTS が「カッコ明るくカッコ閉じ中川皓太...」のように **指示ごと音声化** してしまう。

### ✅ 安全な感情演出: 文字そのものに感情を込める

感情演出は **記号・感嘆詞・語尾** で表現する。これは TTS が自然に演技推定する範囲。

| 演出したい感情 | speech 書き方の例 |
|---|---|
| 驚き | 「えっ!?」「ええっ!」「えええ!?」(語尾延ばし + 「!」「?」) |
| 興奮・テンション高め | 「!」を 1-2 個、語尾を「〜!」「〜です!」で締める |
| 困惑 | 「うーん...」「あの...」「これは...」(「...」で間) |
| 落ち着き(数原) | 「〜なんですよ」「〜ですね」(穏やかな敬語、! は付けない) |
| 鋭い気づき | 「ここがポイントなんです」「実はですね...」 |
| アハ体験 | 「なるほど!」「そういうことか!」 |

### NG vs OK 例(感情演出)

❌ 「(明るく)中川皓太、13試合連続無失点の理由を見ていきましょう!」
✅ 「中川皓太!13試合連続無失点の理由、見ていきましょう!」

❌ 「(驚いた感じで)被打率がレイテンレイロクサンって…!」
✅ 「えええ!?被打率がレイテンレイロクサン!?」

❌ 「<calm>では球種別データを見ましょう</calm>」
✅ 「では球種別のデータを見ましょう」(数原は記号なしの落ち着いた敬語のみで OK)

### ❌ NG vs ✅ OK 例(ひらがな化)

❌ 全文ひらがな化(カタコト化の原因):
```
"speech": "なかがわこうた、じゅうさんしあいれんぞくむしってんのりゆう"
```

✅ 漢字混じりが基本、ひらがなは限定:
```
"speech": "中川皓太、13試合連続無失点の理由"
```

❌ 一般野球用語までひらがな化:
```
"speech": "ぼうぎょりつは、れいてんはちよん"
```

✅ 一般語は漢字、数値だけひらがな:
```
"speech": "防御率は、れいてんはちよん"
```

### 数値読み(指標タイプ別)

| 表記 | 読み |
|---|---|
| `.333` | さんわりさんぶさんりん |
| `.305` | さんわりれいぶごりん |
| `.207` | にわりれいぶしちりん |
| `.945` | れいてんきゅうよんご |
| `0.97` | れいてんきゅうなな |
| `1.90` | いってんきゅうれい |
| `2.12` | にてんいちに |
| `9.51` | きゅうてんごいち |
| `1.00` | いってんれい(★いちてんれいれい NG★) |
| `66.7%` | ろくじゅうろくてんななぱーせんと |
| `50本塁打` | ごじゅっぽんるいだ |

### 指標名はカタカナ

| 元 | 読み |
|---|---|
| WHIP | ダブリュエイチアイピー |
| OPS | オーピーエス |
| ERA | イーアールエー |
| CSW% | シーエスダブリュー |
| K/9 | ケーナイン |
| BB/9 | ビービーナイン |
| IsoP | アイソピー |
| Stuff+ | スタッフプラス |
| Location+ | ロケーションプラス |

### 選手名・チーム名・球場名はひらがな(固有名詞)
- 井上温大 → `いのうえはると`
- 中川皓太 → `なかがわこうた`
- 岡本和真 → `おかもとかずま`
- 阪神 → `はんしん`
- 巨人 → `きょじん`

### 一般語・野球用語は漢字維持(★必ず漢字★、TTS が正しく読める)
打者 / 投手 / 先発 / 中継ぎ / 抑え / 打席 / 打線 / 先頭 / 援護 / 奪三振 / 四球 / 死球 / 安打 / 本塁打 / 守備 / 被打率 / 防御率 / 勝利 / 敗戦 / 連続 / 無失点 / 試合 / 登板 / 球種 / 直球 / 変化球 / 配球 / 制球 / 武器 / 弱点
打つ / 投げる / 抑える / 示す / 続ける / 見せる / 狙う / 崩す / 振る

### 誤読しやすい語はひらがな化(限定リスト)
- 「実は」(みは と読まれる) → `じつは`
- 「凄い」 → `すごい`
- 「今季」(こんき / きんき と読まれる) → `今シーズン` または `こんしーずん`
- 「今期」 → `今シーズン`

### 読点最小限、句点 OK
機械的な「、、、」連発を避ける、間はスペースで代用。

---

## 5. text(テロップ)ルール

- **句点「。」禁止**
- 1 ID あたり 3-12 字 × 3-4 行(合計 12-30 字)
- 説明調連発しない、体言止め活用
- 数値は【】、指標名は「」、衝撃ワードは『』で囲う
  - 例: 打率は【.333】、防御率は【0.97】、「WHIP」、『覚醒』

---

## 6. scripts 配分ルール(本書の規定 + 本書で補完)

### ★ 本書のヒント → JSON 実装値 変換テーブル ★

Gem は **コンテンツ(内容)のみ**を渡す。視覚値は Gem が以下の変換で導出する。

#### emotion → emoji(B もえか専用、A 数原は固定 `"👨‍🏫"`)
| emotion | emoji |
|---|---|
| 驚き | 😲 |
| 疑問・困惑 | 🤔 |
| 大衝撃 | 🤯 |
| 不安・恐れ | 😨 |
| 気づき | 😯 |
| 観察・分析 | 🧐 |
| 痛快 | 😆 |
| 感極まる | 🥹 |
| 温かい | 🥰 |
| 納得・安堵 | 😌 |
| 興奮・憧れ | 🤩 |
| 切ない | 🥺 |
| 大絶望 | 😭 |
| 闘志・憤り | 😤 |
| 苦笑・冷や汗 | 😅 |

#### scene_intent → scenePreset
| scene_intent | scenePreset(推奨) |
|---|---|
| intro | default(戦略 D)/ cinematic_zoom(戦略 A)/ mono_drama(戦略 B)/ blackboard(戦略 C) |
| numerical_shock | mono_drama |
| numerical_normal | default |
| deep_dive | cinematic_zoom |
| aha_moment | pastel_pop / blackboard |
| good_news | pastel_pop |
| bad_news | mono_drama |
| breaking_news | breaking_news |
| outro_active | neon_burst |
| outro_calm | default |

#### emphasis → textSize
| emphasis | textSize |
|---|---|
| high | l(id:1 戦略 A/B では xl) |
| mid | m |
| low | s |

#### impact_level → se
| impact_level | se(推奨) |
|---|---|
| 0(無音) | (記載しない) |
| 1(軽) | soft_pop / highlight_ping / radar_ping / click_tap |
| 2(中) | stat_reveal / success_chime / warning_alert / transition_swoosh |
| 3(強) | shock_hit / hook_impact / heavy_thud |

#### 変換時の優先順位
本書の規定と本テーブルの推奨が食い違う場合:
1. **Gem が明示的に指定した値が無効(指定リスト外)** → 本テーブルで置換
2. 本書の規定と本テーブルが整合 → そのまま採用
3. Gem が無指定 → 本テーブルで判断

★例外★: id:1 戦略(A/B/C/D)を Gem が選択した場合、本書のヒントより **戦略表(§1)** を優先する。id:1 戦略の選択は Gem の専管事項(Grok リサーチでは触れない)。

---


### id:1(タイトル/フック)— 戦略 A/B/C/D の選択に応じて設定

| 戦略 | textSize | scenePreset | se | zoomBoost |
|---|---|---|---|---|
| A: 派手型 | xl | cinematic_zoom or neon_burst | hook_impact | なし |
| B: 数字主役型 | xl(数字) | mono_drama | stat_reveal | zoom(1 箇所のみ) |
| C: 静物写真型 | l | blackboard | soft_pop | なし |
| D: ぬるっと型 | m(or s) | default | なし or soft_pop | なし |

★全戦略共通★: `isCatchy: true`、強調記号 【】「」『』を 2 箇所以上(戦略 D は最小可)

### textSize 配分(30 個中)
- xl=1 個(id:1 のみ)
- l=5-7 個
- m=18-22 個
- s=2-4 個

※戦略 D 採用時は id:1 も m/s の可能性あり → 残りの配分を調整

### scenePreset 配分(30 個中)
- default 12 個以上
- cinematic_zoom 5-7
- mono_drama 3-5
- neon_burst 3-5
- blackboard 2-3
- pastel_pop 1-2
- breaking_news 0-1
- ★同 scenePreset 連続最大 4 ID まで(5 ID 以上 NG)

### se 配分(12-15 箇所)

| se | 使う場面 | 推奨個数 |
|---|---|---|
| `hook_impact`(戦略 A)or `stat_reveal`(戦略 B) | id:1 ★必須(D 除く)★ | 1 |
| `stat_reveal` | 主要数値の初出 | 2-3 |
| `shock_hit` | 衝撃ピーク数値 | 1-2 |
| `highlight_ping` | 良い気づき・追加データ | 2-3 |
| `success_chime` | 朗報・好調山場 | 1-2 |
| `warning_alert` | 悲報・課題山場 | 1 |
| `transition_swoosh` | 話題切替 | 2-3 |
| `outro_fade` | id:最終 ★必須★ | 1 |

★NG: 同 se 連続最大 4 ID まで(5 ID 以上 NG)/ shock_hit を 3 回以上 / 連続 5 ID 以上 se 無し

### zoomBoost(2-3 箇所のみ)
衝撃数値で使用、`"zoom"` または `"shake"` 文字列。id:1 は戦略 A/C/D では入れない(B は zoom 1 箇所可)。

### highlight ルール
- `highlight`: comparisons.id を指定
- `highlightScope`: variants[].id(variants[] 使用時のみ)
- 配置: id:1-3 無し / id:4-25 で 3-5 個を 3-5 ID 連続 / id:26-30 無し
- ★comparisons には台本言及する全指標(5-7 個)を必ず入れる★

### 呼び合いルール
- B → A: 「数原さん」呼び 1 回以上
- A → B: 「もえかちゃん」呼び 1 回以上
- id:2-5 で両方向必須

### 同 speaker 連続最大 4 回まで(5 回以上 NG)

---

## 7. NG ワード(出力レベル絶対禁止)

| 区分 | NG ワード |
|---|---|
| 願望系 | 期待したい / 応援したい / 頑張れ / 信じる |
| 誇張系 | 本当の / 可能性 / 驚愕の / コメントで教えて |
| 飽和パワーワード | 致命的 / 絶望的 / 衝撃の / 異常事態 / 完全崩壊 / 暴く |
| 阿部監督批判型(id:1) | 「阿部監督が激怒」「阿部采配の真相」 |
| 他球団選手比較型(id:1) | 「巨人選手 vs 他球団選手」(巨人選手内競争は OK) |
| 「ヤバい」 | A 全面禁止 / B は 1 動画 1-2 回まで、疑問形 + 敬語のみ |

「現在地」は id:1 タイトル限定で解禁。

---

## 8. 出力前チェック

```
【データ・年号】
□ 今日の日付を web search で確認(今季=西暦、昨季=前年)
□ Grok 入力にない数字を創作していない(不明は "-")
□ teamPreset を主役選手のチームに合わせて指定

【スキーマ】
□ radarStats がオブジェクト(配列 NG)
□ criteria が数値表現(lower_is_better/higher_is_better NG)
□ primaryStat オブジェクト、stats 配列、quotes に source キー
□ zoomBoost は文字列 "zoom"/"shake"(boolean NG)
□ 列挙値が範囲内(textSize=xl/l/m/s、scenePreset=指定 7 種、layoutType=指定 10 種)

【数値整形】
□ 打率系 → ".333" 形式 / 防御率系 → "0.97" 形式
□ speech 読み仮名変換(.333→さんわりさんぶさんりん、0.97→れいてんきゅうなな)
□ 選手名・チーム名はひらがな、一般野球用語は漢字維持、誤読しやすい語(実は等)はひらがな

【scripts 構造】
□ scripts 数 = 動画長 60 秒(または指定時間)に収まる範囲(目安 20-30 個)
□ id:1: 戦略表(§1)に従い textSize/scenePreset/se を設定済み
□ id:2-5 で A↔B 呼び合い両方向
□ 同 speaker 連続最大 4 回 / 同 scenePreset 連続最大 4 ID / 同 se 連続最大 4 ID / scripts.text に句点 NG
□ 数原(A)語尾全部敬語

【配分】
□ textSize: xl=1 / l=5-7 / m=18-22 / s=2-4(戦略 D 採用時は調整)
□ scenePreset: default 半数以上、連続最大 4 ID まで(5 ID 以上 NG)
□ se 12-15 箇所、★使い所表★に従って配置
□ zoomBoost 2-3 箇所、id:1 は戦略 A/C/D で不要

【emoji】★絶対遵守★
□ 全 scripts の emoji が絵文字 1 文字
□ A は **必ず "👨‍🏫"**(他の絵文字 NG)
□ B は **指定リスト 15 種(😲🤔🤯😨😯🧐😆🥹🥰😌🤩🥺😭😤😅)から 1 つだけ**
□ Grok 入力に 💦🔥👇📺💪🎯📈📉📊⚾❓❗💡⚠️🔑🗣️🏢📱👑✨ 等の指定リスト外があれば、対応する感情系に **置換済み**
□ アルファベット / 数字 / 記号 / 空文字 / 複数絵文字 は **すべて置換済み**

【ハイライト】
□ comparisons に台本言及全指標(5-7 個推奨)
□ highlight を id:4-25 で 3-5 ID 連続使用

【NG ワード】
□ 飽和パワーワード単独使用なし
□ 阿部監督批判型タイトルなし / 他球団選手比較型タイトルなし
□ 「ヤバい」は B のみ、運用ルール遵守

【出力】
□ JSON のみ(説明文・前置き・後書き禁止)
```
