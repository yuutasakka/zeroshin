# Vercelプロジェクト移行ガイド

## 概要
プロジェクト名を `moneyticket01` から `moneyticket` に変更しました。

## 変更点

### 1. プロジェクトURL
- **旧**: `https://vercel.com/seai0520s-projects/moneyticket01`
- **新**: `https://vercel.com/seai0520s-projects/moneyticket`

### 2. デプロイメントURL
- **メイン**: `https://moneyticket.vercel.app`
- **プレビュー**: `https://moneyticket-git-main-seai0520s-projects.vercel.app`

### 3. 環境変数の確認事項

Vercelダッシュボードで以下の環境変数が正しく設定されていることを確認してください：

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
```

### 4. 確認手順

1. [Vercelダッシュボード](https://vercel.com/seai0520s-projects/moneyticket)にアクセス
2. Settings → Environment Variables を確認
3. 上記の環境変数がすべて設定されていることを確認
4. 設定されていない場合は、旧プロジェクトから値をコピー

### 5. トラブルシューティング

#### API呼び出しエラー
- エラー: `Unexpected token 'A', "A server e"... is not valid JSON`
- 原因: 環境変数が正しく設定されていない可能性
- 解決: 上記の環境変数を確認し、必要に応じて再設定

#### CORS エラー
- エラー: `CORS policy` 関連のエラー
- 原因: 新しいURLがCORS許可リストに含まれていない
- 解決: APIファイルのallowedOriginsに新しいURLを追加（すでに対応済み）

### 6. 更新履歴

- 2025-01-24: プロジェクト名を `moneyticket01` から `moneyticket` に変更
- 2025-01-24: API CORS設定を更新
- 2025-01-24: 動的インポートを使用してVercel互換性を向上