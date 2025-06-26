import React, { useState, useEffect } from 'react';
import { Testimonial } from '../types';
import { defaultTestimonialsData } from '../data/testimonialsData';
import { defaultReasonsToChooseData, ReasonsToChooseData } from '../data/homepageContentData';

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

const ReliabilitySection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [reasonsData, setReasonsData] = useState<ReasonsToChooseData>(defaultReasonsToChooseData);

  useEffect(() => {
    const loadContent = async () => {
      const supabase = createSupabaseClient();
      
      // 選ばれる理由データの読み込み
      try {
        const { data: reasonsResponse, error: reasonsError } = await supabase
          .from('homepage_content_settings')
          .select('setting_data')
          .eq('setting_key', 'reasons_to_choose')
          .single();

        if (!reasonsError && reasonsResponse?.setting_data) {
          setReasonsData(reasonsResponse.setting_data);
        } else {
          console.log('選ばれる理由のデータが見つからないため、デフォルトデータを使用します');
        }
      } catch (error) {
        console.warn('選ばれる理由の読み込みエラー、デフォルトデータを使用:', error);
      }

      // お客様の声データの読み込み（既存のロジック）
      try {
        const supabaseTestimonials = await loadTestimonialsFromSupabase();
        if (supabaseTestimonials && supabaseTestimonials.length > 0) {
          setTestimonials(supabaseTestimonials);
        } else {
          const storedTestimonials = localStorage.getItem('customTestimonials');
          if (storedTestimonials) {
            const parsedTestimonials = JSON.parse(storedTestimonials);
            setTestimonials(parsedTestimonials);
          } else {
            setTestimonials(defaultTestimonialsData);
          }
        }
      } catch (error) {
        console.warn('お客様の声の読み込みエラー、デフォルトデータを使用:', error);
        setTestimonials(defaultTestimonialsData);
      }
    };

    loadContent();
  }, []);

  const loadTestimonialsFromSupabase = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_data')
        .eq('setting_key', 'testimonials')
        .single();

      if (!error && data?.setting_data) {
        return data.setting_data;
      }
    } catch (error) {
      console.error('お客様の声Supabase読み込みエラー:', error);
    }
    return null;
  };

  return (
    <section id="reliability-section" className="py-20 px-4 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h3 className="heading-display text-4xl md:text-5xl mb-6">
            {reasonsData.title}
          </h3>
          <p className="text-xl text-luxury max-w-2xl mx-auto">
            {reasonsData.subtitle}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {reasonsData.reasons.map(reason => (
            <div key={reason.title} className="stats-card" style={{ animationDelay: reason.animationDelay }}>
              <div className="text-4xl mb-4" style={{ color: 'var(--accent-gold)'}} aria-hidden="true">
                <i className={reason.iconClass}></i>
              </div>
              <div className="stats-number">{reason.value}</div>
              <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary-navy)'}}>{reason.title}</h4>
              <p className="text-luxury">{reason.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mb-16">
          <h4 className="heading-primary text-3xl text-center mb-12">お客様の声</h4>
          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map(testimonial => (
                <div key={testimonial.id} className="testimonial-card">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4 text-xl"
                      style={{ background: 'var(--neutral-200)', color: 'var(--accent-gold)'}}
                      aria-hidden="true"
                    >
                      {testimonial.avatarEmoji.includes('👩') || testimonial.avatarEmoji.includes('女性') ? <i className="fas fa-female"></i> : 
                       testimonial.avatarEmoji.includes('👨') || testimonial.avatarEmoji.includes('男性') ? <i className="fas fa-male"></i> : 
                       <i className="fas fa-user"></i>}
                    </div>
                    <div>
                      <p className="font-semibold" style={{color: 'var(--primary-navy)'}}>{testimonial.nameAndRole}</p>
                      <div style={{color: 'var(--accent-gold)'}}>
                        {'★'.repeat(testimonial.ratingStars)}{'☆'.repeat(5 - testimonial.ratingStars)}
                      </div>
                    </div>
                  </div>
                  <p className="text-luxury">{testimonial.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-luxury bg-var(--neutral-100) p-6 rounded-lg">現在、お客様の声は登録されていません。</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReliabilitySection;