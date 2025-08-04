import React, { useEffect, useState } from 'react';
import AtlassianButton from './ui/AtlassianButton';
import AtlassianTypography from './ui/AtlassianTypography';
import '../styles/design-tokens.css';
import '../styles/accessibility.css';
import '../styles/responsive.css';

interface HeroProps {
  onStartDiagnosis: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStartDiagnosis }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section
      className="hero-section"
      aria-labelledby="hero-title"
      role="banner"
      style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 'var(--spacing-20)'
    }}>
      {/* 背景パターン */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E40AF' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.4
      }} />

      {/* 装飾的な円 */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30, 64, 175, 0.08) 0%, transparent 70%)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div className="container hero-content" style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 var(--spacing-4)',
        textAlign: 'center'
      }}>
        {/* メインコンテンツ */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all var(--transition-slow) ease-out'
        }}>
          {/* バッジ */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2) var(--spacing-4)',
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--spacing-6)'
          }}>
            <span style={{
              display: 'inline-block',
              width: 'var(--spacing-2)',
              height: 'var(--spacing-2)',
              backgroundColor: 'var(--color-text-inverse)',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            <AtlassianTypography 
              variant="body-small" 
              style={{ color: 'var(--color-text-inverse)' }} 
              weight="bold"
            >
              30秒で診断完了
            </AtlassianTypography>
          </div>

          {/* キャッチコピー */}
          <AtlassianTypography 
            variant="h800" 
            weight="bold" 
            as="h1"
            className="hero-title"
            testId="hero-title"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.2,
              marginBottom: 'var(--spacing-6)',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              color: 'var(--color-text-primary)'
            }}
          >
            あなたの
            <span style={{
              color: 'var(--color-accent)',
              display: 'inline-block',
              animation: 'highlight 2s ease-in-out infinite'
            }}>
              "ムダ遣い度"
            </span>
            <br />
            をチェック！
          </AtlassianTypography>

          {/* サブテキスト */}
          <AtlassianTypography 
            variant="h500" 
            as="p"
            className="hero-subtitle readable-width"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-8)',
              maxWidth: '600px',
              margin: `0 auto var(--spacing-8)`,
              textAlign: 'center',
              color: 'var(--color-text-secondary)'
            }}
          >
            ムダ遣いを見つけて節約の神になろう！<br className="desktop-break" />
            個別アドバイスで理想の家計へ
          </AtlassianTypography>

          {/* 追加説明 */}
          <AtlassianTypography 
            variant="body" 
            as="p"
            style={{
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-6)',
              textAlign: 'center',
              color: 'var(--color-text-tertiary)'
            }}
          >
            診断で"自分のムダ遣いパターン"を理解すれば、<br />
            効率的に節約できて貯金が増える！
          </AtlassianTypography>

          {/* CTA セクション */}
          <div 
            className="hero-buttons"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-6)',
              '@media (min-width: 1024px)': {
                flexDirection: 'row',
                gap: 'var(--spacing-12)'
              }
            }}
          >
            <AtlassianButton
              appearance="danger"
              onClick={onStartDiagnosis}
              className="btn-hero"
              aria-label="30秒診断完了者限定特典付きで無料診断を開始"
              style={{
                minWidth: '280px',
                height: '64px',
                fontSize: '18px',
                padding: 'var(--spacing-4) var(--spacing-8)',
                animation: '2s ease 0s infinite normal none running pulse'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: 1.2 }}>30秒診断完了者限定！</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', lineHeight: 1.2 }}>節約攻略ガイド完全版を無料プレゼント！</div>
                </div>
              </div>
            </AtlassianButton>
            
            <AtlassianButton
              appearance="primary"
              onClick={onStartDiagnosis}
              className="btn-hero"
              aria-label="無料でムダ遣い診断を開始する"
              iconAfter={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M7 5L12 10L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              style={{
                minWidth: '280px',
                height: '64px',
                fontSize: '18px'
              }}
            >
              無料診断を開始する
            </AtlassianButton>
          </div>

          {/* 信頼性指標 */}
          <div 
            className="trust-indicators"
            role="list"
            aria-label="サービスの信頼性指標"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--spacing-8)',
              marginTop: 'var(--spacing-16)',
              flexWrap: 'wrap'
            }}
          >
            <div 
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2L12.5 7.5L18 8L14 12L15 18L10 15.5L5 18L6 12L2 8L7.5 7.5L10 2Z" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <AtlassianTypography variant="body-small" style={{ color: 'var(--color-text-primary)' }}>
                5万人以上が診断
              </AtlassianTypography>
            </div>
            <div 
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z" stroke="var(--color-primary)" strokeWidth="1.5"/>
                <path d="M7 10L9 12L13 8" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <AtlassianTypography variant="body-small" style={{ color: 'var(--color-text-primary)' }}>
                完全無料・匿名OK
              </AtlassianTypography>
            </div>
            <div 
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2V10L14 14" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="9" stroke="var(--color-primary)" strokeWidth="1.5"/>
              </svg>
              <AtlassianTypography variant="body-small" style={{ color: 'var(--color-text-primary)' }}>
                30秒で結果表示
              </AtlassianTypography>
            </div>
          </div>
        </div>

        {/* 戦闘力イラスト */}
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '10%',
          opacity: 0.1,
          pointerEvents: 'none'
        }}>
          <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
            <circle cx="150" cy="150" r="100" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeDasharray="5 5" opacity="0.3"/>
            <circle cx="150" cy="150" r="70" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="5 5" opacity="0.3"/>
            <circle cx="150" cy="150" r="40" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5 5" opacity="0.3"/>
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes highlight {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .btn-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          .mobile-only {
            display: block;
          }
          .desktop-break {
            display: none;
          }
        }

        @media (min-width: 769px) {
          .mobile-only {
            display: none;
          }
          .desktop-break {
            display: block;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;