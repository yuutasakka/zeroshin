import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase設定 - import.meta.envを使用
const getEnvVar = (viteVar: string, fallback: string) => {
  // import.meta.env から取得
  const value = (import.meta as any).env?.[viteVar];
  if (value) {
    return value;
  }
  
  return fallback;
};

const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL',
  'https://eqirzbuqgymrtnfmvwhq.supabase.co'
);

// セキュリティ向上: 本番環境ではハードコードされたキーを削除
const supabaseAnonKey = (() => {
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY', '');
  
  // 本番環境での機密情報チェック
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';
  
  if (isProduction && !key) {
    console.error('🚨 CRITICAL: VITE_SUPABASE_ANON_KEY environment variable is missing in production!');
    throw new Error('Supabase configuration is required in production environment');
  }
  
  // 開発環境でのフォールバック（開発用のみ）
  if (!key && !isProduction) {
    console.warn('⚠️ Using development Supabase key. Set VITE_SUPABASE_ANON_KEY for production.');
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXJ6YnVxZ3ltcnRuZm12d2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1Mjg1MTEsImV4cCI6MjA1MTEwNDUxMX0.bYgWmKdC9YMpuHhBEcmDfzQpO8j5qQWHnSPyLyKCyQE';
  }
  
  return key;
})();

console.log('🚀 Supabaseクライアント初期化', { 
  url: supabaseUrl, 
  keyPrefix: supabaseAnonKey.substring(0, 10) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 管理者認証情報の型定義
export interface AdminCredentials {
  id: number;
  username: string;
  password_hash: string;
  phone_number: string;
  backup_code: string;
  is_active: boolean;
  failed_attempts: number;
  locked_until?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  password_changed_at: string;
  requires_password_change: boolean;
}

// 管理者ログイン試行履歴の型定義
export interface AdminLoginAttempt {
  id: number;
  username: string;
  success: boolean;
  failure_reason?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at: string;
}

// 監査ログの型定義
export interface AuditLog {
  id: number;
  event_type: string;
  username?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}

// Supabase管理者認証関数
export class SupabaseAdminAuth {
  // 管理者認証情報を取得
  static async getAdminCredentials(username: string): Promise<AdminCredentials | null> {
    try {
      console.log('🔍 getAdminCredentials開始', { username, supabaseUrl, supabaseAnonKey: supabaseAnonKey.substring(0, 10) + '...' });
      
      console.log('🗃️ Supabaseクエリ実行中...');
      const { data, error } = await supabase
        .from('admin_credentials')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ 管理者認証情報取得エラー:', error);
        return null;
      }

      console.log('✅ Supabase認証情報取得成功', { username: data?.username, isActive: data?.is_active });
      return data;
    } catch (error) {
      console.error('💥 Supabase接続エラー:', error);
      return null;
    }
  }

  // ログイン試行を記録
  static async recordLoginAttempt(
    username: string,
    success: boolean,
    failureReason?: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_login_attempts')
        .insert({
          username,
          success,
          failure_reason: failureReason,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId
        });

      if (error) {
        console.error('ログイン試行記録エラー:', error);
      }
    } catch (error) {
      console.error('ログイン試行記録失敗:', error);
    }
  }

  // 失敗回数を更新
  static async updateFailedAttempts(username: string, attempts: number, lockUntil?: Date): Promise<void> {
    try {
      const updateData: any = {
        failed_attempts: attempts,
        updated_at: new Date().toISOString()
      };

      if (lockUntil) {
        updateData.locked_until = lockUntil.toISOString();
      }

      const { error } = await supabase
        .from('admin_credentials')
        .update(updateData)
        .eq('username', username);

      if (error) {
        console.error('失敗回数更新エラー:', error);
      }
    } catch (error) {
      console.error('失敗回数更新失敗:', error);
    }
  }

  // ログイン成功時の更新
  static async updateSuccessfulLogin(username: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_credentials')
        .update({
          failed_attempts: 0,
          locked_until: null,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('username', username);

      if (error) {
        console.error('ログイン成功更新エラー:', error);
      }
    } catch (error) {
      console.error('ログイン成功更新失敗:', error);
    }
  }

  // 監査ログを記録
  static async recordAuditLog(
    eventType: string,
    description: string,
    username?: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: eventType,
          username,
          description,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata,
          severity
        });

      if (error) {
        console.error('監査ログ記録エラー:', error);
      }
    } catch (error) {
      console.error('監査ログ記録失敗:', error);
    }
  }

  // パスワードハッシュ化（bcrypt - セキュア版）
  static async hashPassword(password: string): Promise<string> {
    console.log('🔐 hashPassword開始（bcrypt）', { passwordLength: password.length });
    
    try {
      // bcryptを使用してソルト付きでハッシュ化（10ラウンド）
      const bcrypt = await import('bcrypt');
      const saltRounds = 12; // 本番環境では12ラウンド推奨
      const hash = await bcrypt.hash(password, saltRounds);
      
      console.log('🔐 bcryptハッシュ化完了', { 
        resultLength: hash.length,
        resultPrefix: hash.substring(0, 10) + '...'
      });
      
      return hash;
    } catch (error) {
      console.error('💥 bcryptハッシュ化エラー:', error);
      // フォールバック: 強化されたSHA-256（ソルト付き）
      console.warn('⚠️ bcrypt失敗、強化SHA-256にフォールバック');
      
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const saltBase64 = btoa(String.fromCharCode(...salt));
      const saltedPassword = password + saltBase64;
      
      const encoder = new TextEncoder();
      const data = encoder.encode(saltedPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // ソルトとハッシュを結合して保存
      return `sha256$${saltBase64}$${hashHex}`;
    }
  }

  // パスワード検証（bcrypt対応版）
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      console.log('🔑 verifyPassword開始（bcrypt対応）', { 
        passwordLength: password.length, 
        hashLength: hash.length,
        hashPrefix: hash.substring(0, 10) + '...'
      });
      
      // bcryptハッシュかどうかを判定
      if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        // bcryptでの検証
        const bcrypt = await import('bcrypt');
        const isValid = await bcrypt.compare(password, hash);
        
        console.log('🔑 bcryptパスワード検証結果', { isValid });
        return isValid;
      } 
      // 強化SHA-256（ソルト付き）の検証
      else if (hash.startsWith('sha256$')) {
        const parts = hash.split('$');
        if (parts.length !== 3) return false;
        
        const salt = parts[1];
        const expectedHash = parts[2];
        const saltedPassword = password + salt;
        
        const encoder = new TextEncoder();
        const data = encoder.encode(saltedPassword);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const isValid = computedHash === expectedHash;
        console.log('🔑 強化SHA-256パスワード検証結果', { isValid });
        return isValid;
      }
      // 従来のSHA-256（後方互換性）
      else {
        console.warn('⚠️ 従来のSHA-256ハッシュ検出 - アップグレード推奨');
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const isValid = hashedInput === hash;
        
        console.log('🔑 従来SHA-256パスワード検証結果', { isValid });
        return isValid;
      }
    } catch (error) {
      console.error('💥 パスワード検証エラー:', error);
      return false;
    }
  }
}

