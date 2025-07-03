export interface Testimonial {
  id: string; // Unique identifier
  nameAndRole: string; // e.g., "田中さん（30代・会社員）"
  avatarEmoji: string; // e.g., "👩"
  ratingStars: number; // Number of stars (e.g., 5)
  text: string;
}

export interface SecurityFeature {
  iconEmoji: string; // e.g., "🔒"
  title: string;
  description: string;
  bgColorClass: string; // e.g., "bg-green-100"
  textColorClass: string; // e.g., "text-green-600"
}

export interface DiagnosisQuestion {
  id: string;
  type: 'select' | 'radio' | 'tel'; // Added 'tel'
  label: string;
  emojiPrefix?: string; // e.g., "1️⃣"
  options?: { value: string; label: string; emojiSuffix?: string }[];
  radioOptions?: { value: string; label: string; emojiPrefix?: string, bgColorClass?: string, hoverBgColorClass?: string }[];
  placeholder?: string; // Added placeholder for tel/text inputs
}

export interface DiagnosisStep {
  step: number;
  question: DiagnosisQuestion;
}

export interface DiagnosisFormState {
  [key: string]: string; // Stores answers, e.g., { age: "20s", experience: "beginner" }
}

export interface Company {
  id: string;
  name: string;
  websiteUrl: string;
  actionText: string;
  logoUrl?: string; // Optional: for company logos
}

export interface FinancialProduct {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  iconClass: string; // Font Awesome class, e.g., 'fas fa-chart-line'
  tags: string[]; // For filtering logic, e.g., ['beginner', 'long-term', 'growth']
  alwaysRecommend?: boolean;
  representativeCompanies?: Company[];
}

export interface RecommendedProductWithReason extends FinancialProduct {
  recommendationReasons: string[];
}

export type PageView = 'home' | 'diagnosis' | 'smsAuth' | 'verification' | 'results' | 'loginSelection' | 'traditionalLogin' | 'supabaseLogin' | 'adminDashboard' | 'registrationRequest' | 'changePassword' | 'passwordReset';

export interface UserSessionData {
  id: string; // Unique ID for the session
  timestamp: string; // ISO string format
  phoneNumber: string;
  diagnosisAnswers: DiagnosisFormState;
  smsVerified?: boolean; // SMS認証済みフラグ
  verifiedPhoneNumber?: string; // 認証済み電話番号
  verificationTimestamp?: string; // 認証完了時刻
}

// Notification Settings Types
export interface NotificationChannelConfig {
  enabled: boolean;
  // Common fields can be added here if any
}

export interface EmailNotificationConfig extends NotificationChannelConfig {
  recipientEmails: string; // Comma-separated
}

export interface SlackNotificationConfig extends NotificationChannelConfig {
  webhookUrl: string;
  channel: string;
}

export interface LineNotificationConfig extends NotificationChannelConfig {
  accessToken: string; // Placeholder for demo
}

export interface ChatWorkNotificationConfig extends NotificationChannelConfig {
  apiToken: string;    // Placeholder for demo
  roomId: string;
}

export interface NotificationSettings {
  email: EmailNotificationConfig;
  slack: SlackNotificationConfig;
  line: LineNotificationConfig;
  chatwork: ChatWorkNotificationConfig;
}

export interface LegalLink {
  id: number;
  link_type: 'privacy_policy' | 'terms_of_service' | 'specified_commercial_transactions' | 'company_info';
  title: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}