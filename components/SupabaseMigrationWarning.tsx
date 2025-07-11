import React, { useState, useEffect } from 'react';

interface SupabaseMigrationWarningProps {
  onClose: () => void;
}

const SupabaseMigrationWarning: React.FC<SupabaseMigrationWarningProps> = ({ onClose }) => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // 本番環境でSupabaseマイグレーションが必要かチェック
    const checkMigrationStatus = async () => {
      try {
        const response = await fetch('/api/health-check', { method: 'HEAD' });
        if (response.status === 404 || response.status >= 500) {
          setShowWarning(true);
        }
      } catch (error) {
        // ネットワークエラーの場合もマイグレーションが必要な可能性
        setShowWarning(true);
      }
    };

    checkMigrationStatus();
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🚨 データベースマイグレーション必要
          </h3>
          
          <div className="text-sm text-gray-600 space-y-2 mb-6 text-left">
            <p>AI ConectXアプリケーションが正常に動作するために、以下のマイグレーションを実行してください：</p>
            
            <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
              <h4 className="font-medium text-gray-900 mb-2">📝 実行手順:</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Supabase CLI またはダッシュボードにアクセス</li>
                <li><code className="bg-gray-200 px-1 rounded">supabase/migrations/008_create_missing_tables.sql</code> を実行</li>
                <li>以下のテーブルが作成されることを確認:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>admin_settings</li>
                    <li>expert_contact_settings</li>
                    <li>financial_planners</li>
                  </ul>
                </li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
              <p className="text-xs">
                <strong>⚠️ 注意:</strong> このマイグレーションが実行されるまで、一部の機能（管理者設定、専門家連絡先、プランナー表示）でエラーが発生する可能性があります。
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              閉じる
            </button>
            <button
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Supabaseを開く
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseMigrationWarning; 