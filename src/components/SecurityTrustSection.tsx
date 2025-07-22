

import React from 'react';
import { SecurityFeature } from '../../types'; // Assuming SecurityFeature might be enhanced later

// Data moved internal as it's specific to this presentation style
const securityData = [
  { 
    iconClass: 'fas fa-lock', 
    title: 'SSL暗号化', 
    description: '最高水準のセキュリティでお客様の情報を保護',
  },
  { 
    iconClass: 'fas fa-university', 
    title: '金融庁登録', 
    description: '関東財務局長（金商）登録済み',
  },
  { 
    iconClass: 'fas fa-certificate', 
    title: 'プライバシーマーク', 
    description: '個人情報保護の第三者認証取得',
  },
  { 
    iconClass: 'fas fa-comment-slash', // Changed from fa-ban for relevance
    title: '営業電話なし', 
    description: 'お客様からのご依頼がない限り連絡いたしません',
  },
];

const SecurityTrustSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <style>{`
          .luxury-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
            border-radius: 1.5rem;
            padding: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .security-badge-icon-container {
            width: 4rem;
            height: 4rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem auto;
            font-size: 1.5rem;
            color: #3b82f6;
            transition: all 0.3s ease;
          }
          
          .security-badge-icon-container:hover {
            transform: scale(1.1);
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
          }
          
          @media (max-width: 768px) {
            .luxury-card {
              padding: 1.5rem;
            }
            
            .security-badge-icon-container {
              width: 3rem;
              height: 3rem;
              font-size: 1.25rem;
            }
          }
          
          @media (max-width: 480px) {
            .luxury-card {
              padding: 1.25rem;
            }
            
            .security-badge-icon-container {
              width: 2.5rem;
              height: 2.5rem;
              font-size: 1rem;
            }
          }
        `}</style>
        <div className="luxury-card">
          <h3 className="text-2xl md:text-3xl lg:text-4xl text-center mb-12 font-bold leading-tight" style={{ color: '#1e40af' }}>
            <i className="fas fa-shield-alt mr-3" style={{ color: '#3b82f6' }}></i>
            安心・安全への取り組み
          </h3>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 text-center">
            {securityData.map(item => (
              <div key={item.title} className="p-4 flex flex-col items-center">
                <div className="security-badge-icon-container" aria-hidden="true">
                  <i className={item.iconClass}></i>
                </div>
                <div className="security-badge mb-3" style={{ color: '#1e40af', fontWeight: 'bold' }}>{item.title}</div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityTrustSection;