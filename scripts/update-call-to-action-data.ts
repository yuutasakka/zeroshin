// CallToActionSectionデータ更新スクリプト
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

async function updateCallToActionData() {
  try {
    console.log('CallToActionSectionデータの更新を開始します...');
    
    // 既存データを削除
    console.log('既存データを削除中...');
    const { error: deleteError } = await supabase
      .from('call_to_action_sections')
      .delete()
      .neq('id', 0); // 全データ削除

    if (deleteError && !deleteError.message.includes('does not exist')) {
      console.log('WARNING: 既存データ削除エラー:', deleteError.message);
    }

    // 新しいデータを挿入
    console.log('新しいデータを挿入中...');
    const { data, error: insertError } = await supabase
      .from('call_to_action_sections')
      .insert([{
        section_title: 'あなたの事業の未来を',
        section_subtitle: '今日から始めませんか？',
        main_description: '経験豊富な資金調達のプロフェッショナルが、あなたの事業規模と資金需要に合わせた最適な調達方法を無料でご提案いたします。',
        phone_number: '0120-999-888（平日 9:00-18:00）',
        phone_hours: '平日 9:00-18:00',
        campaign_title: '初回相談無料キャンペーン',
        campaign_description: '資金調達のプロが、あなたの事業状況に合わせて最適な調達プランをご提案します。銀行融資からファクタリングまで、幅広い選択肢から最良の方法を見つけられます。'
      }])
      .select();

    if (insertError) {
      console.error('ERROR: データ挿入エラー:', insertError.message);
      process.exit(1);
    }

    console.log('SUCCESS: CallToActionSectionデータが正常に更新されました');
    console.log('');
    console.log('--- 更新されたデータ ---');
    console.log('タイトル: あなたの事業の未来を');
    console.log('サブタイトル: 今日から始めませんか？');
    console.log('');
    console.log('メイン説明文:');
    console.log('経験豊富な資金調達のプロフェッショナルが、あなたの事業規模と資金需要に合わせた最適な調達方法を無料でご提案いたします。');
    console.log('');
    console.log('電話番号: 0120-999-888（平日 9:00-18:00）');
    console.log('営業時間: 平日 9:00-18:00');
    console.log('');
    console.log('キャンペーン: 初回相談無料キャンペーン');
    console.log('キャンペーン詳細:');
    console.log('資金調達のプロが、あなたの事業状況に合わせて最適な調達プランをご提案します。銀行融資からファクタリングまで、幅広い選択肢から最良の方法を見つけられます。');
    console.log('');

    // 挿入されたデータの確認
    if (data && data.length > 0) {
      console.log('挿入されたレコード:');
      console.log('ID:', data[0].id);
      console.log('作成日時:', data[0].created_at);
    }

    // 最終確認
    const { data: verifyData, error: verifyError } = await supabase
      .from('call_to_action_sections')
      .select('*')
      .single();

    if (verifyError) {
      console.error('ERROR: データ確認エラー:', verifyError.message);
    } else {
      console.log('');
      console.log('--- データ確認結果 ---');
      console.log('データ更新完了:', verifyData.section_title, verifyData.section_subtitle);
    }

  } catch (error) {
    console.error('ERROR: CallToActionSectionデータ更新中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateCallToActionData();
}

export { updateCallToActionData };