import React, { useState, useEffect } from 'react';
import { SecureConfigManager, secureLog, SECURITY_CONFIG } from '../security.config';

interface AdminLoginPageProps {
  onLogin: () => void;
  onNavigateHome: () => void;
}

interface AdminCredentials {
  username: string;
  password_hash: string;
  phone_number: string;
  backup_code: string;
  last_updated: string;
  failed_attempts: number;
  locked_until?: string;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin, onNavigateHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  // ロックアウト状態チェック
  useEffect(() => {
    const checkLockout = () => {
      const lockoutData = localStorage.getItem('admin_lockout');
      if (lockoutData) {
        const { until, attempts } = JSON.parse(lockoutData);
        const now = Date.now();
        
        if (now < until) {
          setIsLocked(true);
          setLockoutTime(until);
          setLoginAttempts(attempts);
        } else {
          // ロックアウト期間終了
          localStorage.removeItem('admin_lockout');
          setIsLocked(false);
          setLockoutTime(null);
          setLoginAttempts(0);
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // パスワードハッシュ化関数（簡易版、本番ではより強力な実装を推奨）
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // ロックアウト設定
  const setLockout = (attempts: number) => {
    const lockoutUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
    localStorage.setItem('admin_lockout', JSON.stringify({
      until: lockoutUntil,
      attempts: attempts
    }));
    setIsLocked(true);
    setLockoutTime(lockoutUntil);
  };

  // ログイン試行回数の記録
  const recordFailedAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    if (newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      setLockout(newAttempts);
      setError(`ログイン試行回数が上限に達しました。${SECURITY_CONFIG.LOCKOUT_DURATION / 60000}分後に再試行してください。`);
    } else {
      setError(`ログインに失敗しました。あと${SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - newAttempts}回試行できます。`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      const remainingTime = lockoutTime ? Math.ceil((lockoutTime - Date.now()) / 60000) : 0;
      setError(`アカウントがロックされています。あと${remainingTime}分お待ちください。`);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('ユーザー名とパスワードを入力してください。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      secureLog('管理者ログイン試行開始', { username });

      // Supabaseから管理者認証情報を取得
      const adminCredentials: AdminCredentials = await SecureConfigManager.getAdminCredentials();
      
      if (!adminCredentials) {
        setError('管理者認証情報が設定されていません。システム管理者にお問い合わせください。');
        setLoading(false);
        return;
      }

      // アカウントロック状態チェック
      if (adminCredentials.locked_until) {
        const lockedUntil = new Date(adminCredentials.locked_until).getTime();
        if (Date.now() < lockedUntil) {
          const remainingTime = Math.ceil((lockedUntil - Date.now()) / 60000);
          setError(`アカウントがロックされています。あと${remainingTime}分お待ちください。`);
          setLoading(false);
          return;
        }
      }

      // ユーザー名チェック
      if (username.trim() !== adminCredentials.username) {
        recordFailedAttempt();
        secureLog('管理者ログイン失敗: ユーザー名不一致', { providedUsername: username });
        setLoading(false);
        return;
      }

      // パスワードハッシュの検証
      const providedPasswordHash = await hashPassword(password);
      if (providedPasswordHash !== adminCredentials.password_hash) {
        recordFailedAttempt();
        secureLog('管理者ログイン失敗: パスワード不一致');
        setLoading(false);
        return;
      }

      // ログイン成功
      secureLog('管理者ログイン成功', { username });
      
      // セッション情報を保存
      const sessionData = {
        username: adminCredentials.username,
        loginTime: new Date().toISOString(),
        expiryTime: new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT).toISOString(),
        authenticated: true
      };
      
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      localStorage.removeItem('admin_lockout'); // ロックアウト情報をクリア
      
      setLoginAttempts(0);
      setIsLocked(false);
      setLockoutTime(null);
      onLogin();

    } catch (error) {
      secureLog('管理者ログインエラー', error);
      setError('ログイン処理中にエラーが発生しました。しばらく待ってから再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingLockoutTime = (): string => {
    if (!lockoutTime) return '';
    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
    if (remaining <= 0) return '';
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">管理者ログイン</h2>
          <p className="mt-2 text-sm text-gray-600">MoneyTicket 管理画面</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-red-800">
                    アカウントがロックされています
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    残り時間: {getRemainingLockoutTime()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading || isLocked}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="管理者ユーザー名"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || isLocked}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="管理者パスワード"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isLocked}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {loginAttempts > 0 && !isLocked && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ログイン試行回数: {loginAttempts}/{SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || isLocked}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    認証中...
                  </div>
                ) : (
                  'ログイン'
                )}
              </button>

              <button
                type="button"
                onClick={onNavigateHome}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </form>

          {/* セキュリティ情報 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p>🔒 このページはSSL暗号化で保護されています</p>
              <p>🛡️ ログイン試行は{SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}回まで制限されています</p>
              <p>⏱️ セッションは{SECURITY_CONFIG.SESSION_TIMEOUT / 60000}分で自動タイムアウトします</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;