# キャラクターデザイン仕様書

> **目的**: 数原さん (A) ともえかちゃん (B) を、絵文字から画像 (AI生成キャラ) へ移行するための完全仕様書。
> Gemini Nano Banana / Imagen / Midjourney / Stable Diffusion XL 等の画像生成 AI に直接渡せるプロンプト、
> 必要な画像規格、コード上の実装方法までを一通り網羅する。

> **作成日**: v5.11.5 時点 (2026-04-26)
> **適用予定**: 登録者 1,000人到達 or 動画 100本到達タイミング

---

## 0. 移行戦略と運用方針

### 0.1 段階的導入計画

```
【現状: 絵文字運用中 (v5.11.5)】
   ↓
【Phase 1: 仕様書作成】(本書、今ここ)
   ↓
【Phase 2: AI 画像生成でサンプル作成】(登録者増える前に予行演習)
   ↓
【Phase 3: 本格投入】(登録者 1,000人到達 or 動画 100本到達)
   - サムネイルにキャラ顔を採用
   - 動画内アバターを画像化
   - チャンネルブランド確立
```

### 0.2 なぜ絵文字を続けつつ準備するか

- **動画の中身 (データ分析の鋭さ)** で勝負する段階を優先
- ただし**準備が後手に回ると本格投入が遅れる**ため、仕様書だけは先行して作る
- AI 画像生成は1〜2時間で全表情を作れる → 準備さえあれば即日投入可能

---

## 1. キャラクター 1: 数原さん (A)

### 1.1 基本プロフィール

| 項目 | 設定 |
|---|---|
| 名前 | 数原さん (かずはらさん) |
| 役割 | 野球データアナリスト・解説者 |
| 性別 | 男性 |
| 年齢 | 40-50代 (45歳が標準値) |
| 国籍 | 日本人 |
| 体型 | 普通体型、健康的 |
| 雰囲気 | 落ち着いた、知的、信頼感がある |

### 1.2 ビジュアル仕様 (詳細)

#### 顔
- **顔の輪郭**: やや丸み、優しい印象
- **肌**: 健康的な肌色 (やや白め、日本人標準)
- **目**: 落ち着いた茶色、やや細め (笑顔時に細くなる)
- **眉**: 自然な太さ、整っている
- **鼻**: 普通サイズ、自然
- **口**: 真面目な時は閉じ気味、笑顔は控えめ
- **メガネ**: ★必須★ 黒縁または濃いグレーのスクエア型 (知的さの象徴)

#### 髪型
- **長さ**: 短髪、ビジネスカット
- **色**: 黒髪に少し白髪混じり (実年齢を演出)
- **スタイル**: サイドを刈り上げ気味、トップは自然に流す
- **整え方**: きちんと整っているが、ガチガチではない

