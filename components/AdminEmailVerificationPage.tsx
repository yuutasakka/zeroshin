import React, { useState, useEffect } from 'react';
import { AdminEmailAuth } from './supabaseClient';

interface AdminEmailVerificationPageProps {
  token: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

const AdminEmailVerificationPage: React.FC<AdminEmailVerificationPageProps> = ({ 
  token, 
  onComplete, 
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('認証トークンが見つかりません。');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // メール認証の完了処理
        const result = await AdminEmailAuth.completeEmailVerification(token);
        
        if (result.success) {
          setSuccess(true);
          setError('');
          
          // 5秒後に完了コールバックを実行（承認制なので案内を読む時間を増やす）
          setTimeout(() => {
            onComplete();
          }, 5000);
        } else {
          setError(result.error || 'メール認証に失敗しました。');
          onError(result.error || 'メール認証に失敗しました。');
        }
      } catch (error) {
        const errorMessage = 'メール認証処理中にエラーが発生しました。';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, onComplete, onError]);

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
              メール認証
            </h1>
            <p className="text-gray-600 text-sm">
              管理者アカウントの作成を完了しています...
            </p>
          </div>

          {/* コンテンツ */}
          <div className="text-center space-y-6">
            {loading && (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-gray-600">
                  認証処理を実行中です。しばらくお待ちください...
                </p>
              </>
            )}

            {success && !loading && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                                 <div className="space-y-4">
                   <h2 className="text-xl font-semibold text-green-800">メール認証完了！</h2>
                   <p className="text-gray-600">
                     承認申請を送信しました。<br />
                     既存の管理者による承認をお待ちください。
                   </p>
                   <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                     <div className="flex items-start space-x-3">
                       <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       <div>
                         <h3 className="text-sm font-medium text-blue-800">次のステップ</h3>
                         <p className="text-sm text-blue-700 mt-1">
                           既存の管理者があなたの申請を確認し、承認されると管理者としてログインできるようになります。
                         </p>
                       </div>
                     </div>
                   </div>
                   <div className="mx-auto w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
                   </div>
                 </div>
              </>
            )}

            {error && !loading && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-red-800">認証エラー</h2>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      以下の理由が考えられます：
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 text-left">
                      <li>• 認証リンクの有効期限が切れている（24時間）</li>
                      <li>• 認証リンクが既に使用されている</li>
                      <li>• 認証URLが正しくない</li>
                    </ul>
                  </div>
                  <button
                    onClick={onComplete}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                  >
                    ログインページに戻る
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* セキュリティ情報 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>このページは暗号化された接続で保護されています</p>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailVerificationPage; 