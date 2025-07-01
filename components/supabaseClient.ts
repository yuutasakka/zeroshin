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
  'https://your-project.supabase.co'
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
    return 'your-supabase-anon-key';
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

  // 新規管理者認証情報を作成
  static async createAdminCredentials(credentials: {
    username: string;
    password: string;
    phone_number: string;
    is_active: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 新規管理者認証情報作成開始', { username: credentials.username });
      
      // ユーザー名の重複チェック
      const existingUser = await this.getAdminCredentials(credentials.username);
      if (existingUser) {
        return { success: false, error: 'このユーザー名は既に使用されています。' };
      }

      // パスワードをハッシュ化
      const passwordHash = await this.hashPassword(credentials.password);
      
      // バックアップコードを生成
      const backupCode = `BACKUP-${credentials.username.toUpperCase()}-${Date.now()}`;

      // Supabaseに新規管理者を作成
      const { data, error } = await supabase
        .from('admin_credentials')
        .insert({
          username: credentials.username,
          password_hash: passwordHash,
          phone_number: credentials.phone_number,
          backup_code: backupCode,
          is_active: credentials.is_active,
          failed_attempts: 0,
          requires_password_change: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          password_changed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 管理者認証情報作成エラー:', error);
        
        // エラーの種類に応じたメッセージを返す
        if (error.code === '23505') { // PostgreSQL unique violation
          return { success: false, error: 'このユーザー名は既に使用されています。' };
        }
        
        return { success: false, error: 'データベースエラーが発生しました。' };
      }

      console.log('✅ 新規管理者認証情報作成成功', { username: credentials.username, id: data.id });
      return { success: true };
    } catch (error) {
      console.error('💥 管理者認証情報作成失敗:', error);
      return { success: false, error: '予期しないエラーが発生しました。' };
    }
  }

  // パスワードハッシュ化（bcrypt - セキュア版）
  static async hashPassword(password: string): Promise<string> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = !isProduction;
    
    if (isDevelopment) {
      console.log('🔐 hashPassword開始（bcrypt）', { passwordLength: password.length });
    }
    
    try {
      // bcryptを使用してソルト付きでハッシュ化（10ラウンド）
      const bcrypt = await import('bcrypt');
      const saltRounds = 12; // 本番環境では12ラウンド推奨
      const hash = await bcrypt.hash(password, saltRounds);
      
      if (isDevelopment) {
        console.log('🔐 bcryptハッシュ化完了', { 
          resultLength: hash.length,
          resultPrefix: hash.substring(0, 10) + '...'
        });
      }
      
      return hash;
    } catch (error) {
      if (isDevelopment) {
        console.error('💥 bcryptハッシュ化エラー:', error);
        console.warn('⚠️ bcrypt失敗、強化SHA-256にフォールバック');
      }
      
      // フォールバック: 強化されたSHA-256（ソルト付き）
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
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = !isProduction;
    
    try {
      if (isDevelopment) {
        console.log('🔑 verifyPassword開始（bcrypt対応）', { 
          passwordLength: password.length, 
          hashLength: hash.length,
          hashPrefix: hash.substring(0, 10) + '...'
        });
      }
      
      // bcryptハッシュかどうかを判定
      if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        // bcryptでの検証
        const bcrypt = await import('bcrypt');
        const isValid = await bcrypt.compare(password, hash);
        
        if (isDevelopment) {
          console.log('🔑 bcryptパスワード検証結果', { isValid });
        }
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
        if (isDevelopment) {
          console.log('🔑 強化SHA-256パスワード検証結果', { isValid });
        }
        return isValid;
      }
      // 従来のSHA-256（後方互換性）
      else {
        // 本番環境でデフォルトハッシュ検出時の警告
        const defaultHashes = [
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // CHANGE_IN_PRODUCTION
          '8cb3b12639ecacf3fe86a6cd67b1e1b2a277fc26b4ecd42e381a1327bb68390e' // G3MIZAu74IvkH7NK
        ];
        
        if (isProduction && defaultHashes.includes(hash)) {
          console.error('🚨 CRITICAL SECURITY WARNING: デフォルトパスワードハッシュが検出されました！本番環境では必ず変更してください！');
          throw new Error('Default password detected in production environment');
        }
        
        if (isDevelopment) {
          console.warn('⚠️ 従来のSHA-256ハッシュ検出 - アップグレード推奨');
        }
        
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const isValid = hashedInput === hash;
        
        if (isDevelopment) {
          console.log('🔑 従来SHA-256パスワード検証結果', { isValid });
        }
        return isValid;
      }
    } catch (error) {
      if (isDevelopment) {
        console.error('💥 パスワード検証エラー:', error);
      }
      return false;
    }
  }
}

