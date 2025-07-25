import React from 'react';
import { defaultFirstConsultationOffer, defaultCTAButtonConfig } from '../../data/homepageContentData';
import { useFirstConsultationOffer, useCTAButtonConfig } from '../../src/contexts/DesignSettingsContext';

const CallToActionSection: React.FC = () => {
  const consultationOfferFromContext = useFirstConsultationOffer();
  const ctaButtonConfigFromContext = useCTAButtonConfig();
  const consultationOffer = consultationOfferFromContext || defaultFirstConsultationOffer;
  const ctaButtonConfig = ctaButtonConfigFromContext || defaultCTAButtonConfig;

  const handleCTAButtonClick = () => {
    switch (ctaButtonConfig.button_type) {
      case 'scroll_to_diagnosis':
        const diagnosisSection = document.getElementById('diagnosis-form-section');
        if (diagnosisSection) {
          diagnosisSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'external_url':
        if (ctaButtonConfig.button_url) {
          window.open(ctaButtonConfig.button_url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'phone_call':
        if (ctaButtonConfig.phone_number) {
          window.location.href = `tel:${ctaButtonConfig.phone_number}`;
        }
        break;
      default:
        // フォールバック: 診断セクションにスクロール
        const fallbackSection = document.getElementById('diagnosis-form-section');
        if (fallbackSection) {
          fallbackSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  return (
    <section id="cta-section" className="py-16 px-4 text-center" style={{ background: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto">
        <h3 
          className="text-2xl md:text-4xl lg:text-5xl mb-6 font-bold leading-tight"
          style={{
            letterSpacing: '-0.02em',
            color: '#2C3E50'
          }}
        >
          急な資金ニーズ<br />
          <span style={{ color: '#F39C12' }}>今すぐ解決しませんか？</span>
        </h3>
        <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: '#34495E' }}>
            キャッシング・ファクタリングのプロが、あなたの収支状況や緊急度に合わせて<br />
            最適な資金調達プランを無料でご提案します。
        </p>
        
        <div className="space-y-6">
          <button
            type="button"
            onClick={handleCTAButtonClick}
            className="btn btn-gradient text-lg"
            style={{
              padding: '1rem 3rem',
              fontSize: '1.125rem',
              background: 'linear-gradient(135deg, #F39C12 0%, #D68910 100%)',
              minWidth: '280px'
            }}
          >
            {ctaButtonConfig.button_text}
          </button>
          
          <p className="text-sm" style={{ color: '#7F8C8D' }}>
            お電話でのご相談：{ctaButtonConfig.phone_number || '0120-XXX-XXX'}（平日 9:00-18:00）
          </p>
        </div>
        
        <div 
          className="mt-10 p-6 md:p-8 rounded-2xl"
          style={{ 
            background: '#F8FAFC',
            border: '1px solid #ECF0F1',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
            <h4 className="font-bold mb-3 text-lg md:text-xl" style={{ color: '#2C3E50' }}>
                {consultationOffer.title}
            </h4>
            <p style={{ color: '#34495E' }}>
                {consultationOffer.description}
            </p>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;