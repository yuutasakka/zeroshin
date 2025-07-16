const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXJ6YnVxZ3ltcnRuZm12d2hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzYzMDExMCwiZXhwIjoyMDQ5MjA2MTEwfQ.QJzH_2MNrJhSBv6FqPfBnH6g7_0ZmJSHhUiLnxh0HYs';

console.log('🔧 カラム名修正スクリプト開始...');

async function fixColumnNames() {
    try {
        // Supabase client with service role key
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Read the SQL file
        const sqlContent = fs.readFileSync(path.join(__dirname, 'fix_column_names.sql'), 'utf8');
        
        // Split into individual statements (simple approach)
        const statements = sqlContent.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    console.log(`実行中: ${statement.substring(0, 50)}...`);
                    const { data, error } = await supabase.rpc('execute_sql', { sql: statement.trim() });
                    
                    if (error) {
                        console.error('エラー:', error);
                    } else {
                        console.log('✅ 実行完了');
                    }
                } catch (e) {
                    console.error('実行エラー:', e.message);
                }
            }
        }
        
        console.log('🎉 カラム名修正完了');
        
    } catch (error) {
        console.error('修正エラー:', error);
    }
}

fixColumnNames();