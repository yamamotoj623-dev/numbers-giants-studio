# GAS プロキシ セットアップ手順書

Baseball Analytics Video Creator (v5.0.0) のバックエンドとなる Google Apps Script プロキシの導入手順です。

## 所要時間の目安

初回セットアップ: **約15分**（Gemini APIキー取得を含む）

---

## STEP 1: Gemini API キー取得

1. https://aistudio.google.com/ にアクセス（Googleアカウントでログイン）
2. 左メニューから「Get API key」をクリック
3. 「Create API key」→プロジェクトを選択（新規可）
4. 発行されたキー（`AIza...` で始まる文字列）をコピー
5. Google Cloud Console で **Paid tier** に切り替え
   - プレビュー機能はFree tierでは使用不可のため必須

API キーは後で使うので、一時的にメモ帳などに控えておきます。

---

## STEP 2: BGM フォルダを Google Drive に作成

1. https://drive.google.com/ にアクセス
2. 「新規」→「フォルダ」で `bgm-library` などの名前でフォルダ作成
3. フォルダを開いた状態でURLを確認
   - URL形式: `https://drive.google.com/drive/folders/XXXXXXXXXXXXXXXX`
   - `XXXXXXXXXXXXXXXX` の部分が **フォルダID**
4. このフォルダIDをメモ
5. BGM を適当にいくつか MP3 でアップロード（後でいつでも追加可）

### BGMに属性（ジャンル・ムード）を付けたい場合

各MP3ファイルを右クリック →「ファイルの詳細を表示」→「説明」欄に以下の形式で書く:

```
genre: 落ち着き
mood: 分析系
duration: 120
```

この情報はGAS側で自動パースされ、アプリで絞り込み検索できるようになります。

---

## STEP 3: Google Apps Script プロジェクト作成

1. https://script.google.com/ にアクセス
2. 「新しいプロジェクト」をクリック
3. 左上の「無題のプロジェクト」をクリックして `baseball-analytics-proxy` に改名
4. 左サイドメニューから `コード.gs` を開く
5. デフォルトのコードを **全削除**
6. このリポジトリの `Code.gs` の内容を **全てコピー＆ペースト**
7. 右上の 💾 保存ボタン（または Ctrl+S）

---

## STEP 4: スクリプトプロパティに認証情報を保存

1. 左メニュー「プロジェクトの設定」（歯車アイコン）をクリック
2. 下部の「スクリプト プロパティ」まで下にスクロール
3. 「スクリプト プロパティを追加」で以下の4つを順に追加:

| プロパティ名 | 値 |
|------|---|
| `GEMINI_API_KEY` | STEP 1でコピーしたAPIキー（`AIza...`） |
| `AUTH_TOKEN` | 任意のランダム文字列32文字以上（下記の自動生成推奨） |
| `BGM_FOLDER_ID` | STEP 2でコピーしたフォルダID |
| `LOG_SHEET_ID` | （空欄でOK、後から設定可） |

### AUTH_TOKEN の自動生成方法

コードエディタに戻り、関数ドロップダウンから `setupInitialProperties` を選択→実行
→ ログに表示された UUID をそのまま `AUTH_TOKEN` として使用可能。

ただし `GEMINI_API_KEY` と `BGM_FOLDER_ID` は自動では入らないので、
手動でスクリプトプロパティ画面から追加してください。

保存後、最後に必ず「保存」ボタンで確定してください。

---

## STEP 5: デプロイしてURLを取得

1. 右上「デプロイ」→「新しいデプロイ」
2. 歯車アイコン → 「ウェブアプリ」を選択
3. 以下の設定で作成:
   - 説明: `baseball-analytics-proxy-v1`
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員**
4. 「デプロイ」ボタン
5. 初回は権限承認画面が出る（Google Drive・外部API呼び出しの許可）
   - 「許可を確認」→ 自分のGoogleアカウントを選択
   - 「詳細」→「baseball-analytics-proxy（安全でないページ）に移動」→「許可」
