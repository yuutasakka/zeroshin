

import React from 'react';

const Header: React.FC = () => {
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


  return (
    <header className="py-6 px-4 relative z-50"> {/* Removed overflow-hidden to ensure shadows from other elements might show */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <a href="#top" onClick={scrollToTop} className="flex items-center space-x-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-var(--accent-gold) rounded-md">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center" 
              style={{ background: 'var(--gradient-gold)' }}
              aria-hidden="true"
            >
              <i className="fas fa-coins text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold heading-primary" style={{color: 'var(--primary-navy)'}}>マネーチケット</h1>
          </a>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#main-visual-section" onClick={(e) => scrollToSection(e, 'main-visual-section')} className="text-luxury hover:text-var(--primary-navy) transition-colors">サービス概要</a>
            <a href="#reliability-section" onClick={(e) => scrollToSection(e, 'reliability-section')} className="text-luxury hover:text-var(--primary-navy) transition-colors">選ばれる理由</a>
            <a href="#cta-section" onClick={(e) => scrollToSection(e, 'cta-section')} className="text-luxury hover:text-var(--primary-navy) transition-colors">お問い合わせ</a>
          </nav>
        </div>
         <div className="sm:hidden mt-3 px-3 py-2 rounded-full shadow-lg text-center flex justify-center items-center" style={{background: 'rgba(255,255,255,0.8)'}}>
            <span className="text-xs" style={{color: 'var(--neutral-700)'}}>
              <i className="fas fa-star mr-1" style={{color: 'var(--accent-gold)'}}></i>
              あなたの資産運用をプロがサポート
            </span>
        </div>
      </div>
    </header>
  );
};

export default Header;