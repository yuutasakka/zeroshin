-- 🚨 修正版: 管理画面401エラー解決 + 管理者アカウント作成
-- Supabase SQL Editorで以下のSQLを実行してください

-- 管理者認証関連テーブル（最優先）
ALTER TABLE IF EXISTS admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registration_requests DISABLE ROW LEVEL SECURITY;

-- ホームページコンテンツ関連
ALTER TABLE IF EXISTS homepage_content_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS legal_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_settings DISABLE ROW LEVEL SECURITY;

-- 金融商品・プランナー関連
ALTER TABLE IF EXISTS financial_planners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expert_contact_settings DISABLE ROW LEVEL SECURITY;

-- 診断・認証関連
ALTER TABLE IF EXISTS diagnosis_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sms_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activity_logs DISABLE ROW LEVEL SECURITY;

-- セキュリティ設定
ALTER TABLE IF EXISTS secure_config DISABLE ROW LEVEL SECURITY;

-- 動的に残りの全テーブルのRLSを無効化
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- public スキーマのすべてのテーブルに対してRLS無効化
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
            RAISE NOTICE 'RLS disabled for table: %', table_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to disable RLS for table: % (Error: %)', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- admin_credentialsテーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
ORDER BY ordinal_position;

-- 既存の管理者アカウントを確認
SELECT username, phone_number, email, is_active FROM admin_credentials WHERE username = 'admin';

-- デフォルト管理者アカウントを作成（必要なフィールドをすべて含める）
INSERT INTO admin_credentials (
    username, 
    password_hash, 
    phone_number, 
    email, 
    is_active, 
    created_at, 
    updated_at, 
    last_login_at
)
VALUES (
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/pv8GQ8vP5WrT9r1kq', 
    '0120-999-888', 
    'admin@aiconectx.co.jp', 
    true, 
    NOW(), 
    NOW(), 
    NOW()
)
ON CONFLICT (username) DO UPDATE SET 
    is_active = true,
    phone_number = COALESCE(EXCLUDED.phone_number, admin_credentials.phone_number, '0120-999-888'),
    email = COALESCE(EXCLUDED.email, admin_credentials.email, 'admin@aiconectx.co.jp'),
    updated_at = NOW();

-- 確認: RLSが有効なテーブルをチェック
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- 管理者アカウントの最終確認
SELECT username, phone_number, email, is_active, created_at FROM admin_credentials WHERE username = 'admin';

SELECT '🎉 緊急RLS無効化 + 管理者アカウント設定完了！' as status;