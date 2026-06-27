# Activation Radar — ギャラリー

`activation-radar`（Notion Worker）が収集・Claude判定した**ブランドアクティベーション事例**を、
毎朝チェックしやすいギャラリーサイトとして表示する Next.js アプリ。Vercel デプロイ前提。

- Notion DB「アクティベーション事例」の **確認済み / 保存** を新着順にカード表示
- 「今朝の新着」タブ・キーワード検索・施策タイプ絞り込み・注目（◎○）フィルタ
- 共有パスワードでゲート（社内データなので未設定時は全面ブロック）
- 毎朝 JST 8:00 に Vercel Cron で新着を **Slack** にダイジェスト送信

## セットアップ

### 1. Notion 側
1. https://app.notion.com/developers でインテグレーションを作成（このアプリ用に1つ）
2. 「アクティベーション事例」DB をそのインテグレーションに共有
3. データソースID取得: `ntn datasources resolve <データベースID>`

### 2. 環境変数（`.env.example` 参照）
| 変数 | 用途 |
| --- | --- |
| `NOTION_API_TOKEN` | Notion 読み取り（このアプリ用インテグレーションのトークン） |
| `ACTIVATION_DATA_SOURCE_ID` | 対象DBのデータソースID |
| `GALLERY_PASSWORD` | ギャラリーの共有パスワード（未設定だと全面 503） |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook（毎朝ダイジェスト送信先） |
| `GALLERY_BASE_URL` | 公開URL（Slackボタン用。例 `https://xxx.vercel.app`） |
| `CRON_SECRET` | Vercel Cron 認証（Vercel が自動付与） |

### 3. ローカル開発
```bash
npm install
cp .env.example .env.local   # 値を埋める
npm run dev                  # http://localhost:3000
```

### 4. Vercel デプロイ
1. この GitHub リポジトリを Vercel にインポート（push で自動デプロイ）
2. 上記の環境変数を Vercel に登録（`CRON_SECRET` も設定 → Cron 認証が有効化）
3. `vercel.json` の cron（`0 23 * * *` = JST 8:00）で `/api/digest` が毎朝発火

## 構成
- `app/page.tsx` … ギャラリー（サーバーコンポーネント、Notion 読み込み）
- `lib/notion.ts` … データソースのクエリと整形
- `middleware.ts` + `lib/auth.ts` + `app/login` … 共有パスワード認証（fail-closed）
- `app/api/digest/route.ts` … 毎朝の Slack ダイジェスト（Vercel Cron）

> Slack の「今朝の新着」は `取得日` が当日(JST)以降の **確認済み** を対象にしています。
> 0件の朝は通知しません。
