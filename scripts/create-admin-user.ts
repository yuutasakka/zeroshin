// 管理者ユーザー作成スクリプト
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// パスワードをハッシュ化
const ADMIN_PASSWORD = 'zg79juX!3ij5';
const SALT_ROUNDS = 12;

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Supabase環境変数が設定されていません');
  console.log('必要な環境変数:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL または VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('管理者ユーザー作成を開始します...');
    
    // パスワードをハッシュ化
    console.log('パスワードをハッシュ化中...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    console.log('SUCCESS: パスワードハッシュ化完了');

    // admin_credentialsテーブルの存在確認と作成
    console.log('admin_credentialsテーブルを確認中...');
    const { error: tableError } = await supabase.rpc('create_admin_table_if_not_exists');
    
    if (tableError && !tableError.message.includes('already exists')) {
      // テーブルが存在しない場合、手動で作成を試行
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS admin_credentials (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email VARCHAR(255),
          phone_number VARCHAR(20),
          role VARCHAR(50) DEFAULT 'admin',
          is_active BOOLEAN DEFAULT TRUE,
          last_login TIMESTAMP WITH TIME ZONE,
          login_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { query: createTableQuery });
      if (createError) {
        console.log('WARNING: テーブル作成でエラー（既に存在する可能性）:', createError.message);
      }
    }

    // 既存の管理者データを削除
    console.log('既存の管理者データを確認中...');
    const { error: deleteError } = await supabase
      .from('admin_credentials')
      .delete()
      .eq('username', 'admin');

    if (deleteError && !deleteError.message.includes('does not exist')) {
      console.log('WARNING: 既存データ削除エラー:', deleteError.message);
    }

    // 新しい管理者データを挿入
    console.log('新しい管理者データを挿入中...');
    const { data, error: insertError } = await supabase
      .from('admin_credentials')
      .insert([
        {
          username: 'admin',
          password_hash: passwordHash,
          email: 'admin@taskal.jp',
          role: 'super_admin',
          is_active: true
        }
      ])
      .select();

    if (insertError) {
      console.error('ERROR: 管理者データ挿入エラー:', insertError.message);
      process.exit(1);
    }

    console.log('SUCCESS: 管理者ユーザーが正常に作成されました');
    console.log('');
    console.log('--- 管理者情報 ---');
    console.log('ユーザー名: admin');
    console.log('パスワード: zg79juX!3ij5');
    console.log('メール: admin@taskal.jp');
    console.log('権限: super_admin');
    console.log('');
    console.log('管理画面URL: https://your-domain.com/admin');
    console.log('');
    console.log('注意: パスワードは安全に管理してください');

    // 作成されたデータの確認
    if (data && data.length > 0) {
      console.log('');
      console.log('作成されたレコード:');
      console.log('ID:', data[0].id);
      console.log('作成日時:', data[0].created_at);
    }

  } catch (error) {
    console.error('ERROR: 管理者ユーザー作成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}

export { createAdminUser };