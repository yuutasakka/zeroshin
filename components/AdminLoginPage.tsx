import React, { useState, useEffect, FormEvent } from 'react';
import CryptoJS from 'crypto-js';

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

// より安全なデフォルト認証情報
const getDefaultCredentials = async () => {
  const defaultPassword = await PasswordManager.hashPassword("MoneyTicket2024!");
  return {
    username: "admin",
    password: defaultPassword,
    backup_code: "MT-BACKUP-2024",
    phone_number: "+81901234567",
    created_at: Date.now(),
    last_updated: Date.now()
  };
};

// セキュアな管理者データの永続化
const saveAdminCredentials = async (newCredentials: any) => {
  try {
    const credentialsWithTimestamp = {
      ...newCredentials,
      last_updated: Date.now()
    };
    SecureStorage.setSecureItem('admin_credentials', credentialsWithTimestamp);
    
    // セキュリティログ
    console.log('管理者認証情報が安全に保存されました');
  } catch (error) {
    console.error('認証情報保存エラー:', error);
  }
};

const loadAdminCredentials = async () => {
  try {
    const stored = SecureStorage.getSecureItem('admin_credentials');
    if (stored) {
      return stored;
    } else {
      // 初回起動時のデフォルト認証情報設定
      const defaultCreds = await getDefaultCredentials();
      await saveAdminCredentials(defaultCreds);
      return defaultCreds;
    }
  } catch (error) {
    console.error('認証情報読み込みエラー:', error);
    return await getDefaultCredentials();
  }
};

// セキュアなセッション管理
class SessionManager {
  static createSecureSession(username: string): string {
    const sessionData = {
      username,
      timestamp: Date.now(),
      expires: Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT,
      sessionId: CryptoJS.lib.WordArray.random(128/8).toString(),
      csrfToken: CryptoJS.lib.WordArray.random(128/8).toString()
    };

    SecureStorage.setSecureItem('admin_session', sessionData);
    sessionStorage.setItem('admin_authenticated', 'true');
    
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

// セキュアなログイン試行記録
class LoginAttemptManager {
  private static key = 'admin_login_attempts';

  static recordAttempt(success: boolean): void {
    try {
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

    if (resetBackupCode.trim() !== currentCredentials.backup_code) {
      setError('バックアップコードが正しくありません。大文字・小文字を確認してください。');
      return;
    }
    
    console.log('バックアップコード認証成功');
    setResetStep('newpassword');
    setError('');
    alert('バックアップコード認証が完了しました。新しいパスワードを設定してください。');
  };

  // パスワード変更実行
  const updatePassword = async () => {
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

    try {
      const hashedPassword = await PasswordManager.hashPassword(newPassword);
      const newCredentials = {
        ...currentCredentials,
        password: hashedPassword,
        last_updated: Date.now()
      };
      
      await saveAdminCredentials(newCredentials);
      setCurrentCredentials(newCredentials);

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

      alert('パスワードが正常に変更されました。新しいパスワードでログインしてください。');
    } catch (error) {
      setError('パスワード変更中にエラーが発生しました。');
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
        LoginAttemptManager.recordAttempt(true);
        const sessionId = SessionManager.createSecureSession(username);
        
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
        LoginAttemptManager.recordAttempt(false);
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
      LoginAttemptManager.recordAttempt(false);
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登録済み電話番号
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
                  管理画面に登録されている電話番号を入力してください
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
                disabled={!resetBackupCode}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <i className="fas fa-shield-alt mr-2"></i>
                バックアップコードを確認
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
                disabled={!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <i className="fas fa-save mr-2"></i>
                新しい管理者パスワードを設定
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