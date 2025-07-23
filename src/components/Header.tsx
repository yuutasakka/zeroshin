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
    // 診断ページにナビゲート（実際のルーティング実装に応じて調整）
    window.location.href = '/diagnosis';
    // または React Routerを使用している場合:
    // navigate('/diagnosis');
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
        className={`app-header fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-50/95 via-white/95 to-purple-50/95 backdrop-blur-lg border-b border-blue-100/50 shadow-lg z-50 ${templateConfig ? `layout-${templateConfig.styles.header.layout}` : ''}`}
        role="banner"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className={`flex items-center ${templateConfig?.styles.header.layout === 'centered' ? 'justify-center' : 'justify-between'} ${templateConfig?.styles.header.layout === 'vertical' ? 'flex-col py-4' : ''} h-16 md:h-20`}>
            <a href="#top" onClick={scrollToTop} className="flex items-center space-x-2 md:space-x-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg p-2 hover:bg-gray-50 transition-all duration-200">
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200" 
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                aria-hidden="true"
              >
                <i className="fas fa-chart-line text-white text-lg md:text-xl"></i>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  {headerData.title}
                </h1>
                <span className="hidden sm:block text-xs text-gray-500 font-medium">
                  AI投資診断プラットフォーム
                </span>
              </div>
            </a>
            
            {/* デスクトップナビゲーション */}
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#main-visual-section" onClick={(e) => scrollToSection(e, 'main-visual-section')} className="px-4 py-2 text-sm md:text-base text-gray-700 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 font-medium relative group">
                <span className="relative z-10">サービス</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </a>
              <a href="#reliability-section" onClick={(e) => scrollToSection(e, 'reliability-section')} className="px-4 py-2 text-sm md:text-base text-gray-700 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 font-medium relative group">
                <span className="relative z-10">選ばれる理由</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </a>
              <a href="#cta-section" onClick={(e) => scrollToSection(e, 'cta-section')} className="px-4 py-2 text-sm md:text-base text-gray-700 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 font-medium relative group">
                <span className="relative z-10">お問い合わせ</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </a>
              <div className="ml-4 pl-4 border-l border-blue-200/50">
                <button 
                  onClick={handleStartDiagnosis}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  診断を始める
                </button>
              </div>
            </nav>
            
            {/* モバイルメニューボタン */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              aria-label="メニューを開く"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* サブタイトル（モバイル） */}
          <div className="sm:hidden px-3 py-2 text-center bg-gradient-to-r from-blue-50 to-purple-50">
            <span className="text-xs font-medium text-gray-600">
              <i className="fas fa-sparkles mr-1 text-blue-500"></i>
              {headerData.subtitle}
            </span>
          </div>
        </div>
        
        {/* モバイルメニュー */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block animate-slide-down' : 'hidden'}`}>
          <nav className="bg-gradient-to-r from-blue-50/95 via-white/95 to-purple-50/95 backdrop-blur-lg border-t border-blue-100/50 px-4 py-4 shadow-lg">
            <div className="space-y-2">
              <a 
                href="#main-visual-section" 
                onClick={(e) => {
                  scrollToSection(e, 'main-visual-section');
                  setIsMobileMenuOpen(false);
                }} 
                className="flex items-center py-3 px-4 text-base text-gray-700 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 group"
              >
                <i className="fas fa-cog mr-3 text-gray-400 group-hover:text-blue-500"></i>
                サービス
              </a>
              <a 
                href="#reliability-section" 
                onClick={(e) => {
                  scrollToSection(e, 'reliability-section');
                  setIsMobileMenuOpen(false);
                }} 
                className="flex items-center py-3 px-4 text-base text-gray-700 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 group"
              >
                <i className="fas fa-star mr-3 text-gray-400 group-hover:text-blue-500"></i>
                選ばれる理由
              </a>
              <a 
                href="#cta-section" 
                onClick={(e) => {
                  scrollToSection(e, 'cta-section');
                  setIsMobileMenuOpen(false);
                }} 
                className="flex items-center py-3 px-4 text-base text-gray-700 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 group"
              >
                <i className="fas fa-envelope mr-3 text-gray-400 group-hover:text-blue-500"></i>
                お問い合わせ
              </a>
              <div className="pt-4 mt-4 border-t border-blue-200/50">
                <button 
                  onClick={() => {
                    handleStartDiagnosis();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-base font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  診断を始める
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>
      
      {/* ヘッダー分のスペーサー */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default Header;