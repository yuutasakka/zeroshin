import React from 'react';

const CallToActionSection: React.FC = () => {
  const handleScrollToDiagnosis = () => {
    const diagnosisSection = document.getElementById('diagnosis-form-section');
    if (diagnosisSection) {
      diagnosisSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="cta-section" className="py-12 px-4 text-center" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto">
        <h2 
          className="text-xl md:text-2xl mb-4 font-bold"
          style={{
            color: 'var(--color-text-primary)'
          }}
        >
          まだ診断していない方へ
        </h2>
        
        <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          あなたの無駄遣いパターンを把握して、効率的な節約を始めませんか？
        </p>
        
        <button
          type="button"
          onClick={handleScrollToDiagnosis}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <span style={{ fontSize: '18px' }}>📊</span>
          診断を開始する
        </button>
      </div>
    </section>
  );
};

export default CallToActionSection;