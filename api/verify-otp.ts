import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SMSAuthService } from '../src/api/smsAuth';
import { SecurityMiddleware } from '../src/middleware/securityVercel';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // セキュリティチェック
    const clientIP = req.headers['x-forwarded-for']?.toString().split(',')[0] || 
                    req.headers['x-real-ip']?.toString() || 
                    req.connection?.remoteAddress || 'unknown';
    
    // レート制限チェック
    const rateLimitOk = await SecurityMiddleware.checkRateLimit(clientIP, 10, 60000);
    if (!rateLimitOk) {
      res.status(429).json({
        error: 'リクエストが多すぎます。しばらく待ってからお試しください。'
      });
      return;
    }

    // 入力サニタイゼーション
    const sanitizedBody = SecurityMiddleware.sanitizeInput(req.body);
    const { phoneNumber, otp } = sanitizedBody;
    
    if (!phoneNumber || !otp) {
      res.status(400).json({ error: '電話番号と認証コードが必要です' });
      return;
    }

    // セキュリティパターン検出
    if (SecurityMiddleware.detectSQLInjection(phoneNumber) || 
        SecurityMiddleware.detectXSS(phoneNumber) ||
        SecurityMiddleware.detectSQLInjection(otp) || 
        SecurityMiddleware.detectXSS(otp)) {
      res.status(400).json({ error: '無効な入力です' });
      return;
    }

    // 環境判定
    const isProduction = process.env.NODE_ENV === 'production' ||
                        (typeof process !== 'undefined' && 
                         !process.env.NODE_ENV?.includes('dev'));
    
    if (!isProduction) {
      console.log(`🔍 OTP検証リクエスト: ${phoneNumber}, OTP: ${otp}`);
    }
    
    const result = await SMSAuthService.verifyOTP(phoneNumber, otp);
    
    if (!isProduction) {
      console.log(`🔍 OTP検証結果:`, result);
    }
    
    if (result.success) {
      if (!isProduction) {
        console.log('✅ OTP検証成功 - セッション作成');
      }
      // セッション管理は簡化（Vercel Functions環境）
      res.setHeader('Set-Cookie', [
        `session_verified=true; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`,
        `phone_verified=${phoneNumber}; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`
      ]);
      
      res.status(200).json({ 
        success: true,
        message: '認証が完了しました'
      });
    } else {
      if (!isProduction) {
        console.error(`❌ OTP検証失敗: ${result.error}`);
      }
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  } catch (error) {
    console.error('Verify OTP API error:', error);
    res.status(500).json({ error: '認証に失敗しました' });
  }
}