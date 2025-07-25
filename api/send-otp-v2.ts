import type { VercelRequest, VercelResponse } from '@vercel/node';

// インラインセキュリティミドルウェア
const SecurityMiddleware = {
  checkRateLimit: async (ip: string, limit: number, window: number): Promise<boolean> => {
    // 簡易実装 - 本番環境ではRedisなどを使用
    return true;
  },
  
  sanitizeInput: (input: any): any => {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        sanitized[key] = SecurityMiddleware.sanitizeInput(input[key]);
      }
      return sanitized;
    }
    return input;
  },
  
  detectSQLInjection: (input: string): boolean => {
    const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)|(--)|(;)|(\*)/gi;
    return sqlPatterns.test(input);
  },
  
  detectXSS: (input: string): boolean => {
    const xssPatterns = /<script|<iframe|javascript:|onerror=|onload=/gi;
    return xssPatterns.test(input);
  }
};

// インラインロガー
const ProductionLogger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(`[ERROR] ${message}`, error || '', data || '');
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS設定
    const allowedOrigins = [
      'https://moneyticket.vercel.app',
      'https://moneyticket-git-main-sakkayuta.vercel.app',
      'https://moneyticket-git-main-seai0520s-projects.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // 動的にオリジンを追加（プレビューデプロイメント用）
    const origin = req.headers.origin;
    if (origin && (origin.includes('vercel.app') || allowedOrigins.includes(origin))) {
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
                    'unknown';
    
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

    ProductionLogger.info('SMS送信リクエスト', { phoneNumber: phoneNumber.substring(0, 3) + '***', clientIP });
    
    // Twilio設定
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      ProductionLogger.error('Twilio設定が不完全です');
      res.status(500).json({ 
        error: 'SMS送信サービスが利用できません。管理者にお問い合わせください。'
      });
      return;
    }

    // 電話番号の正規化
    let normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // 電話番号の検証
    const phoneRegex = /^\+81[1-9]\d{8,9}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      res.status(400).json({ error: '無効な電話番号形式です' });
      return;
    }

    // OTP生成
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Twilio SDKをインポート
    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    // SMS送信
    const message = await client.messages.create({
      body: `【タスカル】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`,
      from: fromNumber,
      to: normalizedPhone
    });

    ProductionLogger.info('SMS送信成功', { messageSid: message.sid });

    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Send OTP API error:', error);
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({ 
      error: 'SMS送信に失敗しました',
      details: isDevelopment ? errorMessage : undefined
    });
  }
}