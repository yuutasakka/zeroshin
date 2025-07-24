// Supabaseマイグレーション実行スクリプト
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数から設定を読み込み
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ エラー: SUPABASE_SERVICE_ROLE_KEY環境変数が設定されていません');
  console.log('以下のコマンドで設定してください:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

// Supabaseクライアント作成
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Supabaseマイグレーション開始...');
  console.log(`URL: ${SUPABASE_URL}`);
  
  try {
    // マイグレーションファイルを読み込み
    const migrationPath = path.join(__dirname, 'supabase/migrations/033_create_missing_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // SQLを個別のステートメントに分割
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 ${statements.length}個のSQLステートメントを実行します...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n実行中 (${i + 1}/${statements.length}): ${statement.substring(0, 50)}...`);
      
      // rpc経由でSQL実行
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });
      
      if (error) {
        // エラーが発生してもテーブルが既に存在する場合は続行
        if (error.message.includes('already exists')) {
          console.log('⚠️  既に存在します（スキップ）');
        } else {
          console.error(`❌ エラー: ${error.message}`);
          // 重要でないエラーは続行
          if (!error.message.includes('policy') && !error.message.includes('duplicate')) {
            throw error;
          }
        }
      } else {
        console.log('✅ 成功');
      }
    }
    
    console.log('\n🎉 マイグレーション完了！');
    
    // テーブル確認
    console.log('\n📊 テーブル確認中...');
    const tables = ['homepage_content_settings', 'legal_links', 'admin_settings'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: エラー - ${error.message}`);
      } else {
        console.log(`✅ ${table}: 存在確認OK (${count || 0}行)`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ マイグレーション失敗:', error.message);
    console.log('\n代替案: Supabase Dashboardから直接SQLを実行してください');
    console.log('URL: https://app.supabase.com');
  }
}

// 代替案: 直接SQLを実行
async function directSQLExecution() {
  console.log('\n🔧 直接SQL実行モード...');
  
  const queries = [
    // homepage_content_settings
    `CREATE TABLE IF NOT EXISTS homepage_content_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(255) UNIQUE NOT NULL,
      setting_data JSONB,
      description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // legal_links
    `CREATE TABLE IF NOT EXISTS legal_links (
      id SERIAL PRIMARY KEY,
      link_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      url VARCHAR(500) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // admin_settings
    `CREATE TABLE IF NOT EXISTS admin_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(255) UNIQUE NOT NULL,
      setting_data JSONB,
      setting_value TEXT,
      description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  for (const query of queries) {
    try {
      console.log(`\n実行中: ${query.substring(0, 50)}...`);
      
      // Supabase REST API経由で実行
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (response.ok) {
        console.log('✅ 成功');
      } else {
        const error = await response.text();
        console.log(`⚠️  レスポンス: ${error}`);
      }
    } catch (error) {
      console.error(`❌ エラー: ${error.message}`);
    }
  }
}

// メイン実行
async function main() {
  console.log('='.repeat(50));
  console.log('Supabaseテーブル作成スクリプト');
  console.log('='.repeat(50));
  
  // まずrpc経由で試行
  await runMigration().catch(async (error) => {
    console.log('\n⚠️  rpc方式が失敗しました。直接実行を試みます...');
    await directSQLExecution();
  });
  
  console.log('\n完了しました！');
  console.log('\nSupabase Dashboardで確認することをお勧めします:');
  console.log('https://app.supabase.com');
}

main().catch(console.error);