import React from 'react';

interface HeroProps {
  onStartDiagnosis: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStartDiagnosis }) => {
  return (
    <section style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50px',
          padding: '12px 24px',
          marginBottom: '2rem',
          fontSize: '14px',
          fontWeight: 600,
          color: 'white',
          animation: 'slideDown 0.8s ease-out'
        }}>
          <span style={{ fontSize: '16px' }}>✨</span>
          5万人以上が診断済み
        </div>

        {/* Main title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          margin: '0 0 1.5rem 0',
          color: 'white',
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.8s ease-out 0.2s both'
        }}>
          あなたの
          <span style={{
            background: 'linear-gradient(45deg, #ffd700, #ffaa00, #ff6b6b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
            animation: 'shimmer 3s ease-in-out infinite'
          }}>
            暗号資産適性
          </span>
          を診断
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          lineHeight: 1.6,
          margin: '0 0 3rem 0',
          color: 'rgba(255, 255, 255, 0.9)',
          maxWidth: '700px',
          marginLeft: 'auto',
          marginRight: 'auto',
          animation: 'slideUp 0.8s ease-out 0.4s both'
        }}>
          30秒の簡単な質問に答えるだけで、あなたに最適な暗号資産の始め方がわかります
        </p>

        {/* CTA Button */}
        <button 
          onClick={onStartDiagnosis}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 50%, #ff4757 100%)',
            border: 'none',
            borderRadius: '60px',
            padding: '20px 40px',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 10px 30px rgba(255, 107, 107, 0.4)',
            marginBottom: '3rem',
            position: 'relative',
            overflow: 'hidden',
            animation: 'slideUp 0.8s ease-out 0.6s both'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 107, 107, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 107, 0.4)';
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            無料で診断を開始する
          </span>
          {/* Button shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shine 3s infinite'
          }} />
        </button>

        {/* Feature indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(1rem, 4vw, 2.5rem)',
          flexWrap: 'wrap',
          animation: 'slideUp 0.8s ease-out 0.8s both'
        }}>
          {[
            { icon: '⚡', text: '30秒で完了' },
            { icon: '🔒', text: '完全無料' },
            { icon: '📊', text: '個別診断結果' }
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '25px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0%, 100% { background-position: -200% center; }
          50% { background-position: 200% center; }
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @media (max-width: 768px) {
          .hero-indicators {
            gap: 1rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;