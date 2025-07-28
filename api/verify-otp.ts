import type { VercelRequest, VercelResponse } from '@vercel/node';

// 簡易CSRF検証（Vercel対応）
function validateCSRF(req: VercelRequest): boolean {
  const csrfToken = req.headers['x-csrf-token'] as string;
  const cookieToken = req.cookies?._csrf;
  
  return csrfToken && cookieToken && csrfToken === cookieToken;
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

    // 開発環境では任意の6桁数字を受け入れ
    const isValidOTP = process.env.NODE_ENV === 'production' ? 
                      false : // 本番環境では実際の検証が必要
                      /^\d{6}$/.test(otp);

    console.log('Development OTP verification:', {
      phone: normalizedPhone,
      otp: otp,
      isValid: isValidOTP
    });

    if (!isValidOTP) {
      return res.status(400).json({ 
        error: 'Invalid OTP',
        code: 'INVALID_OTP'
      });
    }

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
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}