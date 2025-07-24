import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 環境変数チェック
    const twilioConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };

    console.log('Twilio config check:', {
      hasAccountSid: !!twilioConfig.accountSid,
      hasAuthToken: !!twilioConfig.authToken,
      hasPhoneNumber: !!twilioConfig.phoneNumber,
      accountSidLength: twilioConfig.accountSid?.length || 0,
      phoneNumberFormat: twilioConfig.phoneNumber?.substring(0, 5) || 'not set'
    });

    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber) {
      res.status(500).json({
        error: 'Twilio設定が不完全です',
        details: {
          hasAccountSid: !!twilioConfig.accountSid,
          hasAuthToken: !!twilioConfig.authToken,
          hasPhoneNumber: !!twilioConfig.phoneNumber
        }
      });
      return;
    }

    // Twilio SDKのロードテスト
    let twilio;
    try {
      const twilioModule = await import('twilio');
      twilio = twilioModule.default;
      console.log('Twilio SDK loaded successfully');
    } catch (error) {
      console.error('Failed to load Twilio SDK:', error);
      res.status(500).json({
        error: 'Twilio SDKのロードに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }

    // Twilioクライアントの作成
    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

    // テストOTPの生成
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({ error: '電話番号が必要です' });
      return;
    }

    // 電話番号の正規化
    let normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    console.log('Sending SMS to:', normalizedPhone);

    // SMS送信
    const message = await client.messages.create({
      body: `【タスカル】認証コード: ${otp}\n\n※5分間有効です。`,
      from: twilioConfig.phoneNumber,
      to: normalizedPhone
    });

    console.log('SMS sent successfully:', message.sid);

    res.status(200).json({
      success: true,
      messageSid: message.sid,
      otp: otp // デバッグ用（本番では削除）
    });

  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      error: 'SMS送信に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}