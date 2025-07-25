import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS設定
  const origin = req.headers.origin;
  if (origin && origin.includes('vercel.app')) {
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
    const { phoneNumber, diagnosisAnswers, sessionId } = req.body;
    
    if (!phoneNumber) {
      res.status(400).json({ error: '電話番号が必要です' });
      return;
    }

    // Supabase設定
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: 'データベース接続エラー'
      });
    }

    // Supabaseクライアント作成（サービスロールキーを使用）
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 電話番号の正規化
    let normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // ユーザーデータを保存
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        phone_number: normalizedPhone,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number'
      })
      .select()
      .single();

    if (userError) {
      throw new Error('ユーザー情報の保存に失敗しました');
    }

    // 診断データがある場合は保存
    if (diagnosisAnswers && Object.keys(diagnosisAnswers).length > 0 && userData) {
      const { error: diagnosisError } = await supabase
        .from('diagnosis_results')
        .insert({
          user_id: userData.id,
          phone_number: normalizedPhone,
          diagnosis_data: diagnosisAnswers,
          session_id: sessionId || `session-${Date.now()}`,
          created_at: new Date().toISOString()
        });

      if (diagnosisError) {
        // 診断データの保存に失敗してもユーザー登録は成功とする
      }
    }


    res.status(200).json({ 
      success: true,
      userId: userData.id
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'データ保存に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}