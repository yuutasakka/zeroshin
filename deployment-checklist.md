# 🚀 MoneyTicket 本番環境移行チェックリスト

## ✅ 現在の状況確認済み

### アプリケーション動作状況
- [x] **フロントエンドアプリケーション**: 正常動作 (http://localhost:5175)
- [x] **SMSサーバー**: 正常動作 (http://localhost:8080)
- [x] **TypeScriptコンパイル**: エラーなし
- [x] **本番ビルド**: 成功 (516KB gzip: 146KB)
- [x] **NPMセキュリティ監査**: 脆弱性なし
- [x] **SMS送信機能**: 開発環境モードで正常動作
- [x] **SMS認証機能**: JWTトークン生成成功
- [x] **レート制限**: 実装済み・動作確認済み

### セキュリティ機能確認済み
- [x] **セキュアヘッダー**: Helmet設定済み
- [x] **CORS制限**: 適切に設定済み
- [x] **入力検証**: express-validator実装済み
- [x] **暗号化**: crypto使用、セキュアなコード生成
- [x] **JWT認証**: 実装済み・動作確認済み
- [x] **ログ記録**: Winston使用、セキュアなログ管理

## 📋 本番移行前必須作業

### 1. Supabaseプロジェクト設定
```bash
# CLI インストール・ログイン
npm install -g @supabase/cli
supabase login

# 新規プロジェクト作成
supabase projects create your-moneyticket-project
```

**必要なテーブル作成:**
```sql
-- ユーザーセッション管理
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  diagnosis_data JSONB,
  verification_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 管理コンテンツ設定
CREATE TABLE homepage_content_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 法的リンク管理
CREATE TABLE legal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- セキュア設定管理
CREATE TABLE secure_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS (Row Level Security) 有効化
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_config ENABLE ROW LEVEL SECURITY;

-- 管理者権限ポリシー
CREATE POLICY "管理者のみアクセス" ON homepage_content_settings
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "管理者のみアクセス" ON legal_links
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "セキュア設定は管理者のみ" ON secure_config
FOR ALL USING (auth.role() = 'service_role');
```

### 2. 環境変数設定
**本番環境必須変数:**
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# セキュリティキー（32文字以上の強力なランダム文字列）
ENCRYPTION_KEY=your_32_character_encryption_key_here
JWT_SECRET=your_32_character_jwt_secret_here
SESSION_SECRET=your_32_character_session_secret_here

# Twilio (本番用)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+815012345678

# 環境
NODE_ENV=production
```

**セキュリティキー生成コマンド:**
```bash
# 各キーを個別に生成
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Twilio本番設定
1. [Twilio Console](https://console.twilio.com) でアカウント升級
2. 電話番号を購入または認証
3. 日本国内SMS送信の有効化
4. 送信レート制限の確認・調整

### 4. SSL/HTTPS設定
**Vercelの場合:**
- 自動でLet's Encrypt証明書が適用されます

**カスタムサーバーの場合:**
```bash
# Let's Encrypt証明書取得
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5. ドメイン・DNS設定
1. カスタムドメインの設定
2. DNS レコードの設定:
   - A レコード: your-domain.com → サーバーIP
   - CNAME レコード: www.your-domain.com → your-domain.com
3. CORS設定でドメインを許可

## 🔒 本番環境セキュリティチェック

### 必須セキュリティ設定
- [ ] **HTTPS強制**: 全てのHTTPリクエストをHTTPSにリダイレクト
- [ ] **セキュリティヘッダー**: CSP, HSTS, X-Frame-Options等設定済み
- [ ] **環境変数**: 全てのシークレットが適切に設定済み
- [ ] **データベースアクセス**: RLS有効、適切な権限設定
- [ ] **API制限**: レート制限・入力検証・CORS設定済み
- [ ] **ログ監視**: エラー・セキュリティイベントのログ記録
- [ ] **バックアップ**: データベースの定期バックアップ設定

### セキュリティテスト項目
```bash
# 脆弱性スキャン
npm audit --audit-level moderate

# HTTPS チェック
curl -I https://your-domain.com

# セキュリティヘッダー確認
curl -I https://your-domain.com | grep -i security

# API制限テスト
for i in {1..10}; do curl -X POST https://your-domain.com/api/sms/send -H "Content-Type: application/json" -d '{"phoneNumber": "test"}'; done
```

## 🚀 デプロイメント手順

### Vercel デプロイ（推奨）
```bash
# Vercel CLI インストール
npm install -g vercel

# 初回デプロイ
vercel

# 本番デプロイ
vercel --prod
```

### 環境変数設定（Vercel Dashboard）
1. プロジェクト → Settings → Environment Variables
2. 上記の本番環境変数を全て設定
3. Production環境を選択して適用

### カスタムドメイン設定
1. Vercel Dashboard → Domains
2. Add Domain → your-domain.com
3. DNS設定の指示に従って設定

## 📊 本番環境監視設定

### 1. アプリケーション監視
- **Uptime monitoring**: StatusCake, Pingdom等
- **Error tracking**: Sentry, Bugsnag等  
- **Performance monitoring**: Google Analytics, New Relic等

### 2. ログ管理
```javascript
// Winston本番設定例
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // 本番では外部ログサービスに送信
    new winston.transports.Http({
      host: 'your-log-service.com',
      port: 443,
      path: '/api/logs'
    })
  ]
});
```

## ⚠️ 本番移行前最終確認

### 機能テスト
- [ ] 全ページの表示確認
- [ ] 診断フォームの動作確認
- [ ] SMS送信・認証の動作確認
- [ ] 管理画面の全機能確認
- [ ] レスポンシブデザインの確認

### パフォーマンステスト
- [ ] Lighthouse スコア 90点以上
- [ ] ページ読み込み時間 3秒以内
- [ ] API レスポンス時間 1秒以内

### セキュリティ最終確認
- [ ] 全ての環境変数が本番用に設定済み
- [ ] デフォルトパスワード・キーの変更完了
- [ ] SQLインジェクション対策確認
- [ ] XSS対策確認
- [ ] CSRF対策確認

## 📞 本番移行サポート

本番環境移行でご不明な点がございましたら：

**技術サポート連絡先:**
- Email: support@moneyticket.jp
- 緊急時: emergency@moneyticket.jp
- ドキュメント: https://docs.moneyticket.jp

**移行作業時間の推奨:**
- 総所要時間: 3-4時間
- Supabase設定: 30分
- 環境変数設定: 30分
- デプロイ設定: 30分
- テスト・確認: 2-3時間

## 🎯 移行完了後の確認項目

### 即座に確認
- [ ] サイトへのHTTPSアクセス
- [ ] 全機能の動作確認
- [ ] SMS送信の実機テスト
- [ ] 管理画面ログイン
- [ ] エラーログの確認

### 24時間以内に確認
- [ ] Google Analytics動作確認
- [ ] 検索エンジンでの認識確認
- [ ] 外部サービス連携確認
- [ ] バックアップ動作確認

**🚀 本番環境移行準備完了！** 