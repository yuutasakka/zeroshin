import React, { useState, useEffect } from 'react';
import { Testimonial } from '../../types';
import { defaultTestimonialsData } from '../../data/testimonialsData';
import { defaultReasonsToChooseData } from '../../data/homepageContentData';
import { secureLog } from '../../security.config';
import { createSupabaseClient } from './adminUtils';
import { useReasonsToChoose, useDesignTemplate } from '../../src/contexts/DesignSettingsContext';

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

const ReliabilitySection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const reasonsDataFromContext = useReasonsToChoose();
  const originalReasonsData = reasonsDataFromContext || defaultReasonsToChooseData;
  
  // fas fa-usersアイコンを持つ項目を除外
  const reasonsData = {
    ...originalReasonsData,
    reasons: originalReasonsData.reasons.filter(reason => reason.iconClass !== 'fas fa-users')
  };
  const { templateConfig } = useDesignTemplate();

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const supabaseTestimonials = await loadTestimonialsFromSupabase();
        if (supabaseTestimonials && supabaseTestimonials.length > 0) {
          setTestimonials(supabaseTestimonials);
        } else {
          // セッションストレージからデータを取得
          const sampleTestimonials = sessionStorage.getItem('testimonials');
          if (sampleTestimonials) {
            const parsedSampleTestimonials = JSON.parse(sampleTestimonials);
            setTestimonials(parsedSampleTestimonials);
          } else {
            const storedTestimonials = sessionStorage.getItem('customTestimonials');
            if (storedTestimonials) {
              const parsedTestimonials = JSON.parse(storedTestimonials);
              setTestimonials(parsedTestimonials);
            } else {
              setTestimonials(defaultTestimonialsData);
            }
          }
        }
      } catch (error) {
        secureLog('お客様の声の読み込みエラー、デフォルトデータを使用:', error);
        setTestimonials(defaultTestimonialsData);
      }
    };

    loadTestimonials();
  }, []);

  const loadTestimonialsFromSupabase = async () => {
    try {
      const config = createSupabaseClient();
      
      // Supabase設定が無効な場合はエラーを投げる
      if (!config.url || !config.key || config.url.includes('your-project') || config.key.includes('your-anon-key')) {
        secureLog('Supabase設定が無効です。ローカルストレージを使用します。');
        return null;
      }

      // まずSupabaseから取得を試行
      try {
        const supabase = createSupabaseHelper();
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'testimonials')
          .single();

        if (!error && data?.setting_value) {
          secureLog('Supabaseからお客様の声を正常取得');
          return data.setting_value;
        } else if (error) {
          secureLog('Supabaseエラー（テーブル未作成の可能性）:', error);
        }
      } catch (supabaseError) {
        secureLog('Supabaseアクセスエラー:', supabaseError);
      }

      // Supabaseから取得できない場合はローカルストレージを確認
      secureLog('ローカルストレージからお客様の声を取得を試行');
      
      // 1. 管理画面で保存されたカスタムデータ
      const customTestimonials = sessionStorage.getItem('customTestimonials');
      if (customTestimonials) {
        try {
          const parsedCustom = JSON.parse(customTestimonials);
          if (parsedCustom && parsedCustom.length > 0) {
            secureLog('カスタムお客様の声をローカルストレージから取得');
            return parsedCustom;
          }
        } catch (parseError) {
          secureLog('カスタムお客様の声の解析エラー:', parseError);
        }
      }

      // 2. サンプルデータ
      const sampleTestimonials = sessionStorage.getItem('testimonials');
      if (sampleTestimonials) {
        try {
          const parsedSample = JSON.parse(sampleTestimonials);
          if (parsedSample && parsedSample.length > 0) {
            secureLog('サンプルお客様の声をローカルストレージから取得');
            return parsedSample;
          }
        } catch (parseError) {
          secureLog('サンプルお客様の声の解析エラー:', parseError);
        }
      }

      secureLog('ローカルストレージにもデータがありません。デフォルトデータを使用します。');
      return null;
    } catch (error) {
      secureLog('お客様の声Supabase読み込みエラー:', error);
      
      // エラー時でもローカルストレージから取得を試行
      try {
        const customTestimonials = sessionStorage.getItem('customTestimonials');
        if (customTestimonials) {
          const parsedCustom = JSON.parse(customTestimonials);
          if (parsedCustom && parsedCustom.length > 0) {
            secureLog('エラー時フォールバック: カスタムお客様の声を取得');
            return parsedCustom;
          }
        }
      } catch (fallbackError) {
        secureLog('フォールバック取得エラー:', fallbackError);
      }

      return null;
    }
  };

  return (
    <section id="reliability-section" className="py-16 md:py-20 px-4 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <style>{`
          .stats-card {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #e0e7ff;
            border-radius: 1rem;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          
          .stats-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }
          
          .stats-number {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1e40af;
            margin-bottom: 0.5rem;
          }
          
          .testimonial-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          
          .testimonial-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
          }
          
          @media (max-width: 768px) {
            .stats-card {
              padding: 1.5rem;
            }
            
            .stats-number {
              font-size: 2rem;
            }
            
            .testimonial-card {
              padding: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .stats-card {
              padding: 1.25rem;
            }
            
            .stats-number {
              font-size: 1.75rem;
            }
          }
        `}</style>
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl lg:text-5xl mb-6 font-bold leading-tight" style={{ color: '#1e40af' }}>
            {reasonsData.title}
          </h3>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {reasonsData.subtitle}
          </p>
        </div>
        
        <div className={`${templateConfig?.styles.sections.layout === 'list' ? 'space-y-8' : templateConfig?.styles.sections.layout === 'timeline' ? 'relative timeline-container' : 'grid md:grid-cols-3 gap-8'} mb-16`}>
          {reasonsData.reasons.map((reason, index) => (
            <div key={reason.title} className={`stats-card ${templateConfig?.styles.sections.layout === 'timeline' ? 'timeline-item' : ''}`} style={{ animationDelay: reason.animationDelay }}>
              <div className="stats-number">{reason.value}</div>
              <h4 className="text-xl font-semibold mb-2" style={{ color: '#1e40af'}}>{reason.title}</h4>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mb-16">
          <h4 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: '#1e40af' }}>お客様の声</h4>
          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map(testimonial => (
                <div key={testimonial.id} className="testimonial-card">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4 text-xl"
                      style={{ background: '#eff6ff', color: '#3b82f6'}}
                      aria-hidden="true"
                    >
                      {testimonial.avatarEmoji}
                    </div>
                    <div>
                      <p className="font-semibold" style={{color: '#1e40af'}}>
                        {testimonial.nameAndRole}
                      </p>
                      <div style={{color: '#3b82f6'}}>
                        {'★'.repeat(testimonial.ratingStars || 5)}{'☆'.repeat(5 - (testimonial.ratingStars || 5))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">{testimonial.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-gray-50 p-6 rounded-lg">現在、お客様の声は登録されていません。</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReliabilitySection;