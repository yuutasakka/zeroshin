-- 🔧 データベースカラム名統一スクリプト
-- 実行場所: Supabase SQL Editor (https://app.supabase.com/project/eqirzbuqgymrtnfmvwhq/sql)

-- Step 1: 現在の状況を確認
SELECT 
    '==== 現在のカラム構造 ====' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
AND column_name IN ('is_active', 'active')
ORDER BY table_name, column_name;

-- Step 2: カラム名統一処理
DO $$
DECLARE
    table_record RECORD;
    has_active BOOLEAN;
    has_is_active BOOLEAN;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔧 カラム名統一処理開始';
    
    -- 各テーブルを処理
    FOR table_record IN 
        SELECT unnest(ARRAY['homepage_content_settings', 'legal_links', 'financial_products', 
                           'financial_planners', 'expert_contact_settings', 'admin_settings']) as table_name
    LOOP
        -- テーブルの存在確認
        SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = table_record.table_name
            AND schemaname = 'public'
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            RAISE NOTICE '⚠️  テーブル % が存在しません。スキップします。', table_record.table_name;
            CONTINUE;
        END IF;
        
        -- active カラムの存在確認
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'active'
            AND table_schema = 'public'
        ) INTO has_active;
        
        -- is_active カラムの存在確認
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'is_active'
            AND table_schema = 'public'
        ) INTO has_is_active;
        
        -- 状況に応じた処理
        IF has_active AND has_is_active THEN
            -- 両方存在: active を削除
            BEGIN
                EXECUTE format('ALTER TABLE %I DROP COLUMN active', table_record.table_name);
                RAISE NOTICE '✅ テーブル % の active カラムを削除（is_active が既に存在）', table_record.table_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '❌ テーブル % の active カラム削除に失敗: %', table_record.table_name, SQLERRM;
            END;
            
        ELSIF has_active AND NOT has_is_active THEN
            -- active のみ存在: is_active にリネーム
            BEGIN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN active TO is_active', table_record.table_name);
                RAISE NOTICE '✅ テーブル % の active カラムを is_active にリネーム', table_record.table_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '❌ テーブル % の active カラムリネームに失敗: %', table_record.table_name, SQLERRM;
            END;
            
        ELSIF NOT has_active AND NOT has_is_active THEN
            -- 両方存在しない: is_active を作成
            BEGIN
                EXECUTE format('ALTER TABLE %I ADD COLUMN is_active BOOLEAN DEFAULT true', table_record.table_name);
                RAISE NOTICE '✅ テーブル % に is_active カラムを追加', table_record.table_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '❌ テーブル % の is_active カラム追加に失敗: %', table_record.table_name, SQLERRM;
            END;
            
        ELSE
            -- is_active のみ存在 (理想的な状態)
            RAISE NOTICE '✅ テーブル % は既に正しい is_active カラムを持っています', table_record.table_name;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE '🎉 カラム名統一処理完了';
END $$;

-- Step 3: 修正結果確認
SELECT 
    '==== 修正後のカラム構造 ====' as info,
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

-- Step 4: RLS ポリシー再適用
DO $$
DECLARE
    table_record RECORD;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔐 RLS ポリシー再適用開始';
    
    FOR table_record IN 
        SELECT unnest(ARRAY['homepage_content_settings', 'legal_links', 'financial_products', 
                           'financial_planners', 'expert_contact_settings']) as table_name
    LOOP
        -- テーブルの存在確認
        SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = table_record.table_name
            AND schemaname = 'public'
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            RAISE NOTICE '⚠️  テーブル % が存在しません。ポリシー作成をスキップします。', table_record.table_name;
            CONTINUE;
        END IF;
        
        BEGIN
            -- 既存のポリシーを削除
            EXECUTE format('DROP POLICY IF EXISTS "public_read_active_%s" ON %I', 
                          CASE table_record.table_name
                            WHEN 'homepage_content_settings' THEN 'content'
                            WHEN 'legal_links' THEN 'legal'
                            WHEN 'financial_products' THEN 'products'
                            WHEN 'financial_planners' THEN 'planners'
                            WHEN 'expert_contact_settings' THEN 'contact'
                            ELSE 'items'
                          END, table_record.table_name);
            
            -- 新しいポリシーを作成
            EXECUTE format('CREATE POLICY "public_read_active_%s" ON %I FOR SELECT TO anon, authenticated USING (is_active = true)', 
                          CASE table_record.table_name
                            WHEN 'homepage_content_settings' THEN 'content'
                            WHEN 'legal_links' THEN 'legal'
                            WHEN 'financial_products' THEN 'products'
                            WHEN 'financial_planners' THEN 'planners'
                            WHEN 'expert_contact_settings' THEN 'contact'
                            ELSE 'items'
                          END, table_record.table_name);
            
            -- Service role 用ポリシー
            EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON %I', 
                          CASE table_record.table_name
                            WHEN 'homepage_content_settings' THEN 'content'
                            WHEN 'legal_links' THEN 'legal'
                            WHEN 'financial_products' THEN 'products'
                            WHEN 'financial_planners' THEN 'planners'
                            WHEN 'expert_contact_settings' THEN 'contact'
                            ELSE 'items'
                          END, table_record.table_name);
            
            EXECUTE format('CREATE POLICY "service_role_all_%s" ON %I FOR ALL TO service_role USING (true)', 
                          CASE table_record.table_name
                            WHEN 'homepage_content_settings' THEN 'content'
                            WHEN 'legal_links' THEN 'legal'
                            WHEN 'financial_products' THEN 'products'
                            WHEN 'financial_planners' THEN 'planners'
                            WHEN 'expert_contact_settings' THEN 'contact'
                            ELSE 'items'
                          END, table_record.table_name);
            
            RAISE NOTICE '✅ テーブル % のRLSポリシーを再適用', table_record.table_name;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ テーブル % のRLSポリシー再適用に失敗: %', table_record.table_name, SQLERRM;
        END;
        
    END LOOP;
    
    RAISE NOTICE '🎉 RLS ポリシー再適用完了';
END $$;

-- Step 5: 最終確認
SELECT 
    '==== 最終確認: RLS状態 ====' as info,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS有効'
        ELSE '❌ RLS無効'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
ORDER BY tablename;

-- Step 6: ポリシー確認
SELECT 
    '==== 最終確認: ポリシー一覧 ====' as info,
    tablename, 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
ORDER BY tablename, policyname;

-- 完了メッセージ
SELECT '🎉 データベースカラム名統一とRLS修正が完了しました' as final_message;