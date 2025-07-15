# 🔧 緊急修正: カラム名統一手順

## 🚨 問題の内容
`ERROR: 42703: column "is_active" does not exist`エラーが発生しています。
これは、一部のテーブルが`active`カラムを持ち、他のテーブルが`is_active`カラムを持つためです。

## 📋 修正手順

### 1. Supabase SQL Editorでの実行
以下のSQLを[Supabase SQL Editor](https://app.supabase.com/project/eqirzbuqgymrtnfmvwhq/sql)で実行してください：

```sql
-- 📊 現在のカラム構造確認
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
```

### 2. カラム名統一スクリプト
```sql
-- 🔧 カラム名を is_active に統一
DO $$
DECLARE
    table_record RECORD;
    column_exists BOOLEAN;
    has_active BOOLEAN;
    has_is_active BOOLEAN;
BEGIN
    -- 各テーブルをチェック
    FOR table_record IN 
        SELECT unnest(ARRAY['homepage_content_settings', 'legal_links', 'financial_products', 
                           'financial_planners', 'expert_contact_settings', 'admin_settings']) as table_name
    LOOP
        -- テーブルが存在するかチェック
        SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = table_record.table_name
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE NOTICE 'テーブル % が存在しません。スキップします。', table_record.table_name;
            CONTINUE;
        END IF;
        
        -- active カラムの存在チェック
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'active'
            AND table_schema = 'public'
        ) INTO has_active;
        
        -- is_active カラムの存在チェック
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
            AND column_name = 'is_active'
            AND table_schema = 'public'
        ) INTO has_is_active;
        
        -- 状況に応じた処理
        IF has_active AND has_is_active THEN
            -- 両方存在する場合、active を削除
            EXECUTE format('ALTER TABLE %I DROP COLUMN active', table_record.table_name);
            RAISE NOTICE '✅ テーブル % の active カラムを削除しました（is_active が既に存在）', table_record.table_name;
            
        ELSIF has_active AND NOT has_is_active THEN
            -- active のみ存在する場合、is_active にリネーム
            EXECUTE format('ALTER TABLE %I RENAME COLUMN active TO is_active', table_record.table_name);
            RAISE NOTICE '✅ テーブル % の active カラムを is_active にリネームしました', table_record.table_name;
            
        ELSIF NOT has_active AND NOT has_is_active THEN
            -- 両方存在しない場合、is_active を作成
            EXECUTE format('ALTER TABLE %I ADD COLUMN is_active BOOLEAN DEFAULT true', table_record.table_name);
            RAISE NOTICE '✅ テーブル % に is_active カラムを追加しました', table_record.table_name;
            
        ELSE
            -- is_active のみ存在する場合（理想的な状態）
            RAISE NOTICE '✅ テーブル % は既に is_active カラムを持っています', table_record.table_name;
        END IF;
        
    END LOOP;
END $$;
```

### 3. 修正結果確認
```sql
-- 📊 修正後のカラム構造確認
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
```

### 4. RLS ポリシー再適用
修正後、以下のSQLでRLSポリシーを再適用してください：

```sql
-- 🔐 RLS ポリシー再適用
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT unnest(ARRAY['homepage_content_settings', 'legal_links', 'financial_products', 
                           'financial_planners', 'expert_contact_settings']) as table_name
    LOOP
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
        
        RAISE NOTICE '✅ テーブル % のRLSポリシーを再適用しました', table_record.table_name;
    END LOOP;
END $$;
```

### 5. 最終確認
```sql
-- 📊 RLS状態確認
SELECT 
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

-- 📊 ポリシー確認
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
ORDER BY tablename, policyname;
```

## ⚠️ 注意事項

1. **データベースバックアップ**: 修正前に必ずバックアップを取得してください
2. **段階的実行**: 1つずつSQLを実行し、エラーがないことを確認してください
3. **本番環境での実行**: 本番データベースで実行するため、慎重に行ってください

## 🎯 期待される結果

- 全てのテーブルが `is_active` カラムに統一される
- RLSポリシーが正常に動作する
- SMS認証が正常に機能する

## 📞 完了報告

修正完了後、以下をお知らせください：
- 最終確認SQLの実行結果
- RLS状態確認の結果
- SMS認証のテスト結果