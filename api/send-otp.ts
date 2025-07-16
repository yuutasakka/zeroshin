import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SMSAuthService } from '../src/api/smsAuth';
import { SecurityMiddleware } from '../src/middleware/securityVercel';
import ProductionLogger from '../src/utils/productionLogger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定 - 本番環境用
  const allowedOrigins = [
    'https://moneyticket.vercel.app',
    'https://moneyticket-git-main-sakkayuta.vercel.app',
    'https://moneyticket01-10gswrw2q-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-rogabfsul-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-18dyp3oo0-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-jba8tb9fl-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-5dbezddft-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-8hq0b6f3c-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-ixkbvpo36-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-jaskh9loi-seai0520s-projects.vercel.app', // 以前のデプロイ先
    'https://moneyticket01-5wrbneqpz-seai0520s-projects.vercel.app', // 現在のデプロイ先
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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
    const rateLimitOk = await SecurityMiddleware.checkRateLimit(clientIP, 5, 60000);
    if (!rateLimitOk) {
      res.status(429).json({
        error: 'リクエストが多すぎます。しばらく待ってからお試しください。'
      });
      return;
    }

    // 入力サニタイゼーション
    const sanitizedBody = SecurityMiddleware.sanitizeInput(req.body);
    const { phoneNumber } = sanitizedBody;
    
    if (!phoneNumber) {
      res.status(400).json({ error: '電話番号が必要です' });
      return;
    }

    // セキュリティパターン検出
    if (SecurityMiddleware.detectSQLInjection(phoneNumber) || 
        SecurityMiddleware.detectXSS(phoneNumber)) {
      res.status(400).json({ error: '無効な入力です' });
      return;
    }

    // 環境判定（プロダクションロガーで使用）
    
    ProductionLogger.info('SMS送信リクエスト', { phoneNumber: phoneNumber.substring(0, 3) + '***', clientIP });
    
    const result = await SMSAuthService.sendOTP(phoneNumber);
    
    ProductionLogger.info('SMS送信結果', { success: result.success, hasError: !!result.error });
    
    if (!result.success) {
      ProductionLogger.error('SMS送信失敗', undefined, { error: result.error });
      res.status(400).json({ error: result.error });
      return;
    }
    
    ProductionLogger.info('SMS送信成功');

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Send OTP API error:', error);
    res.status(500).json({ error: 'SMS送信に失敗しました' });
  }
}