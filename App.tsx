import React, { useEffect, useState } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import Header from './src/components/Header';
// 要件定義書に基づく新しいコンポーネント
import ArticlePage from './src/components/ArticlePage';
import DiagnosisForm from './src/components/DiagnosisForm';
import Hero from './src/components/Hero';
// 診断回答の型定義（簡素化）
type DiagnosisAnswers = {
  age: string;
  experience: string;
  purpose: string;
  amount: string;
  timing: string;
};
// WasteDiagnosisコンポーネントはLINE認証化により使用されていない - 削除済み
// ReliabilitySection と SecurityTrustSection を削除（記事スタイル変更のため）
import CallToActionSection from './src/components/CallToActionSection';
import CombatPowerResults from './src/components/CombatPowerResults';
import CryptoAptitudeApp from './src/components/CryptoAptitudeApp';
import FixedCTA from './src/components/FixedCTA';
import Footer from './src/components/Footer';
// FAQSection を削除（記事スタイル変更のため）

// DiagnosisResultsPageはCombatPowerResultsに置き換えられたため使用されていない - 削除済み
// 管理者関連のインポートを削除（完全分離のため）

// 基本コンポーネント（即時読み込み）
import { OneTimeUsageNotice } from './src/components/OneTimeUsageNotice';
// supabaseインポートは使用されていない - 削除済み
import { HelmetProvider } from 'react-helmet-async';
import { initializeSampleData } from './data/sampleData';
import AccessibilityAnnouncer from './src/components/AccessibilityAnnouncer';
import { AccessibilityProvider } from './src/components/AccessibilityProvider';
import { ColorThemeProvider } from './src/components/ColorThemeContext';
import { measurePageLoad } from './src/components/PerformanceMonitor';
import ProductionSecurityValidator from './src/components/ProductionSecurityValidator';
import PWAInstallPrompt from './src/components/PWAInstallPrompt';
import PWAUpdatePrompt from './src/components/PWAUpdatePrompt';
import SEOHead from './src/components/SEOHead';
import SkipLinks from './src/components/SkipLinks';
import TemplateStyleProvider from './src/components/TemplateStyleProvider';
import { DesignSettingsProvider } from './src/contexts/DesignSettingsContext';
import { DiagnosisFormState, PageView } from './types';

// ローディングコンポーネント（アニメーションなし）
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    backgroundColor: 'var(--color-secondary)' // 統一されたセカンダリ
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '4px solid var(--color-accent)', // 統一されたアクセント
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--color-primary)', // 統一されたプライマリ
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '12px'
    }}>
      読込中
    </div>
  </div>
);

