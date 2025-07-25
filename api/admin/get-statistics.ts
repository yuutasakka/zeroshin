import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // 統計情報を取得
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // 総ユーザー数
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 今日の新規ユーザー数
    const { count: todayUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // 今月の新規ユーザー数
    const { count: monthlyUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth);

    // 総診断回数
    const { count: totalDiagnosis } = await supabase
      .from('diagnosis_results')
      .select('*', { count: 'exact', head: true });

    // 今日の診断回数
    const { count: todayDiagnosis } = await supabase
      .from('diagnosis_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // 今月の診断回数
    const { count: monthlyDiagnosis } = await supabase
      .from('diagnosis_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth);

    // 最近のユーザー（10件）
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, phone_number, created_at, last_verified_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // 最近の診断結果（10件）
    const { data: recentDiagnosis } = await supabase
      .from('diagnosis_results')
      .select('id, phone_number, diagnosis_data, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // 日別ユーザー数（過去7日間）
    const dailyStats = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
      
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        users: count || 0
      });
    }

    res.status(200).json({
      statistics: {
        users: {
          total: totalUsers || 0,
          today: todayUsers || 0,
          monthly: monthlyUsers || 0
        },
        diagnosis: {
          total: totalDiagnosis || 0,
          today: todayDiagnosis || 0,
          monthly: monthlyDiagnosis || 0
        },
        dailyStats: dailyStats.reverse()
      },
      recentUsers: recentUsers?.map(user => ({
        ...user,
        phone_number: user.phone_number.substring(0, 6) + '****' // マスキング
      })) || [],
      recentDiagnosis: recentDiagnosis?.map(diagnosis => ({
        ...diagnosis,
        phone_number: diagnosis.phone_number.substring(0, 6) + '****' // マスキング
      })) || []
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      error: '統計情報の取得に失敗しました'
    });
  }
}