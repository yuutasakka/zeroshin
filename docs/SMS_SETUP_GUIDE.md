# SMS認証設定ガイド

## 🔧 現在の状況

### ✅ 開発環境
- **認証コード**: `123456` (固定)
- **動作**: 電話番号入力 → 認証コード入力画面 → `123456`入力で認証完了
- **表示**: 開発環境用の黄色いヒントボックスが表示

### ⚙️ 本番環境設定（Supabase SMS）

#### 1. Supabase プロジェクト設定
```bash
# Supabase ダッシュボードにアクセス
https://supabase.com/dashboard

# プロジェクト選択 → Authentication → Settings → Phone Auth
```

#### 2. 必要な環境変数
```bash
# Vercelで設定が必要
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase内でSMS Provider設定
# Twilio または他のプロバイダー設定
```

#### 3. Twilio設定（推奨）
```bash
# Supabase Dashboard → Authentication → Settings → Phone Auth
# Provider: Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## 🧪 テスト手順

### 開発環境テスト
1. ローカルで `npm run dev` 実行
2. 診断フローを進める
3. 電話番号入力（例: 090-1234-5678）
4. "SMS送信" ボタンクリック
5. 黄色いヒントボックスで `123456` を確認
6. 認証コード `123456` を入力
7. 認証成功 → 結果画面

### 本番環境テスト
1. Supabase SMS設定完了後
2. 実際の電話番号で診断実行
3. 実際のSMSが送信される
4. 受信したコードを入力
5. 認証成功 → 結果画面

## 🔐 セキュリティ機能

- **失敗回数制限**: 5回失敗でロックアウト
- **電話番号重複チェック**: 1人1回限りの診断
- **カウントダウンタイマー**: SMS再送信制限
- **入力バリデーション**: 日本の電話番号形式チェック

## 🚀 次のステップ

1. Supabase SMS設定完了
2. 本番環境での実機テスト
3. 必要に応じてTwilio以外のプロバイダー検討