// 診断履歴管理クラス
export class DiagnosisSessionManager {
  private supabase: SupabaseClient;
  private readonly STORAGE_KEY = 'diagnosis_sessions_backup';

  constructor() {
    this.supabase = supabase;
  }

  // ローカルストレージのバックアップ機能
  private getLocalSessions(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('ローカルセッション取得エラー:', error);
      return [];
    }
  }

  private saveToLocalStorage(session: any): void {
    try {
      const sessions = this.getLocalSessions();
      const existingIndex = sessions.findIndex(s => s.session_id === session.session_id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('ローカルセッション保存エラー:', error);
    }
  }

  // Supabaseが利用可能かチェック
  private async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('diagnosis_sessions')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.warn('Supabase接続不可、ローカルストレージを使用:', error);
      return false;
    }
  }

  // 電話番号の重複チェック
  async checkPhoneNumberUsage(phoneNumber: string): Promise<boolean> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      
      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .select('id')
          .eq('phone_number', normalizedPhone)
          .eq('sms_verified', true)
          .limit(1);

        if (!error && data) {
          return data.length > 0;
        }
      }
      
      // フォールバック: ローカルストレージをチェック
      const localSessions = this.getLocalSessions();
      return localSessions.some(session => 
        session.phone_number === normalizedPhone && session.sms_verified === true
      );
    } catch (error) {
      console.error('電話番号重複チェック例外:', error);
      
      // ローカルストレージのフォールバック
      const localSessions = this.getLocalSessions();
      return localSessions.some(session => 
        session.phone_number === phoneNumber.replace(/\D/g, '') && session.sms_verified === true
      );
    }
  }

  // 新しい診断セッションを作成
  async createDiagnosisSession(phoneNumber: string, diagnosisAnswers: any): Promise<string | null> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sessionData = {
        id: sessionId,
        phone_number: normalizedPhone,
        diagnosis_answers: diagnosisAnswers,
        session_id: sessionId,
        sms_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .insert(sessionData)
          .select('session_id')
          .single();

        if (!error && data) {
          // ローカルストレージにもバックアップ
          this.saveToLocalStorage(sessionData);
          return data.session_id;
        }
      }
      
      // フォールバック: ローカルストレージのみ
      console.warn('Supabase利用不可、ローカルストレージに保存');
      this.saveToLocalStorage(sessionData);
      return sessionId;
    } catch (error) {
      console.error('診断セッション作成例外:', error);
      
      // エラー時もローカルストレージにフォールバック
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionData = {
        id: sessionId,
        phone_number: phoneNumber.replace(/\D/g, ''),
        diagnosis_answers: diagnosisAnswers,
        session_id: sessionId,
        sms_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.saveToLocalStorage(sessionData);
      return sessionId;
    }
  }

  // SMS認証完了時にセッションを更新
  async updateSessionVerification(sessionId: string, phoneNumber: string): Promise<boolean> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const updateData = {
        sms_verified: true,
        verification_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { error } = await this.supabase
          .from('diagnosis_sessions')
          .update(updateData)
          .eq('session_id', sessionId)
          .eq('phone_number', normalizedPhone);

        if (!error) {
          // ローカルストレージも更新
          const sessions = this.getLocalSessions();
          const sessionIndex = sessions.findIndex(s => s.session_id === sessionId);
          if (sessionIndex >= 0) {
            sessions[sessionIndex] = { ...sessions[sessionIndex], ...updateData };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
          }
          return true;
        }
      }
      
      // フォールバック: ローカルストレージのみ更新
      console.warn('Supabase利用不可、ローカルストレージを更新');
      const sessions = this.getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s.session_id === sessionId);
      
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = { ...sessions[sessionIndex], ...updateData };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('セッション認証更新例外:', error);
      
      // エラー時もローカルストレージで試行
      const sessions = this.getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s.session_id === sessionId);
      
      if (sessionIndex >= 0) {
        sessions[sessionIndex].sms_verified = true;
        sessions[sessionIndex].verification_timestamp = new Date().toISOString();
        sessions[sessionIndex].updated_at = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
        return true;
      }
      
      return false;
    }
  }

  // 認証済みセッション履歴を取得
  async getVerifiedSessions(): Promise<any[]> {
    try {
      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .select('*')
          .eq('sms_verified', true)
          .order('verification_timestamp', { ascending: false });

        if (!error && data) {
          return data;
        }
      }
      
      // フォールバック: ローカルストレージから取得
      console.warn('Supabase利用不可、ローカルストレージから取得');
      const localSessions = this.getLocalSessions();
      return localSessions
        .filter(session => session.sms_verified === true)
        .sort((a, b) => new Date(b.verification_timestamp || b.created_at).getTime() - 
                       new Date(a.verification_timestamp || a.created_at).getTime());
    } catch (error) {
      console.error('認証済みセッション取得例外:', error);
      
      // エラー時もローカルストレージから返す
      const localSessions = this.getLocalSessions();
      return localSessions.filter(session => session.sms_verified === true);
    }
  }

  // 特定の電話番号の最新の認証済みセッションを取得
  async getLatestVerifiedSession(phoneNumber: string): Promise<any | null> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .select('*')
          .eq('phone_number', normalizedPhone)
          .eq('sms_verified', true)
          .order('verification_timestamp', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return data;
        }
      }
      
      // フォールバック: ローカルストレージから取得
      console.warn('Supabase利用不可、ローカルストレージから取得');
      const localSessions = this.getLocalSessions();
      const userSessions = localSessions
        .filter(session => session.phone_number === normalizedPhone && session.sms_verified === true)
        .sort((a, b) => new Date(b.verification_timestamp || b.created_at).getTime() - 
                       new Date(a.verification_timestamp || a.created_at).getTime());
      
      return userSessions.length > 0 ? userSessions[0] : null;
    } catch (error) {
      console.error('最新認証セッション取得例外:', error);
      
      // エラー時もローカルストレージから試行
      const localSessions = this.getLocalSessions();
      const userSessions = localSessions
        .filter(session => session.phone_number === phoneNumber.replace(/\D/g, '') && session.sms_verified === true);
      
      return userSessions.length > 0 ? userSessions[0] : null;
    }
  }

  // セッションIDで診断データを取得
  async getDiagnosisSession(sessionId: string): Promise<any | null> {
    try {
      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (!error && data) {
          return data;
        }
      }
      
      // フォールバック: ローカルストレージから取得
      console.warn('Supabase利用不可、ローカルストレージから取得');
      const localSessions = this.getLocalSessions();
      return localSessions.find(session => session.session_id === sessionId) || null;
    } catch (error) {
      console.error('診断セッション取得例外:', error);
      
      // エラー時もローカルストレージから試行
      const localSessions = this.getLocalSessions();
      return localSessions.find(session => session.session_id === sessionId) || null;
    }
  }

  // データ同期機能（Supabaseが復旧した時にローカルデータを同期）
  async syncLocalDataToSupabase(): Promise<void> {
    try {
      if (!(await this.isSupabaseAvailable())) {
        return;
      }

      const localSessions = this.getLocalSessions();
      
      for (const session of localSessions) {
        // Supabaseに既存かチェック
        const { data: existing } = await this.supabase
          .from('diagnosis_sessions')
          .select('id')
          .eq('session_id', session.session_id)
          .single();

        if (!existing) {
          // 存在しない場合は挿入
          await this.supabase
            .from('diagnosis_sessions')
            .insert(session);
        }
      }
      
      console.log('ローカルデータの同期完了');
    } catch (error) {
      console.error('データ同期エラー:', error);
    }
  }
}

