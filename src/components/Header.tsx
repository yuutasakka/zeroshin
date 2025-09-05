import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToDiagnosis = () => {
    const diagnosisSection = document.getElementById('diagnosis-form-section');
    if (diagnosisSection) {
      const yOffset = -80;
      const elementPosition = diagnosisSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset + yOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.1)' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        padding: '0 clamp(16px, 4vw, 40px)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <a 
          href="#top" 
          onClick={scrollToTop}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* Logo icon */}
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 2L2 7V12C2 16.5 4.5 20.5 12 22C19.5 20.5 22 16.5 22 12V7L12 2Z" 
                stroke="#FFFFFF" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M9 12L11 14L15 10" 
                stroke="#FFFFFF" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Zero神
          </h1>
        </a>

        {/* Desktop Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px'
        }} className="desktop-nav">
          <a 
            href="#features" 
            style={{
              color: '#4a5568',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#667eea';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4a5568';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            特徴
          </a>
          <a 
            href="#faq" 
            style={{
              color: '#4a5568',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#667eea';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4a5568';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            FAQ
          </a>
          <button
            onClick={scrollToDiagnosis}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
              border: 'none',
              borderRadius: '50px',
              padding: '12px 28px',
              fontSize: '16px',
              fontWeight: 700,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
            }}
          >
            診断開始
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="メニューを開く"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: 'block',
                width: '24px',
                height: '3px',
                backgroundColor: '#4a5568',
                marginBottom: i < 2 ? '4px' : '0',
                borderRadius: '2px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isMobileMenuOpen 
                  ? i === 0 ? 'rotate(45deg) translateY(7px)' 
                    : i === 1 ? 'scaleX(0)' 
                    : 'rotate(-45deg) translateY(-7px)'
                  : 'none',
                opacity: isMobileMenuOpen && i === 1 ? 0 : 1
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}>
            <a 
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '16px 20px',
                color: '#4a5568',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: 600,
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                marginBottom: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              特徴
            </a>
            <a 
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '16px 20px',
                color: '#4a5568',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: 600,
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              FAQ
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToDiagnosis();
              }}
              style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                border: 'none',
                borderRadius: '50px',
                padding: '16px 28px',
                fontSize: '18px',
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
              }}
            >
              診断開始
            </button>
          </nav>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;