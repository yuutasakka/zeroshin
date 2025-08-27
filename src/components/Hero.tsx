import React, { useEffect, useState } from 'react';
import '../styles/accessibility.css';
import '../styles/design-tokens.css';
import '../styles/responsive.css';
import AtlassianButton from './ui/AtlassianButton';
import AtlassianTypography from './ui/AtlassianTypography';

interface HeroProps {
  onStartDiagnosis: () => void;
  onNavigateToArticle?: () => void;
  onNavigateToCryptoAptitude?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStartDiagnosis, onNavigateToArticle, onNavigateToCryptoAptitude }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <article
      className="hero-section"
      aria-labelledby="hero-title"
      role="main"
      style={{
        minHeight: '80vh',
        background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: 'var(--spacing-20)',
        paddingBottom: 'var(--spacing-20)'
      }}>
      {/* 背景パターン */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E40AF' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 var(--spacing-4)'
      }}>
        {/* メインコンテンツ */}
        <div style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all var(--transition-slow) ease-out'
        }}>
          {/* 記事タイトル */}
          <AtlassianTypography 
            variant="h800" 
            weight="bold" 
            as="h1"
            className="hero-title"
            testId="hero-title"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.2,
              marginBottom: 'var(--spacing-8)',
              letterSpacing: '-0.02em',
              textAlign: 'left',
              color: 'var(--color-text-primary)'
            }}
          >
            あなたの
            <span style={{
              color: 'var(--color-accent)',
              display: 'inline-block'
            }}>
              “ムダ遣い度”
            </span>
            をチェック！
          </AtlassianTypography>

          {/* リード文 */}
          <AtlassianTypography 
            variant="h400" 
            as="p"
            style={{
              fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
              lineHeight: 1.5,
              marginBottom: 'var(--spacing-12)',
              textAlign: 'left',
              color: 'var(--color-text-secondary)',
              fontWeight: 500
            }}
          >
            ムダ遣いを発見して節約の神になろう！<br />
            30秒でできる簡単診断で、あなたの家計を最適化。
          </AtlassianTypography>

          {/* CTA セクション */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-8)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-12)'
          }}>
            <AtlassianTypography 
              variant="h300" 
              weight="bold"
              as="h3"
              style={{
                fontSize: '1.5rem',
                marginBottom: 'var(--spacing-4)',
                color: 'white'
              }}
            >
              🎁 30秒診断完了者限定特典
            </AtlassianTypography>
            
            <AtlassianTypography 
              variant="body" 
              as="p"
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.6,
                marginBottom: 'var(--spacing-6)',
                color: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              診断を完了すると、あなた専用の「節約攻略ガイド完全版」を無料プレゼント！<br />
              具体的な節約手法と家計最適化のノウハウを手に入れましょう。
            </AtlassianTypography>

            <AtlassianButton
              appearance="primary"
              onClick={onStartDiagnosis}
              className="btn-hero"
              aria-label="無料でムダ遣い診断を開始する"
              style={{
                minWidth: '280px',
                height: '64px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: 'white',
                color: 'var(--color-primary)',
                border: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <span style={{ fontSize: '20px' }}>🚀</span>
                無料診断を開始する
              </div>
            </AtlassianButton>
          </div>

          {/* 信頼性指標 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--spacing-8)',
            flexWrap: 'wrap',
            padding: 'var(--spacing-4)',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)'
            }}>
              <span style={{ fontSize: '16px' }}>✨</span>
              <AtlassianTypography variant="body-small" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                5万人以上が診断
              </AtlassianTypography>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)'
            }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <AtlassianTypography variant="body-small" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                完全無料・匿名OK
              </AtlassianTypography>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)'
            }}>
              <span style={{ fontSize: '16px' }}>⏱️</span>
              <AtlassianTypography variant="body-small" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                30秒で結果表示
              </AtlassianTypography>
            </div>
          </div>

          {/* 記事リンク（シンプル版） */}
          {onNavigateToArticle && (
            <div style={{
              marginTop: 'var(--spacing-6)',
              textAlign: 'center'
            }}>
              <button
                onClick={onNavigateToArticle}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 'var(--spacing-2)',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  opacity: 0.8
                }}
              >
                📖 節約のコツを詳しく知りたい方はこちら
              </button>
            </div>
          )}

          {/* 暗号資産診断リンク */}
          {onNavigateToCryptoAptitude && (
            <div style={{
              marginTop: 'var(--spacing-4)',
              textAlign: 'center'
            }}>
              <button
                onClick={onNavigateToCryptoAptitude}
                style={{
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  border: 'none',
                  padding: 'var(--spacing-3) var(--spacing-6)',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '14px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(31, 41, 55, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(31, 41, 55, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 41, 55, 0.15)';
                }}
              >
                🪙 暗号資産トレード適性診断も試してみる
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @media (max-width: 768px) {
          .mobile-only {
            display: block;
          }
        }

        @media (min-width: 769px) {
          .mobile-only {
            display: none;
          }
        }
      `}</style>
    </article>
  );
};

export default Hero;