import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { apiLimiters, dynamicRateLimiter, rateLimitMonitor } from './advancedRateLimit';
import { ipAnalyzer } from '../utils/ipAnalyzer';
import { addBreadcrumb } from '../utils/sentry';
import ProductionLogger from '../utils/productionLogger';

// 拡張Requestインターフェース
interface ExtendedRequest extends Request {
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: Date;
  };
  ipAnalysis?: any;
  requestId?: string;
}

// セキュリティミドルウェアの設定
export const setupSecurityMiddleware = (app: any) => {
  // Helmetによる基本的なセキュリティヘッダー
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "*.supabase.co"
        ],
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co",
          "https://api.twilio.com",
          "https://www.google-analytics.com"
        ],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: { policy: "credentialless" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));
  
  // カスタムセキュリティヘッダー
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Feature Policy / Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), accelerometer=()'
    );
    
    // その他のセキュリティヘッダー
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Expect-CT', 'enforce, max-age=86400');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    
    next();
  });
  
  // リクエストID生成
  app.use((req: ExtendedRequest, res: Response, next: NextFunction) => {
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });
  
  // IP分析ミドルウェア
  app.use(async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const analysis = await ipAnalyzer.analyze(req);
      req.ipAnalysis = analysis;
      
      // 高リスクIPの場合はログに記録
      if (analysis.riskScore >= 70) {
        ProductionLogger.warn('High risk IP detected', {
          ip: analysis.realIP,
          riskScore: analysis.riskScore,
          isProxy: analysis.isProxy,
          isTor: analysis.isTor,
          isVPN: analysis.isVPN
        });
        
        addBreadcrumb('High risk IP detected', 'security', 'warning', {
          ip: analysis.realIP,
          riskScore: analysis.riskScore
        });
      }
      
      next();
    } catch (error) {
      ProductionLogger.error('IP analysis failed', error as Error);
      next(); // エラーが発生してもリクエストは続行
    }
  });
  
  // 動的レート制限
  app.use(dynamicRateLimiter.middleware());
  
  // エンドポイント別レート制限の適用
  const applyRateLimit = (limiterName: keyof typeof apiLimiters) => {
    return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
      const limiter = apiLimiters[limiterName];
      
      // レート制限を適用
      limiter(req, res, async (err?: any) => {
        if (err) {
          // レート制限違反をログに記録
          await rateLimitMonitor.logViolation(req, limiterName);
          
          ProductionLogger.warn('Rate limit exceeded', {
            ip: req.ipAnalysis?.realIP || req.ip,
            endpoint: req.originalUrl,
            limiter: limiterName
          });
          
          return next(err);
        }
        next();
      });
    };
  };
  
  // API routes with specific rate limits
  app.use('/api/auth/*', applyRateLimit('auth'));
  app.use('/api/sms/*', applyRateLimit('sms'));
  app.use('/api/diagnosis/*', applyRateLimit('diagnosis'));
  app.use('/api/admin/*', applyRateLimit('admin'));
  
  // Read operations
  app.get('/api/*', applyRateLimit('read'));
  
  // Write operations
  app.post('/api/*', applyRateLimit('write'));
  app.put('/api/*', applyRateLimit('write'));
  app.patch('/api/*', applyRateLimit('write'));
  app.delete('/api/*', applyRateLimit('write'));
  
  // General rate limit for all other requests
  app.use('/api/*', applyRateLimit('general'));
  
  // リクエストロギング
  app.use((req: ExtendedRequest, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // スロークエリの検出
      if (duration > 1000) {
        ProductionLogger.warn('Slow request detected', {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          duration,
          statusCode: res.statusCode,
          ip: req.ipAnalysis?.realIP || req.ip
        });
      }
    });
    
    next();
  });
  
  // エラーハンドリング
  app.use((err: any, req: ExtendedRequest, res: Response, next: NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'セキュリティトークンが無効です。ページを更新してください。'
      });
    } else if (err.status === 429) {
      // レート制限エラー
      res.status(429).json({
        error: 'Too Many Requests',
        message: err.message || 'リクエストが多すぎます。',
        retryAfter: res.getHeader('Retry-After')
      });
    } else {
      next(err);
    }
  });
};

// セキュリティチェック用ユーティリティ
export const securityChecks = {
  // SQLインジェクション対策
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    // 危険な文字をエスケープ
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/xp_/gi, '')
      .replace(/script/gi, '');
  },
  
  // XSS対策
  escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  },
  
  // パストラバーサル対策
  sanitizePath(path: string): string {
    return path
      .replace(/\.\./g, '')
      .replace(/\/+/g, '/')
      .replace(/\\/g, '/');
  },
  
  // コマンドインジェクション対策
  sanitizeCommand(command: string): string {
    const dangerous = [';', '&&', '||', '|', '>', '<', '`', '$', '(', ')', '{', '}'];
    let safe = command;
    
    dangerous.forEach(char => {
      safe = safe.replace(new RegExp(`\\${char}`, 'g'), '');
    });
    
    return safe;
  }
};

// レート制限情報をレスポンスヘッダーに追加
export const addRateLimitHeaders = (req: ExtendedRequest, res: Response) => {
  if (req.rateLimitInfo) {
    res.setHeader('X-RateLimit-Limit', req.rateLimitInfo.limit.toString());
    res.setHeader('X-RateLimit-Remaining', req.rateLimitInfo.remaining.toString());
    res.setHeader('X-RateLimit-Reset', req.rateLimitInfo.reset.toISOString());
  }
};