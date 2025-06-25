import React from 'react';

interface FooterProps {
  onNavigateToAdminLogin: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToAdminLogin }) => {
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
                    <a href="#privacy" className="footer-link">プライバシーポリシー</a>
                    <a href="#terms" className="footer-link">利用規約</a>
                    <a href="#scta" className="footer-link">特定商取引法</a>
                    <a href="#company" className="footer-link">会社概要</a>
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