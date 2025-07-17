import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// グローバル型定義
declare global {
  var otpStore: Map<string, { otp: string; expiresAt: number; attempts: number }> | undefined;
  var rateLimitStore: Map<string, { count: number; resetAt: number }> | undefined;
}

// メモリストアのクリーンアップ関数
const cleanupExpiredData = () => {
  const now = Date.now();
  
  // OTPストアのクリーンアップ
  if (global.otpStore) {
    for (const [key, value] of global.otpStore.entries()) {
      if (value.expiresAt < now) {
        global.otpStore.delete(key);
      }
    }
  }
  
  // レート制限ストアのクリーンアップ
  if (global.rateLimitStore) {
    for (const [key, value] of global.rateLimitStore.entries()) {
      if (value.resetAt < now) {
        global.rateLimitStore.delete(key);
      }
    }
  }
};

// 5分ごとにクリーンアップを実行
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredData, 5 * 60 * 1000);
}

import ProductionLogger from '../src/utils/productionLogger';

const logger = ProductionLogger;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定 - 本番環境用
  const allowedOrigins = [
    'https://moneyticket.vercel.app',
    'https://moneyticket-git-main-sakkayuta.vercel.app',
    // Vercelプレビューデプロイメント用の動的マッチング
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);
  
  // プレビューデプロイメントのパターンマッチング
  const origin = req.headers.origin;
  const isVercelPreview = origin && /^https:\/\/moneyticket01-[a-z0-9]+-seai0520s-projects\.vercel\.app$/.test(origin);
  
  if (origin && (allowedOrigins.includes(origin) || isVercelPreview)) {
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
    logger.info('SMS送信開始');
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      logger.warn('電話番号が未設定');
      res.status(400).json({ error: '電話番号が必要です' });
      return;
    }

    logger.info('電話番号受信');

    // Twilio設定確認
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };

    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      logger.error('Twilio設定不完全');
      res.status(500).json({ error: 'SMS送信サービスが利用できません' });
      return;
    }

    // 安全なOTP生成（crypto使用）
    const otp = crypto.randomInt(100000, 999999).toString();
    logger.info('OTP生成完了');

    // 電話番号正規化（フロントエンドと統一）
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    // 電話番号正規化
    
    // フロントエンドと同じ検証（090/080/070のみ許可）
    if (!normalizedPhone.match(/^(090|080|070)\d{8}$/)) {
      res.status(400).json({ error: '正しい電話番号を入力してください（090/080/070で始まる11桁）' });
      return;
    }
    
    // +81形式に変換
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    }

    logger.info('電話番号正規化完了');

    // IPアドレス取得
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || 
                     req.headers['x-real-ip']?.toString() || 
                     'unknown';

    // レート制限チェック
    global.rateLimitStore = global.rateLimitStore || new Map();
    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    
    // 電話番号ベースのレート制限
    const phoneKey = `phone:${normalizedPhone}`;
    const phoneLimit = global.rateLimitStore.get(phoneKey) || { count: 0, resetAt: oneHourFromNow };
    
    if (phoneLimit.resetAt < Date.now()) {
      phoneLimit.count = 0;
      phoneLimit.resetAt = oneHourFromNow;
    }
    
    if (phoneLimit.count >= 3) {
      logger.warn('電話番号レート制限');
      res.status(429).json({ error: '送信回数の上限に達しました。1時間後にお試しください。' });
      return;
    }
    
    // IPアドレスベースのレート制限
    const ipKey = `ip:${clientIp}`;
    const ipLimit = global.rateLimitStore.get(ipKey) || { count: 0, resetAt: oneHourFromNow };
    
    if (ipLimit.resetAt < Date.now()) {
      ipLimit.count = 0;
      ipLimit.resetAt = oneHourFromNow;
    }
    
    if (ipLimit.count >= 10) {
      logger.warn('IPレート制限', { ip: clientIp });
      res.status(429).json({ error: 'リクエストが多すぎます。しばらくお待ちください。' });
      return;
    }

    // OTPをSupabaseに永続化保存（本番環境対応）
    try {
      // Dynamic import for ES modules compatibility
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // レート制限チェック（DB側）
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: dbPhoneCount } = await supabaseAdmin
        .from('sms_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('phone_number', normalizedPhone)
        .gte('created_at', oneHourAgo);
      
      const { count: dbIpCount } = await supabaseAdmin
        .from('sms_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('request_ip', clientIp)
        .gte('created_at', oneHourAgo);
      
      if (dbPhoneCount && dbPhoneCount >= 3) {
        logger.warn('DB電話番号レート制限');
        res.status(429).json({ error: '送信回数の上限に達しました。1時間後にお試しください。' });
        return;
      }
      
      if (dbIpCount && dbIpCount >= 10) {
        logger.warn('DBIPレート制限', { ip: clientIp });
        res.status(429).json({ error: 'リクエストが多すぎます。しばらくお待ちください。' });
        return;
      }

      // トランザクション的な操作（既存削除→新規挿入）
      const { error: deleteError } = await supabaseAdmin
        .from('sms_verifications')
        .delete()
        .eq('phone_number', normalizedPhone);
      
      if (deleteError) {
        logger.error('既存OTP削除エラー', { error: deleteError });
      }

      // 新しいOTPを保存
      const { error } = await supabaseAdmin
        .from('sms_verifications')
        .insert({
          phone_number: normalizedPhone,
          otp_code: otp,
          attempts: 0,
          request_ip: clientIp
        });

      if (error) {
        logger.error('Supabase OTP保存エラー', { error });
        // フォールバック: メモリに保存
        global.otpStore = global.otpStore || new Map();
        global.otpStore.set(normalizedPhone, {
          otp: otp,
          expiresAt: Date.now() + 5 * 60 * 1000,
          attempts: 0
        });
        logger.info('フォールバック: メモリに保存');
      } else {
        logger.info('Supabase OTP保存成功');
      }
    } catch (dbError) {
      logger.error('DB接続失敗、メモリにフォールバック', { error: dbError });
      global.otpStore = global.otpStore || new Map();
      global.otpStore.set(normalizedPhone, {
        otp: otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
      });
    }

    // Twilio SMS送信（レスポンス重複送信防止）
    let messageSuccess = false;
    let messageResponse: any = null;
    
    try {
      logger.info('Twilio SDK試行');
      const twilio = await import('twilio');
      const client = twilio.default(config.accountSid, config.authToken);
      
      const message = await client.messages.create({
        body: `【AI ConectX】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`,
        from: config.phoneNumber,
        to: normalizedPhone
      });
      
      logger.info('Twilio SDK送信成功', { sid: message.sid, status: message.status });
      messageSuccess = true;
      messageResponse = { success: true, message: 'SMS送信が完了しました' };
      
    } catch (sdkError: any) {
      logger.warn('SDK失敗、Direct API試行', { error: sdkError?.message });
      
      try {
        // Direct API試行
        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
        
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: config.phoneNumber,
            To: normalizedPhone,
            Body: `【AI ConectX】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          logger.error('Direct API失敗');
          throw new Error(`Direct API error: ${response.status}`);
        }
        
        const result = await response.json();
        logger.info('Direct API送信成功', { sid: result.sid });
        messageSuccess = true;
        messageResponse = { success: true, message: 'SMS送信が完了しました' };
        
      } catch (apiError: any) {
        logger.error('全SMS送信方法失敗', { error: apiError?.message });
        throw apiError;
      }
    }

    // 成功時のレスポンス送信（重複送信防止）
    if (messageSuccess && messageResponse) {
      // レート制限カウンターを更新
      phoneLimit.count++;
      ipLimit.count++;
      global.rateLimitStore.set(phoneKey, phoneLimit);
      global.rateLimitStore.set(ipKey, ipLimit);
      
      res.status(200).json(messageResponse);
      return;
    }

    // セキュリティヘッダー設定は応答済みなので削除

  } catch (error: any) {
    logger.error('SMS送信エラー', { 
      error: error?.message || 'Unknown error',
      type: error?.constructor?.name 
    });
    
    // クライアントには一般的なエラーメッセージを返す
    res.status(500).json({ error: 'SMS送信に失敗しました。しばらく時間をおいてお試しください。' });
  }
}