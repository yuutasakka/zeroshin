// 本番環境用セキュリティ設定テンプレート
// 本番環境デプロイ時は、このファイルをコピーして security.config.prod.ts として使用
// ※ 本ファイルは直接編集せず、security.config.prod.ts に機密情報を設定してください

export const PRODUCTION_SECURITY_CONFIG = {
  // 本番環境の暗号化設定（環境変数から取得）
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'CHANGE_ME_TO_SECURE_32_CHAR_STRING',
  
  // JWT設定（本番環境では必ず変更）
  JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_ME_TO_SECURE_JWT_SECRET_KEY',
  
  // セッション設定（本番環境では必ず変更）
  SESSION_SECRET: process.env.SESSION_SECRET || 'CHANGE_ME_TO_SECURE_SESSION_SECRET',
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分
  
  // ログイン制限（本番環境では厳格化）
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30分
  
  // パスワード要件（本番環境では厳格化）
  PASSWORD_MIN_LENGTH: 12,
  
  // 2FA設定（本番環境では有効化推奨）
  REQUIRE_2FA: true,
  
  // 本番環境フラグ
  IS_PRODUCTION: true,
  
  // デバッグログ無効化
  ENABLE_DEBUG_LOGS: false,
  
  // HTTPS強制
  FORCE_HTTPS: true,
  
  // セキュリティヘッダー設定
  SECURITY_HEADERS: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
};

// 本番環境用Supabase設定テンプレート
export const PRODUCTION_SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_PRODUCTION_SUPABASE_URL',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_PRODUCTION_SUPABASE_ANON_KEY',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_PRODUCTION_SUPABASE_SERVICE_ROLE_KEY'
};

// 本番環境セットアップチェックリスト
export const PRODUCTION_CHECKLIST = [
  '✅ 環境変数の設定完了',
  '✅ 暗号化キーの変更完了',
  '✅ デフォルトパスワードの変更完了',
  '✅ 2FA設定の有効化完了',
  '✅ HTTPSの設定完了',
  '✅ セキュリティヘッダーの設定完了',
  '✅ デバッグログの無効化完了',
  '✅ ファイアウォール設定完了',
  '✅ バックアップ戦略の確立完了',
  '✅ ログ監視の設定完了'
];

console.warn('⚠️ 本番環境デプロイ前に上記チェックリストを確認してください');
console.warn('⚠️ security.config.prod.ts に機密情報を設定してください');

export default PRODUCTION_SECURITY_CONFIG; 