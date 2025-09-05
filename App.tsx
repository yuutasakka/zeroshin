import React, { useEffect, useState } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import Header from './src/components/Header';
// 要件定義書に基づく新しいコンポーネント
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
// 暗号資産適性診断コンポーネント
import CombatPowerResults from './src/components/CombatPowerResults';
import CryptoAptitudeApp from './src/components/CryptoAptitudeApp';
import Footer from './src/components/Footer';

import { DiagnosisFormState, PageView } from './types';

const App: React.FC = () => {
  // 要件定義書に基づくページ状態の更新（暗号資産診断がメイン）
  const [currentPage, setCurrentPage] = useState<PageView>('cryptoAptitude');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisFormState | null>(null);
  // 新しい診断答えの状態
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<DiagnosisAnswers | null>(null);
  // 生の診断回答を保存（新しい適性診断用）
  const [rawDiagnosisAnswers, setRawDiagnosisAnswers] = useState<Record<number, string> | null>(null);
  
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

  useEffect(() => {
    // アプリケーション初期化
    // 基本機能は動作する
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


  const navigateToCryptoAptitude = () => {
    setCurrentPage('cryptoAptitude');
    window.scrollTo(0, 0);
  };

  // ページレンダリングロジック
  const renderCurrentPage = () => {
    if (currentPage === 'home') {
      return (
        <ErrorBoundary>
          <div className="app-main">
          <Header />
          
          {/* Hero Section */}
          <Hero onStartDiagnosis={handleStartDiagnosis} />
          
          {/* 診断フォーム */}
          <div className="diagnosis-section" id="diagnosis-form-section">
            <div className="diagnosis-container">
              <DiagnosisForm
                onComplete={(answers) => {
                  // 生の回答を保存（新しい適性診断用）
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
          
          <Footer />
          
          <style jsx>{`
            .app-main {
              min-height: 100vh;
            }
            
            .diagnosis-section {
              padding: 4rem 2rem;
              background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            }
            
            .diagnosis-container {
              max-width: 800px;
              margin: 0 auto;
            }
            
            @media (max-width: 768px) {
              .diagnosis-section {
                padding: 2rem 1rem;
              }
            }
          `}</style>
        </div>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'results') {
      // 新しい適性診断結果画面を使用
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
            // PDFガイドは結果画面内のボタンから直接ダウンロード可能
            console.log('診断結果表示完了');
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
          <Hero onStartDiagnosis={handleStartDiagnosis} />
        </main>
        <Footer />
      </>
    );
  };

  return (
    <div className="app-container" style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
      color: '#333'
    }}>
      {renderCurrentPage()}
    </div>
  );
};

export default App;