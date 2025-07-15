-- 📋 admin_credentialsテーブル構造完全確認
-- この結果をコピーして教えてください

-- 1. 全カラム情報
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

-- 2. NOT NULL制約があるカラム
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 3. デフォルト値があるカラム
SELECT 
    column_name,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
AND table_schema = 'public'
AND column_default IS NOT NULL;

-- 4. 既存データのサンプル（構造理解用）
SELECT * FROM admin_credentials LIMIT 1;

SELECT '📋 上記の結果をコピーして Claude に教えてください' as instruction;