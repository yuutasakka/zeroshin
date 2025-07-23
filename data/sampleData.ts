// AI ConectX サンプルデータ
// 管理画面で変更可能な項目の初期データ

import { Testimonial, LegalLink } from '../types';
import { ReasonsToChooseData, FirstConsultationOffer, HeaderData, MainVisualData, FooterData } from '../data/homepageContentData';
import { allFinancialProducts } from './financialProductsData';

// 証言・レビューのサンプルデータ
export const sampleTestimonials: Testimonial[] = [
  {
    id: 'testimonial_001',
    nameAndRole: "山田さん（30代・IT企業勤務）",
    avatarEmoji: "👨",
    ratingStars: 5,
    text: "AI ConectXを使って初めて資産運用を始めました。診断結果が非常に分かりやすく、自分に最適な投資商品を見つけることができました。特にリスク許容度の診断が的確で、安心して投資を続けています。毎月の積立投資も順調に増えており、将来への不安が大幅に軽減されました。"
  },
  {
    id: 'testimonial_002',
    nameAndRole: "佐藤さん（20代・公務員）",
    avatarEmoji: "👩",
    ratingStars: 5,
    text: "お金の知識がほとんどなかった私でも、AI ConectXの診断を受けることで将来の資産形成への道筋が見えました。アドバイザーの方も親切で、定期的な相談ができるのが心強いです。特にNISAの活用方法を教えてもらったおかげで、税制優遇を最大限活用できています。"
  },
  {
    id: 'testimonial_003',
    nameAndRole: "田中さん（40代・商社勤務）",
    avatarEmoji: "👨",
    ratingStars: 4,
    text: "複数の金融機関を比較検討するのが大変でしたが、AI ConectXで一括診断できるのが便利でした。手数料の比較も分かりやすく、コストを抑えて投資を始めることができました。おかげで年間20万円以上の手数料を節約できています。"
  },
  {
    id: 'testimonial_004',
    nameAndRole: "鈴木さん（30代・フリーランス）",
    avatarEmoji: "👩",
    ratingStars: 5,
    text: "不安定な収入の中でも、AI ConectXの診断で自分に合った投資方法を見つけられました。少額から始められる商品を紹介してもらい、無理なく資産形成を続けています。収入の変動に合わせて投資額を調整できるのも助かっています。"
  },
  {
    id: 'testimonial_005',
    nameAndRole: "高橋さん（30代・製造業）",
    avatarEmoji: "👨",
    ratingStars: 4,
    text: "老後の資産形成に不安を感じていましたが、AI ConectXの診断で具体的な目標設定ができました。iDeCoやNISAの活用方法も詳しく教えてもらい、税制優遇を最大限活用できています。65歳までに3000万円の目標が現実的に見えてきました。"
  },
  {
    id: 'testimonial_006',
    nameAndRole: "伊藤さん（20代・看護師）",
    avatarEmoji: "👩",
    ratingStars: 5,
    text: "忙しい仕事の合間でも、オンラインで簡単に診断を受けられるのが魅力的でした。診断結果に基づいて提案された商品で、着実に資産を増やすことができています。夜勤の多い生活でも、24時間いつでも相談できるのが心強いです。"
  }
];

