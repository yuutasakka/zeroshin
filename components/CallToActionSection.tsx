import React from 'react';

const CallToActionSection: React.FC = () => {
  const scrollToDiagnosis = () => {
    const diagnosisSection = document.getElementById('diagnosis-form-section');
    if (diagnosisSection) {
      diagnosisSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="cta-section" className="py-20 px-4 text-center hero-section-premium">
      <div className="hero-content max-w-4xl mx-auto">
        <h3 
          className="heading-display text-5xl md:text-6xl mb-8 font-bold leading-tight"
          style={{
            color: '#f8fafc',
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.6)',
            letterSpacing: '0.02em'
          }}
        >
            あなたの理想的な未来を<br />
            <span style={{ 
              color: '#fbbf24', 
              fontWeight: '800',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.7)'
            }}>
              今日から始めませんか？
            </span>
        </h3>
        <p className="text-xl mb-12 text-gray-200 leading-relaxed">
            経験豊富なプロフェッショナルが、あなたの人生設計に合わせた<br />
            最適な資産運用プランを無料でご提案いたします。
        </p>
        
        <div className="space-y-6">
          <button
            type="button"
            onClick={scrollToDiagnosis}
            className="gold-accent-button premium-button text-xl px-12 py-4" // py-4 for larger button
          >
            <i className="fas fa-comments mr-3"></i>
            今すぐ無料相談を始める
          </button>
          
          <p className="text-sm text-gray-300">
            <i className="fas fa-phone mr-2"></i>
            お電話でのご相談：0120-XXX-XXX（平日9:00-18:00）
          </p>
        </div>
        
        <div 
          className="mt-12 p-8 rounded-2xl" 
          style={{ background: 'rgba(212, 175, 55, 0.1)', border: '2px solid var(--accent-gold)' }}
        >
            <h4 className="font-bold text-white mb-3 text-xl">
                <i className="fas fa-gift mr-2"></i>
                初回相談限定特典
            </h4>
            <p className="text-gray-200">
                投資戦略ガイドブック（通常価格2,980円）を無料プレゼント中
            </p>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;