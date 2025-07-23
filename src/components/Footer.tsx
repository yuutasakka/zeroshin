import React, { useState, useEffect } from 'react';
import { LegalLink } from '../../types';
import { defaultFooterData } from '../../data/homepageContentData';
import { secureLog } from '../../security.config';
import { createSupabaseClient } from './adminUtils';
import { useFooterData } from '../../src/contexts/DesignSettingsContext';

// セキュリティ関数: URLの安全性を確認
const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '#';
  
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const urlLower = url.toLowerCase().trim();
  
  for (const protocol of dangerousProtocols) {
    if (urlLower.startsWith(protocol)) {
      return '#';
    }
  }
  
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#')) {
    return url;
  }
  
  return '#';
};

// セキュリティ関数: テキストのサニタイゼーション
const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
};

interface FooterProps {
  onNavigateToAdminLogin: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToAdminLogin }) => {
  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);
  const footerDataFromContext = useFooterData();
  const footerData = footerDataFromContext || defaultFooterData;

  useEffect(() => {
    loadLegalLinks();
  }, []);

  const loadLegalLinks = async () => {
    try {
      const supabaseConfig = createSupabaseClient();
      
      // Supabase設定を確認
      if (!supabaseConfig.url || !supabaseConfig.key || 
          supabaseConfig.url.includes('your-project') || 
          supabaseConfig.key.includes('your-anon-key')) {
        secureLog(' Footer: Supabase設定が無効：デフォルトリーガルリンクを使用');
        setDefaultLegalLinks();
        return;
      }

      // Supabaseからリーガルリンクデータを取得
      const response = await fetch(`${supabaseConfig.url}/rest/v1/legal_links?select=*&is_active.eq=true&order=id`, {
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const links = await response.json();
        if (links && links.length > 0) {
          setLegalLinks(links);
          secureLog(`Supabaseから${links.length}件のリーガルリンクを読み込み`);
          return;
        }
      } else if (response.status === 400) {
        secureLog('Supabaseリーガルリンクテーブルが存在しません (400エラー) - デフォルトリンクを使用');
      } else {
        secureLog(`Supabaseリーガルリンク取得エラー: ${response.status} ${response.statusText}`);
      }
      
      // エラーまたはデータなしの場合はデフォルトリンクを使用
      setDefaultLegalLinks();
    } catch (error) {
      secureLog('リーガルリンクフェッチエラー:', error);
      setDefaultLegalLinks();
    }
  };

  const setDefaultLegalLinks = () => {
    const defaultLinks: LegalLink[] = [
      { id: 1, link_type: 'privacy_policy', title: 'プライバシーポリシー', url: '#privacy', is_active: true, created_at: '', updated_at: '' },
      { id: 2, link_type: 'terms_of_service', title: '利用規約', url: '#terms', is_active: true, created_at: '', updated_at: '' },
      { id: 3, link_type: 'specified_commercial_transactions', title: '特定商取引法', url: '#scta', is_active: true, created_at: '', updated_at: '' },
      { id: 4, link_type: 'company_info', title: '会社概要', url: '#company', is_active: true, created_at: '', updated_at: '' }
    ];
    setLegalLinks(defaultLinks);
  };

  return (
    <footer 
      id="footer"
      className="bg-white py-12 px-4 border-t border-gray-200"
      style={{
        backgroundColor: '#ffffff',
        paddingTop: '3rem',
        paddingBottom: '3rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
        borderTopStyle: 'solid'
      }}
      role="contentinfo"
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-center mb-8">
            <h5 className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-800">
              {footerData.siteName || 'AI ConnectX'}
            </h5>
        </div>
        
        <div className="text-center space-y-4">
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{footerData.description}</p>
            
            <div className="space-y-3">
                <p className="text-sm sm:text-base md:text-lg text-gray-700 font-medium">{footerData.companyInfo}</p>
                <p className="text-sm sm:text-base md:text-lg text-gray-700">{footerData.contactInfo}</p>
                <nav className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 mt-6">
                    {legalLinks
                      .filter(link => link.is_active)
                      .map(link => (
                        <a 
                          key={link.id} 
                          href={sanitizeUrl(link.url)} 
                          className="text-xs sm:text-sm md:text-base text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline px-1"
                          target={link.url.startsWith('http') ? '_blank' : undefined}
                          rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {sanitizeText(link.title)}
                        </a>
                      ))
                    }
                    <a 
                      href="#admin" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        onNavigateToAdminLogin(); 
                      }} 
                      className="text-xs sm:text-sm md:text-base text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline px-1"
                    >
                      管理者ログイン
                    </a>
                </nav>
                <p className="mt-8 text-xs sm:text-sm md:text-base text-gray-500">{footerData.copyright || `© ${new Date().getFullYear()} AI ConnectX株式会社. All rights reserved.`}</p>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;