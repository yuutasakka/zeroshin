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
    console.log('🔍 [test-sms-simple] Starting test...');
    
    // 環境変数チェック
    const twilioConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };

    console.log('🔍 [test-sms-simple] Twilio config:', {
      hasAccountSid: !!twilioConfig.accountSid,
      hasAuthToken: !!twilioConfig.authToken,
      hasPhoneNumber: !!twilioConfig.phoneNumber,
      accountSidPrefix: twilioConfig.accountSid ? twilioConfig.accountSid.substring(0, 4) + '...' : 'missing',
      phoneNumber: twilioConfig.phoneNumber || 'missing'
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

    console.log('🔍 [test-sms-simple] Normalized phone:', normalizedPhone);

    // Twilio Direct API使用
    const auth = Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64');
    
    console.log('🔍 [test-sms-simple] Calling Twilio API...');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: twilioConfig.phoneNumber,
        To: normalizedPhone,
        Body: `【タスカル】テストSMS: ${new Date().toLocaleTimeString('ja-JP')}`
      })
    });

    console.log('🔍 [test-sms-simple] Twilio response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [test-sms-simple] Twilio error:', errorText);
      res.status(500).json({
        error: 'SMS送信に失敗しました',
        twilioStatus: response.status,
        twilioError: errorText
      });
      return;
    }

    const result = await response.json();
    console.log('✅ [test-sms-simple] SMS sent successfully:', result.sid);

    res.status(200).json({
      success: true,
      messageSid: result.sid,
      status: result.status
    });

  } catch (error) {
    console.error('❌ [test-sms-simple] Error:', error);
    res.status(500).json({
      error: 'SMS送信に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}