// 新規登録申請の型定義
export interface RegistrationRequest {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  organization?: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

// 新規登録申請管理クラス
export class RegistrationRequestManager {
  private supabase: SupabaseClient;
  private readonly STORAGE_KEY = 'registration_requests_backup';

  constructor() {
    this.supabase = supabase;
  }

  // ローカルストレージから申請を取得
  private getLocalRequests(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('ローカル申請データ読み込みエラー:', error);
      return [];
    }
  }

  // ローカルストレージに申請を保存
  private saveToLocalStorage(request: any): void {
    try {
      const requests = this.getLocalRequests();
      const existingIndex = requests.findIndex(r => r.id === request.id);
      
      if (existingIndex >= 0) {
        requests[existingIndex] = request;
      } else {
        requests.push(request);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('ローカル申請データ保存エラー:', error);
    }
  }

  // Supabaseの利用可能性をチェック
  private async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('registration_requests')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  // 新規登録申請を作成
  async createRegistrationRequest(requestData: {
    full_name: string;
    email: string;
    phone_number: string;
    organization?: string;
    purpose: string;
  }): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const normalizedPhone = requestData.phone_number.replace(/\D/g, '');
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const request = {
        id: requestId,
        full_name: requestData.full_name,
        email: requestData.email.toLowerCase(),
        phone_number: normalizedPhone,
        organization: requestData.organization || null,
        purpose: requestData.purpose,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('registration_requests')
          .insert(request)
          .select()
          .single();

        if (!error && data) {
          // ローカルストレージにもバックアップ
          this.saveToLocalStorage(data);
          return { success: true, id: data.id };
        }
      }

      // フォールバック: ローカルストレージのみ
      console.warn('Supabase利用不可、ローカルストレージに保存');
      this.saveToLocalStorage(request);
      return { success: true, id: request.id };

    } catch (error) {
      console.error('登録申請作成エラー:', error);
      return { success: false, error: 'システムエラーが発生しました。時間をおいて再度お試しください。' };
    }
  }

  // メールアドレスの重複チェック
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase();

      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('registration_requests')
          .select('id')
          .eq('email', normalizedEmail)
          .limit(1);

        if (!error && data && data.length > 0) {
          return true;
        }
      }

      // ローカルストレージからもチェック
      const localRequests = this.getLocalRequests();
      return localRequests.some(req => req.email === normalizedEmail);

    } catch (error) {
      console.error('メール重複チェックエラー:', error);
      return false;
    }
  }

  // 申請一覧を取得（管理者用）
  async getRegistrationRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<RegistrationRequest[]> {
    try {
      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        let query = this.supabase
          .from('registration_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (!error && data) {
          return data;
        }
      }

      // フォールバック: ローカルストレージから取得
      console.warn('Supabase利用不可、ローカルストレージから取得');
      const localRequests = this.getLocalRequests();
      
      let filteredRequests = localRequests;
      if (status) {
        filteredRequests = localRequests.filter(req => req.status === status);
      }

      return filteredRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    } catch (error) {
      console.error('申請一覧取得エラー:', error);
      return [];
    }
  }

  // Edge Function経由で申請を承認/却下
  async approveOrRejectRequest(
    requestId: string, 
    action: 'approve' | 'reject',
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Edge Function呼び出し
      const { data, error } = await this.supabase.functions.invoke('approve-registration', {
        body: {
          requestId,
          action,
          adminNotes: adminNotes || '',
          reviewedBy: reviewedBy || 'admin'
        }
      });

      if (error) {
        console.error('Edge Function呼び出しエラー:', error);
        
        // フォールバック: 直接データベース更新
        return await this.directUpdateRequestStatus(requestId, action, adminNotes, reviewedBy);
      }

      if (data && data.success) {
        // ローカルストレージも更新
        await this.updateLocalRequestStatus(requestId, action, adminNotes, reviewedBy);
        
        return {
          success: true,
          message: action === 'approve' ? 
            '申請が承認され、ユーザーアカウントが作成されました。' : 
            '申請が却下されました。'
        };
      }

      return { 
        success: false, 
        error: data?.error || 'Edge Function処理中にエラーが発生しました' 
      };

    } catch (error) {
      console.error('申請処理エラー:', error);
      
      // フォールバック処理
      return await this.directUpdateRequestStatus(requestId, action, adminNotes, reviewedBy);
    }
  }

  // 直接データベース更新（フォールバック）
  private async directUpdateRequestStatus(
    requestId: string,
    action: 'approve' | 'reject',
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.warn('Edge Function利用不可、直接データベース更新を実行');

      if (await this.isSupabaseAvailable()) {
        const { error } = await this.supabase
          .from('registration_requests')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            admin_notes: adminNotes || '',
            reviewed_by: reviewedBy || 'admin',
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (!error) {
          // ローカルストレージも更新
          await this.updateLocalRequestStatus(requestId, action, adminNotes, reviewedBy);
          
          return {
            success: true,
            message: action === 'approve' ? 
              '申請が承認されました（ユーザーアカウント作成は手動で行ってください）。' : 
              '申請が却下されました。'
          };
        }
      }

      // ローカルストレージのみ更新
      await this.updateLocalRequestStatus(requestId, action, adminNotes, reviewedBy);
      
      return {
        success: true,
        message: `申請が${action === 'approve' ? '承認' : '却下'}されました（ローカル保存のみ）。`
      };

    } catch (error) {
      console.error('直接データベース更新エラー:', error);
      return { 
        success: false, 
        error: 'システムエラーが発生しました。時間をおいて再度お試しください。' 
      };
    }
  }

  // ローカルストレージの申請状態を更新
  private async updateLocalRequestStatus(
    requestId: string,
    action: 'approve' | 'reject',
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<void> {
    try {
      const requests = this.getLocalRequests();
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex >= 0) {
        requests[requestIndex] = {
          ...requests[requestIndex],
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes || '',
          reviewed_by: reviewedBy || 'admin',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
      }
    } catch (error) {
      console.error('ローカル申請状態更新エラー:', error);
    }
  }

  // 申請の詳細を取得
  async getRequestById(requestId: string): Promise<RegistrationRequest | null> {
    try {
      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('registration_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (!error && data) {
          return data;
        }
      }

      // フォールバック: ローカルストレージから取得
      const localRequests = this.getLocalRequests();
      return localRequests.find(req => req.id === requestId) || null;

    } catch (error) {
      console.error('申請詳細取得エラー:', error);
      return null;
    }
  }

  // データ同期機能
  async syncLocalDataToSupabase(): Promise<void> {
    try {
      if (!(await this.isSupabaseAvailable())) {
        return;
      }

      const localRequests = this.getLocalRequests();
      
      for (const request of localRequests) {
        // Supabaseに既存かチェック
        const { data: existing } = await this.supabase
          .from('registration_requests')
          .select('id')
          .eq('id', request.id)
          .single();

        if (!existing) {
          // 存在しない場合は挿入
          await this.supabase
            .from('registration_requests')
            .insert(request);
        }
      }
      
      console.log('申請データの同期完了');
    } catch (error) {
      console.error('申請データ同期エラー:', error);
    }
  }
}

// 診断セッション管理のインスタンスをエクスポート
export const diagnosisManager = new DiagnosisSessionManager();
// 登録申請管理のインスタンスをエクスポート
export const registrationManager = new RegistrationRequestManager();

// パスワード履歴管理（オプション）
export class PasswordHistoryManager {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  // パスワード履歴をチェック（過去のパスワードとの重複を防ぐ）
  async checkPasswordHistory(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('password_history')
        .select('password_hash')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5); // 過去5回分をチェック

      if (error) {
        console.error('パスワード履歴チェックエラー:', error);
        return true; // エラー時は通す
      }

      return !data?.some(record => record.password_hash === newPasswordHash);
    } catch (error) {
      console.error('パスワード履歴チェック例外:', error);
      return true;
    }
  }

  // パスワード履歴を記録
  async recordPasswordChange(userId: string, passwordHash: string): Promise<void> {
    try {
      await this.supabase
        .from('password_history')
        .insert({
          user_id: userId,
          password_hash: passwordHash,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('パスワード履歴記録エラー:', error);
    }
  }
}

export const passwordHistoryManager = new PasswordHistoryManager(); 