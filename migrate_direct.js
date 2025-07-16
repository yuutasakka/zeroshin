// Direct migration script to fix column naming issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXJ6YnVxZ3ltcnRuZm12d2hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzYzMDExMCwiZXhwIjoyMDQ5MjA2MTEwfQ.QJzH_2MNrJhSBv6FqPfBnH6g7_0ZmJSHhUiLnxh0HYs';

async function main() {
    console.log('🔧 緊急修正: カラム名統一スクリプト開始');
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Step 1: Check current column structure
    console.log('1. 現在のカラム構造を確認中...');
    const { data: currentColumns, error: checkError } = await supabase.rpc('execute_sql', {
        sql: `
        SELECT 
            table_name,
            column_name,
            data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
        AND column_name IN ('is_active', 'active')
        ORDER BY table_name, column_name;
        `
    });
    
    if (checkError) {
        console.error('カラム確認エラー:', checkError);
        return;
    }
    
    console.log('現在のカラム構造:', currentColumns);
    
    // Step 2: Fix each table individually
    const tables = ['homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings'];
    
    for (const tableName of tables) {
        try {
            console.log(`2. テーブル ${tableName} を修正中...`);
            
            // Check if table exists
            const { data: tableExists } = await supabase.rpc('execute_sql', {
                sql: `SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '${tableName}') as exists;`
            });
            
            if (!tableExists || !tableExists[0]?.exists) {
                console.log(`⚠️  テーブル ${tableName} が存在しません。スキップします。`);
                continue;
            }
            
            // Check if 'active' column exists
            const { data: activeColumnExists } = await supabase.rpc('execute_sql', {
                sql: `
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = '${tableName}' 
                    AND column_name = 'active'
                    AND table_schema = 'public'
                ) as exists;
                `
            });
            
            // Check if 'is_active' column exists
            const { data: isActiveColumnExists } = await supabase.rpc('execute_sql', {
                sql: `
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = '${tableName}' 
                    AND column_name = 'is_active'
                    AND table_schema = 'public'
                ) as exists;
                `
            });
            
            if (activeColumnExists && activeColumnExists[0]?.exists && 
                isActiveColumnExists && isActiveColumnExists[0]?.exists) {
                // Both columns exist, drop 'active'
                console.log(`  - 両方のカラムが存在するため、'active'を削除します`);
                await supabase.rpc('execute_sql', {
                    sql: `ALTER TABLE ${tableName} DROP COLUMN active;`
                });
            } else if (activeColumnExists && activeColumnExists[0]?.exists) {
                // Only 'active' exists, rename to 'is_active'
                console.log(`  - 'active'を'is_active'にリネームします`);
                await supabase.rpc('execute_sql', {
                    sql: `ALTER TABLE ${tableName} RENAME COLUMN active TO is_active;`
                });
            } else if (!isActiveColumnExists || !isActiveColumnExists[0]?.exists) {
                // Neither exists, create 'is_active'
                console.log(`  - 'is_active'カラムを作成します`);
                await supabase.rpc('execute_sql', {
                    sql: `ALTER TABLE ${tableName} ADD COLUMN is_active BOOLEAN DEFAULT true;`
                });
            }
            
            console.log(`✅ テーブル ${tableName} の修正完了`);
            
        } catch (error) {
            console.error(`❌ テーブル ${tableName} の修正エラー:`, error);
        }
    }
    
    // Step 3: Verify the fix
    console.log('3. 修正結果を確認中...');
    const { data: finalColumns, error: finalError } = await supabase.rpc('execute_sql', {
        sql: `
        SELECT 
            table_name,
            column_name,
            data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN ('homepage_content_settings', 'legal_links', 'financial_products', 'financial_planners', 'expert_contact_settings', 'admin_settings')
        AND column_name = 'is_active'
        ORDER BY table_name;
        `
    });
    
    if (finalError) {
        console.error('最終確認エラー:', finalError);
        return;
    }
    
    console.log('修正後のカラム構造:', finalColumns);
    console.log('🎉 カラム名統一完了!');
}

main().catch(console.error);