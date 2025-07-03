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
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
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
      padding: '2rem'
    },
    container: {
      textAlign: 'center' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '2rem'
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    },
    titleEmoji: {
      fontSize: '3rem'
    },
    titleText: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#1e3a8a',
      margin: 0,
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
    },
    subtitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '2rem'
    },
    subtitleEmoji: {
      fontSize: '2rem'
    },
    subtitleText: {
      fontSize: '1.8rem',
      fontWeight: 600,
      color: '#d4af37',
      margin: 0,
      textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
    },
    buttonContainer: {
      margin: '2rem 0'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      width: '300px',
      height: '60px',
      padding: '0 2rem',
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      fontSize: '18px',
      fontWeight: 700,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
    },
    features: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
      maxWidth: '500px',
      margin: '0 auto'
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1.5rem',
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '25px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)'
    },
    featureEmoji: {
      fontSize: '1.25rem'
    },
    featureText: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#374151',
      fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'
    }
  };

  return (
    <section style={heroStyles.hero}>
      {/* 背景アニメーション */}
      <div style={heroStyles.background}>
        <SparkleBackground />
        <FloatingHeartsBackground />
      </div>
      
      {/* メインコンテンツ */}
      <div style={heroStyles.content}>
        <div style={heroStyles.container}>
          
          {/* メインタイトル */}
          <div style={heroStyles.title}>
            <span style={heroStyles.titleEmoji}>💰</span>
            <h1 style={heroStyles.titleText}>あなたの未来の資産を診断！</h1>
          </div>
          
          {/* サブタイトル */}
          <div style={heroStyles.subtitle}>
            <span style={heroStyles.subtitleEmoji}>✨</span>
            <h2 style={heroStyles.subtitleText}>5分で分かる！無料診断スタート</h2>
            <span style={heroStyles.subtitleEmoji}>✨</span>
          </div>
          
          {/* 診断開始ボタン */}
          <div style={heroStyles.buttonContainer}>
            <button 
              style={heroStyles.button}
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
              <span style={heroStyles.featureText}>SMS認証で安心・安全</span>
            </div>
            <div style={heroStyles.feature}>
              <span style={heroStyles.featureEmoji}>🎯</span>
              <span style={heroStyles.featureText}>14種類の投資商品から最適提案</span>
            </div>
            <div style={heroStyles.feature}>
              <span style={heroStyles.featureEmoji}>👨‍💼</span>
              <span style={heroStyles.featureText}>専門家の紹介まで無料</span>
            </div>
          </div>
          
        </div>
      </div>

    </section>
  );
};

export default MoneyTicketHero; 