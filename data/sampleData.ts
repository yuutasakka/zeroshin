// Zero神 サンプルデータ
// 管理画面で変更可能な項目の初期データ

import { Testimonial, LegalLink } from '../types';
import { ReasonsToChooseData, FirstConsultationOffer, HeaderData, MainVisualData, FooterData } from '../data/homepageContentData';

// 節約成功体験のサンプルデータ
export const sampleTestimonials: Testimonial[] = [
  {
    id: 'testimonial_001',
    nameAndRole: "山田さん（38歳・会社員）",
    avatarEmoji: "👨",
    ratingStars: 5,
    text: "診断で自分の無駄遣いパターンが分かり、月3万円の節約に成功！特にサブスクの見直しが効果的でした。浮いたお金で家族旅行ができるようになり、生活の質も向上しました。診断結果のアドバイスが具体的で実践しやすかったです。"
  },
  {
    id: 'testimonial_002',
    nameAndRole: "佐藤さん（42歳・主婦）",
    avatarEmoji: "👩",
    ratingStars: 5,
    text: "食費の無駄遣いが多いことに気づかされました。診断後、買い物の仕方を変えて月2万円の節約を実現。子供の教育費に回せるようになり、将来への不安が減りました。友人にも勧めています！"
  },
  {
    id: 'testimonial_003',
    nameAndRole: "田中さん（35歳・自営業）",
    avatarEmoji: "👨",
    ratingStars: 4,
    text: "衝動買いをやめられずにいましたが、診断のアドバイス通りに行動したら月1万5千円の節約ができました。貯金が増えて事業資金の準備もできるようになり、精神的にも楽になりました。"
  },
  {
    id: 'testimonial_004',
    nameAndRole: "鈴木さん（29歳・フリーランス）",
    avatarEmoji: "👩",
    ratingStars: 5,
    text: "在宅ワーク用の機材を衝動的に買いすぎていました。診断で購入前に24時間考える習慣を身につけ、月1万円以上の節約に成功。本当に必要なものだけを選ぶようになり、作業効率も上がりました。"
  },
  {
    id: 'testimonial_005',
    nameAndRole: "高橋さん（40歳・サラリーマン）",
    avatarEmoji: "👨",
    ratingStars: 4,
    text: "コンビニでの買い物が習慣になっていましたが、Zero神の診断で自分の無駄遣いの多さに気づきました。スーパーでのまとめ買いに変えて月8千円の節約。家計簿アプリも導入して支出管理が楽しくなりました。"
  },
  {
    id: 'testimonial_006',
    nameAndRole: "伊藤さん（33歳・看護師）",
    avatarEmoji: "👩",
    ratingStars: 5,
    text: "ストレス発散で買い物をしてしまう癖がありました。診断のアドバイス通りリラックス方法を変えたところ、月2万円以上の節約ができました。貯金目標も設定して、旅行資金を貯められるようになりました。"
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

// タスカルを選ぶ理由のサンプルデータ
export const sampleReasonsToChoose: ReasonsToChooseData = {
  title: "タスカルが選ばれる理由",
  subtitle: "あなたに最適な資金調達をサポートする3つの強み",
  reasons: [
    {
      iconClass: "fas fa-bullseye",
      title: "パーソナライズされた診断",
      value: "100%",
      description: "AI技術と金融の専門知識を組み合わせ、あなたの事業に最適な資金調達方法を提案します",
      animationDelay: "0s"
    },
    {
      iconClass: "fas fa-shield-alt",
      title: "業界最高水準のセキュリティ",
      value: "100%",
      description: "金融機関レベルのセキュリティシステムで、お客様の大切な事業情報を守ります",
      animationDelay: "0.5s"
    },
    {
      iconClass: "fas fa-phone",
      title: "充実したサポート体制",
      value: "24/7",
      description: "経験豊富な資金調達アドバイザーが、個人事業主から法人まで丁寧にサポートします",
      animationDelay: "1s"
    }
  ]
};

// 初回相談特典のサンプルデータ
export const sampleFirstConsultationOffer: FirstConsultationOffer = {
  title: "初回相談無料キャンペーン",
  description: "タスカルの専門アドバイザーが、あなたの診断結果を詳しく解説し、最適な資金調達戦略をご提案します。詳細な診断結果の解説（30分）、個別資金調達戦略の提案、リスク管理アドバイス、融資制度の活用方法、継続サポートプランのご案内を無料で行います。",
  icon: "fas fa-gift",
  backgroundColor: "rgba(34, 197, 94, 0.1)",
  borderColor: "var(--accent-gold)"
};

// ヘッダーデータのサンプル
export const sampleHeaderData: HeaderData = {
  title: "タスカル",
  subtitle: "あなたの資金調達パートナー"
};

// メインビジュアルデータのサンプル
export const sampleMainVisualData: MainVisualData = {
  title: "あなたに最適な資金調達方法を見つけよう",
  highlightWord: "最適",
  subtitle: "3分の簡単診断で、あなたの事業規模、業種、資金需要、返済能力に基づいた最適な資金調達方法をご提案。個人事業主から法人まで、誰でも安心して利用できる資金調達をサポートします。"
};

// フッターデータのサンプル
export const sampleFooterData: FooterData = {
  siteName: "タスカル",
  description: "AI技術と金融の専門知識を組み合わせ、あなたの事業資金調達を成功に導く信頼できるパートナーです。一人ひとりに最適な資金調達戦略をご提案し、安心できる事業成長をサポートいたします。",
  contactInfo: "電話: 0120-123-456 | メール: info@taskal.co.jp",
  companyInfo: "〒100-0001 東京都千代田区千代田1-1-1 | 平日 9:00-18:00",
  copyright: "© 2024 タスカル株式会社. All rights reserved."
};

// 通知設定のサンプルデータ
export const sampleNotificationSettings = {
  email: {
    enabled: true,
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "notifications@taskal.co.jp",
    smtpPassword: "[SMTP_PASSWORD_PLACEHOLDER]", // 本番環境では環境変数で管理
    fromEmail: "notifications@taskal.co.jp",
    fromName: "タスカル通知システム"
  },
  slack: {
    enabled: false,
    webhookUrl: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
    channel: "#notifications",
    username: "タスカル Bot"
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
    const existingTestimonials = sessionStorage.getItem('testimonials');
    if (!existingTestimonials) {
      sessionStorage.setItem('testimonials', JSON.stringify(sampleTestimonials));
    }

    // リーガルリンクの初期化
    const existingLegalLinks = sessionStorage.getItem('legal_links');
    if (!existingLegalLinks) {
      sessionStorage.setItem('legal_links', JSON.stringify(sampleLegalLinks));
    }

    // ホームページコンテンツの初期化
    const existingReasonsToChoose = sessionStorage.getItem('homepage_content_reasons_to_choose');
    if (!existingReasonsToChoose) {
      sessionStorage.setItem('homepage_content_reasons_to_choose', JSON.stringify(sampleReasonsToChoose));
    }

    const existingFirstConsultation = sessionStorage.getItem('first_consultation_offer');
    if (!existingFirstConsultation) {
      sessionStorage.setItem('first_consultation_offer', JSON.stringify(sampleFirstConsultationOffer));
    }

    // ヘッダー・メインビジュアル・フッターの初期化
    const existingHeaderData = sessionStorage.getItem('homepage_content_header_data');
    if (!existingHeaderData) {
      sessionStorage.setItem('homepage_content_header_data', JSON.stringify(sampleHeaderData));
    }

    const existingMainVisualData = sessionStorage.getItem('homepage_content_main_visual_data');
    if (!existingMainVisualData) {
      sessionStorage.setItem('homepage_content_main_visual_data', JSON.stringify(sampleMainVisualData));
    }

    const existingFooterData = sessionStorage.getItem('homepage_content_footer_data');
    if (!existingFooterData) {
      sessionStorage.setItem('homepage_content_footer_data', JSON.stringify(sampleFooterData));
    }

    // 通知設定の初期化
    const existingNotificationSettings = sessionStorage.getItem('notification_settings');
    if (!existingNotificationSettings) {
      sessionStorage.setItem('notification_settings', JSON.stringify(sampleNotificationSettings));
    }

    // 金融商品データの初期化
    const existingProductSettings = sessionStorage.getItem('productSettings');
    if (!existingProductSettings) {
      sessionStorage.setItem('productSettings', JSON.stringify(allFinancialProducts));
    }

    return true;
  } catch (error) {
    return false;
  }
};

// 管理画面用：サンプルデータをリセットする関数
export const resetToSampleData = () => {
  try {
    sessionStorage.setItem('testimonials', JSON.stringify(sampleTestimonials));
    sessionStorage.setItem('legal_links', JSON.stringify(sampleLegalLinks));
    sessionStorage.setItem('homepage_content_reasons_to_choose', JSON.stringify(sampleReasonsToChoose));
    sessionStorage.setItem('first_consultation_offer', JSON.stringify(sampleFirstConsultationOffer));
    sessionStorage.setItem('homepage_content_header_data', JSON.stringify(sampleHeaderData));
    sessionStorage.setItem('homepage_content_main_visual_data', JSON.stringify(sampleMainVisualData));
    sessionStorage.setItem('homepage_content_footer_data', JSON.stringify(sampleFooterData));
    sessionStorage.setItem('notification_settings', JSON.stringify(sampleNotificationSettings));
    sessionStorage.setItem('productSettings', JSON.stringify(allFinancialProducts));
    
    return true;
  } catch (error) {
    return false;
  }
}; 