import React, { useState, useEffect } from 'react';
import Header from './components/Header';
// 要件定義書に基づく新しいコンポーネント
import AIConectXHero from './components/AIConectXHero';
import DiagnosisFlow, { DiagnosisAnswers } from './components/DiagnosisFlow';
import SMSAuthFlow from './components/SMSAuthFlow';
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
// import { AuthGuard, AuthenticatedHeader } from './components/AuthGuard';
import { OneTimeUsageNotice } from './components/OneTimeUsageNotice';
import { supabase } from './components/supabaseClient';
import type { User } from '@supabase/supabase-js';

import { ColorThemeProvider } from './components/ColorThemeContext';
import { DiagnosisFormState, PageView } from './types';
import { initializeSampleData } from './data/sampleData';
import RegistrationRequestPage from './components/RegistrationRequestPage';
import AdminPasswordResetPage from './components/AdminPasswordResetPage';
import ProductionSecurityValidator from './components/ProductionSecurityValidator';
import { measurePageLoad } from './components/PerformanceMonitor';


// セキュリティ関数: HTMLサニタイゼーション（コメントアウト - 未使用）
// const sanitizeHTML = (html: string): string => {
//   // 危険なタグとスクリプトを除去
//   const dangerousPatterns = [
//     /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
//     /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
//     /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
//     /<embed\b[^<]*>/gi,
//     /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
//     /javascript:/gi,
//     /on\w+\s*=/gi,
//     /<[^>]*vbscript:/gi,
//     /<[^>]*data:/gi
//   ];
//   
//   let sanitized = html;
//   dangerousPatterns.forEach(pattern => {
//     sanitized = sanitized.replace(pattern, '');
//   });
//   
//   return sanitized.trim();
// };

// HTML検証関数（コメントアウト - 未使用）
// const isValidHTML = (html: string): boolean => {
//   // 基本的な安全性チェック
//   const allowedTags = ['link', 'meta', 'style', 'title', 'noscript'];
//   try {
//     const doc = new DOMParser().parseFromString(html, 'text/html');
//     const errorNode = doc.querySelector('parsererror');
//     
//     if (errorNode) {
//       return false;
//     }
//     
//     // すべての要素が許可されたタグかチェック
//     const elements = doc.body.querySelectorAll('*');
//     for (const element of elements) {
//       if (!allowedTags.includes(element.tagName.toLowerCase())) {
//         return false;
//       }
//     }
//     
//     return true;
//   } catch (error) {
//     return false;
//   }
// };

