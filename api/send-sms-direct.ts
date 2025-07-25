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
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: '電話番号が必要です' });
    }

    // Twilio設定
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(500).json({ 
        error: 'Twilio設定が不完全です',
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasFromNumber: !!fromNumber
      });
    }

    // 電話番号の正規化
    let normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // OTP生成
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Twilio SDKをインポート
    console.log('Importing Twilio SDK...');
    const twilio = (await import('twilio')).default;
    console.log('Twilio SDK imported successfully');

    // Twilioクライアント作成
    const client = twilio(accountSid, authToken);

    // SMS送信
    console.log('Sending SMS to:', normalizedPhone);
    const message = await client.messages.create({
      body: `【タスカル】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`,
      from: fromNumber,
      to: normalizedPhone
    });

    console.log('SMS sent successfully:', message.sid);

    res.status(200).json({
      success: true,
      messageSid: message.sid,
      otp: otp // デバッグ用（本番では削除）
    });

  } catch (error: any) {
    console.error('SMS送信エラー:', error);
    res.status(500).json({
      error: 'SMS送信に失敗しました',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}