# Supabase認証情報の確認と設定ガイド

## Supabase認証情報の確認方法

### ステップ1: Supabaseダッシュボードにアクセス
1. [Supabase](https://supabase.com)にログイン
2. プロジェクト一覧から使用中のプロジェクトを選択

### ステップ2: API認証情報を確認
1. 左側のサイドバーから「Settings」（設定）をクリック
2. 「API」セクションを選択
3. 以下の情報をコピー：

#### Project URL (VITE_SUPABASE_URL)
- **場所**: 「Project URL」セクション
- **形式**: `https://xxxxxxxxxxxxx.supabase.co`
- **用途**: SupabaseのAPIエンドポイント

#### anon public key (VITE_SUPABASE_ANON_KEY)
- **場所**: 「Project API keys」セクション → 「anon public」
- **形式**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（長い文字列）
- **用途**: 公開用のAPIキー（フロントエンドで使用）

## Vercelへの設定方法

### ステップ1: Vercelダッシュボードにアクセス
1. [Vercel](https://vercel.com)にログイン
2. プロジェクト「moneyticket」を選択

### ステップ2: 環境変数を設定
1. 「Settings」タブをクリック
2. 左メニューから「Environment Variables」を選択
3. 以下の変数を追加：

```
変数名: VITE_SUPABASE_URL
値: https://xxxxxxxxxxxxx.supabase.co
環境: Production, Preview, Development

変数名: VITE_SUPABASE_ANON_KEY
値: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
環境: Production, Preview, Development
```

### ステップ3: デプロイメントを再実行
環境変数を追加した後、最新のデプロイメントを再実行する必要があります：
1. 「Deployments」タブに移動
2. 最新のデプロイメントの「...」メニューをクリック
3. 「Redeploy」を選択

## ローカル開発環境での設定

`.env.local`ファイルを作成または編集：

```bash
# .env.local
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## トラブルシューティング

### Supabase接続エラー
- エラー: `Supabase configuration is missing`
- 原因: 環境変数が正しく設定されていない
- 解決: 上記の手順で環境変数を確認・設定

### 認証エラー
- エラー: `Invalid API key`
- 原因: ANON_KEYが間違っている
- 解決: Supabaseダッシュボードから正しいキーをコピー

## セキュリティ注意事項

- `anon public`キーは公開されても安全ですが、`service_role`キーは絶対に公開しないでください
- 本番環境では必ずRow Level Security (RLS)を有効にしてください
- APIキーは定期的にローテーションすることを推奨します