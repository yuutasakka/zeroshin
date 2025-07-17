import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// シンプルなSMS送信API（デバッグ用）
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Simple SMS] リクエスト開始');
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: '電話番号が必要です' });
    }

    console.log('[Simple SMS] 電話番号受信:', phoneNumber);

    // Twilio設定確認
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      console.error('[Simple SMS] Twilio設定不完全');
      return res.status(500).json({ 
        error: 'SMS送信サービスが利用できません',
        debug: {
          hasAccountSid: !!accountSid,
          hasAuthToken: !!authToken,
          hasPhoneNumber: !!twilioPhone
        }
      });
    }

    // OTP生成
    const otp = crypto.randomInt(100000, 999999).toString();
    console.log('[Simple SMS] OTP生成完了');

    // 電話番号正規化
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    
    if (!normalizedPhone.match(/^(090|080|070)\d{8}$/)) {
      return res.status(400).json({ error: '正しい電話番号を入力してください' });
    }
    
    // +81形式に変換
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    }

    console.log('[Simple SMS] 正規化後の電話番号:', normalizedPhone);

    // Twilio SDK を使用してSMS送信
    try {
      console.log('[Simple SMS] Twilio SDK初期化中...');
      const twilio = await import('twilio');
      const client = twilio.default(accountSid, authToken);
      
      console.log('[Simple SMS] SMS送信中...');
      const message = await client.messages.create({
        body: `【AI ConectX】認証コード: ${otp}\n\n※5分間有効です。`,
        from: twilioPhone,
        to: normalizedPhone
      });
      
      console.log('[Simple SMS] SMS送信成功:', message.sid);
      
      // メモリにOTPを保存（簡易版）
      if (!global.otpStore) {
        global.otpStore = new Map();
      }
      global.otpStore.set(normalizedPhone, {
        otp: otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'SMS送信が完了しました',
        debug: {
          messageSid: message.sid,
          status: message.status
        }
      });
      
    } catch (twilioError: any) {
      console.error('[Simple SMS] Twilioエラー:', twilioError);
      return res.status(500).json({ 
        error: 'SMS送信に失敗しました',
        debug: {
          errorCode: twilioError.code,
          errorMessage: twilioError.message,
          moreInfo: twilioError.moreInfo
        }
      });
    }
    
  } catch (error: any) {
    console.error('[Simple SMS] 予期しないエラー:', error);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました',
      debug: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      }
    });
  }
}