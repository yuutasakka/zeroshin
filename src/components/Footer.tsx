import React from 'react';

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      color: '#f1f5f9',
      padding: '80px 20px 40px',
      marginTop: '100px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '-50px',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        right: '-30px',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Logo */}
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
              fontSize: '32px',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Zero神
            </h3>
          </div>
          <p style={{
            fontSize: '18px',
            color: '#94a3b8',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            30秒で分かる暗号資産適性診断で、あなたに最適な投資スタイルを見つけましょう
          </p>
        </div>

        {/* Links Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '50px',
          marginBottom: '60px'
        }}>
          {/* サービス */}
          <div>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '25px',
              color: '#f1f5f9',
              position: 'relative'
            }}>
              サービス
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                left: 0,
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2px'
              }} />
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {[
                { text: '無料診断', href: '#diagnosis-form-section' },
                { text: '診断の特徴', href: '#features' },
                { text: 'よくある質問', href: '#faq' }
              ].map((item, index) => (
                <li key={index}>
                  <a 
                    href={item.href}
                    style={{
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#667eea';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#cbd5e1';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      width: '4px',
                      height: '4px',
                      backgroundColor: 'currentColor',
                      borderRadius: '50%',
                      transition: 'all 0.3s ease'
                    }} />
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '25px',
              color: '#f1f5f9',
              position: 'relative'
            }}>
              会社情報
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                left: 0,
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2px'
              }} />
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {[
                { text: '会社概要', href: '#company' },
                { text: 'お問い合わせ', href: '#contact' }
              ].map((item, index) => (
                <li key={index}>
                  <a 
                    href={item.href}
                    style={{
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#667eea';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#cbd5e1';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      width: '4px',
                      height: '4px',
                      backgroundColor: 'currentColor',
                      borderRadius: '50%',
                      transition: 'all 0.3s ease'
                    }} />
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '25px',
              color: '#f1f5f9',
              position: 'relative'
            }}>
              法的情報
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                left: 0,
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2px'
              }} />
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {[
                { text: 'プライバシーポリシー', href: '#privacy' },
                { text: '利用規約', href: '#terms' },
                { text: '特定商取引法に基づく表記', href: '#scta' }
              ].map((item, index) => (
                <li key={index}>
                  <a 
                    href={item.href}
                    style={{
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#667eea';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#cbd5e1';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      width: '4px',
                      height: '4px',
                      backgroundColor: 'currentColor',
                      borderRadius: '50%',
                      transition: 'all 0.3s ease'
                    }} />
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SNS・連絡先 */}
          <div>
            <h4 style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '25px',
              color: '#f1f5f9',
              position: 'relative'
            }}>
              フォローする
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                left: 0,
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2px'
              }} />
            </h4>
            <div style={{
              display: 'flex',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              {[
                { icon: '📧', label: 'Email', href: 'mailto:info@zeroshin.com' },
                { icon: '📱', label: 'Twitter', href: '#twitter' },
                { icon: '📘', label: 'Facebook', href: '#facebook' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '15px',
                    textDecoration: 'none',
                    fontSize: '20px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.2)',
          paddingTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            margin: 0,
            fontWeight: 500
          }}>
            © {currentYear} Zero神 Inc. All rights reserved.
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#64748b'
          }}>
            <span>Made with</span>
            <span style={{ color: '#ef4444', fontSize: '16px' }}>❤️</span>
            <span>in Japan</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer {
            padding: 60px 16px 30px !important;
          }
          
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
            text-align: center !important;
          }
          
          .footer-bottom {
            flex-direction: column !important;
            text-align: center !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;