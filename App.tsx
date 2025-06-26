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
import { DiagnosisFormState, PageView, UserSessionData } from './types';

// AI Client Initialization (GoogleGenAI) has been removed from the frontend.
// API calls to Gemini API should be proxied through a secure backend server
// to protect the API key and manage requests efficiently.
// The backend will be responsible for interacting with the GoogleGenAI SDK.

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('diagnosis');
  const [phoneNumberToVerify, setPhoneNumberToVerify] = useState<string | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisFormState | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  
  // 状態変更を監視するuseEffect
  useEffect(() => {
    console.log('📊 State changed - currentPage:', currentPage, 'isAdminLoggedIn:', isAdminLoggedIn);
  }, [currentPage, isAdminLoggedIn]);


  useEffect(() => {
    // Apply body class for verification and results pages for consistent styling
    if (currentPage === 'verification' || currentPage === 'results' || currentPage === 'login' || currentPage === 'adminDashboard') {
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

  // 🚨 緊急デバッグ用: URL hash で管理画面アクセス
  useEffect(() => {
    const checkHashForAdmin = () => {
      if (window.location.hash === '#admin') {
        console.log('🚨 緊急管理画面アクセス検出');
        setIsAdminLoggedIn(true);
        setCurrentPage('adminDashboard');
      } else if (window.location.hash === '#login') {
        setCurrentPage('login');
      }
    };

    checkHashForAdmin();
    window.addEventListener('hashchange', checkHashForAdmin);
    
    return () => {
      window.removeEventListener('hashchange', checkHashForAdmin);
    };
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
          
          if (session.expires && now > session.expires) {
            // 期限切れセッションをクリア
            console.log('🔄 期限切れセッションをクリア');
            sessionStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_session');
            setIsAdminLoggedIn(false);
            setCurrentPage('diagnosis');
          } else if (session.username === 'admin') {
            // 有効なセッションが存在する場合
            console.log('🔐 有効なセッション復元');
            setIsAdminLoggedIn(true);
            setCurrentPage('adminDashboard');
          }
        } else {
          // 不完全なセッション情報をクリア
          sessionStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_session');
          setIsAdminLoggedIn(false);
        }
      } catch (error) {
        console.error('セッション初期化エラー:', error);
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
      console.log('🔄 ページ終了時: 一時セッション情報をクリア');
    };

    // ページの可視性変更時の処理（タブの切り替えなど）
    const handleVisibilityChange = () => {
      if (document.hidden && isAdminLoggedIn) {
        // ページが非表示になった時、セッション時間を記録
        const sessionData = {
          lastActivity: Date.now(),
          isLoggedIn: isAdminLoggedIn,
          currentPage: currentPage
        };
        sessionStorage.setItem('admin_session_state', JSON.stringify(sessionData));
      } else if (!document.hidden) {
        // ページが再び表示された時、セッション状態をチェック
        const sessionState = sessionStorage.getItem('admin_session_state');
        if (sessionState) {
          const data = JSON.parse(sessionState);
          const timeDiff = Date.now() - data.lastActivity;
          
          // 30分以上非アクティブの場合はログアウト
          if (timeDiff > 30 * 60 * 1000) {
            console.log('🔄 非アクティブ時間超過: 自動ログアウト');
            setIsAdminLoggedIn(false);
            setCurrentPage('diagnosis');
            sessionStorage.clear();
            localStorage.removeItem('admin_session');
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
      document.addEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAdminLoggedIn, currentPage]);

  useEffect(() => {
    const scriptsString = localStorage.getItem('customTrackingScripts');
    if (scriptsString) {
      try {
        const scripts: { head: string; bodyEnd: string } = JSON.parse(scriptsString);

        if (scripts.head && typeof scripts.head === 'string' && scripts.head.trim() !== '') {
          const headFragment = document.createRange().createContextualFragment(scripts.head);
          document.head.appendChild(headFragment);
        }

        if (scripts.bodyEnd && typeof scripts.bodyEnd === 'string' && scripts.bodyEnd.trim() !== '') {
          const bodyEndFragment = document.createRange().createContextualFragment(scripts.bodyEnd);
          document.body.appendChild(bodyEndFragment); // Appends at the end of body
        }
      } catch (e) {
        console.error("Error loading or injecting custom tracking scripts:", e);
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleProceedToVerification = (phoneNumber: string, formData: DiagnosisFormState) => {
    setPhoneNumberToVerify(phoneNumber);
    setDiagnosisData(formData); // Store diagnosis data
    setCurrentPage('verification');
    window.scrollTo(0, 0); 
  };

  const handleVerificationComplete = () => {
    if (diagnosisData && phoneNumberToVerify) {
      const newSession: UserSessionData = {
        id: `session_${new Date().getTime()}_${Math.random().toString(36).substring(2,9)}`,
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumberToVerify,
        diagnosisAnswers: diagnosisData,
      };

      // Retrieve existing sessions or initialize if none
      const existingSessionsString = localStorage.getItem('userSessions');
      const existingSessions: UserSessionData[] = existingSessionsString ? JSON.parse(existingSessionsString) : [];
      
      // Add new session and save back to local storage
      existingSessions.push(newSession);
      localStorage.setItem('userSessions', JSON.stringify(existingSessions));
    }
    setCurrentPage('results'); 
    window.scrollTo(0, 0);
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
    console.log('🚀 handleAdminLoginSuccess called');
    console.log('Before state change - currentPage:', currentPage, 'isAdminLoggedIn:', isAdminLoggedIn);
    
    // 状態を強制的に更新
    setIsAdminLoggedIn(true);
    setCurrentPage('adminDashboard');
    window.scrollTo(0,0);
    
    console.log('State changes requested - should navigate to adminDashboard');
    
    // 状態変更を確認するための遅延ログ
    setTimeout(() => {
      console.log('遅延確認 - currentPage should be adminDashboard');
    }, 200);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentPage('login'); // Redirect to admin login page after logout
    window.scrollTo(0,0);
  };
  
  const navigateToHome = () => {
    setCurrentPage('diagnosis');
    window.scrollTo(0,0);
  };

  const navigateToAdminLogin = () => {
    setCurrentPage('login');
    window.scrollTo(0,0);
  };


  console.log('App render - currentPage:', currentPage, 'isAdminLoggedIn:', isAdminLoggedIn);

  if (currentPage === 'login') {
    console.log('Rendering AdminLoginPage');
    return <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} onNavigateHome={navigateToHome} />;
  }

  if (currentPage === 'adminDashboard') {
    console.log('Rendering AdminDashboard - isAdminLoggedIn:', isAdminLoggedIn);
    if (!isAdminLoggedIn) {
      // Redirect to login if not authenticated
      console.log('Not authenticated, redirecting to login');
      return <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} onNavigateHome={navigateToHome} />;
    }
    console.log('Authenticated, showing AdminDashboard');
    return <AdminDashboardPage onLogout={handleAdminLogout} onNavigateHome={navigateToHome} />;
  }

  if (currentPage === 'verification') {
    return phoneNumberToVerify ? (
      <PhoneVerificationPage 
        phoneNumber={phoneNumberToVerify} 
        onVerificationComplete={handleVerificationComplete}
        onCancel={handleVerificationCancel}
      />
    ) : (
      // Fallback if somehow phoneNumberToVerify is null
      <MainVisualAndDiagnosis onProceedToVerification={handleProceedToVerification} />
    );
  }

  if (currentPage === 'results') {
    return <DiagnosisResultsPage diagnosisData={diagnosisData} onReturnToStart={handleReturnToStart}/>;
  }

  // Default page is 'diagnosis'
  return (
    <>
      <Header />
      <MainVisualAndDiagnosis onProceedToVerification={handleProceedToVerification} />
      <ReliabilitySection />
      <SecurityTrustSection />
      <CallToActionSection />
      <Footer onNavigateToAdminLogin={navigateToAdminLogin} />
    </>
  );
};

export default App;