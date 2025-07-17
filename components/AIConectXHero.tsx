import React, { useState, useEffect } from 'react';
import FloatingHeartsBackground from './FloatingHeartsBackground';
import SparkleBackground from './SparkleBackground';
import { defaultMainVisualData } from '../data/homepageContentData';

interface AIConectXHeroProps {
  onStartDiagnosis: () => void;
}

const AIConectXHero: React.FC<AIConectXHeroProps> = ({ onStartDiagnosis }) => {
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
      minHeight: '60vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      paddingTop: '40px',
      paddingBottom: '40px'
    },
    background: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f1ff 50%, #f0f4ff 100%)',
      zIndex: -1
    },
    content: {
      position: 'relative' as const,
      zIndex: 1,
      width: '100%',
      maxWidth: '800px',
      padding: '1rem' // iPhone対応: パディングを小さく
    },
    container: {
      textAlign: 'center' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '1rem' // iPhone対応: ギャップを小さく
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem', // iPhone対応: ギャップを小さく
      marginBottom: '0.5rem' // iPhone対応: マージンを小さく
    },
    titleEmoji: {
      fontSize: '2rem' // iPhone対応: サイズを小さく
    },
    titleText: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#1a1a1a',
      margin: 0,
      textShadow: '2px 2px 8px rgba(0,0,0,0.05)',
      lineHeight: 1.2
    },
    subtitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem', // iPhone対応: ギャップを小さく
      marginBottom: '1rem' // iPhone対応: マージンを小さく
    },
    subtitleEmoji: {
      fontSize: '1.2rem' // iPhone対応: サイズを小さく
    },
    subtitleText: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#f59e0b',
      margin: 0,
      textShadow: '1px 1px 3px rgba(0,0,0,0.05)'
    },
    buttonContainer: {
      margin: '1rem 0' // iPhone対応: マージンを小さく
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      width: '280px',
      height: '60px',
      padding: '0 2rem',
      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      fontSize: '18px',
      fontWeight: 700,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 6px 25px rgba(59, 130, 246, 0.35)',
      transform: 'translateY(0)'
    },
    features: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem', // iPhone対応: ギャップを小さく
      maxWidth: '400px', // iPhone対応: 最大幅を小さく
      margin: '0 auto'
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem', // iPhone対応: ギャップを小さく
      padding: '0.5rem 1rem', // iPhone対応: パディングを小さく
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '20px', // iPhone対応: 角丸を小さく
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // iPhone対応: シャドウを小さく
      backdropFilter: 'blur(10px)'
    },
    featureEmoji: {
      fontSize: '1rem' // iPhone対応: サイズを小さく
    },
    featureText: {
      fontSize: '0.85rem', // iPhone対応: フォントサイズを小さく
      fontWeight: 600,
      color: '#374151',
      fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'
    }
  };

  return (
    <>
      {/* スタイル定義 */}
      <style>{`
        /* ボタンホバーエフェクト */
        .hero-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.45) !important;
          background: linear-gradient(135deg, #2563eb 0%, #5b21b6 100%) !important;
        }
        
        .hero-button:active {
          transform: translateY(0) !important;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3) !important;
        }
        
        /* 特徴アイテムのホバーエフェクト */
        .hero-feature:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* タブレット対応 */
        @media (max-width: 1024px) {
          .hero-title-text {
            font-size: 2.2rem !important;
          }
          .hero-subtitle-text {
            font-size: 1.1rem !important;
          }
          .hero-button {
            width: 260px !important;
            height: 56px !important;
            font-size: 17px !important;
          }
        }
        
        /* スマートフォン対応 */
        @media (max-width: 768px) {
          .hero-section {
            min-height: 50vh !important;
            padding-top: 70px !important;
            padding-bottom: 30px !important;
          }
          .hero-title-text {
            font-size: 1.8rem !important;
            line-height: 1.3 !important;
          }
          .hero-subtitle-text {
            font-size: 1rem !important;
          }
          .hero-button {
            width: 240px !important;
            height: 52px !important;
            font-size: 16px !important;
          }
          .hero-feature-text {
            font-size: 0.85rem !important;
          }
        }
        
        /* 小型スマートフォン対応 */
        @media (max-width: 480px) {
          .hero-title-text {
            font-size: 1.5rem !important;
          }
          .hero-subtitle-text {
            font-size: 0.95rem !important;
          }
          .hero-button {
            width: 220px !important;
            height: 48px !important;
            font-size: 15px !important;
          }
          .hero-container {
            gap: 0.75rem !important;
          }
          .hero-content {
            padding: 0.75rem !important;
          }
        }
        
        /* 極小画面対応（iPhone SE等） */
        @media (max-width: 375px) {
          .hero-section {
            min-height: 45vh !important;
            padding-top: 60px !important;
          }
          .hero-title-text {
            font-size: 1.3rem !important;
          }
          .hero-subtitle-text {
            font-size: 0.9rem !important;
          }
          .hero-button {
            width: 200px !important;
            height: 44px !important;
            font-size: 14px !important;
          }
          .hero-feature-text {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
      
      <section style={heroStyles.hero} className="hero-section">
        {/* 背景アニメーション */}
        <div style={heroStyles.background}>
          <SparkleBackground />
          <FloatingHeartsBackground />
        </div>
        
        {/* メインコンテンツ */}
        <div style={heroStyles.content} className="hero-content">
          <div style={heroStyles.container} className="hero-container">
          
          {/* メインタイトル */}
          <div style={heroStyles.title}>
            <span style={heroStyles.titleEmoji}>💰</span>
            <h1 style={heroStyles.titleText} className="hero-title-text">{mainVisualData.title}</h1>
          </div>
          
          {/* サブタイトル */}
          <div style={heroStyles.subtitle}>
            <span style={heroStyles.subtitleEmoji}>✨</span>
            <h2 style={heroStyles.subtitleText} className="hero-subtitle-text">{mainVisualData.subtitle}</h2>
            <span style={heroStyles.subtitleEmoji}>✨</span>
          </div>
          
          {/* 診断開始ボタン */}
          <div style={heroStyles.buttonContainer}>
            <button 
              style={heroStyles.button}
              className="hero-button"
              onClick={onStartDiagnosis}
              aria-label="投資診断を開始する"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
              }}
            >
              <span style={heroStyles.featureEmoji}>📊</span>
              <span>診断を始める</span>
            </button>
          </div>
          
          {/* 安心・安全メッセージ */}
          <div style={heroStyles.features}>
            <div style={heroStyles.feature}>
              <span style={heroStyles.featureEmoji}>🔒</span>
              <span style={heroStyles.featureText} className="hero-feature-text">SMS認証で安心・安全</span>
            </div>
            <div style={heroStyles.feature}>
              <span style={heroStyles.featureEmoji}>🎯</span>
              <span style={heroStyles.featureText} className="hero-feature-text">14種類の投資商品から最適提案</span>
            </div>
            <div style={heroStyles.feature}>
              <span style={heroStyles.featureEmoji}>👨‍💼</span>
              <span style={heroStyles.featureText} className="hero-feature-text">専門家の紹介まで無料</span>
            </div>
          </div>
          
        </div>
      </div>

    </section>
    </>
  );
};

export default AIConectXHero; 