const App: React.FC = () => {
  // 要件定義書に基づくページ状態の更新（暗号資産診断がメイン）
  const [currentPage, setCurrentPage] = useState<PageView>('cryptoAptitude');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisFormState | null>(null);
  // 新しい診断答えの状態
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<DiagnosisAnswers | null>(null);
  // 生の診断回答を保存（新しい戦闘力診断用）
  const [rawDiagnosisAnswers, setRawDiagnosisAnswers] = useState<Record<number, string> | null>(null);
  const [showUsageNotice, setShowUsageNotice] = useState<boolean>(false);
  
  // 管理者関連の状態を削除（完全分離のため）
  
  useEffect(() => {
    // Apply body class for results pages for consistent styling
    if (currentPage === 'results') {
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

  // 管理者認証機能を削除（完全分離のため）



  // 管理者セッション管理を削除（完全分離のため）

  useEffect(() => {
    // アプリケーション初期化：サンプルデータとスクリプト読み込み
    const initializeApp = () => {
      try {
        // サンプルデータの初期化
        initializeSampleData();

        // 診断完了履歴チェック機能を無効化
        // 電話番号認証時のみポップアップを表示するように変更済み

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
    // If we're on the article page, navigate to home first
    if (currentPage === 'article') {
      setCurrentPage('home');
      // Wait for the page to render, then scroll to diagnosis
      setTimeout(() => {
        const diagnosisSection = document.getElementById('diagnosis-form-section');
        if (diagnosisSection) {
          const yOffset = -80;
          const elementPosition = diagnosisSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset + yOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      }, 100);
      return;
    }

    // 診断フォームへのスムーズスクロール（新しいレイアウト対応）
    const diagnosisSection = document.getElementById('diagnosis-form-section');
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

  // 古いhandleDiagnosisComplete関数は使用されていない - 削除済み

  const handleDiagnosisCancel = () => {
    setCurrentPage('home');
    setDiagnosisAnswers(null);
  };

  // 古いhandleSMSAuthComplete関数は使用されていない - 削除済み

  // 古いhandleSMSAuthCancel関数は使用されていない - 削除済み

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
    setDiagnosisData(null);
    setDiagnosisAnswers(null);
    setRawDiagnosisAnswers(null);
    setCurrentPage('home');
    window.scrollTo(0,0);
  }
  
  const navigateToHome = () => {
    setCurrentPage('home');
    window.scrollTo(0,0);
  };

  const navigateToArticle = () => {
    setCurrentPage('article');
    window.scrollTo(0,0);
  };

  const navigateToCryptoAptitude = () => {
    setCurrentPage('cryptoAptitude');
    window.scrollTo(0,0);
  };

  // 管理者関連のナビゲーション関数を削除（完全分離のため）

  // トップページのUIをDiagnosisFlow中心に変更
  const renderCurrentPage = () => {
    if (currentPage === 'home') {
      return (
        <ErrorBoundary>
          <div style={{ minHeight: '100vh', background: '#ffffff', padding: 0, margin: 0, width: '100%', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <Header />
          
          {/* メインコンテンツ */}
          <div className="hero-section">
            <Hero onStartDiagnosis={handleStartDiagnosis} onNavigateToArticle={navigateToArticle} />
          </div>
          
          {/* 診断フォーム */}
          <div className="diagnosis-section" id="diagnosis-form-section" style={{
            backgroundColor: '#F7F9FC',
            padding: '80px 20px',
            minHeight: '100vh'
          }}>
            <div className="home-right-col">
              <DiagnosisForm
                onComplete={(answers) => {
                  // 生の回答を保存（新しい戦闘力診断用）
                  setRawDiagnosisAnswers(answers);
                  
                  // 簡素化された回答を既存の形式に変換
                  const convertedAnswers: DiagnosisAnswers = {
                    age: answers[1] || '',
                    experience: answers[3] || '',
                    purpose: answers[4] || '',
                    amount: answers[2] || '',
                    timing: 'now'
                  };
                  
                  setDiagnosisAnswers(convertedAnswers);
                  
                  // 診断データを従来の形式に変換
                  const legacyDiagnosisData: DiagnosisFormState = {
                    age: convertedAnswers.age || '',
                    investmentExperience: convertedAnswers.experience || '',
                    investmentGoal: convertedAnswers.purpose || '',
                    monthlyInvestment: convertedAnswers.amount || '',
                    investmentHorizon: convertedAnswers.timing || '',
                    // 既存のフィールドもデフォルト値で埋める
                    annualIncome: '',
                    riskTolerance: '',
                    investmentPreference: '',
                    financialKnowledge: ''
                  };
                  setDiagnosisData(legacyDiagnosisData);
                  
                  // LINE認証をスキップして直接結果ページへ
                  setCurrentPage('results');
                }}
              />
            </div>
          </div>
          
          <CallToActionSection />
          <Footer />
          <style>{`
            /* 診断フォーカス効果（戦闘力テーマ） */
            .diagnosis-focus-animation {
              box-shadow: var(--shadow-lg);
              border: 2px solid var(--color-primary);
              background: var(--color-bg-accent);
            }
            
            /* 新しい縦型レイアウト - 視認性向上 */
            .hero-section {
              width: 100%;
              padding: 0;
              background: transparent;
            }
            
            .diagnosis-section {
              width: 100%;
              padding: 80px 20px;
              display: flex;
              justify-content: center;
              position: relative;
            }
            
            .diagnosis-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: linear-gradient(90deg, transparent, var(--color-primary), var(--color-accent), var(--color-primary), transparent);
            }
            
            .additional-sections {
              width: 100%;
              padding: 60px 20px;
              max-width: 1200px;
              margin: 0 auto;
              background: #ffffff;
            }
            
            .home-right-col {
              width: 100%;
              max-width: 900px;
              background: transparent;
              padding: 0;
            }
            
            /* タブレット対応 */
            @media (max-width: 1024px) and (min-width: 769px) {
              .hero-section {
                padding: 30px 0 15px 0;
              }
              
              .diagnosis-section {
                padding: 40px 20px;
              }
              
              .home-right-col {
                max-width: 600px;
                padding: 32px;
              }
              
              .additional-sections {
                padding: 40px 20px;
              }
            }
            
            /* スマートフォン（一般） */
            @media (max-width: 768px) {
              .hero-section {
                padding: 20px 0 10px 0;
              }
              
              .diagnosis-section {
                padding: 30px 16px;
              }
              
              .additional-sections {
                padding: 30px 16px;
              }
              
              .home-right-col {
                max-width: calc(100% - 32px);
                margin: 0 auto;
                padding: 24px;
                border-radius: 20px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
              }
            }
            
            /* スマートフォン（小画面） */
            @media (max-width: 480px) {
              .diagnosis-section {
                padding: 24px 12px;
              }
              
              .home-right-col {
                max-width: calc(100% - 24px);
                padding: 20px;
                border-radius: 16px;
                margin: 0 auto;
              }
              
              .additional-sections {
                padding: 24px 12px;
              }
            }
            
            /* 極小画面対応（iPhone SE等） */
            @media (max-width: 375px) {
              .hero-section {
                padding: 16px 0 8px 0;
              }
              
              .diagnosis-section {
                padding: 20px 10px;
              }
              
              .home-right-col {
                max-width: calc(100% - 20px);
                padding: 16px;
                margin: 0 auto;
                border-radius: 12px;
              }
              
              .additional-sections {
                padding: 20px 10px;
              }
            }
          `}</style>
        </div>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'results') {
      // 新しい戦闘力結果画面を使用
      // 生の診断回答を使用（rawDiagnosisAnswersが存在しない場合はデフォルト値）
      const answersToUse = rawDiagnosisAnswers || {
        1: '～300万円',
        2: '～10万円',
        3: '0件',
        4: '収入に対して返済が10%未満',
        5: '1ヶ月以内'
      };
      
      return (
        <CombatPowerResults
          diagnosisAnswers={answersToUse}
          onDownloadGuide={() => {
            // 攻略本ダウンロード処理（後で実装）
            // ここでPDFダウンロードまたはメール送信フォームを表示
            alert('攻略本のダウンロードリンクをメールで送信します。');
          }}
        />
      );
    }

    // 診断フォームページ
    if (currentPage === 'diagnosis') {
      return (
        <div style={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f0f4f8 0%, #ffffff 100%)',
          paddingTop: '80px'
        }}>
          <Header />
          <div style={{ paddingTop: '2rem' }}>
            <DiagnosisForm
              onComplete={(answers) => {
                // 生の回答を保存
                setRawDiagnosisAnswers(answers);
                
                // 簡素化された回答を既存の形式に変換
                const convertedAnswers: DiagnosisAnswers = {
                  age: answers[1] || '',
                  experience: answers[3] || '',
                  purpose: answers[4] || '',
                  amount: answers[2] || '',
                  timing: 'now'
                };
                
                setDiagnosisAnswers(convertedAnswers);
                // LINE認証をスキップして直接結果ページへ
                setCurrentPage('results');
              }}
            />
          </div>
        </div>
      );
    }

    // 古いsmsAuthページレンダリングは使用されていない - 削除済み

    // 記事ページ
    if (currentPage === 'article') {
      return (
        <ArticlePage onStartDiagnosis={handleStartDiagnosis} />
      );
    }

    // 暗号資産トレード適性診断ページ
    if (currentPage === 'cryptoAptitude') {
      return (
        <ErrorBoundary>
          <CryptoAptitudeApp />
        </ErrorBoundary>
      );
    }

    // デフォルト: ホームページ（記事スタイルに変更）
    return (
      <>
        <Header />
        <main>
          <Hero 
            onStartDiagnosis={handleStartDiagnosis} 
            onNavigateToArticle={navigateToArticle}
            onNavigateToCryptoAptitude={navigateToCryptoAptitude}
          />
          <CallToActionSection />
        </main>
        <Footer />
        <FixedCTA onStartDiagnosis={handleStartDiagnosis} />
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
    <HelmetProvider>
      <AccessibilityProvider>
          <DesignSettingsProvider>
            <ColorThemeProvider>
              <TemplateStyleProvider>
                <div className="App min-h-screen" style={{ background: '#ffffff' }}>
                  <SEOHead />
                  <SkipLinks />
                  <AccessibilityAnnouncer />
                  <ProductionSecurityValidator />
                  
                  <main id="main-content">
                    {renderCurrentPage()}
                  </main>
                  
                  {usageNotice}
                  <PWAInstallPrompt />
                  <PWAUpdatePrompt />
                  {/* <AccessibilityAudit /> */}
                </div>
              </TemplateStyleProvider>
            </ColorThemeProvider>
          </DesignSettingsProvider>
        </AccessibilityProvider>
    </HelmetProvider>
  );
};

export default App;