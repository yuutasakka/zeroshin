// Supabaseデータ更新スクリプト - タスカル用
import { createClient } from '@supabase/supabase-js';
import { fundingProducts, fundingAdvisors, successStories } from '../data/fundingProductsData.js';
import { fundingFAQData } from '../data/fundingFAQData.js';

// 環境変数からSupabase設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.log('必要な環境変数:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL または VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSupabaseData() {
  console.log('🚀 タスカル用データ更新を開始します...');

  try {
    // 1. 専門家情報の更新
    console.log('📝 専門家情報を更新中...');
    const { error: expertError } = await supabase
      .from('expert_contact_settings')
      .update({
        expert_name: 'タスカル専門アドバイザー',
        description: 'タスカルの認定資金調達コンサルタントが、お客様の資金調達に関するご相談を承ります。',
        phone_number: '0120-123-456',
        email: 'support@taskal.jp',
        available_hours: '平日 9:00-18:00'
      })
      .eq('id', 1);

    if (expertError) {
      console.warn('⚠️ 専門家情報の更新でエラー:', expertError.message);
    } else {
      console.log('✅ 専門家情報を更新しました');
    }

    // 2. 商品データの更新
    console.log('💰 資金調達商品データを更新中...');
    const productData = {
      products: fundingProducts.slice(0, 5).map(product => ({
        id: product.id,
        name: product.name,
        type: product.type,
        description: product.description,
        interestRate: product.interestRate,
        fundingAmount: product.fundingAmount,
        approvalTime: product.approvalTime,
        company: product.company,
        risk_level: product.risk_level,
        pros: product.pros,
        cons: product.cons,
        recommendedFor: product.recommendedFor
      }))
    };

    const { error: productError } = await supabase
      .from('product_settings')
      .update({ product_data: productData })
      .eq('id', 1);

    if (productError) {
      console.warn('⚠️ 商品データの更新でエラー:', productError.message);
    } else {
      console.log('✅ 商品データを更新しました');
    }

    // 3. 成功事例（testimonials）の更新
    console.log('⭐ 成功事例を更新中...');
    
    // 既存のテスティモニアルを削除
    await supabase.from('testimonials').delete().neq('id', 0);

    // 新しい成功事例を挿入
    const testimonialData = [
      {
        name: '田中 一郎',
        age: 45,
        occupation: '製造業経営者',
        testimonial: 'コロナ禍で売上が激減し困っていましたが、タスカルの診断で最適な資金調達方法を提案していただき、3週間で2,000万円の融資を受けることができました。おかげで事業を継続できています。',
        rating: 5
      },
      {
        name: '佐藤 美咲',
        age: 38,
        occupation: 'IT企業代表',
        testimonial: '創業2年目で銀行からの融資が難しい状況でしたが、ファクタリングという方法を教えていただき、即日で500万円の資金調達に成功。新規案件を受注できました。',
        rating: 5
      },
      {
        name: '鈴木 健太',
        age: 52,
        occupation: '飲食店オーナー',
        testimonial: '5店舗展開のための設備資金で悩んでいましたが、補助金とビジネスローンを組み合わせた提案で、総額5,000万円の調達に成功。計画通り出店できました。',
        rating: 4
      },
      {
        name: '山田 花子',
        age: 41,
        occupation: '建設業経営者',
        testimonial: 'リスケ中で新規融資は無理だと思っていましたが、ファクタリングで月々1,000万円の資金繰り改善ができ、経営が安定しました。',
        rating: 5
      }
    ];

    const { error: testimonialError } = await supabase
      .from('testimonials')
      .insert(testimonialData);

    if (testimonialError) {
      console.warn('⚠️ 成功事例の更新でエラー:', testimonialError.message);
    } else {
      console.log('✅ 成功事例を更新しました');
    }

    // 4. 会社情報の更新
    console.log('🏢 会社情報を更新中...');
    const { error: companyError } = await supabase
      .from('homepage_content_settings')
      .update({
        content_data: {
          company_name: 'タスカル株式会社',
          service_name: 'タスカル',
          service_description: '30秒で分かる資金調達戦闘力診断 - あなたに最適な資金調達方法をご提案',
          main_headline: 'あなたの資金調達戦闘力をチェック！',
          sub_headline: '先に戦闘力を把握してから、キャッシング・ファクタリングの業者調査へ',
          cta_text: '無料診断を開始する'
        }
      })
      .eq('setting_name', 'main_content');

    if (companyError) {
      console.warn('⚠️ 会社情報の更新でエラー:', companyError.message);
    } else {
      console.log('✅ 会社情報を更新しました');
    }

    // 5. ファイナンシャルプランナー情報を資金調達アドバイザーに更新
    console.log('👨‍💼 アドバイザー情報を更新中...');
    const { error: advisorError } = await supabase
      .from('financial_planners')
      .update({
        name: 'タスカル専門アドバイザー',
        title: '資金調達シニアコンサルタント',
        bio: 'タスカルの認定資金調達コンサルタント。銀行・ノンバンク・公的機関での豊富な経験を活かし、お客様に最適な資金調達方法をご提案します。',
        specialties: ['創業融資', 'ビジネスローン', 'ファクタリング', '補助金申請', '事業計画策定'],
        experience_years: 15,
        contact_email: 'advisor@taskal.jp',
        phone_number: '0120-123-456'
      })
      .eq('id', 1);

    if (advisorError) {
      console.warn('⚠️ アドバイザー情報の更新でエラー:', advisorError.message);
    } else {
      console.log('✅ アドバイザー情報を更新しました');
    }

    console.log('🎉 全てのデータ更新が完了しました！');
    console.log('\n📊 更新されたデータ:');
    console.log('- 専門家情報: 資金調達コンサルタント');
    console.log('- 商品データ: 5種類の資金調達方法');
    console.log('- 成功事例: 4件の資金調達成功事例');
    console.log('- 会社情報: タスカル株式会社');
    console.log('- アドバイザー: 資金調達専門家');

  } catch (error) {
    console.error('❌ データ更新中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSupabaseData();
}

export { updateSupabaseData };