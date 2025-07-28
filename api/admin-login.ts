import { NextApiRequest, NextApiResponse } from 'next';
import { validateCSRFForAPI } from '../server/security/csrf-protection';
import { supabase } from '../src/components/supabaseClient';

/**
 * 管理画面ログインAPI（CSRF保護付き）
 * POST /api/admin-login
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // CSRFトークンの検証
    const sessionId = req.cookies.sessionId || req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const csrfValidation = await validateCSRFForAPI(req as any, sessionId);
    if (!csrfValidation.success) {
      console.warn('Admin login CSRF validation failed:', {
        sessionId: sessionId.substring(0, 8) + '...',
        ip: req.socket.remoteAddress,
        error: csrfValidation.error
      });
      
      return res.status(403).json({ 
        error: csrfValidation.error,
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

    // レート制限チェック（IP単位で1分間に5回まで）
    const clientIP = req.socket.remoteAddress || 
                    req.headers['x-forwarded-for'] as string ||
                    'unknown';
    
    // 簡易レート制限（本格実装ではRedisなど使用）
    const attemptKey = `admin_login_${clientIP}`;
    // ここでは省略、本格実装では外部ストレージを使用

    // Supabase管理者認証
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      // 失敗ログの記録
      console.warn('Admin login attempt failed:', {
        email: email.substring(0, 3) + '***',
        ip: clientIP.substring(0, 10) + '...',
        error: authError?.message,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({ 
        error: '認証に失敗しました',
        code: 'AUTH_FAILED'
      });
    }

    // 管理者権限の確認
    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('*')
      .or(`username.eq.${data.user.email},phone_number.eq.${data.user.phone}`)
      .eq('is_active', true)
      .maybeSingle();

    if (adminError || !adminData) {
      // 管理者権限がない場合は強制ログアウト
      await supabase.auth.signOut();
      
      console.warn('Non-admin login attempt:', {
        email: email.substring(0, 3) + '***',
        userId: data.user.id,
        ip: clientIP,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({ 
        error: '管理者権限がありません',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    // ログイン成功時の監査ログ
    console.log('Admin login successful:', {
      adminId: adminData.id,
      email: email.substring(0, 3) + '***',
      ip: clientIP.substring(0, 10) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    });

    // 最終ログイン時刻の更新
    await supabase
      .from('admin_credentials')
      .update({ 
        last_login_at: new Date().toISOString(),
        last_login_ip: clientIP
      })
      .eq('id', adminData.id);

    // セッション情報をレスポンス
    res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: adminData.role || 'admin'
      },
      session: {
        access_token: data.session?.access_token,
        expires_at: data.session?.expires_at
      }
    });

  } catch (error) {
    console.error('Admin login API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}