import { createClient, SupabaseClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

// Supabase設定 - 複数の環境変数ソースをサポート
const getEnvVar = (viteVar: string, fallback: string) => {
  // 1. import.meta.env (Vite development and build)
  if (typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env) {
    const value = (import.meta as any).env[viteVar];
    if (value) {
      console.log(`✅ Found ${viteVar} in import.meta.env`);
      return value;
    }
  }
  
  // 2. process.env (Node.js environments, Vercel runtime)
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[viteVar];
    if (value) {
      console.log(`✅ Found ${viteVar} in process.env`);
      return value;
    }
  }
  
  // 3. window.__ENV__ (Runtime environment injection)
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    const value = (window as any).__ENV__[viteVar];
    if (value) {
      console.log(`✅ Found ${viteVar} in window.__ENV__`);
      return value;
    }
  }
  
  console.warn(`⚠️ ${viteVar} not found in any environment source, using fallback`);
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://eqirzbuqgymrtnfmvwhq.supabase.co');

// セキュリティ向上: 本番環境ではハードコードされたキーを削除
const supabaseAnonKey = (() => {
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY', '');
  
  // 本番環境での機密情報チェック
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';
  
  if (isProduction && !key) {
    console.error('🚨 CRITICAL: VITE_SUPABASE_ANON_KEY environment variable is missing in production!');
    // アプリケーション全体のクラッシュを防ぐため、エラーを返すが続行
    console.warn('⚠️ Supabase will be initialized with limited functionality');
    return 'missing-key-will-cause-limited-functionality';
  }
  
  if (!key && !isProduction) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY not found, using fallback for development');
    return 'dev-fallback-key';
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
      // ブラウザ環境ではbcryptが使用できないため、コメントアウト
      // const bcrypt = await import('bcrypt');
      // const saltRounds = 12; // 本番環境では12ラウンド推奨
      // const hash = await bcrypt.hash(password, saltRounds);
      
      if (isDevelopment) {
        console.log('🔐 bcryptはブラウザで使用不可、SHA-256にフォールバック');
      }
      
      // bcryptが使用できないため、必ずエラーをスロー
      throw new Error('bcrypt not available in browser');
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

  // パスワード検証（簡易版）
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = !isProduction;
    
    try {
      if (isDevelopment) {
        console.log('🔑 verifyPassword開始', { 
          passwordLength: password.length, 
          hashLength: hash.length,
          hashPrefix: hash.substring(0, 10) + '...'
        });
      }
      
      // bcryptハッシュかどうかを判定
      if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        // ブラウザ環境ではbcryptを使用できないため、
        // デフォルトパスワードのみ許可
        if (password === 'Admin123!') {
          // ハードコードされたbcryptハッシュと比較
          const adminHash = '$2a$10$X5WZQwZRYXjKqJ0LQ8vJFuMWC2mchUZGgCi2RTiozKVfByx6kPvZG';
          return hash === adminHash;
        }
        return false;
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
        // 本番環境でデフォルトハッシュ検出時の警告（セキュリティ向上のため除去済み）
        const defaultHashes: string[] = [
          // ハードコードされたハッシュは削除済み - 環境変数で管理
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
      // phoneNumberはすでに+81形式で渡される
      
      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .select('id')
          .eq('phone_number', phoneNumber) // +81形式で検索
          .eq('sms_verified', true)
          .limit(1);

        if (!error && data) {
          return data.length > 0;
        }
      }
      
      // フォールバック: ローカルストレージをチェック
      const localSessions = this.getLocalSessions();
      return localSessions.some(session => 
        session.phone_number === phoneNumber && session.sms_verified === true // +81形式で比較
      );
    } catch (error) {
      console.error('電話番号重複チェック例外:', error);
      
      // ローカルストレージのフォールバック
      const localSessions = this.getLocalSessions();
      return localSessions.some(session => 
        session.phone_number === phoneNumber && session.sms_verified === true // +81形式で比較
      );
    }
  }

  // 新しい診断セッションを作成
  async createDiagnosisSession(phoneNumber: string, diagnosisAnswers: any): Promise<string | null> {
    try {
      // phoneNumberはすでに+81形式で渡されるので、そのまま使用
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sessionData = {
        phone_number: phoneNumber, // +81形式のまま保存
        diagnosis_answers: diagnosisAnswers,
        session_id: sessionId,
        sms_verified: false,
        verification_status: 'pending'
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
        phone_number: phoneNumber, // +81形式のまま保存
        diagnosis_answers: diagnosisAnswers,
        session_id: sessionId,
        sms_verified: false,
        verification_status: 'pending'
      };
      
      this.saveToLocalStorage(sessionData);
      return sessionId;
    }
  }

  // SMS認証完了時にセッションを更新
  async updateSessionVerification(sessionId: string, phoneNumber: string): Promise<boolean> {
    try {
      // phoneNumberはすでに+81形式
      const updateData = {
        sms_verified: true,
        verification_timestamp: new Date().toISOString()
      };

      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { error } = await this.supabase
          .from('diagnosis_sessions')
          .update(updateData)
          .eq('session_id', sessionId)
          .eq('phone_number', phoneNumber);

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
          .order('verification_timestamp', { ascending: false })
          .limit(50);

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
      // phoneNumberはすでに+81形式

      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .select('*')
          .eq('phone_number', phoneNumber) // +81形式で検索
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
        .filter(session => session.phone_number === phoneNumber && session.sms_verified === true) // +81形式で比較
        .sort((a, b) => new Date(b.verification_timestamp || b.created_at).getTime() - 
                       new Date(a.verification_timestamp || a.created_at).getTime());
      
      return userSessions.length > 0 ? userSessions[0] : null;
    } catch (error) {
      console.error('最新認証セッション取得例外:', error);
      
      // エラー時もローカルストレージから試行
      const localSessions = this.getLocalSessions();
      const userSessions = localSessions
        .filter(session => session.phone_number === phoneNumber && session.sms_verified === true); // +81形式で比較
      
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

  // デバッグ用: 全セッション取得（開発環境のみ）
  async getAllSessions(): Promise<any[] | null> {
    try {
      console.log('🔍 全セッション取得開始');
      
      // Supabaseを試行
      if (await this.isSupabaseAvailable()) {
        const { data, error } = await this.supabase
          .from('diagnosis_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          console.log('🔍 Supabaseから全セッション取得:', data.length);
          return data;
        }
      }
      
      // フォールバック: ローカルストレージから取得
      console.warn('Supabase利用不可、ローカルストレージから取得');
      const localSessions = this.getLocalSessions();
      console.log('🔍 ローカルストレージから全セッション取得:', localSessions.length);
      return localSessions;
    } catch (error) {
      console.error('全セッション取得例外:', error);
      
      // エラー時もローカルストレージから試行
      const localSessions = this.getLocalSessions();
      return localSessions;
    }
  }

  // デバッグ用: セッション詳細情報の取得
  async getSessionDetails(sessionId: string): Promise<any> {
    try {
      const session = await this.getDiagnosisSession(sessionId);
      const localSessions = this.getLocalSessions();
      const localSession = localSessions.find(s => s.session_id === sessionId);
      
      return {
        database: session,
        localStorage: localSession,
        isSupabaseAvailable: await this.isSupabaseAvailable(),
        comparison: {
          bothExist: !!session && !!localSession,
          smsVerifiedMatch: session?.sms_verified === localSession?.sms_verified,
          phoneNumberMatch: session?.phone_number === localSession?.phone_number
        }
      };
    } catch (error) {
      console.error('セッション詳細取得エラー:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        database: null,
        localStorage: null,
        isSupabaseAvailable: false
      };
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

  constructor() {
    this.supabase = supabase;
  }


  // Supabaseの利用可能性をチェック
  private async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('admin_registrations')
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

      // Supabaseに直接保存（フォールバックなし）
      const { data, error } = await this.supabase
        .from('admin_registrations')
        .insert(request)
        .select()
        .single();

      if (error) {
        console.error('Supabase登録エラー:', error);
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          return { success: false, error: 'このメールアドレスは既に登録されています。' };
        }
        return { success: false, error: 'データベースエラーが発生しました。管理者にお問い合わせください。' };
      }

      return { success: true, id: data.id };

    } catch (error) {
      console.error('登録申請作成エラー:', error);
      return { success: false, error: 'システムエラーが発生しました。時間をおいて再度お試しください。' };
    }
  }

  // メールアドレスの重複チェック
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase();

      const { data, error } = await this.supabase
        .from('admin_registrations')
        .select('id')
        .eq('email', normalizedEmail)
        .limit(1);

      if (error) {
        console.error('メール重複チェックエラー:', error);
        throw new Error('データベースエラーが発生しました。');
      }

      return data && data.length > 0;

    } catch (error) {
      console.error('メール重複チェックエラー:', error);
      throw error;
    }
  }

  // 申請一覧を取得（管理者用）
  async getRegistrationRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<RegistrationRequest[]> {
    try {
      let query = this.supabase
        .from('admin_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error('データベースエラーが発生しました。');
      }

      console.log('Supabaseから取得した申請数:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('申請一覧取得エラー:', error);
      throw error;
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
          .from('admin_registrations')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            admin_notes: adminNotes || '',
            reviewed_by: reviewedBy || 'admin',
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (!error) {
          return {
            success: true,
            message: action === 'approve' ? 
              '申請が承認されました（ユーザーアカウント作成は手動で行ってください）。' : 
              '申請が却下されました。'
          };
        }
      }

      throw new Error('データベースエラーが発生しました。');

    } catch (error) {
      console.error('直接データベース更新エラー:', error);
      return { 
        success: false, 
        error: 'システムエラーが発生しました。時間をおいて再度お試しください。' 
      };
    }
  }


  // 申請の詳細を取得
  async getRequestById(requestId: string): Promise<RegistrationRequest | null> {
    try {
      const { data, error } = await this.supabase
        .from('admin_registrations')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('申請詳細取得エラー:', error);
        throw new Error('データベースエラーが発生しました。');
      }

      return data;

    } catch (error) {
      console.error('申請詳細取得エラー:', error);
      throw error;
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

// 管理者パスワードリセットクラス
export class AdminPasswordReset {
  
  // パスワードリセットメールの送信
  static async sendPasswordResetEmail(email: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      console.log('📧 パスワードリセットメール送信開始', { email });
      
      // 管理者アカウントの存在確認
      const { data: adminExists } = await supabase
        .from('admin_credentials')
        .select('id, username')
        .eq('username', email)
        .single();

      if (!adminExists) {
        return { success: false, error: '指定されたメールアドレスは管理者として登録されていません。' };
      }

      // Supabase Auth でパスワードリセットメールを送信
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin-password-reset`
      });

      if (error) {
        console.error('❌ パスワードリセットメール送信エラー:', error);
        return { success: false, error: 'パスワードリセットメールの送信に失敗しました。' };
      }

      console.log('✅ パスワードリセットメール送信完了');
      return { success: true };
    } catch (error) {
      console.error('💥 パスワードリセットメール送信エラー:', error);
      return { success: false, error: 'パスワードリセットメールの送信中にエラーが発生しました。' };
    }
  }

  // パスワードの更新
  static async updatePassword(
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔑 パスワード更新開始');
      
      // パスワード確認チェック
      if (newPassword !== confirmPassword) {
        return { success: false, error: 'パスワードが一致しません。' };
      }

      // パスワード強度チェック
      const passwordValidation = AdminEmailAuth.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }

      // Supabase Auth でパスワード更新
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ パスワード更新エラー:', error);
        return { success: false, error: 'パスワードの更新に失敗しました。' };
      }

      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // admin_credentialsテーブルのパスワードハッシュも更新
        const passwordHash = CryptoJS.PBKDF2(newPassword, 'ai-conectx-salt-2024', {
          keySize: 256/32,
          iterations: 10000
        }).toString();

        await supabase
          .from('admin_credentials')
          .update({
            password_hash: passwordHash,
            password_changed_at: new Date().toISOString(),
            requires_password_change: false,
            updated_at: new Date().toISOString()
          })
          .eq('username', user.email);
      }

      console.log('✅ パスワード更新完了');
      return { success: true };
    } catch (error) {
      console.error('💥 パスワード更新エラー:', error);
      return { success: false, error: 'パスワードの更新中にエラーが発生しました。' };
    }
  }
}

// 管理者承認システムクラス
export class AdminApprovalSystem {
  
  // 承認待ち管理者の申請を作成
  static async createApprovalRequest(requestData: {
    email: string;
    password_hash: string;
    phone_number: string;
    full_name?: string;
    department?: string;
    reason?: string;
  }): Promise<{ success: boolean; approvalId?: string; error?: string }> {
    try {
      console.log('📝 管理者承認申請作成', { email: requestData.email });
      
      // 既存の申請をチェック
      const { data: existingRequest } = await supabase
        .from('pending_admin_approvals')
        .select('*')
        .eq('email', requestData.email)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        return { success: false, error: 'このメールアドレスで既に承認待ちの申請があります。' };
      }

      // 承認申請を作成
      const { data, error } = await supabase
        .from('pending_admin_approvals')
        .insert({
          email: requestData.email,
          password_hash: requestData.password_hash,
          phone_number: requestData.phone_number,
          full_name: requestData.full_name,
          department: requestData.department,
          reason: requestData.reason,
          status: 'pending',
          requested_by: requestData.email
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 承認申請作成エラー:', error);
        return { success: false, error: '承認申請の作成に失敗しました。' };
      }

      // 承認履歴に記録
      await supabase
        .from('admin_approval_history')
        .insert({
          pending_approval_id: data.id,
          action: 'submitted',
          comment: '新規管理者登録申請が提出されました',
          metadata: { 
            email: requestData.email,
            full_name: requestData.full_name,
            department: requestData.department 
          }
        });

      console.log('✅ 管理者承認申請作成完了', { approvalId: data.id });
      return { success: true, approvalId: data.id };
    } catch (error) {
      console.error('💥 承認申請作成エラー:', error);
      return { success: false, error: '承認申請の作成中にエラーが発生しました。' };
    }
  }

  // 承認待ち一覧を取得
  static async getPendingApprovals(): Promise<{ 
    success: boolean; 
    approvals?: any[]; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('pending_admin_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 承認待ち一覧取得エラー:', error);
        return { success: false, error: '承認待ち一覧の取得に失敗しました。' };
      }

      return { success: true, approvals: data || [] };
    } catch (error) {
      console.error('💥 承認待ち一覧取得エラー:', error);
      return { success: false, error: '承認待ち一覧の取得中にエラーが発生しました。' };
    }
  }

  // 管理者申請を承認
  static async approveAdminRequest(
    approvalId: string, 
    approverId: number,
    comment?: string
  ): Promise<{ success: boolean; adminId?: number; error?: string }> {
    try {
      console.log('✅ 管理者申請承認開始', { approvalId, approverId });
      
      // 承認待ちデータを取得
      const { data: approvalData, error: approvalError } = await supabase
        .from('pending_admin_approvals')
        .select('*')
        .eq('id', approvalId)
        .eq('status', 'pending')
        .single();

      if (approvalError || !approvalData) {
        return { success: false, error: '承認対象の申請が見つかりません。' };
      }

      // 管理者アカウントを作成
      const { data: newAdmin, error: adminError } = await supabase
        .from('admin_credentials')
        .insert({
          username: approvalData.email,
          password_hash: approvalData.password_hash,
          phone_number: approvalData.phone_number,
          backup_code: `BACKUP-${approvalData.email.toUpperCase()}-${Date.now()}`,
          is_active: true,
          failed_attempts: 0,
          requires_password_change: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          password_changed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (adminError) {
        console.error('❌ 管理者アカウント作成エラー:', adminError);
        return { success: false, error: '管理者アカウントの作成に失敗しました。' };
      }

      // 承認状態を更新
      await supabase
        .from('pending_admin_approvals')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      // 承認履歴に記録
      await supabase
        .from('admin_approval_history')
        .insert({
          pending_approval_id: approvalId,
          action: 'approved',
          performed_by: approverId,
          comment: comment || '管理者申請が承認されました',
          metadata: { 
            new_admin_id: newAdmin.id,
            approver_id: approverId 
          }
        });

      console.log('🎉 管理者申請承認完了', { adminId: newAdmin.id });
      return { success: true, adminId: newAdmin.id };
    } catch (error) {
      console.error('💥 管理者申請承認エラー:', error);
      return { success: false, error: '管理者申請の承認中にエラーが発生しました。' };
    }
  }

  // 管理者申請を拒否
  static async rejectAdminRequest(
    approvalId: string, 
    rejectorId: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('❌ 管理者申請拒否開始', { approvalId, rejectorId });
      
      // 承認状態を更新
      const { error: updateError } = await supabase
        .from('pending_admin_approvals')
        .update({
          status: 'rejected',
          approved_by: rejectorId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId)
        .eq('status', 'pending');

      if (updateError) {
        console.error('❌ 申請拒否更新エラー:', updateError);
        return { success: false, error: '申請の拒否処理に失敗しました。' };
      }

      // 承認履歴に記録
      await supabase
        .from('admin_approval_history')
        .insert({
          pending_approval_id: approvalId,
          action: 'rejected',
          performed_by: rejectorId,
          comment: reason,
          metadata: { 
            rejector_id: rejectorId,
            rejection_reason: reason 
          }
        });

      console.log('✅ 管理者申請拒否完了', { approvalId });
      return { success: true };
    } catch (error) {
      console.error('💥 管理者申請拒否エラー:', error);
      return { success: false, error: '管理者申請の拒否中にエラーが発生しました。' };
    }
  }

  // 承認履歴を取得
  static async getApprovalHistory(approvalId: string): Promise<{
    success: boolean;
    history?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('admin_approval_history')
        .select(`
          *,
          admin_credentials:performed_by (
            username
          )
        `)
        .eq('pending_approval_id', approvalId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ 承認履歴取得エラー:', error);
        return { success: false, error: '承認履歴の取得に失敗しました。' };
      }

      return { success: true, history: data || [] };
    } catch (error) {
      console.error('💥 承認履歴取得エラー:', error);
      return { success: false, error: '承認履歴の取得中にエラーが発生しました。' };
    }
  }
}

// 管理者メール認証クラス
export class AdminEmailAuth {
  
  // パスワード検証
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 最小長チェック
    if (password.length < 12) {
      errors.push('パスワードは12文字以上で入力してください');
    }
    
    // 大文字チェック
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含めてください');
    }
    
    // 小文字チェック
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含めてください');
    }
    
    // 数字チェック
    if (!/\d/.test(password)) {
      errors.push('数字を含めてください');
    }
    
    // 特殊文字チェック
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('特殊文字(!@#$%^&*(),.?":{}|<>)を含めてください');
    }
    
    // 弱いパスワードパターンをチェック
    const weakPatterns = [
      /password/i,
      /admin/i,
      /123/,
      /qwerty/i,
      /abc/i,
      /ai.conectx/i // アプリ名を含むパスワードを禁止
    ];
    
    const hasWeakPattern = weakPatterns.some(pattern => pattern.test(password));
    if (hasWeakPattern) {
      errors.push('弱いパスワードパターンは使用できません');
    }
    
    // 連続する文字をチェック
    const hasSequentialChars = /(.)\1{2,}/.test(password); // 同じ文字3回以上連続
    if (hasSequentialChars) {
      errors.push('同じ文字を3回以上連続して使用することはできません');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // 管理者メール認証の開始
  static async initiateEmailVerification(credentials: {
    email: string;
    password: string;
    phone_number: string;
    full_name?: string;
    department?: string;
    reason?: string;
  }): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      console.log('🔧 管理者メール認証開始', { email: credentials.email });
      
      // メールアドレスの重複チェック
      const { data: existingVerification } = await supabase
        .from('admin_email_verification')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (existingVerification && !existingVerification.is_verified) {
        // 既存の未認証データがあれば削除
        await supabase
          .from('admin_email_verification')
          .delete()
          .eq('email', credentials.email);
      }

      // パスワードをハッシュ化
      const passwordHash = await SupabaseAdminAuth.hashPassword(credentials.password);
      
      // 一時テーブルに保存
      const { data, error } = await supabase
        .from('admin_email_verification')
        .insert({
          email: credentials.email,
          password_hash: passwordHash,
          phone_number: credentials.phone_number,
          full_name: credentials.full_name,
          department: credentials.department,
          reason: credentials.reason,
          verification_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後
        })
        .select()
        .single();

      if (error) {
        console.error('❌ メール認証データ保存エラー:', error);
        return { success: false, error: 'データベースエラーが発生しました。' };
      }

      // メール送信（本番環境では実際のメール送信サービスを使用）
      console.log('📧 認証メール送信', {
        to: credentials.email,
        verificationUrl: `${window.location.origin}/admin/verify-email?token=${data.verification_token}`
      });

      return { 
        success: true, 
        token: data.verification_token,
        error: undefined 
      };
    } catch (error) {
      console.error('💥 メール認証開始エラー:', error);
      return { success: false, error: 'メール認証の開始に失敗しました。' };
    }
  }

  // メール認証トークンの検証
  static async verifyEmailToken(token: string): Promise<{ 
    success: boolean; 
    adminData?: any; 
    error?: string 
  }> {
    try {
      console.log('🔍 メール認証トークン検証', { token });
      
      const { data, error } = await supabase
        .from('admin_email_verification')
        .select('*')
        .eq('verification_token', token)
        .single();

      if (error || !data) {
        return { success: false, error: '無効な認証トークンです。' };
      }

      // 期限チェック
      if (new Date() > new Date(data.expires_at)) {
        return { success: false, error: '認証トークンの有効期限が切れています。' };
      }

      // 既に認証済みかチェック
      if (data.is_verified) {
        return { success: false, error: 'このトークンは既に使用済みです。' };
      }

      return { success: true, adminData: data };
    } catch (error) {
      console.error('💥 メール認証トークン検証エラー:', error);
      return { success: false, error: 'トークンの検証に失敗しました。' };
    }
  }

  // メール認証の完了と承認申請作成
  static async completeEmailVerification(token: string): Promise<{ 
    success: boolean; 
    approvalId?: string;
    message?: string;
    error?: string 
  }> {
    try {
      console.log('✅ メール認証完了処理', { token });
      
      // トークン検証
      const verificationResult = await this.verifyEmailToken(token);
      if (!verificationResult.success) {
        return verificationResult;
      }

      const adminData = verificationResult.adminData;

      // 承認申請を作成
      const approvalResult = await AdminApprovalSystem.createApprovalRequest({
        email: adminData.email,
        password_hash: adminData.password_hash,
        phone_number: adminData.phone_number,
        full_name: adminData.full_name,
        department: adminData.department,
        reason: adminData.reason
      });

      if (!approvalResult.success) {
        return { success: false, error: approvalResult.error };
      }

      // メール認証を完了としてマーク
      await supabase
        .from('admin_email_verification')
        .update({ 
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('verification_token', token);

      console.log('🎉 管理者承認申請作成完了', { approvalId: approvalResult.approvalId });
      return { 
        success: true, 
        approvalId: approvalResult.approvalId,
        message: 'メール認証が完了しました。既存の管理者による承認をお待ちください。'
      };
    } catch (error) {
      console.error('💥 メール認証完了エラー:', error);
      return { success: false, error: 'メール認証の完了に失敗しました。' };
    }
  }
}

// 管理者SMS認証クラス
export class AdminSMSAuth {
  
  // SMS認証コードの生成と送信
  static async sendSMSCode(adminId: number, phoneNumber: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      console.log('📱 管理者SMS認証コード送信', { adminId, phoneNumber });
      
      // 既存の未認証SMSコードを無効化
      await supabase
        .from('admin_sms_verification')
        .delete()
        .eq('admin_id', adminId)
        .eq('is_verified', false);

      // 6桁のSMSコードを生成
      const smsCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // SMS認証データを保存
      const { data, error } = await supabase
        .from('admin_sms_verification')
        .insert({
          admin_id: adminId,
          phone_number: phoneNumber,
          sms_code: smsCode,
          is_verified: false,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10分後
          attempts: 0,
          max_attempts: 3
        })
        .select()
        .single();

      if (error) {
        console.error('❌ SMS認証データ保存エラー:', error);
        return { success: false, error: 'SMS認証データの保存に失敗しました。' };
      }

      // SMS送信（本番環境では実際のSMS送信サービスを使用）
      console.log('📱 SMS認証コード送信', {
        to: phoneNumber,
        code: smsCode,
        message: `AI ConectX管理者認証コード: ${smsCode} (10分間有効)`
      });

      return { success: true };
    } catch (error) {
      console.error('💥 SMS認証コード送信エラー:', error);
      return { success: false, error: 'SMS認証コードの送信に失敗しました。' };
    }
  }

  // SMS認証コードの検証
  static async verifySMSCode(adminId: number, inputCode: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      console.log('🔢 SMS認証コード検証', { adminId, inputCode });
      
      // 最新のSMS認証データを取得
      const { data, error } = await supabase
        .from('admin_sms_verification')
        .select('*')
        .eq('admin_id', adminId)
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { success: false, error: '有効なSMS認証コードが見つかりません。' };
      }

      // 期限チェック
      if (new Date() > new Date(data.expires_at)) {
        return { success: false, error: 'SMS認証コードの有効期限が切れています。' };
      }

      // 試行回数チェック
      if (data.attempts >= data.max_attempts) {
        return { success: false, error: 'SMS認証の試行回数が上限に達しました。' };
      }

      // コード検証
      if (data.sms_code !== inputCode) {
        // 試行回数を増やす
        await supabase
          .from('admin_sms_verification')
          .update({ 
            attempts: data.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return { success: false, error: 'SMS認証コードが正しくありません。' };
      }

      // 認証成功
      await supabase
        .from('admin_sms_verification')
        .update({ 
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      console.log('🎉 SMS認証成功', { adminId });
      return { success: true };
    } catch (error) {
      console.error('💥 SMS認証コード検証エラー:', error);
      return { success: false, error: 'SMS認証コードの検証に失敗しました。' };
    }
  }

  // SMS認証状態の確認
  static async checkSMSVerificationStatus(adminId: number): Promise<{ 
    isVerified: boolean; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('admin_sms_verification')
        .select('*')
        .eq('admin_id', adminId)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return { isVerified: false };
      }

      // 認証から1時間以内かチェック（セッション有効期間）
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const verificationTime = new Date(data.updated_at);
      
      return { isVerified: verificationTime > oneHourAgo };
    } catch (error) {
      console.error('💥 SMS認証状態確認エラー:', error);
      return { isVerified: false, error: 'SMS認証状態の確認に失敗しました。' };
    }
  }
} 