# 🔒 Vercel認証無効化手順

## 📋 現在の問題

APIエンドポイントがVercel認証で保護されており、公開アクセスができない状態です。

### 🚨 現在の状況
- **API URL**: `https://moneyticket01-10gswrw2q-seai0520s-projects.vercel.app/api/send-otp`
- **エラー**: HTTP 401 - Vercel Authentication Required
- **影響**: SMS認証が完全に機能しない

## 🔧 Vercel認証無効化手順

### 1. Vercelダッシュボードにアクセス
1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. `moneyticket01` プロジェクトを選択
3. `Settings` タブをクリック

### 2. 認証設定を確認
1. サイドバーから `Security` セクションを選択
2. `Vercel Authentication` を見つける
3. 現在 **有効** になっている状態を確認

### 3. 認証を無効化
1. `Vercel Authentication` の設定を開く
2. **Disable** または **Turn Off** ボタンをクリック
3. 確認ダイアログで無効化を確認

### 4. デプロイメント設定の確認
1. `Deployments` タブに移動
2. 最新のデプロイメントを確認
3. 必要に応じて再デプロイを実行

## 📝 環境変数設定

### 必須環境変数の設定
`Settings` > `Environment Variables` で以下を設定:

#### 🔑 セキュリティ関連（既に生成済み）
```bash
ENCRYPTION_KEY=3dd204cc8c3c2ca0d0313b0d5670b198a604ee1ca45e83d1b323605e0397c294
JWT_SECRET=u1NPot78jZu4VOGhS6q3cfSWYHpSp4Cu335QNMNehdI=
SESSION_SECRET=xE9n09PLMz+fAso9blc3BJNlY6m8v/IW9GQnP378aUk=
CSRF_SECRET=xTuATN54gnh1/GptRqN/shvRtcjQ5tjaiVNhqEF4V8g=
PRODUCTION_MODE=true
```

#### 📱 Twilio SMS設定（要取得）
```bash
TWILIO_ACCOUNT_SID=AC[your-actual-account-sid]
TWILIO_AUTH_TOKEN=[your-actual-auth-token]
TWILIO_PHONE_NUMBER=[your-purchased-phone-number]
```

**取得方法**:
1. [Twilio Console](https://console.twilio.com/)にログイン
2. Account SIDとAuth Tokenを確認
3. Phone Numbers > Manage > Buy a numberで日本の番号を購入

#### 🗄️ Supabase設定（要取得）
```bash
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

**取得方法**:
1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. Settings > API でキーを確認

#### 🤖 Google Gemini API（要取得）
```bash
GEMINI_API_KEY=[your-gemini-api-key]
```

**取得方法**:
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Generative AI API を有効化
3. 認証情報でAPIキーを作成

## ✅ 確認手順

### 1. 認証無効化の確認
```bash
# 認証なしでAPIアクセス可能かテスト
curl -X POST https://moneyticket01-10gswrw2q-seai0520s-projects.vercel.app/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09012345678"}'
```

**期待する結果**: 401エラーではなく、設定エラーまたは正常なレスポンス

### 2. 環境変数設定の確認
```bash
# Vercel CLIで環境変数を確認
vercel env ls
```

### 3. デプロイメントの確認
```bash
# 最新デプロイメントを確認
vercel ls
```

## 🚨 緊急時の対処

もし認証を無効化できない場合:

1. **新しいVercelプロジェクトを作成**
2. **既存のGitHubリポジトリを再接続**
3. **環境変数を再設定**
4. **カスタムドメインを移行**

## 📞 次のステップ

1. **Vercel認証無効化** （最優先）
2. **環境変数設定**
3. **SMS認証テスト**
4. **データベースマイグレーション実行**

---

**注意**: 認証を無効化すると、APIエンドポイントが公開されます。これは正常な動作ですが、実装されているレート制限とセキュリティ機能が重要になります。