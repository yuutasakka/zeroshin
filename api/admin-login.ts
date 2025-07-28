import type { VercelRequest, VercelResponse } from '@vercel/node';

// 簡易CSRF検証（Vercel対応）
function validateCSRF(req: VercelRequest): boolean {
  const csrfToken = req.headers['x-csrf-token'] as string;
  const cookieToken = req.cookies?._csrf;
  
  return !!(csrfToken && cookieToken && csrfToken === cookieToken);
}

/**
 * 管理画面ログインAPI（CSRF保護付き）
 * POST /api/admin-login
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // CSRFトークンの検証
    if (!validateCSRF(req)) {
      console.warn('Admin login CSRF validation failed');
      return res.status(403).json({ 
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID'
      });
    }

    const { email, password } = req.body;

    // 入力値の検証
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // クライアントIPの取得
    const clientIP = req.headers['x-forwarded-for'] as string ||
                    req.headers['x-real-ip'] as string ||
                    'unknown';

    // 開発環境での簡易認証チェック
    const isValidCredentials = email === 'admin@example.com' && password === 'admin123';

    if (!isValidCredentials) {
      console.warn('Admin login attempt failed:', {
        email: email.substring(0, 3) + '***',
        ip: clientIP.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({ 
        error: '認証に失敗しました',
        code: 'AUTH_FAILED'
      });
    }

    // ログイン成功時の監査ログ
    console.log('Admin login successful:', {
      email: email.substring(0, 3) + '***',
      ip: clientIP.substring(0, 10) + '...',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    });

    // セッション情報をレスポンス
    res.status(200).json({
      success: true,
      user: {
        id: '1',
        email,
        role: 'admin'
      },
      session: {
        access_token: 'dummy_token',
        expires_at: Date.now() + 3600000
      }
    });

  } catch (error) {
    console.error('Admin login API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}