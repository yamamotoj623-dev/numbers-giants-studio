# レイアウトテンプレート集『数字で見るG党』

> ★ Gem の Knowledge File として参照される。
> 各レイアウトの完全な JSON テンプレートと入力ガイドを集約。
> JSON 生成時、選んだ layoutType の節を参照して構造をそのまま埋めること。
> トップレベルスキーマ / 列挙値 / 配分ルール / 数値整形は `json-schema-rules.md` 参照。

## レイアウトテンプレート (8種)

<schema_layoutData>
使う layoutType の分だけ必ず入れる。空はNG。**詳細は layout-direction.md 参照**。
以下は 8 レイアウト全ての**完全テンプレート + 入力ガイド**。AI 出力時はこの構造をそのまま埋める。

────────────────────────────────────────
### 1. radar_compare (レーダー比較)
役割: 「全体像」 — 5 軸でmain/subを比較

```json
"layoutData": {
  "radar": {
    "stats": [
      { "label": "長打力", "main": 75, "sub": 60 },
      { "label": "選球眼", "main": 65, "sub": 55 },
      { "label": "三振率", "main": 70, "sub": 50 },
      { "label": "得点創出", "main": 80, "sub": 65 },
      { "label": "本塁打率", "main": 72, "sub": 58 }
    ]
  }
}
```
入力ガイド:
- stats: **必ず 5 軸**。label は radarStats 5 軸のラベルと揃える
- main / sub: **0-100 の偏差値** (リーグ中央が50、優秀=70+、突出=85+)
- ※ トップレベル radarStats と内容を揃えること (radarStats が偏差値の元データ、layoutData.radar はチャート用)

────────────────────────────────────────
### 2. timeline (時系列)
役割: 「変化」 — 月別/週別/日別/年別の推移

```json
"layoutData": {
  "timeline": {
    "unit": "month",
    "metric": "OPS",
    "points": [
      { "label": "4月", "value": ".724" },
      { "label": "5月", "value": ".810", "isPeak": true, "highlight": true },
      { "label": "6月", "value": ".945" },
      { "label": "7月", "value": ".678", "isBottom": true }
    ]
  }
}
```
入力ガイド:
- unit: "day"|"week"|"month"|"year"。シーズン直近の動画なら "day"、年間推移なら "month"
- metric: 表示指標名 ("OPS"/"打率"/"防御率" 等)
- points: 最低 2 点、推奨 3-7 点
- ★各 point は `value` (主役の値) と任意の `sub` (比較線) を持つ★。**`main` は使わない** — `value` に統一
- value: 文字列で出力 (★0始まり小数は ".724"★)
- sub: リーグ平均・前年・ライバル選手等を任意で
- isPeak: 動画のピーク (急上昇)、isBottom: 谷、highlight: 注目点 (アニメ強調)

────────────────────────────────────────
### 3. ranking (ランキング)
役割: 「衝撃」 — 順位で位置づけを示す

```json
"layoutData": {
  "ranking": {
    "mood": "best",
    "showCutoff": false,
    "metrics": [
      {
        "id": "ops",
        "label": "OPS",
        "kana": "オーピーエス",
        "unit": "",
        "entries": [
          { "rank": 1, "name": "岡本和真", "team": "G", "value": "1.013", "isMainPlayer": true },
          { "rank": 2, "name": "村上宗隆", "team": "S", "value": ".945" },
          { "rank": 3, "name": "牧秀悟",   "team": "DB", "value": ".928" },
          { "rank": 4, "name": "佐野恵太", "team": "DB", "value": ".895" },
          { "rank": 5, "name": "大山悠輔", "team": "T", "value": ".878" }
        ]
      },
      {
        "id": "hr",
        "label": "本塁打",
        "kana": "ほんるいだ",
        "unit": "本",
        "entries": [
          { "rank": 1, "name": "岡本和真", "team": "G", "value": 18, "isMainPlayer": true },
          /* 5-10 人 */
        ]
      }
    ]
  }
}
```
入力ガイド:
- mood: "best" (ポジティブ/上位)、"worst" (ネガティブ/下位)、"neutral" (中立)。色味/強調が変わる
- showCutoff: 圏外マーカー表示 (デフォルト false)
- metrics: 動画中で切替えたい指標分だけ。各 id は一意、台本 script.focusMetric で参照
- kana: TTS用 (アルファベット指標は必須)
- entries: **5-10 人**。rank 1 から連番、value は文字列推奨
- team: 球団略称 (G/T/D/S/B/E/L/F/H/M)。**球団横断ランキングなら必須**、自軍 (G) 動画では省略可
- isMainPlayer: 主役選手にマーク (オレンジ強調)、isTeam: チーム動画 (球団全体強調)

