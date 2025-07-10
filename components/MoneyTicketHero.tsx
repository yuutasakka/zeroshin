import React from 'react';
import FloatingHeartsBackground from './FloatingHeartsBackground';
import SparkleBackground from './SparkleBackground';

interface MoneyTicketHeroProps {
  onStartDiagnosis: () => void;
}

const MoneyTicketHero: React.FC<MoneyTicketHeroProps> = ({ onStartDiagnosis }) => {
  const heroStyles = {
    hero: {
      position: 'relative' as const,
      minHeight: '85vh', // iPhone対応: 高さを少し低くしてコンテンツが収まるように
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      paddingTop: '60px' // ヘッダー分のパディング
    },
    background: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #fef7f0 0%, #fdf2f8 25%, #fef7f0 50%, #fdf2f8 75%, #fef7f0 100%)',
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
      fontSize: '1.5rem', // iPhone対応: サイズを大幅に小さく
      fontWeight: 800,
      color: '#1e3a8a',
      margin: 0,
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
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
      fontSize: '1rem', // iPhone対応: サイズを大幅に小さく
      fontWeight: 600,
      color: '#d4af37',
      margin: 0,
      textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
    },
    buttonContainer: {
      margin: '1rem 0' // iPhone対応: マージンを小さく
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem', // iPhone対応: ギャップを小さく
      width: '250px', // iPhone対応: 幅を小さく
      height: '50px', // iPhone対応: 高さを小さく
      padding: '0 1.5rem', // iPhone対応: パディングを小さく
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      fontSize: '16px', // iPhone対応: フォントサイズを小さく
      fontWeight: 700,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
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
      {/* iPhone専用CSS */}
      <style>{`
        /* iPhone対応レスポンシブスタイル */
        @media (max-width: 430px) {
          .hero-title-text {
            font-size: 1.25rem !important;
            line-height: 1.3 !important;
          }
          .hero-subtitle-text {
            font-size: 0.9rem !important;
            line-height: 1.2 !important;
          }
          .hero-button {
            width: 220px !important;
            height: 45px !important;
            font-size: 14px !important;
          }
          .hero-feature-text {
            font-size: 0.75rem !important;
          }
          .hero-container {
            gap: 0.75rem !important;
          }
          .hero-content {
            padding: 0.5rem !important;
          }
          .hero-section {
            min-height: 90vh !important;
            padding-top: 40px !important;
          }
        }
        
        @media (max-width: 375px) {
          .hero-title-text {
            font-size: 1.1rem !important;
          }
          .hero-button {
            width: 200px !important;
            height: 42px !important;
            font-size: 13px !important;
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
            <h1 style={heroStyles.titleText} className="hero-title-text">あなたの未来の資産を診断！</h1>
          </div>
          
          {/* サブタイトル */}
          <div style={heroStyles.subtitle}>
            <span style={heroStyles.subtitleEmoji}>✨</span>
            <h2 style={heroStyles.subtitleText} className="hero-subtitle-text">5分で分かる！無料診断スタート</h2>
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

export default MoneyTicketHero; 