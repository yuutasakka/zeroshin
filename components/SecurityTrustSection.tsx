

import React from 'react';
import { SecurityFeature } from '../types'; // Assuming SecurityFeature might be enhanced later

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
    <section className="py-20 px-4" style={{background: 'var(--gradient-platinum)'}}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="luxury-card">
          <h3 className="heading-primary text-3xl text-center mb-12">
            <i className="fas fa-shield-alt mr-3" style={{ color: 'var(--accent-emerald)' }}></i>
            安心・安全への取り組み
          </h3>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 text-center">
            {securityData.map(item => (
              <div key={item.title} className="p-4 flex flex-col items-center">
                <div className="security-badge-icon-container" aria-hidden="true">
                  <i className={item.iconClass}></i>
                </div>
                <div className="security-badge mb-3">{item.title}</div>
                <p className="text-sm text-luxury">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityTrustSection;