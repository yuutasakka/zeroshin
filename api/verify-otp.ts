import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 動的インポートを使用（Vercelサーバーレス環境対応）
    const { SMSAuthService } = await import('../src/api/smsAuth');
    const { SecurityMiddleware } = await import('../src/api/securityMiddleware');
    const ProductionLogger = (await import('../src/utils/productionLogger')).default;

    // CORS設定 - 本番環境用
    const allowedOrigins = [
      'https://moneyticket.vercel.app',
      'https://moneyticket-git-main-sakkayuta.vercel.app',
      'https://moneyticket-git-main-seai0520s-projects.vercel.app',
      'https://moneyticket01-10gswrw2q-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-rogabfsul-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-18dyp3oo0-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-jba8tb9fl-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-5dbezddft-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-8hq0b6f3c-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-ixkbvpo36-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-jaskh9loi-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-5wrbneqpz-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01-3k0j3cwan-seai0520s-projects.vercel.app', // 以前のデプロイ先
      'https://moneyticket01.vercel.app', // メインドメイン
      'http://localhost:5173', // ローカル開発
      'http://localhost:3000', // ローカル開発（代替ポート）
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
    const { phoneNumber, code, otp } = sanitizedBody;
    const otpCode = code || otp; // codeまたはotpを受け入れ
    
    if (!phoneNumber || !otpCode) {
      res.status(400).json({ error: '電話番号と認証コードが必要です' });
      return;
    }

    // セキュリティパターン検出
    if (SecurityMiddleware.detectSQLInjection(phoneNumber) || 
        SecurityMiddleware.detectXSS(phoneNumber) ||
        SecurityMiddleware.detectSQLInjection(otpCode) || 
        SecurityMiddleware.detectXSS(otpCode)) {
      res.status(400).json({ error: '無効な入力です' });
      return;
    }

    ProductionLogger.info('OTP検証リクエスト', { phoneNumber: phoneNumber.substring(0, 3) + '***', clientIP });
    
    const result = await SMSAuthService.verifyOTP(phoneNumber, otpCode);
    
    ProductionLogger.info('OTP検証結果', { success: result.success, hasError: !!result.error });
    
    if (!result.success) {
      ProductionLogger.error('OTP検証失敗', undefined, { error: result.error });
      res.status(400).json({ 
        success: false,
        error: result.error || '認証コードが正しくありません' 
      });
      return;
    }
    
    ProductionLogger.info('OTP検証成功');

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Verify OTP API error:', error);
    // 開発環境では詳細なエラー情報を返す
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({ 
      success: false,
      error: 'OTP検証に失敗しました',
      details: isDevelopment ? errorMessage : undefined
    });
  }
}