# 🔍 環境変数とTwilio認証情報の検証

## 📋 必要な環境変数チェックリスト

### 🔑 Supabase設定
- ✅ **VITE_SUPABASE_URL**: `https://eqirzbuqgymrtnfmvwhq.supabase.co`
- ⚠️ **VITE_SUPABASE_ANON_KEY**: Vercel環境変数で設定要
- ⚠️ **SUPABASE_SERVICE_ROLE_KEY**: Vercel環境変数で設定要

### 📱 Twilio SMS設定
- ⚠️ **TWILIO_ACCOUNT_SID**: Vercel環境変数で設定要
- ⚠️ **TWILIO_AUTH_TOKEN**: Vercel環境変数で設定要
- ⚠️ **TWILIO_PHONE_NUMBER**: Vercel環境変数で設定要

### 🔐 セキュリティ設定
- ⚠️ **ENCRYPTION_KEY**: Vercel環境変数で設定要
- ⚠️ **JWT_SECRET**: Vercel環境変数で設定要
- ⚠️ **SESSION_SECRET**: Vercel環境変数で設定要

### 🚀 本番環境フラグ
- ✅ **NODE_ENV**: `production`（Vercel自動設定）
- ⚠️ **VERCEL_ENV**: `production`（Vercel自動設定）
- ⚠️ **PRODUCTION_MODE**: `true`（Vercel環境変数で設定要）

## 🔧 Vercel環境変数設定手順

### 1. Vercelダッシュボードでの設定
1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクト「moneyticket01」を選択
3. Settings > Environment Variables

### 2. 必要な環境変数の設定

#### Supabase設定
```
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Twilio設定
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+815012345678
```

#### セキュリティ設定
```
ENCRYPTION_KEY=64文字のランダム文字列
JWT_SECRET=32文字以上のランダム文字列
SESSION_SECRET=32文字以上のランダム文字列
PRODUCTION_MODE=true
```

## 🚨 現在の問題点

### 1. SMS認証の開発バイパスが有効
- 原因: 環境判定ロジックが開発環境と判定
- 対策: 本番環境フラグの適切な設定

### 2. Twilio認証情報の不足
- 原因: 環境変数が設定されていない可能性
- 対策: Vercel環境変数で正しい値を設定

### 3. Supabase 401エラー
- 原因: RLSポリシーが匿名アクセスを拒否
- 対策: 匿名アクセス用RLSポリシーの適用

## ✅ 修正済み項目

### 1. ✅ CORS設定の更新
- 新しいデプロイURL追加完了
- `https://moneyticket01-18dyp3oo0-seai0520s-projects.vercel.app`

### 2. ✅ SMS認証の環境判定強化
- サーバーサイドでは常に本番環境として判定
- 開発バイパスコード削除

### 3. ✅ Supabase RLSポリシー修正
- 匿名アクセス用ポリシー作成
- 必要なテーブルへの権限付与

## 🎯 次のステップ

1. **Vercel環境変数の確認と設定**
2. **Supabase SQL Editor**で`027_fix_anonymous_access_policies.sql`を実行
3. **再デプロイ**して動作確認
4. **SMS認証テスト**の実施

## 🔍 トラブルシューティング

### SMS認証が動作しない場合
1. Vercel環境変数を確認
2. Twilio認証情報を確認
3. Supabase RLSポリシーを確認
4. ブラウザの開発者ツールでエラーを確認

### 401エラーが継続する場合
1. Supabase SQL Editorで匿名アクセスポリシーを確認
2. RLSが有効になっているかを確認
3. 匿名ユーザーの権限を確認

---

**重要**: 本番環境では必ず実際のTwilio認証情報を使用し、開発バイパスは完全に無効化してください。