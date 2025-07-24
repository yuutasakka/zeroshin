import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  // セキュリティ強化: 特定のオリジンのみ許可
  const allowedOrigins = [
    'https://moneyticket.vercel.app',
    'https://moneyticket-git-main-sakkayuta.vercel.app',
    'https://moneyticket-git-main-seai0520s-projects.vercel.app',
    'https://moneyticket01-10gswrw2q-seai0520s-projects.vercel.app',
    'https://moneyticket01-rogabfsul-seai0520s-projects.vercel.app',
    'https://moneyticket01-18dyp3oo0-seai0520s-projects.vercel.app',
    'https://moneyticket01.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // セキュリティヘッダー設定（レスポンスの前に設定）
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

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

  } catch (error) {
    console.error('Auth check API error:', error);
    res.status(500).json({ error: '認証状態の確認に失敗しました' });
  }
}