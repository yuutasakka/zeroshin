import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// デバッグ用のログ関数
function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CSRF-TOKEN] ${message}`, data || '');
  }
}

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
  debugLog('CSRF token request received', { method: req.method, url: req.url });
  
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
    debugLog('Method not allowed', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    debugLog('Generating CSRF token');
    
    // セッションIDの取得または生成
    let sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      debugLog('Generated new session ID');
    }

    // CSRFトークンの生成
    const csrfToken = generateCSRFToken();
    debugLog('Generated CSRF token');

    // セキュアクッキーの設定
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=3600`;
    
    res.setHeader('Set-Cookie', [
      `sessionId=${sessionId}; ${cookieOptions}`,
      `_csrf=${csrfToken}; ${cookieOptions}`
    ]);

    const responseData = {
      csrfToken,
      sessionId,
      expiresIn: 3600000, // 1時間
      timestamp: Date.now(),
      success: true
    };

    debugLog('Sending successful response', responseData);

    // JSON レスポンス
    res.status(200).json(responseData);

  } catch (error) {
    debugLog('CSRF token generation error', error);
    console.error('CSRF token generation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
}