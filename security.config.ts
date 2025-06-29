// セキュリティ設定の中央管理（完全Supabaseベース）

// Vite環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_ENCRYPTION_KEY?: string;
  readonly VITE_JWT_SECRET?: string;
  readonly VITE_SESSION_SECRET?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export const SECURITY_CONFIG = {
  // 暗号化設定（本番では必須）
  ENCRYPTION_KEY: (() => {
    // Vite環境変数を最優先
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENCRYPTION_KEY) {
      return (import.meta as any).env.VITE_ENCRYPTION_KEY;
    }
    
    // 従来のNode.js環境変数
    if (process.env.ENCRYPTION_KEY) {
      return process.env.ENCRYPTION_KEY;
    }
    
         // 本番環境チェック
     const isProduction = process.env.NODE_ENV === 'production' || 
                         (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'production') ||
                         (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
     
     if (isProduction) {
       console.error('🚨 CRITICAL: VITE_ENCRYPTION_KEY environment variable is missing in production!');
       console.error('📋 Please set the following environment variables in Vercel:');
       console.error('- VITE_ENCRYPTION_KEY');
       console.error('- VITE_JWT_SECRET');
       console.error('- VITE_SESSION_SECRET');
       console.error('- GEMINI_API_KEY');
       console.error('Run: npm run generate-keys to generate secure keys');
       
       // 本番環境では致命的エラーを発生
       throw new Error('VITE_ENCRYPTION_KEY is required in production environment');
     }
    
    // 開発環境でのみフォールバック
    const devKey = process.env.DEV_ENCRYPTION_KEY || `dev-encryption-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    console.warn('⚠️ Using development encryption key. Set VITE_ENCRYPTION_KEY for production.');
    return devKey;
  })(),
  
  // JWT設定（本番では必須）
  JWT_SECRET: (() => {
    // Vite環境変数を最優先
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_JWT_SECRET) {
      return (import.meta as any).env.VITE_JWT_SECRET;
    }
    
    // 従来のNode.js環境変数
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }
    
    // 本番環境チェック
    const isProduction = process.env.NODE_ENV === 'production' || 
                        (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'production') ||
                        (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
    
    if (isProduction) {
      console.error('🚨 CRITICAL: VITE_JWT_SECRET environment variable is missing in production!');
      throw new Error('VITE_JWT_SECRET is required in production environment');
    }
    
    // 開発環境でのみフォールバック
    const devKey = process.env.DEV_JWT_SECRET || `dev-jwt-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    console.warn('⚠️ Using development JWT secret. Set VITE_JWT_SECRET for production.');
    return devKey;
  })(),
  
  // セッション設定（本番では必須）
  SESSION_SECRET: (() => {
    // Vite環境変数を最優先
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SESSION_SECRET) {
      return (import.meta as any).env.VITE_SESSION_SECRET;
    }
    
    // 従来のNode.js環境変数
    if (process.env.SESSION_SECRET) {
      return process.env.SESSION_SECRET;
    }
    
    // 本番環境チェック
    const isProduction = process.env.NODE_ENV === 'production' || 
                        (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'production') ||
                        (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
    
    if (isProduction) {
      console.error('🚨 CRITICAL: VITE_SESSION_SECRET environment variable is missing in production!');
      throw new Error('VITE_SESSION_SECRET is required in production environment');
    }
    
    // 開発環境でのみフォールバック
    const devKey = process.env.DEV_SESSION_SECRET || `dev-session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    console.warn('⚠️ Using development session secret. Set VITE_SESSION_SECRET for production.');
    return devKey;
  })(),
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分
  
  // ログイン制限
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分
  
  // パスワード要件
  PASSWORD_MIN_LENGTH: 12, // より強力なパスワード要件
  
  // 2FA設定
  REQUIRE_2FA: true, // 本番では2FA必須
  
  // 本番環境判定
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // デバッグログ制御
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV !== 'production',
  
  // IPアドレス制限設定
  SMS_RATE_LIMIT_PER_IP: 3, // IP毎のSMS送信回数制限
  SMS_RATE_LIMIT_WINDOW: 60 * 60 * 1000, // 1時間
  
  // API設定
  API_BASE_URL: process.env.API_BASE_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-api-domain.com' 
      : 'http://localhost:8080'
  ),
  
  // セキュリティAPI設定
  SECURITY_APIS: {
    // 脆弱性スキャン
    SNYK: {
      enabled: !!process.env.SNYK_API_TOKEN,
      apiKey: process.env.SNYK_API_TOKEN,
      baseUrl: 'https://api.snyk.io/v1'
    },
    VIRUSTOTAL: {
      enabled: !!process.env.VIRUSTOTAL_API_KEY,
      apiKey: process.env.VIRUSTOTAL_API_KEY,
      baseUrl: 'https://www.virustotal.com/vtapi/v2'
    },
    NIST_NVD: {
      enabled: !!process.env.NIST_NVD_API_KEY,
      apiKey: process.env.NIST_NVD_API_KEY,
      baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0'
    },
    
    // ペネトレーションテスト
    OWASP_ZAP: {
      enabled: !!process.env.OWASP_ZAP_API_KEY,
      apiKey: process.env.OWASP_ZAP_API_KEY,
      baseUrl: 'http://localhost:8080' // ZAP proxy
    },
    SHODAN: {
      enabled: !!process.env.SHODAN_API_KEY,
      apiKey: process.env.SHODAN_API_KEY,
      baseUrl: 'https://api.shodan.io'
    },
    
    // コンプライアンス
    SECURITY_SCORECARD: {
      enabled: !!process.env.SECURITY_SCORECARD_API_KEY,
      apiKey: process.env.SECURITY_SCORECARD_API_KEY,
      baseUrl: 'https://api.securityscorecard.io'
    },
    THREATSTACK: {
      enabled: !!process.env.THREATSTACK_API_KEY,
      apiKey: process.env.THREATSTACK_API_KEY,
      baseUrl: 'https://api.threatstack.com/v2'
    },
    
    // AI分析（オプション）
    OPENAI: {
      enabled: !!process.env.OPENAI_API_KEY,
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1'
    },
    ANTHROPIC: {
      enabled: !!process.env.ANTHROPIC_API_KEY,
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com/v1'
    }
  },
  
  // SMS/Twilio設定
  SMS_CONFIG: {
    enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  
  // 通知設定
  NOTIFICATIONS: {
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      webhookUrl: process.env.SLACK_WEBHOOK_URL
    },
    discord: {
      enabled: !!process.env.DISCORD_WEBHOOK_URL,
      webhookUrl: process.env.DISCORD_WEBHOOK_URL
    },
    email: {
      enabled: !!process.env.EMAIL_SERVICE_API_KEY,
      apiKey: process.env.EMAIL_SERVICE_API_KEY
    }
  }
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

// セキュアな設定管理クラス
export class SecureConfigManager {
  private static cache = new Map<string, { value: any; expiry: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5分キャッシュ

  // Supabaseから安全に設定を取得
  static async getSecureConfig(key: string): Promise<string | null> {
    try {
      // Supabase URLが設定されていない場合はnullを返す
      if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === '') {
        console.warn(`⚠️ Supabase URL not configured, returning null for key: ${key}`);
        return null;
      }

      // キャッシュチェック
      const cached = this.cache.get(key);
      if (cached && Date.now() < cached.expiry) {
        return cached.value;
      }

      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/secure_config?key=eq.${key}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'apikey': SUPABASE_CONFIG.serviceRoleKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const data = await response.json();
      const value = data[0]?.value || null;

      // キャッシュに保存
      if (value) {
        this.cache.set(key, { value, expiry: Date.now() + this.CACHE_TTL });
      }

      return value;
    } catch (error) {
      console.error(`Failed to get secure config for key: ${key}`, error);
      return null;
    }
  }

  // 管理者認証情報を安全に取得
  static async getAdminCredentials(): Promise<any> {
    try {
      // Supabase URLが設定されていない場合はnullを返す
      if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === '') {
        console.warn('⚠️ Supabase URL not configured, returning null for admin credentials');
        return null;
      }

      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/admin_credentials?username=eq.admin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'apikey': SUPABASE_CONFIG.serviceRoleKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin credentials: ${response.status}`);
      }

      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      console.error('Failed to get admin credentials:', error);
      return null;
    }
  }

  // 管理者認証情報を安全に更新
  static async updateAdminCredentials(updates: any): Promise<boolean> {
    try {
      // Supabase URLが設定されていない場合はfalseを返す
      if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === '') {
        console.warn('⚠️ Supabase URL not configured, cannot update admin credentials');
        return false;
      }

      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/admin_credentials?username=eq.admin`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'apikey': SUPABASE_CONFIG.serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update admin credentials: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to update admin credentials:', error);
      return false;
    }
  }

  // JWT秘密鍵を安全に取得
  static async getJWTSecret(): Promise<string> {
    const secret = await this.getSecureConfig('jwt_secret');
    if (!secret) {
      if (SECURITY_CONFIG.IS_PRODUCTION) {
        throw new Error('JWT secret not found in production');
      }
      return SECURITY_CONFIG.JWT_SECRET;
    }
    return secret;
  }

  // 暗号化キーを安全に取得
  static async getEncryptionKey(): Promise<string> {
    const key = await this.getSecureConfig('encryption_key');
    if (!key) {
      if (SECURITY_CONFIG.IS_PRODUCTION) {
        throw new Error('Encryption key not found in production');
      }
      return SECURITY_CONFIG.ENCRYPTION_KEY;
    }
    return key;
  }

  // キャッシュクリア
  static clearCache(): void {
    this.cache.clear();
  }
}

// セキュアなログ出力（本番環境では完全無効化）
export const secureLog = (message: string, data?: any) => {
  // 本番環境では一切ログを出力しない
  const isProduction = process.env.NODE_ENV === 'production' || 
                      (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'production') ||
                      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
  
  if (isProduction) {
    return; // 本番環境では何も出力しない
  }

  if (!SECURITY_CONFIG.ENABLE_DEBUG_LOGS) {
    return; // 開発環境でもデバッグが無効の場合は出力しない
  }

  // 機密情報をマスクするキーワード
  const sensitiveKeywords = [
    'password', 'secret', 'key', 'token', 'credential', 'auth',
    'api_key', 'private', 'confidential', 'hash', 'salt'
  ];

  let maskedData = data;
  if (data && typeof data === 'object') {
    maskedData = { ...data };
    
    // オブジェクトの各プロパティをチェック
    Object.keys(maskedData).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeywords.some(keyword => lowerKey.includes(keyword))) {
        if (typeof maskedData[key] === 'string' && maskedData[key].length > 0) {
          // 最初の2文字と最後の2文字以外をマスク
          const value = maskedData[key];
          if (value.length <= 4) {
            maskedData[key] = '*'.repeat(value.length);
          } else {
            maskedData[key] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
          }
        } else {
          maskedData[key] = '[PROTECTED]';
        }
      }
    });
  }

  // メッセージ内の機密情報もマスク
  let maskedMessage = message;
  sensitiveKeywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword}[\\s]*[:=][\\s]*['"\\s]*)(\\S+)`, 'gi');
    maskedMessage = maskedMessage.replace(regex, '$1[PROTECTED]');
  });

  console.log(`[MoneyTicket Security] ${maskedMessage}`, maskedData);
};

// CSRFトークン生成
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// セキュアなランダム文字列生成
export const generateSecureRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
};

// 入力値検証
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },
  
  phone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },
  
  username: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  },
  
  password: (password: string): boolean => {
    // 最低8文字、大文字・小文字・数字・特殊文字を含む
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= 8 && hasLower && hasUpper && hasNumber && hasSpecial;
  },
  
  // XSS攻撃防止
  sanitizeHtml: (input: string): string => {
    if (!input) return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
};

// レート制限管理
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  static isAllowed(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // 古いリクエストを削除
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  static reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export default SECURITY_CONFIG; 