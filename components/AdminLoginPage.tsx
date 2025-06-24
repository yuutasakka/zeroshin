

import React, { useState, FormEvent } from 'react';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

// IMPORTANT: Hardcoding credentials here is for DEMONSTRATION PURPOSES ONLY.
// In a real application, authentication MUST be handled by a secure backend.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      onLoginSuccess();
    } else {
      setError('ユーザー名またはパスワードが正しくありません。');
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-150 ease-in-out"
              placeholder="admin"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-150 ease-in-out"
              placeholder="password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center flex items-center justify-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </p>
          )}
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-opacity-50 transition duration-150 ease-in-out flex items-center justify-center"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              ログイン
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={onNavigateHome}
            className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition duration-150 ease-in-out"
          >
            <i className="fas fa-home mr-1"></i>
            ホームページに戻る
          </button>
        </div>
      </div>
       <p className="mt-8 text-xs text-red-500 text-center max-w-md px-4">
        <i className="fas fa-shield-alt mr-1"></i>
        <strong>セキュリティ警告:</strong> 現在のログイン機能はデモ用であり、実際のアプリケーションでこの方法を使用しないでください。本番環境では必ず安全なバックエンド認証を実装してください。
      </p>
       <footer className="mt-8 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} MoneyTicket Admin. All rights reserved.
      </footer>
    </div>
  );
};

export default AdminLoginPage;