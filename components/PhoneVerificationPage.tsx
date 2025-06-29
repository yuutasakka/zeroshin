import React, { useState, useEffect } from 'react';
import { supabase, diagnosisManager } from './supabaseClient';
import { UserSessionData } from '../types';

interface PhoneVerificationPageProps {
  userSession: UserSessionData;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

type VerificationStep = 'phone-input' | 'otp-verification' | 'success' | 'error';

const PhoneVerificationPage: React.FC<PhoneVerificationPageProps> = ({
  userSession,
  onVerificationSuccess,
  onBack
}) => {
  const [step, setStep] = useState<VerificationStep>('phone-input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // カウントダウンタイマー
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 電話番号の形式を正規化
  const normalizePhoneNumber = (phone: string): string => {
    // 日本の電話番号を国際形式に変換
    let normalized = phone.replace(/[^\d]/g, ''); // 数字のみ抽出
    
    if (normalized.startsWith('0')) {
      // 0から始まる場合は+81に変換
      normalized = '+81' + normalized.substring(1);
    } else if (normalized.startsWith('81')) {
      // 81から始まる場合は+を追加
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      // +がない場合は+81を追加
      normalized = '+81' + normalized;
    }
    
    return normalized;
  };

  // 電話番号の検証
  const validatePhoneNumber = (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone);
    // 日本の電話番号パターン（+81から始まる）
    const phoneRegex = /^\+81[1-9]\d{8,9}$/;
    return phoneRegex.test(normalized);
  };

  // OTP送信
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error('有効な日本の電話番号を入力してください（例: 090-1234-5678）');
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        throw error;
      }

      setStep('otp-verification');
      setCountdown(60); // 60秒のカウントダウン
      
    } catch (error: any) {
      setError(error.message || 'SMS送信に失敗しました。しばらく後にもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 電話番号の重複チェック（Supabaseベース）
  const checkPhoneNumberUsage = async (phone: string): Promise<boolean> => {
    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      return await diagnosisManager.checkPhoneNumberUsage(normalizedPhone);
    } catch (error) {
      return false;
    }
  };

  // OTP送信前の重複チェック
  const handleSendOTPWithCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error('有効な日本の電話番号を入力してください（例: 090-1234-5678）');
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // 電話番号の重複チェック
      const isUsed = await checkPhoneNumberUsage(normalizedPhone);
      if (isUsed) {
        throw new Error('この電話番号は既に診断を完了しています。お一人様一回限りとなっております。');
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        throw error;
      }

      setStep('otp-verification');
      setCountdown(60); // 60秒のカウントダウン
      
    } catch (error: any) {
      setError(error.message || 'SMS送信に失敗しました。しばらく後にもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // OTP検証
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!otpCode || otpCode.length !== 6) {
        throw new Error('6桁の認証コードを入力してください');
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // 認証前に再度重複チェック
      const isUsed = await checkPhoneNumberUsage(normalizedPhone);
      if (isUsed) {
        throw new Error('この電話番号は既に診断を完了しています。お一人様一回限りとなっております。');
      }
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otpCode,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        try {
          // Supabaseに診断セッションを作成
          const sessionId = await diagnosisManager.createDiagnosisSession(
            normalizedPhone, 
            userSession.diagnosisAnswers
          );

          if (!sessionId) {
            throw new Error('診断セッションの作成に失敗しました');
          }

          // SMS認証完了をSupabaseに記録
          const updateSuccess = await diagnosisManager.updateSessionVerification(sessionId, normalizedPhone);
          
          if (!updateSuccess) {
            throw new Error('認証状態の更新に失敗しました');
          }

          // 認証成功 - ユーザーセッションにSMS認証済みフラグを追加
          const updatedSession = {
            ...userSession,
            smsVerified: true,
            verifiedPhoneNumber: normalizedPhone,
            verificationTimestamp: new Date().toISOString(),
            sessionId: sessionId
          };

          // 現在のセッションをローカルストレージに保存（一時的）
          localStorage.setItem('currentUserSession', JSON.stringify(updatedSession));
          
          setStep('success');
          
          // 2秒後に結果ページへ
          setTimeout(() => {
            onVerificationSuccess();
          }, 2000);

        } catch (sessionError) {
          throw new Error('認証は成功しましたが、システムエラーが発生しました。管理者にお問い合わせください。');
        }
      }
      
    } catch (error: any) {
      setError(error.message || '認証コードが正しくありません。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // OTP再送信
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setError(null);
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        throw error;
      }

      setCountdown(60);
      
    } catch (error: any) {
      setError(error.message || 'SMS再送信に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-mobile-alt text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">SMS認証</h1>
          <p className="text-gray-600">診断結果をご覧いただくために、SMS認証を行います</p>
        </div>

        {/* 電話番号入力ステップ */}
        {step === 'phone-input' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={handleSendOTPWithCheck} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  携帯電話番号
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="090-1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ハイフンありなしどちらでも入力可能です
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    送信中...
                  </div>
                ) : (
                  '認証コードを送信'
                )}
              </button>
            </form>

            <button
              onClick={onBack}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2 transition-colors duration-200"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              診断画面に戻る
            </button>
          </div>
        )}

        {/* OTP検証ステップ */}
        {step === 'otp-verification' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-sms text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">認証コードを入力</h3>
              <p className="text-gray-600 text-sm">
                {phoneNumber} にSMSで6桁のコードを送信しました
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    認証中...
                  </div>
                ) : (
                  '認証して結果を見る'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              {countdown > 0 ? (
                <p className="text-gray-500 text-sm">
                  再送信まで {countdown}秒
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200"
                >
                  認証コードを再送信
                </button>
              )}
            </div>

            <button
              onClick={() => setStep('phone-input')}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2 transition-colors duration-200"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              電話番号を変更
            </button>
          </div>
        )}

        {/* 成功ステップ */}
        {step === 'success' && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">認証完了！</h3>
            <p className="text-gray-600 mb-4">
              SMS認証が正常に完了しました。診断結果ページに移動します...
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          </div>
        )}

        {/* エラーステップ */}
        {step === 'error' && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">認証に失敗しました</h3>
            <p className="text-gray-600 mb-4">
              SMS認証に失敗しました。もう一度お試しください。
            </p>
            <button
              onClick={() => setStep('phone-input')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              もう一度試す
            </button>
          </div>
        )}

        {/* フッター */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            SMS認証はお客様の個人情報保護のために実施しております
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationPage;