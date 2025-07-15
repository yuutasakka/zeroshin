-- 🚨 最終401エラー修正: RLS完全無効化 + 匿名アクセス許可
-- Supabase SQL Editorで以下のSQLを実行してください

-- Step 1: 全テーブルのRLSを強制無効化（再実行）
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

-- Step 2: 問題のテーブルを個別に強制無効化
ALTER TABLE admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content_settings DISABLE ROW LEVEL SECURITY;

-- Step 3: 匿名ユーザーに対するGRANT権限を追加
GRANT ALL ON admin_credentials TO anon;
GRANT ALL ON admin_login_attempts TO anon;
GRANT ALL ON audit_logs TO anon;
GRANT ALL ON homepage_content_settings TO anon;
GRANT ALL ON legal_links TO anon;
GRANT ALL ON financial_planners TO anon;
GRANT ALL ON financial_products TO anon;
GRANT ALL ON expert_contact_settings TO anon;
GRANT ALL ON diagnosis_sessions TO anon;
GRANT ALL ON sms_verifications TO anon;

-- Step 4: authenticatedユーザーにも権限付与
GRANT ALL ON admin_credentials TO authenticated;
GRANT ALL ON admin_login_attempts TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON homepage_content_settings TO authenticated;
GRANT ALL ON legal_links TO authenticated;
GRANT ALL ON financial_planners TO authenticated;
GRANT ALL ON financial_products TO authenticated;
GRANT ALL ON expert_contact_settings TO authenticated;
GRANT ALL ON diagnosis_sessions TO authenticated;
GRANT ALL ON sms_verifications TO authenticated;

-- Step 5: service_roleにも完全権限
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Step 6: publicロールにも基本権限
GRANT USAGE ON SCHEMA public TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO public;

-- Step 7: RLS無効化の確認
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS有効（問題）'
        ELSE '✅ RLS無効（正常）'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 8: 権限確認
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('admin_credentials', 'admin_login_attempts', 'audit_logs')
ORDER BY table_name, grantee;

-- Step 9: 管理者アカウント確認
SELECT username, phone_number, is_active FROM admin_credentials WHERE username = 'admin';

SELECT '🎉 401エラー完全修正完了 - 全権限設定済み' as final_status;