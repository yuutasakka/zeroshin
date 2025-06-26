import React, { useState, FormEvent, useEffect } from 'react';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

interface LoginAttempt {
  timestamp: number;
  success: boolean;
  ip?: string;
}

// セキュリティ設定
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分
  SESSION_TIMEOUT: 30 * 60 * 1000,  // 30分
  PASSWORD_MIN_LENGTH: 8,
  REQUIRE_2FA: false, // 2FA有効化フラグ
};

// より安全なデフォルト認証情報（実際は環境変数から取得すべき）
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "MoneyTicket2024!",
  backup_code: "MT-BACKUP-2024",
  phone_number: "+81901234567" // 管理者の登録電話番号
};

// 管理者データの永続化用関数
const saveAdminCredentials = (newCredentials: typeof ADMIN_CREDENTIALS) => {
  localStorage.setItem('admin_credentials', JSON.stringify(newCredentials));
};

const loadAdminCredentials = (): typeof ADMIN_CREDENTIALS => {
  const stored = localStorage.getItem('admin_credentials');
  return stored ? { ...ADMIN_CREDENTIALS, ...JSON.parse(stored) } : ADMIN_CREDENTIALS;
};

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // パスワードリセット関連の状態
  const [resetPhoneNumber, setResetPhoneNumber] = useState('');
  const [resetVerificationCode, setResetVerificationCode] = useState('');
  const [resetBackupCode, setResetBackupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'method' | 'phone' | 'verify' | 'backup' | 'newpassword'>('method');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState(loadAdminCredentials());

  // ローカルストレージから試行履歴を読み込み
  useEffect(() => {
    const storedAttempts = localStorage.getItem('admin_login_attempts');
    if (storedAttempts) {
      const attempts: LoginAttempt[] = JSON.parse(storedAttempts);
      const recentAttempts = attempts.filter(
        attempt => Date.now() - attempt.timestamp < SECURITY_CONFIG.LOCKOUT_DURATION
      );
      setLoginAttempts(recentAttempts);
      
      const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
      if (failedAttempts.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        setIsLocked(true);
        const lastAttempt = failedAttempts[failedAttempts.length - 1];
        const timeRemaining = SECURITY_CONFIG.LOCKOUT_DURATION - (Date.now() - lastAttempt.timestamp);
        setLockoutTimeRemaining(Math.max(0, timeRemaining));
      }
    }
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

  // パスワード強度チェック
  const checkPasswordStrength = (pwd: string): { score: number; feedback: string } => {
    let score = 0;
    let feedback = '';

    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score < 3) feedback = '弱い';
    else if (score < 4) feedback = '中程度';
    else feedback = '強い';

    return { score, feedback };
  };

  // ログイン試行を記録
  const recordLoginAttempt = (success: boolean) => {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      success,
    };
    
    const updatedAttempts = [...loginAttempts, attempt];
    setLoginAttempts(updatedAttempts);
    localStorage.setItem('admin_login_attempts', JSON.stringify(updatedAttempts));
  };

  // セッション管理
  const createSession = () => {
    const sessionData = {
      timestamp: Date.now(),
      username: username,
      expires: Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT
    };
    localStorage.setItem('admin_session', JSON.stringify(sessionData));
    sessionStorage.setItem('admin_authenticated', 'true');
  };

  // パスワードリセット用SMS送信
  const sendResetSMS = async () => {
    if (resetPhoneNumber !== currentCredentials.phone_number) {
      setError('登録されている電話番号と一致しません。');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: resetPhoneNumber }),
      });

      const result = await response.json();
      if (result.success || result.demoCode) {
        setIsCodeSent(true);
        setResetStep('verify');
        setError('');
        if (result.demoCode) {
          // デモ用認証コードの表示
          alert(`認証コード: ${result.demoCode}`);
        }
      } else {
        setError(result.error || 'SMS送信に失敗しました。');
      }
    } catch (error) {
      setError('SMS送信処理中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // SMS認証コード検証
  const verifySMSCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/sms/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: resetPhoneNumber, 
          verificationCode: resetVerificationCode 
        }),
      });

      const result = await response.json();
      if (result.success) {
        setResetStep('newpassword');
        setError('');
      } else {
        setError(result.error || '認証コードが正しくありません。');
      }
    } catch (error) {
      setError('認証コード検証中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // バックアップコード検証（パスワードリセット用）
  const verifyResetBackupCode = () => {
    if (resetBackupCode === currentCredentials.backup_code) {
      setResetStep('newpassword');
      setError('');
    } else {
      setError('バックアップコードが正しくありません。');
    }
  };

  // パスワード変更実行
  const updatePassword = () => {
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
      setError('より強力なパスワードを設定してください。');
      return;
    }

    // 新しい認証情報を保存
    const newCredentials = {
      ...currentCredentials,
      password: newPassword
    };
    saveAdminCredentials(newCredentials);
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
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`アカウントがロックされています。${Math.ceil(lockoutTimeRemaining / 60000)}分後に再試行してください。`);
      return;
    }

    setError('');
    setIsLoading(true);

    // 人工的な遅延でブルートフォース攻撃を防ぐ
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // バックアップコードでのログイン
      if (showBackupCodeInput) {
        if (backupCode === currentCredentials.backup_code) {
          recordLoginAttempt(true);
          createSession();
          onLoginSuccess();
          return;
        } else {
          recordLoginAttempt(false);
          setError('バックアップコードが正しくありません。');
        }
      } else {
        // 通常のログイン
        if (username === currentCredentials.username && password === currentCredentials.password) {
          recordLoginAttempt(true);
          createSession();
          onLoginSuccess();
          return;
        } else {
          recordLoginAttempt(false);
          setError('ユーザー名またはパスワードが正しくありません。');
        }
      }

      // 失敗した場合のロックアウトチェック
      const failedAttempts = loginAttempts.filter(attempt => !attempt.success).length + 1;
      if (failedAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        setIsLocked(true);
        setLockoutTimeRemaining(SECURITY_CONFIG.LOCKOUT_DURATION);
        setError(`ログイン試行回数が上限に達しました。${SECURITY_CONFIG.LOCKOUT_DURATION / 60000}分間ロックされます。`);
      }

    } catch (error) {
      setError('ログイン処理中にエラーが発生しました。');
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
            <h1 className="text-3xl font-bold text-gray-800">パスワードリセット</h1>
            <p className="text-gray-600 mt-1">管理者パスワードの変更を行います。</p>
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
                  onChange={(e) => setResetPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 09012345678"
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
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    SMS送信中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    認証コードを送信
                  </>
                )}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 1234"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {resetPhoneNumber} に送信された4桁のコードを入力してください
                </p>
              </div>

              <button
                onClick={verifySMSCode}
                disabled={resetVerificationCode.length !== 4 || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    認証中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    認証コードを確認
                  </>
                )}
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
                  placeholder="MT-BACKUP-2024"
                />
                <p className="text-xs text-gray-500 mt-1">
                  管理者バックアップコードを入力してください
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">新しいパスワード設定</h3>
              
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
                パスワードを変更
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
          <div className="inline-block p-3 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full mb-3">
            <i className="fas fa-user-shield text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">管理者ログイン</h1>
          <p className="text-gray-600 mt-1">管理画面にアクセスするためにログインしてください。</p>
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

        {loginAttempts.filter(a => !a.success).length > 0 && !isLocked && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
              <span className="text-yellow-700 font-medium">セキュリティ警告</span>
            </div>
            <p className="text-yellow-600 text-sm mt-1">
              失敗回数: {loginAttempts.filter(a => !a.success).length}/{SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!showBackupCodeInput ? (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザー名
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLocked || isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-150 ease-in-out disabled:bg-gray-100"
                  placeholder="admin"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLocked || isLoading}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-150 ease-in-out disabled:bg-gray-100"
                    placeholder="MoneyTicket2024!"
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
                バックアップコード
              </label>
              <input
                type="text"
                id="backupCode"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                required
                disabled={isLocked || isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-150 ease-in-out disabled:bg-gray-100"
                placeholder="MT-BACKUP-2024"
              />
              <p className="text-xs text-gray-500 mt-1">
                管理者バックアップコードを入力してください
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                <span className="text-red-700 font-medium">エラー</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
          
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isLocked || isLoading}
              className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-opacity-50 transition duration-150 ease-in-out flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  認証中...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  {showBackupCodeInput ? 'バックアップコードでログイン' : 'ログイン'}
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
                  {showBackupCodeInput ? '通常ログインに戻る' : 'バックアップコードを使用'}
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
                  パスワードを忘れた場合
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
            ホームページに戻る
          </button>
        </div>
      </div>

       <footer className="mt-6 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} MoneyTicket Admin. All rights reserved.
      </footer>
    </div>
  );
};

export default AdminLoginPage;