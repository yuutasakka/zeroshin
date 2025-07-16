-- 🔧 緊急修正: カラム名競合解決スクリプト
-- 実行方法: psql -h eqirzbuqgymrtnfmvwhq.supabase.co -U postgres -d postgres -f fix_column_names.sql

-- Step 1: 現在のカラム構造を確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
AND column_name IN ('is_active', 'active')
ORDER BY table_name, column_name;

-- Step 2: カラム名を統一（is_activeに統一）
DO $$
DECLARE
    table_record RECORD;
    column_exists BOOLEAN;
BEGIN
    -- 各テーブルをチェックしてカラム名を統一
    FOR table_record IN 
        SELECT unnest(ARRAY['homepage_content_settings', 'legal_links', 'financial_products', 
                           'financial_planners', 'expert_contact_settings', 'admin_settings']) as table_name
    LOOP
        -- activeカラムが存在するかチェック
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'active'
            AND table_schema = 'public'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- activeカラムをis_activeにリネーム
            BEGIN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN active TO is_active', table_record.table_name);
                RAISE NOTICE 'Renamed column active to is_active in table: %', table_record.table_name;
            EXCEPTION
                WHEN duplicate_column THEN
                    -- 両方のカラムが存在する場合、activeを削除
                    EXECUTE format('ALTER TABLE %I DROP COLUMN active', table_record.table_name);
                    RAISE NOTICE 'Dropped duplicate active column in table: %', table_record.table_name;
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to rename column in table: % (Error: %)', table_record.table_name, SQLERRM;
            END;
        END IF;
        
        -- is_activeカラムが存在しない場合は作成
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'is_active'
            AND table_schema = 'public'
        ) INTO column_exists;
        
        IF NOT column_exists AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = table_record.table_name) THEN
            BEGIN
                EXECUTE format('ALTER TABLE %I ADD COLUMN is_active BOOLEAN DEFAULT true', table_record.table_name);
                RAISE NOTICE 'Added is_active column to table: %', table_record.table_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to add is_active column to table: % (Error: %)', table_record.table_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Step 3: 修正後の確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
AND column_name = 'is_active'
ORDER BY table_name;

SELECT '🔧 カラム名修正完了' as status;