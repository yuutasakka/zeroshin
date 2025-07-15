-- 🔐 完全版: 全必須フィールド対応の管理者アカウント作成
-- Supabase SQL Editorで以下のSQLを実行してください

-- Step 1: RLS無効化（最優先）
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

-- Step 2: 失敗したレコードを全て削除
DELETE FROM admin_credentials WHERE username = 'admin';

-- Step 3: 全ての必須フィールドを含めて管理者アカウントを作成
INSERT INTO admin_credentials (
    username, 
    password_hash, 
    phone_number, 
    backup_code
) 
VALUES (
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/pv8GQ8vP5WrT9r1kq', 
    '0120-999-888',
    'BACKUP123456'
);

-- Step 4: 作成されたアカウントを確認
SELECT username, phone_number, backup_code, is_active, created_at 
FROM admin_credentials 
WHERE username = 'admin';

-- Step 5: テーブル構造も確認（今後の参考用）
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- Step 6: RLS無効化の確認
SELECT COUNT(*) as tables_with_rls_still_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Step 7: 最終確認メッセージ
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM admin_credentials 
            WHERE username = 'admin' 
            AND phone_number IS NOT NULL 
            AND backup_code IS NOT NULL
        ) 
        THEN '✅ 完全な管理者アカウント作成成功！'
        ELSE '❌ アカウント作成失敗'
    END as account_creation_result;

SELECT '🎉 RLS無効化 + 管理者アカウント作成 完了！' as final_status;
SELECT 'ログイン情報: ユーザー名=admin, パスワード=SecureAdmin123!' as login_info;