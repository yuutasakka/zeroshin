import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // クッキーから認証状態を確認
    const cookies = req.headers.cookie;
    const sessionVerified = cookies?.includes('session_verified=true');
    const phoneVerified = cookies?.match(/phone_verified=([^;]*)/)?.[1];

    if (sessionVerified && phoneVerified) {
      res.status(200).json({ 
        authenticated: true,
        user: {
          phoneNumber: phoneVerified,
          lastActivity: Date.now()
        }
      });
    } else {
      res.status(200).json({ 
        authenticated: false,
        user: null 
      });
    }

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  } catch (error) {
    console.error('Auth check API error:', error);
    res.status(500).json({ error: '認証状態の確認に失敗しました' });
  }
}