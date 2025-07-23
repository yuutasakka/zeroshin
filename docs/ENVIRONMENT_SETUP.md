# AI ConnectX 環境変数設定ガイド

## 🚨 重要: Supabase 400/404エラーの解決

現在発生している Supabase エラーを解決するため、以下の環境変数を設定してください。

## 必要な環境変数

### 1. `.env` ファイルを作成
プロジェクトルートに `.env` ファイルを作成し、以下の内容を設定してください：

```bash
# Supabase設定（本番環境）
VITE_SUPABASE_URL=https://eqirzbuqgymrtnfmvwhq.supabase.co
VITE_SUPABASE_ANON_KEY=【Supabaseの匿名キーを設定】

# アプリケーション設定
VITE_APP_NAME=AI ConnectX
VITE_APP_URL=https://moneyticket-chi.vercel.app

# セキュリティ設定
VITE_ENCRYPTION_KEY=【32文字の暗号化キーを設定】
VITE_JWT_SECRET=【JWTシークレットキーを設定】

# SMS設定（Twilio）
VITE_TWILIO_ACCOUNT_SID=【TwilioアカウントSIDを設定】
VITE_TWILIO_AUTH_TOKEN=【Twilio認証トークンを設定】
VITE_TWILIO_PHONE_NUMBER=【Twilio電話番号を設定】

# メール設定（SendGrid）
VITE_SENDGRID_API_KEY=【SendGrid APIキーを設定】
VITE_SENDGRID_FROM_EMAIL=noreply@moneyticket.co.jp

# 通知設定
VITE_SLACK_WEBHOOK_URL=【Slack Webhook URLを設定】

# 開発環境設定
NODE_ENV=production
VITE_DEBUG=false
```

### 2. Vercel環境変数設定
Vercelダッシュボードで以下の環境変数を設定してください：

1. Vercelプロジェクトにアクセス
2. Settings → Environment Variables
3. 上記の環境変数をすべて追加

## 🛠️ Supabaseマイグレーション実行

新しく作成したマイグレーションを実行する必要があります：

```bash
# マイグレーション実行（ローカル）
supabase db push

# または Supabase ダッシュボードで SQL エディタを使用して
# supabase/migrations/009_create_homepage_content_settings.sql の内容を実行
```

## 🔍 現在のエラー状況

### 解決予定のエラー：
- ✅ `homepage_content_settings` テーブル404エラー → マイグレーション009で解決
- ⚠️ `admin_credentials`, `admin_settings` テーブル400エラー → 環境変数設定で解決
- ⚠️ `diagnosis_sessions` テーブル404エラー → マイグレーション確認が必要

## 📋 次の作業手順

1. **環境変数設定** → `.env` ファイル作成 + Vercel設定
2. **マイグレーション実行** → 009番マイグレーション適用
3. **動作確認** → サイトの動作とエラー状況確認
4. **追加修正** → 残るエラーがあれば個別対応

## 🔐 セキュリティ注意事項

- `.env` ファイルは **絶対に Git にコミットしない**
- 本番環境では強力なパスワード・キーを使用
- 定期的にキーの更新を実施 