// 診断履歴管理クラス
export class DiagnosisSessionManager {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  // 電話番号の重複チェック
  async checkPhoneNumberUsage(phoneNumber: string): Promise<boolean> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      
      const { data, error } = await this.supabase
        .from('diagnosis_sessions')
        .select('id')
        .eq('phone_number', normalizedPhone)
        .eq('sms_verified', true)
        .limit(1);

      if (error) {
        console.error('電話番号重複チェックエラー:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('電話番号重複チェック例外:', error);
      return false;
    }
  }

  // 新しい診断セッションを作成
  async createDiagnosisSession(phoneNumber: string, diagnosisAnswers: any): Promise<string | null> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await this.supabase
        .from('diagnosis_sessions')
        .insert({
          phone_number: normalizedPhone,
          diagnosis_answers: diagnosisAnswers,
          session_id: sessionId,
          sms_verified: false
        })
        .select('session_id')
        .single();

      if (error) {
        console.error('診断セッション作成エラー:', error);
        return null;
      }

      return data?.session_id || null;
    } catch (error) {
      console.error('診断セッション作成例外:', error);
      return null;
    }
  }

  // SMS認証完了時にセッションを更新
  async updateSessionVerification(sessionId: string, phoneNumber: string): Promise<boolean> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      const { error } = await this.supabase
        .from('diagnosis_sessions')
        .update({
          sms_verified: true,
          verification_timestamp: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('phone_number', normalizedPhone);

      if (error) {
        console.error('セッション認証更新エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('セッション認証更新例外:', error);
      return false;
    }
  }

  // 認証済みセッション履歴を取得
  async getVerifiedSessions(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('diagnosis_sessions')
        .select('*')
        .eq('sms_verified', true)
        .order('verification_timestamp', { ascending: false });

      if (error) {
        console.error('認証済みセッション取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('認証済みセッション取得例外:', error);
      return [];
    }
  }

  // 特定の電話番号の最新の認証済みセッションを取得
  async getLatestVerifiedSession(phoneNumber: string): Promise<any | null> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      const { data, error } = await this.supabase
        .from('diagnosis_sessions')
        .select('*')
        .eq('phone_number', normalizedPhone)
        .eq('sms_verified', true)
        .order('verification_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('最新認証セッション取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('最新認証セッション取得例外:', error);
      return null;
    }
  }

  // セッションIDで診断データを取得
  async getDiagnosisSession(sessionId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('diagnosis_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        console.error('診断セッション取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('診断セッション取得例外:', error);
      return null;
    }
  }
}

// 診断セッション管理のインスタンスをエクスポート
export const diagnosisManager = new DiagnosisSessionManager(); 