const App: React.FC = () => {
  // 要件定義書に基づくページ状態の更新
  const [currentPage, setCurrentPage] = useState<PageView>('home'); // 'diagnosis' -> 'home'に変更
  const [phoneNumberToVerify, setPhoneNumberToVerify] = useState<string | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisFormState | null>(null);
  // 新しい診断答えの状態
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<DiagnosisAnswers | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showUsageNotice, setShowUsageNotice] = useState<boolean>(false);
  
  // 新しいSupabase Auth関連の状態
  const [, setSupabaseUser] = useState<User | null>(null);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false);
  
  // 状態変更を監視するuseEffect
  useEffect(() => {
    // 状態変更の処理（ログ出力は本番環境では無効）
  }, [isAdminLoggedIn, isSupabaseAuth]);

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
  }, []);

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
          // const { data: profileData, error: profileError } = await supabase
          await supabase
            .from('profiles')
            .select('requires_password_change')
            .eq('id', session.user.id)
            .single();

          // パスワード変更機能は現在無効化されているため、常に管理画面に遷移
          setCurrentPage('adminDashboard');
        }

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            
            if (session?.user) {
              setSupabaseUser(session.user);
              setIsSupabaseAuth(true);
              setIsAdminLoggedIn(true);
              
              // パスワード変更要求をチェック
              // const { data: userProfileData, error: userProfileError } = await supabase
              await supabase
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
        
        const forceLoggedIn = localStorage.getItem('force_admin_logged_in');
        
        if (sessionAuth === 'true' && adminSession && forceLoggedIn === 'true') {
          // セッションの有効期限をチェック
          const session = JSON.parse(adminSession);
          const now = Date.now();
          
          // expiryTimeがある場合のみ有効期限をチェック
          if (session.expiryTime && now > new Date(session.expiryTime).getTime()) {
            // 期限切れセッションをクリア
            sessionStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_session');
            localStorage.removeItem('force_admin_logged_in');
            setIsAdminLoggedIn(false);
            if (currentPage === 'adminDashboard') {
              setCurrentPage('home');
            }
          } else if (session.username === 'admin' || session.authenticated === true) {
            // 有効なセッションが存在する場合のみ
            setIsAdminLoggedIn(true);
            if (currentPage !== 'adminDashboard') {
              setCurrentPage('adminDashboard');
            }
          }
        } else {
          // 不完全なセッション情報をクリア
          sessionStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_session');
          localStorage.removeItem('force_admin_logged_in');
          setIsAdminLoggedIn(false);
        }
      } catch (error) {
        // エラー時は全セッション情報をクリア
        sessionStorage.clear();
        localStorage.removeItem('admin_session');
        localStorage.removeItem('force_admin_logged_in');
        setIsAdminLoggedIn(false);
        setCurrentPage('home');
      }
    };

    // ページを閉じる時の処理
    const handleBeforeUnload = () => {
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
  }, []); // 初回のみ実行

  useEffect(() => {
    // アプリケーション初期化：サンプルデータとスクリプト読み込み
    const initializeApp = () => {
      try {
        // サンプルデータの初期化
        initializeSampleData();

        // 診断完了履歴チェック機能を無効化
        // 電話番号認証時のみポップアップを表示するように変更済み
        // diagnosisManager.getVerifiedSessions().then(verifiedSessions => {
        //   const currentUrl = window.location.href;
        //   const isOnDiagnosisPage = !currentUrl.includes('/admin') && !currentUrl.includes('/login');
        //   
        //   if (verifiedSessions.length > 0 && isOnDiagnosisPage) {
        //     setTimeout(() => setShowUsageNotice(true), 1000);
        //   }
        // }).catch(() => {
        //   // Supabase接続エラーは無視
        // });

        // トラッキングスクリプトはSupabaseから直接読み込み（管理画面設定から）
        // ここではlocalStorageに依存しない実装
      } catch (e) {
        // アプリケーション初期化エラーは無視（基本機能は動作する）
      }
    };

    initializeApp();
  }, []); // Empty dependency array means this runs once on mount

  // 要件定義書に基づく新しいナビゲーション関数
  const handleStartDiagnosis = () => {
    // 診断フォームへのスムーズスクロール（新しいレイアウト対応）
    const diagnosisSection = document.querySelector('.diagnosis-section');
    if (diagnosisSection) {
      // ヘッダー分のオフセット
      const yOffset = -80;
      const elementPosition = diagnosisSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset + yOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      
      // フォームにフォーカスを当てるアニメーション効果
      const diagnosisElement = diagnosisSection.querySelector('.home-right-col');
      if (diagnosisElement) {
        setTimeout(() => {
          diagnosisElement.classList.add('diagnosis-focus-animation');
          
          // 最初の質問の入力要素にフォーカス
          const firstInput = diagnosisElement.querySelector('button, input, select');
          if (firstInput) {
            (firstInput as HTMLElement).focus();
          }
          
          setTimeout(() => {
            diagnosisElement.classList.remove('diagnosis-focus-animation');
          }, 1500);
        }, 700);
      }
    }
  };

  const handleDiagnosisComplete = (answers: DiagnosisAnswers) => {
    setDiagnosisAnswers(answers);
    setCurrentPage('smsAuth');
  };

  const handleDiagnosisCancel = () => {
    setCurrentPage('home');
    setDiagnosisAnswers(null);
  };

  const handleSMSAuthComplete = (phoneNumber: string) => {
    setPhoneNumberToVerify(phoneNumber);
    // 診断データを従来の形式に変換（既存のDiagnosisResultsPageとの互換性のため）
    if (diagnosisAnswers) {
      const legacyDiagnosisData: DiagnosisFormState = {
        age: diagnosisAnswers.age || '',
        investmentExperience: diagnosisAnswers.experience || '',
        investmentGoal: diagnosisAnswers.purpose || '',
        monthlyInvestment: diagnosisAnswers.amount || '',
        investmentHorizon: diagnosisAnswers.timing || '',
        // 既存のフィールドもデフォルト値で埋める
        annualIncome: '',
        riskTolerance: '',
        investmentPreference: '',
        financialKnowledge: ''
      };
      setDiagnosisData(legacyDiagnosisData);
    }
    setCurrentPage('results');
  };

  const handleSMSAuthCancel = () => {
    setCurrentPage('diagnosis');
  };

  // 既存のハンドラー（後方互換性のため保持）
  const handleVerificationComplete = () => {
    setCurrentPage('results');
    window.scrollTo(0, 0);
  };

  const handleVerificationCancel = () => {
    setCurrentPage('home'); 
    window.scrollTo(0,0);
  }

  const handleReturnToStart = () => {
    setPhoneNumberToVerify(null);
    setDiagnosisData(null);
    setDiagnosisAnswers(null);
    if (isAdminLoggedIn) {
        setIsAdminLoggedIn(false);
    }
    setCurrentPage('home');
    window.scrollTo(0,0);
  }

  const handleAdminLoginSuccess = () => {
    console.log('handleAdminLoginSuccess called', { isSupabaseAuth, currentPage });
    
    // セッション情報を設定
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      sessionStorage.setItem('admin_authenticated', 'true');
      
      // 管理者ログイン状態を強制的に維持
      localStorage.setItem('force_admin_logged_in', 'true');
      
      // 状態を同期的に更新
      setIsAdminLoggedIn(true);
      setCurrentPage('adminDashboard');
      
      console.log('Admin login state set synchronously - all session data configured');
    } else {
      console.error('Admin session not found in localStorage');
      // セッションがない場合はログイン失敗として扱う
      setIsAdminLoggedIn(false);
      setCurrentPage('traditionalLogin');
    }
    
    window.scrollTo(0,0);
  };

  const handleAdminLogout = async () => {
    console.log('handleAdminLogout called');
    
    // 全ての認証状態をクリア
    setIsAdminLoggedIn(false);
    setIsSupabaseAuth(false);
    setSupabaseUser(null);
    
    if (isSupabaseAuth) {
      // Supabase認証の場合
      try {
        await supabase.auth.signOut();
        console.log('Supabase sign out completed');
      } catch (error) {
        console.error('Supabase logout error:', error);
      }
    }
    
    // 全てのセッション関連データを強制クリア
    sessionStorage.clear();
    localStorage.removeItem('admin_session');
    localStorage.removeItem('force_admin_logged_in');
    localStorage.removeItem('admin_session_state');
    
    // 確実にログアウト状態を保証
    console.log('All admin session data cleared');
    
    setCurrentPage('home');
    window.scrollTo(0,0);
  };
  
  const navigateToHome = () => {
    setCurrentPage('home');
    window.scrollTo(0,0);
  };

  const navigateToAdminLogin = () => {
    setCurrentPage('traditionalLogin');
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

  // パスワードリセットページへのナビゲーション
  const navigateToPasswordReset = () => {
    setCurrentPage('passwordReset');
    window.scrollTo(0, 0);
  };

  // トップページのUIをDiagnosisFlow中心に変更
  const renderCurrentPage = () => {
    if (currentPage === 'home') {
      return (
        <div style={{ minHeight: '100vh', background: '#eaf6fb', padding: 0, margin: 0, width: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <Header />
          
          {/* 1番目: メインヒーロー（あなたの未来の資産を診断！） */}
          <div className="hero-section">
            <AIConectXHero onStartDiagnosis={handleStartDiagnosis} />
          </div>
          
          {/* 2番目: 診断フォーム */}
          <div className="diagnosis-section">
            <div className="home-right-col">
              <DiagnosisFlow
                onComplete={(answers) => {
                  console.log('🔍 App.tsx: 診断完了 - 回答データ:', answers);
                  setDiagnosisAnswers(answers);
                  
                  // 診断データを従来の形式に変換
                  const legacyDiagnosisData: DiagnosisFormState = {
                    age: answers.age || '',
                    investmentExperience: answers.experience || '',
                    investmentGoal: answers.purpose || '',
                    monthlyInvestment: answers.amount || '',
                    investmentHorizon: answers.timing || '',
                    // 既存のフィールドもデフォルト値で埋める
                    annualIncome: '',
                    riskTolerance: '',
                    investmentPreference: '',
                    financialKnowledge: ''
                  };
                  console.log('🔍 App.tsx: 変換後の診断データ:', legacyDiagnosisData);
                  setDiagnosisData(legacyDiagnosisData);
                  
                  setCurrentPage('verification');
                  setPhoneNumberToVerify(answers.phone || null);
                }}
                onCancel={() => {}}
              />
            </div>
          </div>
          
          {/* 3番目以降: その他のセクション */}
          <div className="additional-sections">
            <ReliabilitySection />
            <SecurityTrustSection />
            <CallToActionSection />
          </div>
          
          <Footer onNavigateToAdminLogin={navigateToAdminLogin} />
          <style>{`
            /* 診断フォーカスアニメーション */
            .diagnosis-focus-animation {
              animation: diagnosisFocus 1.5s ease-in-out;
              transform-origin: center;
            }
            
            @keyframes diagnosisFocus {
              0% {
                transform: scale(1);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              25% {
                transform: scale(1.05);
                box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
              }
              50% {
                transform: scale(1.03);
                box-shadow: 0 25px 50px rgba(59, 130, 246, 0.4);
              }
              100% {
                transform: scale(1);
                box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
              }
            }
            
            /* 新しい縦型レイアウト */
            .hero-section {
              width: 100%;
              padding: 20px 0;
            }
            
            .diagnosis-section {
              width: 100%;
              padding: 40px 20px;
              display: flex;
              justify-content: center;
              background: rgba(255, 255, 255, 0.3);
              backdrop-filter: blur(5px);
            }
            
            .additional-sections {
              width: 100%;
              padding: 40px 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .home-right-col {
              width: 100%;
              max-width: 500px;
              transition: all 0.3s ease;
              padding: 20px;
              border-radius: 20px;
              background: rgba(255, 255, 255, 0.4);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .home-right-col:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
            }
            
            @media (max-width: 768px) {
              .hero-section {
                padding: 10px 0;
              }
              
              .diagnosis-section {
                padding: 20px 10px;
              }
              
              .additional-sections {
                padding: 20px 10px;
              }
              
              .home-right-col {
                max-width: 100% !important;
                margin: 0 auto;
                padding: 15px;
              }
            }
            @media (max-width: 480px) {
              .diagnosis-section {
                padding: 15px 5px;
              }
              
              .home-right-col {
                padding: 10px;
                border-radius: 15px;
              }
            }
          `}</style>
        </div>
      );
    }
    // 管理者ログイン状態の場合（セキュリティ強化）
    const forceAdminLoggedIn = localStorage.getItem('force_admin_logged_in') === 'true';
    const sessionAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    const adminSession = localStorage.getItem('admin_session');
    
    // セッション有効性の詳細チェック
    let isValidSession = false;
    if (adminSession && forceAdminLoggedIn) {
      try {
        const session = JSON.parse(adminSession);
        const now = Date.now();
        
        // セッションの有効期限をチェック
        if (session.expires && now <= session.expires) {
          isValidSession = true;
        } else if (!session.expires && session.authenticated === true) {
          // 有効期限がない場合は認証済みかどうかで判断
          isValidSession = true;
        } else {
          // 期限切れまたは無効なセッションをクリア
          localStorage.removeItem('admin_session');
          localStorage.removeItem('force_admin_logged_in');
          sessionStorage.removeItem('admin_authenticated');
        }
      } catch (error) {
        console.error('セッション解析エラー:', error);
        // 不正なセッションデータをクリア
        localStorage.removeItem('admin_session');
        localStorage.removeItem('force_admin_logged_in');
        sessionStorage.removeItem('admin_authenticated');
      }
    }
    
    // より厳密な認証チェック: 全ての条件が揃っている場合のみアクセス許可
    const actualAdminLoggedIn = isAdminLoggedIn && forceAdminLoggedIn && sessionAuth && isValidSession;
    const actualCurrentPage = actualAdminLoggedIn ? 'adminDashboard' : currentPage;
    
    console.log('Checking admin dashboard condition:', { 
      isAdminLoggedIn, 
      forceAdminLoggedIn, 
      sessionAuth,
      isValidSession,
      actualAdminLoggedIn, 
      currentPage, 
      actualCurrentPage,
      condition: actualAdminLoggedIn && actualCurrentPage === 'adminDashboard' 
    });
    
    if (actualAdminLoggedIn && actualCurrentPage === 'adminDashboard') {
      console.log('Rendering AdminDashboardPage');
      try {
        return (
          <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <AdminDashboardPage 
              onLogout={handleAdminLogout}
              onNavigateHome={navigateToHome}
            />
          </div>
        );
      } catch (error) {
        console.error('AdminDashboardPage render error:', error);
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
            <h1 style={{ color: 'red' }}>エラーが発生しました</h1>
            <p style={{ color: 'black' }}>管理者ダッシュボードの読み込み中にエラーが発生しました。</p>
            <pre style={{ color: 'red', fontSize: '12px' }}>{error?.toString()}</pre>
            <button 
              onClick={handleAdminLogout}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ログアウト
            </button>
          </div>
        );
      }
    }

    // 管理者関連ページ
    if (currentPage === 'loginSelection') {
      return <LoginSelectionPage 
        onSelectTraditionalAuth={navigateToTraditionalLogin}
        onSelectSupabaseAuth={navigateToSupabaseLogin}
        onNavigateHome={navigateToHome}
      />;
    }

    if (currentPage === 'traditionalLogin') {
      return <AdminLoginPage 
        onLogin={handleAdminLoginSuccess}
        onNavigateHome={navigateToHome}
        onNavigateToPasswordReset={navigateToPasswordReset}
      />;
    }

    if (currentPage === 'supabaseLogin') {
      return <SupabaseAuthLogin 
        onLogin={handleAdminLoginSuccess}
        onNavigateHome={navigateToHome} 
      />;
    }

    if (currentPage === 'registrationRequest') {
      return <RegistrationRequestPage onNavigateHome={navigateToHome} />;
    }

    if (currentPage === 'passwordReset') {
      return <AdminPasswordResetPage onNavigateBack={() => setCurrentPage('traditionalLogin')} />;
    }

    // 既存の電話認証ページ（後で削除予定）
    if (currentPage === 'verification') {
      return (
        <PhoneVerificationPage
          userSession={{
            id: `verification-${Date.now()}`,
            timestamp: new Date().toISOString(),
            phoneNumber: phoneNumberToVerify || '',
            diagnosisAnswers: diagnosisData || {}
          }}
          onVerificationSuccess={handleVerificationComplete}
          onBack={handleVerificationCancel}
        />
      );
    }

    if (currentPage === 'results') {
      return (
        <DiagnosisResultsPage
          diagnosisData={diagnosisData}
          onReturnToStart={handleReturnToStart}
        />
      );
    }

    // 要件定義書に基づく新しいページフロー
    if (currentPage === 'diagnosis') {
      return (
        <DiagnosisFlow
          onComplete={handleDiagnosisComplete}
          onCancel={handleDiagnosisCancel}
        />
      );
    }

    if (currentPage === 'smsAuth') {
      return (
        <SMSAuthFlow
          diagnosisAnswers={diagnosisAnswers!}
          onAuthComplete={handleSMSAuthComplete}
          onCancel={handleSMSAuthCancel}
        />
      );
    }

    // デフォルト: ホームページ（要件定義書準拠）
    return (
      <>
        <Header />
        <main>
          <AIConectXHero onStartDiagnosis={handleStartDiagnosis} />
          <ReliabilitySection />
          <SecurityTrustSection />
          <CallToActionSection />
        </main>
        <Footer onNavigateToAdminLogin={navigateToAdminLogin} />
      </>
    );
  };

  // 一回限り診断の案内
  const usageNotice = showUsageNotice && (
    <OneTimeUsageNotice onDismiss={() => setShowUsageNotice(false)} />
  );

  if (process.env.NODE_ENV !== 'production') {
    measurePageLoad('トップ画面', 2000);
  }

  return (
    <ColorThemeProvider>
      <div className="App min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <ProductionSecurityValidator />
        
        {renderCurrentPage()}
        
        {usageNotice}
      </div>
    </ColorThemeProvider>
  );
};

export default App;