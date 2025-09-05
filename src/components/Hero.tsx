import React from 'react';

interface HeroProps {
  onStartDiagnosis: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStartDiagnosis }) => {
  const heroStyles = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '2rem',
    color: 'white',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  const overlayStyles = {
    content: '',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
  };

  const containerStyles = {
    maxWidth: '800px',
    width: '100%',
    position: 'relative' as const,
    zIndex: 1,
  };

  const contentStyles = {
    textAlign: 'center' as const,
  };

  const titleStyles = {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 800,
    lineHeight: 1.2,
    margin: '0 0 2rem 0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  };

  const highlightStyles = {
    background: 'linear-gradient(45deg, #ffd700, #ffaa00)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const descriptionStyles = {
    fontSize: '1.5rem',
    lineHeight: 1.6,
    margin: '0 0 3rem 0',
    opacity: 0.9,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const buttonStyles = {
    background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
    border: 'none',
    borderRadius: '50px',
    padding: '1.5rem 3rem',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
    marginBottom: '3rem',
  };

  const indicatorsStyles = {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    gap: '2rem',
    flexWrap: 'wrap' as const,
  };

  const indicatorStyles = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '1rem 1.5rem',
    borderRadius: '25px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const iconStyles = {
    fontSize: '1.2rem',
  };

  const textStyles = {
    fontWeight: 500,
  };

  return (
    <div style={heroStyles}>
      <div style={overlayStyles} />
      <div style={containerStyles}>
        <div style={contentStyles}>
          <h1 style={titleStyles}>
            あなたの<span style={highlightStyles}>暗号資産適性</span>を診断
          </h1>
          
          <p style={descriptionStyles}>
            30秒の簡単な質問に答えるだけで、あなたに最適な暗号資産の始め方がわかります
          </p>
          
          <button 
            style={buttonStyles}
            onClick={onStartDiagnosis}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.3)';
            }}
          >
            無料で診断を開始する
          </button>
          
          <div style={indicatorsStyles}>
            <div style={indicatorStyles}>
              <span style={iconStyles}>✨</span>
              <span style={textStyles}>5万人以上が診断</span>
            </div>
            <div style={indicatorStyles}>
              <span style={iconStyles}>⚡</span>
              <span style={textStyles}>30秒で完了</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;