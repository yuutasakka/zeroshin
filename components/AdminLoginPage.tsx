import React, { useState, useEffect } from 'react';
import { SupabaseAdminAuth, AdminCredentials } from './supabaseClient';

interface AdminLoginPageProps {
  onLogin: () => void;
  onNavigateHome: () => void;
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

  // セキュリティ設定
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15分

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

  // ロックアウト設定
  const setLockout = (attempts: number) => {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem('admin_lockout', JSON.stringify({
      until: lockoutUntil,
      attempts: attempts
    }));
    setIsLocked(true);
    setLockoutTime(lockoutUntil);
  };

  // ログイン試行回数の記録
  const recordFailedAttempt = async (reason: string) => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    // Supabaseにログイン試行を記録
    await SupabaseAdminAuth.recordLoginAttempt(
      username,
      false,
      reason,
      undefined, // IP address (ブラウザからは取得困難)
      navigator.userAgent
    );
    
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      setLockout(newAttempts);
      setError(`ログイン試行回数が上限に達しました。${LOCKOUT_DURATION / 60000}分後に再試行してください。`);
      
      // Supabaseに失敗回数を更新
      const lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
      await SupabaseAdminAuth.updateFailedAttempts(username, newAttempts, lockUntil);
    } else {
      setError(`ログインに失敗しました。あと${MAX_LOGIN_ATTEMPTS - newAttempts}回試行できます。`);
      await SupabaseAdminAuth.updateFailedAttempts(username, newAttempts);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 ログイン処理開始', { username, password: password ? '***' : 'empty' });
    
    if (isLocked) {
      const remainingTime = lockoutTime ? Math.ceil((lockoutTime - Date.now()) / 60000) : 0;
      setError(`アカウントがロックされています。あと${remainingTime}分お待ちください。`);
      console.log('🚫 アカウントロック中', { remainingTime });
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('ユーザー名とパスワードを入力してください。');
      console.log('❌ 入力検証失敗', { username: username.trim(), password: password.trim() });
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📊 監査ログ記録開始');
      // 監査ログに記録
      await SupabaseAdminAuth.recordAuditLog(
        'admin_login_attempt',
        `管理者ログイン試行: ${username}`,
        username,
        'info',
        { user_agent: navigator.userAgent }
      );

      console.log('🔍 管理者認証情報取得開始', { username });
      // Supabaseから管理者認証情報を取得
      const adminCredentials = await SupabaseAdminAuth.getAdminCredentials(username);
      
      console.log('📋 認証情報取得結果', { 
        found: !!adminCredentials, 
        username: adminCredentials?.username,
        isActive: adminCredentials?.is_active,
        failedAttempts: adminCredentials?.failed_attempts
      });
      
      if (!adminCredentials) {
        console.log('❌ 認証情報なし - 失敗記録開始');
        await recordFailedAttempt('ユーザー名が見つかりません');
        setLoading(false);
        return;
      }

      // アカウントロック状態チェック
      if (adminCredentials.locked_until) {
        const lockedUntil = new Date(adminCredentials.locked_until).getTime();
        if (Date.now() < lockedUntil) {
          const remainingTime = Math.ceil((lockedUntil - Date.now()) / 60000);
          setError(`アカウントがロックされています。あと${remainingTime}分お待ちください。`);
          console.log('🚫 データベースアカウントロック中', { lockedUntil, remainingTime });
          setLoading(false);
          return;
        }
      }

      console.log('🔑 パスワード検証開始');
      // パスワード検証
      const isPasswordValid = await SupabaseAdminAuth.verifyPassword(password, adminCredentials.password_hash);
      console.log('🔑 パスワード検証結果', { isValid: isPasswordValid });
      
      if (!isPasswordValid) {
        console.log('❌ パスワード不一致 - 失敗記録開始');
        await recordFailedAttempt('パスワードが一致しません');
        setLoading(false);
        return;
      }

      console.log('✅ ログイン成功 - 後処理開始');
      // ログイン成功
      await SupabaseAdminAuth.recordLoginAttempt(
        username,
        true,
        undefined,
        undefined,
        navigator.userAgent
      );

      await SupabaseAdminAuth.updateSuccessfulLogin(username);

      await SupabaseAdminAuth.recordAuditLog(
        'admin_login_success',
        `管理者ログイン成功: ${username}`,
        username,
        'info',
        { user_agent: navigator.userAgent }
      );
      
      // セッション情報を保存
      const sessionData = {
        username: adminCredentials.username,
        loginTime: new Date().toISOString(),
        expiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分
        authenticated: true
      };
      
      console.log('💾 セッション保存', sessionData);
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      localStorage.removeItem('admin_lockout'); // ロックアウト情報をクリア
      
      setLoginAttempts(0);
      setIsLocked(false);
      setLockoutTime(null);
      
      console.log('🚀 onLogin コールバック実行');
      onLogin();

    } catch (error) {
      console.error('💥 管理者ログインエラー:', error);
      await SupabaseAdminAuth.recordAuditLog(
        'admin_login_error',
        `管理者ログインエラー: ${error}`,
        username,
        'error',
        { error: String(error), user_agent: navigator.userAgent }
      );
      setError('ログイン処理中にエラーが発生しました。しばらく待ってから再試行してください。');
    } finally {
      setLoading(false);
      console.log('🏁 ログイン処理終了');
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
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1C5.03 1 1 5.03 1 10s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM9 7v4h2V7H9zm0 6v2h2v-2H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">アカウントロック中</h3>
                  <p className="text-sm text-red-700 mt-1">
                    残り時間: {getRemainingLockoutTime()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="管理者ユーザー名を入力"
                disabled={loading || isLocked}
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="パスワードを入力"
                  disabled={loading || isLocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading || isLocked}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ログイン中...
                </div>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onNavigateHome}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
              disabled={loading}
            >
              ホームページに戻る
            </button>
          </div>
        </div>

        {/* セキュリティ情報 */}
        <div className="text-center text-xs text-gray-500">
          <p>このページは暗号化された接続で保護されています</p>
          <p className="mt-1">最大試行回数: {MAX_LOGIN_ATTEMPTS}回 | ロックアウト時間: {LOCKOUT_DURATION / 60000}分</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;