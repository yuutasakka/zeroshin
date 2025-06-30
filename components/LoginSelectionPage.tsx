import React from 'react';

interface LoginSelectionPageProps {
  onSelectTraditionalAuth: () => void;
  onSelectSupabaseAuth: () => void;
  onNavigateHome: () => void;
}

const LoginSelectionPage: React.FC<LoginSelectionPageProps> = ({
  onSelectTraditionalAuth,
  onSelectSupabaseAuth,
  onNavigateHome
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-shield-alt text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">管理者ログイン</h1>
          <p className="text-gray-600 text-lg">ログイン方式を選択してください</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* 従来認証 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-key text-blue-600 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">従来認証</h3>
              <p className="text-gray-600">ユーザー名とパスワードでログイン</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <i className="fas fa-check-circle text-green-500 mr-3"></i>
                <span>管理者専用アカウント</span>
              </div>
              <div className="flex items-center text-gray-700">
                <i className="fas fa-check-circle text-green-500 mr-3"></i>
                <span>セキュアなパスワード認証</span>
              </div>
              <div className="flex items-center text-gray-700">
                <i className="fas fa-check-circle text-green-500 mr-3"></i>
                <span>ログイン試行制限</span>
              </div>
            </div>
            
            <button
              onClick={onSelectTraditionalAuth}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              従来認証でログイン
            </button>
          </div>

          {/* Supabase認証 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-cloud text-purple-600 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Supabase認証</h3>
              <p className="text-gray-600">メール認証・OAuth認証</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <i className="fas fa-check-circle text-green-500 mr-3"></i>
                <span>メール・パスワード認証</span>
              </div>
              <div className="flex items-center text-gray-700">
                <i className="fas fa-check-circle text-green-500 mr-3"></i>
                <span>Google・GitHub OAuth</span>
              </div>
              <div className="flex items-center text-gray-700">
                <i className="fas fa-check-circle text-green-500 mr-3"></i>
                <span>新規アカウント作成</span>
              </div>
            </div>
            
            <button
              onClick={onSelectSupabaseAuth}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <i className="fas fa-cloud-upload-alt mr-2"></i>
              Supabase認証でログイン
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-12 text-center">
          <button
            onClick={onNavigateHome}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center justify-center mx-auto"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            ホームページに戻る
          </button>
        </div>

        {/* 説明セクション */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            <i className="fas fa-info-circle mr-2 text-blue-500"></i>
            認証方式について
          </h4>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">従来認証</h5>
              <p>システム管理者が設定した固定のユーザー名・パスワードでログインします。セキュリティ強化のため、ログイン試行制限やアカウントロック機能が有効です。</p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Supabase認証</h5>
              <p>メールアドレスとパスワードでアカウントを作成するか、GoogleやGitHubアカウントでログインできます。新規管理者の追加が容易です。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSelectionPage; 