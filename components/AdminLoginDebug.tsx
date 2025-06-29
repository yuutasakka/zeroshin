import React, { useState, useEffect } from 'react';
import { SupabaseAdminAuth } from './supabaseClient';

const AdminLoginDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<any>({});

  useEffect(() => {
    // 環境変数とSupabase設定の確認
    const checkEnvironment = () => {
      let importMetaEnvUrl, importMetaEnvKey, hasImportMeta, hasImportMetaEnv;
      
      // window.importMetaEnv チェック（安全なアクセス）
      try {
        if (typeof window !== 'undefined') {
          const windowImportMeta = (window as any).importMetaEnv || {};
          hasImportMeta = !!windowImportMeta;
          hasImportMetaEnv = Object.keys(windowImportMeta).length > 0;
          importMetaEnvUrl = windowImportMeta.VITE_SUPABASE_URL;
          importMetaEnvKey = windowImportMeta.VITE_SUPABASE_ANON_KEY;
        } else {
          hasImportMeta = false;
          hasImportMetaEnv = false;
        }
      } catch (error) {
        hasImportMeta = false;
        hasImportMetaEnv = false;
        importMetaEnvUrl = 'ERROR: ' + String(error);
        importMetaEnvKey = 'ERROR: ' + String(error);
      }
      
      const info = {
        // 環境変数チェック
        viteSupabaseUrl: typeof window !== 'undefined' ? (window as any).__VITE_ENV__?.VITE_SUPABASE_URL : undefined,
        reactSupabaseUrl: process.env.REACT_APP_SUPABASE_URL,
        viteSupabaseKey: typeof window !== 'undefined' ? (window as any).__VITE_ENV__?.VITE_SUPABASE_ANON_KEY : undefined,
        reactSupabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
        
        // window.importMetaEnv チェック
        importMetaEnvUrl,
        importMetaEnvKey,
        
        // ブラウザ環境
        isClient: typeof window !== 'undefined',
        isServer: typeof process !== 'undefined',
        hasImportMeta,
        hasImportMetaEnv,
        
        // 現在のURL
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
        currentHash: typeof window !== 'undefined' ? window.location.hash : 'N/A',
        
        // Supabase設定状況
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
    };

    // セッション情報の確認
    const checkSession = () => {
      try {
        const adminSession = localStorage.getItem('admin_session');
        const adminLockout = localStorage.getItem('admin_lockout');
        const sessionAuth = sessionStorage.getItem('admin_authenticated');
        
        setSessionInfo({
          adminSession: adminSession ? JSON.parse(adminSession) : null,
          adminLockout: adminLockout ? JSON.parse(adminLockout) : null,
          sessionAuth: sessionAuth,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setSessionInfo({ error: String(error) });
      }
    };

    checkEnvironment();
    checkSession();
    
    // 定期的にセッション情報を更新
    const interval = setInterval(checkSession, 2000);
    return () => clearInterval(interval);
  }, []);

  const testLogin = async () => {
    setTestResult('テスト開始...');
    
    try {
      // デモ認証情報でテスト
      const credentials = await SupabaseAdminAuth.getAdminCredentials('admin');
      
      if (credentials) {
        setTestResult(`✅ 認証情報取得成功: ${JSON.stringify(credentials, null, 2)}`);
        
        // パスワード検証テスト
        const isValid = await SupabaseAdminAuth.verifyPassword('MoneyTicket2024!', credentials.password_hash);
        setTestResult(prev => prev + `\n\n✅ パスワード検証: ${isValid ? '成功' : '失敗'}`);
        
      } else {
        setTestResult('❌ 認証情報取得失敗');
      }
    } catch (error) {
      setTestResult(`❌ エラー: ${error}`);
    }
  };

  const testPasswordHash = async () => {
    try {
      const hash = await SupabaseAdminAuth.hashPassword('MoneyTicket2024!');
      setTestResult(`パスワードハッシュ: ${hash}`);
    } catch (error) {
      setTestResult(`ハッシュ化エラー: ${error}`);
    }
  };

  const manualLogin = () => {
    try {
      // セッション情報を手動で作成
      const sessionData = {
        username: 'admin',
        loginTime: new Date().toISOString(),
        expiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分
        authenticated: true
      };
      
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      setTestResult('✅ 手動ログイン完了 - ページをリロードしてください');
    } catch (error) {
      setTestResult(`❌ 手動ログインエラー: ${error}`);
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem('admin_session');
      localStorage.removeItem('admin_lockout');
      sessionStorage.clear();
      setTestResult('✅ セッション情報をクリアしました');
    } catch (error) {
      setTestResult(`❌ セッションクリアエラー: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">管理者ログイン デバッグ情報</h1>
        
        {/* 環境情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">環境設定</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* テストボタン */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">認証テスト</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              ログインテスト
            </button>
            <button
              onClick={testPasswordHash}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              パスワードハッシュテスト
            </button>
            <button
              onClick={manualLogin}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              手動ログイン
            </button>
            <button
              onClick={clearSession}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              セッションクリア
            </button>
          </div>
          
          {testResult && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold mb-2">テスト結果:</h3>
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>

        {/* デフォルト認証情報 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">デフォルト認証情報</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p><strong>ユーザー名:</strong> admin</p>
            <p><strong>パスワード:</strong> MoneyTicket2024!</p>
            <p><strong>期待されるハッシュ:</strong> a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3</p>
          </div>
        </div>

        {/* セッション情報 */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">セッション情報（リアルタイム）</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginDebug; 