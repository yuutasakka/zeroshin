import React, { useState, useEffect } from 'react';
// import { GoogleGenAI } from "@google/genai"; // Removed: AI client should be in the backend
import Header from './components/Header';
import MainVisualAndDiagnosis from './components/MainVisualAndDiagnosis';
import ReliabilitySection from './components/ReliabilitySection';
import SecurityTrustSection from './components/SecurityTrustSection';
import CallToActionSection from './components/CallToActionSection';
import Footer from './components/Footer';
import PhoneVerificationPage from './components/PhoneVerificationPage';
import DiagnosisResultsPage from './components/DiagnosisResultsPage';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboardPage from './components/AdminDashboardPage';
// 新しいSupabase Auth関連のインポート
import { SupabaseAuthLogin } from './components/SupabaseAuthLogin';
import LoginSelectionPage from './components/LoginSelectionPage';
import { AuthGuard, AuthenticatedHeader } from './components/AuthGuard';
import { OneTimeUsageNotice } from './components/OneTimeUsageNotice';
import { supabase, diagnosisManager } from './components/supabaseClient';
import type { User } from '@supabase/supabase-js';

import { ColorThemeProvider } from './components/ColorThemeContext';
import { DiagnosisFormState, PageView, UserSessionData } from './types';
import { initializeSampleData } from './data/sampleData';
import RegistrationRequestPage from './components/RegistrationRequestPage';
import ProductionSecurityValidator from './components/ProductionSecurityValidator';

// AI Client Initialization (GoogleGenAI) has been removed from the frontend.
// API calls to Gemini API should be proxied through a secure backend server
// to protect the API key and manage requests efficiently.
// The backend will be responsible for interacting with the GoogleGenAI SDK.

// セキュリティ関数: HTMLサニタイゼーション
const sanitizeHTML = (html: string): string => {
  // 危険なタグとスクリプトを除去
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*vbscript:/gi,
    /<[^>]*data:/gi
  ];
  
  let sanitized = html;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};

