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
      background: 'linear-gradient(135deg, var(--ds-surface) 0%, var(--ds-surface-sunken) 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 'var(--ds-space-1000)'
    }}>
      {/* 背景パターン */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23172B4D' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }} />

      {/* 装飾的な円 */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(23, 43, 77, 0.05) 0%, transparent 70%)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 171, 0, 0.05) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div className="container hero-content" style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 var(--ds-space-200)',
        textAlign: 'center'
      }}>
        {/* メインコンテンツ */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: `all var(--ds-motion-duration-slow) var(--ds-motion-easing-decelerate)`
        }}>
          {/* バッジ */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--ds-space-100)',
            padding: 'var(--ds-space-100) var(--ds-space-200)',
            backgroundColor: 'var(--ds-text-highest)',
            borderRadius: 'var(--ds-border-radius-circle)',
            marginBottom: 'var(--ds-space-300)'
          }}>
            <span style={{
              display: 'inline-block',
              width: 'var(--ds-space-100)',
              height: 'var(--ds-space-100)',
              backgroundColor: 'var(--ds-text-inverse)',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            <AtlassianTypography 
              variant="body-small" 
              color="inverse" 
              weight="bold"
            >
              30秒で診断完了
            </AtlassianTypography>
          </div>

          {/* キャッチコピー */}
          <AtlassianTypography 
            variant="h800" 
            color="highest" 
            weight="bold" 
            as="h1"
            className="hero-title"
            testId="hero-title"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.2,
              marginBottom: 'var(--ds-space-300)',
              letterSpacing: '-0.02em',
              textAlign: 'center'
            }}
          >
            あなたの
            <span style={{
              color: 'var(--zs-color-budget-warrior)',
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
            color="high" 
            as="p"
            className="hero-subtitle readable-width"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              lineHeight: 1.6,
              marginBottom: 'var(--ds-space-400)',
              maxWidth: '600px',
              margin: `0 auto var(--ds-space-400)`,
              textAlign: 'center'
            }}
          >
            ムダ遣いを見つけて節約の神になろう！<br className="desktop-break" />
            個別アドバイスで理想の家計へ
          </AtlassianTypography>

          {/* 追加説明 */}
          <AtlassianTypography 
            variant="body" 
            color="medium" 
            as="p"
            style={{
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              lineHeight: 1.6,
              marginBottom: 'var(--ds-space-300)',
              textAlign: 'center'
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
              gap: 'var(--ds-space-300)',
              '@media (min-width: 1024px)': {
                flexDirection: 'row',
                gap: 'var(--ds-space-600)'
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
                padding: 'var(--ds-space-250) var(--ds-space-600)',
                animation: '2s ease 0s infinite normal none running pulse'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-150)' }}>
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
              gap: 'var(--ds-space-400)',
              marginTop: 'var(--ds-space-800)',
              flexWrap: 'wrap'
            }}
          >
            <div 
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ds-space-100)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2L12.5 7.5L18 8L14 12L15 18L10 15.5L5 18L6 12L2 8L7.5 7.5L10 2Z" fill="var(--zs-color-budget-warrior)" stroke="var(--zs-color-budget-warrior)" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <AtlassianTypography variant="body-small" color="high">
                5万人以上が診断
              </AtlassianTypography>
            </div>
            <div 
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ds-space-100)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z" stroke="var(--ds-text-highest)" strokeWidth="1.5"/>
                <path d="M7 10L9 12L13 8" stroke="var(--ds-text-highest)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <AtlassianTypography variant="body-small" color="high">
                完全無料・匿名OK
              </AtlassianTypography>
            </div>
            <div 
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ds-space-100)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2V10L14 14" stroke="var(--zs-color-zero-god)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="9" stroke="var(--zs-color-zero-god)" strokeWidth="1.5"/>
              </svg>
              <AtlassianTypography variant="body-small" color="high">
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
            <circle cx="150" cy="150" r="100" stroke="var(--ds-text-highest)" strokeWidth="2" strokeDasharray="5 5" opacity="0.3"/>
            <circle cx="150" cy="150" r="70" stroke="var(--zs-color-budget-warrior)" strokeWidth="2" strokeDasharray="5 5" opacity="0.3"/>
            <circle cx="150" cy="150" r="40" stroke="var(--zs-color-zero-god)" strokeWidth="2" strokeDasharray="5 5" opacity="0.3"/>
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