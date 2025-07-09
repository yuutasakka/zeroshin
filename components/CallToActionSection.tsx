import React, { useState, useEffect } from 'react';
import { defaultFirstConsultationOffer, FirstConsultationOffer } from '../data/homepageContentData';
import { secureLog } from '../security.config';
import { createSupabaseClient } from './adminUtils';

const createSupabaseHelper = () => {
  const config = createSupabaseClient();
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            try {
              const response = await fetch(`${config.url}/rest/v1/${table}?${column}.eq=${value}&select=${columns}`, {
                headers: {
                  'apikey': config.key,
                  'Authorization': `Bearer ${config.key}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                secureLog(`Supabase request failed: ${response.status} ${response.statusText}`, errorData);
                return { data: null, error: { message: `HTTP ${response.status}: ${response.statusText}`, status: response.status } };
              }
              
              const data = await response.json();
              
              if (Array.isArray(data)) {
                if (data.length === 0) {
                  return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
                } else if (data.length === 1) {
                  return { data: data[0], error: null };
                } else {
                  return { data: null, error: { message: 'Multiple rows found', code: 'PGRST116' } };
                }
              } else {
                return { data: data, error: null };
              }
            } catch (error) {
              secureLog('Supabase fetch error:', error);
              return { data: null, error: { message: error instanceof Error ? error.message : 'Network error' } };
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
      try {
        // まずローカルストレージを確認
        const localConsultationOffer = localStorage.getItem('customFirstConsultationOffer');
        if (localConsultationOffer) {
          try {
            const parsedLocal = JSON.parse(localConsultationOffer);
            setConsultationOffer(parsedLocal);
            secureLog('ローカルストレージから初回相談限定特典データを読み込み');
            return;
          } catch (parseError) {
            secureLog('ローカルストレージの初回相談限定特典データ解析エラー:', parseError);
          }
        }

        const supabase = createSupabaseHelper();
        
        // Supabaseから取得を試行（エラーハンドリング強化）
        try {
          const { data: offerResponse, error: offerError } = await supabase
            .from('homepage_content_settings')
            .select('setting_data')
            .eq('setting_key', 'first_consultation_offer')
            .single();

          if (!offerError && offerResponse?.setting_data) {
            const consultationOfferFromSupabase = offerResponse.setting_data;
            setConsultationOffer(consultationOfferFromSupabase);
            // Supabaseデータをローカルストレージにバックアップ
            localStorage.setItem('customFirstConsultationOffer', JSON.stringify(consultationOfferFromSupabase));
            secureLog('Supabaseから初回相談限定特典データを読み込み、ローカルにバックアップ');
            return;
          } else {
            secureLog('初回相談限定特典のデータが見つからないため、デフォルトデータを使用:', offerError);
          }
        } catch (supabaseError) {
          secureLog('Supabase接続エラー（homepage_content_settings）:', supabaseError);
          // エラー時はデフォルトデータを使用
        }

        // サンプルデータフォールバック
        const sampleConsultationOffer = localStorage.getItem('first_consultation_offer');
        if (sampleConsultationOffer) {
          try {
            const parsedSample = JSON.parse(sampleConsultationOffer);
            setConsultationOffer(parsedSample);
            secureLog('サンプル初回相談限定特典データを使用');
            return;
          } catch (parseError) {
            secureLog('サンプル初回相談限定特典データ解析エラー:', parseError);
          }
        }

        secureLog('初回相談限定特典のデフォルトデータを使用');
      } catch (error) {
        secureLog('初回相談限定特典の読み込みエラー、フォールバック処理中:', error);
        
        // エラー時でもローカルストレージを確認
        try {
          const fallbackConsultationOffer = localStorage.getItem('customFirstConsultationOffer');
          if (fallbackConsultationOffer) {
            const parsedFallback = JSON.parse(fallbackConsultationOffer);
            setConsultationOffer(parsedFallback);
            secureLog('エラー時フォールバック: ローカルストレージから初回相談限定特典データを読み込み');
            return;
          }
        } catch (fallbackError) {
          secureLog('フォールバック初回相談限定特典データエラー:', fallbackError);
        }

        // 最終的にはデフォルトデータを使用
        secureLog('最終フォールバック: デフォルト初回相談限定特典データを使用');
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
            お電話でのご相談：0120-999-888（平日9:00-18:00）
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