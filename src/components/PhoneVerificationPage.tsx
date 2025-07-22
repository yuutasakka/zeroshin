import React, { useState, useEffect } from 'react';
import { supabase, diagnosisManager } from './supabaseClient';
import { UserSessionData } from '../../types';
import { OneTimeUsageNotice } from './OneTimeUsageNotice';

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
  // トップページで入力された電話番号があれば、直接OTP送信ステップに進む
  const hasPhoneFromSession = userSession.phoneNumber && userSession.phoneNumber.trim() !== '';
  const [step, setStep] = useState<VerificationStep>(hasPhoneFromSession ? 'otp-verification' : 'phone-input');
  const [phoneNumber, setPhoneNumber] = useState(userSession.phoneNumber || '');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showUsageNotice, setShowUsageNotice] = useState(false);
  const [isInitialSMSSent, setIsInitialSMSSent] = useState(false); // SMS送信済みフラグを追加
  
  // 試行回数制限の状態
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15分

  // カウントダウンタイマー
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ロックアウトタイマー
  useEffect(() => {
    if (lockoutTime && lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(lockoutTime - 1000);
        if (lockoutTime <= 1000) {
          setFailedAttempts(0);
          setLockoutEndTime(null);
          setError(null);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  // 診断フォームから電話番号が渡された場合、自動的にSMS送信を行う
  useEffect(() => {
    const handleAutoSendSMS = async () => {
      // 既に送信済み、または電話番号がない、またはOTP入力画面でない場合はスキップ
      if (isInitialSMSSent || !hasPhoneFromSession || step !== 'otp-verification') return;
      
      try {
          if (!validatePhoneNumber(phoneNumber)) {
            setError('有効な日本の電話番号を入力してください（例: 090-1234-5678）');
            return;
          }

          const normalizedPhone = normalizePhoneNumber(phoneNumber);
          
          // 電話番号の重複チェック
          const isUsed = await checkPhoneNumberUsage(normalizedPhone);
          if (isUsed) {
            setShowUsageNotice(true);
            return;
          }

          // 本番環境必須 - 開発環境は無効
          setLoading(true);
          
          // 本番環境でのみ動作 - Supabase SMS設定確認
          // フロントエンドでは環境変数は直接確認不可、Supabaseに依存
          
          // 独自API経由でSMS送信（本番環境のみ）
          try {
            const response = await fetch('/api/send-otp-simple', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phoneNumber: normalizedPhone
              })
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'SMS送信に失敗しました');
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.error || 'SMS送信に失敗しました');
            }
            
            setIsInitialSMSSent(true); // 送信済みフラグを設定
            setCountdown(60);
          } catch (smsError: any) {
            console.error('SMS送信エラー:', smsError);
            throw new Error(smsError.message || 'SMS送信に失敗しました。電話番号を確認してもう一度お試しください。');
          }
          
        } catch (error: any) {
          setError(error.message || 'SMS送信に失敗しました。しばらく後にもう一度お試しください。');
        } finally {
          setLoading(false);
        }
      };

    handleAutoSendSMS();
  }, [hasPhoneFromSession, step, phoneNumber, isInitialSMSSent]);

  // 電話番号の形式を正規化
  const normalizePhoneNumber = (phone: string): string => {
    // 全角数字を半角数字に変換
    const halfWidthPhone = phone.replace(/[０-９]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
    });
    
    // ハイフンやスペースを削除し、数字のみ抽出
    const normalized = halfWidthPhone.replace(/[^\d]/g, '');
    
    // API用の形式（090xxxxxxxx）として返す
    return normalized;
  };
  
  // 国際形式に変換する関数（Supabase用）
  const toInternationalFormat = (phone: string): string => {
    const normalized = normalizePhoneNumber(phone);
    if (normalized.startsWith('0')) {
      return '+81' + normalized.substring(1);
    }
    return normalized;
  };

  // 電話番号の検証
  const validatePhoneNumber = (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone);
    // 日本の電話番号パターン（090/080/070で始まる11桁）
    const phoneRegex = /^(090|080|070)\d{8}$/;
    return phoneRegex.test(normalized);
  };

  // OTP送信（フォーム用）
  const handleSendOTP = async (e: React.FormEvent) => {
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
        setShowUsageNotice(true);
        return;
      }
      
      const response = await fetch('/api/send-otp-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: normalizedPhone
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('SMS送信API失敗:', { status: response.status, statusText: response.statusText, error: errorData });
        throw new Error(errorData.error || `SMS送信に失敗しました (${response.status})`);
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

  // ロックアウト処理
  const handleFailedAttempt = () => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);
    
    if (newFailedAttempts >= MAX_ATTEMPTS) {
      const endTime = new Date(Date.now() + LOCKOUT_DURATION);
      setLockoutEndTime(endTime);
      setLockoutTime(LOCKOUT_DURATION);
      setError(`認証に${MAX_ATTEMPTS}回失敗したため、${Math.floor(LOCKOUT_DURATION / 60000)}分間ロックされます。`);
    }
  };

  // 残り時間をフォーマット
  const formatLockoutTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // OTP検証
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ロックアウト中はブロック
    if (lockoutTime && lockoutTime > 0) {
      setError(`認証がロックされています。残り時間: ${formatLockoutTime(lockoutTime)}`);
      return;
    }

    setLoading(true);

    try {
      if (!otpCode || otpCode.length !== 6) {
        throw new Error('6桁の認証コードを入力してください');
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // 認証前に再度重複チェック
      const isUsed = await checkPhoneNumberUsage(normalizedPhone);
      if (isUsed) {
        setShowUsageNotice(true);
        return;
      }
      
      // 独自API経由でOTP検証（本番環境のみ）
      let authSuccess = false;
      
      try {
        const response = await fetch('/api/verify-otp-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: normalizedPhone,
            otp: otpCode
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('OTP認証API失敗:', { status: response.status, statusText: response.statusText, error: errorData });
          handleFailedAttempt();
          throw new Error(errorData.error || `認証に失敗しました (${response.status})`);
        }

        const result = await response.json();
        if (!result.success) {
          handleFailedAttempt();
          throw new Error(result.error || '認証コードが正しくありません。再度確認してください。');
        }
        
        authSuccess = result.success;
      } catch (smsError: any) {
        console.error('SMS認証例外:', smsError);
        if (!smsError.message?.includes('認証コード')) {
          handleFailedAttempt();
        }
        throw new Error(smsError.message || 'SMS認証サービスに接続できません。しばらく後にもう一度お試しください。');
      }

      if (authSuccess) {
        try {
          
          // 認証成功時は失敗回数をリセット
          setFailedAttempts(0);
          setLockoutTime(null);
          setLockoutEndTime(null);


          // 診断回答データの確認と修正
          let diagnosisAnswers = userSession.diagnosisAnswers || {};
          
          // 空の診断回答の場合、localStorageから取得を試行
          if (Object.keys(diagnosisAnswers).length === 0) {
            const storedDiagnosisData = localStorage.getItem('diagnosisData');
            if (storedDiagnosisData) {
              try {
                const parsedData = JSON.parse(storedDiagnosisData);
                diagnosisAnswers = parsedData;
              } catch (e) {
                console.error('🔍 localStorageからの診断データ取得に失敗:', e);
              }
            }
          }

          // Supabaseに診断セッションを作成
          const sessionId = await diagnosisManager.createDiagnosisSession(
            normalizedPhone, 
            diagnosisAnswers
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
            diagnosisAnswers: diagnosisAnswers, // 確実に診断回答を含める
            smsVerified: true,
            verifiedPhoneNumber: normalizedPhone,
            verificationTimestamp: new Date().toISOString(),
            sessionId: sessionId
          };


          // 現在のセッションをローカルストレージに保存（一時的）
          localStorage.setItem('currentUserSession', JSON.stringify(updatedSession));
          
          // 保存確認
          const savedSession = localStorage.getItem('currentUserSession');
          
          setStep('success');
          
          
          // 認証状態が確実に保存されるまで少し待機
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 最終確認: 保存された認証状態を再度チェック
          const finalCheck = localStorage.getItem('currentUserSession');
          if (finalCheck) {
            const parsedCheck = JSON.parse(finalCheck);
            
            if (parsedCheck.smsVerified && parsedCheck.sessionId) {
              setStep('success');
              
              // 2秒後に結果ページへ
              setTimeout(() => {
                onVerificationSuccess();
              }, 2000);
            } else {
              throw new Error('認証状態の最終確認に失敗しました');
            }
          } else {
            throw new Error('認証状態の保存に失敗しました');
          }

        } catch (sessionError) {
          console.error('❌ 認証後のシステムエラー:', sessionError);
          throw new Error('認証は成功しましたが、システムエラーが発生しました。管理者にお問い合わせください。');
        }
      }
      
    } catch (error: any) {
      const errorMessage = error.message || '認証コードが正しくありません。もう一度お試しください。';
      setError(errorMessage);
      
      // 認証失敗時は失敗回数をカウント（認証コード間違いの場合のみ）
      if (errorMessage.includes('認証コード') || errorMessage.includes('正しくありません')) {
        handleFailedAttempt();
      }
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
      
      const response = await fetch('/api/send-otp-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: normalizedPhone  // API用の標準形式（090xxxxxxxx）
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('SMS送信API失敗:', { status: response.status, statusText: response.statusText, error: errorData });
        throw new Error(errorData.error || `SMS送信に失敗しました (${response.status})`);
      }

      setCountdown(60);
      setIsInitialSMSSent(true); // 再送信でもフラグを設定
      
    } catch (error: any) {
      setError(error.message || 'SMS再送信に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {showUsageNotice && (
        <OneTimeUsageNotice 
          onDismiss={() => {
            setShowUsageNotice(false);
            onBack();
          }} 
        />
      )}
      <div className="max-w-lg w-full">
        
        {/* プログレス表示 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm text-gray-600">診断完了</span>
            </div>
            <div className="w-16 h-1 bg-green-500 rounded"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'otp-verification' || step === 'success' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step === 'success' ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm text-gray-600">SMS認証</span>
            </div>
            <div className={`w-16 h-1 rounded transition-all ${
              step === 'success' ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm text-gray-600">結果受取</span>
            </div>
          </div>
        </div>

        {/* メインヘッダー */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            あなたの診断結果が
            <span className="text-emerald-600">完成しました！</span>
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            SMS認証を完了して、パーソナライズされた<br />
            <strong className="text-blue-600">資産運用プランを今すぐ受け取りましょう</strong>
          </p>
          
          {/* 結果の魅力をアピール */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">あなた専用の診断結果をご用意</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-center">
                <span className="text-emerald-500 mr-2">•</span>
                個別の投資戦略プラン
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">•</span>
                資産成長シミュレーション
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                リスク分析と対策
              </div>
              <div className="flex items-center">
                <span className="text-orange-500 mr-2">•</span>
                専門家おすすめ商品
              </div>
            </div>
          </div>

          {hasPhoneFromSession && step === 'otp-verification' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-700 text-sm">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {phoneNumber} に認証コードを送信しました
              </p>
            </div>
          )}
        </div>

        {/* 電話番号入力ステップ */}
        {step === 'phone-input' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">携帯電話番号を入力</h3>
              <p className="text-gray-600 text-sm">
                SMS認証で本人確認を行い、セキュアに結果をお届けします
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-6">
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
                  className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  ハイフンありなしどちらでも入力可能です
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    送信中...
                  </div>
                ) : (
                  <>
                    <span className="text-lg">認証コードを受け取る</span>
                    <div className="text-sm opacity-90 mt-1">診断結果まであと1ステップ！</div>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800 py-2 transition-colors duration-200 text-sm"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                診断画面に戻る
              </button>
            </div>
          </div>
        )}

        {/* OTP検証ステップ */}
        {step === 'otp-verification' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">認証コードを入力してください</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>{phoneNumber}</strong> にSMSで送信された<br />
                6桁のコードを入力してください
              </p>
              {hasPhoneFromSession && (
                <p className="text-blue-600 text-xs">
                  ※ 診断フォームで入力された電話番号に自動送信しました
                </p>
              )}
              {/* 開発環境での認証コード表示 */}
              {(process.env.NODE_ENV !== 'production' && 
                (typeof window === 'undefined' || 
                 window.location.hostname.includes('localhost') || 
                 window.location.hostname.includes('127.0.0.1'))) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium">
                    開発環境用認証コード: <strong>123456</strong>
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    本番環境では実際のSMSが送信されます
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-4 text-center text-3xl font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 tracking-widest shadow-sm bg-gray-50"
                  maxLength={6}
                  required
                  disabled={!!(lockoutTime && lockoutTime > 0)}
                />
                {otpCode.length > 0 && otpCode.length < 6 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    あと{6 - otpCode.length}桁入力してください
                  </p>
                )}
              </div>

              {/* 試行回数とロックアウト情報 */}
              {(failedAttempts > 0 || (lockoutTime && lockoutTime > 0)) && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  {lockoutTime && lockoutTime > 0 ? (
                    <p className="text-orange-700 text-sm text-center">
                      認証がロックされています<br />
                      残り時間: <strong className="text-lg font-mono">{formatLockoutTime(lockoutTime)}</strong><br />
                      <span className="text-xs">セキュリティのため一時的にロックされています</span>
                    </p>
                  ) : (
                    <p className="text-orange-700 text-sm text-center">
                      認証失敗: {failedAttempts}/{MAX_ATTEMPTS}回<br />
                      <span className="text-xs">
                        {MAX_ATTEMPTS - failedAttempts}回失敗すると{Math.floor(LOCKOUT_DURATION / 60000)}分間ロックされます
                      </span>
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* 重要な警告メッセージ */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h4 className="text-yellow-800 font-semibold text-sm mb-2">重要なお知らせ</h4>
                <p className="text-yellow-700 text-xs leading-relaxed">
                  この認証を完了せずに画面を閉じると、<strong>診断結果を二度と受け取ることができません</strong>。<br />
                  お一人様一回限りの診断のため、再診断はできませんのでご注意ください。
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6 || !!(lockoutTime && lockoutTime > 0)}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    認証中...
                  </div>
                ) : (
                  <>
                    <span className="text-lg text-white">認証完了して結果を受け取る</span>
                    <div className="text-sm text-white opacity-90 mt-1">あなた専用の投資プランが待っています！</div>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              {countdown > 0 ? (
                <p className="text-gray-500 text-sm">
                  再送信まで <strong className="font-mono">{countdown}秒</strong>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={loading || !!(lockoutTime && lockoutTime > 0)}
                  className="text-emerald-600 hover:text-emerald-800 text-sm transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  認証コードを再送信
                </button>
              )}

              <button
                onClick={() => {
                  setStep('phone-input');
                  setError(null);
                  setCountdown(0);
                  setFailedAttempts(0);
                  setLockoutTime(null);
                  setLockoutEndTime(null);
                  setIsInitialSMSSent(false); // フラグをリセット
                }}
                disabled={!!(lockoutTime && lockoutTime > 0)}
                className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-edit mr-2"></i>
                電話番号を変更
              </button>
            </div>
          </div>
        )}

        {/* 成功ステップ */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">認証完了！</h3>
            <p className="text-gray-600 mb-6 text-lg">
              SMS認証が正常に完了しました。<br />
              <strong className="text-emerald-600">あなた専用の診断結果</strong>ページに移動します...
            </p>
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
            <p className="text-sm text-gray-500">
              しばらくお待ちください...
            </p>
          </div>
        )}

        {/* エラーステップ */}
        {step === 'error' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">認証に失敗しました</h3>
            <p className="text-gray-600 mb-6">
              SMS認証に失敗しました。もう一度お試しください。
            </p>
            <button
              onClick={() => {
                setStep('phone-input');
                setError(null);
                setFailedAttempts(0);
                setLockoutTime(null);
                setLockoutEndTime(null);
                setIsInitialSMSSent(false); // フラグをリセット
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
            >
              最初からやり直す
            </button>
          </div>
        )}

        {/* 画面下部の信頼性表示 */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">•</span>
              セキュア認証
            </div>
            <div className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              SMS暗号化
            </div>
            <div className="flex items-center">
              <span className="text-purple-500 mr-2">•</span>
              個人情報保護
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            AI ConectX - あなたの資産運用を安全にサポート
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationPage;