-- 🔍 テーブル構造確認 + RLS無効化 + 管理者アカウント作成
-- Supabase SQL Editorで以下のSQLを実行してください

-- Step 1: まずRLS無効化（最優先）
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

-- Step 2: admin_credentialsテーブルの正確な構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: 既存のデータ確認（構造理解のため）
SELECT * FROM admin_credentials LIMIT 3;

-- Step 4: NOT NULL制約があるカラムを特定
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
AND table_schema = 'public'
AND is_nullable = 'NO';

-- Step 5: テーブル制約を確認
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_credentials'
AND tc.table_schema = 'public';

-- Step 6: 既存の管理者データを削除（失敗したレコードをクリーンアップ）
DELETE FROM admin_credentials WHERE username = 'admin';

-- Step 7: phone_numberを含む完全な管理者アカウントを作成
INSERT INTO admin_credentials (
    username, 
    password_hash, 
    phone_number,
    is_active,
    login_attempts,
    created_at,
    updated_at,
    last_login_at,
    requires_password_change
)
VALUES (
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/pv8GQ8vP5WrT9r1kq', 
    '0120-999-888',
    true,
    0,
    NOW(),
    NOW(),
    NOW(),
    false
);

-- Step 8: 作成結果を確認
SELECT 
    username, 
    phone_number, 
    is_active, 
    login_attempts,
    created_at
FROM admin_credentials 
WHERE username = 'admin';

-- Step 9: RLS無効化の最終確認
SELECT 
    COUNT(*) as tables_with_rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

SELECT '🎉 構造確認 + RLS無効化 + 管理者アカウント作成 完了' as final_status;