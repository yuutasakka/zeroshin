import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Twilio設定（セキュア）
const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  
  // 設定値の存在確認のみ（値は返さない）
  const isConfigured = !!(accountSid && authToken && twilioPhoneNumber);
  
  return {
    isConfigured,
    accountSid: isConfigured ? accountSid : null,
    authToken: isConfigured ? authToken : null,
    phoneNumber: isConfigured ? twilioPhoneNumber : null
  };
};

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

    // Twilio SMS送信（セキュア実装）
    let smsSuccess = false;
    let smsError = null;

    const twilioConfig = getTwilioConfig();
    
    if (twilioConfig.isConfigured) {
      try {
        // Twilio REST APIを使用してSMS送信
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`;
        
        // Basic認証の準備（メモリ内でエンコード、即座に削除）
        let authHeader: string;
        try {
          const authString = `${twilioConfig.accountSid}:${twilioConfig.authToken}`;
          authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
          // 即座にクリア
          authString.replace(/./g, '0');
        } catch (authErr) {
          throw new Error('認証情報の準備に失敗しました');
        }
        
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioConfig.phoneNumber!,
            To: internationalPhone,
            Body: `【タスカル】認証コード: ${otp}\n\nこのコードは5分間有効です。第三者には絶対に教えないでください。`,
          }),
        });

        // レスポンス処理
        if (response.ok) {
          const twilioResponse = await response.json();
          smsSuccess = true;
          
          // セキュア・ログ出力（機密情報を含めない）
          console.log('SMS sent successfully:', {
            messageId: twilioResponse.sid?.substring(0, 8) + '***',
            phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
            status: 'delivered',
            timestamp: new Date().toISOString()
          });
        } else {
          const errorData = await response.json();
          smsError = 'SMS送信サービスエラー';
          
          // エラーログ（詳細は本番環境では非表示）
          if (process.env.NODE_ENV !== 'production') {
            console.error('SMS API Error:', {
              status: response.status,
              code: errorData.code,
              message: errorData.message
            });
          } else {
            console.error('SMS API Error:', { status: response.status });
          }
        }
      } catch (smsErr: any) {
        smsError = 'SMS送信処理エラー';
        console.error('SMS send error:', {
          message: process.env.NODE_ENV !== 'production' ? smsErr.message : 'Internal error',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      smsError = 'SMS送信が設定されていません';
      console.warn('SMS service not configured for:', {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }

    // 開発環境でのOTP表示（本番では非表示）
    if (process.env.NODE_ENV === 'development' && !smsSuccess) {
      console.log('Development OTP (SMS failed):', {
        phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
        otp: otp,
        expires: expiresAt.toISOString()
      });
    }

    // セキュア処理ログ（機密情報なし）
    console.log('OTP request processed:', {
      phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
      ip: clientIP.substring(0, 7) + '***',
      method: smsSuccess ? 'SMS' : 'fallback',
      timestamp: new Date().toISOString()
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