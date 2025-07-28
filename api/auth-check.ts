import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 認証状態チェックAPI
 * GET /api/auth-check
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETリクエストのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッションIDがあるかチェック
    const sessionId = req.cookies?.sessionId;
    const otpData = req.cookies?._otp_data;
    
    // 簡易的な認証チェック（実際の認証ロジックは別途実装）
    const authenticated = !!(sessionId && otpData);
    
    res.status(200).json({
      authenticated,
      user: authenticated ? { phoneNumber: null } : null,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      authenticated: false,
      user: null
    });
  }
}