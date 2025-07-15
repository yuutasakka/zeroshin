-- 🚨 最終修正版: RLS無効化 + 管理者アカウント設定
-- Supabase SQL Editorで以下のSQLを実行してください

-- Step 1: 全テーブルのRLS無効化
ALTER TABLE IF EXISTS admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registration_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homepage_content_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS legal_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_planners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expert_contact_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diagnosis_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sms_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS secure_config DISABLE ROW LEVEL SECURITY;

-- Step 2: 動的RLS無効化
DO $$
DECLARE
    table_record RECORD;
BEGIN
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

-- Step 3: admin_credentialsテーブルの実際の構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: 既存データを確認
SELECT * FROM admin_credentials LIMIT 5;

-- Step 5: 既存の管理者アカウントを削除（クリーンアップ）
DELETE FROM admin_credentials WHERE username = 'admin';

-- Step 6: 最小限のフィールドで管理者アカウントを作成
INSERT INTO admin_credentials (username, password_hash, is_active)
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/pv8GQ8vP5WrT9r1kq', true);

-- Step 7: 作成された管理者アカウントを確認
SELECT * FROM admin_credentials WHERE username = 'admin';

-- Step 8: RLS無効化の確認
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

SELECT '✅ RLS無効化完了 + 管理者アカウント作成完了' as result;