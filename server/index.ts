import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import winston from 'winston';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

// 環境変数を読み込み
dotenv.config();

// ロガーの設定
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'moneyticket-auth' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'moneyticket-super-secret-key-2024';

// セキュリティヘッダーの設定
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS設定の厳格化
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// レート制限の設定
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 一般的なAPIリクエストは100回まで
  message: {
    error: 'リクエストが多すぎます。15分後に再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // SMS送信は5回まで
  message: {
    error: 'SMS送信の試行回数が上限に達しました。15分後に再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 認証試行は10回まで
  message: {
    error: '認証試行回数が上限に達しました。15分後に再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 一般的なレート制限を適用
app.use(generalLimiter);

// Twilioクライアントの初期化（必須設定）
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Twilio設定の検証
if (!accountSid || !authToken || !twilioPhoneNumber) {
  logger.error('Twilioの設定が不完全です', {
    accountSid: !!accountSid,
    authToken: !!authToken,
    twilioPhoneNumber: !!twilioPhoneNumber
  });
  console.error('❌ Twilioの設定が不完全です。以下の環境変数を設定してください:');
  console.error('- TWILIO_ACCOUNT_SID');
  console.error('- TWILIO_AUTH_TOKEN'); 
  console.error('- TWILIO_PHONE_NUMBER');
  process.exit(1);
}

logger.info('Twilio設定確認完了');
console.log('✅ Twilio設定確認完了');

const client = twilio(accountSid, authToken);

// ミドルウェア
app.use(express.json({ limit: '10mb' }));

// セキュリティログ用ミドルウェア
app.use((req, res, next) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// インメモリストレージ（本番環境ではRedisやDBを使用）
const verificationCodes = new Map<string, { code: string; expiry: number; attempts: number }>();

// 入力検証ルール
const phoneValidation = [
  body('phoneNumber')
    .isLength({ min: 10, max: 15 })
    .matches(/^[\+]?[0-9\-\s]+$/)
    .withMessage('正しい電話番号形式で入力してください')
];

const verificationValidation = [
  body('phoneNumber')
    .isLength({ min: 10, max: 15 })
    .matches(/^[\+]?[0-9\-\s]+$/)
    .withMessage('正しい電話番号形式で入力してください'),
  body('code')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('認証コードは4-6桁の数字で入力してください')
];

// 日本の電話番号を国際形式に正規化
function normalizeJapanesePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.startsWith('090') || digits.startsWith('080') || digits.startsWith('070')) {
    return '+81' + digits.substring(1);
  }
  
  if (digits.startsWith('0')) {
    return '+81' + digits.substring(1);
  }
  
  if (digits.startsWith('81')) {
    return '+' + digits;
  }
  
  return '+81' + digits;
}

// 認証コード生成（暗号学的に安全）
function generateSecureCode(): string {
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(2);
  const code = (randomBytes.readUInt16BE(0) % 9000 + 1000).toString();
  return code;
}

// SMS送信エンドポイント（セキュリティ強化版）
app.post('/api/sms/send', smsLimiter, phoneValidation, async (req: Request, res: Response) => {
  try {
    // 入力検証
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('SMS送信: 入力検証エラー', {
        errors: errors.array(),
        ip: req.ip
      });
      res.status(400).json({
        error: '入力データが無効です',
        details: errors.array()
      });
      return;
    }

    const { phoneNumber } = req.body;
    const normalizedPhoneNumber = normalizeJapanesePhoneNumber(phoneNumber);
    
    // 既存のコードがある場合の制限チェック
    const existing = verificationCodes.get(normalizedPhoneNumber);
    if (existing && existing.attempts >= 3) {
      logger.warn('SMS送信: 試行回数上限', {
        phoneNumber: normalizedPhoneNumber,
        attempts: existing.attempts,
        ip: req.ip
      });
      res.status(429).json({
        error: '認証コードの送信回数が上限に達しました。しばらく待ってから再試行してください。'
      });
      return;
    }

    const verificationCode = generateSecureCode();
    const expiry = Date.now() + 5 * 60 * 1000; // 5分後に期限切れ

    // 認証コードを一時保存
    verificationCodes.set(normalizedPhoneNumber, {
      code: verificationCode,
      expiry: expiry,
      attempts: existing ? existing.attempts + 1 : 1
    });

    // SMSメッセージの内容
    const message = `マネーチケット認証コード: ${verificationCode}\n5分以内にご入力ください。このコードを他人に教えないでください。`;

    // TwilioでSMS送信
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: normalizedPhoneNumber,
    });

    logger.info('SMS送信成功', {
      phoneNumber: normalizedPhoneNumber,
      ip: req.ip
    });

    console.log(`SMS送信成功: ${normalizedPhoneNumber}`);

    res.json({
      success: true,
      message: 'SMS認証コードを送信しました',
      phoneNumber: normalizedPhoneNumber
    });

  } catch (error) {
    logger.error('SMS送信エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });

    console.error('SMS送信エラー:', error);
    
    res.status(500).json({
      error: 'SMS送信に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// SMS認証コード検証エンドポイント（セキュリティ強化版）
app.post('/api/sms/verify', authLimiter, verificationValidation, async (req: Request, res: Response) => {
  try {
    // 入力検証
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('SMS認証: 入力検証エラー', {
        errors: errors.array(),
        ip: req.ip
      });
      res.status(400).json({
        error: '入力データが無効です',
        details: errors.array()
      });
      return;
    }

    const { phoneNumber, code } = req.body;
    const normalizedPhoneNumber = normalizeJapanesePhoneNumber(phoneNumber);
    const stored = verificationCodes.get(normalizedPhoneNumber);
    
    if (!stored) {
      logger.warn('SMS認証: コードが見つからない', {
        phoneNumber: normalizedPhoneNumber,
        ip: req.ip
      });
      res.status(400).json({
        error: '認証コードが見つかりません',
        verified: false
      });
      return;
    }
    
    // 有効期限をチェック
    if (Date.now() > stored.expiry) {
      verificationCodes.delete(normalizedPhoneNumber);
      logger.warn('SMS認証: コード期限切れ', {
        phoneNumber: normalizedPhoneNumber,
        ip: req.ip
      });
      res.status(400).json({
        error: '認証コードの有効期限が切れています',
        verified: false
      });
      return;
    }
    
    // コードが一致するかチェック
    if (stored.code === code) {
      verificationCodes.delete(normalizedPhoneNumber);
      
      // JWTトークンを生成（オプション）
      const token = jwt.sign(
        { phoneNumber: normalizedPhoneNumber, verified: true },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      logger.info('SMS認証成功', {
        phoneNumber: normalizedPhoneNumber,
        ip: req.ip
      });

      console.log(`認証成功: ${normalizedPhoneNumber}`);
      
      res.json({
        success: true,
        message: '認証が完了しました',
        verified: true,
        token: token
      });
      return;
    } else {
      logger.warn('SMS認証: コード不一致', {
        phoneNumber: normalizedPhoneNumber,
        providedCode: code,
        ip: req.ip
      });
      res.status(400).json({
        error: '認証コードが正しくありません',
        verified: false
      });
      return;
    }

  } catch (error) {
    logger.error('SMS認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });

    console.error('認証エラー:', error);
    res.status(500).json({
      error: '認証処理に失敗しました'
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    twilioConfigured: true,
    timestamp: new Date().toISOString(),
    security: {
      helmet: true,
      rateLimit: true,
      cors: true,
      validation: true
    }
  });
});

// ログディレクトリの作成（より安全な方法）
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ ログディレクトリを作成しました:', logsDir);
  } catch (error) {
    console.error('❌ ログディレクトリの作成に失敗しました:', error);
  }
}

// エラーハンドリングミドルウェア
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'サーバーエラーが発生しました'
  });
});

// サーバー開始
app.listen(PORT, () => {
  logger.info('サーバー起動', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log(`🚀 セキュア認証サーバーが http://localhost:${PORT} で起動しました`);
  console.log('🔒 セキュリティ機能: Helmet, CORS制限, レート制限, 入力検証, ログ記録');
});

export default app; 