// SecurityTrustSectionデータ更新スクリプト
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

async function updateSecurityTrustData() {
  try {
    console.log('SecurityTrustSectionデータの更新を開始します...');
    
    // 既存データを削除
    console.log('既存データを削除中...');
    const { error: deleteError } = await supabase
      .from('security_trust_sections')
      .delete()
      .neq('id', 0); // 全データ削除

    if (deleteError && !deleteError.message.includes('does not exist')) {
      console.log('WARNING: 既存データ削除エラー:', deleteError.message);
    }

    // 新しいデータを挿入
    console.log('新しいデータを挿入中...');
    const { data, error: insertError } = await supabase
      .from('security_trust_sections')
      .insert([{
        section_title: '安心・安全への取り組み',
        trust_item_1_title: 'SSL暗号化',
        trust_item_1_description: '最高水準のセキュリティでお客様の事業情報を保護',
        trust_item_2_title: '金融機関連携',
        trust_item_2_description: '信頼できる金融機関・ファクタリング会社のみご紹介',
        trust_item_3_title: 'プライバシーマーク',
        trust_item_3_description: '個人情報保護の第三者認証取得済み',
        trust_item_4_title: '営業電話なし',
        trust_item_4_description: 'お客様からのご依頼がない限り一切連絡いたしません'
      }])
      .select();

    if (insertError) {
      console.error('ERROR: データ挿入エラー:', insertError.message);
      process.exit(1);
    }

    console.log('SUCCESS: SecurityTrustSectionデータが正常に更新されました');
    console.log('');
    console.log('--- 更新されたデータ ---');
    console.log('セクションタイトル: 安心・安全への取り組み');
    console.log('');
    console.log('1. SSL暗号化');
    console.log('   → 最高水準のセキュリティでお客様の事業情報を保護');
    console.log('');
    console.log('2. 金融機関連携');
    console.log('   → 信頼できる金融機関・ファクタリング会社のみご紹介');
    console.log('');
    console.log('3. プライバシーマーク');
    console.log('   → 個人情報保護の第三者認証取得済み');
    console.log('');
    console.log('4. 営業電話なし');
    console.log('   → お客様からのご依頼がない限り一切連絡いたしません');
    console.log('');

    // 挿入されたデータの確認
    if (data && data.length > 0) {
      console.log('挿入されたレコード:');
      console.log('ID:', data[0].id);
      console.log('作成日時:', data[0].created_at);
    }

    // 最終確認
    const { data: verifyData, error: verifyError } = await supabase
      .from('security_trust_sections')
      .select('*')
      .single();

    if (verifyError) {
      console.error('ERROR: データ確認エラー:', verifyError.message);
    } else {
      console.log('');
      console.log('--- データ確認結果 ---');
      console.log('タイトル:', verifyData.section_title);
      console.log('項目1:', verifyData.trust_item_1_title, '-', verifyData.trust_item_1_description);
      console.log('項目2:', verifyData.trust_item_2_title, '-', verifyData.trust_item_2_description);
      console.log('項目3:', verifyData.trust_item_3_title, '-', verifyData.trust_item_3_description);
      console.log('項目4:', verifyData.trust_item_4_title, '-', verifyData.trust_item_4_description);
    }

  } catch (error) {
    console.error('ERROR: SecurityTrustSectionデータ更新中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSecurityTrustData();
}

export { updateSecurityTrustData };