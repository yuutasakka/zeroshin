-- 🚨 緊急対応: RLS無効化でサイトを即座に復旧
-- Supabase SQL Editorで以下のSQLを実行してください

-- 方法1: 既知のテーブルのRLS無効化
ALTER TABLE IF EXISTS legal_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homepage_content_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_planners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expert_contact_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diagnosis_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sms_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS secure_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_credentials DISABLE ROW LEVEL SECURITY;

-- 方法2: 動的にすべてのテーブルのRLS無効化
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

-- 確認: RLSが有効なテーブルをチェック
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

SELECT 'Emergency RLS disable completed - site should work now' as status;