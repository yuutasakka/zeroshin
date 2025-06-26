import React, { useState, useEffect } from 'react';
import { LegalLink } from '../types';
import { FooterData, defaultFooterData } from '../data/homepageContentData';
import { secureLog } from '../security.config';
import { createSupabaseClient } from './adminUtils';

interface FooterProps {
  onNavigateToAdminLogin: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToAdminLogin }) => {
  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);
  const [footerData, setFooterData] = useState<FooterData>(defaultFooterData);

  useEffect(() => {
    loadFooterFromSupabase();
    loadLegalLinks();
  }, []);

  const loadFooterFromSupabase = async () => {
    try {
      const supabaseConfig = createSupabaseClient();
      const response = await fetch(`${supabaseConfig.url}/rest/v1/homepage_content_settings?setting_key=eq.footer_data&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].setting_data) {
          secureLog('✅ フッターデータをSupabaseから読み込み');
          setFooterData(data[0].setting_data);
        }
      } else {
        secureLog('フッターデータの読み込みに失敗、デフォルトデータを使用');
      }
    } catch (error) {
      secureLog('フッターデータ読み込みエラー、デフォルトデータを使用:', error);
    }
  };

  const loadLegalLinks = () => {
    try {
      const storedLinks = localStorage.getItem('customLegalLinks');
      if (storedLinks) {
        setLegalLinks(JSON.parse(storedLinks));
      } else {
        // デフォルトのリーガルリンク
        const defaultLinks: LegalLink[] = [
          { id: 1, link_type: 'privacy_policy', title: 'プライバシーポリシー', url: '#privacy', is_active: true, created_at: '', updated_at: '' },
          { id: 2, link_type: 'terms_of_service', title: '利用規約', url: '#terms', is_active: true, created_at: '', updated_at: '' },
          { id: 3, link_type: 'specified_commercial_transactions', title: '特定商取引法', url: '#scta', is_active: true, created_at: '', updated_at: '' },
          { id: 4, link_type: 'company_info', title: '会社概要', url: '#company', is_active: true, created_at: '', updated_at: '' }
        ];
        setLegalLinks(defaultLinks);
      }
    } catch (error) {
      secureLog('Error loading legal links:', error);
      // エラー時はデフォルトリンク使用
      const defaultLinks: LegalLink[] = [
        { id: 1, link_type: 'privacy_policy', title: 'プライバシーポリシー', url: '#privacy', is_active: true, created_at: '', updated_at: '' },
        { id: 2, link_type: 'terms_of_service', title: '利用規約', url: '#terms', is_active: true, created_at: '', updated_at: '' },
        { id: 3, link_type: 'specified_commercial_transactions', title: '特定商取引法', url: '#scta', is_active: true, created_at: '', updated_at: '' },
        { id: 4, link_type: 'company_info', title: '会社概要', url: '#company', is_active: true, created_at: '', updated_at: '' }
      ];
      setLegalLinks(defaultLinks);
    }
  };

  useEffect(() => {
    // ローカルストレージの変更を監視
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customLegalLinks') {
        loadLegalLinks();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  return (
    <footer className="premium-footer py-12 px-4">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-center mb-8">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-4" 
              style={{ background: 'var(--gradient-gold)' }}
              aria-hidden="true"
            >
                <i className="fas fa-coins text-white"></i>
            </div>
            <h5 className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>{footerData.siteName}</h5>
        </div>
        
        <div className="text-center space-y-4">
            <p className="text-gray-300">{footerData.description}</p>
            
            <div className="text-sm text-gray-400 space-y-2">
                <p>{footerData.companyInfo}</p>
                <p>{footerData.contactInfo}</p>
                <nav className="flex flex-wrap justify-center space-x-4 md:space-x-6 mt-6">
                    {legalLinks
                      .filter(link => link.is_active)
                      .map(link => (
                        <a 
                          key={link.id} 
                          href={link.url} 
                          className="footer-link"
                          target={link.url.startsWith('http') ? '_blank' : undefined}
                          rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {link.title}
                        </a>
                      ))
                    }
                    <a 
                      href="#admin" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        onNavigateToAdminLogin(); 
                      }} 
                      className="footer-link"
                    >
                      管理者ログイン
                    </a>
                </nav>
                <p className="mt-8 text-gray-500">&copy; {new Date().getFullYear()} {footerData.copyright}</p>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;