6. 発行された **ウェブアプリのURL** をコピー
   - 形式: `https://script.google.com/macros/s/XXXXXXXXXX/exec`

このURLを Reactアプリの環境変数に設定します（次ステップ）。

---

## STEP 6: 疎通確認

GASエディタ内で動作確認を先に済ませます。

### 6-1. BGM一覧取得テスト

関数ドロップダウンから `testListBgm` を選択して実行。

期待される実行ログ:
```
BGM count: 3
- Calm Analysis (分析系) 2500KB
- Dramatic Reveal (盛り上がり) 3200KB
...
```

### 6-2. TTS 疎通テスト

関数ドロップダウンから `testTTS` を選択して実行。

期待される実行ログ:
```
TTS test OK
- audio data size: 32824 chars
- voice: Charon
- estimated cost: $0.000015
```

ここでエラーが出る場合、GEMINI_API_KEY が間違っているか、Paid tier に切り替わっていない可能性があります。

---

## STEP 7: Reactアプリ側の環境変数設定

Reactプロジェクトのルートに `.env.local` を作成（既存ファイルがあれば追記）:

```
VITE_GAS_ENDPOINT=https://script.google.com/macros/s/XXXXXXXXXX/exec
VITE_GAS_AUTH_TOKEN=（STEP 4でメモしたAUTH_TOKEN）
```

スマホ完結運用にする場合、Vercel等にデプロイする際、
これらを **環境変数（Environment Variables）** として設定してください。
コミットされる `.env.local` に含めてしまうとキー流出の原因になります。

---

## STEP 8: スマホからのアクセス確認

1. Pixel の Chrome で `https://script.google.com/macros/s/XXXXXXXXXX/exec` を開く
2. 以下のJSONが返れば成功:

```json
{
  "status": "ok",
  "message": "Baseball Analytics GAS Proxy v1.0.0",
  "endpoints": ["tts", "list_bgm", "log", "health"]
}
```

これでGAS側のセットアップ完了です。

---

## トラブルシューティング

### `"error": "Unauthorized"` が返る場合
→ Reactアプリから送っている `token` と、GAS側の `AUTH_TOKEN` が一致していません。
両方を改めて確認してください。

### `"error": "GEMINI_API_KEY not configured"` が返る場合
→ スクリプトプロパティの設定が反映されていません。スクリプトプロパティ画面で再確認。

### `"error": "Gemini API failed", "statusCode": 429` が返る場合
→ Gemini API側のレート制限に達した、または Paid tier に切り替えていません。

### `"error": "Rate limit exceeded"` が返る場合
→ GAS側の日次上限（500回）に到達しました。
`resetRateLimit` 関数を実行して手動リセット可能です。

### コード更新後に反応しない
→ ウェブアプリは**デプロイし直す必要**があります。
「デプロイ」→「デプロイを管理」→ 既存デプロイを編集 → バージョンを「新バージョン」に変更 →「デプロイ」。
URLは変わりません。

---

## 運用後の定期メンテナンス

- **月初にコスト確認**: Google Cloud Console → Billing → Gemini APIの課金額チェック
- **BGM追加**: Drive の `bgm-library` フォルダにMP3を追加するだけ（GAS変更不要）
- **APIキーのローテーション**: 半年に1回程度、`GEMINI_API_KEY` を新しく発行し直して更新

---

## セキュリティ上の注意

- `AUTH_TOKEN` が漏れると第三者がTTSを無料で使い放題になります（あなたの課金）
- Reactアプリを公開GitHubに置く場合、`.env.local` は必ず `.gitignore` に含めてください
- 本番URLは可能なら Vercel のPrivate Deploymentや、独自ドメイン+Cloudflare Accessなどで保護することを推奨

---

次のステップ: `2. React雛形コード v5.0.0` の実装に進みます。