#### 服装
- **トップス**: 紺色のジャケット or ダークグレーのブレザー
- **インナー**: 白のドレスシャツ
- **ネクタイ**: ★オレンジ系★ (UIテーマ色 #f97316 と整合) または無地のオレンジドット
- **服のスタイル**: ビジネスカジュアル (堅すぎず、カジュアルすぎず)

#### 持ち物・小物 (オプション)
- 腕時計 (シンプルなもの、控えめ)
- ペン (胸ポケットに刺さってる程度の控えめさ)
- 背景にデータ・グラフ (アウトロ用フルショットの場合)

### 1.3 性格表現の指針

- 表情ベースは「**真面目で穏やか**」
- 感情の振れ幅は**控えめ** (派手な表情は作らない)
- 視聴者が「**この人の言うこと聞きたい**」と思える信頼感

### 1.4 NG設定

- ❌ ハゲ・薄毛 (キャラ年齢を実年齢以上に見せない)
- ❌ 太りすぎ (健康的なイメージを保つ)
- ❌ ヒゲ (清潔感重視)
- ❌ Tシャツ・ジーンズ (カジュアルすぎ、解説者の信頼感が落ちる)
- ❌ 派手な装飾 (アクセサリー類は最小限)
- ❌ アニメ・萌え系のデフォルメ (リアル寄りのキャラデザ)

---

## 2. キャラクター 2: もえかちゃん (B)

### 2.1 基本プロフィール

| 項目 | 設定 |
|---|---|
| 名前 | もえかちゃん |
| 役割 | YouTube チャンネルのスタッフ兼進行役、アシスタント |
| 性別 | 女性 |
| 年齢 | 20代前半〜中盤 (24歳が標準値) |
| 国籍 | 日本人 |
| 体型 | スリム〜普通、若々しい |
| 雰囲気 | 明るい、親しみやすい、若々しい、ちょっと知的 |

### 2.2 ビジュアル仕様 (詳細)

#### 顔
- **顔の輪郭**: 卵型、可愛らしい
- **肌**: 透明感のある明るい肌色
- **目**: 大きめ、明るい茶色 (生き生きとした表情を作りやすく)
- **眉**: ナチュラル、適度な細さ
- **鼻**: 小さめ、自然
- **口**: 笑顔がチャーミング、口角が上がりやすい
- **メイク**: 自然なメイク (ナチュラル系、派手すぎない)

#### 髪型
- **長さ**: ミディアム〜セミロング (肩〜胸の上くらい)
- **色**: 暗めの茶色 (ダークブラウン)、または黒に近い色
- **スタイル**: ストレート + 軽くウェーブ、自然に下ろしている
- **前髪**: 流し前髪 (シースルーバング系) または眉上で軽く整える
- **質感**: ツヤがあり清潔感

#### 服装
- **トップス**: ★ピンク系★ のブラウス・カットソー (UIテーマ色 #fb7185 ローズピンクと整合)
  - またはオフホワイトのブラウス + ローズピンクのカーディガン
- **スタイル**: オフィスカジュアル〜カジュアル、清楚系
- **アクセサリー**: 小ぶりなピアス (シンプル、シルバー系)
- **服のテーマ**: 「親しみやすさ + 知的さ」のバランス

### 2.3 性格表現の指針

- 表情ベースは「**明るく親しみやすい**」
- 感情の振れ幅が**大きい** (序盤の興味→中盤の驚き→終盤の納得)
- 視聴者が「**この子と話したい / 妹的・後輩的な親近感**」を感じる
- ただし**萌え系・アニメ系のキャラ立ちはしない** (男性視聴者に寒い)

### 2.4 NG設定

- ❌ アニメ調・萌え系のデフォルメ (リアル寄り写実調)
- ❌ ロリ顔・極端に幼い顔 (20代前半が下限)
- ❌ 派手なメイク・厚化粧
- ❌ 露出が多い服装 (品のある女性らしさ)
- ❌ ピンク髪・カラフルな髪色 (自然な日本人らしい髪色)
- ❌ ブランド物の主張 (シンプルさ重視)
- ❌ 媚びた表情 (上目遣い・あざとさ系は禁止)

### 2.5 重要: 「思考は男性ファン代弁」を踏まえた配慮

character-bible に記載の通り、もえかちゃんは**見た目は女性キャスター、中身は男性ファン代弁**。
このため、以下のバランスを取る:

| 軸 | 採用する | 採用しない |
|---|---|---|
| 雰囲気 | 親しみやすさ、清潔感 | 媚び、あざとさ |
| 顔つき | 自然な可愛さ | アニメ的・萌え系 |
| 服装 | オフィスカジュアル、ピンク差し色 | アイドル衣装、露出系 |
| 表情 | 自然な笑顔、驚き、思考 | キス顔、ウインク、ぶりっこ系 |

---

## 3. 必要な表情パターン (絵文字との対応表)

### 3.1 数原さん (A) の表情

A はキャラの性格上、**感情の振れ幅が小さい**ため、最低 2-3 種類で十分。

| # | 表情パターン | 対応絵文字 | 用途 | 優先度 |
|---|---|---|---|---|
| 1 | 真面目・解説 | 👨‍🏫 (デフォルト) | 通常の解説中 | ★最重要★ |
| 2 | 思考・断定 | 🤔 | 結論・断定時 | ★重要★ |
| 3 | 軽く驚き | 😯 | 意外なデータ提示時 | あれば良い |

→ 最低 **1表情 (👨‍🏫)**、理想は **3表情** あれば全シーンカバー可能。

### 3.2 もえかちゃん (B) の表情 (★重要★)

B は**感情遷移**が役割なので、**最低 6種類**は欲しい。

#### 序盤 (id 2-10): 興味・驚き
| # | 表情パターン | 対応絵文字 | 用途 | 優先度 |
|---|---|---|---|---|
| 1 | デフォルト・聞き役 | (中性的な笑顔) | 通常の相槌 | ★最重要★ |
| 2 | 興味津々 | 🤩 | 意外な情報・話題に対する興味 | ★重要★ |
| 3 | 驚き (軽い) | 😲 | データに対する素朴な驚き | ★重要★ |
| 4 | 疑問・首をかしげる | 🤔 | 視聴者目線の素朴な質問 | ★重要★ |

#### 中盤 (id 11-25): 衝撃・動揺
| # | 表情パターン | 対応絵文字 | 用途 | 優先度 |
|---|---|---|---|---|
| 5 | 大きな驚き・衝撃 | 🤯 / 😨 | 強烈なデータ提示後 | ★重要★ |
| 6 | 真剣な思考 | 🧐 | 深掘りに集中する場面 | あれば良い |
| 7 | 困惑・心配 | 😯 / 😨 | 不安要素・悲報型データ | あれば良い |

#### 終盤 (id 26-45): 納得・共感
| # | 表情パターン | 対応絵文字 | 用途 | 優先度 |
|---|---|---|---|---|
| 8 | 大きな笑顔・納得 | 😆 / 🥰 | 結論への賛同・共感 | ★最重要★ |
| 9 | 感動・うっとり | 🥹 | 感動的な締めくくり | あれば良い |
| 10 | 落ち着き・余韻 | 😌 | アウトロの締め | あれば良い |

### 3.3 推奨セット (本格投入時)

#### 【最小構成】(動画用に必須、合計 5枚)
- A: 1枚 (デフォルト 👨‍🏫)
- B: 4枚 (デフォルト / 驚き 😲 / 衝撃 🤯 / 笑顔 😆)

#### 【標準構成】★推奨★ (合計 8-10枚)
- A: 2枚 (デフォルト 👨‍🏫 / 思考 🤔)
- B: 6-8枚 (デフォルト / 興味 🤩 / 驚き 😲 / 疑問 🤔 / 衝撃 🤯 / 真剣 🧐 / 笑顔 😆 / 感動 🥹)

#### 【完全構成】(合計 12-13枚)
- A: 3枚 (デフォルト / 思考 / 軽く驚き)
- B: 10枚 (上記の全パターン)

---

## 4. 画像規格 (技術仕様)

### 4.1 ファイル形式・サイズ

| 項目 | 仕様 |
|---|---|
| ファイル形式 | **PNG** (透過背景必須) |
| カラースペース | sRGB |
| 推奨解像度 | **512×512 px** (生成時) |
| 実用解像度 | 256×256 px (リサイズ後にアプリで使用) |
| カラーモード | RGBA (アルファチャンネル必須) |
| 圧縮 | 標準PNG圧縮 (画質優先) |

### 4.2 構図・トリミング

| 項目 | 仕様 |
|---|---|
| 構図 | **バストアップ** (頭頂部から胸元まで) |
| 中心位置 | 顔がフレーム中央 (やや上目) |
| 余白 | 上 10%、左右 5%、下 5% (頭が切れない程度) |
| 円形クロップ対応 | **重要**: 円形にクロップしても顔が切れないこと |
| 背景 | **完全透過** (色付き背景は禁止) |

### 4.3 円形クロップでの確認

アプリでは円形のアバター枠 (border-radius: 50%) で表示されるため、以下を確認:
```
┌──────────────┐
│     ◯◯◯      │  ← 円形にクロップしてもOK
│   ◯ 顔 ◯    │
│   ◯ 肩 ◯    │
│     ◯◯◯      │
└──────────────┘
```

NG例:
- ❌ 横顔 (円形クロップで切れる)
- ❌ 上半身フル (顔が小さすぎる)
- ❌ 大胆なポーズ (手や物が顔の前にかぶる)

### 4.4 ファイル名と命名規則

```
public/characters/
├── kazuhara-default.png       ← 数原・デフォルト
├── kazuhara-thinking.png      ← 数原・思考
├── kazuhara-mild-surprise.png ← 数原・軽く驚き
├── moeka-default.png          ← もえか・デフォルト
├── moeka-curious.png          ← もえか・興味津々
├── moeka-surprised.png        ← もえか・驚き
├── moeka-questioning.png      ← もえか・疑問
├── moeka-shocked.png          ← もえか・衝撃
├── moeka-serious.png          ← もえか・真剣
├── moeka-smiling.png          ← もえか・大きな笑顔
└── moeka-touched.png          ← もえか・感動
```

#### 命名ルール
- 全て小文字
- ハイフン区切り (アンダースコア使わない)
- フォーマット: `{キャラ名}-{表情}.png`
- 表情名は英語の単語1〜2語

---

## 5. 配置と実装方法 (コード変更点)

### 5.1 ファイル配置

```
app-v5/
├── public/
│   └── characters/         ← ★新規ディレクトリ★
│       ├── kazuhara-default.png
│       ├── kazuhara-thinking.png
│       ├── moeka-default.png
│       └── ...
└── src/
    ├── lib/
    │   └── characterImages.js   ← ★新規ファイル: 絵文字→画像のマッピング★
    └── components/
        ├── PreviewFrame.jsx     ← 修正: emoji 表示 → 画像表示
        └── OutroPanel.jsx       ← 修正: emoji 表示 → 画像表示
```

### 5.2 新規ファイル: `src/lib/characterImages.js`

絵文字 → 画像パスのマッピングを管理:

```javascript
/**
 * キャラクター絵文字 → 画像のマッピング
 * 該当する絵文字がない場合はデフォルトに fallback
 */

const KAZUHARA_IMAGES = {
  default: '/characters/kazuhara-default.png',
  thinking: '/characters/kazuhara-thinking.png',
  mildSurprise: '/characters/kazuhara-mild-surprise.png',
};

const MOEKA_IMAGES = {
  default: '/characters/moeka-default.png',
  curious: '/characters/moeka-curious.png',
  surprised: '/characters/moeka-surprised.png',
  questioning: '/characters/moeka-questioning.png',
  shocked: '/characters/moeka-shocked.png',
  serious: '/characters/moeka-serious.png',
  smiling: '/characters/moeka-smiling.png',
  touched: '/characters/moeka-touched.png',
};

/**
 * 数原 (A) の絵文字 → 画像URL
 */
export function getKazuharaImage(emoji) {
  if (!emoji) return KAZUHARA_IMAGES.default;

  switch (emoji) {
    case '🤔':
    case '🧐':
      return KAZUHARA_IMAGES.thinking;
    case '😯':
    case '😲':
      return KAZUHARA_IMAGES.mildSurprise;
    case '👨‍🏫':
    default:
      return KAZUHARA_IMAGES.default;
  }
}

/**
 * もえか (B) の絵文字 → 画像URL
 */
export function getMoekaImage(emoji) {
  if (!emoji) return MOEKA_IMAGES.default;

  switch (emoji) {
    case '🤩':
      return MOEKA_IMAGES.curious;
    case '😲':
      return MOEKA_IMAGES.surprised;
    case '🤔':
      return MOEKA_IMAGES.questioning;
    case '🤯':
    case '😨':
      return MOEKA_IMAGES.shocked;
    case '🧐':
      return MOEKA_IMAGES.serious;
    case '😆':
    case '🥰':
      return MOEKA_IMAGES.smiling;
    case '🥹':
      return MOEKA_IMAGES.touched;
    case '😌':
    default:
      return MOEKA_IMAGES.default;
  }
}

/**
 * USE_CHARACTER_IMAGES = true で画像版に切り替え
 * 段階的移行のためのフラグ (false なら絵文字フォールバック)
 */
export const USE_CHARACTER_IMAGES = false;  // ← 移行時に true に変更
```

### 5.3 PreviewFrame.jsx の修正

```jsx
import { getKazuharaImage, getMoekaImage, USE_CHARACTER_IMAGES } from '../lib/characterImages';

// circle 内のレンダリングを切替
function CharacterIcon({ speaker, emoji }) {
  if (!USE_CHARACTER_IMAGES) {
    return <span className="emoji">{emoji}</span>;
  }
  const imgUrl = speaker === 'A' ? getKazuharaImage(emoji) : getMoekaImage(emoji);
  return <img className="character-img" src={imgUrl} alt={speaker} />;
}

// 既存の <span className="emoji">{currentEmojiA}</span> を以下に置換:
// <CharacterIcon speaker="A" emoji={currentEmojiA} />
```

### 5.4 GlobalStyles.jsx の追加

```css
/* キャラクター画像表示 (USE_CHARACTER_IMAGES=true 時) */
.avatar-hl .character-img,
.outro-avatar .character-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
```

### 5.5 切替手順 (実装時)

```
1. /public/characters/ に画像10枚を配置
2. characterImages.js の USE_CHARACTER_IMAGES を true に変更
3. ローカルで動作確認
4. リビルド
```

→ コード本体に手を入れる必要なし、フラグ1つで切替可能。

---

## 6. AI 画像生成プロンプト (Gemini Nano Banana 等)

### 6.1 プロンプト基本方針

#### 採用する生成 AI
- **第一推奨**: Gemini 2.5 Flash Image (Nano Banana) ← 同一キャラの連続生成が得意
- **第二推奨**: Stable Diffusion XL + Character LoRA
- **代替**: Midjourney v6 (style consistency が弱いので注意)

#### プロンプトの構成
```
[Style指定] + [キャラ詳細] + [表情指定] + [ポーズ・構図] + [背景・テクニカル指定]
```

### 6.2 数原さん (A) のプロンプト集

#### プロンプト 6.2.1: kazuhara-default (デフォルト・解説中)

```
Photorealistic illustration in semi-realistic Japanese anime style,
portrait of a 45-year-old Japanese male sports data analyst,
wearing a navy blue blazer with a white dress shirt and a subtle orange-toned tie,
short black hair with slight grey at the temples, professionally styled,
black square-framed glasses (modern, intelligent look),
calm professional expression with a slight gentle smile,
looking straight at the camera, eye level shot,
bust-up composition with head and shoulders visible,
arms not visible (clean composition for circular crop),
neutral facial expression conveying trust and intelligence,
clean transparent background (PNG with alpha channel),
soft even lighting, no harsh shadows,
high detail, sharp focus on the face,
512x512 resolution, suitable for circular avatar crop
```

#### プロンプト 6.2.2: kazuhara-thinking (思考・断定時)

(default の続きで連続生成、または以下のプロンプト)

```
Same character as previous: 45-year-old Japanese male sports data analyst,
navy blue blazer, white shirt, orange-toned tie, short black hair with grey,
black square-framed glasses,
[CHANGED EXPRESSION]: thoughtful expression, eyes slightly narrowed in concentration,
hand on chin or near jaw (only if it doesn't break circular crop),
serious analytical look, slight frown of concentration,
bust-up composition, transparent background,
512x512 PNG with alpha channel
```

#### プロンプト 6.2.3: kazuhara-mild-surprise (軽く驚き)

```
Same character: 45-year-old Japanese male sports data analyst,
navy blue blazer, square glasses, short black hair with grey,
[EXPRESSION]: mild surprise, eyebrows slightly raised, eyes a bit wider,
mouth slightly open (subtle, not exaggerated),
maintaining professional composure with a hint of curiosity,
bust-up, transparent background,
512x512 PNG with alpha channel
```

### 6.3 もえかちゃん (B) のプロンプト集

#### プロンプト 6.3.1: moeka-default (デフォルト・聞き役)

```
Photorealistic illustration in semi-realistic Japanese anime style,
portrait of a 24-year-old Japanese woman, sports broadcasting assistant,
medium-length straight dark brown hair with soft waves, sheer bangs,
natural makeup with light blush, warm brown eyes,
wearing a soft rose pink blouse or cardigan over white shirt,
small simple silver pierced earrings,
gentle natural smile, friendly approachable expression,
looking straight at camera, eye level shot,
bust-up composition with head and shoulders,
clean transparent background (PNG with alpha channel),
soft natural lighting,
NOT anime-style, NOT moe-style, semi-realistic illustration,
youthful but professional appearance, intelligent eyes,
high detail face, sharp focus,
512x512 resolution, suitable for circular avatar crop
```

#### プロンプト 6.3.2: moeka-curious (興味津々)

```
Same character as previous: 24-year-old Japanese woman, sports broadcasting assistant,
medium dark brown hair with sheer bangs, rose pink blouse,
[CHANGED EXPRESSION]: bright curious expression, eyes lit up with interest,
small smile with slightly parted lips, eyebrows slightly raised in interest,
bright engaged look,
NOT exaggerated anime expressions, naturally interested,
bust-up, transparent background,
512x512 PNG with alpha channel
```

#### プロンプト 6.3.3: moeka-surprised (驚き)

```
Same character: 24-year-old Japanese woman in rose pink blouse,
medium dark brown hair with bangs,
[EXPRESSION]: genuine surprise, eyes wide open, mouth slightly open in 'oh' shape,
eyebrows raised, hands not visible (or one hand near mouth at most),
naturally expressive but not exaggerated,
NOT anime over-reaction, semi-realistic surprised face,
bust-up, transparent background,
512x512 PNG with alpha channel
```

#### プロンプト 6.3.4: moeka-questioning (疑問・首をかしげる)

```
Same character: 24-year-old Japanese woman, rose pink blouse, brown hair,
[EXPRESSION]: questioning expression, head slightly tilted to one side,
one eyebrow slightly raised, gentle puzzled look,
small uncertain smile, eyes slightly squinted in thought,
hand may rest near chin (if not breaking circular crop),
naturally curious but uncertain,
bust-up, transparent background,
512x512 PNG with alpha channel
```

#### プロンプト 6.3.5: moeka-shocked (大きな衝撃)

```
Same character: 24-year-old Japanese woman, rose pink blouse,
[EXPRESSION]: significant shock and astonishment,
eyes wide open with disbelief, mouth open in surprise,
both eyebrows raised high,
hands not covering face (clean for circular crop),
genuine reaction to disturbing information,
strong emotion but still semi-realistic, not exaggerated anime style,
bust-up, transparent background,
512x512 PNG with alpha channel
```

#### プロンプト 6.3.6: moeka-serious (真剣な思考)

```
Same character: 24-year-old Japanese woman, rose pink blouse,
[EXPRESSION]: serious focused expression, deep in thought,
eyes slightly narrowed in concentration, slight frown,
mouth closed firmly, intense analytical look,
processing complex information,
professional and intelligent expression,
bust-up, transparent background,
512x512 PNG with alpha channel
```

#### プロンプト 6.3.7: moeka-smiling (大きな笑顔・納得)

```
Same character: 24-year-old Japanese woman, rose pink blouse,
[EXPRESSION]: bright happy smile showing teeth, eyes crinkled at corners (eye smile),
genuine joyful expression, head slightly tilted,
naturally radiant happy face,
warm and approachable energy,
NOT idol-style smile, naturally happy,
bust-up, transparent background,
512x512 PNG with alpha channel
```

#### プロンプト 6.3.8: moeka-touched (感動・うっとり)

```
Same character: 24-year-old Japanese woman, rose pink blouse,
[EXPRESSION]: touched and moved expression, eyes slightly glistening,
gentle warm smile, head slightly tilted,
hand may be near heart or chin (if not breaking circular crop),
deeply moved emotional reaction,
soft warm gentle expression, not crying but visibly touched,
bust-up, transparent background,
512x512 PNG with alpha channel
```

### 6.4 共通の技術指定 (全画像共通で末尾に追加)

```
Technical requirements:
- 512x512 pixels resolution
- PNG format with transparent alpha channel background
- No watermark, no text, no logos in image
- Face takes up 40-50% of frame for clear visibility
- Even soft lighting (no dramatic shadows that hide features)
- Sharp focus on facial features
- Color palette: muted natural tones, character's signature color (orange for A / rose pink for B) as accent only
- Style: semi-realistic Japanese illustration, NOT pure anime, NOT pure photorealistic
```

### 6.5 Gemini Nano Banana への指示文 (実用版)

#### 初回プロンプト (1枚目を生成)

```
あなたは Japanese illustrator です。野球データ解説 YouTube チャンネルの
2人のキャラクターアバターを semi-realistic Japanese illustration style で生成してください。

【キャラクター1: 数原さん】
45歳の日本人男性、野球データアナリスト。
- 短い黒髪 (こめかみに少し白髪)
- 黒の四角フレームのメガネ
- 紺色のブレザー、白シャツ、控えめなオレンジトーンのネクタイ
- 落ち着いたプロフェッショナルな表情、軽い微笑み
- 知的で信頼感がある雰囲気

【画像規格】
- 構図: バストアップ (頭から胸元まで)
- 顔がフレームの 40-50% を占める
- 円形クロップに対応 (顔が中央)
- 背景: 完全透過 (PNG アルファチャンネル)
- 解像度: 512x512
- スタイル: アニメではなく semi-realistic イラスト

まず数原さんのデフォルト表情 (穏やかな解説者の顔) を生成してください。
```

#### 連続生成プロンプト (2枚目以降)

```
今生成したキャラクター (数原さん) の同じ顔・髪型・服装で、
別の表情を生成してください:

[表情]: 思考中・考え込んでいる
- 眉を少しひそめる
- 目を細めて集中
- 口を引き締める
- 専門家が分析している雰囲気

他は1枚目と全て同じ (服装・髪型・メガネ・背景透過)
```

#### キャラを切り替える時

```
次は別のキャラクターを生成します。

【キャラクター2: もえかちゃん】
24歳の日本人女性、野球解説番組のアシスタント。
- ミディアムレングスのストレート暗茶髪 (緩いウェーブ)
- シースルーバング前髪
- ナチュラルメイク
- ローズピンクのブラウス or カーディガン
- 小さなシルバーピアス
- 自然で親しみやすい表情、優しい微笑み
- 知的で若々しい雰囲気

【NG事項】
- アニメ的な大げさな顔
- 萌え系・あざとさ
- 露出系の服装
- 派手すぎるメイク

【画像規格】(数原さんと同じ)
- バストアップ、512x512、背景透過、円形クロップ対応

まずデフォルト表情 (聞き役の自然な笑顔) を生成してください。
```

### 6.6 ネガティブプロンプト (Stable Diffusion 系で使用)

```
NEGATIVE PROMPT (avoid):
exaggerated anime style, moe style, lolicon, big eyes,
sexual content, revealing clothes, idol costume,
pink hair, blue hair, unnatural hair color,
multiple characters, group shot, full body,
text, watermark, logo, signature,
blurry, low quality, bad anatomy, deformed face,
heavy shadows, dark scene, dramatic lighting,
hat, cap, mask, sunglasses, accessories covering face,
hands covering face, profile view, back view, side view
```

---

## 7. 確認チェックリスト (生成後の品質確認)

各画像を生成後、以下をチェック:

### 7.1 必須項目

- [ ] 顔がフレーム中央に配置されている
- [ ] 円形クロップで顔が切れない
- [ ] 背景が完全透過 (PNG アルファチャンネル有効)
- [ ] 解像度が 512x512 以上
- [ ] 表情が指定通り (絵文字との対応が分かる)
- [ ] 服装・髪型が他の表情と統一されている (キャラ統一性)
- [ ] テーマ色 (オレンジ / ローズピンク) のアクセントが入っている

### 7.2 NG確認

- [ ] アニメ調が強すぎない
- [ ] 萌え・媚び・あざとさが入っていない (B 特に注意)
- [ ] 露出が多くない (B 特に)
- [ ] 派手な背景・装飾がない
- [ ] テキストやロゴが画像に入っていない
- [ ] 視聴者に違和感を与える要素がない

### 7.3 整合性確認

- [ ] 全表情で同じキャラに見える (顔の特徴が一致)
- [ ] 服装が全表情で統一
- [ ] 髪型が全表情で統一
- [ ] 画像のスタイル (色調、線、塗り) が統一されている

---

## 8. 画像投入時の本番デプロイ手順

### Phase 3 (本格投入時) のステップ:

```
1. AI で全画像を生成 (1〜2時間)
2. PNG 透過処理を確認 (背景が完全透明か、Photoshop / GIMP で確認)
3. 必要なら 512x512 → 256x256 にリサイズ (アプリの実表示サイズに最適化)
4. /public/characters/ に配置
5. characterImages.js で USE_CHARACTER_IMAGES = true に変更
6. ローカルで動作確認 (npm run dev)
7. 本番ビルド (npm run build)
8. リリースノート (CHANGELOG) に記録
9. 動画サンプルを1本作って画像が正しく表示されるか確認
```

### ロールバック手順 (問題発生時)

1. `USE_CHARACTER_IMAGES = false` に戻すだけ
2. 絵文字に即時復帰 (画像ファイルは残しておく)

---

## 9. 関連ファイル / Knowledge File 連携

### 関連する Knowledge File
- `character-bible.md` (キャラ性格・口調・感情遷移)
- `layout-direction.md` (各レイアウトの方向性)
- 本書 `character-design-spec.md` (ビジュアル仕様)

### 整合性チェック
- character-bible で「20代前半〜中盤」と書いてある → 本書も同じ
- character-bible で「ローズピンク」と書いてある → 本書も同じ
- character-bible で「思考は男性ファン代弁」 → 本書のNG項目と整合

将来 character-bible が更新されたら、本書のキャラ仕様も同期更新すること。

---

## 10. FAQ

### Q1. 表情をもっと細かく分けるべきか?

→ 多くて 10種類で十分。それ以上は管理コストの方が高くなる。
B の感情遷移 (序盤 → 中盤 → 終盤) を表現できる最低限を確保すれば OK。

### Q2. アバター以外 (フック画面・サムネイル) でも使う?

→ **強く推奨**。サムネイルにキャラが映ると、視聴者の認知度が劇的に上がる。
フック画面は現状シルエットだが、キャラ顔バストアップに切り替えると印象が変わる。

サムネ用には**バストアップ + 表情ハッキリ**の専用版を別途生成 (1024x1024、表情大きめ)。

### Q3. 動画化 (アニメーション) はする?

→ 当面は静止画で十分。状況に応じて将来的にチェック:
- 喋るアニメーション (口パク) → Live2D 等で実現可能だが工数大
- 表情切替時のフェード → 既に CSS で実装済み (アバター切替時)

### Q4. ライセンスは?

→ AI 生成画像なので、生成 AI のライセンスを確認:
- Gemini: Google の利用規約に従う (商用利用OK)
- Midjourney: 有料プランで商用利用可
- Stable Diffusion: モデルとプロンプトによる (商用OKのモデルを選ぶ)

念のため、本格投入前にライセンス再確認すること。

### Q5. 既存キャラと整合できるか?

→ AI 生成は完全な再現性はないが、以下で整合性を保てる:
- **Reference Image** モード (1枚目を参照画像にして以降を生成)
- **同じ Seed** を使う (Stable Diffusion 系)
- **連続生成プロンプト** (Gemini で「同じキャラで」と指示)

完璧でなくても、**雰囲気が揃っていれば視聴者は気にしない**。

---

## 11. まとめ

このドキュメントを使って:

1. **AI 画像生成 AI に渡すプロンプト** がそのまま使える (セクション 6)
2. **生成した画像をプログラムに乗せる方法** が明確 (セクション 5)
3. **品質チェック項目** が明確 (セクション 7)
4. **段階的に進める計画** が明確 (セクション 0、8)

→ 登録者 1,000人 / 動画 100本到達したら、**1日で投入完了**できる準備が整った。