────────────────────────────────────────
### 4. versus_card (対決カード)
役割: 「対決感」 — 主役 vs 比較対象を1指標ずつ並べて勝敗

```json
"layoutData": {
  "versus": {
    "mood": "neutral",
    "categoryScores": [
      { "label": "打率",     "rawMain": ".305", "rawSub": ".278" },
      { "label": "本塁打",   "rawMain": 18,    "rawSub": 12, "lowerBetter": false },
      { "label": "OPS",      "rawMain": ".945", "rawSub": ".812" },
      { "label": "三振率",   "rawMain": ".180", "rawSub": ".220", "lowerBetter": true },
      { "label": "出塁率",   "rawMain": ".385", "rawSub": ".345" }
    ]
  }
}
```
入力ガイド:
- categoryScores: **5-7 項目** が見やすい
- rawMain / rawSub: 表示する数値 (★文字列で出力★)
- lowerBetter: 三振率/防御率/失点等の「低い方が良い」指標で true。指定なし=高い方勝ち
- 勝敗マークはアプリで自動判定 (◀ ▶ ＝)
- ※ kana は v5.15.5 で表示廃止、出力不要

────────────────────────────────────────
### 5. player_spotlight (選手スポット)
役割: 「主役感」 — 1選手を画面いっぱいに

```json
"layoutData": {
  "spotlight": {
    "mode": "default",
    "showPlayerName": true,
    "players": [
      {
        "id": "okamoto",
        "name": "岡本和真",
        "team": "G",
        "label": "26年(今季)",
        "primaryStat": {
          "label": "OPS",
          "value": ".945",
          "compareValue": { "label": "リーグ平均", "value": ".712" }
        },
        "stats": [
          { "label": "打率",   "value": ".305" },
          { "label": "本塁打", "value": 18 },
          { "label": "打点",   "value": 52 },
          { "label": "出塁率", "value": ".385" }
        ],
        "comment": "覚醒の3割打者",
        "quotes": [
          { "text": "もっと長打を打ちたい", "source": "2026/4 取材" },
          { "text": "守備位置はどこでも", "source": "2026/3 春季練習" },
          { "text": "監督の信頼に応えたい", "source": "2026/4 ヒーローインタビュー" }
        ]
      },
      {
        "id": "sano",
        "name": "佐野恵太",
        "team": "DB",
        "primaryStat": { "label": "OPS", "value": ".895" },
        "stats": [ /* 同じ構造 */ ],
        "quotes": [ /* 2-4個 */ ]
      }
      /* 主役+対比1-3人 = 計 3-5 人 */
    ]
  }
}
```
入力ガイド:
- mode (4種): "default" (主指標+サブ) / "single_metric" (1指標超巨大) / "stats_grid" (基本成績網羅) / "quote" (発言ピック)
- players: **3-5 人**。id は一意 (台本 focusEntry で指定)
- primaryStat: そのシーンの主役指標 1 個
- compareValue: 比較対象 (リーグ平均・前年・ライバル等)
- stats: サブ指標 4-6 個
- quotes: **2-4 個** (台本 focusQuoteIndex で切替)
- 旧 quote/quoteSource (単数) も後方互換だが新規データは quotes[] 配列推奨

────────────────────────────────────────
### 6. team_context (チーム文脈)
役割: 「チームの表情」 — チーム全体・打順・先発ローテ・セ平均比較

```json
"layoutData": {
  "context": {
    "mode": "single",
    "lineup": [
      { "order": 1, "name": "丸佳浩", "pos": "中", "ops": ".812" },
      { "order": 2, "name": "吉川尚輝", "pos": "二", "ops": ".745" },
      { "order": 3, "name": "岡本和真", "pos": "一", "ops": "1.013" }
      /* 1-9番 */
    ],
    "rotation": [
      { "name": "戸郷翔征", "era": "2.45", "win": 8, "ip": "85.0" },
      { "name": "山崎伊織", "era": "3.10", "win": 6, "ip": "72.0" }
      /* 5-6人 */
    ],
    "comparison": {
      "team": "巨人",
      "league": "セ平均",
      "metrics": [
        { "label": "得点",   "team": 412, "league": 320 },
        { "label": "失点",   "team": 305, "league": 350, "lowerBetter": true },
        { "label": "OPS",    "team": ".752", "league": ".698" }
      ]
    }
  }
}
```
入力ガイド:
- mode: "single" (チームビュー) / "compare" (セ平均比較)
- lineup: 打順 1-9 番。pos は守備位置 (一/二/三/遊/捕/中/左/右/指)
- rotation: 先発ローテ 5-6 人
- comparison: セ平均との対比指標。lowerBetter は失点/被OPS等