// リーガルリンクのサンプルデータ
export const sampleLegalLinks: LegalLink[] = [
  {
    id: 1,
    link_type: 'privacy_policy',
    title: 'プライバシーポリシー',
    url: '/privacy-policy',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    link_type: 'terms_of_service',
    title: '利用規約',
    url: '/terms-of-service',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    link_type: 'specified_commercial_transactions',
    title: '特定商取引法に基づく表記',
    url: '/specified-commercial-transactions',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    link_type: 'company_info',
    title: '金融商品仲介業について',
    url: '/financial-intermediary',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    link_type: 'company_info',
    title: 'お問い合わせ',
    url: '/contact',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    link_type: 'company_info',
    title: '会社概要',
    url: '/company',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// AI ConectXを選ぶ理由のサンプルデータ
export const sampleReasonsToChoose: ReasonsToChooseData = {
  title: "AI ConectXが選ばれる理由",
  subtitle: "あなたに最適な資産運用をサポートする3つの強み",
  reasons: [
    {
      iconClass: "fas fa-bullseye",
      title: "パーソナライズされた診断",
      value: "100%",
      description: "AI技術と金融の専門知識を組み合わせ、あなただけのオーダーメイド資産運用プランを提案します",
      animationDelay: "0s"
    },
    {
      iconClass: "fas fa-shield-alt",
      title: "業界最高水準のセキュリティ",
      value: "100%",
      description: "金融機関レベルのセキュリティシステムで、お客様の大切な個人情報と資産を守ります",
      animationDelay: "0.5s"
    },
    {
      iconClass: "fas fa-phone",
      title: "充実したサポート体制",
      value: "24/7",
      description: "経験豊富なファイナンシャルプランナーが、投資初心者から上級者まで丁寧にサポートします",
      animationDelay: "1s"
    }
  ]
};

// 初回相談特典のサンプルデータ
export const sampleFirstConsultationOffer: FirstConsultationOffer = {
  title: "初回相談無料キャンペーン",
  description: "AI ConectXの専門アドバイザーが、あなたの診断結果を詳しく解説し、最適な投資戦略をご提案します。詳細な診断結果の解説（30分）、個別投資戦略の提案、リスク管理アドバイス、税制優遇制度の活用方法、継続サポートプランのご案内を無料で行います。",
  icon: "fas fa-gift",
  backgroundColor: "rgba(34, 197, 94, 0.1)",
  borderColor: "var(--accent-gold)"
};

// ヘッダーデータのサンプル
export const sampleHeaderData: HeaderData = {
  title: "AI ConectX",
  subtitle: "あなたの資産運用パートナー"
};

// メインビジュアルデータのサンプル
export const sampleMainVisualData: MainVisualData = {
  title: "あなたに最適な資産運用を見つけよう",
  highlightWord: "最適",
  subtitle: "3分の簡単診断で、あなたの年齢、収入、投資経験、リスク許容度に基づいた最適な金融商品をご提案。初心者から上級者まで、誰でも安心して始められる資産運用をサポートします。"
};

// フッターデータのサンプル
export const sampleFooterData: FooterData = {
  siteName: "AI ConectX",
  description: "AI技術と金融の専門知識を組み合わせ、あなたの資産運用を成功に導く信頼できるパートナーです。一人ひとりに最適な投資戦略をご提案し、安心できる資産形成をサポートいたします。",
  contactInfo: "電話: 0120-123-456 | メール: info@aiconectx.co.jp",
  companyInfo: "〒100-0001 東京都千代田区千代田1-1-1 | 平日 9:00-18:00",
  copyright: "© 2024 AI ConectX株式会社. All rights reserved."
};

// 通知設定のサンプルデータ
export const sampleNotificationSettings = {
  email: {
    enabled: true,
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "notifications@aiconectx.co.jp",
    smtpPassword: "[SMTP_PASSWORD_PLACEHOLDER]", // 本番環境では環境変数で管理
    fromEmail: "notifications@aiconectx.co.jp",
    fromName: "AI ConectX通知システム"
  },
  slack: {
    enabled: false,
    webhookUrl: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
    channel: "#notifications",
    username: "AI ConectX Bot"
  },
  line: {
    enabled: false,
    channelAccessToken: "[LINE_CHANNEL_ACCESS_TOKEN_PLACEHOLDER]",
    channelSecret: "[LINE_CHANNEL_SECRET_PLACEHOLDER]"
  },
  chatwork: {
    enabled: false,
    apiToken: "[CHATWORK_API_TOKEN_PLACEHOLDER]",
    roomId: "your-room-id"
  }
};

// 初期化関数：アプリケーション起動時にサンプルデータを設定
export const initializeSampleData = () => {
  try {
    // 証言データの初期化
    const existingTestimonials = localStorage.getItem('testimonials');
    if (!existingTestimonials) {
      localStorage.setItem('testimonials', JSON.stringify(sampleTestimonials));
    }

    // リーガルリンクの初期化
    const existingLegalLinks = localStorage.getItem('legal_links');
    if (!existingLegalLinks) {
      localStorage.setItem('legal_links', JSON.stringify(sampleLegalLinks));
    }

    // ホームページコンテンツの初期化
    const existingReasonsToChoose = localStorage.getItem('homepage_content_reasons_to_choose');
    if (!existingReasonsToChoose) {
      localStorage.setItem('homepage_content_reasons_to_choose', JSON.stringify(sampleReasonsToChoose));
    }

    const existingFirstConsultation = localStorage.getItem('first_consultation_offer');
    if (!existingFirstConsultation) {
      localStorage.setItem('first_consultation_offer', JSON.stringify(sampleFirstConsultationOffer));
    }

    // ヘッダー・メインビジュアル・フッターの初期化
    const existingHeaderData = localStorage.getItem('homepage_content_header_data');
    if (!existingHeaderData) {
      localStorage.setItem('homepage_content_header_data', JSON.stringify(sampleHeaderData));
    }

    const existingMainVisualData = localStorage.getItem('homepage_content_main_visual_data');
    if (!existingMainVisualData) {
      localStorage.setItem('homepage_content_main_visual_data', JSON.stringify(sampleMainVisualData));
    }

    const existingFooterData = localStorage.getItem('homepage_content_footer_data');
    if (!existingFooterData) {
      localStorage.setItem('homepage_content_footer_data', JSON.stringify(sampleFooterData));
    }

    // 通知設定の初期化
    const existingNotificationSettings = localStorage.getItem('notification_settings');
    if (!existingNotificationSettings) {
      localStorage.setItem('notification_settings', JSON.stringify(sampleNotificationSettings));
    }

    // 金融商品データの初期化
    const existingProductSettings = localStorage.getItem('productSettings');
    if (!existingProductSettings) {
      localStorage.setItem('productSettings', JSON.stringify(allFinancialProducts));
    }

    return true;
  } catch (error) {
    return false;
  }
};

// 管理画面用：サンプルデータをリセットする関数
export const resetToSampleData = () => {
  try {
    localStorage.setItem('testimonials', JSON.stringify(sampleTestimonials));
    localStorage.setItem('legal_links', JSON.stringify(sampleLegalLinks));
    localStorage.setItem('homepage_content_reasons_to_choose', JSON.stringify(sampleReasonsToChoose));
    localStorage.setItem('first_consultation_offer', JSON.stringify(sampleFirstConsultationOffer));
    localStorage.setItem('homepage_content_header_data', JSON.stringify(sampleHeaderData));
    localStorage.setItem('homepage_content_main_visual_data', JSON.stringify(sampleMainVisualData));
    localStorage.setItem('homepage_content_footer_data', JSON.stringify(sampleFooterData));
    localStorage.setItem('notification_settings', JSON.stringify(sampleNotificationSettings));
    localStorage.setItem('productSettings', JSON.stringify(allFinancialProducts));
    
    return true;
  } catch (error) {
    return false;
  }
}; 