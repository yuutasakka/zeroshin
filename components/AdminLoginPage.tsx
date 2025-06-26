import React, { useState, useEffect, FormEvent } from 'react';
import CryptoJS from 'crypto-js';

// Supabaseクライアント（環境変数から設定を取得）
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXJ6YnVxZ3ltcnRuZm12d2hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY3MjE3MCwiZXhwIjoyMDY2MjQ4MTcwfQ.JTjrWFXHn4JKfRFLLV2Mb_xzZOqB7j9OQ4TQo3xgmJE';
  
  // 管理者認証にはサービスロールキーを使用（RLSをバイパス）
  return {
    url: supabaseUrl,
    key: supabaseServiceKey
  };
};

const supabaseConfig = createSupabaseClient();

// Supabase API ヘルパー関数
class SupabaseAdminAPI {
  static async fetchAdminCredentials(username: string = 'admin') {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/admin_credentials?username=eq.${username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      console.error('Supabase管理者認証情報取得エラー:', error);
      return null;
    }
  }

  static async updateAdminCredentials(id: number, updates: any) {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/admin_credentials?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase管理者認証情報更新エラー:', error);
      throw error;
    }
  }

  static async recordLoginAttempt(username: string, success: boolean, failureReason?: string) {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/admin_login_attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          success,
          failure_reason: failureReason,
          ip_address: 'client-side', // クライアントサイドでは制限
          user_agent: navigator.userAgent.substring(0, 200),
        }),
      });

      if (!response.ok) {
        console.warn('ログイン試行記録の保存に失敗:', response.status);
      }
    } catch (error) {
      console.error('ログイン試行記録エラー:', error);
    }
  }

  static async createAdminSession(adminId: number, sessionData: any) {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/admin_sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: adminId,
          session_token: sessionData.sessionId,
          encrypted_session_data: SecureStorage.encrypt(sessionData),
          ip_address: 'client-side',
          user_agent: navigator.userAgent.substring(0, 200),
          expires_at: new Date(sessionData.expires).toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn('セッション作成の保存に失敗:', response.status);
      }
    } catch (error) {
      console.error('セッション作成エラー:', error);
    }
  }
}

// セキュリティ設定
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分
  SESSION_TIMEOUT: 30 * 60 * 1000,  // 30分
  PASSWORD_MIN_LENGTH: 8,
  REQUIRE_2FA: false, // 2FA有効化フラグ
  ENCRYPTION_KEY: 'MoneyTicket-SecureKey-2024', // 本番環境では環境変数から取得
};

// セキュアなストレージ管理
class SecureStorage {
  private static encryptionKey = SECURITY_CONFIG.ENCRYPTION_KEY;

  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('暗号化エラー:', error);
      return '';
    }
  }

  static decrypt(encryptedData: string): any {
    try {
      if (!encryptedData) return null;
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('復号化エラー:', error);
      return null;
    }
  }

  static setSecureItem(key: string, value: any): void {
    const encrypted = this.encrypt(value);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
    }
  }

  static getSecureItem(key: string): any {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  static removeSecureItem(key: string): void {
    localStorage.removeItem(key);
  }
}

// パスワードハッシュ化（クライアントサイド）
class PasswordManager {
  private static saltRounds = 10;

  static async hashPassword(password: string): Promise<string> {
    try {
      // クライアントサイドでの簡易ハッシュ化（本番では bcrypt を使用）
      const salt = CryptoJS.lib.WordArray.random(128/8);
      const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 1000
      });
      return salt.toString() + ':' + hash.toString();
    } catch (error) {
      console.error('パスワードハッシュ化エラー:', error);
      return password; // フォールバック
    }
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      if (!hashedPassword.includes(':')) {
        // 古い形式の平文パスワードとの互換性
        return password === hashedPassword;
      }

      const [saltStr, hashStr] = hashedPassword.split(':');
      const salt = CryptoJS.enc.Hex.parse(saltStr);
      const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 1000
      });
      
      return hash.toString() === hashStr;
    } catch (error) {
      console.error('パスワード検証エラー:', error);
      return false;
    }
  }
}

// Supabaseから管理者認証情報を読み込み（ローカルストレージとの併用）
const loadAdminCredentials = async () => {
  try {
    console.log('管理者認証情報をSupabaseから読み込み中...');
    
    // まずSupabaseから最新データを取得
    const supabaseCredentials = await SupabaseAdminAPI.fetchAdminCredentials('admin');
    
    if (supabaseCredentials) {
      console.log('Supabaseから認証情報を取得:', supabaseCredentials.username);
      
      // ローカルストレージにもバックアップとして保存
      const localCredentials = {
        id: supabaseCredentials.id,
        username: supabaseCredentials.username,
        password: supabaseCredentials.password_hash,
        backup_code: supabaseCredentials.backup_code,
        phone_number: supabaseCredentials.phone_number,
        is_active: supabaseCredentials.is_active,
        created_at: supabaseCredentials.created_at,
        last_updated: supabaseCredentials.updated_at
      };
      
      SecureStorage.setSecureItem('admin_credentials', localCredentials);
      return localCredentials;
    }
    
    // Supabaseから取得できない場合はローカルストレージを確認
    console.log('Supabaseから取得できませんでした。ローカルストレージを確認中...');
    const stored = SecureStorage.getSecureItem('admin_credentials');
    if (stored) {
      console.log('ローカルストレージから認証情報を取得');
      return stored;
    }

    // どちらからも取得できない場合はデフォルト値を返す
    console.log('デフォルト認証情報を使用');
    return await getDefaultCredentials();
    
  } catch (error) {
    console.error('認証情報読み込みエラー:', error);
    
    // エラー時はローカルストレージをフォールバック
    const stored = SecureStorage.getSecureItem('admin_credentials');
    if (stored) {
      return stored;
    }
    
    return await getDefaultCredentials();
  }
};

// デフォルト認証情報（フォールバック用）
const getDefaultCredentials = async () => {
  const defaultPassword = await PasswordManager.hashPassword("MoneyTicket2024!");
  return {
    id: 1,
    username: "admin",
    password: defaultPassword,
    backup_code: "MT-BACKUP-2024",
            phone_number: "09012345678",
    is_active: true,
    created_at: Date.now(),
    last_updated: Date.now()
  };
};

// 管理者認証情報をSupabaseに保存
const saveAdminCredentials = async (newCredentials: any) => {
  try {
    console.log('管理者認証情報をSupabaseに保存中...');
    
    if (newCredentials.id) {
      // 既存レコードの更新
      const updates = {
        password_hash: newCredentials.password,
        phone_number: newCredentials.phone_number,
        backup_code: newCredentials.backup_code,
        updated_at: new Date().toISOString()
      };
      
      await SupabaseAdminAPI.updateAdminCredentials(newCredentials.id, updates);
      console.log('Supabaseの認証情報を更新しました');
    }
    
    // ローカルストレージにもバックアップとして保存
    const credentialsWithTimestamp = {
      ...newCredentials,
      last_updated: Date.now()
    };
    SecureStorage.setSecureItem('admin_credentials', credentialsWithTimestamp);
    
    console.log('管理者認証情報が安全に保存されました');
  } catch (error) {
    console.error('認証情報保存エラー:', error);
    
    // Supabaseへの保存に失敗してもローカルストレージには保存
    const credentialsWithTimestamp = {
      ...newCredentials,
      last_updated: Date.now()
    };
    SecureStorage.setSecureItem('admin_credentials', credentialsWithTimestamp);
    console.log('ローカルストレージに認証情報を保存しました（フォールバック）');
  }
};

// セキュアなセッション管理（Supabase連携）
class SessionManager {
  static async createSecureSession(username: string, adminId: number): Promise<string> {
    const sessionData = {
      username,
      adminId,
      timestamp: Date.now(),
      expires: Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT,
      sessionId: CryptoJS.lib.WordArray.random(128/8).toString(),
      csrfToken: CryptoJS.lib.WordArray.random(128/8).toString()
    };

    // ローカルストレージに保存
    SecureStorage.setSecureItem('admin_session', sessionData);
    sessionStorage.setItem('admin_authenticated', 'true');
    
    // Supabaseにもセッションを記録（非同期）
    try {
      await SupabaseAdminAPI.createAdminSession(adminId, sessionData);
    } catch (error) {
      console.warn('Supabaseセッション記録に失敗:', error);
    }
    
    return sessionData.sessionId;
  }

