import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { supabase } from '../src/components/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { logger } from './utils/logger';
import { errorHandler, ErrorTypes } from './utils/errorHandler';
import NavigationWrapper from './components/NavigationWrapper';
import ErrorBoundary from './components/ErrorBoundary';

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

// 認証ガード（改善版）
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      // 現在のセッションを確認
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        const appError = errorHandler.handleSupabaseError(error, 'AuthGuard');
        logger.error('Session check failed', { error }, 'AuthGuard');
        setLoading(false);
        return;
      }

      if (!session?.user) {
        logger.info('No active session found', {}, 'AuthGuard');
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
        logger.info('Admin authentication successful', { 
          email: session.user.email,
          adminId: adminData.id 
        }, 'AuthGuard');
      } else {
        // 管理者でない場合は強制ログアウト
        const appError = errorHandler.createError(
          ErrorTypes.INSUFFICIENT_PRIVILEGES, 
          'AuthGuard',
          adminError
        );
        logger.warn('Insufficient admin privileges', { 
          email: session.user.email,
          error: adminError 
        }, 'AuthGuard');
        
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthorized(false);
      }
    } catch (error) {
      const appError = errorHandler.handleError(error, 'AuthGuard');
      logger.error('Authentication check failed', { error }, 'AuthGuard');
      setUser(null);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // 認証状態の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state change', { event, hasSession: !!session }, 'AuthGuard');
        
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
  }, [checkAuth]);

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
      <NavigationWrapper>
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminLogin />
        </Suspense>
      </NavigationWrapper>
    ),
  },
  {
    path: "/",
    element: (
      <NavigationWrapper>
        <AuthGuard>
          <Suspense fallback={<AdminLoadingSpinner />}>
            <AdminDashboard />
          </Suspense>
        </AuthGuard>
      </NavigationWrapper>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <NavigationWrapper>
        <AuthGuard>
          <Suspense fallback={<AdminLoadingSpinner />}>
            <AdminDashboard />
          </Suspense>
        </AuthGuard>
      </NavigationWrapper>
    ),
  },
  {
    path: "/settings",
    element: (
      <NavigationWrapper>
        <AuthGuard>
          <Suspense fallback={<AdminLoadingSpinner />}>
            <AdminSettings />
          </Suspense>
        </AuthGuard>
      </NavigationWrapper>
    ),
  },
  {
    path: "/users",
    element: (
      <NavigationWrapper>
        <AuthGuard>
          <Suspense fallback={<AdminLoadingSpinner />}>
            <UserManagement />
          </Suspense>
        </AuthGuard>
      </NavigationWrapper>
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
    <ErrorBoundary>
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        <RouterProvider router={adminRouter} />
      </div>
    </ErrorBoundary>
  );
};

export default AdminApp;