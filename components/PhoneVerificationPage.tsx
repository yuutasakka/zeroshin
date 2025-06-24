

import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import SparkleBackground from './SparkleBackground';

interface PhoneVerificationPageProps {
  phoneNumber: string;
  onVerificationComplete: () => void;
  onCancel: () => void;
}

const PhoneVerificationPage: React.FC<PhoneVerificationPageProps> = ({ phoneNumber, onVerificationComplete, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showCard, setShowCard] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCard(true);
    }, 200);
    document.body.classList.add('verification-page-active');
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('verification-page-active');
    }
  }, []);

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setVerificationCode(value);
    }
  };

  const handleSubmitVerification = async () => {
    if (verificationCode.length !== 4) {
      alert('4桁の認証コードを入力してください。');
      document.getElementById('verification-code')?.focus();
      return;
    }

    setIsVerifying(true);
    
    try {
      // SMS検証APIを呼び出し
      const response = await fetch('http://localhost:3001/api/sms/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          code: verificationCode
        }),
      });

      const result = await response.json();

      if (result.success && result.verified) {
        // 認証成功
        onVerificationComplete();
      } else {
        // 認証失敗
        alert(result.error || '認証に失敗しました');
        setVerificationCode(''); // コードをクリア
        document.getElementById('verification-code')?.focus();
      }
    } catch (error) {
      console.error('認証エラー:', error);
      alert('サーバーとの通信に失敗しました。サーバーが起動しているか確認してください。');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmitVerification();
    }
  };
  
  const formatPhoneNumberForDisplay = (num: string): string => {
    if (num.length >= 7) {
        return num.slice(0, num.length - 4) + "••••"; // Mask with dots
    }
    return num;
  };
  const displayedPhoneNumber = formatPhoneNumberForDisplay(phoneNumber);

  return (
    <div className="flex flex-col min-h-screen" style={{fontFamily: 'var(--font-primary)'}}>
      <SparkleBackground />

      <header className="py-6 px-4 relative z-10">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center" 
                style={{ background: 'var(--gradient-gold)' }}
                aria-hidden="true"
              >
                <i className="fas fa-coins text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-bold" style={{color: 'var(--neutral-100)'}}>マネーチケット</h1>
            </div>
            <button 
              type="button"
              onClick={onCancel}
              className="text-white bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-all flex items-center premium-button"
              style={{background: 'rgba(255,255,255,0.1)', padding: 'var(--space-sm) var(--space-md)', fontSize: '0.9rem', borderRadius: '12px' }}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              診断に戻る
            </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div 
          className={`max-w-lg w-full transition-all duration-1000 ease-out ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="luxury-card p-6 sm:p-10 text-center"> {/* Use luxury-card and ensure text-center for content */}
            <div className="mb-6">
              <div 
                className="inline-block p-4 rounded-full mb-4" 
                style={{ background: 'var(--gradient-emerald)'}} // Use emerald gradient
                // animation: 'elegant-float 3s ease-in-out infinite' removed as it's for stats-card
              >
                <i className="fas fa-mobile-alt text-3xl text-white"></i>
              </div>
            </div>

            <h2 className="heading-primary text-3xl mb-3" style={{color: 'var(--primary-navy)'}}>
                電話番号認証
            </h2>
            <p className="text-luxury mb-2">
                ご本人様確認のため、認証コードをご入力ください。
            </p>
            <p className="text-sm mb-8" style={{color: 'var(--neutral-600)'}}>
                <i className="fas fa-phone mr-1" style={{color: 'var(--accent-emerald)'}}></i>
                <span className="font-semibold">{displayedPhoneNumber}</span> に認証コード（4桁）をお送りしました。
            </p>

            <div className="space-y-6">
              <div>
                <label htmlFor="verification-code" className="block text-sm font-semibold mb-2" style={{color: 'var(--neutral-700)'}}>
                  <i className="fas fa-key mr-1" style={{color: 'var(--accent-gold)'}}></i>
                  認証コード（4桁）
                </label>
                <input 
                  type="text" 
                  id="verification-code" 
                  value={verificationCode}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  maxLength={4} 
                  placeholder="••••"
                  className={`verification-input-code w-48 mx-auto block ${verificationCode.length === 4 ? 'filled' : ''}`}
                  aria-label="認証コード入力"
                  inputMode="numeric"
                />
              </div>

              <div>
                <button 
                  type="button"
                  onClick={handleSubmitVerification}
                  disabled={isVerifying || verificationCode.length !== 4}
                  className="premium-button emerald-accent-button w-full text-lg"
                >
                  {isVerifying ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>認証中...</>
                  ) : (
                    <><i className="fas fa-shield-alt mr-2"></i>認証して結果を見る</> 
                  )}
                </button>
              </div>
              
              <div className="p-4 space-y-2 text-xs rounded-lg" style={{background: 'var(--neutral-100)', borderLeft: '4px solid var(--accent-emerald)'}}>
                <p className="flex items-center" style={{color: 'var(--neutral-600)'}}>
                  <i className="fas fa-info-circle mr-2" style={{color: 'var(--accent-emerald)'}}></i>
                  <span className="font-semibold">認証後、診断結果ページへ進みます。</span>
                </p>
                <p className="flex items-start" style={{color: 'var(--neutral-600)'}}>
                  <i className="fas fa-comment-dots mr-2 mt-0.5" style={{color: 'var(--accent-emerald)'}}></i>
                  <span>SMSが届かない場合は、入力された電話番号をご確認ください。迷惑メール設定などもご確認ください。</span>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm inline-block px-4 py-2 rounded-full" style={{color: 'var(--neutral-200)', background: 'rgba(0,0,0,0.2)'}}>
              <i className="fas fa-heart mr-1" style={{color: 'var(--accent-rose)'}}></i>
              ご不明点はいつでもサポートいたします
              <i className="fas fa-smile ml-1" style={{color: 'var(--accent-gold)'}}></i>
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 text-center relative z-10">
            <div className="text-xs space-y-1" style={{color: 'var(--neutral-300)', opacity: 0.8}}>
            <p>ご入力いただいた情報はSSL暗号化通信により安全に送信されます。</p>
            <p>&copy; {new Date().getFullYear()} MoneyTicket. All rights reserved. <span style={{color: 'var(--accent-gold)'}} role="img" aria-label="sparkling heart emoji">💖</span></p>
            </div>
      </footer>
    </div>
  );
};

export default PhoneVerificationPage;