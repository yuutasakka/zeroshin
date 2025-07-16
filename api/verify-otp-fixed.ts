import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定 - 本番環境用
  const allowedOrigins = [
    'https://moneyticket.vercel.app',
    'https://moneyticket-git-main-sakkayuta.vercel.app',
    'https://moneyticket01-10gswrw2q-seai0520s-projects.vercel.app',
    'https://moneyticket01-rogabfsul-seai0520s-projects.vercel.app',
    'https://moneyticket01-18dyp3oo0-seai0520s-projects.vercel.app',
    'https://moneyticket01-jba8tb9fl-seai0520s-projects.vercel.app',
    'https://moneyticket01-5dbezddft-seai0520s-projects.vercel.app',
    'https://moneyticket01-8hq0b6f3c-seai0520s-projects.vercel.app',
    'https://moneyticket01-49mjpk0jf-seai0520s-projects.vercel.app',
    'https://moneyticket01-ixkbvpo36-seai0520s-projects.vercel.app',
    'https://moneyticket01-knwbw1xhr-seai0520s-projects.vercel.app',
    'https://moneyticket01-jaskh9loi-seai0520s-projects.vercel.app',
    'https://moneyticket01-fru2t4as7-seai0520s-projects.vercel.app',
    'https://moneyticket01-5wrbneqpz-seai0520s-projects.vercel.app',
    'https://moneyticket01-iz92wyew3-seai0520s-projects.vercel.app',
    'https://moneyticket01-pbcipwr4q-seai0520s-projects.vercel.app',
    'https://moneyticket01-52157o3m3-seai0520s-projects.vercel.app',
    'https://moneyticket01-3k0j3cwan-seai0520s-projects.vercel.app',
    'https://moneyticket01-ep83ycdvf-seai0520s-projects.vercel.app',
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
    console.log('🔍 OTP認証開始');
    
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      res.status(400).json({ error: '電話番号と認証コードが必要です' });
      return;
    }

    console.log('📞 認証リクエスト:', { phoneNumber, otp: otp.substring(0, 2) + '****' });

    // 電話番号正規化（Twilioテスト成功形式に合わせて修正）
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    console.log('🔍 正規化前:', phoneNumber, '→', normalizedPhone);
    
    if (normalizedPhone.startsWith('0')) {
      // 090-5704-4893 → 09057044893 → +819057044893
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('81')) {
      // 81で始まる場合は+を追加
      normalizedPhone = '+' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('+')) {
      // +がない場合は+81を追加
      normalizedPhone = '+81' + normalizedPhone;
    }

    console.log('📲 正規化後:', normalizedPhone);

    // SupabaseからOTP取得（メモリフォールバック付き）
    let storedData = null;
    
    try {
      // Supabase Admin接続
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabaseAdmin
        .from('sms_verifications')
        .select('otp_code, created_at, attempts')
        .eq('phone_number', normalizedPhone)
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

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
        // フォールバック: メモリから取得
        global.otpStore = global.otpStore || new Map();
        storedData = global.otpStore.get(normalizedPhone);
      }
    } catch (dbError) {
      console.error('⚠️ DB接続失敗、メモリから取得:', dbError);
      global.otpStore = global.otpStore || new Map();
      storedData = global.otpStore.get(normalizedPhone);
    }
    
    if (!storedData) {
      console.log('❌ OTP not found');
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
      
      res.status(400).json({ error: '認証コードの入力回数が上限に達しました。新しいコードを取得してください。' });
      return;
    }

    // OTP検証
    if (storedData.otp !== otp) {
      // 試行回数を増加
      try {
        const { createClient } = require('@supabase/supabase-js');
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