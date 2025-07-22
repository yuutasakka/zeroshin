# Supabaseマイグレーション実行ガイド

## 400エラーの解決方法

現在、以下のテーブルが存在しないため400エラーが発生しています：
- `homepage_content_settings`
- `legal_links`
- `admin_settings`

## マイグレーションファイル

`supabase/migrations/033_create_missing_tables.sql` に必要なテーブル作成SQLが含まれています。

## 実行方法

### 方法1: Supabase Dashboard経由（推奨）

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 以下のSQLを実行：

```sql
-- homepage_content_settings テーブル作成
CREATE TABLE IF NOT EXISTS homepage_content_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_data JSONB,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- legal_links テーブル作成
CREATE TABLE IF NOT EXISTS legal_links (
    id SERIAL PRIMARY KEY,
    link_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- admin_settings テーブル作成
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_data JSONB,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLSポリシー設定
ALTER TABLE homepage_content_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー
CREATE POLICY "Enable read access for all users" ON homepage_content_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON legal_links
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON admin_settings
    FOR SELECT USING (true);

-- デフォルトデータ挿入
INSERT INTO legal_links (link_type, title, url, display_order) VALUES
    ('privacy_policy', 'プライバシーポリシー', '/privacy', 1),
    ('terms_of_service', '利用規約', '/terms', 2),
    ('specified_commercial_transactions', '特定商取引法', '/scta', 3),
    ('company_info', '会社概要', '/company', 4)
ON CONFLICT DO NOTHING;
```

### 方法2: Supabase CLI経由

```bash
# Supabase CLIがインストールされている場合
supabase db push
```

### 方法3: 直接API経由

```bash
# 環境変数を設定
export SUPABASE_URL="https://eqirzbuqgymrtnfmvwhq.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# マイグレーション実行
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d @supabase/migrations/033_create_missing_tables.sql
```

## 確認方法

マイグレーション実行後、以下のURLにアクセスして400エラーが解消されたか確認：
- https://moneyticket01-5ngsie7rr-seai0520s-projects.vercel.app

## トラブルシューティング

1. **権限エラーの場合**
   - Service Role Keyを使用していることを確認
   - プロジェクトの設定でRLSが有効になっていることを確認

2. **テーブルが作成されない場合**
   - Supabase Dashboardで直接SQLを実行
   - エラーメッセージを確認して修正

3. **400エラーが続く場合**
   - ブラウザのキャッシュをクリア
   - Vercelの再デプロイを実行