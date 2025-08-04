import React, { useState, useEffect } from 'react';
import { ErrorMessage } from './ui/ErrorMessage';
import { LoadingOverlay } from './ui/LoadingOverlay';

interface LineAuthFlowProps {
  diagnosisAnswers: any;
  onAuthComplete: (userId: string, userData: any) => void;
  onCancel: () => void;
}

interface LineUser {
  id: string;
  displayName: string;
  pictureUrl?: string;
}

const LineAuthFlow: React.FC<LineAuthFlowProps> = ({
  diagnosisAnswers,
  onAuthComplete,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string>('');
  const [user, setUser] = useState<LineUser | null>(null);

  // URL パラメータから認証コールバックを処理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError(`LINE認証エラー: ${errorParam}`);
      return;
    }

    if (code && state) {
      handleLineCallback(code, state);
    }
  }, []);

  // LINE認証URL取得
  const initializeLineAuth = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/line-auth?action=login', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Content-Typeチェック
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textData = await response.text();
        throw new Error(`Invalid response format: ${textData.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'LINE認証の初期化に失敗しました');
      }

      setAuthUrl(data.authUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LINE認証の初期化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // LINE認証コールバック処理
  const handleLineCallback = async (code: string, state: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/line-auth?action=callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      // Content-Typeチェック
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textData = await response.text();
        throw new Error(`Invalid response format: ${textData.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'LINE認証に失敗しました');
      }

      if (data.success) {
        setUser(data.user);
        
        // 認証トークンを保存
        localStorage.setItem('line_auth_token', data.token);
        
        // 診断データと共に認証完了を通知
        onAuthComplete(data.user.id, {
          ...data.user,
          diagnosisAnswers,
          authType: 'line'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LINE認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // LINE認証開始
  const handleStartLineAuth = () => {
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      initializeLineAuth();
    }
  };

  // 初回レンダリング時にLINE認証を初期化
  useEffect(() => {
    initializeLineAuth();
  }, []);

  return (
    <div className="line-auth-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #00C851 0%, #00A85A 50%, #007E33 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {loading && <LoadingOverlay message="LINE認証を処理中..." />}
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        textAlign: 'center'
      }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🔮
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2D3748',
            marginBottom: '8px'
          }}>
            Zero神 診断結果を受け取る
          </h1>
          <p style={{
            color: '#718096',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            LINEで認証して、あなたの無駄遣い診断結果とおすすめの節約法を確認しましょう
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <ErrorMessage 
            message={error}
            onDismiss={() => setError('')}
          />
        )}

        {/* 認証成功状態 */}
        {user && (
          <div style={{
            background: '#F0FDF4',
            border: '2px solid #00C851',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              {user.pictureUrl && (
                <img 
                  src={user.pictureUrl} 
                  alt="プロフィール画像"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '2px solid #00C851'
                  }}
                />
              )}
              <div>
                <p style={{ fontWeight: 'bold', color: '#2D3748', margin: 0 }}>
                  {user.displayName}
                </p>
                <p style={{ color: '#00A85A', fontSize: '14px', margin: 0 }}>
                  LINE認証完了
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LINE認証ボタン */}
        {!user && (
          <div style={{ marginBottom: '30px' }}>
            <button
              onClick={handleStartLineAuth}
              disabled={loading || !authUrl}
              style={{
                background: '#00C851',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                opacity: loading || !authUrl ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!loading && authUrl) {
                  e.currentTarget.style.background = '#00A85A';
                }
              }}
              onMouseOut={(e) => {
                if (!loading && authUrl) {
                  e.currentTarget.style.background = '#00C851';
                }
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2zm4.5 15.5h-9v-7h9v7z"/>
              </svg>
              {loading ? 'LINE認証を準備中...' : 'LINEで診断結果を受け取る'}
            </button>
          </div>
        )}

        {/* 診断内容プレビュー */}
        <div style={{
          background: '#F7FAFC',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#2D3748',
            marginBottom: '12px'
          }}>
            📊 あなたの回答
          </h3>
          <div style={{ fontSize: '14px', color: '#4A5568', lineHeight: '1.6' }}>
            <p>• 年収レンジ: {diagnosisAnswers?.age || '未回答'}</p>
            <p>• 月の出費: {diagnosisAnswers?.amount || '未回答'}</p>
            <p>• 無駄遣いレベル: {diagnosisAnswers?.experience || '未回答'}</p>
            <p>• 節約への意識: {diagnosisAnswers?.purpose || '未回答'}</p>
          </div>
        </div>

        {/* 戻るボタン */}
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            color: '#718096',
            border: '2px solid #E2E8F0',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#CBD5E0';
            e.currentTarget.style.color = '#4A5568';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.color = '#718096';
          }}
        >
          診断をやり直す
        </button>

        {/* プライバシー情報 */}
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#A0AEC0',
          textAlign: 'center'
        }}>
          <p>
            🔒 LINEログイン情報は診断結果の送信にのみ使用され、
            他の目的では使用されません
          </p>
        </div>
      </div>
    </div>
  );
};

export default LineAuthFlow;