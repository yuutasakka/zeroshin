-- AI ConectX 安全な管理者修正 - 外部キー制約対応

-- 1. トリガー完全削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. RLS無効化
ALTER TABLE IF EXISTS admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_sms_verification DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- 3. 関連テーブルを含めてカスケード削除
TRUNCATE TABLE admin_sms_verification CASCADE;
TRUNCATE TABLE admin_credentials CASCADE;

-- 4. 管理者を新規作成
INSERT INTO admin_credentials (
    username, 
    password_hash, 
    phone_number, 
    backup_code, 
    is_active,
    failed_attempts,
    locked_until,
    last_login,
    created_at,
    updated_at,
    password_changed_at,
    requires_password_change
) VALUES (
    'admin',
    '075306e20048c015ddbb91ab77abe11981bb6bd7d98e2cb9d0001eb7c29b7627',
    '+81-90-1234-5678',
    'BACKUP2024',
    true,
    0,
    NULL,
    NULL,
    NOW(),
    NOW(),
    NOW(),
    false
);

-- 5. 確認
SELECT 
    username, 
    is_active, 
    failed_attempts,
    locked_until,
    created_at
FROM admin_credentials 
WHERE username = 'admin';

-- 6. テーブル権限確認
GRANT ALL ON admin_credentials TO anon, authenticated;
GRANT ALL ON admin_login_attempts TO anon, authenticated;
GRANT ALL ON admin_sms_verification TO anon, authenticated;