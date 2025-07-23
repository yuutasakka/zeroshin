import React, { useState, useEffect } from 'react';
// アニメーションコンポーネントは削除されました
import { defaultMainVisualData } from '../../data/homepageContentData';

interface AIConnectXHeroProps {
  onStartDiagnosis: () => void;
}

const AIConnectXHero: React.FC<AIConnectXHeroProps> = ({ onStartDiagnosis }) => {
  const [mainVisualData, setMainVisualData] = useState(defaultMainVisualData);

  useEffect(() => {
    // Supabaseから設定を読み込み
    const loadMainVisualSettings = async () => {
      try {
        const supabaseConfig = { 
          url: process.env.REACT_APP_SUPABASE_URL || '', 
          key: process.env.REACT_APP_SUPABASE_ANON_KEY || '' 
        };
        
        // Supabase設定を確認
        if (!supabaseConfig.url || !supabaseConfig.key || 
            supabaseConfig.url.includes('your-project') || 
            supabaseConfig.key.includes('your-anon-key')) {
          console.log('Supabase設定が無効、デフォルトメインビジュアルデータを使用');
          return;
        }

        // Supabaseからメインビジュアルデータを取得
        const response = await fetch(`${supabaseConfig.url}/rest/v1/homepage_content_settings?select=*&setting_key.eq.main_visual_data&is_active.eq.true&order=updated_at.desc&limit=1`, {
          headers: {
            'Authorization': `Bearer ${supabaseConfig.key}`,
            'apikey': supabaseConfig.key,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0 && data[0].content_data) {
            const mainVisualSettings = data[0].content_data;
            setMainVisualData(mainVisualSettings);
            console.log('メインビジュアル設定をSupabaseから読み込み:', mainVisualSettings);
            return;
          }
        } else if (response.status === 400) {
          console.log('Supabaseメインビジュアルテーブルが存在しません (400エラー) - デフォルトデータを使用');
        } else {
          console.log(`Supabaseメインビジュアル取得エラー: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Supabaseメインビジュアルフェッチエラー:', error);
      }
      
      // エラー時またはデータが空の場合はデフォルトデータを使用
      console.log('デフォルトメインビジュアルデータを使用');
    };

    loadMainVisualSettings();
  }, []);

  const heroStyles = {
    hero: {
      position: 'relative' as const,
      minHeight: '80vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #243b53 0%, #102a43 100%)'
    },
    content: {
      position: 'relative' as const,
      zIndex: 10,
      width: '100%',
      maxWidth: '1200px',
      padding: '2rem',
      textAlign: 'center' as const
    },
    titleContainer: {
      marginBottom: '3rem',
      animation: 'fadeIn 0.8s ease-out'
    },
    title: {
      fontSize: 'clamp(1.5rem, 3vw, 1.5rem)',
      fontWeight: 900,
      lineHeight: 1.2,
      marginBottom: '1rem',
      color: 'white'
    },
    subtitle: {
      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
      fontWeight: 400,
      color: '#d9e2ec',
      marginBottom: '2.5rem',
      lineHeight: 1.6,
      maxWidth: '600px',
      margin: '0 auto 2.5rem'
    },
    buttonContainer: {
      display: 'flex',
      gap: '1.5rem',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
      marginBottom: '4rem'
    },
    primaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '1.25rem 3.5rem',
      background: 'linear-gradient(135deg, #ff6b35 0%, #f35627 100%)',
      border: 'none',
      borderRadius: '9999px',
      color: 'white',
      fontSize: '1.125rem',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 10px 40px rgba(255, 107, 53, 0.3)',
      position: 'relative' as const,
      overflow: 'hidden',
      minWidth: '280px'
    },
    secondaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '1.25rem 3rem',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '9999px',
      color: 'white',
      fontSize: '1.125rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    },
    featureCard: {
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '1rem',
      transition: 'all 0.3s ease'
    },
    featureIcon: {
      width: '2.5rem',
      height: '2.5rem',
      marginBottom: '0.75rem',
      background: 'linear-gradient(135deg, #ff6b35 0%, #f35627 100%)',
      borderRadius: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    },
    featureTitle: {
      fontSize: '1rem',
      fontWeight: 700,
      color: 'white',
      marginBottom: '0.5rem'
    },
    featureDescription: {
      fontSize: '0.875rem',
      color: '#d9e2ec',
      lineHeight: 1.6
    }
  };

  return (
    <>
      {/* スタイル定義 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        .hero-section {
          position: relative;
        }

        .hero-primary-button {
          position: relative;
          overflow: hidden;
        }

        .hero-primary-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }

        .hero-primary-button:hover::before {
          left: 100%;
        }

        .hero-primary-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 50px rgba(255, 107, 53, 0.4);
          background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
        }

        .hero-secondary-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .hero-feature-card {
          position: relative;
          overflow: hidden;
        }

        .hero-feature-card::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
          border-radius: 1.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .hero-feature-card:hover::before {
          opacity: 1;
        }

        .hero-feature-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08);
        }

        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.5;
          animation: float 6s ease-in-out infinite;
        }

        .gradient-orb-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.2) 0%, transparent 70%);
          top: 10%;
          left: -5%;
          animation-delay: 0s;
        }

        .gradient-orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(36, 59, 83, 0.2) 0%, transparent 70%);
          bottom: 10%;
          right: -5%;
          animation-delay: 2s;
        }

        .gradient-orb-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(255, 140, 66, 0.2) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 4s;
        }

        @media (max-width: 768px) {
          .hero-section {
            min-height: 100vh;
          }
          .hero-primary-button,
          .hero-secondary-button {
            width: 100%;
            max-width: 300px;
          }
        }
      `}</style>
      
      <section style={heroStyles.hero} className="hero-section">
        {/* アニメーション背景 */}
        <div className="floating-orb gradient-orb-1"></div>
        <div className="floating-orb gradient-orb-2"></div>
        <div className="floating-orb gradient-orb-3"></div>
        
        {/* グリッド背景 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          zIndex: 1
        }}></div>
        
        {/* メインコンテンツ */}
        <div style={heroStyles.content}>
          <div style={heroStyles.titleContainer}>
            <h1 style={heroStyles.title}>
              {mainVisualData.title}
            </h1>
            <p style={heroStyles.subtitle}>
              {mainVisualData.subtitle}
            </p>
          </div>
          
          {/* CTAボタン */}
          <div style={heroStyles.buttonContainer}>
            <button 
              style={heroStyles.primaryButton}
              className="hero-primary-button"
              onClick={onStartDiagnosis}
              aria-label="投資診断を開始する"
            >
              <span>さあ診断を始めよう！</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              style={heroStyles.secondaryButton}
              className="hero-secondary-button"
              onClick={() => {
                const section = document.getElementById('features-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>サービスを詳しく見る</span>
            </button>
          </div>
          
          {/* 特徴カード */}
          <div style={heroStyles.features}>
            <div style={heroStyles.featureCard} className="hero-feature-card">
              <div style={heroStyles.featureIcon}>🔒</div>
              <h3 style={heroStyles.featureTitle}>信頼の実績</h3>
              <p style={heroStyles.featureDescription}>
                10,000人以上の診断実績で安心
              </p>
            </div>
            <div style={heroStyles.featureCard} className="hero-feature-card">
              <div style={heroStyles.featureIcon}>📊</div>
              <h3 style={heroStyles.featureTitle}>簡単３分診断</h3>
              <p style={heroStyles.featureDescription}>
                スマホで手軽に最適プランがわかる
              </p>
            </div>
            <div style={heroStyles.featureCard} className="hero-feature-card">
              <div style={heroStyles.featureIcon}>👥</div>
              <h3 style={heroStyles.featureTitle}>完全無料</h3>
              <p style={heroStyles.featureDescription}>
                診断から相談まで一切費用はかかりません
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AIConnectXHero; 