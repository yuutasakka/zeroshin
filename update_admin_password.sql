-- AI ConectX 管理者パスワード更新

-- 管理者パスワードを新しいAI ConectXパスワードに更新
UPDATE admin_credentials 
SET 
    password_hash = '6c8c9e7655600aa742e48b781c877e614446ea015e2ab4a768ff72089e4ff357',
    failed_attempts = 0,
    locked_until = NULL,
    updated_at = NOW()
WHERE username = 'admin';

-- 確認
SELECT username, LEFT(password_hash, 10) as hash_preview, failed_attempts, is_active 
FROM admin_credentials 
WHERE username = 'admin';