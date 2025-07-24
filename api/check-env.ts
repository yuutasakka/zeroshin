import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // セキュリティのため、本番環境では無効化
  if (process.env.NODE_ENV === 'production' && !req.headers.authorization?.includes('debug-token')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // 環境変数の状態をチェック
  const envCheck = {
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    has_twilio: {
      account_sid: !!process.env.TWILIO_ACCOUNT_SID,
      auth_token: !!process.env.TWILIO_AUTH_TOKEN,
      phone_number: !!process.env.TWILIO_PHONE_NUMBER,
      account_sid_length: process.env.TWILIO_ACCOUNT_SID?.length || 0,
      auth_token_length: process.env.TWILIO_AUTH_TOKEN?.length || 0,
      phone_number_value: process.env.TWILIO_PHONE_NUMBER?.substring(0, 5) || 'not set'
    },
    has_supabase: {
      url: !!process.env.VITE_SUPABASE_URL,
      anon_key: !!process.env.VITE_SUPABASE_ANON_KEY,
      url_value: process.env.VITE_SUPABASE_URL?.substring(0, 30) || 'not set',
      anon_key_length: process.env.VITE_SUPABASE_ANON_KEY?.length || 0
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(envCheck);
}