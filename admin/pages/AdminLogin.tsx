import React, { useState } from 'react';
import { supabase } from '../../src/components/supabaseClient';
import { useCSRF, csrfFetch } from '../../src/hooks/useCSRF';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // CSRF保護
  const { csrfToken, isLoading: csrfLoading, addCSRFHeaders, refreshToken } = useCSRF();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // CSRFトークンの確認
    if (!csrfToken) {
      setError('セキュリティトークンの取得に失敗しました。ページを再読み込みしてください。');
      await refreshToken();
      setLoading(false);
      return;
    }

    try {
      // CSRF保護付き管理者ログインAPI
      const response = await csrfFetch('/api/admin-login', {
        method: 'POST',
        headers: addCSRFHeaders(),
        body: JSON.stringify({ email, password })
      }, csrfToken);

      const result = await response.json();

      if (!response.ok) {
        if (result.code === 'CSRF_INVALID') {
          setError('セキュリティエラー: ページを再読み込みしてください');
          await refreshToken();
        } else if (result.code === 'AUTH_FAILED') {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else if (result.code === 'INSUFFICIENT_PRIVILEGES') {
          setError('管理者権限がありません');
        } else {
          setError(result.error || 'ログインに失敗しました');
        }
        return;
      }

      // ログイン成功
      if (result.success) {
        // Supabaseセッションも設定（互換性のため）
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!authError && data.user) {
          // ダッシュボードにリダイレクト
          window.location.href = '/dashboard';
        } else {
          setError('セッション設定に失敗しました');
        }
      } else {
        setError('ログインに失敗しました');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>管理者ログイン</h1>
          <p>システム管理者専用のログインページです</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="admin@example.com"
            />
          </div>

          <div className="form-group">
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
            className="login-button"
            disabled={loading || csrfLoading || !email || !password || !csrfToken}
          >
            {loading ? (
              <span className="loading-text">
                <span className="spinner"></span>
                ログイン中...
              </span>
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>※ 管理者認証が必要です</p>
        </div>
      </div>

      <style jsx>{`
        .admin-login {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }

        .login-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
          color: #ffffff;
        }

        .login-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .login-header p {
          margin: 0;
          opacity: 0.8;
          font-size: 0.9rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .error-message {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.5);
          border-radius: 8px;
          padding: 1rem;
          color: #ff6b6b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          color: #ffffff;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .form-group input {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .form-group input:focus {
          outline: none;
          border-color: #007acc;
          background: rgba(255, 255, 255, 0.15);
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-button {
          padding: 1rem;
          background: linear-gradient(135deg, #007acc 0%, #0056b3 100%);
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loading-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          margin-top: 2rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
        }

        @media (max-width: 480px) {
          .admin-login {
            padding: 1rem;
          }

          .login-container {
            padding: 2rem;
          }

          .login-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;