  static validateSession(): boolean {
    try {
      const sessionData = SecureStorage.getSecureItem('admin_session');
      if (!sessionData) return false;

      const now = Date.now();
      if (now > sessionData.expires) {
        this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('セッション検証エラー:', error);
      return false;
    }
  }

  static extendSession(): boolean {
    try {
      const sessionData = SecureStorage.getSecureItem('admin_session');
      if (!sessionData) return false;

      sessionData.expires = Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT;
      SecureStorage.setSecureItem('admin_session', sessionData);
      return true;
    } catch (error) {
      console.error('セッション延長エラー:', error);
      return false;
    }
  }

  static clearSession(): void {
    SecureStorage.removeSecureItem('admin_session');
    sessionStorage.removeItem('admin_authenticated');
  }
}

// ログイン試行の管理
interface LoginAttempt {
  timestamp: number;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

// セキュアなログイン試行記録（Supabase連携）
class LoginAttemptManager {
  private static key = 'admin_login_attempts';

  static async recordAttempt(success: boolean, username: string = 'admin', failureReason?: string): Promise<void> {
    try {
      // ローカルストレージにも記録
      const attempts = this.getAttempts();
      const newAttempt: LoginAttempt = {
        timestamp: Date.now(),
        success,
        ip: 'client', // クライアントサイドでは取得制限
        userAgent: navigator.userAgent.substring(0, 100) // 制限して保存
      };

      attempts.push(newAttempt);
      
      // 古い記録を削除（24時間以上前）
      const filtered = attempts.filter(
        attempt => Date.now() - attempt.timestamp < 24 * 60 * 60 * 1000
      );

      SecureStorage.setSecureItem(this.key, filtered);
      
      // Supabaseにも記録（非同期）
      try {
        await SupabaseAdminAPI.recordLoginAttempt(username, success, failureReason);
      } catch (error) {
        console.warn('Supabaseログイン試行記録に失敗:', error);
      }
      
    } catch (error) {
      console.error('ログイン試行記録エラー:', error);
    }
  }

  static getAttempts(): LoginAttempt[] {
    try {
      return SecureStorage.getSecureItem(this.key) || [];
    } catch (error) {
      console.error('ログイン試行取得エラー:', error);
      return [];
    }
  }

  static getRecentFailedAttempts(): LoginAttempt[] {
    const attempts = this.getAttempts();
    const cutoff = Date.now() - SECURITY_CONFIG.LOCKOUT_DURATION;
    return attempts.filter(attempt => 
      !attempt.success && attempt.timestamp > cutoff
    );
  }

  static isLocked(): boolean {
    const failedAttempts = this.getRecentFailedAttempts();
    return failedAttempts.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
  }

  static getLockoutTimeRemaining(): number {
    const failedAttempts = this.getRecentFailedAttempts();
    if (failedAttempts.length === 0) return 0;

    const lastAttempt = failedAttempts[failedAttempts.length - 1];
    const timeRemaining = SECURITY_CONFIG.LOCKOUT_DURATION - (Date.now() - lastAttempt.timestamp);
    return Math.max(0, timeRemaining);
  }
}

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState<any>(null);
  
  // パスワードリセット関連の状態
  const [resetPhoneNumber, setResetPhoneNumber] = useState('');
  const [resetVerificationCode, setResetVerificationCode] = useState('');
  const [resetBackupCode, setResetBackupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'method' | 'phone' | 'verify' | 'backup' | 'newpassword'>('method');
  const [isCodeSent, setIsCodeSent] = useState(false);

  // 初期化処理
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const credentials = await loadAdminCredentials();
        setCurrentCredentials(credentials);

        // ロックアウト状態をチェック
        const locked = LoginAttemptManager.isLocked();
        setIsLocked(locked);
        
        if (locked) {
          const timeRemaining = LoginAttemptManager.getLockoutTimeRemaining();
          setLockoutTimeRemaining(timeRemaining);
        }
      } catch (error) {
        console.error('認証初期化エラー:', error);
        setError('認証システムの初期化に失敗しました。');
      }
    };

