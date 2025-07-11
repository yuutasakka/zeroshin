-- 最小限の管理者修正（トリガー問題回避）

-- Step 1: RLS無効化
ALTER TABLE IF EXISTS admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- Step 2: 管理者データのクリーンアップと再作成
DELETE FROM admin_credentials WHERE username = 'admin';

-- Step 3: 管理者を直接作成
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

-- Step 4: 確認
SELECT username, is_active FROM admin_credentials WHERE username = 'admin';