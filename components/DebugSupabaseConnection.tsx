import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const DebugSupabaseConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('未テスト');
  const [environmentVars, setEnvironmentVars] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');

  const checkEnvironmentVars = () => {
    const env = {
      VITE_SUPABASE_URL: (import.meta as any).env?.VITE_SUPABASE_URL || 'undefined',
      VITE_SUPABASE_ANON_KEY: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? 'SET' : 'undefined',
      NODE_ENV: (import.meta as any).env?.NODE_ENV || 'undefined',
      MODE: (import.meta as any).env?.MODE || 'undefined'
    };
    setEnvironmentVars(env);
  };

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('テスト中...');
      
      // 1. 基本的な接続テスト
      console.log('🔄 Supabase接続テスト開始');
      
      // 2. テーブルの存在確認
      const { data, error, count } = await supabase
        .from('diagnosis_sessions')
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error('❌ Supabaseエラー:', error);
        setConnectionStatus('接続エラー');
        setTestResult(`エラー: ${error.message}\n詳細: ${JSON.stringify(error, null, 2)}`);
        return;
      }

      console.log('✅ Supabase接続成功:', { data, count });
      setConnectionStatus('接続成功');
      setTestResult(`成功: テーブルへのアクセスが可能です\nレコード数: ${count}\nサンプルデータ: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error: any) {
      console.error('💥 予期しないエラー:', error);
      setConnectionStatus('予期しないエラー');
      setTestResult(`JavaScript エラー: ${error.message}\nスタック: ${error.stack}`);
    }
  };

  const testSimpleSelect = async () => {
    try {
      setTestResult('簡単なSELECTテスト中...');
      
      const { data, error } = await supabase
        .from('diagnosis_sessions')
        .select('id, phone_number, verification_status')
        .limit(3);

      if (error) {
        setTestResult(`SELECTエラー: ${error.message}\n詳細: ${JSON.stringify(error, null, 2)}`);
      } else {
        setTestResult(`SELECT成功: ${data?.length || 0}件のレコードを取得\nデータ: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setTestResult(`JavaScript エラー: ${error.message}`);
    }
  };

  const testInsert = async () => {
    try {
      setTestResult('INSERTテスト中...');
      
      const testData = {
        phone_number: '080-0000-0000',
        verification_status: 'pending',
        otp: '123456',
        otp_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分後
        attempt_count: 0
      };

      const { data, error } = await supabase
        .from('diagnosis_sessions')
        .insert(testData)
        .select();

      if (error) {
        setTestResult(`INSERTエラー: ${error.message}\n詳細: ${JSON.stringify(error, null, 2)}`);
      } else {
        setTestResult(`INSERT成功: テストレコードを作成しました\n作成されたデータ: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setTestResult(`JavaScript エラー: ${error.message}`);
    }
  };

  const cleanupTestData = async () => {
    try {
      setTestResult('テストデータ削除中...');
      
      const { data, error } = await supabase
        .from('diagnosis_sessions')
        .delete()
        .eq('phone_number', '080-0000-0000')
        .select();

      if (error) {
        setTestResult(`削除エラー: ${error.message}\n詳細: ${JSON.stringify(error, null, 2)}`);
      } else {
        setTestResult(`削除成功: ${data?.length || 0}件のテストレコードを削除しました\n削除されたデータ: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setTestResult(`JavaScript エラー: ${error.message}`);
    }
  };

  React.useEffect(() => {
    checkEnvironmentVars();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ff6b6b', 
      margin: '20px',
      backgroundColor: '#fff5f5',
      borderRadius: '8px'
    }}>
      <h2 style={{ color: '#d63031' }}>🔧 Supabase接続デバッグ</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 環境変数</h3>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(environmentVars, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🔌 接続ステータス</h3>
        <p style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: connectionStatus === '接続成功' ? '#00b894' : '#d63031'
        }}>
          {connectionStatus}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testSupabaseConnection}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0984e3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔍 Supabase接続テスト
        </button>
        
        <button 
          onClick={testSimpleSelect}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          📊 SELECT テスト
        </button>
        
        <button 
          onClick={testInsert}
          style={{
            padding: '10px 20px',
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          ✍️ INSERT テスト
        </button>
        
        <button 
          onClick={cleanupTestData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e17055',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🗑️ テストデータ削除
        </button>
      </div>

      <div>
        <h3>📝 テスト結果</h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {testResult || '結果がここに表示されます'}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '4px' }}>
        <h4>💡 テスト機能説明</h4>
        <ul>
          <li><strong>🔍 Supabase接続テスト</strong>: diagnosis_sessionsテーブルへの基本アクセステスト</li>
          <li><strong>📊 SELECT テスト</strong>: データ読み取りテスト（最大3件表示）</li>
          <li><strong>✍️ INSERT テスト</strong>: テストデータ挿入（電話番号: 080-0000-0000）</li>
          <li><strong>🗑️ テストデータ削除</strong>: 作成したテストデータをクリーンアップ</li>
        </ul>
        
        <h4>🚨 エラーが出た場合</h4>
        <ol>
          <li>ブラウザを再読み込み（Cmd+R / Ctrl+R）</li>
          <li>開発者ツール（F12）のConsoleタブを確認</li>
          <li>エラーメッセージ全文をコピーして報告</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugSupabaseConnection; 