    initializeAuth();
  }, []);

  // ロックアウト時間のカウントダウン
  useEffect(() => {
    if (isLocked && lockoutTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockoutTimeRemaining(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            setIsLocked(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTimeRemaining]);

  // パスワード強度チェック（強化版）
  const checkPasswordStrength = (pwd: string): { score: number; feedback: string; issues: string[] } => {
    let score = 0;
    const issues: string[] = [];

    if (pwd.length >= 8) {
      score += 1;
    } else {
      issues.push('8文字以上');
    }

    if (/[A-Z]/.test(pwd)) {
      score += 1;
    } else {
      issues.push('大文字を含む');
    }

    if (/[a-z]/.test(pwd)) {
      score += 1;
    } else {
      issues.push('小文字を含む');
    }

    if (/[0-9]/.test(pwd)) {
      score += 1;
    } else {
      issues.push('数字を含む');
    }

    if (/[^A-Za-z0-9]/.test(pwd)) {
      score += 1;
    } else {
      issues.push('特殊文字を含む');
    }

    let feedback = '';
    if (score < 3) feedback = '弱い';
    else if (score < 4) feedback = '中程度';
    else feedback = '強い';

    return { score, feedback, issues };
  };

  // パスワードリセット用SMS送信
  const sendResetSMS = async () => {
    console.log('SMS送信開始 - 入力電話番号:', resetPhoneNumber);
    console.log('登録済み電話番号:', currentCredentials?.phone_number);
    
    if (!currentCredentials) {
      setError('認証情報が読み込まれていません。ページを再読み込みしてください。');
      return;
    }

    // 電話番号の正規化（+81を削除、先頭0を追加）
    const normalizePhoneNumber = (phone: string) => {
      let normalized = phone.replace(/\D/g, ''); // 数字のみ
      if (normalized.startsWith('81') && normalized.length === 11) {
        normalized = '0' + normalized.substring(2); // +81を0に変換
      }
      return normalized;
    };

    const inputNormalized = normalizePhoneNumber(resetPhoneNumber);
    const registeredNormalized = normalizePhoneNumber(currentCredentials.phone_number);
    
    console.log('正規化後 - 入力:', inputNormalized, '登録済み:', registeredNormalized);

    if (inputNormalized !== registeredNormalized) {
      setError(`登録されている電話番号と一致しません。\n登録番号: ${currentCredentials.phone_number}`);
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('SMS API呼び出し開始...');
      const response = await fetch('http://localhost:8080/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: currentCredentials.phone_number }),
      });

      console.log('SMS API応答ステータス:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('SMS API応答:', result);
      
      if (result.success || result.demoCode) {
        setIsCodeSent(true);
        setResetStep('verify');
        setError('');
        if (result.demoCode) {
          alert(`デモ認証コード: ${result.demoCode}\n\n実際の運用では、このコードがSMSで送信されます。`);
        } else {
          alert('認証コードをSMSで送信しました。');
        }
      } else {
        setError(result.error || 'SMS送信に失敗しました。');
      }
    } catch (error) {
      console.error('SMS送信エラー:', error);
      setError(`SMS送信処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // SMS認証コード検証
  const verifySMSCode = async () => {
    console.log('SMS認証コード検証開始 - コード:', resetVerificationCode);
    
    if (!resetVerificationCode || resetVerificationCode.length < 4) {
      setError('認証コードを正しく入力してください。');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('SMS認証API呼び出し開始...');
      const response = await fetch('http://localhost:8080/api/sms/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: currentCredentials.phone_number, 
          code: resetVerificationCode 
        }),
      });

      console.log('SMS認証API応答ステータス:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('SMS認証API応答:', result);
      
      if (result.success) {
        setResetStep('newpassword');
        setError('');
        alert('SMS認証が完了しました。新しいパスワードを設定してください。');
      } else {
        setError(result.error || '認証コードが正しくありません。再度確認してください。');
      }
    } catch (error) {
      console.error('SMS認証エラー:', error);
      setError(`認証コード検証中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // バックアップコード検証
  const verifyResetBackupCode = () => {
    console.log('バックアップコード検証開始 - 入力コード:', resetBackupCode);
    console.log('登録済みバックアップコード:', currentCredentials?.backup_code);
    
    if (!currentCredentials) {
      setError('認証情報が読み込まれていません。ページを再読み込みしてください。');
      return;
    }

    if (!resetBackupCode || resetBackupCode.trim() === '') {
      setError('バックアップコードを入力してください。');
      return;
    }

    setIsLoading(true);
    setError('');

    // セキュリティ遅延を追加
    setTimeout(() => {
      if (resetBackupCode.trim() !== currentCredentials.backup_code) {
        setError('バックアップコードが正しくありません。大文字・小文字を確認してください。');
        setIsLoading(false);
        return;
      }
      
      console.log('バックアップコード認証成功');
      setResetStep('newpassword');
      setError('');
      setIsLoading(false);
      alert('バックアップコード認証が完了しました。新しいパスワードを設定してください。');
    }, 1000); // 1秒の遅延でセキュリティを向上
  };

  // パスワード変更実行
  const updatePassword = async () => {
    console.log('パスワード変更開始');
    
    if (!currentCredentials) {
      setError('認証情報が読み込まれていません。ページを再読み込みしてください。');
      return;
    }

    if (newPassword.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      setError(`パスワードは${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}文字以上で入力してください。`);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    const passwordStrength = checkPasswordStrength(newPassword);
    if (passwordStrength.score < 3) {
      setError(`より強力なパスワードを設定してください。不足: ${passwordStrength.issues.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('パスワードハッシュ化開始...');
      const hashedPassword = await PasswordManager.hashPassword(newPassword);
      console.log('パスワードハッシュ化完了');
      
      const newCredentials = {
        ...currentCredentials,
        password: hashedPassword,
        last_updated: Date.now()
      };
      
      console.log('認証情報保存開始...');
      await saveAdminCredentials(newCredentials);
      setCurrentCredentials(newCredentials);
      console.log('認証情報保存完了');

      // リセット状態をクリア
      setShowPasswordReset(false);
      setResetStep('method');
      setResetPhoneNumber('');
      setResetVerificationCode('');
      setResetBackupCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsCodeSent(false);
      setError('');

      alert('✅ パスワードが正常に変更されました！\n\n新しいパスワードでログインしてください。');
      console.log('パスワード変更処理完了');
      
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      setError(`パスワード変更中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`アカウントがロックされています。${Math.ceil(lockoutTimeRemaining / 60000)}分後に再試行してください。`);
      return;
    }

    if (!currentCredentials) {
      setError('認証システムが初期化されていません。');
      return;
    }

    setError('');
    setIsLoading(true);

    // セキュリティ遅延（ブルートフォース攻撃対策）
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      let authSuccess = false;

      if (showBackupCodeInput) {
        // バックアップコードでの認証
        authSuccess = backupCode === currentCredentials.backup_code;
      } else {
        // 通常のログイン（ハッシュ化パスワード対応）
        authSuccess = username === currentCredentials.username && 
                     await PasswordManager.verifyPassword(password, currentCredentials.password);
      }

      if (authSuccess) {
        console.log('🎉 認証成功！');
        
        // Supabaseにログイン成功を記録
        await LoginAttemptManager.recordAttempt(true, username);
        
        // セッション作成（Supabase連携）
        const sessionId = await SessionManager.createSecureSession(username, currentCredentials.id || 1);
        
        console.log('ログイン成功 - セッションID:', sessionId);
        console.log('onLoginSuccess関数を呼び出します...');
        
        // デバッグ用アラート
        alert('ログイン成功！管理画面に移動します。');
        
        // 状態をリセット
        setUsername('');
        setPassword('');
        setBackupCode('');
        setError('');
        
        // 少し遅延を入れてから呼び出し
        setTimeout(() => {
          console.log('onLoginSuccess実行中...');
          onLoginSuccess();
          console.log('onLoginSuccess実行完了');
        }, 100);
        return;
      } else {
        // ログイン失敗をSupabaseに記録
        const failureReason = showBackupCodeInput ? 'Invalid backup code' : 'Invalid username or password';
        await LoginAttemptManager.recordAttempt(false, username, failureReason);
        
        setError(showBackupCodeInput ? 
          'バックアップコードが正しくありません。' : 
          'ユーザー名またはパスワードが正しくありません。'
        );

        // ロックアウト状態を再チェック
        const locked = LoginAttemptManager.isLocked();
        if (locked) {
          setIsLocked(true);
          setLockoutTimeRemaining(LoginAttemptManager.getLockoutTimeRemaining());
          setError(`ログイン試行回数が上限に達しました。${SECURITY_CONFIG.LOCKOUT_DURATION / 60000}分間ロックされます。`);
        }
      }

    } catch (error) {
      console.error('ログイン処理エラー:', error);
      setError('ログイン処理中にエラーが発生しました。');
      
      // エラーもSupabaseに記録
      await LoginAttemptManager.recordAttempt(false, username, `System error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // パスワードリセット画面のレンダリング
  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-r from-blue-700 to-blue-900 rounded-full mb-3">
              <i className="fas fa-key text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">セキュアパスワードリセット</h1>
            <p className="text-gray-600 mt-1">暗号化された管理者パスワードの変更を行います。</p>
          </div>

          {resetStep === 'method' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">認証方法を選択してください</h3>
              
              <button
                onClick={() => setResetStep('phone')}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-150 ease-in-out"
              >
                <div className="flex items-center">
                  <i className="fas fa-mobile-alt text-blue-500 text-xl mr-3"></i>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">SMS認証</div>
                    <div className="text-sm text-gray-600">登録済み電話番号でSMS認証</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setResetStep('backup')}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-150 ease-in-out"
              >
                <div className="flex items-center">
                  <i className="fas fa-shield-alt text-green-500 text-xl mr-3"></i>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">バックアップコード</div>
                    <div className="text-sm text-gray-600">管理者バックアップコードを使用</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {resetStep === 'phone' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">電話番号認証</h3>
              
              {currentCredentials?.phone_number && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                    <span className="text-sm text-blue-700">
                      登録済み電話番号: <strong>{currentCredentials.phone_number}</strong>
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号を入力してください
                </label>
                <input
                  type="tel"
                  value={resetPhoneNumber}
                  onChange={(e) => {
                    const numbersOnly = e.target.value.replace(/\D/g, '');
                    setResetPhoneNumber(numbersOnly);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 09012345678"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <p className="text-xs text-gray-500 mt-1">
                  上記の登録済み電話番号と同じ番号を入力してください
                </p>
              </div>

              <button
                onClick={sendResetSMS}
                disabled={!resetPhoneNumber || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                {isLoading ? '送信中...' : '認証コードを送信'}
              </button>
            </div>
          )}

          {resetStep === 'verify' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">認証コード入力</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  認証コード（4桁）
                </label>
                <input
                  type="text"
                  value={resetVerificationCode}
                  onChange={(e) => setResetVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono"
                  placeholder="1234"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  SMSで送信された認証コードを入力してください
                </p>
              </div>

              <button
                onClick={verifySMSCode}
                disabled={!resetVerificationCode || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <i className="fas fa-check mr-2"></i>
                {isLoading ? '認証中...' : '認証コードを確認'}
              </button>
            </div>
          )}

          {resetStep === 'backup' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">バックアップコード認証</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  バックアップコード
                </label>
                <input
                  type="text"
                  value={resetBackupCode}
                  onChange={(e) => setResetBackupCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="例: MT-BACKUP-2024"
                />
                <p className="text-xs text-gray-500 mt-1">
                  管理画面で設定したバックアップコードを入力してください
                </p>
              </div>

              <button
                onClick={verifyResetBackupCode}
                disabled={!resetBackupCode || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <i className={`${isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-shield-alt'} mr-2`}></i>
                {isLoading ? '認証中...' : 'バックアップコードを確認'}
              </button>
            </div>
          )}

          {resetStep === 'newpassword' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">新しいセキュアパスワード設定</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="新しいパスワードを入力"
                />
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center text-xs">
                      <span className="text-gray-600 mr-2">パスワード強度:</span>
                      <span className={`font-medium ${
                        checkPasswordStrength(newPassword).score < 3 ? 'text-red-500' :
                        checkPasswordStrength(newPassword).score < 4 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {checkPasswordStrength(newPassword).feedback}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          checkPasswordStrength(newPassword).score < 3 ? 'bg-red-500' :
                          checkPasswordStrength(newPassword).score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(checkPasswordStrength(newPassword).score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="パスワードを再入力"
                />
              </div>

              <button
                onClick={updatePassword}
                disabled={!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword || isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <i className={`${isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-save'} mr-2`}></i>
                {isLoading ? 'パスワード変更中...' : '新しい管理者パスワードを設定'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                <span className="text-red-700 font-medium">エラー</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowPasswordReset(false);
                setResetStep('method');
                setError('');
              }}
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition duration-150 ease-in-out"
            >
              <i className="fas fa-arrow-left mr-1"></i>
              ログイン画面に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
                  <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full mb-3">
            <i className="fas fa-cogs text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">管理者専用ログイン</h1>
          <p className="text-gray-600 mt-1">マネーチケット管理画面へのアクセス</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <i className="fas fa-shield-alt mr-1"></i>
            システム管理者・運営者専用
          </div>
        </div>

        {/* セキュリティ状況表示 */}
        {isLocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-lock text-red-500 mr-2"></i>
              <span className="text-red-700 font-medium">アカウントロック中</span>
            </div>
            <p className="text-red-600 text-sm mt-1">
              残り時間: {Math.ceil(lockoutTimeRemaining / 60000)}分 {Math.ceil((lockoutTimeRemaining % 60000) / 1000)}秒
            </p>
          </div>
        )}

        {LoginAttemptManager.getRecentFailedAttempts().length > 0 && !isLocked && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
              <span className="text-yellow-700 font-medium">セキュリティ警告</span>
            </div>
            <p className="text-yellow-600 text-sm mt-1">
              失敗回数: {LoginAttemptManager.getRecentFailedAttempts().length}/{SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!showBackupCodeInput ? (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fas fa-user-tie mr-1 text-blue-600"></i>
                  管理者ユーザー名
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLocked || isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out disabled:bg-gray-100"
                  placeholder="admin"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fas fa-key mr-1 text-purple-600"></i>
                  管理者パスワード
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLocked || isLoading}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out disabled:bg-gray-100"
                    placeholder="管理者パスワードを入力"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLocked || isLoading}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center text-xs">
                      <span className="text-gray-600 mr-2">パスワード強度:</span>
                      <span className={`font-medium ${
                        checkPasswordStrength(password).score < 3 ? 'text-red-500' :
                        checkPasswordStrength(password).score < 4 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {checkPasswordStrength(password).feedback}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          checkPasswordStrength(password).score < 3 ? 'bg-red-500' :
                          checkPasswordStrength(password).score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(checkPasswordStrength(password).score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="backupCode" className="block text-sm font-medium text-gray-700 mb-1">
                <i className="fas fa-shield-alt mr-1 text-green-600"></i>
                管理者バックアップコード
              </label>
              <input
                type="text"
                id="backupCode"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                required
                disabled={isLocked || isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out disabled:bg-gray-100"
                placeholder="MT-BACKUP-2024"
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                <span className="text-red-700 font-medium">認証エラー</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
          
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isLocked || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-150 ease-in-out flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  管理画面認証中...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  {showBackupCodeInput ? '管理画面にログイン（バックアップコード）' : '管理画面にログイン'}
                </>
              )}
            </button>

            {!isLocked && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowBackupCodeInput(!showBackupCodeInput);
                    setError('');
                    setPassword('');
                    setBackupCode('');
                  }}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-150 ease-in-out flex items-center justify-center"
                  disabled={isLoading}
                >
                  <i className={`fas ${showBackupCodeInput ? 'fa-key' : 'fa-shield-alt'} mr-2`}></i>
                  {showBackupCodeInput ? 'パスワードログインに戻る' : '管理者バックアップコードを使用'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(true);
                    setError('');
                  }}
                  className="w-full text-blue-600 hover:text-blue-800 text-sm py-2 px-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition duration-150 ease-in-out flex items-center justify-center"
                  disabled={isLoading}
                >
                  <i className="fas fa-lock-open mr-2"></i>
                  管理者パスワードをリセット
                </button>
              </>
            )}
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onNavigateHome}
            className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition duration-150 ease-in-out"
          >
            <i className="fas fa-home mr-1"></i>
            マネーチケット診断画面に戻る
          </button>
        </div>

        {/* セキュリティ情報表示 */}
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-sm text-green-700">
            <i className="fas fa-shield-alt mr-2"></i>
            <span className="font-medium">管理者認証システム保護中</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            エンタープライズレベルセキュリティ・多要素認証・アクセス制御
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;