import type { VercelRequest, VercelResponse } from '@vercel/node';

// OTP一時保存（send-otpと同じ構造）
interface OTPData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// グローバルストレージ（本来はRedisなど外部ストレージを使用）
declare global {
  var otpStore: Map<string, OTPData> | undefined;
}

// グローバルストレージの初期化
if (!global.otpStore) {
  global.otpStore = new Map<string, OTPData>();
}

const otpStore = global.otpStore;

// 簡易CSRF検証（Vercel対応）
function validateCSRF(req: VercelRequest): boolean {
  const csrfToken = req.headers['x-csrf-token'] as string;
  const cookieToken = req.cookies?._csrf;
  
  return !!(csrfToken && cookieToken && csrfToken === cookieToken);
}

/**
 * OTP検証API（CSRF保護付き）
 * POST /api/verify-otp
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // CSRFトークンの検証
    if (!validateCSRF(req)) {
      console.warn('OTP verification CSRF validation failed');
      return res.status(403).json({ 
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID'
      });
    }

    const { phoneNumber, otp } = req.body;

    // 入力値の検証
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    // 電話番号の正規化
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (!/^(090|080|070)\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // OTPの形式チェック
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    // クライアントIPの取得
    const clientIP = req.headers['x-forwarded-for'] as string ||
                    req.headers['x-real-ip'] as string ||
                    'unknown';

    // 保存されたOTPデータを取得
    const storedOTPData = otpStore.get(normalizedPhone);
    
    if (!storedOTPData) {
      return res.status(400).json({ 
        error: 'OTP not found or expired',
        code: 'OTP_NOT_FOUND'
      });
    }

    // 有効期限チェック
    if (Date.now() > storedOTPData.expiresAt) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({ 
        error: 'OTP has expired',
        code: 'OTP_EXPIRED'
      });
    }

    // 試行回数チェック（5回まで）
    if (storedOTPData.attempts >= 5) {
      otpStore.delete(normalizedPhone);
      return res.status(429).json({ 
        error: 'Too many attempts',
        code: 'TOO_MANY_ATTEMPTS'
      });
    }

    // OTP照合
    const isValidOTP = storedOTPData.otp === otp;

    if (!isValidOTP) {
      // 失敗回数を増加
      storedOTPData.attempts += 1;
      otpStore.set(normalizedPhone, storedOTPData);
      
      console.log('OTP verification failed:', {
        phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
        attempts: storedOTPData.attempts,
        ip: clientIP.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({ 
        error: 'Invalid OTP',
        code: 'INVALID_OTP',
        attemptsRemaining: 5 - storedOTPData.attempts
      });
    }

    // 認証成功 - OTPを削除
    otpStore.delete(normalizedPhone);

    console.log('OTP verification development info:', {
      phone: normalizedPhone,
      otp: otp,
      isValid: isValidOTP,
      storedOTP: storedOTPData.otp
    });

    // 成功ログ
    console.log('OTP verification successful:', {
      phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
      ip: clientIP.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber: normalizedPhone
    });

  } catch (error) {
    console.error('Verify OTP API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}