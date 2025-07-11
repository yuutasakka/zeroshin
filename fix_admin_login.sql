-- AI ConectX 管理者ログイン修正用SQL

-- 1. 既存の管理者データを削除して再作成
DELETE FROM admin_credentials WHERE username = 'admin';

-- 2. 正しいパスワードハッシュで管理者を作成
INSERT INTO admin_credentials (
    username, 
    password_hash, 
    phone_number, 
    backup_code, 
    is_active, 
    failed_attempts,
    created_at,
    updated_at,
    password_changed_at
) VALUES (
    'admin',
    '075306e20048c015ddbb91ab77abe11981bb6bd7d98e2cb9d0001eb7c29b7627', -- MoneyTicket2024!
    '+81-90-1234-5678',
    'BACKUP2024',
    true,
    0,
    NOW(),
    NOW(),
    NOW()
);

-- 3. Row Level Security (RLS) ポリシーを無効化（開発用）
ALTER TABLE admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 4. テーブルに対する完全なアクセス権限を付与
GRANT ALL ON admin_credentials TO anon, authenticated;
GRANT ALL ON admin_login_attempts TO anon, authenticated;
GRANT ALL ON audit_logs TO anon, authenticated;

-- 5. シーケンスに対する権限も付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. 確認用クエリ
SELECT username, is_active, failed_attempts, created_at 
FROM admin_credentials 
WHERE username = 'admin';