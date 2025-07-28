import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { supabase } from '../src/components/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Admin専用コンポーネントのlazy loading
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// ローディングコンポーネント（管理画面用）
const AdminLoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#ffffff'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '4px solid #007acc',
      borderRadius: '50%',
      borderTop: '4px solid transparent',
      animation: 'spin 1s linear infinite',
      marginRight: '15px'
    }}></div>
    <span style={{ fontSize: '18px', fontWeight: '500' }}>管理画面を読み込み中...</span>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// 認証ガード
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 現在のセッションを確認
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          setLoading(false);
          return;
        }

        // 管理者権限の確認
        const { data: adminData, error: adminError } = await supabase
          .from('admin_credentials')
          .select('*')
          .or(`username.eq.${session.user.email},phone_number.eq.${session.user.phone}`)
          .eq('is_active', true)
          .maybeSingle();

        if (adminData && !adminError) {
          setUser(session.user);
          setIsAuthorized(true);
        } else {
          // 管理者でない場合は強制ログアウト
          await supabase.auth.signOut();
          setUser(null);
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('認証エラー:', error);
        setUser(null);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 認証状態の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsAuthorized(false);
          setLoading(false);
        } else if (session?.user) {
          await checkAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <AdminLoadingSpinner />;
  }

  if (!user || !isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// ルーター設定
const adminRouter = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<AdminLoadingSpinner />}>
        <AdminLogin />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/settings",
    element: (
      <AuthGuard>
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminSettings />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/users",
    element: (
      <AuthGuard>
        <Suspense fallback={<AdminLoadingSpinner />}>
          <UserManagement />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

// メインのAdmin App
const AdminApp: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <RouterProvider router={adminRouter} />
    </div>
  );
};

export default AdminApp;