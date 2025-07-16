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
    console.log('🔍 OTP認証開始');
    
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      res.status(400).json({ error: '電話番号と認証コードが必要です' });
      return;
    }

    console.log('📞 認証リクエスト:', { phoneNumber, otp: otp.substring(0, 2) + '****' });

    // 電話番号正規化
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('81')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+81' + normalizedPhone;
    }

    console.log('📲 正規化後:', normalizedPhone);

    // メモリからOTP取得
    global.otpStore = global.otpStore || new Map();
    const storedData = global.otpStore.get(normalizedPhone);
    
    if (!storedData) {
      console.log('❌ OTP not found');
      res.status(400).json({ error: '認証コードが見つかりません。新しいコードを取得してください。' });
      return;
    }

    // 期限チェック
    if (Date.now() > storedData.expiresAt) {
      console.log('❌ OTP expired');
      global.otpStore.delete(normalizedPhone);
      res.status(400).json({ error: '認証コードの有効期限が切れています。新しいコードを取得してください。' });
      return;
    }

    // 試行回数チェック
    if (storedData.attempts >= 5) {
      console.log('❌ Too many attempts');
      global.otpStore.delete(normalizedPhone);
      res.status(400).json({ error: '認証コードの入力回数が上限に達しました。新しいコードを取得してください。' });
      return;
    }

    // OTP検証
    if (storedData.otp !== otp) {
      storedData.attempts++;
      const remainingAttempts = 5 - storedData.attempts;
      console.log(`❌ OTP不一致: 残り${remainingAttempts}回`);
      
      res.status(400).json({ 
        error: `認証コードが正しくありません。残り${remainingAttempts}回入力できます。` 
      });
      return;
    }

    console.log('✅ OTP認証成功');

    // 認証成功時の処理
    global.otpStore.delete(normalizedPhone); // 使用済みOTPを削除

    // セッション設定
    res.setHeader('Set-Cookie', [
      `session_verified=true; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`,
      `phone_verified=${normalizedPhone}; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`
    ]);
    
    res.status(200).json({ 
      success: true,
      message: '認証が完了しました'
    });

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

  } catch (error) {
    console.error('💥 OTP認証エラー:', error);
    res.status(500).json({ error: '認証に失敗しました' });
  }
}