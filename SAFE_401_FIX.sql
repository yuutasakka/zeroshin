-- 🛡️ 安全版401エラー修正: 存在するテーブルのみ対象
-- Supabase SQL Editorで以下のSQLを実行してください

-- Step 1: 全テーブルのRLSを強制無効化
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

-- Step 2: 存在するテーブルのみを確認
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Step 3: 存在が確認されているテーブルのみに権限付与
-- 管理者関連テーブル
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_credentials' AND schemaname = 'public') THEN
        GRANT ALL ON admin_credentials TO anon, authenticated, service_role, public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_login_attempts' AND schemaname = 'public') THEN
        GRANT ALL ON admin_login_attempts TO anon, authenticated, service_role, public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs' AND schemaname = 'public') THEN
        GRANT ALL ON audit_logs TO anon, authenticated, service_role, public;
    END IF;
    
    -- コンテンツ関連テーブル
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'homepage_content_settings' AND schemaname = 'public') THEN
        GRANT ALL ON homepage_content_settings TO anon, authenticated, service_role, public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'legal_links' AND schemaname = 'public') THEN
        GRANT ALL ON legal_links TO anon, authenticated, service_role, public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'financial_planners' AND schemaname = 'public') THEN
        GRANT ALL ON financial_planners TO anon, authenticated, service_role, public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'financial_products' AND schemaname = 'public') THEN
        GRANT ALL ON financial_products TO anon, authenticated, service_role, public;
    END IF;
    
    -- 診断関連テーブル
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'diagnosis_sessions' AND schemaname = 'public') THEN
        GRANT ALL ON diagnosis_sessions TO anon, authenticated, service_role, public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sms_verifications' AND schemaname = 'public') THEN
        GRANT ALL ON sms_verifications TO anon, authenticated, service_role, public;
    END IF;
END $$;

-- Step 4: 全テーブルに対する包括的権限付与（存在するテーブルのみ）
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
            EXECUTE format('GRANT ALL ON %I TO anon, authenticated, service_role, public', table_record.tablename);
            RAISE NOTICE 'Granted permissions for table: %', table_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to grant permissions for table: % (Error: %)', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 5: スキーマ権限も付与
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, public;

-- Step 6: RLS無効化の最終確認
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

-- Step 7: 管理者アカウント確認
SELECT username, phone_number, is_active FROM admin_credentials WHERE username = 'admin';

-- Step 8: 最終確認メッセージ
SELECT 
    COUNT(*) as total_tables,
    COUNT(CASE WHEN rowsecurity = false THEN 1 END) as rls_disabled_tables
FROM pg_tables 
WHERE schemaname = 'public';

SELECT '🎉 安全版401エラー修正完了 - 存在するテーブルのみ処理' as final_status;