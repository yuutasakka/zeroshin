import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Twilio設定
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// OTP一時保存（メモリ内、本番環境ではRedisなど使用）
interface OTPData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// グローバルストレージ（Vercel Functions間で共有）
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
  
  // 基本的な検証: ヘッダーとクッキーのトークンが一致するか
  return csrfToken && cookieToken && csrfToken === cookieToken;
}

/**
 * SMS OTP送信API（CSRF保護付き）
 * POST /api/send-otp
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
      console.warn('SMS OTP CSRF validation failed');
      return res.status(403).json({ 
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID'
      });
    }

    const { phoneNumber } = req.body;

    // 入力値の検証
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // 電話番号の正規化と検証
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (!/^(090|080|070)\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // クライアントIPの取得（レート制限用）
    const clientIP = req.headers['x-forwarded-for'] as string ||
                    req.headers['x-real-ip'] as string ||
                    'unknown';

    // OTPの生成（6桁）
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 300000); // 5分後

    // 国際電話番号形式に変換（日本の電話番号）
    const internationalPhone = '+81' + normalizedPhone.substring(1);

    // Twilio SMS送信
    let smsSuccess = false;
    let smsError = null;

    if (accountSid && authToken && twilioPhoneNumber) {
      try {
        // Twilio REST APIを使用してSMS送信
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: internationalPhone,
            Body: `【タスカル】認証コード: ${otp}\n\nこのコードは5分間有効です。第三者には絶対に教えないでください。`,
          }),
        });

        if (response.ok) {
          const twilioResponse = await response.json();
          smsSuccess = true;
          console.log('Twilio SMS sent successfully:', {
            sid: twilioResponse.sid,
            phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
            status: twilioResponse.status
          });
        } else {
          const errorData = await response.json();
          smsError = errorData.message || 'Twilio API error';
          console.error('Twilio SMS failed:', {
            status: response.status,
            error: errorData
          });
        }
      } catch (twilioErr: any) {
        smsError = twilioErr.message || 'SMS送信エラー';
        console.error('Twilio SMS error:', twilioErr);
      }
    } else {
      console.warn('Twilio credentials not configured');
      smsError = 'SMS設定が不完全です';
    }

    // 開発環境またはSMS失敗時はコンソールに出力
    if (process.env.NODE_ENV !== 'production' || !smsSuccess) {
      console.log('Development SMS OTP:', {
        phone: normalizedPhone,
        otp: otp,
        expires: expiresAt,
        smsSuccess,
        smsError
      });
    }

    // 成功ログ
    console.log('SMS OTP processing:', {
      phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
      ip: clientIP.substring(0, 10) + '...',
      timestamp: new Date().toISOString(),
      twilioSuccess: smsSuccess
    });

    // 本番環境でSMS送信に失敗した場合はエラーを返す
    if (process.env.NODE_ENV === 'production' && !smsSuccess) {
      return res.status(500).json({
        error: smsError || 'SMS送信に失敗しました',
        code: 'SMS_SEND_FAILED'
      });
    }

    // OTPをストレージに保存
    otpStore.set(normalizedPhone, {
      otp: otp,
      expiresAt: expiresAt.getTime(),
      attempts: 0
    });

    res.status(200).json({
      success: true,
      message: smsSuccess ? 'SMS sent successfully' : 'OTP generated (development mode)',
      expiresIn: 300000, // 5分
      twilioEnabled: !!smsSuccess
    });

  } catch (error) {
    console.error('Send OTP API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}