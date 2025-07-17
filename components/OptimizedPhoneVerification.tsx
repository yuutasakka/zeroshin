import React, { useState, useEffect } from 'react';
import { supabase, diagnosisManager } from './supabaseClient';
import { UserSessionData } from '../types';

interface OptimizedPhoneVerificationProps {
  userSession: UserSessionData;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

const OptimizedPhoneVerification: React.FC<OptimizedPhoneVerificationProps> = ({
  userSession,
  onVerificationSuccess,
  onBack
}) => {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // 電話番号の正規化（全角→半角、ハイフン削除）
  const normalizePhoneNumber = (phone: string): string => {
    // 全角数字を半角数字に変換
    const halfWidthPhone = phone.replace(/[０-９]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
    });
    
    // ハイフンやスペースを削除し、数字のみ抽出
    return halfWidthPhone.replace(/[^\d]/g, '');
  };
  
  const phoneNumber = normalizePhoneNumber(userSession.phoneNumber || '');

  // 自動送信処理
  useEffect(() => {
    if (phoneNumber) {
      sendOTP();
    }
  }, []);

  // カウントダウンタイマー
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // OTP送信
  const sendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/send-otp-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error('SMS送信に失敗しました');
      }

      setCountdown(60);
    } catch (error) {
      setError('SMS送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP入力処理
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // 次の入力欄に自動フォーカス
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // 6桁入力完了時に自動で検証
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };

  // バックスペース処理
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // ペースト処理
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      setOtpCode(newOtp);
      if (pastedData.length === 6) {
        verifyOTP(pastedData);
      }
    }
  };

  // OTP検証
  const verifyOTP = async (otp: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-otp-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp })
      });

      if (!response.ok) {
        throw new Error('認証コードが正しくありません');
      }

      // Supabaseに診断セッションを作成
      const normalizedPhone = phoneNumber.startsWith('+81') ? phoneNumber : `+81${phoneNumber.substring(1)}`;
      await diagnosisManager.createDiagnosisSession(normalizedPhone, userSession.diagnosisAnswers || {});

      setIsSuccess(true);
      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);
    } catch (error) {
      setError('認証コードが正しくありません。もう一度お試しください。');
      setOtpCode(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // 電話番号の表示用フォーマット
  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 11) {
      return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: '66%' }} />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span className="text-green-600">✓ 診断完了</span>
            <span className="text-blue-600 font-medium">SMS認証</span>
            <span className="text-gray-400">結果確認</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {!isSuccess ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📱</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                認証コードを入力
              </h2>
              <p className="text-gray-600 mb-6">
                {formatPhoneForDisplay(phoneNumber)} に送信された
                <br />
                6桁のコードを入力してください
              </p>

              {/* OTP入力欄 */}
              <div className="flex justify-center gap-2 mb-6">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(-1)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all duration-200 ${
                      focusedIndex === index
                        ? 'border-blue-500 shadow-lg scale-110'
                        : digit
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300'
                    }`}
                    maxLength={1}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* カウントダウン */}
              <div className="text-sm text-gray-600 mb-4">
                {countdown > 0 ? (
                  <>コード再送信まで {countdown}秒</>
                ) : (
                  <button
                    onClick={sendOTP}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    コードを再送信
                  </button>
                )}
              </div>

              {/* ローディング表示 */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  <span>認証中...</span>
                </div>
              )}
            </>
          ) : (
            /* 成功画面 */
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scaleIn">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                認証成功！
              </h2>
              <p className="text-gray-600">
                診断結果ページへ移動します...
              </p>
            </>
          )}
        </div>

        {/* ヘルプテキスト */}
        {!isSuccess && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              SMSが届かない場合は、電話番号が正しいか確認してください
            </p>
            <button
              onClick={onBack}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              ← 電話番号を変更
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OptimizedPhoneVerification;