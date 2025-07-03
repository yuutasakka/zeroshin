import React, { useState, useEffect } from 'react';
import { DiagnosisAnswers } from './DiagnosisFlow';
import { measureAsync, PERF_TARGETS } from './PerformanceMonitor';

interface SMSAuthFlowProps {
  diagnosisAnswers: DiagnosisAnswers;
  onAuthComplete: (phoneNumber: string) => void;
  onCancel: () => void;
}

const CARD_STYLE: React.CSSProperties = {
  maxWidth: 400,
  margin: '40px auto',
  padding: '32px 24px',
  borderRadius: 24,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  background: 'linear-gradient(135deg, #fff 60%, #e0f7fa 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: 340,
};
const TITLE_STYLE: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 18,
  textAlign: 'center',
};
const DESC_STYLE: React.CSSProperties = {
  fontSize: 15,
  color: '#555',
  marginBottom: 18,
  textAlign: 'center',
};
const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  fontSize: 18,
  padding: '14px 12px',
  borderRadius: 12,
  border: '1.5px solid #b2ebf2',
  marginBottom: 18,
  outline: 'none',
  boxSizing: 'border-box',
};
const OTP_INPUTS_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'center',
  marginBottom: 18,
};
const OTP_INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  fontSize: 24,
  borderRadius: 10,
  border: '1.5px solid #b2ebf2',
  textAlign: 'center',
  outline: 'none',
  background: '#fff',
  padding: '14px 0',
  letterSpacing: '0.5em',
  marginBottom: 18,
};
const BTN_STYLE: React.CSSProperties = {
  width: '100%',
  fontSize: 18,
  padding: '16px 0',
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)',
  color: '#222',
  fontWeight: 700,
  boxShadow: '0 2px 8px rgba(33,150,243,0.10)',
  cursor: 'pointer',
  marginBottom: 12,
  transition: 'all 0.2s',
};
const BTN_DISABLED: React.CSSProperties = {
  ...BTN_STYLE,
  background: '#e0e0e0',
  color: '#aaa',
  cursor: 'not-allowed',
};
const ERROR_STYLE: React.CSSProperties = {
  color: '#e53935',
  background: '#ffebee',
  borderRadius: 8,
  padding: '8px 12px',
  marginBottom: 12,
  fontWeight: 600,
  textAlign: 'center',
};
const TIMER_STYLE: React.CSSProperties = {
  fontSize: 15,
  color: '#039be5',
  marginBottom: 10,
  textAlign: 'center',
};

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

  if (step === 'phone') {
    return (
      <div style={CARD_STYLE}>
        <div style={TITLE_STYLE}>電話番号認証</div>
        <div style={DESC_STYLE}>
          {step === 'phone' ? 'ご本人確認のため、電話番号を入力してください。' : 'SMSで届いた6桁の認証コードを入力してください。'}
        </div>
        {error && <div style={ERROR_STYLE}>{error}</div>}
        {step === 'phone' && (
          <>
            <input
              style={INPUT_STYLE}
              type="tel"
              placeholder="例: 09012345678"
              value={phoneNumber}
              onChange={e => handlePhoneNumberChange(e.target.value)}
              maxLength={11}
              disabled={isLoading}
            />
            <button
              style={phoneNumber.length === 11 && !isLoading ? BTN_STYLE : BTN_DISABLED}
              onClick={handleSendSMS}
              disabled={phoneNumber.length !== 11 || isLoading}
            >
              SMS認証コードを送信
            </button>
          </>
        )}
        {step === 'otp' && (
          <>
            <input
              style={OTP_INPUT_STYLE}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="6桁の認証コード"
              disabled={isLoading}
            />
            <div style={TIMER_STYLE}>
              {remainingTime > 0 ? `有効期限: ${Math.floor(remainingTime / 60)}:${('0' + (remainingTime % 60)).slice(-2)}` : '認証コードの有効期限が切れました'}
            </div>
            <button
              style={otpInput.length === 6 && !isLoading ? BTN_STYLE : BTN_DISABLED}
              onClick={() => handleVerify(otpInput)}
              disabled={otpInput.length !== 6 || isLoading}
            >
              認証する
            </button>
            <button
              style={canResend && resendCount < 3 ? BTN_STYLE : BTN_DISABLED}
              onClick={handleResendOTP}
              disabled={!canResend || resendCount >= 3 || isLoading}
            >
              認証コードを再送信
            </button>
          </>
        )}
      </div>
    );
  }

  // OTP認証画面
  return (
    <div style={CARD_STYLE}>
      <div style={TITLE_STYLE}>電話番号認証</div>
      <div style={DESC_STYLE}>
        {step === 'phone' ? 'ご本人確認のため、電話番号を入力してください。' : 'SMSで届いた6桁の認証コードを入力してください。'}
      </div>
      {error && <div style={ERROR_STYLE}>{error}</div>}
      {step === 'phone' && (
        <>
          <input
            style={INPUT_STYLE}
            type="tel"
            placeholder="例: 09012345678"
            value={phoneNumber}
            onChange={e => handlePhoneNumberChange(e.target.value)}
            maxLength={11}
            disabled={isLoading}
          />
          <button
            style={phoneNumber.length === 11 && !isLoading ? BTN_STYLE : BTN_DISABLED}
            onClick={handleSendSMS}
            disabled={phoneNumber.length !== 11 || isLoading}
          >
            SMS認証コードを送信
          </button>
        </>
      )}
      {step === 'otp' && (
        <>
          <input
            style={OTP_INPUT_STYLE}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpInput}
            onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="6桁の認証コード"
            disabled={isLoading}
          />
          <div style={TIMER_STYLE}>
            {remainingTime > 0 ? `有効期限: ${Math.floor(remainingTime / 60)}:${('0' + (remainingTime % 60)).slice(-2)}` : '認証コードの有効期限が切れました'}
          </div>
          <button
            style={otpInput.length === 6 && !isLoading ? BTN_STYLE : BTN_DISABLED}
            onClick={() => handleVerify(otpInput)}
            disabled={otpInput.length !== 6 || isLoading}
          >
            認証する
          </button>
          <button
            style={canResend && resendCount < 3 ? BTN_STYLE : BTN_DISABLED}
            onClick={handleResendOTP}
            disabled={!canResend || resendCount >= 3 || isLoading}
          >
            認証コードを再送信
          </button>
        </>
      )}
    </div>
  );
};

export default SMSAuthFlow; 