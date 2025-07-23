import React, { useState } from 'react';
import { defaultHeaderData } from '../../data/homepageContentData';
import { useHeaderData, useDesignTemplate } from '../../src/contexts/DesignSettingsContext';
// import LanguageSwitcher from './LanguageSwitcher';
// import { useTranslation } from '../i18n/hooks';

const Header: React.FC = () => {
  const headerDataFromContext = useHeaderData();
  const headerData = headerDataFromContext || defaultHeaderData;
  const { templateConfig } = useDesignTemplate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, sectionId: string) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartDiagnosis = () => {
    // 診断フォームセクションへスムーズスクロール
    const diagnosisSection = document.getElementById('diagnosis-form-section');
    if (diagnosisSection) {
      const yOffset = -80; // ヘッダー分のオフセット
      const elementPosition = diagnosisSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset + yOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      
      // フォームにフォーカスを当てる
      setTimeout(() => {
        const firstInput = diagnosisSection.querySelector('button, input, select');
        if (firstInput) {
          (firstInput as HTMLElement).focus();
        }
      }, 700);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
      <header 
        id="navigation"
        className="app-header fixed top-0 left-0 right-0 z-50 glass-dark"
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 50
        }}
        role="banner"
      >
        <div className="container mx-auto px-4 lg:px-8" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
            <a href="#top" onClick={scrollToTop} className="flex items-center space-x-2 md:space-x-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg p-2 hover:bg-gray-50 transition-all duration-200">
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {headerData.title}
                </h1>
                <span className="hidden sm:block text-xs text-gray-400 font-medium">
                  AI投資診断プラットフォーム
                </span>
              </div>
            </a>
            
            {/* デスクトップナビゲーション */}
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#main-visual-section" onClick={(e) => scrollToSection(e, 'main-visual-section')} className="px-4 py-2 text-sm md:text-base text-gray-300 hover:text-white transition-all duration-200 font-medium">
                サービス
              </a>
              <a href="#reliability-section" onClick={(e) => scrollToSection(e, 'reliability-section')} className="px-4 py-2 text-sm md:text-base text-gray-300 hover:text-white transition-all duration-200 font-medium">
                選ばれる理由
              </a>
              <a href="#cta-section" onClick={(e) => scrollToSection(e, 'cta-section')} className="px-4 py-2 text-sm md:text-base text-gray-300 hover:text-white transition-all duration-200 font-medium">
                お問い合わせ
              </a>
              <div className="ml-4 pl-4 border-l border-blue-200/50">
                <button 
                  onClick={handleStartDiagnosis}
                  className="btn btn-gradient"
                  style={{
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.875rem'
                  }}
                >
                  診断を始める
                </button>
              </div>
            </nav>
            
            {/* モバイルメニューボタン */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              aria-label="メニューを開く"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
        </div>
        
        {/* モバイルメニュー */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block animate-slide-down' : 'hidden'}`}>
          <nav className="glass-dark border-t border-white/10 px-4 py-4">
            <div className="space-y-2">
              <a 
                href="#main-visual-section" 
                onClick={(e) => {
                  scrollToSection(e, 'main-visual-section');
                  setIsMobileMenuOpen(false);
                }} 
                className="flex items-center py-3 px-4 text-base text-gray-300 hover:text-white rounded-lg transition-all duration-200"
              >
                サービス
              </a>
              <a 
                href="#reliability-section" 
                onClick={(e) => {
                  scrollToSection(e, 'reliability-section');
                  setIsMobileMenuOpen(false);
                }} 
                className="flex items-center py-3 px-4 text-base text-gray-300 hover:text-white rounded-lg transition-all duration-200"
              >
                選ばれる理由
              </a>
              <a 
                href="#cta-section" 
                onClick={(e) => {
                  scrollToSection(e, 'cta-section');
                  setIsMobileMenuOpen(false);
                }} 
                className="flex items-center py-3 px-4 text-base text-gray-300 hover:text-white rounded-lg transition-all duration-200"
              >
                お問い合わせ
              </a>
              <div className="pt-4 mt-4 border-t border-white/10">
                <button 
                  onClick={() => {
                    handleStartDiagnosis();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full btn btn-gradient"
                >
                  診断を始める
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>
      
      {/* ヘッダー分のスペーサー */}
      <div className="h-16 md:h-16"></div>
    </>
  );
};

export default Header;