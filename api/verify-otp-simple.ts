import type { VercelRequest, VercelResponse } from '@vercel/node';

// シンプルなOTP検証API（デバッグ用）
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Simple Verify] リクエスト開始');
    
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: '電話番号とOTPが必要です' });
    }

    console.log('[Simple Verify] 検証開始:', { phoneNumber, otpLength: otp.length });

    // 電話番号正規化
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    }

    // まずSupabaseからOTPを取得を試みる
    let storedData = null;
    
    try {
      console.log('[Simple Verify] SupabaseからOTP取得を試行...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: verificationData } = await supabaseAdmin
        .from('sms_verifications')
        .select('*')
        .eq('phone_number', normalizedPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (verificationData) {
        console.log('[Simple Verify] SupabaseからOTP取得成功');
        // Supabaseのデータをメモリストアの形式に変換
        storedData = {
          otp: verificationData.otp_code,
          expiresAt: new Date(verificationData.created_at).getTime() + 5 * 60 * 1000,
          attempts: verificationData.attempts || 0
        };
      }
    } catch (dbError) {
      console.error('[Simple Verify] Supabaseアクセスエラー:', dbError);
    }
    
    // Supabaseから取得できなかった場合はメモリから取得
    if (!storedData && global.otpStore) {
      console.log('[Simple Verify] メモリストアからOTP取得を試行...');
      storedData = global.otpStore.get(normalizedPhone);
    }
    
    if (!storedData) {
      console.log('[Simple Verify] OTPが見つかりません:', normalizedPhone);
      return res.status(400).json({ error: '認証コードが見つかりません' });
    }

    // 有効期限チェック
    if (storedData.expiresAt < Date.now()) {
      console.log('[Simple Verify] OTPの有効期限切れ');
      if (global.otpStore) {
        global.otpStore.delete(normalizedPhone);
      }
      return res.status(400).json({ error: '認証コードの有効期限が切れました' });
    }

    // OTP検証
    if (storedData.otp !== otp) {
      console.log('[Simple Verify] OTPが一致しません');
      storedData.attempts++;
      
      if (storedData.attempts >= 5) {
        console.log('[Simple Verify] 試行回数超過');
        
        // Supabaseから削除
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          await supabaseAdmin
            .from('sms_verifications')
            .delete()
            .eq('phone_number', normalizedPhone);
        } catch (dbError) {
          console.error('[Simple Verify] Supabase削除エラー:', dbError);
        }
        
        if (global.otpStore) {
          global.otpStore.delete(normalizedPhone);
        }
        return res.status(429).json({ error: '試行回数が上限に達しました' });
      }
      
      return res.status(400).json({ 
        error: '認証コードが正しくありません',
        remainingAttempts: 5 - storedData.attempts
      });
    }

    // 認証成功
    console.log('[Simple Verify] 認証成功');
    
    // Supabaseから削除
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabaseAdmin
        .from('sms_verifications')
        .delete()
        .eq('phone_number', normalizedPhone);
        
      console.log('[Simple Verify] SupabaseからOTP削除完了');
    } catch (dbError) {
      console.error('[Simple Verify] Supabase削除エラー:', dbError);
    }
    
    // メモリからも削除
    if (global.otpStore) {
      global.otpStore.delete(normalizedPhone);
    }
    
    return res.status(200).json({ 
      success: true,
      message: '認証が完了しました'
    });
    
  } catch (error: any) {
    console.error('[Simple Verify] エラー:', error);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました',
      debug: {
        message: error.message
      }
    });
  }
}