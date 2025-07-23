import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定 - 本番環境のドメインのみ許可
  const allowedOrigins = [
    'https://moneyticket01.vercel.app',
    'https://moneyticket01-*.vercel.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : ''
  ].filter(Boolean);
  
  const origin = req.headers.origin || '';
  if (allowedOrigins.some(allowed => origin.match(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 環境変数の存在確認（値は表示しない）
  const envCheck = {
    runtime: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'not set',
    vercel: {
      url: process.env.VERCEL_URL || 'not set',
      region: process.env.VERCEL_REGION || 'not set',
      env: process.env.VERCEL_ENV || 'not set'
    },
    twilioConfig: {
      accountSid: !!process.env.TWILIO_ACCOUNT_SID,
      authToken: !!process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: !!process.env.TWILIO_PHONE_NUMBER
    },
    supabaseConfig: {
      url: !!process.env.VITE_SUPABASE_URL,
      anonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    securityConfig: {
      encryptionKey: !!process.env.ENCRYPTION_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
      sessionSecret: !!process.env.SESSION_SECRET,
      csrfSecret: !!process.env.CSRF_SECRET
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(envCheck);
}