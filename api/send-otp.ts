import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 環境変数のチェック（デバッグ用）
    console.log('🔍 [send-otp] Environment check:', {
      hasTwilioAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      nodeEnv: process.env.NODE_ENV,
      twilioAccountSidPrefix: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 4) + '...' : 'undefined',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || 'undefined'
    });

    // 動的インポートを使用（Vercelサーバーレス環境対応）
    console.log('🔍 [send-otp] Starting imports...');
    
    // Vercel専用のSMSAuthServiceを使用
    const { SMSAuthService } = await import('./_lib/smsAuthServer');
    console.log('✅ [send-otp] SMSAuthService imported');
    
    const { SecurityMiddleware } = await import('./_lib/securityMiddleware');
    console.log('✅ [send-otp] SecurityMiddleware imported');
    
    const ProductionLogger = (await import('./_lib/productionLogger')).default;
    console.log('✅ [send-otp] All imports completed');

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
    const rateLimitOk = await SecurityMiddleware.checkRateLimit(clientIP, 5, 60000);
    if (!rateLimitOk) {
      res.status(429).json({
        error: 'リクエストが多すぎます。しばらく待ってからお試しください。'
      });
      return;
    }

    // 入力サニタイゼーション
    console.log('🔍 [send-otp] Request body:', req.body);
    const sanitizedBody = SecurityMiddleware.sanitizeInput(req.body);
    const { phoneNumber } = sanitizedBody;
    console.log('🔍 [send-otp] Sanitized phone number:', phoneNumber);
    
    if (!phoneNumber) {
      console.error('❌ [send-otp] No phone number provided');
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
    console.log('🔍 [send-otp] Calling SMSAuthService.sendOTP with:', {
      phoneNumber: phoneNumber.substring(0, 3) + '***',
      clientIP
    });
    
    const result = await SMSAuthService.sendOTP(phoneNumber, clientIP);
    console.log('🔍 [send-otp] SMSAuthService.sendOTP result:', result);
    
    ProductionLogger.info('SMS送信結果', { success: result.success, hasError: !!result.error });
    
    if (!result.success) {
      console.error('❌ [send-otp] SMS sending failed:', result.error);
      ProductionLogger.error('SMS送信失敗', undefined, { error: result.error });
      res.status(400).json({ error: result.error });
      return;
    }
    
    console.log('✅ [send-otp] SMS sent successfully');
    ProductionLogger.info('SMS送信成功');

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [send-otp] Send OTP API error:', error);
    console.error('❌ [send-otp] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      error: error
    });
    
    // 開発環境では詳細なエラー情報を返す
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({ 
      error: 'SMS送信に失敗しました',
      details: isDevelopment ? errorMessage : undefined,
      hint: 'Twilio環境変数が正しく設定されているか確認してください',
      // デバッグ用に一時的に詳細を含める
      debugInfo: {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: errorMessage,
        hasEnvVars: {
          accountSid: !!process.env.TWILIO_ACCOUNT_SID,
          authToken: !!process.env.TWILIO_AUTH_TOKEN,
          phoneNumber: !!process.env.TWILIO_PHONE_NUMBER
        }
      }
    });
  }
}