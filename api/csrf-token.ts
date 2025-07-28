import { NextApiRequest, NextApiResponse } from 'next';
import { CSRFProtection, CSRFTokenAPI } from '../server/security/csrf-protection';
import { v4 as uuidv4 } from 'uuid';

/**
 * CSRFトークン生成API
 * GET /api/csrf-token
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETリクエストのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッションIDの取得または生成
    let sessionId = req.cookies.sessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      
      // セッションIDをクッキーに設定
      res.setHeader('Set-Cookie', [
        `sessionId=${sessionId}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Path=/; Max-Age=3600`
      ]);
    }

    // クライアントIPの取得
    const clientIP = req.socket.remoteAddress || 
                    req.headers['x-forwarded-for'] as string ||
                    req.headers['x-real-ip'] as string;

    // CSRFトークンの生成
    const csrf = CSRFProtection.getInstance();
    const { token } = csrf.generateToken(sessionId, clientIP);

    // レスポンス生成（セキュアクッキーも設定）
    res.setHeader('Set-Cookie', [
      ...res.getHeaders()['set-cookie'] || [],
      `_csrf=${token}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Path=/; Max-Age=3600`
    ]);

    // JSON レスポンス
    res.status(200).json({
      csrfToken: token,
      sessionId: sessionId,
      expiresIn: 3600000, // 1時間
      timestamp: Date.now(),
      success: true
    });

    // 監査ログ
    console.log('CSRF token generated:', {
      sessionId: sessionId.substring(0, 8) + '...',
      clientIP: clientIP?.substring(0, 10) + '...',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    });

  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
}