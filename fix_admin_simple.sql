-- AI ConectX 管理者ログイン修正 (構文エラー修正版)

-- 1. RLSポリシーを無効化
ALTER TABLE admin_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. テーブル権限を付与
GRANT ALL ON admin_credentials TO anon;
GRANT ALL ON admin_credentials TO authenticated;
GRANT ALL ON admin_login_attempts TO anon;
GRANT ALL ON admin_login_attempts TO authenticated;
GRANT ALL ON audit_logs TO anon;
GRANT ALL ON audit_logs TO authenticated;

-- 3. 既存管理者のパスワードリセット
UPDATE admin_credentials 
SET password_hash = '075306e20048c015ddbb91ab77abe11981bb6bd7d98e2cb9d0001eb7c29b7627'
WHERE username = 'admin';

-- 4. 失敗回数をリセット
UPDATE admin_credentials 
SET failed_attempts = 0 
WHERE username = 'admin';

-- 5. ロック状態を解除
UPDATE admin_credentials 
SET locked_until = NULL 
WHERE username = 'admin';

-- 6. 確認クエリ
SELECT username, is_active, failed_attempts FROM admin_credentials WHERE username = 'admin';