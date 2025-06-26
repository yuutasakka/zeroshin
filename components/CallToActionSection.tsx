import React, { useState, useEffect } from 'react';
import { defaultFirstConsultationOffer, FirstConsultationOffer } from '../data/homepageContentData';

const createSupabaseClient = () => {
  const SUPABASE_URL = 'https://xpjkmhnnrwwqcijrqmhv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwamttaG5ucnd3cWNpanJxbWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MjIzMzIsImV4cCI6MjA1MTM5ODMzMn0.7KXNTt8dn6Ps3jLRADgp7VdjU5LZDP0qhtx2xClqOy0';

  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            try {
              const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}&select=${columns}`, {
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json'
                }
              });
              const data = await response.json();
              return { data: data.length > 0 ? data[0] : null, error: null };
            } catch (error) {
              console.error('Supabase fetch error:', error);
              return { data: null, error };
            }
          }
        })
      })
    })
  };
};

const CallToActionSection: React.FC = () => {
  const [consultationOffer, setConsultationOffer] = useState<FirstConsultationOffer>(defaultFirstConsultationOffer);

  useEffect(() => {
    const loadConsultationOffer = async () => {
      const supabase = createSupabaseClient();
      
      try {
        const { data: offerResponse, error: offerError } = await supabase
          .from('homepage_content_settings')
          .select('setting_data')
          .eq('setting_key', 'first_consultation_offer')
          .single();

        if (!offerError && offerResponse?.setting_data) {
          setConsultationOffer(offerResponse.setting_data);
        } else {
          console.log('初回相談限定特典のデータが見つからないため、デフォルトデータを使用します');
        }
      } catch (error) {
        console.warn('初回相談限定特典の読み込みエラー、デフォルトデータを使用:', error);
      }
    };

    loadConsultationOffer();
  }, []);

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
            className="gold-accent-button premium-button text-xl px-12 py-4"
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
          style={{ 
            background: consultationOffer.backgroundColor, 
            border: `2px solid ${consultationOffer.borderColor}` 
          }}
        >
            <h4 className="font-bold text-white mb-3 text-xl">
                <i className={`${consultationOffer.icon} mr-2`}></i>
                {consultationOffer.title}
            </h4>
            <p className="text-gray-200">
                {consultationOffer.description}
            </p>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;