import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // セキュリティ: 開発環境またはローカルからのアクセスのみ許可
  const origin = req.headers.origin || '';
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isLocal && !isDev) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const envCheck = {
    twilio: {
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
      accountSidPrefix: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 6) + '...' : 'not set',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'not set'
    },
    supabase: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'not set',
      viteUrlValue: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.substring(0, 30) + '...' : 'not set'
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL
    }
  };

  res.status(200).json(envCheck);
}