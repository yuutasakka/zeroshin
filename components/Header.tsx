import React, { useState, useEffect } from 'react';
import { HeaderData, defaultHeaderData } from '../data/homepageContentData';

import { secureLog } from '../security.config';
import { createSupabaseClient } from './adminUtils';

const Header: React.FC = () => {
  const [headerData, setHeaderData] = useState<HeaderData>(defaultHeaderData);

  useEffect(() => {
    loadHeaderFromSupabase();
  }, []);

  const loadHeaderFromSupabase = async () => {
    try {
      const supabaseConfig = createSupabaseClient();
      
      // 本番環境でSupabase設定がない場合はデフォルトデータを使用
      if (!supabaseConfig.url || !supabaseConfig.key) {
        secureLog('⚠️ Header: Supabase設定なし：デフォルトデータを使用');
        return;
      }

      const response = await fetch(`${supabaseConfig.url}/rest/v1/homepage_content_settings?setting_key.eq=header_data&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].setting_data) {
          secureLog('✅ ヘッダーデータをSupabaseから読み込み');
          setHeaderData(data[0].setting_data);
        }
      } else {
        secureLog('ヘッダーデータの読み込みに失敗、デフォルトデータを使用');
      }
    } catch (error) {
      secureLog('ヘッダーデータ読み込みエラー、デフォルトデータを使用:', error);
      // エラーが発生してもデフォルトデータを使用するだけで、ユーザーにはエラーを表示しない
    }
  };

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
            <h1 className="text-2xl font-bold heading-primary" style={{color: 'var(--primary-navy)'}}>{headerData.title}</h1>
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
              {headerData.subtitle}
            </span>
        </div>
      </div>
    </header>
  );
};

export default Header;