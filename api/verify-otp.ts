import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// OTP Cookie管理（インライン実装）
const ENCRYPTION_KEY = process.env.OTP_ENCRYPTION_KEY || 'default-otp-encryption-key-32bytes';

function decryptOTP(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt OTP data');
  }
}

function getOTPFromCookie(req: VercelRequest, phoneNumber: string): OTPData | null {
  try {
    const otpCookie = req.cookies?._otp_data;
    if (!otpCookie) {
      return null;
    }
    const decrypted = decryptOTP(otpCookie);
    const data = JSON.parse(decrypted);
    return data[phoneNumber] || null;
  } catch (error) {
    console.error('Failed to retrieve OTP from cookie:', error);
    return null;
  }
}

function removeOTPFromCookie(res: VercelResponse, req: VercelRequest, phoneNumber: string): void {
  try {
    const otpCookie = req.cookies?._otp_data;
    if (!otpCookie) {
      return;
    }
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=0`;
    res.setHeader('Set-Cookie', `_otp_data=; ${cookieOptions}`);
  } catch (error) {
    console.error('Failed to remove OTP from cookie:', error);
  }
}

function encryptOTP(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt OTP data');
  }
}

function updateOTPInCookie(res: VercelResponse, req: VercelRequest, phoneNumber: string, otpData: OTPData): void {
  try {
    const otpCookie = req.cookies?._otp_data;
    if (!otpCookie) {
      throw new Error('OTP cookie not found');
    }
    const decrypted = decryptOTP(otpCookie);
    const data = JSON.parse(decrypted);
    data[phoneNumber] = otpData;
    const encrypted = encryptOTP(JSON.stringify(data));
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=300`;
    res.setHeader('Set-Cookie', `_otp_data=${encrypted}; ${cookieOptions}`);
  } catch (error) {
    console.error('Failed to update OTP in cookie:', error);
    throw new Error('Failed to update OTP data');
  }
}

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

    // 保存されたOTPデータを取得（メモリとクッキーの両方から試行）
    let storedOTPData = otpStore.get(normalizedPhone);
    
    // メモリに無い場合はクッキーから取得
    if (!storedOTPData) {
      storedOTPData = getOTPFromCookie(req, normalizedPhone);
    }
    
    if (!storedOTPData) {
      console.error('OTP not found for phone:', {
        phone: normalizedPhone.substring(0, 3) + '****',
        memoryStoreSize: otpStore.size,
        hasCookie: !!req.cookies?._otp_data
      });
      
      return res.status(400).json({ 
        error: 'OTP not found or expired',
        code: 'OTP_NOT_FOUND'
      });
    }

    // 有効期限チェック
    if (Date.now() > storedOTPData.expiresAt) {
      otpStore.delete(normalizedPhone);
      removeOTPFromCookie(res, req, normalizedPhone);
      return res.status(400).json({ 
        error: 'OTP has expired',
        code: 'OTP_EXPIRED'
      });
    }

    // 試行回数チェック（5回まで）
    if (storedOTPData.attempts >= 5) {
      otpStore.delete(normalizedPhone);
      removeOTPFromCookie(res, req, normalizedPhone);
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
      
      try {
        updateOTPInCookie(res, req, normalizedPhone, storedOTPData);
      } catch (updateError) {
        console.error('Failed to update OTP attempts in cookie:', updateError);
      }
      
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
    removeOTPFromCookie(res, req, normalizedPhone);

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