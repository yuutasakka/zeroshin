import React, { useState, useEffect } from 'react';
import { HeaderData, defaultHeaderData } from '../data/homepageContentData';

import { secureLog } from '../security.config';
import { createSupabaseClient } from './adminUtils';

const Header: React.FC = () => {
  const [headerData, setHeaderData] = useState<HeaderData>(defaultHeaderData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadHeaderFromSupabase();
  }, []);

  const loadHeaderFromSupabase = async () => {
    try {
      // まずローカルストレージを確認
      const localHeaderData = localStorage.getItem('customHeaderData');
      if (localHeaderData) {
        try {
          const parsedLocal = JSON.parse(localHeaderData);
          setHeaderData(parsedLocal);
          secureLog('ローカルストレージからヘッダーデータを読み込み');
          return;
        } catch (parseError) {
          secureLog('ローカルストレージのヘッダーデータ解析エラー:', parseError);
        }
      }

      const supabaseConfig = createSupabaseClient();
      
      // 本番環境でSupabase設定がない場合はデフォルトデータを使用
      if (!supabaseConfig.url || !supabaseConfig.key) {
        secureLog('⚠️ Header: Supabase設定なし：デフォルトデータを使用');
        return;
      }

      // Supabaseから取得を試行
      const response = await fetch(`${supabaseConfig.url}/rest/v1/homepage_content_settings?setting_key.eq=${encodeURIComponent('header_data')}&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].setting_data) {
          const headerDataFromSupabase = data[0].setting_data;
          setHeaderData(headerDataFromSupabase);
          // Supabaseデータをローカルストレージにバックアップ
          localStorage.setItem('customHeaderData', JSON.stringify(headerDataFromSupabase));
          secureLog('✅ ヘッダーデータをSupabaseから読み込み、ローカルにバックアップ');
          return;
        }
      } else {
        secureLog(`ヘッダーデータの読み込みに失敗 ${response.status}、デフォルトデータを使用`);
      }

      // サンプルデータフォールバック
      const sampleHeaderData = localStorage.getItem('header_data');
      if (sampleHeaderData) {
        try {
          const parsedSample = JSON.parse(sampleHeaderData);
          setHeaderData(parsedSample);
          secureLog('サンプルヘッダーデータを使用');
          return;
        } catch (parseError) {
          secureLog('サンプルヘッダーデータ解析エラー:', parseError);
        }
      }

      secureLog('デフォルトヘッダーデータを使用');
    } catch (error) {
      secureLog('ヘッダーデータ読み込みエラー、フォールバック処理中:', error);
      
      // エラー時でもローカルストレージを確認
      try {
        const fallbackHeaderData = localStorage.getItem('customHeaderData');
        if (fallbackHeaderData) {
          const parsedFallback = JSON.parse(fallbackHeaderData);
          setHeaderData(parsedFallback);
          secureLog('エラー時フォールバック: ローカルストレージからヘッダーデータを読み込み');
          return;
        }
      } catch (fallbackError) {
        secureLog('フォールバックヘッダーデータエラー:', fallbackError);
      }

      // 最終的にはデフォルトデータを使用（エラーを表示しない）
      secureLog('最終フォールバック: デフォルトヘッダーデータを使用');
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
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#top" onClick={scrollToTop} className="flex items-center space-x-2 md:space-x-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-md">
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center" 
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                aria-hidden="true"
              >
                <i className="fas fa-coins text-white text-lg md:text-xl"></i>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{color: '#1e40af'}}>{headerData.title}</h1>
            </a>
            
            {/* デスクトップナビゲーション */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#main-visual-section" onClick={(e) => scrollToSection(e, 'main-visual-section')} className="text-sm md:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium">サービス概要</a>
              <a href="#reliability-section" onClick={(e) => scrollToSection(e, 'reliability-section')} className="text-sm md:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium">選ばれる理由</a>
              <a href="#cta-section" onClick={(e) => scrollToSection(e, 'cta-section')} className="text-sm md:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium">お問い合わせ</a>
            </nav>
            
            {/* モバイルメニューボタン */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="メニューを開く"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* サブタイトル（モバイル） */}
          <div className="sm:hidden px-3 py-2 text-center">
            <span className="text-xs" style={{color: '#374151'}}>
              <i className="fas fa-star mr-1" style={{color: '#3b82f6'}}></i>
              {headerData.subtitle}
            </span>
          </div>
        </div>
        
        {/* モバイルメニュー */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <nav className="bg-white border-t border-gray-200 px-4 py-2">
            <a 
              href="#main-visual-section" 
              onClick={(e) => {
                scrollToSection(e, 'main-visual-section');
                setIsMobileMenuOpen(false);
              }} 
              className="block py-3 px-4 text-base text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              サービス概要
            </a>
            <a 
              href="#reliability-section" 
              onClick={(e) => {
                scrollToSection(e, 'reliability-section');
                setIsMobileMenuOpen(false);
              }} 
              className="block py-3 px-4 text-base text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              選ばれる理由
            </a>
            <a 
              href="#cta-section" 
              onClick={(e) => {
                scrollToSection(e, 'cta-section');
                setIsMobileMenuOpen(false);
              }} 
              className="block py-3 px-4 text-base text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              お問い合わせ
            </a>
          </nav>
        </div>
      </header>
      
      {/* ヘッダー分のスペーサー */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default Header;