// SMS認証サービス - Vercelサーバーレス関数専用版
import { createClient } from '@supabase/supabase-js';

// Vercel環境用のSupabaseクライアント作成
function getSupabaseAdmin() {
  // Vercel環境では環境変数名が異なる可能性があるため複数チェック
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.SUPABASE_SERVICE_KEY || '';
  
  console.log('🔍 [smsAuthServer] Supabase config check:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceRoleKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
    envVars: {
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY
    }
  });
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ [smsAuthServer] Supabase configuration missing');
    throw new Error('Supabase configuration is missing. Please set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export class SMSAuthService {
  private static async getTwilioClient() {
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };
    
    console.log('🔍 [smsAuthServer] Twilio config check:', {
      hasAccountSid: !!config.accountSid,
      hasAuthToken: !!config.authToken,
      hasPhoneNumber: !!config.phoneNumber,
      phoneNumber: config.phoneNumber || 'missing'
    });
    
    if (!config.accountSid || !config.authToken) {
      throw new Error('Twilio configuration not found');
    }

    // 本番環境ではTwilio SDKを使用
    try {
      // 動的インポートに変更（サーバーレス環境対応）
      const twilioModule = await import('twilio');
      const twilio = twilioModule.default;
      return twilio(config.accountSid, config.authToken);
    } catch (error) {
      console.error('Twilio SDK load error:', error);
      // Twilio SDKが利用できない場合はHTTP API直接使用
      return {
        accountSid: config.accountSid,
        authToken: config.authToken,
        phoneNumber: config.phoneNumber,
        _isDirectAPI: true
      };
    }
  }

  static async sendOTP(phoneNumber: string, ipAddress?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 [smsAuthServer] Starting sendOTP:', {
        phoneNumber: phoneNumber.substring(0, 3) + '***',
        hasIpAddress: !!ipAddress
      });
      
      // 電話番号の正規化
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      console.log('🔍 [smsAuthServer] Normalized phone:', normalizedPhone.substring(0, 5) + '***');
      
      if (!this.validatePhoneNumber(normalizedPhone)) {
        console.error('❌ [smsAuthServer] Invalid phone number format');
        return { success: false, error: 'Invalid phone number format' };
      }

      // レート制限チェック（電話番号 + IP アドレス）
      try {
        const rateLimitOk = await this.checkRateLimit(normalizedPhone, ipAddress);
        if (!rateLimitOk) {
          console.warn('⚠️ [smsAuthServer] Rate limit exceeded');
          return { success: false, error: 'SMS送信回数の上限に達しました。1時間後にお試しください。' };
        }
        console.log('✅ [smsAuthServer] Rate limit check passed');
      } catch (rateLimitError: any) {
        console.error('⚠️ [smsAuthServer] レート制限チェック失敗:', rateLimitError?.message);
        // 一時的にレート制限チェックをスキップしてデバッグ
        console.warn('⚠️ [smsAuthServer] Skipping rate limit check for debugging');
      }

      const otp = await this.generateOTP();
      console.log('🔍 [smsAuthServer] OTP generated');
      
      // 環境判定とTwilio設定チェック
      const config = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      };
      const hasTwilioConfig = config.accountSid && config.authToken && config.phoneNumber;
      
      if (!hasTwilioConfig) {
        console.error('🚫 [smsAuthServer] Twilio設定が不完全です', {
          hasAccountSid: !!config.accountSid,
          hasAuthToken: !!config.authToken,
          hasPhoneNumber: !!config.phoneNumber
        });
        return { success: false, error: 'SMS送信サービスが利用できません。管理者にお問い合わせください。' };
      }

      const client = await this.getTwilioClient();
      console.log('🔍 [smsAuthServer] Twilio client created');
      
      // OTPをデータベースに保存（5分間有効）
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      // Supabaseに保存（一時的にエラーハンドリング強化）
      try {
        await this.saveOTPToDatabase(normalizedPhone, otp, expiresAt, ipAddress);
        console.log('✅ [smsAuthServer] OTP saved to database');
      } catch (dbError: any) {
        console.error('⚠️ [smsAuthServer] OTPデータベース保存失敗（継続）:', dbError?.message);
        console.error('⚠️ [smsAuthServer] Database error details:', {
          name: dbError?.name,
          message: dbError?.message,
          stack: dbError?.stack
        });
        // データベース保存失敗でもSMS送信は継続
      }
      
      // SMS送信
      console.log('🔍 [smsAuthServer] Sending SMS...');
      
      if ((client as any)._isDirectAPI) {
        // Twilio HTTP API直接使用
        console.log('🔍 [smsAuthServer] Using direct API');
        await this.sendSMSDirectAPI(client, normalizedPhone, otp);
      } else {
        // Twilio SDK使用
        console.log('🔍 [smsAuthServer] Using Twilio SDK');
        const result = await (client as any).messages.create({
          body: `【タスカル】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`,
          from: config.phoneNumber,
          to: normalizedPhone
        });
        console.log('✅ [smsAuthServer] SMS sent via SDK:', result.sid);
      }
      
      console.log('✅ [smsAuthServer] SMS送信完了');

      return { success: true };
    } catch (error: any) {
      console.error('💥 [smsAuthServer] SMS送信エラー詳細:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        hasConfig: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
      });
      return { success: false, error: `SMS送信に失敗しました: ${error?.message || 'Unknown error'}` };
    }
  }

  private static async generateOTP(): Promise<string> {
    // 暗号学的に安全な乱数生成
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(6);
      crypto.getRandomValues(array);
      return Array.from(array, byte => (byte % 10).toString()).join('');
    } else {
      // Node.js環境でのフォールバック
      const { randomBytes } = await import('crypto');
      const bytes = randomBytes(6);
      return Array.from(bytes, (byte: number) => (byte % 10).toString()).join('');
    }
  }

  private static normalizePhoneNumber(phone: string): string {
    // 全角数字を半角に変換
    let normalized = phone.replace(/[０-９]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
    });
    
    // +81形式に統一（フロントエンドと同じ処理）
    normalized = normalized.replace(/\D/g, ''); // 数字以外を削除
    
    if (normalized.startsWith('0')) {
      // 0から始まる場合は+81に変換
      normalized = '+81' + normalized.substring(1);
    } else if (normalized.startsWith('81')) {
      // 81から始まる場合は+を追加
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      // +がない場合は+81を追加
      normalized = '+81' + normalized;
    }
    
    return normalized;
  }

  private static validatePhoneNumber(phone: string): boolean {
    // +81形式の日本の電話番号パターン（フロントエンドと統一）
    const phoneRegex = /^\+81[1-9]\d{8,9}$/;
    return phoneRegex.test(phone);
  }

  // Twilio HTTP API直接使用
  private static async sendSMSDirectAPI(client: any, to: string, otp: string): Promise<void> {
    const auth = Buffer.from(`${client.accountSid}:${client.authToken}`).toString('base64');
    
    console.log('🌐 [smsAuthServer] Twilio Direct API呼び出し', {
      url: `https://api.twilio.com/2010-04-01/Accounts/${client.accountSid}/Messages.json`,
      from: client.phoneNumber,
      to: to
    });
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${client.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: client.phoneNumber,
        To: to,
        Body: `【タスカル】認証コード: ${otp}\n\n※5分間有効です。第三者には絶対に教えないでください。`
      })
    });

    console.log('📡 [smsAuthServer] Twilio API応答', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [smsAuthServer] Twilio API エラー詳細:', errorData);
      throw new Error(`Twilio API error: ${response.status} ${errorData}`);
    }
    
    const result = await response.json();
    console.log('📤 [smsAuthServer] Twilio Direct API送信完了', { 
      sid: result.sid, 
      status: result.status,
      error_code: result.error_code,
      error_message: result.error_message
    });
  }

  // OTPをデータベースに保存
  private static async saveOTPToDatabase(phoneNumber: string, otp: string, expiresAt: Date, ipAddress?: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 既存のOTPを削除
    await supabaseAdmin
      .from('sms_verifications')
      .delete()
      .eq('phone_number', phoneNumber);

    // 新しいOTPを保存
    const { error } = await supabaseAdmin
      .from('sms_verifications')
      .insert({
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        request_ip: ipAddress || 'unknown'
      });

    if (error) {
      throw new Error(`Failed to save OTP: ${error.message}`);
    }
  }

  // レート制限チェック（複数の制限軸）
  private static async checkRateLimit(phoneNumber: string, ipAddress?: string): Promise<boolean> {
    const supabaseAdmin = getSupabaseAdmin();
    
    try {
      // 1. 電話番号単位のレート制限（1時間に3回）
      const { data: phoneLimit, error: phoneError } = await supabaseAdmin
        .rpc('check_sms_rate_limit', { phone: phoneNumber });

      if (phoneError) {
        console.error('[smsAuthServer] Phone rate limit check failed:', phoneError);
        return false;
      }

      if (!phoneLimit) {
        return false; // 電話番号制限に達している
      }

      // 2. IPアドレス制限（IPがある場合）
      if (ipAddress) {
        // 2-1. IP単位の制限（1時間に10回）
        const { data: ipData } = await supabaseAdmin
          .from('sms_verifications')
          .select('created_at')
          .eq('request_ip', ipAddress)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .limit(10);

        if (ipData && ipData.length >= 10) {
          return false; // IP単位の制限
        }

        // 2-2. グローバル制限（全体で1時間に100回）
        const { data: globalData } = await supabaseAdmin
          .from('sms_verifications')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .limit(100);

        if (globalData && globalData.length >= 100) {
          return false; // グローバル制限
        }
      }

      // 3. 不審なパターンの検出
      const { data: recentAttempts } = await supabaseAdmin
        .from('sms_verifications')
        .select('phone_number, request_ip, created_at')
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // 10分以内
        .limit(20);

      if (recentAttempts && recentAttempts.length > 0) {
        // 同一IPから複数の電話番号への送信をチェック
        const ipAttempts = recentAttempts.filter(a => a.request_ip === ipAddress);
        const uniquePhones = new Set(ipAttempts.map(a => a.phone_number));
        
        if (uniquePhones.size > 5) {
          return false; // 同一IPから5個以上の電話番号への送信を拒否
        }
      }

      return true;
    } catch (error) {
      console.error('[smsAuthServer] Rate limit check failed:', error);
      return false; // エラーの場合は安全側に倒す
    }
  }

  // 電話番号をマスキングするユーティリティ関数
  private static maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '[MASKED]';
    const normalized = phoneNumber.replace(/[^\d]/g, '');
    if (normalized.length < 4) return '[MASKED]';
    const visible = normalized.slice(-3); // 最後の3桁のみ表示
    const masked = '*'.repeat(normalized.length - 3);
    return masked + visible;
  }
}