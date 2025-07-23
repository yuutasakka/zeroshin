import React, { useState, useEffect } from 'react';
import { SupabaseAdminAuth, supabase } from './supabaseClient';
import { secureLog, SecureStorage } from '../../security.config';
import AdminDefaultAccount from './AdminDefaultAccount';

// セキュリティ強化のための入力サニタイゼーション
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>"'&]/g, '') // 危険な文字を除去
    .trim()
    .substring(0, 100); // 長さ制限
};

interface AdminLoginPageProps {
  onLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToPasswordReset?: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin, onNavigateHome, onNavigateToPasswordReset }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'change-password' | 'email-verify' | 'sms-verify'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [pendingAdminId, setPendingAdminId] = useState<number | null>(null);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string>('');
  const [showDefaultAccount, setShowDefaultAccount] = useState(false);

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

  // メール認証付き新規登録ハンドラー
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ロックアウト状態の確認
    if (isLocked && lockoutTime && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 60000);
      setError(`アカウントがロックされています。あと${remainingTime}分お待ちください。`);
      return;
    }
    
    // 入力をサニタイゼーション
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, ''); // 数字のみ
    
    secureLog('新規管理者メール認証開始', { email: sanitizedEmail });
    
    // 入力値検証
    if (!sanitizedEmail || !password || !confirmPassword || !sanitizedPhoneNumber || !fullName || !reason) {
      setError('すべての必須項目を入力してください。');
      return;
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setError('有効なメールアドレスを入力してください。');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (!/^\d{10,11}$/.test(sanitizedPhoneNumber)) {
      setError('電話番号は10〜11桁の数字で入力してください。');
      return;
    }

    // パスワード強度チェック
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    // 許可する記号を拡張
    const allowedSymbols = "!@#$%^&*()_+-=[]{};':\"|,.<>/?`~";
    const hasSymbol = new RegExp(`[${allowedSymbols.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')}]`).test(password);
    const hasMinLength = password.length >= 8;
    const hasOnlyAllowedChars = new RegExp(`^[A-Za-z0-9${allowedSymbols.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')}]+$`).test(password);

    if (!hasMinLength) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }
    if (!hasLowerCase) {
      setError('パスワードに小文字（a-z）を含めてください。');
      return;
    }
    if (!hasUpperCase) {
      setError('パスワードに大文字（A-Z）を含めてください。');
      return;
    }
    if (!hasNumber) {
      setError('パスワードに数字（0-9）を含めてください。');
      return;
    }
    if (!hasSymbol) {
      setError('パスワードに記号（!@#$%^&*()_+-=[]{};\':\"|,.<>/?`~）のいずれかを含めてください。');
      return;
    }
    if (!hasOnlyAllowedChars) {
      setError('パスワードに使用できない文字が含まれています。使用可能な記号: !@#$%^&*()_+-=[]{};\':\"|,.<>/?`~');
      // 新規登録の失敗も試行回数としてカウント
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockout(newAttempts);
        setError(`試行回数が上限に達しました。${LOCKOUT_DURATION / 60000}分後に再試行してください。`);
      }
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // パスワードをハッシュ化
      const hashedPassword = await SupabaseAdminAuth.hashPassword(password);
      
      // 管理者登録申請を作成
      const registrationData = {
        email: sanitizedEmail,
        password_hash: hashedPassword,
        full_name: fullName,
        phone_number: `+81${sanitizedPhoneNumber}`,
        reason: reason,
        department: department || '',
        role: role || 'admin',
        status: 'pending'
      };

      // 登録申請をSupabaseに保存
      const { data: registration, error: registrationError } = await supabase
        .from('admin_registrations')
        .insert([registrationData])
        .select()
        .single();

      if (registrationError) {
        throw registrationError;
      }

      setSuccess('管理者登録申請が送信されました。承認されるまでお待ちください。');
      
      // 監査ログに記録
      await SupabaseAdminAuth.recordAuditLog(
        'admin_registration_requested',
        `管理者登録申請: ${sanitizedEmail}`,
        sanitizedEmail,
        'info',
        { 
          phone_number: `+81${sanitizedPhoneNumber}`, 
          full_name: fullName,
          department: department,
          user_agent: navigator.userAgent 
        }
      );

      // フォームをリセット
      setTimeout(() => {
        setMode('login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPhoneNumber('');
        setFullName('');
        setDepartment('');
        setRole('admin');
        setReason('');
      }, 3000);
    } catch (error) {
      setError('メール認証処理中にエラーが発生しました。しばらく待ってから再試行してください。');
      secureLog('管理者メール認証エラー:', error);
      
      // 監査ログに記録
      await SupabaseAdminAuth.recordAuditLog(
        'admin_email_verification_error',
        `管理者メール認証エラー: ${sanitizedEmail}`,
        sanitizedEmail,
        'error',
        { error: error instanceof Error ? error.message : String(error), user_agent: navigator.userAgent }
      );
    } finally {
      setLoading(false);
    }
  };

  // ログインハンドラー
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ロックアウト状態を再チェック
    const lockoutData = localStorage.getItem('admin_lockout');
    if (lockoutData) {
      const { until } = JSON.parse(lockoutData);
      if (Date.now() < until) {
        const remainingTime = Math.ceil((until - Date.now()) / 60000);
        setError(`アカウントがロックされています。あと${remainingTime}分お待ちください。`);
        return;
      } else {
        // ロックアウト期間が終了していたらクリア
        localStorage.removeItem('admin_lockout');
        setIsLocked(false);
        setLockoutTime(null);
        setLoginAttempts(0);
      }
    }
    
    // 試行回数を即座にカウントアップ
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    // 最大試行回数に達した場合はロックアウト
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      setLockout(newAttempts);
      setError(`ログイン試行回数が上限に達しました。${LOCKOUT_DURATION / 60000}分後に再試行してください。`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    // 入力をサニタイゼーション
    const sanitizedUsername = sanitizeInput(username);
    
    secureLog('管理者ログイン処理開始', { username: sanitizedUsername, attempt: newAttempts });

    // 基本検証 - パスワードはサニタイズしない
    if (!sanitizedUsername || !password) {
      setError(`ユーザー名とパスワードを入力してください。（残り${MAX_LOGIN_ATTEMPTS - newAttempts}回）`);
      setLoading(false);
      return;
    }
    
    console.log('🔐 入力確認', {
      username: sanitizedUsername,
      passwordLength: password.length,
      passwordContainsSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    });

    try {
      secureLog('監査ログ記録開始');
      // 監査ログに記録
      await SupabaseAdminAuth.recordAuditLog(
        'admin_login_attempt',
        `管理者ログイン試行: ${sanitizedUsername}`,
        sanitizedUsername,
        'info',
        { user_agent: navigator.userAgent }
      );

      // ローカルフォールバック機能
      let adminCredentials = null;
      let useLocalFallback = false;
      
      try {
        secureLog('管理者認証情報取得開始', { username: sanitizedUsername });
        // Supabaseから管理者認証情報を取得
        adminCredentials = await SupabaseAdminAuth.getAdminCredentials(sanitizedUsername);
        
        secureLog('管理者認証情報取得結果', {
          found: !!adminCredentials, 
          username: adminCredentials?.username,
          isActive: adminCredentials?.is_active,
          failedAttempts: adminCredentials?.failed_attempts
        });
      } catch (supabaseError) {
        console.warn('Supabase接続エラー、ローカルフォールバックを使用', supabaseError);
        
        // ローカルフォールバック: 環境変数から取得
        // ハードコードされた認証情報は削除されました
        // 管理者アカウントはデータベースまたは環境変数で管理してください
      }
      
      if (!adminCredentials) {
        setError(`ユーザー名が見つかりません。（残り${MAX_LOGIN_ATTEMPTS - newAttempts}回）`);
        // 監査ログに記録
        await SupabaseAdminAuth.recordLoginAttempt(
          sanitizedUsername,
          false,
          'ユーザー名が見つかりません',
          undefined,
          navigator.userAgent
        );
        setLoading(false);
        return;
      }

      // セキュリティ強化: 適切な認証検証を実行

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

      
      // デフォルトパスワードチェック（簡易実装）
      const defaultHashes = [
        SecureStorage.computeHash('admin'), 
        SecureStorage.computeHash('')
      ];
      
      if (defaultHashes.includes(adminCredentials.password_hash)) {
        setError('セキュリティのため、初回ログイン時にパスワードを変更してください。');
        setMode('change-password');
        setLoading(false);
        return;
      }

      // セキュリティ強化: 適切なパスワード検証を実行
      let isPasswordValid = false;
      
      console.log('🔑 パスワード検証開始', {
        sanitizedUsername,
        passwordLength: password.length,
        useLocalFallback,
        hasAdminCredentials: !!adminCredentials,
        passwordHash: adminCredentials?.password_hash?.substring(0, 20) + '...'
      });
      
      // ハードコードされたデフォルトアカウントは無効化
      if (false) {
        // セキュリティ上の理由で無効化
        isPasswordValid = false;
      } else if (useLocalFallback) {
        // ローカルフォールバック時は直接比較
        console.log('❌ ローカルフォールバック: 他のアカウントは許可されません');
        isPasswordValid = false; // 他のアカウントは許可しない
      } else {
        try {
          console.log('🔍 SupabaseAdminAuth.verifyPasswordを呼び出し中...');
          isPasswordValid = await SupabaseAdminAuth.verifyPassword(password, adminCredentials.password_hash);
          console.log('🔍 verifyPassword結果:', isPasswordValid);
        } catch (verifyError) {
          console.warn('⚠️ パスワード検証エラー', verifyError);
          // エラー時のフォールバックは無効化
          // セキュリティ上の理由でハードコードされた認証情報は削除
          isPasswordValid = false;
        }
      }
      
      if (!isPasswordValid) {
        setError(`ユーザー名またはパスワードが正しくありません。（残り${MAX_LOGIN_ATTEMPTS - newAttempts}回）`);
        
        // 監査ログに記録
        await SupabaseAdminAuth.recordLoginAttempt(
          sanitizedUsername,
          false,
          'パスワードが正しくありません',
          undefined,
          navigator.userAgent
        );
        
        // Supabaseに失敗回数を更新（試行）
        try {
          if (!useLocalFallback) {
            await SupabaseAdminAuth.updateFailedAttempts(sanitizedUsername, newAttempts);
          }
        } catch (updateError) {
          console.warn('失敗回数の更新エラー:', updateError);
        }
        
        setLoading(false);
        return;
      }

      // 認証成功: 安全なセッション情報を保存
      const sessionData = {
        username: adminCredentials.username,
        loginTime: new Date().toISOString(),
        authenticated: true,
        expires: Date.now() + (2 * 60 * 60 * 1000) // 2時間有効
      };
      
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      sessionStorage.setItem('admin_authenticated', 'true');
      localStorage.removeItem('admin_lockout');
      
      // 試行回数をリセット
      setLoginAttempts(0);
      setIsLocked(false);
      setLockoutTime(null);

      console.log('Secure authentication completed');
      
      // 認証成功時のみログイン完了
      onLogin();
    } catch (error) {
      setError('ログイン処理中にエラーが発生しました。しばらく待ってから再試行してください。');
      secureLog('管理者ログインエラー:', error);
      
      // 監査ログに記録（技術的詳細は監査ログのみに記録）
      await SupabaseAdminAuth.recordAuditLog(
        'admin_login_error',
        `管理者ログインエラー: ${sanitizedUsername}`,
        sanitizedUsername,
        'error',
        { 
          error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // SMS認証コード検証ハンドラー
  const handleSMSVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pendingAdminId || !smsCode) {
      setError('SMS認証コードを入力してください。');
      return;
    }

    if (smsCode.length !== 6) {
      setError('SMS認証コードは6桁で入力してください。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // SMS認証機能は現在実装されていません - スタブ実装
      const result = { success: false, error: 'SMS認証機能は現在無効化されています' };

      if (result.success) {
        // SMS認証成功 - 最終ログイン完了
        const sessionData = {
          username: username,
          loginTime: new Date().toISOString(),
          sessionId: crypto.randomUUID(),
          adminId: pendingAdminId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分で期限切れ
          lastActivity: new Date().toISOString()
        };
        
        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        sessionStorage.setItem('admin_authenticated', 'true');
        
        // セッション期限の監視を開始
        // const sessionExpiry = setTimeout(() => {
        //   localStorage.removeItem('admin_session');
        //   sessionStorage.removeItem('admin_authenticated');
        //   window.location.reload(); // セッション期限切れ時の自動ログアウト
        // }, 30 * 60 * 1000); // 30分

        // 監査ログに記録
        await SupabaseAdminAuth.recordAuditLog(
          'admin_login_success',
          `管理者ログイン成功（2段階認証完了）: ${username}`,
          username,
          'info',
          { session_id: sessionData.sessionId, admin_id: pendingAdminId, user_agent: navigator.userAgent }
        );

        secureLog('管理者ログイン成功（2段階認証完了）', { username, adminId: pendingAdminId });
        
        // 状態をリセット
        setPendingAdminId(null);
        setPendingPhoneNumber('');
        setSmsCode('');
        
        onLogin();
      } else {
        setError(result.error || 'SMS認証に失敗しました。');
        
        // 監査ログに記録
        await SupabaseAdminAuth.recordAuditLog(
          'admin_sms_verification_failure',
          `管理者SMS認証失敗: ${username} - ${result.error}`,
          username,
          'warning',
          { admin_id: pendingAdminId, error: result.error, user_agent: navigator.userAgent }
        );
      }
    } catch (error) {
      setError('SMS認証処理中にエラーが発生しました。');
      secureLog('管理者SMS認証エラー:', error);
      
      // 監査ログに記録
      await SupabaseAdminAuth.recordAuditLog(
        'admin_sms_verification_error',
        `管理者SMS認証エラー: ${username}`,
        username,
        'error',
        { admin_id: pendingAdminId, error: error instanceof Error ? error.message : String(error), user_agent: navigator.userAgent }
      );
    } finally {
      setLoading(false);
    }
  };

  // SMS認証コード再送信ハンドラー
  const handleResendSMSCode = async () => {
    if (!pendingAdminId || !pendingPhoneNumber) {
      setError('認証セッションが無効です。もう一度ログインしてください。');
      return;
    }

    // 再送信制限チェック（60秒間隔）
    const lastResendTime = localStorage.getItem('last_sms_resend');
    if (lastResendTime) {
      const timeSinceLastResend = Date.now() - parseInt(lastResendTime);
      const waitTime = 60000; // 60秒
      
      if (timeSinceLastResend < waitTime) {
        const remainingTime = Math.ceil((waitTime - timeSinceLastResend) / 1000);
        setError(`SMS認証コードの再送信は${remainingTime}秒後に可能です。`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // SMS認証機能は現在実装されていません - スタブ実装
      const result = { success: false, error: 'SMS再送信機能は現在無効化されています' };
      
      if (result.success) {
        // 再送信時刻を記録
        localStorage.setItem('last_sms_resend', Date.now().toString());
        setSuccess('SMS認証コードを再送信しました。');
        
        // 監査ログに記録
        await SupabaseAdminAuth.recordAuditLog(
          'admin_sms_code_resent',
          `管理者SMS認証コード再送信: ${username}`,
          username,
          'info',
          { admin_id: pendingAdminId, phone_number: pendingPhoneNumber, user_agent: navigator.userAgent }
        );
      } else {
        setError('SMS認証コードの再送信に失敗しました。');
      }
    } catch (error) {
      setError('SMS認証コード再送信中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 残りロックアウト時間の計算
  const getRemainingLockoutTime = (): string => {
    if (!lockoutTime) return '';
    
    const remaining = Math.max(0, lockoutTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ロゴアイコン */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' && 'アカウントにログインします。'}
              {mode === 'register' && '新規管理者アカウント作成'}
              {mode === 'email-verify' && 'メール認証待ち'}
              {mode === 'sms-verify' && 'SMS認証'}
            </h1>
            {mode === 'login' && (
              <>
                <p className="text-gray-600 text-sm">
                  AI ConectX管理画面にアクセスするため、認証情報を入力してください。
                </p>
                <button
                  type="button"
                  onClick={() => setShowDefaultAccount(true)}
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                  デフォルトアカウント情報を表示
                </button>
              </>
            )}
            {mode === 'register' && (
              <p className="text-gray-600 text-sm">
                管理者アカウントを作成します。メール認証が必要です。
              </p>
            )}
            {mode === 'email-verify' && (
              <p className="text-gray-600 text-sm">
                認証メールを送信しました。メールボックスを確認してリンクをクリックしてください。
              </p>
            )}
            {mode === 'sms-verify' && (
              <p className="text-gray-600 text-sm">
                SMS認証コードを入力してログインを完了してください。
              </p>
            )}
          </div>

          {/* ロックアウト警告 */}
          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
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

          {/* メール認証待ち画面 */}
          {mode === 'email-verify' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600">
                認証メールのリンクをクリックすると、管理者アカウントが作成されます。
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setSuccess('');
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                ← 登録画面に戻る
              </button>
            </div>
          )}

          {/* SMS認証画面 */}
          {mode === 'sms-verify' && (
            <form onSubmit={handleSMSVerification} className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2">
                  {pendingPhoneNumber} に認証コードを送信しました。
                </p>
                <p className="text-sm text-gray-500">
                  SMSが届かない場合は、迷惑メールフォルダを確認してください。
                </p>
              </div>

              <div>
                <label htmlFor="smsCode" className="block text-sm font-medium text-gray-700 mb-2">
                  SMS認証コード（6桁）
                </label>
                <input
                  id="smsCode"
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-center text-lg font-mono tracking-widest"
                  placeholder="123456"
                  disabled={loading}
                  maxLength={6}
                />
              </div>

              {/* エラー・成功メッセージ */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-700">{success}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
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
                disabled={loading || smsCode.length !== 6}
                className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    認証中...
                  </div>
                ) : (
                  'ログイン完了'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendSMSCode}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                >
                  認証コードを再送信
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setPendingAdminId(null);
                    setPendingPhoneNumber('');
                    setSmsCode('');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
                >
                  ← ログイン画面に戻る
                </button>
              </div>
            </form>
          )}

          {/* ログイン・新規登録フォーム */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6">
              {/* ユーザー名またはメールアドレス */}
              {mode === 'login' && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレスまたはユーザー名
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="admin@example.com"
                    disabled={loading || isLocked}
                    autoComplete="username"
                  />
                </div>
              )}

              {/* 新規登録時のメールアドレス */}
              {mode === 'register' && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="admin@example.com"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              )}

            {/* パスワード */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12"
                  placeholder="パスワードを入力"
                  disabled={loading || isLocked}
                  autoComplete={mode === 'login' ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              {mode === 'register' && (
                <div className="text-xs mt-2 space-y-1">
                  <p className="font-medium text-gray-700">パスワード要件：</p>
                  <ul className="space-y-0.5 pl-2">
                    <li className={`flex items-center space-x-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={password.length >= 8 ? '✓' : '○'}>
                        {password.length >= 8 ? '✓' : '○'}
                      </span>
                      <span>8文字以上</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>
                        {/[A-Z]/.test(password) ? '✓' : '○'}
                      </span>
                      <span>大文字（A-Z）を含む</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>
                        {/[a-z]/.test(password) ? '✓' : '○'}
                      </span>
                      <span>小文字（a-z）を含む</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>
                        {/\d/.test(password) ? '✓' : '○'}
                      </span>
                      <span>数字（0-9）を含む</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[@$!%*?&]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>
                        {/[@$!%*?&]/.test(password) ? '✓' : '○'}
                      </span>
                      <span>記号（@$!%*?&）のいずれかを含む</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* 新規登録時の追加フィールド */}
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード確認
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12"
                      placeholder="パスワードを再入力"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
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

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="09012345678"
                    disabled={loading}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-gray-500 mt-1">ハイフンなしで入力してください</p>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="山田太郎"
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    所属部署（任意）
                  </label>
                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="例：システム部"
                    disabled={loading}
                    autoComplete="organization"
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    申請理由 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="管理者アクセスが必要な理由を記載してください"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">既存の管理者が承認の判断をするために使用されます</p>
                </div>
              </>
            )}

            {/* 利用規約同意（ログイン時のみ） */}
            {mode === 'login' && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  続行すると、<span className="text-blue-600 underline">利用規約</span>に同意したものとみなされます。
                </p>
              </div>
            )}

            {/* エラー・成功メッセージ */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* メインボタン */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'login' ? 'ログイン中...' : '作成中...'}
                </div>
              ) : (
                mode === 'login' ? 'ログイン' : mode === 'register' ? '新規登録' : 'パスワード変更'
              )}
            </button>
          </form>
                      )}

          {/* 区切り線 */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-8 flex items-center">
              <hr className="flex-grow border-gray-200" />
              <span className="mx-4 text-gray-500 text-sm">または</span>
              <hr className="flex-grow border-gray-200" />
            </div>
          )}

          {/* OAuth認証ボタン（将来の拡張用 - 現在は無効化） */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-6 space-y-3" style={{ display: 'none' }}>
              <button
                type="button"
                disabled={true}
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google で続行
              </button>
              
              <button
                type="button"
                disabled={true}
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.163-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.750-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.990-5.367 11.990-11.986C24.007 5.367 18.641.001.012 0z"/>
                </svg>
                Apple で続行
              </button>
            </div>
          )}

          {/* 新規登録・パスワードリセットへのリンク */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-8 text-center space-y-4">
              {mode === 'login' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToPasswordReset) {
                        onNavigateToPasswordReset();
                      } else {
                        window.location.href = '/admin-password-reset';
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                    disabled={loading}
                  >
                    🔑 パスワードを忘れた方はこちら
                  </button>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {mode === 'login' 
                    ? 'アカウントをお持ちでない場合は、新規作成してください。'
                    : 'すでにアカウントをお持ちの場合は、ログインしてください。'
                  }
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                    setSuccess('');
                    setUsername('');
                    setPassword('');
                    setConfirmPassword('');
                    setPhoneNumber('');
                    setEmail('');
                    setFullName('');
                    setDepartment('');
                    setReason('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  disabled={loading}
                >
                  {mode === 'login' ? 'アカウントを新規作成' : 'ログインはこちら'}
                </button>
              </div>
            </div>
          )}

          {/* ホームへ戻るリンク */}
          <div className="mt-6 text-center">
            <button
              onClick={onNavigateHome}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
              disabled={loading}
            >
              ← ホームページに戻る
            </button>
          </div>
        </div>

        {/* セキュリティ情報 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>このページは暗号化された接続で保護されています</p>
          <p className="mt-1">最大試行回数: {MAX_LOGIN_ATTEMPTS}回 | ロックアウト時間: {LOCKOUT_DURATION / 60000}分</p>
        </div>
      </div>
      
      {/* デフォルトアカウント情報モーダル */}
      {showDefaultAccount && (
        <AdminDefaultAccount onClose={() => setShowDefaultAccount(false)} />
      )}
    </div>
  );
};

export default AdminLoginPage;