import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// 簡易CSRF実装（Vercel対応）
function generateCSRFToken(): string {
  return Buffer.from(uuidv4() + Date.now()).toString('base64').substring(0, 32);
}

/**
 * CSRFトークン生成API
 * GET /api/csrf-token
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // GETリクエストのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッションIDの取得または生成
    let sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // CSRFトークンの生成
    const csrfToken = generateCSRFToken();

    // セキュアクッキーの設定
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=3600`;
    
    res.setHeader('Set-Cookie', [
      `sessionId=${sessionId}; ${cookieOptions}`,
      `_csrf=${csrfToken}; ${cookieOptions}`
    ]);

    // JSON レスポンス
    res.status(200).json({
      csrfToken,
      sessionId,
      expiresIn: 3600000, // 1時間
      timestamp: Date.now(),
      success: true
    });

  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
}