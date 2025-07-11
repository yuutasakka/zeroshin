-- 緊急管理者修正 - 最小限操作

-- まず全てのトリガーを強制削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;

-- 関数も強制削除
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- RLS完全無効化
ALTER TABLE admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts DISABLE ROW LEVEL SECURITY;

-- 管理者レコードを直接操作
TRUNCATE TABLE admin_credentials;

INSERT INTO admin_credentials (
    username, 
    password_hash, 
    phone_number, 
    backup_code, 
    is_active
) VALUES (
    'admin',
    '075306e20048c015ddbb91ab77abe11981bb6bd7d98e2cb9d0001eb7c29b7627',
    '+81-90-1234-5678',
    'BACKUP2024',
    true
);

-- 確認
SELECT * FROM admin_credentials;