────────────────────────────────────────
### 7. pitch_arsenal (球種パレット)
役割: 「投手の手の内」 — 球種ごとの被打率・球速・比率

```json
"layoutData": {
  "arsenal": {
    "mode": "single",
    "pitches": [
      { "name": "ストレート",   "pct": 48, "avg": 0.205, "velocity": 152, "color": "#ef4444" },
      { "name": "スプリット",   "pct": 22, "avg": 0.150, "velocity": 138, "color": "#3b82f6" },
      { "name": "スライダー",   "pct": 18, "avg": 0.180, "velocity": 132, "color": "#10b981" },
      { "name": "カーブ",       "pct": 8,  "avg": 0.250, "velocity": 118, "color": "#f59e0b" },
      { "name": "チェンジアップ","pct": 4,  "avg": 0.200, "velocity": 128, "color": "#8b5cf6" }
    ]
  }
}
```
入力ガイド (★投手専用★):
- mode: "single" (1投手) / "compare" (今季vs昨季の球種変化) / "vs_batter" (対打者別)
  - 省略可: pitches のみなら "single" / comparePitches あれば "compare" / vsBatter あれば "vs_batter" と自動推定
- pitches: **4-6 種類**。pct は割合% の整数または小数(合計 100% にする)
- ★avg は数値で出力★(0.205 のような数値リテラル)。**`".205"` のような文字列は NG(アプリで表示崩壊)**
- velocity: 球速 km/h(数値、整数推奨)
- color: 16 進カラー文字列、視認性確保のため明度差つける。省略時はテーマ既定色

compare モード用の追加フィールド:
```json
"layoutData": {
  "arsenal": {
    "mode": "compare",
    "compareLabel": "昨季",
    "pitches":        [ { "name": "ストレート", "pct": 48, "avg": 0.205, "velocity": 152, "color": "#ef4444" }, ... ],
    "comparePitches": [ { "name": "ストレート", "pct": 52, "avg": 0.240, "velocity": 150, "color": "#ef4444" }, ... ]
  }
}
```

vs_batter モード用の追加フィールド:
```json
"layoutData": {
  "arsenal": {
    "mode": "vs_batter",
    "vsBatter": {
      "vsRight": [ { "name": "ストレート", "pct": 50, "avg": 0.220, "color": "#ef4444" }, ... ],
      "vsLeft":  [ { "name": "ストレート", "pct": 45, "avg": 0.180, "color": "#ef4444" }, ... ]
    }
  }
}
```

────────────────────────────────────────
### 8. batter_heatmap (打者ゾーン打率)
役割: 「打者の癖」 — 9 ゾーンの打率を熱地図で

```json
"layoutData": {
  "heatmap": {
    "mode": "vs_handedness",
    "vsRight": [".180", ".240", ".290",   ".220", ".310", ".340",   ".150", ".220", ".260"],
    "vsLeft":  [".200", ".260", ".280",   ".210", ".280", ".320",   ".170", ".230", ".240"]
  }
}
```
mode: "single" の場合:
```json
"layoutData": {
  "heatmap": {
    "mode": "single",
    "zones": [".180", ".240", ".290",   ".220", ".310", ".340",   ".150", ".220", ".260"]
  }
}
```
入力ガイド (★打者専用★):
- mode: "single" (単一ヒート) / "vs_handedness" (対右投手 vs 対左投手)
- zones / vsRight / vsLeft: **必ず 9 値の配列**
- 順序: 上段3 (内角・真中・外角) → 中段3 → 下段3 (投手目線)
- 値は打率 (★0始まり小数は ".305" 表記★)
</schema_layoutData>

