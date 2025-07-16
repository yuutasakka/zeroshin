import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  const allowedOrigins = [
    'https://moneyticket01-fru2t4as7-seai0520s-projects.vercel.app',
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🧪 シンプルSMSテスト開始');
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      console.log('❌ 電話番号が未設定');
      res.status(400).json({ error: '電話番号が必要です' });
      return;
    }

    console.log('📱 電話番号受信:', phoneNumber);

    // Step 1: 環境変数確認
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };

    console.log('🔧 Twilio設定状況:', {
      hasAccountSid: !!config.accountSid,
      hasAuthToken: !!config.authToken,
      hasPhoneNumber: !!config.phoneNumber,
      accountSidPrefix: config.accountSid ? config.accountSid.substring(0, 4) + '...' : 'なし'
    });

    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      console.log('❌ Twilio設定不完全');
      res.status(500).json({ error: 'Twilio設定が不完全です' });
      return;
    }

    // Step 2: OTP生成（シンプル）
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 OTP生成完了:', otp.substring(0, 2) + '****');

    // Step 3: 電話番号正規化
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('81')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+81' + normalizedPhone;
    }

    console.log('📲 正規化後電話番号:', normalizedPhone);

    // Step 4: Twilio SDK使用試行
    try {
      console.log('📤 Twilio SDK試行開始');
      const twilio = (await import('twilio')).default;
      const client = twilio(config.accountSid, config.authToken);
      
      const message = await client.messages.create({
        body: `【AI ConectX】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`,
        from: config.phoneNumber,
        to: normalizedPhone
      });
      
      console.log('✅ Twilio SDK送信成功:', { sid: message.sid, status: message.status });
      
      res.status(200).json({ 
        success: true, 
        message: 'SMS送信成功（SDK）',
        debug: {
          sid: message.sid,
          status: message.status,
          to: normalizedPhone,
          method: 'SDK'
        }
      });
      
    } catch (sdkError: any) {
      console.log('⚠️ Twilio SDK失敗、Direct API試行:', sdkError.message);
      
      // Step 5: Direct API試行
      try {
        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
        
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: config.phoneNumber,
            To: normalizedPhone,
            Body: `【AI ConectX】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`
          })
        });

        console.log('📡 Direct API応答:', { status: response.status, ok: response.ok });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Direct API エラー:', errorData);
          throw new Error(`Direct API error: ${response.status} ${errorData}`);
        }
        
        const result = await response.json();
        console.log('✅ Direct API送信成功:', { sid: result.sid, status: result.status });
        
        res.status(200).json({ 
          success: true, 
          message: 'SMS送信成功（Direct API）',
          debug: {
            sid: result.sid,
            status: result.status,
            to: normalizedPhone,
            method: 'Direct API'
          }
        });
        
      } catch (apiError: any) {
        console.error('💥 Direct API も失敗:', apiError.message);
        res.status(500).json({ 
          error: 'SMS送信失敗', 
          details: apiError.message,
          debug: {
            sdkError: sdkError.message,
            apiError: apiError.message
          }
        });
      }
    }

  } catch (error: any) {
    console.error('🚨 予期しないエラー:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error' 
    });
  }
}