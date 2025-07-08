import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { SecureStorage } from '../security.config';
import type { User, Session } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div> 
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <>{fallback}</>;
  }

  if (!session || !user) {
    return null; // 認証されていない場合は何も表示しない
  }

  return <>{children}</>;
};

// ログアウト機能付きヘッダーコンポーネント
export const AuthenticatedHeader: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      SecureStorage.removeSecureItem('admin_session');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">管理画面</h1>
        {user && (
          <p className="text-sm text-gray-600">
            ログイン中: {user.email}
          </p>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        ログアウト
      </button>
    </div>
  );
};