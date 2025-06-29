import React, { useState, useEffect } from 'react';
import { LegalLink } from '../types';
import { FooterData, defaultFooterData } from '../data/homepageContentData';
import { secureLog } from '../security.config';
import { createSupabaseClient } from './adminUtils';

// セキュリティ関数: URLの安全性を確認
const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '#';
  
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const urlLower = url.toLowerCase().trim();
  
  for (const protocol of dangerousProtocols) {
    if (urlLower.startsWith(protocol)) {
      console.warn('🚨 危険なURLプロトコルが検出されました:', url);
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
  const [footerData, setFooterData] = useState<FooterData>(defaultFooterData);

  useEffect(() => {
    loadFooterFromSupabase();
    loadLegalLinks();
  }, []);

  const loadFooterFromSupabase = async () => {
    try {
      // まずサンプルデータを確認
      const sampleFooterData = localStorage.getItem('homepage_content_footer_data');
      if (sampleFooterData) {
        const parsedFooterData = JSON.parse(sampleFooterData);
        setFooterData(parsedFooterData);
        secureLog('✅ フッターデータをサンプルデータから読み込み');
        return;
      }

      const supabaseConfig = createSupabaseClient();
      
      // 本番環境でSupabase設定がない場合はデフォルトデータを使用
      if (!supabaseConfig.url || !supabaseConfig.key) {
        secureLog('⚠️ Footer: Supabase設定なし：デフォルトデータを使用');
        return;
      }

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
      // エラーが発生してもデフォルトデータを使用するだけで、ユーザーにはエラーを表示しない
    }
  };

  const loadLegalLinks = () => {
    try {
      // まずサンプルデータを確認
      const sampleLegalLinks = localStorage.getItem('legal_links');
      if (sampleLegalLinks) {
        const parsedSampleLinks = JSON.parse(sampleLegalLinks);
        // サンプルデータを既存の形式に変換
        const convertedLinks = parsedSampleLinks.map((link: any, index: number) => ({
          id: index + 1,
          link_type: link.category || 'other',
          title: link.title,
          url: link.url,
          is_active: true,
          created_at: '',
          updated_at: ''
        }));
        setLegalLinks(convertedLinks);
        secureLog('✅ リーガルリンクをサンプルデータから読み込み');
        return;
      }

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
            <h5 className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
              {footerData.siteName || 'MoneyTicket'}
            </h5>
        </div>
        
        <div className="text-center space-y-4">
            <p className="footer-description">{footerData.description}</p>
            
            <div className="footer-info space-y-2">
                <p>{footerData.companyInfo}</p>
                <p>{footerData.contactInfo}</p>
                <nav className="flex flex-wrap justify-center space-x-4 md:space-x-6 mt-6">
                    {legalLinks
                      .filter(link => link.is_active)
                      .map(link => (
                        <a 
                          key={link.id} 
                          href={sanitizeUrl(link.url)} 
                          className="footer-link"
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
                      className="footer-link"
                    >
                      管理者ログイン
                    </a>
                </nav>
                <p className="mt-8 footer-copyright">{footerData.copyright || `© ${new Date().getFullYear()} MoneyTicket株式会社. All rights reserved.`}</p>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;