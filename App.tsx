import React, { useEffect, useState } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import Header from './src/components/Header';
import DiagnosisForm from './src/components/DiagnosisForm';
import Hero from './src/components/Hero';
type DiagnosisAnswers = {
  age: string;
  experience: string;
  purpose: string;
  amount: string;
  timing: string;
};
import CombatPowerResults from './src/components/CombatPowerResults';
import CryptoAptitudeApp from './src/components/CryptoAptitudeApp';
import Footer from './src/components/Footer';

import { DiagnosisFormState, PageView } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('cryptoAptitude');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisFormState | null>(null);
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<DiagnosisAnswers | null>(null);
  const [rawDiagnosisAnswers, setRawDiagnosisAnswers] = useState<Record<number, string> | null>(null);
  
  useEffect(() => {
    if (currentPage === 'results') {
      document.body.classList.add('verification-page-active');
    } else {
      document.body.classList.remove('verification-page-active');
      document.body.style.fontFamily = 'var(--font-primary)';
    }
    return () => {
      document.body.classList.remove('verification-page-active');
    };
  }, [currentPage]);

  useEffect(() => {
    // Load modern design CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/modern-design.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleStartDiagnosis = () => {
    if (currentPage === 'article') {
      setCurrentPage('home');
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

    const diagnosisSection = document.getElementById('diagnosis-form-section');
    if (diagnosisSection) {
      const yOffset = -80;
      const elementPosition = diagnosisSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset + yOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      
      const diagnosisElement = diagnosisSection.querySelector('.home-right-col');
      if (diagnosisElement) {
        setTimeout(() => {
          diagnosisElement.classList.add('diagnosis-focus-animation');
          
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

  const renderCurrentPage = () => {
    if (currentPage === 'home') {
      return (
        <ErrorBoundary>
          <div className="app-main" style={{ background: 'var(--gradient-bg)' }}>
          <Header />
          
          <Hero onStartDiagnosis={handleStartDiagnosis} />
          
          <section className="diagnosis-section" id="diagnosis-form-section" style={{
            padding: '6rem 2rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
            position: 'relative'
          }}>
            <div className="container">
              <DiagnosisForm
                onComplete={(answers) => {
                  setRawDiagnosisAnswers(answers);
                  
                  const convertedAnswers: DiagnosisAnswers = {
                    age: answers[1] || '',
                    experience: answers[3] || '',
                    purpose: answers[4] || '',
                    amount: answers[2] || '',
                    timing: 'now'
                  };
                  
                  setDiagnosisAnswers(convertedAnswers);
                  
                  const legacyDiagnosisData: DiagnosisFormState = {
                    age: convertedAnswers.age || '',
                    investmentExperience: convertedAnswers.experience || '',
                    investmentGoal: convertedAnswers.purpose || '',
                    monthlyInvestment: convertedAnswers.amount || '',
                    investmentHorizon: convertedAnswers.timing || '',
                    annualIncome: '',
                    riskTolerance: '',
                    investmentPreference: '',
                    financialKnowledge: ''
                  };
                  setDiagnosisData(legacyDiagnosisData);
                  
                  setCurrentPage('results');
                }}
              />
            </div>
          </section>
          
          <Footer />
        </div>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'results') {
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

    if (currentPage === 'diagnosis') {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--gradient-bg)',
          paddingTop: '80px'
        }}>
          <Header />
          <div style={{ paddingTop: '2rem' }}>
            <DiagnosisForm
              onComplete={(answers) => {
                setRawDiagnosisAnswers(answers);
                
                const convertedAnswers: DiagnosisAnswers = {
                  age: answers[1] || '',
                  experience: answers[3] || '',
                  purpose: answers[4] || '',
                  amount: answers[2] || '',
                  timing: 'now'
                };
                
                setDiagnosisAnswers(convertedAnswers);
                setCurrentPage('results');
              }}
            />
          </div>
        </div>
      );
    }

    if (currentPage === 'cryptoAptitude') {
      return (
        <ErrorBoundary>
          <CryptoAptitudeApp />
        </ErrorBoundary>
      );
    }

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
    <div className="app-container container" style={{
      minHeight: '100vh',
      fontFamily: 'var(--font-primary)',
      lineHeight: 1.6,
      color: 'var(--color-text-primary)',
      background: 'var(--color-bg-primary)'
    }}>
      {renderCurrentPage()}
    </div>
  );
};

export default App;