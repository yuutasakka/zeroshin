import React, { useState, useEffect } from 'react';
import { SecureConfigManager, secureLog, SECURITY_CONFIG } from '../security.config';
import { supabase } from './supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorAuthProps {
  username: string;
  onSuccess: (totpSecret: string) => void;
  onCancel: () => void;
  mode: 'setup' | 'verify' | 'enabled';
  existingSecret?: string;
  onMFAEnabled: () => void;
  onMFADisabled: () => void;
}

interface TotpSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ 
  username, 
  onSuccess, 
  onCancel, 
  mode, 
  existingSecret,
  onMFAEnabled,
  onMFADisabled
}) => {
  const [totpCode, setTotpCode] = useState('');
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'enabled'>('setup');
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // TOTP Secret生成（Base32形式）
  const generateTotpSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  // バックアップコード生成
  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += Math.floor(Math.random() * 10).toString();
      }
      codes.push(code.replace(/(.{4})(.{4})/, '$1-$2'));
    }
    return codes;
  };

  // QRコードURL生成（Google Authenticator形式）
  const generateQrCodeUrl = (secret: string, username: string): string => {
    const issuer = 'MoneyTicket';
    const account = `${issuer}:${username}`;
    const params = new URLSearchParams({
      secret: secret,
      issuer: issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(account)}?${params.toString()}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(otpauthUrl)}`;
  };

  // TOTP検証（簡易実装）
  const verifyTotpCode = async (secret: string, code: string): Promise<boolean> => {
    try {
      // 本番環境ではクライアントサイドでの簡易検証を使用
      if (!process.env.API_BASE_URL) {
        // クライアントサイドでの簡易検証
        const now = Math.floor(Date.now() / 1000);
        const window = Math.floor(now / 30);
        
        // 時間窓を±1で検証（30秒の誤差を許容）
        for (let i = -1; i <= 1; i++) {
          const testWindow = window + i;
          const testCode = await generateTotpForWindow(secret, testWindow);
          if (testCode === code) {
            return true;
          }
        }
        return false;
      }

      // 実際の実装ではサーバーサイドでTOTP検証を行う
      // ここでは簡易的な検証を実装
      const response = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secret,
          code: code,
          username: username
        }),
      });

      if (!response.ok) {
        // クライアントサイドでの簡易検証
        const now = Math.floor(Date.now() / 1000);
        const window = Math.floor(now / 30);
        
        // 時間窓を±1で検証（30秒の誤差を許容）
        for (let i = -1; i <= 1; i++) {
          const testWindow = window + i;
          const testCode = await generateTotpForWindow(secret, testWindow);
          if (testCode === code) {
            return true;
          }
        }
        return false;
      }

      const result = await response.json();
      return result.valid;
    } catch (error) {
      secureLog('TOTP検証エラー:', error);
      return false;
    }
  };

  // 指定時間窓でのTOTP生成（簡易実装）
  const generateTotpForWindow = async (secret: string, window: number): Promise<string> => {
    // 実際の実装ではHMAC-SHA1を使用
    // ここでは簡易的な実装
    const hash = await crypto.subtle.digest('SHA-1', 
      new TextEncoder().encode(secret + window.toString())
    );
    const hashArray = Array.from(new Uint8Array(hash));
    const code = (hashArray[0] % 900000 + 100000).toString();
    return code.substring(0, 6);
  };

  // バックアップコード検証（本番環境専用）
  const verifyBackupCode = async (code: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify-backup-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          backupCode: code
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.valid;
    } catch (error) {
      secureLog('バックアップコード検証エラー:', error);
      return false;
    }
  };

  // 初期化処理
  useEffect(() => {
    if (mode === 'setup') {
      const secret = generateTotpSecret();
      const backupCodes = generateBackupCodes();
      const qrCodeUrl = generateQrCodeUrl(secret, username);
      
      setTotpSetup({
        secret,
        qrCodeUrl,
        backupCodes
      });
      
      secureLog('2FA設定初期化完了', { username });
    } else {
      setStep('verify');
    }
  }, [mode, username]);

  // TOTP認証処理
  const handleTotpVerify = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('6桁の認証コードを入力してください。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const secret = mode === 'setup' ? totpSetup?.secret : existingSecret;
      if (!secret) {
        setError('認証設定に問題があります。');
        setLoading(false);
        return;
      }

      const isValid = await verifyTotpCode(secret, totpCode);
      
      if (isValid) {
        secureLog('2FA認証成功', { username, mode });
        
        if (mode === 'setup') {
          // セットアップ完了時はバックアップコードを表示
          setShowBackupCodes(true);
          setStep('enabled');
        } else {
          // 認証成功
          onSuccess(secret);
        }
      } else {
        setError('認証コードが正しくありません。再度確認してください。');
      }
    } catch (error) {
      secureLog('2FA認証エラー:', error);
      setError('認証処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // バックアップコード認証処理
  const handleBackupCodeVerify = async () => {
    if (!backupCodeInput) {
      setError('バックアップコードを入力してください。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await verifyBackupCode(backupCodeInput);
      
      if (isValid) {
        secureLog('バックアップコード認証成功', { username });
        onSuccess(existingSecret || '');
      } else {
        setError('バックアップコードが正しくありません。');
      }
    } catch (error) {
      secureLog('バックアップコード認証エラー:', error);
      setError('認証処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // セットアップ完了処理
  const handleSetupComplete = () => {
    if (totpSetup) {
      onSuccess(totpSetup.secret);
    }
  };

  const setupMFA = async () => {
    try {
      // TOTP設定を開始
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'MoneyTicket TOTP'
      });

      if (error) throw error;

      setQrCodeUrl(data.totp.qr_code);
      setStep('verify');
    } catch (error) {
      console.error('MFA設定エラー:', error);
    }
  };

  const verifyMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: 'factor-id', // 実際のfactor IDを使用
        challengeId: 'challenge-id', // 実際のchallenge IDを使用
        code: verificationCode
      });

      if (error) throw error;

      // バックアップコード生成
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );
      setBackupCodes(codes);
      setStep('enabled');
      onMFAEnabled();
    } catch (error) {
      console.error('MFA検証エラー:', error);
    }
  };

  if (mode === 'setup' && step === 'setup' && totpSetup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">2要素認証の設定</h3>
            <p className="text-sm text-gray-600 mt-2">アカウントのセキュリティを強化します</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={`otpauth://totp/MoneyTicket:${username}?secret=${totpSetup.secret}&issuer=MoneyTicket`}
                  size={256}
                  className="border rounded-lg shadow-sm bg-white p-4"
                />
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Google AuthenticatorまたはAuthy等の認証アプリでQRコードをスキャンしてください
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">手動入力用シークレットキー:</p>
              <code className="text-sm text-gray-800 break-all font-mono bg-white px-2 py-1 rounded border">
                {totpSetup.secret}
              </code>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                認証コード（6桁）
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono"
                placeholder="123456"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                認証アプリに表示された6桁のコードを入力してください
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleTotpVerify}
                disabled={loading || totpCode.length !== 6}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? '検証中...' : '認証コードを確認'}
              </button>
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'setup' && step === 'enabled' && totpSetup && showBackupCodes) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">バックアップコード</h3>
            <p className="text-sm text-gray-600 mt-2">認証アプリが使用できない場合に使用</p>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">重要</span>
              </div>
              <p className="text-sm text-yellow-700">
                これらのバックアップコードを安全な場所に保存してください。各コードは一度だけ使用できます。
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                {totpSetup.backupCodes.map((code, index) => (
                  <code key={index} className="text-sm text-gray-800 font-mono bg-white px-2 py-1 rounded border">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSetupComplete}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                設定完了
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'verify') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">2要素認証</h3>
            <p className="text-sm text-gray-600 mt-2">認証アプリのコードを入力してください</p>
          </div>

          <div className="space-y-6">
            {step === 'verify' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    認証コード（6桁）
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono"
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={verifyMFA}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {loading ? '認証中...' : '認証'}
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    キャンセル
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setStep('enabled')}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    バックアップコードを使用
                  </button>
                </div>
              </>
            )}

            {step === 'enabled' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    バックアップコード
                  </label>
                  <input
                    type="text"
                    value={backupCodeInput}
                    onChange={(e) => setBackupCodeInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono"
                    placeholder="1234-5678"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    設定時に保存したバックアップコードを入力してください
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleBackupCodeVerify}
                    disabled={loading || !backupCodeInput}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {loading ? '認証中...' : 'バックアップコードで認証'}
                  </button>
                  <button
                    onClick={() => setStep('verify')}
                    disabled={loading}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    戻る
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TwoFactorAuth; 