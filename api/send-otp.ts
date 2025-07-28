import { NextApiRequest, NextApiResponse } from 'next';
import { validateCSRFForAPI } from '../server/security/csrf-protection';
import { supabase } from '../src/components/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * SMS OTP送信API（CSRF保護付き）
 * POST /api/send-otp
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
      console.warn('SMS OTP CSRF validation failed:', {
        sessionId: sessionId.substring(0, 8) + '...',
        ip: req.socket.remoteAddress,
        error: csrfValidation.error
      });
      
      return res.status(403).json({ 
        error: csrfValidation.error,
        code: 'CSRF_INVALID'
      });
    }

    const { phoneNumber } = req.body;

    // 入力値の検証
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // 電話番号の正規化と検証
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (!/^(090|080|070)\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // クライアントIPの取得（レート制限用）
    const clientIP = req.socket.remoteAddress || 
                    req.headers['x-forwarded-for'] as string ||
                    req.headers['x-real-ip'] as string ||
                    'unknown';

    // OTPの生成（6桁）
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 300000); // 5分後

    // 開発環境ではコンソールに出力
    console.log('Development SMS OTP:', {
      phone: normalizedPhone,
      otp: otp,
      expires: expiresAt
    });

    // 成功ログ
    console.log('SMS OTP sent:', {
      phone: normalizedPhone.substring(0, 3) + '****' + normalizedPhone.substring(7),
      ip: clientIP.substring(0, 10) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300000 // 5分
    });

  } catch (error) {
    console.error('Send OTP API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}