// 管理者登録データ挿入スクリプト
import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Supabase環境変数が設定されていません');
  console.log('必要な環境変数:');
  console.log('- VITE_SUPABASE_URL または NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertAdminRegistration() {
  try {
    console.log('管理者登録データの挿入を開始します...');
    
    // 既存データを削除
    console.log('既存データを確認中...');
    const { error: deleteError } = await supabase
      .from('admin_registrations')
      .delete()
      .eq('email', 'sales@seai.co.jp');

    if (deleteError && !deleteError.message.includes('does not exist')) {
      console.log('WARNING: 既存データ削除エラー:', deleteError.message);
    }

    // 新しい管理者登録データを挿入
    console.log('新しい管理者登録データを挿入中...');
    const { data, error: insertError } = await supabase
      .from('admin_registrations')
      .insert([{
        full_name: '田中 営業太郎',
        email: 'sales@seai.co.jp',
        company_name: '株式会社SEAI',
        department: '営業部',
        position: '営業部長',
        phone_number: '03-1234-5678',
        reason_for_access: 'タスカル管理画面での顧客管理と分析業務のため',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin'
      }])
      .select();

    if (insertError) {
      console.error('ERROR: 管理者登録データ挿入エラー:', insertError.message);
      process.exit(1);
    }

    console.log('SUCCESS: 管理者登録データが正常に挿入されました');
    console.log('');
    console.log('--- 挿入されたデータ ---');
    console.log('氏名: 田中 営業太郎');
    console.log('メールアドレス: sales@seai.co.jp');
    console.log('会社名: 株式会社SEAI');
    console.log('部署: 営業部');
    console.log('役職: 営業部長');
    console.log('電話番号: 03-1234-5678');
    console.log('ステータス: approved');
    console.log('');

    // 挿入されたデータの確認
    if (data && data.length > 0) {
      console.log('挿入されたレコード:');
      console.log('ID:', data[0].id);
      console.log('作成日時:', data[0].created_at);
      console.log('承認日時:', data[0].approved_at);
    }

    // 最終確認
    const { data: verifyData, error: verifyError } = await supabase
      .from('admin_registrations')
      .select('full_name, email, company_name, status, approved_at, created_at')
      .eq('email', 'sales@seai.co.jp')
      .single();

    if (verifyError) {
      console.error('ERROR: データ確認エラー:', verifyError.message);
    } else {
      console.log('');
      console.log('--- データ確認結果 ---');
      console.log(verifyData);
    }

  } catch (error) {
    console.error('ERROR: 管理者登録データ挿入中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  insertAdminRegistration();
}

export { insertAdminRegistration };