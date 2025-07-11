import React, { useState, useEffect } from 'react';
import { DiagnosisAnswers } from './DiagnosisFlow';
import { measureAsync, PERF_TARGETS } from './PerformanceMonitor';

interface SMSAuthFlowProps {
  diagnosisAnswers: DiagnosisAnswers;
  onAuthComplete: (phoneNumber: string) => void;
  onCancel: () => void;
}


const SMSAuthFlow: React.FC<SMSAuthFlowProps> = ({ 
  diagnosisAnswers, 
  onAuthComplete, 
  onCancel 
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [resendCount, setResendCount] = useState(0);

  // OTPタイマー（5分）
  useEffect(() => {
    if (step === 'otp' && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, remainingTime]);

  // 電話番号の正規化（ハイフン自動削除）
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  // 電話番号のバリデーション
  const validatePhoneNumber = (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone);
    return /^(090|080|070)\d{8}$/.test(normalized);
  };

  // 電話番号入力ハンドラ
  const handlePhoneNumberChange = (value: string) => {
    const normalized = normalizePhoneNumber(value);
    if (normalized.length <= 11) {
      setPhoneNumber(normalized);
    }
    setError('');
  };

  // 既存認証済みチェック（模擬）
  const checkExistingAuth = async (phone: string): Promise<boolean> => {
    // TODO: 実際のSupabaseでsms_verification.is_verified = trueをチェック
    return false; // 仮実装
  };

  // SMS送信処理
  const handleSendSMS = async () => {
    if (process.env.NODE_ENV !== 'production') {
      await measureAsync('SMS送信', PERF_TARGETS.smsSend, async () => {
        if (!validatePhoneNumber(phoneNumber)) {
          setError('正しい電話番号を入力してください（090/080/070で始まる11桁）');
          return;
        }

        setIsLoading(true);
        setError('');

        try {
          // 既存認証済みチェック
          const isAlreadyVerified = await checkExistingAuth(phoneNumber);
          if (isAlreadyVerified) {
            setError('すでに認証済みです。再診断できません。');
            setIsLoading(false);
            return;
          }

          // 1時間あたり3回制限チェック（実装は後で）
          if (resendCount >= 3) {
            setError('送信回数の上限に達しました。1時間後にお試しください。');
            setIsLoading(false);
            return;
          }

          // TODO: 実際のOTP送信API
          // await sendSMSOTP(phoneNumber);
          
          // 成功時の処理
          setStep('otp');
          setRemainingTime(300); // 5分
          setResendCount(prev => prev + 1);
          setCanResend(false);
          
          // 再送可能までの時間（60秒）
          setTimeout(() => {
            setCanResend(true);
          }, 60000);

        } catch (error) {
          setError('SMS送信に失敗しました。後ほどお試しください。');
        } finally {
          setIsLoading(false);
        }
      });
    } else {
      if (!validatePhoneNumber(phoneNumber)) {
        setError('正しい電話番号を入力してください（090/080/070で始まる11桁）');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // 既存認証済みチェック
        const isAlreadyVerified = await checkExistingAuth(phoneNumber);
        if (isAlreadyVerified) {
          setError('すでに認証済みです。再診断できません。');
          setIsLoading(false);
          return;
        }

        // 1時間あたり3回制限チェック（実装は後で）
        if (resendCount >= 3) {
          setError('送信回数の上限に達しました。1時間後にお試しください。');
          setIsLoading(false);
          return;
        }

        // TODO: 実際のOTP送信API
        // await sendSMSOTP(phoneNumber);
        
        // 成功時の処理
        setStep('otp');
        setRemainingTime(300); // 5分
        setResendCount(prev => prev + 1);
        setCanResend(false);
        
        // 再送可能までの時間（60秒）
        setTimeout(() => {
          setCanResend(true);
        }, 60000);

      } catch (error) {
        setError('SMS送信に失敗しました。後ほどお試しください。');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // OTP認証
  const handleVerify = async (otp: string) => {
    if (process.env.NODE_ENV !== 'production') {
      await measureAsync('認証処理', PERF_TARGETS.smsVerify, async () => {
        if (otp.length !== 6) {
          setError('6桁のOTPを入力してください。');
          return;
        }

        setIsLoading(true);
        setError('');

        try {
          // TODO: 実際のOTP検証API
          // const result = await verifySMSOTP(phoneNumber, otp);
          
          // 仮の成功処理（実際はAPI結果に基づく）
          const isValid = true; // 仮
          
          if (isValid) {
            // 認証成功
            onAuthComplete(phoneNumber);
          } else {
            setError('認証コードが正しくありません。');
            // 失敗回数をカウントアップ（5回でIPブロック）
          }

        } catch (error) {
          setError('認証に失敗しました。もう一度お試しください。');
        } finally {
          setIsLoading(false);
        }
      });
    } else {
      if (otp.length !== 6) {
        setError('6桁のOTPを入力してください。');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // TODO: 実際のOTP検証API
        // const result = await verifySMSOTP(phoneNumber, otp);
        
        // 仮の成功処理（実際はAPI結果に基づく）
        const isValid = true; // 仮
        
        if (isValid) {
          // 認証成功
          onAuthComplete(phoneNumber);
        } else {
          setError('認証コードが正しくありません。');
          // 失敗回数をカウントアップ（5回でIPブロック）
        }

      } catch (error) {
        setError('認証に失敗しました。もう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 再送処理
  const handleResendOTP = () => {
    if (canResend && resendCount < 3) {
      handleSendSMS();
    }
  };

  // 時間フォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 電話番号表示用フォーマット
  const formatPhoneForDisplay = (phone: string): string => {
    if (phone.length >= 8) {
      return `${phone.slice(0, 3)}-****-${phone.slice(-4)}`;
    }
    return phone;
  };

  return (
    <div className="py-10 md:py-16">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-gradient-to-br from-white via-white to-cyan-50 rounded-3xl shadow-2xl p-8 flex flex-col items-center min-h-[420px] border border-cyan-100">
          
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            📱 電話番号認証
          </h2>
          
          {/* Description */}
          <p className="text-base md:text-lg text-gray-600 mb-6 text-center leading-relaxed">
            {step === 'phone' 
              ? 'ご本人確認のため、電話番号を入力してください。' 
              : `${formatPhoneForDisplay(phoneNumber)} に送信された6桁の認証コードを入力してください。`}
          </p>
          
          {/* Error Message */}
          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center font-medium">
              ⚠️ {error}
            </div>
          )}
          
          {/* Phone Input Step */}
          {step === 'phone' && (
            <div className="w-full space-y-6">
              <div className="relative">
                <input
                  type="tel"
                  placeholder="例: 09012345678"
                  value={phoneNumber}
                  onChange={e => handlePhoneNumberChange(e.target.value)}
                  maxLength={11}
                  disabled={isLoading}
                  className="w-full text-lg md:text-xl px-4 py-4 border-2 border-cyan-200 rounded-xl text-center font-mono tracking-wider focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">🇯🇵</span>
                </div>
              </div>
              
              <button
                onClick={handleSendSMS}
                disabled={phoneNumber.length !== 11 || isLoading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none min-h-[56px] ${
                  phoneNumber.length === 11 && !isLoading
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-cyan-500'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>送信中...</span>
                  </div>
                ) : (
                  '📨 SMS認証コードを送信'
                )}
              </button>
            </div>
          )}
          
          {/* OTP Input Step */}
          {step === 'otp' && (
            <div className="w-full space-y-6">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6桁の認証コード"
                  disabled={isLoading}
                  className="w-full text-2xl md:text-3xl px-4 py-4 border-2 border-cyan-200 rounded-xl text-center font-mono tracking-[0.5em] bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                />
              </div>
              
              {/* Timer */}
              <div className="text-center">
                <div className={`text-base font-medium px-4 py-2 rounded-lg ${
                  remainingTime > 0 
                    ? 'text-cyan-600 bg-cyan-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  {remainingTime > 0 
                    ? `⏰ 有効期限: ${formatTime(remainingTime)}` 
                    : '⏰ 認証コードの有効期限が切れました'
                  }
                </div>
              </div>
              
              {/* Verify Button */}
              <button
                onClick={() => handleVerify(otpInput)}
                disabled={otpInput.length !== 6 || isLoading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none min-h-[56px] ${
                  otpInput.length === 6 && !isLoading
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-green-500'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>認証中...</span>
                  </div>
                ) : (
                  '✅ 認証する'
                )}
              </button>
              
              {/* Resend Button */}
              <button
                onClick={handleResendOTP}
                disabled={!canResend || resendCount >= 3 || isLoading}
                className={`w-full py-3 px-6 rounded-xl font-medium text-base transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                  canResend && resendCount < 3 && !isLoading
                    ? 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500'
                    : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                🔄 認証コードを再送信 {resendCount > 0 && `(${resendCount}/3)`}
              </button>
            </div>
          )}
          
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="mt-4 text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            ← 戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSAuthFlow; 