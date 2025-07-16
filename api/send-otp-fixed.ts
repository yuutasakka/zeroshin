import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定 - 本番環境用
  const allowedOrigins = [
    'https://moneyticket.vercel.app',
    'https://moneyticket-git-main-sakkayuta.vercel.app',
    'https://moneyticket01-10gswrw2q-seai0520s-projects.vercel.app',
    'https://moneyticket01-rogabfsul-seai0520s-projects.vercel.app',
    'https://moneyticket01-18dyp3oo0-seai0520s-projects.vercel.app',
    'https://moneyticket01-jba8tb9fl-seai0520s-projects.vercel.app',
    'https://moneyticket01-5dbezddft-seai0520s-projects.vercel.app',
    'https://moneyticket01-8hq0b6f3c-seai0520s-projects.vercel.app',
    'https://moneyticket01-49mjpk0jf-seai0520s-projects.vercel.app',
    'https://moneyticket01-ixkbvpo36-seai0520s-projects.vercel.app',
    'https://moneyticket01-knwbw1xhr-seai0520s-projects.vercel.app',
    'https://moneyticket01-jaskh9loi-seai0520s-projects.vercel.app',
    'https://moneyticket01-fru2t4as7-seai0520s-projects.vercel.app',
    'https://moneyticket01-5wrbneqpz-seai0520s-projects.vercel.app',
    'https://moneyticket01-iz92wyew3-seai0520s-projects.vercel.app',
    'https://moneyticket01-pbcipwr4q-seai0520s-projects.vercel.app',
    'https://moneyticket01-52157o3m3-seai0520s-projects.vercel.app',
    'https://moneyticket01-3k0j3cwan-seai0520s-projects.vercel.app',
    'https://moneyticket01-ep83ycdvf-seai0520s-projects.vercel.app',
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
    console.log('📱 SMS送信開始');
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      console.log('❌ 電話番号が未設定');
      res.status(400).json({ error: '電話番号が必要です' });
      return;
    }

    console.log('📞 電話番号受信:', phoneNumber);

    // Twilio設定確認
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };

    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      console.log('❌ Twilio設定不完全');
      res.status(500).json({ error: 'SMS送信サービスが利用できません' });
      return;
    }

    // OTP生成
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 OTP生成:', otp.substring(0, 2) + '****');

    // 電話番号正規化（Twilioテスト成功形式に合わせて修正）
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    console.log('🔍 正規化前:', phoneNumber, '→', normalizedPhone);
    
    if (normalizedPhone.startsWith('0')) {
      // 090-5704-4893 → 09057044893 → +819057044893
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('81')) {
      // 81で始まる場合は+を追加
      normalizedPhone = '+' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('+')) {
      // +がない場合は+81を追加
      normalizedPhone = '+81' + normalizedPhone;
    }

    console.log('📲 正規化後:', normalizedPhone);

    // 電話番号検証
    const phoneRegex = /^\+81[1-9]\d{8,9}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      res.status(400).json({ error: '無効な電話番号形式です' });
      return;
    }

    // OTPをSupabaseに永続化保存（本番環境対応）
    try {
      // Supabase Admin接続（環境変数から直接）
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // 既存のOTPを削除
      await supabaseAdmin
        .from('sms_verifications')
        .delete()
        .eq('phone_number', normalizedPhone);

      // 新しいOTPを保存
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      const { error } = await supabaseAdmin
        .from('sms_verifications')
        .insert({
          phone_number: normalizedPhone,
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          request_ip: req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown'
        });

      if (error) {
        console.error('❌ Supabase OTP保存エラー:', error);
        // フォールバック: メモリに保存
        global.otpStore = global.otpStore || new Map();
        global.otpStore.set(normalizedPhone, {
          otp: otp,
          expiresAt: Date.now() + 5 * 60 * 1000,
          attempts: 0
        });
        console.log('💾 フォールバック: メモリに保存');
      } else {
        console.log('✅ Supabase OTP保存成功');
      }
    } catch (dbError) {
      console.error('⚠️ DB接続失敗、メモリにフォールバック:', dbError);
      global.otpStore = global.otpStore || new Map();
      global.otpStore.set(normalizedPhone, {
        otp: otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
      });
    }

    // Twilio SMS送信
    try {
      console.log('📤 Twilio SDK試行');
      const twilio = require('twilio');
      const client = twilio(config.accountSid, config.authToken);
      
      const message = await client.messages.create({
        body: `【AI ConectX】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`,
        from: config.phoneNumber,
        to: normalizedPhone
      });
      
      console.log('✅ Twilio SDK送信成功:', { sid: message.sid, status: message.status });
      
      res.status(200).json({ 
        success: true,
        message: 'SMS送信が完了しました'
      });
      
    } catch (sdkError) {
      console.log('⚠️ SDK失敗、Direct API試行:', sdkError.message);
      
      // Direct API試行
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

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Direct API失敗:', errorData);
        throw new Error(`Direct API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Direct API送信成功:', { sid: result.sid });
      
      res.status(200).json({ 
        success: true,
        message: 'SMS送信が完了しました'
      });
    }

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

  } catch (error) {
    console.error('💥 SMS送信エラー:', error);
    res.status(500).json({ error: 'SMS送信に失敗しました' });
  }
}