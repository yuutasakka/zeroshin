import type { VercelRequest, VercelResponse } from '@vercel/node';

// グローバル型定義
declare global {
  var otpStore: Map<string, { otp: string; expiresAt: number; attempts: number }> | undefined;
  var ipBlockStore: Map<string, { attempts: number; blockedUntil: number }> | undefined;
}

// IPブロックストアのクリーンアップ
const cleanupBlockedIPs = () => {
  const now = Date.now();
  if (global.ipBlockStore) {
    for (const [key, value] of global.ipBlockStore.entries()) {
      if (value.blockedUntil < now) {
        global.ipBlockStore.delete(key);
      }
    }
  }
};

// 5分ごとにクリーンアップを実行
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupBlockedIPs, 5 * 60 * 1000);
}

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
    console.log('🔍 OTP認証開始');
    
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      res.status(400).json({ error: '電話番号と認証コードが必要です' });
      return;
    }

    console.log('📞 認証リクエスト:', { phoneNumber, otp: otp.substring(0, 2) + '****' });
    console.log('🔧 環境変数確認:', {
      supabaseUrl: process.env.VITE_SUPABASE_URL ? '設定済み' : '未設定',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '設定済み' : '未設定',
      twilioSid: process.env.TWILIO_ACCOUNT_SID ? '設定済み' : '未設定'
    });

    // 電話番号正規化（フロントエンドと統一）
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    console.log('🔍 正規化前:', phoneNumber, '→', normalizedPhone);
    
    // フロントエンドと同じ検証（090/080/070のみ許可）
    if (!normalizedPhone.match(/^(090|080|070)\d{8}$/)) {
      res.status(400).json({ error: '正しい電話番号を入力してください（090/080/070で始まる11桁）' });
      return;
    }
    
    // +81形式に変換
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    }

    console.log('📲 正規化後:', normalizedPhone);

    // IPアドレス取得
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || 
                     req.headers['x-real-ip']?.toString() || 
                     'unknown';

    // IPブロックチェック
    global.ipBlockStore = global.ipBlockStore || new Map();
    const ipBlock = global.ipBlockStore.get(clientIp);
    
    if (ipBlock && ipBlock.blockedUntil > Date.now()) {
      console.log('🚫 IPブロック中:', clientIp);
      res.status(429).json({ error: '認証試行回数が多すぎます。しばらくお待ちください。' });
      return;
    }

    // SupabaseからOTP取得（メモリフォールバック付き）
    let storedData = null;
    
    try {
      // Supabase Admin接続
      console.log('🔗 Supabase接続試行...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      console.log('🔍 DB検索条件:', { phone_number: normalizedPhone, is_verified: false });
      const { data, error } = await supabaseAdmin
        .from('sms_verifications')
        .select('otp_code, created_at, attempts')
        .eq('phone_number', normalizedPhone)
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('📋 DB検索結果:', { data, error });

      if (!error && data) {
        // UTC基準の期限チェック（created_atから5分）
        const createdAt = new Date(data.created_at).getTime();
        const expiresAt = createdAt + (5 * 60 * 1000); // 5分後
        
        storedData = {
          otp: data.otp_code,
          expiresAt: expiresAt,
          attempts: data.attempts || 0
        };
        console.log('✅ Supabase OTP取得成功 (UTC基準期限:', new Date(expiresAt).toISOString(), ')');
      } else {
        console.log('⚠️ Supabase OTP取得失敗、メモリ確認');
        console.log('📊 エラー詳細:', error);
        // フォールバック: メモリから取得
        global.otpStore = global.otpStore || new Map();
        storedData = global.otpStore.get(normalizedPhone);
        logger.info('メモリ検索完了', { found: !!storedData });
      }
    } catch (dbError) {
      console.error('⚠️ DB接続失敗、メモリから取得:', dbError);
      global.otpStore = global.otpStore || new Map();
      storedData = global.otpStore.get(normalizedPhone);
      console.log('💾 メモリ検索結果（例外時）:', storedData ? 'データあり' : 'データなし');
    }
    
    if (!storedData) {
      console.log('❌ OTP not found');
      console.log('🔍 デバッグ情報:');
      console.log('  - 検索対象電話番号:', normalizedPhone);
      console.log('  - メモリストア存在:', !!global.otpStore);
      console.log('  - メモリストアサイズ:', global.otpStore?.size || 0);
      res.status(400).json({ error: '認証コードが見つかりません。新しいコードを取得してください。' });
      return;
    }

    // 期限チェック
    if (Date.now() > storedData.expiresAt) {
      console.log('❌ OTP expired');
      // DBとメモリ両方から削除
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin.from('sms_verifications').delete().eq('phone_number', normalizedPhone);
      } catch {}
      global.otpStore?.delete(normalizedPhone);
      
      res.status(400).json({ error: '認証コードの有効期限が切れています。新しいコードを取得してください。' });
      return;
    }

    // 試行回数チェック
    if (storedData.attempts >= 5) {
      console.log('❌ Too many attempts');
      
      // IPブロック設定（1時間）
      const ipData = global.ipBlockStore.get(clientIp) || { attempts: 0, blockedUntil: 0 };
      ipData.attempts++;
      ipData.blockedUntil = Date.now() + 60 * 60 * 1000; // 1時間ブロック
      global.ipBlockStore.set(clientIp, ipData);
      
      // DBとメモリ両方から削除
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin.from('sms_verifications').delete().eq('phone_number', normalizedPhone);
      } catch {}
      global.otpStore?.delete(normalizedPhone);
      
      res.status(400).json({ error: '認証コードの入力回数が上限に達しました。新しいコードを取得してください。' });
      return;
    }

    // OTP検証
    console.log('🔢 OTP比較:', { 入力値: otp, 保存値: storedData.otp, 一致: storedData.otp === otp });
    if (storedData.otp !== otp) {
      // 試行回数を増加
      storedData.attempts++;
      
      // IPごとの失敗回数を記録
      const ipData = global.ipBlockStore.get(clientIp) || { attempts: 0, blockedUntil: 0 };
      ipData.attempts++;
      
      // 短期間に5回失敗したらIPブロック
      if (ipData.attempts >= 5) {
        ipData.blockedUntil = Date.now() + 60 * 60 * 1000; // 1時間ブロック
        global.ipBlockStore.set(clientIp, ipData);
      }
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin
          .from('sms_verifications')
          .update({ attempts: storedData.attempts + 1 })
          .eq('phone_number', normalizedPhone);
      } catch {}
      
      const remainingAttempts = 5 - (storedData.attempts + 1);
      console.log(`❌ OTP不一致: 残り${remainingAttempts}回`);
      
      res.status(400).json({ 
        error: `認証コードが正しくありません。残り${remainingAttempts}回入力できます。` 
      });
      return;
    }

    console.log('✅ OTP認証成功');

    // 認証成功時の処理 - DBとメモリ両方から削除
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabaseAdmin
        .from('sms_verifications')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('phone_number', normalizedPhone);
    } catch {}
    global.otpStore?.delete(normalizedPhone);

    // セッション設定
    res.setHeader('Set-Cookie', [
      `session_verified=true; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`,
      `phone_verified=${normalizedPhone}; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`
    ]);
    
    res.status(200).json({ 
      success: true,
      message: '認証が完了しました'
    });

    // セキュリティヘッダー設定（完全版）
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  } catch (error) {
    console.error('💥 OTP認証エラー:', error);
    res.status(500).json({ error: '認証に失敗しました' });
  }
}