// HTML検証関数
const isValidHTML = (html: string): boolean => {
  // 基本的な安全性チェック
  const allowedTags = ['link', 'meta', 'style', 'title', 'noscript'];
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const errorNode = doc.querySelector('parsererror');
    
    if (errorNode) {
      return false;
    }
    
    // すべての要素が許可されたタグかチェック
    const elements = doc.body.querySelectorAll('*');
    for (let element of elements) {
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('diagnosis');
  const [phoneNumberToVerify, setPhoneNumberToVerify] = useState<string | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisFormState | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showUsageNotice, setShowUsageNotice] = useState<boolean>(false);
  
  // 新しいSupabase Auth関連の状態
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false);
  
  // 状態変更を監視するuseEffect
  useEffect(() => {
    // 状態変更の処理（ログ出力は本番環境では無効）
  }, [currentPage, isAdminLoggedIn, isSupabaseAuth]);

  useEffect(() => {
    // Apply body class for verification and results pages for consistent styling
    if (currentPage === 'verification' || currentPage === 'results' || currentPage === 'loginSelection' || currentPage === 'traditionalLogin' || currentPage === 'supabaseLogin' || currentPage === 'adminDashboard') {
      document.body.classList.add('verification-page-active'); // This class now applies premium dark gradient
    } else {
      document.body.classList.remove('verification-page-active');
      document.body.style.fontFamily = 'var(--font-primary)'; // Ensure main pages use Inter
    }
    // Cleanup function
    return () => {
      document.body.classList.remove('verification-page-active');
    };
  }, [currentPage]);

  // Supabase認証状態の監視
  useEffect(() => {
    const initSupabaseAuth = async () => {
      try {
        // 現在のセッションを取得
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSupabaseUser(session.user);
          setIsSupabaseAuth(true);
          setIsAdminLoggedIn(true);
          
          // プロファイルからパスワード変更要求をチェック
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('requires_password_change')
            .eq('id', session.user.id)
            .single();

          // パスワード変更機能は現在無効化されているため、常に管理画面に遷移
          setCurrentPage('adminDashboard');
        }

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            
            if (session?.user) {
              setSupabaseUser(session.user);
              setIsSupabaseAuth(true);
              setIsAdminLoggedIn(true);
              
              // パスワード変更要求をチェック
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('requires_password_change')
                .eq('id', session.user.id)
                .single();

              // パスワード変更機能は現在無効化されているため、常に管理画面に遷移
              setCurrentPage('adminDashboard');
            } else {
              setSupabaseUser(null);
              // Supabase認証が解除された場合のみ状態をリセット
              if (isSupabaseAuth) {
                setIsSupabaseAuth(false);
                setIsAdminLoggedIn(false);
                setCurrentPage('diagnosis');
              }
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        // Supabase認証初期化エラーは無視（フォールバック認証が動作）
      }
    };

    initSupabaseAuth();
  }, []);



  // 🔐 セッション管理とページ閉じる時の処理
  useEffect(() => {
    // ページ読み込み時にセッション状態をチェック・クリーンアップ
    const initializeSessionState = () => {
      try {
        // 不正なセッション状態をクリア
        const sessionAuth = sessionStorage.getItem('admin_authenticated');
        const adminSession = localStorage.getItem('admin_session');
        
        if (sessionAuth === 'true' && adminSession) {
          // セッションの有効期限をチェック
          const session = JSON.parse(adminSession);
          const now = Date.now();
          
          // expiryTimeがある場合のみ有効期限をチェック
          if (session.expiryTime && now > new Date(session.expiryTime).getTime()) {
            // 期限切れセッションをクリア
            sessionStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_session');
            setIsAdminLoggedIn(false);
            if (currentPage === 'adminDashboard') {
              setCurrentPage('diagnosis');
            }
          } else if (session.username === 'admin' || session.authenticated === true) {
            // 有効なセッションが存在する場合
            setIsAdminLoggedIn(true);
            if (currentPage !== 'adminDashboard') {
              setCurrentPage('adminDashboard');
            }
          }
        } else {
          // 不完全なセッション情報をクリア
          sessionStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_session');
          setIsAdminLoggedIn(false);
        }
      } catch (error) {
        // エラー時は全セッション情報をクリア
        sessionStorage.clear();
        localStorage.removeItem('admin_session');
        setIsAdminLoggedIn(false);
        setCurrentPage('diagnosis');
      }
    };

    // ページを閉じる時の処理
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // セッションストレージの一時情報をクリア（ローカルストレージの認証情報は保持）
      sessionStorage.removeItem('admin_authenticated');
    };

    // ページの可視性変更時の処理（タブの切り替えなど）
    const handleVisibilityChange = () => {
      // 現在の認証状態をその場で取得
      const currentAuth = sessionStorage.getItem('admin_authenticated') === 'true';
      
      if (document.hidden && currentAuth) {
        // ページが非表示になった時、セッション時間を記録
        const sessionData = {
          lastActivity: Date.now(),
          isLoggedIn: currentAuth
        };
        sessionStorage.setItem('admin_session_state', JSON.stringify(sessionData));
      } else if (!document.hidden) {
        // ページが再び表示された時、セッション状態をチェック
        const sessionState = sessionStorage.getItem('admin_session_state');
        if (sessionState) {
          try {
            const data = JSON.parse(sessionState);
            const timeDiff = Date.now() - data.lastActivity;
            
            // 30分以上非アクティブの場合はログアウト
            if (timeDiff > 30 * 60 * 1000) {
              sessionStorage.clear();
              localStorage.removeItem('admin_session');
              setIsAdminLoggedIn(false);
              setCurrentPage('diagnosis');
            }
          } catch (error) {
            // セッション状態パースエラーの場合はクリア
            sessionStorage.clear();
          }
        }
      }
    };

    // イベントリスナー登録
    initializeSessionState();
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // isAdminLoggedInやcurrentPageに依存するとuseEffectが頻繁に再実行される

  useEffect(() => {
    // アプリケーション初期化：サンプルデータとスクリプト読み込み
    const initializeApp = () => {
      try {
        // サンプルデータの初期化
        initializeSampleData();

        // 診断完了履歴チェック（Supabaseベース）
        diagnosisManager.getVerifiedSessions().then(verifiedSessions => {
          // 現在のページ状態をその場で確認
          const currentUrl = window.location.href;
          const isOnDiagnosisPage = !currentUrl.includes('/admin') && !currentUrl.includes('/login');
          
          if (verifiedSessions.length > 0 && isOnDiagnosisPage) {
            setTimeout(() => setShowUsageNotice(true), 1000); // 1秒後に表示
          }
        }).catch(() => {
          // Supabase接続エラーは無視（ローカルストレージフォールバックが動作）
        });

        // トラッキングスクリプトの読み込み
        const scriptsString = localStorage.getItem('customTrackingScripts');
        if (scriptsString) {
          const scripts: { head: string; bodyEnd: string } = JSON.parse(scriptsString);

          // セキュリティ強化: HTMLの安全性を検証してからDOM操作
          if (scripts.head && typeof scripts.head === 'string' && scripts.head.trim() !== '') {
            const sanitizedHead = sanitizeHTML(scripts.head);
            if (sanitizedHead && isValidHTML(sanitizedHead)) {
              const headFragment = document.createRange().createContextualFragment(sanitizedHead);
              document.head.appendChild(headFragment);
            }
          }

          if (scripts.bodyEnd && typeof scripts.bodyEnd === 'string' && scripts.bodyEnd.trim() !== '') {
            const sanitizedBodyEnd = sanitizeHTML(scripts.bodyEnd);
            if (sanitizedBodyEnd && isValidHTML(sanitizedBodyEnd)) {
              const bodyEndFragment = document.createRange().createContextualFragment(sanitizedBodyEnd);
              document.body.appendChild(bodyEndFragment);
            }
          }
        }
      } catch (e) {
        // アプリケーション初期化エラーは無視（基本機能は動作する）
      }
    };

    initializeApp();
  }, []); // Empty dependency array means this runs once on mount

  const handleProceedToVerification = async (phoneNumber: string, formData: DiagnosisFormState) => {
    // 電話番号の重複チェック（最終確認）
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const isUsed = await diagnosisManager.checkPhoneNumberUsage(normalizedPhone);
      
      if (isUsed) {
        return;
      }
    } catch (error) {
      return;
    }
    
    // 診断データを保存してSMS認証ページへ
    const sessionData: UserSessionData = {
      id: `session_${new Date().getTime()}_${Math.random().toString(36).substring(2,9)}`,
      phoneNumber: phoneNumber,
      diagnosisAnswers: formData,
      timestamp: new Date().toISOString(),
      smsVerified: false
    };

    // 一時的に診断データを保存（SMS認証前）
    setDiagnosisData(formData);
    setPhoneNumberToVerify(phoneNumber);
    localStorage.setItem('pendingUserSession', JSON.stringify(sessionData));
    
    setCurrentPage('verification');
    window.scrollTo(0, 0); 
  };

  const handleVerificationComplete = () => {
    // SMS認証完了後の処理
    const currentSession = localStorage.getItem('currentUserSession');
    
    if (currentSession) {
      // 一時データをクリア（Supabaseに既に保存済み）
      localStorage.removeItem('pendingUserSession');
      
      setCurrentPage('results');
      window.scrollTo(0, 0);
    }
  };

  const handleVerificationCancel = () => {
    setCurrentPage('diagnosis'); 
    window.scrollTo(0,0);
  }

  const handleReturnToStart = () => {
    setPhoneNumberToVerify(null);
    setDiagnosisData(null);
    if (isAdminLoggedIn) { // Also log out admin if returning to start from an admin context
        setIsAdminLoggedIn(false);
    }
    setCurrentPage('diagnosis');
    window.scrollTo(0,0);
  }

  const handleAdminLoginSuccess = () => {
    
    if (isSupabaseAuth) {
      // Supabase認証の場合
      setCurrentPage('adminDashboard');
    } else {
      // 従来認証の場合（後方互換性）
      setIsAdminLoggedIn(true);
      setIsSupabaseAuth(false); // 従来認証であることを明示
      setCurrentPage('adminDashboard');
      
      // セッション情報が適切に保存されているかチェック
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        sessionStorage.setItem('admin_authenticated', 'true');
      }
    }
    
    window.scrollTo(0,0);
  };

  const handleAdminLogout = async () => {
    if (isSupabaseAuth) {
      // Supabase認証の場合
      try {
        await supabase.auth.signOut();
      } catch (error) {
        // ログアウトエラーは無視（状態はクリアされる）
      }
    } else {
      // 従来認証の場合
      setIsAdminLoggedIn(false);
      sessionStorage.clear();
      localStorage.removeItem('admin_session');
    }
    
    setCurrentPage('diagnosis');
    window.scrollTo(0,0);
  };
  
  const navigateToHome = () => {
    setCurrentPage('diagnosis');
    window.scrollTo(0,0);
  };

  const navigateToAdminLogin = () => {
    setCurrentPage('loginSelection');
    window.scrollTo(0,0);
  };

  const navigateToTraditionalLogin = () => {
    setCurrentPage('traditionalLogin');
    window.scrollTo(0,0);
  };

  const navigateToSupabaseLogin = () => {
    setCurrentPage('supabaseLogin');
    window.scrollTo(0,0);
  };

  // 新規登録申請ページへのナビゲーション
  const navigateToRegistrationRequest = () => {
    setCurrentPage('registrationRequest');
    window.scrollTo(0, 0);
  };

  // パスワード変更完了時の処理
  const handlePasswordChanged = () => {
    setCurrentPage('adminDashboard');
    window.scrollTo(0, 0);
  };

  // ログイン選択ページのレンダリング
  if (currentPage === 'loginSelection') {
    return (
      <ColorThemeProvider>
        <LoginSelectionPage 
          onSelectTraditionalAuth={navigateToTraditionalLogin}
          onSelectSupabaseAuth={navigateToSupabaseLogin}
          onNavigateHome={navigateToHome}
          onNavigateToRegistration={navigateToRegistrationRequest}
        />
      </ColorThemeProvider>
    );
  }

  // 従来認証ログインページのレンダリング
  if (currentPage === 'traditionalLogin') {
    return (
      <ColorThemeProvider>
        <AdminLoginPage onLogin={handleAdminLoginSuccess} onNavigateHome={navigateToHome} />
      </ColorThemeProvider>
    );
  }

  // Supabase認証ログインページのレンダリング
  if (currentPage === 'supabaseLogin') {
    return (
      <ColorThemeProvider>
        <SupabaseAuthLogin onLogin={handleAdminLoginSuccess} onNavigateHome={navigateToHome} />
      </ColorThemeProvider>
    );
  }

  // 管理画面のレンダリング
  if (currentPage === 'adminDashboard') {
    
    if (isSupabaseAuth) {
      // Supabase認証の場合
      return (
        <ColorThemeProvider>
          <AuthGuard>
            <AuthenticatedHeader />
            <AdminDashboardPage onLogout={handleAdminLogout} onNavigateHome={navigateToHome} />
          </AuthGuard>
        </ColorThemeProvider>
      );
    } else if (isAdminLoggedIn) {
      // 従来認証の場合（後方互換性）
      return (
        <ColorThemeProvider>
          <AdminDashboardPage onLogout={handleAdminLogout} onNavigateHome={navigateToHome} />
        </ColorThemeProvider>
      );
    } else {
      // 認証されていない場合はログイン選択ページへ
      return (
        <ColorThemeProvider>
          <LoginSelectionPage 
            onSelectTraditionalAuth={navigateToTraditionalLogin}
            onSelectSupabaseAuth={navigateToSupabaseLogin}
            onNavigateHome={navigateToHome}
          />
        </ColorThemeProvider>
      );
    }
  }

  if (currentPage === 'verification') {
    const pendingSession = localStorage.getItem('pendingUserSession');
    const userSession = pendingSession ? JSON.parse(pendingSession) : null;
    
    return userSession ? (
      <ColorThemeProvider>
        <PhoneVerificationPage 
          userSession={userSession}
          onVerificationSuccess={handleVerificationComplete}
          onBack={handleVerificationCancel}
        />
      </ColorThemeProvider>
    ) : (
      <ColorThemeProvider>
        <MainVisualAndDiagnosis onProceedToVerification={handleProceedToVerification} />
      </ColorThemeProvider>
    );
  }

  if (currentPage === 'results') {
    return (
      <ColorThemeProvider>
        <DiagnosisResultsPage diagnosisData={diagnosisData} onReturnToStart={handleReturnToStart}/>
      </ColorThemeProvider>
    );
  }

  // 新規登録申請ページのレンダリング
  if (currentPage === 'registrationRequest') {
    return (
      <ColorThemeProvider>
        <RegistrationRequestPage onNavigateHome={navigateToHome} />
      </ColorThemeProvider>
    );
  }

  // パスワード変更ページのレンダリング
  if (currentPage === 'changePassword') {
    // パスワード変更機能は現在無効化されています
    // 管理画面に直接リダイレクト
    setCurrentPage('adminDashboard');
    return null;
  }

  // Default page is 'diagnosis'
  return (
    <ColorThemeProvider>
      <div className="App min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <ProductionSecurityValidator />
        
        <Header />
        <MainVisualAndDiagnosis onProceedToVerification={handleProceedToVerification} />
        <ReliabilitySection />
        <SecurityTrustSection />
        <CallToActionSection />
        <Footer onNavigateToAdminLogin={navigateToAdminLogin} />
        
        {/* 一回限り診断の案内 */}
        {showUsageNotice && (
          <OneTimeUsageNotice onDismiss={() => setShowUsageNotice(false)} />
        )}
      </div>
    </ColorThemeProvider>
  );
};

export default App;