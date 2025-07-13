# 🚀 AI ConectX 本番環境移行ガイド

## 📝 必須設定項目

### 1. Supabaseプロジェクト設定
```bash
# Supabase CLI インストール
npm install -g @supabase/cli

# プロジェクト作成
supabase login
supabase init your-project-name
supabase start
```

**必要な環境変数:**
- `VITE_SUPABASE_URL`: https://your-project-id.supabase.co
- `VITE_SUPABASE_ANON_KEY`: 公開キー
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: サービスロールキー

### 2. データベーススキーマ設定
```sql
-- 必須テーブル作成
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  diagnosis_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE homepage_content_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_data JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE legal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Twilio SMS設定
```bash
# Twilioアカウント設定
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+815012345678
```

**認証番号の設定:**
1. [Twilio Console](https://console.twilio.com)にログイン
2. Phone Numbers → Manage → Verified Caller IDs
3. 使用する電話番号を認証

### 4. セキュリティキー生成
```bash
# 32文字のランダムキー生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**必要なキー:**
- `ENCRYPTION_KEY`: 暗号化用キー
- `JWT_SECRET`: JWT署名用キー 
- `SESSION_SECRET`: セッション管理用キー

### 5. SSL/TLS証明書設定
```bash
# Let's Encrypt証明書取得（推奨）
certbot --nginx -d your-domain.com

# または自己署名証明書作成（開発用）
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

## 🔒 セキュリティチェックリスト

### 必須セキュリティ設定
- [ ] HTTPS強制リダイレクト
- [ ] CORS適切な設定
- [ ] レート制限実装済み
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] CSRF対策
- [ ] セキュアヘッダー設定

### Supabase セキュリティ設定
```sql
-- Row Level Security (RLS) 有効化
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content_settings ENABLE ROW LEVEL SECURITY;

-- アクセス制限ポリシー
CREATE POLICY "管理者のみアクセス" ON homepage_content_settings
FOR ALL USING (auth.role() = 'service_role');
```

## 🚀 デプロイメント設定

### 1. Vercel デプロイ（推奨）
```bash
# Vercel CLI インストール
npm install -g vercel

# デプロイ
vercel --prod
```

### 2. 環境変数設定（Vercel）
Vercel Dashboard → Settings → Environment Variables:
```
VITE_SUPABASE_URL=本番用URL
VITE_SUPABASE_ANON_KEY=本番用キー
NODE_ENV=production
TWILIO_ACCOUNT_SID=本番用SID
TWILIO_AUTH_TOKEN=本番用トークン
```

### 3. カスタムドメイン設定
1. Vercel Dashboard → Domains
2. カスタムドメイン追加
3. DNS設定（A/CNAMEレコード）

## 📊 監視・分析設定

### 1. ログ監視
```javascript
// server/index.ts に追加
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. パフォーマンス監視
- Google Analytics 4設定
- Core Web Vitals監視
- アプリケーションエラー追跡

## ⚠️ 本番移行前チェック

### 必須確認項目
- [ ] 全ての環境変数が設定済み
- [ ] SSL証明書が有効
- [ ] データベース接続テスト完了
- [ ] SMS送信テスト完了
- [ ] セキュリティスキャン実行済み
- [ ] バックアップ体制構築済み
- [ ] 監視システム稼働中
- [ ] ドキュメント整備完了

### パフォーマンステスト
```bash
# 負荷テスト
npm install -g artillery
artillery quick --count 10 --num 5 https://your-domain.com

# セキュリティテスト
npm audit --audit-level high
```

## 🔧 トラブルシューティング

### よくある問題と解決法

1. **Supabase接続エラー**
   - プロジェクトID確認
   - APIキーの有効性確認
   - CORS設定確認

2. **SMS送信失敗**
   - Twilio残高確認
   - 電話番号認証状況確認
   - レート制限状況確認

3. **ビルドエラー**
   - Node.jsバージョン確認
   - 依存関係整合性確認
   - TypeScript設定確認

## 📞 サポート連絡先

本番環境移行でご不明な点がございましたら：
- 技術サポート: support@moneyticket.jp
- 緊急時連絡: emergency@moneyticket.jp
- ドキュメント: https://docs.moneyticket.jp 