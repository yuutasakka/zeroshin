import React, { useState, useEffect } from 'react';
import { LegalLink } from '../types';

interface FooterProps {
  onNavigateToAdminLogin: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToAdminLogin }) => {
  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);

  useEffect(() => {
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
        console.error('Error loading legal links:', error);
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

    loadLegalLinks();
    
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
            <h5 className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>マネーチケット</h5>
        </div>
        
        <div className="text-center space-y-4">
            <p className="text-gray-300">お客様の豊かな未来を全力でサポートいたします</p>
            
            <div className="text-sm text-gray-400 space-y-2">
                <p>運営会社：株式会社◯◯◯ | 金融商品取引業者 関東財務局長（金商）第◯◯◯号</p>
                <p>〒XXX-XXXX 東京都○○区○○ X-X-X | TEL：0120-XXX-XXX</p>
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
                <p className="mt-8 text-gray-500">&copy; {new Date().getFullYear()} MoneyTicket. All rights reserved.</p>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;