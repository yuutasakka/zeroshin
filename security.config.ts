// セキュリティ設定の中央管理
export const SECURITY_CONFIG = {
  // 暗号化設定
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production environment');
    }
    return 'dev-only-key-change-in-production-32';
  })(),
  
  // JWT設定
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
    return 'dev-only-jwt-secret-32-characters';
  })(),
  
  // セッション設定
  SESSION_SECRET: process.env.SESSION_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production environment');
    }
    return 'dev-only-session-secret-32-chars';
  })(),
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分
  
  // ログイン制限
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分
  
  // パスワード要件
  PASSWORD_MIN_LENGTH: 8,
  
  // 2FA設定
  REQUIRE_2FA: false,
  
  // 本番環境判定
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // デバッグログ制御
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV !== 'production',
};

// Supabase設定の中央管理
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be set in production environment');
    }
    console.warn('⚠️ Using empty Supabase URL in development. Set VITE_SUPABASE_URL environment variable.');
    return '';
  })(),
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in production environment');
    }
    console.warn('⚠️ Using empty Supabase anon key in development. Set VITE_SUPABASE_ANON_KEY environment variable.');
    return '';
  })(),
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY) || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set in production environment');
    }
    console.warn('⚠️ Using empty Supabase service role key in development. Set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.');
    return '';
  })()
};

// セキュアなログ出力関数
export const secureLog = (message: string, data?: any) => {
  if (SECURITY_CONFIG.ENABLE_DEBUG_LOGS) {
    if (data && typeof data === 'object') {
      // 機密情報をマスクしてログ出力
      const sanitizedData = sanitizeForLog(data);
      console.log(message, sanitizedData);
    } else {
      console.log(message);
    }
  }
};

// ログ出力用のデータサニタイズ
const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];

const sanitizeForLog = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitiveKey => keyLower.includes(sensitiveKey));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export default SECURITY_CONFIG; 