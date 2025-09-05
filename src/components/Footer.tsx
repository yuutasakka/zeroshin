import React from 'react';

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: 'var(--color-bg-secondary)',
      color: 'var(--color-text-primary)',
      padding: '60px 20px 40px',
      marginTop: '80px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* ロゴとサービス名 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* ロゴアイコン */}
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--color-primary)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 2L2 7V12C2 16.5 4.5 20.5 12 22C19.5 20.5 22 16.5 22 12V7L12 2Z" 
                  stroke="#FFFFFF" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M9 12L11 14L15 10" 
                  stroke="#FFFFFF" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              margin: 0
            }}>
              Zero神
            </h3>
          </div>
          <p style={{
            fontSize: '16px',
            color: 'var(--color-text-tertiary)',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            30秒で分かる暗号資産適性診断
          </p>
        </div>

        {/* リンクとナビゲーション */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '48px',
          textAlign: 'center'
        }}>
          {/* サービス */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '20px',
              color: 'var(--color-text-primary)'
            }}>
              サービス
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <li>
                <a 
                  href="#diagnosis-form-section"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  無料診断
                </a>
              </li>
              <li>
                <a 
                  href="#features"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  診断の特徴
                </a>
              </li>
              <li>
                <a 
                  href="#faq"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  よくある質問
                </a>
              </li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '20px',
              color: 'var(--color-text-primary)'
            }}>
              会社情報
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <li>
                <a 
                  href="#company"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  会社概要
                </a>
              </li>
              <li>
                <a 
                  href="#contact"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  お問い合わせ
                </a>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '20px',
              color: 'var(--color-text-primary)'
            }}>
              法的情報
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <li>
                <a 
                  href="#privacy"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  プライバシーポリシー
                </a>
              </li>
              <li>
                <a 
                  href="#terms"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  利用規約
                </a>
              </li>
              <li>
                <a 
                  href="#scta"
                  style={{
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                >
                  特定商取引法に基づく表記
                </a>
              </li>
            </ul>
          </div>

          {/* 管理者関連のセクションを完全削除 */}
        </div>

        {/* 下線 */}
        <div style={{
          borderTop: '1px solid var(--color-bg-tertiary)',
          paddingTop: '32px',
          textAlign: 'center'
        }}>
          {/* コピーライト */}
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            © {currentYear} Zero神 Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* モバイルレスポンシブ */}
      <style>{`
        @media (max-width: 768px) {
          footer > div {
            padding: 0 16px;
          }
          
          footer h3 {
            font-size: 20px !important;
          }
          
          footer .grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 24px !important;
            text-align: left !important;
          }
        }
        
        @media (max-width: 480px) {
          footer .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;