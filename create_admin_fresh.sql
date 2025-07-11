-- AI ConectX 新規管理者作成 (最小限版)

-- 1. 既存管理者削除
DELETE FROM admin_credentials WHERE username = 'admin';

-- 2. 新規管理者作成
INSERT INTO admin_credentials (username, password_hash, phone_number, backup_code, is_active) 
VALUES ('admin', '075306e20048c015ddbb91ab77abe11981bb6bd7d98e2cb9d0001eb7c29b7627', '+81-90-1234-5678', 'BACKUP2024', true);

-- 3. 確認
SELECT * FROM admin_credentials WHERE username = 'admin';