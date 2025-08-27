import React, { useState, useCallback, useMemo } from 'react';
import { supabase } from '../../src/components/supabaseClient';
import { useCSRF, csrfFetch } from '../../src/hooks/useCSRF';
import { logger } from '../utils/logger';
import { errorHandler, ErrorTypes } from '../utils/errorHandler';
import { validateForm, sanitizeInput } from '../utils/validation';
import { navigateTo } from '../utils/navigation';
import styles from '../styles/AdminLogin.module.css';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // CSRF保護
  const { csrfToken, isLoading: csrfLoading, addCSRFHeaders, refreshToken } = useCSRF();

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 入力検証
    const sanitizedEmail = sanitizeInput.email(email);
    const validationResult = validateForm.loginForm(sanitizedEmail, password);
    
    if (!validationResult.isValid) {
      setError(validationResult.errors[0]);
      setLoading(false);
      return;
    }

    // CSRFトークンの確認
    if (!csrfToken) {
      const appError = errorHandler.createError(
        ErrorTypes.VALIDATION_ERROR,
        'AdminLogin',
        'CSRF token not available'
      );
      setError('セキュリティトークンの取得に失敗しました。ページを再読み込みしてください。');
      logger.warn('CSRF token not available during login attempt', { email: sanitizedEmail });
      await refreshToken();
      setLoading(false);
      return;
    }

    try {
      // CSRF保護付き管理者ログインAPI
      const response = await csrfFetch('/api/admin-login', {
        method: 'POST',
        headers: addCSRFHeaders(),
        body: JSON.stringify({ email: sanitizedEmail, password })
      }, csrfToken);

      const result = await response.json();

      if (!response.ok) {
        let appError;
        
        if (result.code === 'CSRF_INVALID') {
          appError = errorHandler.createError(ErrorTypes.VALIDATION_ERROR, 'AdminLogin');
          setError('セキュリティエラー: ページを再読み込みしてください');
          await refreshToken();
        } else if (result.code === 'AUTH_FAILED') {
          appError = errorHandler.createError(ErrorTypes.AUTH_FAILED, 'AdminLogin');
          setError(ErrorTypes.AUTH_FAILED.userMessage);
        } else if (result.code === 'INSUFFICIENT_PRIVILEGES') {
          appError = errorHandler.createError(ErrorTypes.INSUFFICIENT_PRIVILEGES, 'AdminLogin');
          setError(ErrorTypes.INSUFFICIENT_PRIVILEGES.userMessage);
        } else {
          appError = errorHandler.createError(ErrorTypes.UNKNOWN_ERROR, 'AdminLogin', result);
          setError(result.error || 'ログインに失敗しました');
        }
        
        logger.error('Admin login failed', { 
          code: result.code, 
          email: sanitizedEmail,
          userAgent: navigator.userAgent 
        });
        return;
      }

      // ログイン成功
      if (result.success) {
        logger.info('Admin login successful', { email: sanitizedEmail });
        
        // Supabaseセッションも設定（互換性のため）
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

        if (!authError && data.user) {
          // ダッシュボードにリダイレクト
          navigateTo.dashboard();
        } else {
          const appError = errorHandler.handleSupabaseError(authError, 'AdminLogin');
          setError('セッション設定に失敗しました');
          logger.error('Supabase session setup failed', { email: sanitizedEmail, error: authError });
        }
      } else {
        const appError = errorHandler.createError(ErrorTypes.AUTH_FAILED, 'AdminLogin');
        setError('ログインに失敗しました');
      }
    } catch (error) {
      const appError = errorHandler.handleNetworkError(error, 'AdminLogin');
      setError(errorHandler.getUserMessage(appError));
      logger.error('Login network error', { email: sanitizedEmail, error });
    } finally {
      setLoading(false);
    }
  }, [email, password, csrfToken, addCSRFHeaders, refreshToken]);

  // フォームの無効状態をメモ化
  const isFormDisabled = useMemo(() => {
    return loading || csrfLoading || !email.trim() || !password || !csrfToken;
  }, [loading, csrfLoading, email, password, csrfToken]);

  // フォーム検証状態をメモ化
  const validationStatus = useMemo(() => {
    if (!email || !password) return null;
    const sanitizedEmail = sanitizeInput.email(email);
    return validateForm.loginForm(sanitizedEmail, password);
  }, [email, password]);

  return (
    <div className={styles.adminLogin}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <h1>管理者ログイン</h1>
          <p>システム管理者専用のログインページです</p>
        </div>

        <form onSubmit={handleLogin} className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {validationStatus && !validationStatus.isValid && (
            <div className={styles.validationMessage}>
              {validationStatus.errors.join(', ')}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="admin@example.com"
              className={validationStatus && email ? 
                (validationStatus.isValid ? styles.valid : styles.invalid) : 
                ''
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="パスワードを入力してください"
            />
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={isFormDisabled}
          >
            {loading ? (
              <span className={styles.loadingText}>
                <span className={styles.spinner}></span>
                ログイン中...
              </span>
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p>※ 管理者認証が必要です</p>
        </div>
      </div>
    </div>
  );
};

// パフォーマンス向上のためのコンポーネントメモ化
const MemoizedAdminLogin = React.memo(AdminLogin);

export default MemoizedAdminLogin;