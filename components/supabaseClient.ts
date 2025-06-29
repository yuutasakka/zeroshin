import { createClient } from '@supabase/supabase-js';

// Supabase設定 - 複数の環境変数形式に対応
const getEnvVar = (viteVar: string, reactVar: string, fallback: string) => {
  console.log('🌍 環境変数取得開始', { viteVar, reactVar, fallback });
  
  // Vite環境変数の取得（windowオブジェクト経由）
  if (typeof window !== 'undefined') {
    // ブラウザ環境
    const viteEnv = (window as any).__VITE_ENV__ || {};
    if (viteEnv[viteVar]) {
      console.log('✅ Vite環境変数から取得', { viteVar, value: viteEnv[viteVar].substring(0, 20) + '...' });
      return viteEnv[viteVar];
    }
    
    // window.importMetaEnvからの取得を試行
    const windowImportMeta = (window as any).importMetaEnv || {};
    if (windowImportMeta[viteVar]) {
      console.log('✅ window.importMetaEnvから取得', { viteVar, value: windowImportMeta[viteVar].substring(0, 20) + '...' });
      return windowImportMeta[viteVar];
    }
  }
  
  // process.env からの取得
  if (typeof process !== 'undefined' && process.env) {
    const processValue = process.env[viteVar] || process.env[reactVar];
    if (processValue) {
      console.log('✅ process.envから取得', { var: viteVar || reactVar, value: processValue.substring(0, 20) + '...' });
      return processValue;
    }
  }
  
  console.log('⚠️ フォールバック値使用', { fallback });
  return fallback;
};

const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL',
  'REACT_APP_SUPABASE_URL',
  'https://your-project.supabase.co'
);

const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'REACT_APP_SUPABASE_ANON_KEY',
  'your-anon-key'
);

console.log('🚀 Supabaseクライアント初期化', { 
  url: supabaseUrl, 
  keyPrefix: supabaseAnonKey.substring(0, 10) + '...',
  isDemo: supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key'
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
      
      // デモモード（Supabaseが設定されていない場合）
      if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
        console.log('🎭 デモモード: Supabaseが設定されていないため、デモ認証情報を使用します');
        
        // デモ用の管理者認証情報
        if (username === 'admin') {
          const demoCredentials = {
            id: 1,
            username: 'admin',
            password_hash: '8cb3b12639ecacf3fe86a6cd67b1e1b2a277fc26b4ecd42e381a1327bb68390e', // G3MIZAu74IvkH7NK
            phone_number: '+819012345678',
            backup_code: 'MT-DEMO-BACKUP',
            is_active: true,
            failed_attempts: 0,
            locked_until: undefined,
            last_login: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            password_changed_at: new Date().toISOString(),
            requires_password_change: false
          };
          console.log('✅ デモ認証情報返却', demoCredentials);
          return demoCredentials;
        }
        console.log('❌ デモモード: 該当ユーザーなし');
        return null;
      }

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
      // デモモードの場合はローカルに記録
      if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
        console.log('デモモード: ログイン試行記録', {
          username,
          success,
          failureReason,
          userAgent,
          timestamp: new Date().toISOString()
        });
        return;
      }

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
      // デモモードの場合はローカルストレージに記録
      if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
        console.log('デモモード: 失敗回数更新', { username, attempts, lockUntil });
        return;
      }

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
      // デモモードの場合はローカルに記録
      if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
        console.log('デモモード: ログイン成功更新', { username, timestamp: new Date().toISOString() });
        return;
      }

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
      // デモモードの場合はコンソールに記録
      if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
        console.log(`デモモード: 監査ログ [${severity.toUpperCase()}]`, {
          eventType,
          description,
          username,
          metadata,
          userAgent,
          timestamp: new Date().toISOString()
        });
        return;
      }

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

  // パスワードハッシュ化（SHA-256）
  static async hashPassword(password: string): Promise<string> {
    console.log('🔐 hashPassword開始', { passwordLength: password.length });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('🔐 hashPassword完了', { 
      resultLength: hashHex.length,
      resultPrefix: hashHex.substring(0, 10) + '...'
    });
    
    return hashHex;
  }

  // パスワード検証
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      console.log('🔑 verifyPassword開始', { 
        passwordLength: password.length, 
        hashLength: hash.length,
        hashPrefix: hash.substring(0, 10) + '...'
      });
      
      const hashedInput = await this.hashPassword(password);
      const isValid = hashedInput === hash;
      
      console.log('🔑 パスワード検証結果', { 
        inputHash: hashedInput.substring(0, 10) + '...',
        expectedHash: hash.substring(0, 10) + '...',
        isValid 
      });
      
      return isValid;
    } catch (error) {
      console.error('💥 パスワード検証エラー:', error);
      return false;
    }
  }
} 