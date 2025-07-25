import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS設定
  const origin = req.headers.origin;
  if (origin && origin.includes('vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 管理者認証チェック（簡易版）
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // Supabase設定
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'データベース接続エラー' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 全ての診断結果を取得して、JavaScriptで集計
    const { data: allDiagnosis, error } = await supabase
      .from('diagnosis_results')
      .select('phone_number, created_at, id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Diagnosis fetch error:', error);
      return res.status(500).json({ error: 'データ取得エラー' });
    }

    // 電話番号ごとにグループ化
    const phoneGroups = allDiagnosis?.reduce((acc: any, item: any) => {
      const phone = item.phone_number;
      if (!acc[phone]) {
        acc[phone] = [];
      }
      acc[phone].push({
        id: item.id,
        createdAt: item.created_at
      });
      return acc;
    }, {}) || {};

    // 重複している電話番号のみを抽出
    const duplicates = Object.entries(phoneGroups)
      .filter(([phone, records]: [string, any]) => records.length > 1)
      .map(([phone, records]: [string, any]) => ({
        phoneNumber: phone,
        maskedPhone: phone.substring(0, 6) + '****',
        count: records.length,
        firstDiagnosis: records[records.length - 1].createdAt,
        lastDiagnosis: records[0].createdAt,
        records: records.map((r: any) => ({
          id: r.id,
          createdAt: r.createdAt
        }))
      }))
      .sort((a, b) => b.count - a.count);

    // ユーザーテーブルからも重複を確認
    const { data: users } = await supabase
      .from('users')
      .select('phone_number, created_at, last_verified_at')
      .order('created_at', { ascending: false });

    // ユーザーテーブルの重複も検出
    const userPhoneCount = users?.reduce((acc: any, user: any) => {
      acc[user.phone_number] = (acc[user.phone_number] || 0) + 1;
      return acc;
    }, {}) || {};

    const userDuplicates = Object.entries(userPhoneCount)
      .filter(([phone, count]: [string, any]) => count > 1)
      .map(([phone, count]: [string, any]) => ({
        phoneNumber: phone,
        maskedPhone: phone.substring(0, 6) + '****',
        count: count,
        table: 'users'
      }));

    res.status(200).json({
      duplicates: {
        diagnosisResults: duplicates,
        users: userDuplicates,
        summary: {
          totalDuplicatePhones: duplicates.length,
          totalDuplicateRecords: duplicates.reduce((sum, d) => sum + d.count, 0),
          userTableDuplicates: userDuplicates.length
        }
      }
    });

  } catch (error) {
    console.error('Get duplicate phones error:', error);
    res.status(500).json({ 
      error: '重複電話番号の取得に失敗しました'
    });
  }
}