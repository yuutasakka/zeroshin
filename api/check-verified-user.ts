import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS設定
  const origin = req.headers.origin;
  if (origin && origin.includes('vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: '電話番号が必要です' });
    }

    // Supabase設定
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: 'データベース接続エラー'
      });
    }

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

    // 既に認証済みのユーザーかチェック
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, last_verified_at')
      .eq('phone_number', normalizedPhone)
      .single();

    if (existingUser && existingUser.last_verified_at) {
      // 最後の認証から1年以内の場合
      const lastVerified = new Date(existingUser.last_verified_at);
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      
      if (lastVerified > oneYearAgo) {
        const nextAvailableDate = new Date(lastVerified);
        nextAvailableDate.setFullYear(nextAvailableDate.getFullYear() + 1);
        
        return res.status(200).json({ 
          isVerified: true,
          userId: existingUser.id,
          message: `この電話番号は既に診断済みです。次回の診断は ${nextAvailableDate.toLocaleDateString('ja-JP')} 以降に可能です。`,
          lastVerifiedAt: lastVerified.toISOString(),
          nextAvailableAt: nextAvailableDate.toISOString()
        });
      }
    }

    return res.status(200).json({ 
      isVerified: false,
      message: '認証が必要です'
    });

  } catch (error: any) {
    res.status(500).json({
      error: '確認処理に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}