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
    <section id="cta-section" className="py-16 px-4 text-center bg-white">
      <div className="max-w-4xl mx-auto">
        <h3 
          className="text-2xl md:text-4xl lg:text-5xl mb-6 font-bold leading-tight"
          style={{
            color: '#1e40af',
            letterSpacing: '0.02em'
          }}
        >
            あなたの理想的な未来を<br />
            <span style={{ 
              color: '#3b82f6', 
              fontWeight: '800'
            }}>
              今日から始めませんか？
            </span>
        </h3>
        <p className="text-lg md:text-xl mb-8 text-gray-600 leading-relaxed">
            経験豊富なプロフェッショナルが、あなたの人生設計に合わせた<br />
            最適な資産運用プランを無料でご提案いたします。
        </p>
        
        <div className="space-y-6">
          <button
            type="button"
            onClick={handleCTAButtonClick}
            className={`bg-gradient-to-r hover:opacity-90 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg`}
            style={{
              backgroundColor: ctaButtonConfig.button_style.bg_color,
              color: ctaButtonConfig.button_style.text_color
            }}
          >
            <i className="fas fa-rocket mr-3"></i>
            {ctaButtonConfig.button_text}
          </button>
          
          <p className="text-sm text-gray-500">
            <i className="fas fa-phone mr-2"></i>
            お電話でのご相談：{ctaButtonConfig.phone_number || '0120-XXX-XXX'}（平日 9:00-18:00）
          </p>
        </div>
        
        <div 
          className="mt-10 p-6 md:p-8 rounded-2xl border-2 border-blue-200"
          style={{ 
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
          }}
        >
            <h4 className="font-bold text-blue-800 mb-3 text-lg md:text-xl">
                <i className="fas fa-gift mr-2"></i>
                {consultationOffer.title}
            </h4>
            <p className="text-blue-700">
                {consultationOffer.description}
            </p>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;