<schema_script>
各 script:
{
  id: 連番(1から),
  speaker: "A" or "B",
  emoji: "👨‍🏫"(A固定) or "😲🤔🤯😨😯🧐😆🥹🥰😌🤩"等(B),
  text: "テロップ文(改行は \\n)、強調は【】「」『』",
  speech: "TTS用読み仮名(漢字を必ずひらがなに、数字も読み仮名)",
  isCatchy: true (id:1のみ),
  layoutType: "...",  ← 切替時のみ
  scenePreset: "default|cinematic_zoom|neon_burst|mono_drama|pastel_pop|blackboard|breaking_news",  ← ★v5.19.6新★ シーン全体の演出を切替 (紙芝居脱却用)。シーン毎に違う preset を当てると同じ動画でも飽きない
  spotlightMode: "default|quote|stats_grid|single_metric",  ← ★v5.18.14新★ 選手スポット表示時のモード。シーンごとに切替可 (省略時はlayoutData.spotlight.mode を継承)
  highlight: "comparisonsのid",  ← 該当指標の話してる時 (ranking でも metric.id を兼ねる旧来仕様)
  highlightScope: "variants[].id",  ← ★v5.19.6新★ 同じ指標でも 'overall'/'vs_left'/'vs_right'/'last_year' 等のスコープを選んで表示
  focusEntry: "spotlight時のid (player.id) または ranking時のentry.name",
  focusQuoteIndex: 0,  ← ★v5.18.13新★ 同じ player の中で別の quote を選ぶ時のインデックス (player.quotes[idx])
  focusMetric: "ranking.metrics[].id",  ← ★v5.18.13新★ ranking で動画中に metric を切替える時の専用フィールド (highlight より優先)
  textSize: "xl|l|m|s",  ← フェーズB-D で使用
  zoomBoost: "zoom|shake|zoomShake",  ← ★v5.18新★ 重要発言の演出。1動画 2-3 箇所まで(乱用NG)
  se: "hook_impact|highlight_ping|stat_reveal|shock_hit|success_chime|warning_alert|transition_swoosh|outro_fade|null"
}
★zoomBoost 使い分け★
  - "zoom": ポジティブな衝撃データ (「OPS .950超え」)
  - "shake": ネガティブ驚き (「実は防御率11.20」)
  - "zoomShake": オチ直前の最大盛り上げ (「覚醒の理由は…」)
★id:1 (hook) は zoomBoost 指定不要★ — 自動で冒頭フラッシュ + 太鼓SEが入る

### scripts 配列の完全な実例 (1動画 28-30 シーン)

```json
"scripts": [
  /* ===== id:1 動画タイトル (フック、isCatchy: true) ===== */
  {
    "id": 1,
    "speaker": "A",
    "emoji": "👨‍🏫",
    "text": "岡本和真\n【.305】\n覚醒の理由",
    "speech": "おかもとかずまの打率さんわりごぶ。覚醒の理由を解説します。",
    "isCatchy": true,
    "layoutType": "radar_compare",
    "textSize": "xl"
  },

  /* ===== id:2-3 状況設定 (A→B 呼び合いで開始) ===== */
  { "id": 2, "speaker": "A", "emoji": "👨‍🏫", "text": "もえかちゃん\n岡本選手\n知ってる?", "speech": "もえかちゃん、岡本選手知ってる?", "textSize": "m" },
  { "id": 3, "speaker": "B", "emoji": "🤔", "text": "巨人の\n4番ですよね", "speech": "巨人の四番ですよね。", "textSize": "m" },

  /* ===== id:4-8 第1ハイライト: 打率 (variants で対左/対右切替) ===== */
  { "id": 4, "speaker": "A", "emoji": "👨‍🏫", "text": "今季の打率は\n【.305】", "speech": "今季の打率はさんわりごぶ。", "highlight": "avg", "highlightScope": "overall", "scenePreset": "cinematic_zoom", "textSize": "l", "zoomBoost": "zoom", "se": "stat_reveal" },
  { "id": 5, "speaker": "B", "emoji": "😲", "text": "凄い数字です\nね!", "speech": "すごい数字ですね!", "textSize": "m" },
  { "id": 6, "speaker": "A", "emoji": "👨‍🏫", "text": "ですが対左だと\n【.201】", "speech": "ですが対左だとにわりいちぶ。", "highlight": "avg", "highlightScope": "vs_left", "scenePreset": "mono_drama", "textSize": "l", "se": "shock_hit" },
  { "id": 7, "speaker": "B", "emoji": "🤯", "text": "1割も\n落ちてる…", "speech": "いちわりもおちてる…", "textSize": "m" },
  { "id": 8, "speaker": "A", "emoji": "👨‍🏫", "text": "対右だと\n【.342】の\n打ち分け", "speech": "対右だとさんわりよんぶの打ち分け。", "highlight": "avg", "highlightScope": "vs_right", "scenePreset": "default", "textSize": "m" },

  /* ===== id:9-13 第2ハイライト: スポットライト (focusEntry + spotlightMode) ===== */
  { "id": 9, "speaker": "A", "emoji": "👨‍🏫", "text": "選手詳細\n見てみよう", "speech": "選手詳細を見てみよう。", "layoutType": "player_spotlight", "focusEntry": "okamoto", "spotlightMode": "stats_grid", "textSize": "m", "se": "transition_swoosh" },
  { "id": 10, "speaker": "B", "emoji": "🧐", "text": "OPS .945は\n突出して\nますね", "speech": "オーピーエスきゅーよんごは突出してますね。", "spotlightMode": "single_metric", "scenePreset": "neon_burst", "textSize": "m" },
  { "id": 11, "speaker": "A", "emoji": "👨‍🏫", "text": "本人は\nこう語る", "speech": "本人はこう語る。", "spotlightMode": "quote", "focusQuoteIndex": 0, "textSize": "m" },
  { "id": 12, "speaker": "A", "emoji": "👨‍🏫", "text": "そして\n別の取材では", "speech": "そして別の取材では。", "spotlightMode": "quote", "focusQuoteIndex": 1, "textSize": "m" },
  { "id": 13, "speaker": "B", "emoji": "🥹", "text": "謙虚な姿勢が\n素敵です", "speech": "けんきょなしせいがすてきです。", "textSize": "m" },

  /* ===== id:14-19 第3ハイライト: ランキング (focusMetric で metric 切替) ===== */
  { "id": 14, "speaker": "A", "emoji": "👨‍🏫", "text": "セ・リーグ\n打率\nランキング", "speech": "セ・リーグの打率ランキング。", "layoutType": "ranking", "focusMetric": "avg", "scenePreset": "default", "textSize": "m", "se": "transition_swoosh" },
  { "id": 15, "speaker": "B", "emoji": "😲", "text": "岡本が\n1位なんですか", "speech": "おかもとがいちいなんですか。", "textSize": "m" },
  { "id": 16, "speaker": "A", "emoji": "👨‍🏫", "text": "本塁打でも\n見てみよう", "speech": "本塁打でも見てみよう。", "focusMetric": "hr", "textSize": "m" },
  { "id": 17, "speaker": "B", "emoji": "🤩", "text": "ここでも\n1位!", "speech": "ここでもいちい!", "textSize": "m", "zoomBoost": "zoom" },
  { "id": 18, "speaker": "A", "emoji": "👨‍🏫", "text": "OPSは\n圧倒的", "speech": "オーピーエスはあっとうてき。", "focusMetric": "ops", "scenePreset": "breaking_news", "textSize": "m" },
  { "id": 19, "speaker": "B", "emoji": "🤯", "text": "覚醒\nしてますね…", "speech": "かくせいしてますね…", "textSize": "m" },

  /* ===== id:20-25 ストーリーアーク後半: なぜ覚醒したか (versus_card や timeline) ===== */
  /* ... 同様に */

  /* ===== id:26-30 締め (二択で問いかけ) ===== */
  { "id": 28, "speaker": "A", "emoji": "👨‍🏫", "text": "皆さんは\nどう思う?", "speech": "みなさんはどうおもう?", "scenePreset": "blackboard", "textSize": "m" },
  { "id": 29, "speaker": "B", "emoji": "🤔", "text": "コメントで\n教えて\nください", "speech": "コメントでおしえてください。", "textSize": "m" },
  { "id": 30, "speaker": "A", "emoji": "👨‍🏫", "text": "次回も\nお楽しみに", "speech": "じかいもおたのしみに。", "textSize": "m" }
]
```

★この実例で示している重要な使い分け★:
- **同じ comparisons.id で variants 切替** (id:4 overall → id:6 vs_left → id:8 vs_right) — 「打率3割」と「対左で2割」の混乱解消
- **scenePreset を 4 種類使い分け** (cinematic_zoom / mono_drama / neon_burst / breaking_news / blackboard / default)
- **spotlightMode を 3 シーンで切替** (stats_grid → single_metric → quote)
- **focusQuoteIndex で同選手の発言を 2 個切替** (id:11 → id:12)
- **focusMetric で ranking の metric を 3 個切替** (avg → hr → ops)
- **zoomBoost は 2-3 箇所のみ** (id:4 zoom, id:17 zoom)
</schema_script>

