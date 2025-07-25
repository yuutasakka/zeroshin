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

    // ページネーションパラメータ
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // フィルタリングパラメータ
    const filterDownloaded = req.query.downloaded as string;
    const searchEmail = req.query.email as string;
    const searchPhone = req.query.phone as string;

    // クエリの構築
    let query = supabase
      .from('email_downloads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // フィルタの適用
    if (filterDownloaded === 'true') {
      query = query.eq('is_downloaded', true);
    } else if (filterDownloaded === 'false') {
      query = query.eq('is_downloaded', false);
    }

    if (searchEmail) {
      query = query.ilike('email', `%${searchEmail}%`);
    }

    if (searchPhone) {
      query = query.ilike('phone_number', `%${searchPhone}%`);
    }

    const { data: downloads, count, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'データ取得エラー' });
    }

    // 統計情報を計算
    const stats = {
      total: count || 0,
      downloaded: 0,
      notDownloaded: 0,
      downloadRate: 0
    };

    // 全体の統計を取得
    const { data: statsData } = await supabase
      .from('email_downloads')
      .select('is_downloaded');

    if (statsData) {
      stats.total = statsData.length;
      stats.downloaded = statsData.filter(d => d.is_downloaded).length;
      stats.notDownloaded = stats.total - stats.downloaded;
      stats.downloadRate = stats.total > 0 
        ? Math.round((stats.downloaded / stats.total) * 100) 
        : 0;
    }

    // データをマスキング
    const maskedDownloads = downloads?.map(download => ({
      ...download,
      phone_number: download.phone_number.substring(0, 6) + '****',
      email: maskEmail(download.email),
      download_token: download.download_token.substring(0, 8) + '...'
    })) || [];

    res.status(200).json({
      downloads: maskedDownloads,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalRecords: count || 0,
        limit
      },
      stats
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'ダウンロード統計の取得に失敗しました'
    });
  }
}

// メールアドレスをマスキング
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const username = parts[0];
  const domain = parts[1];
  
  if (username.length <= 3) {
    return username + '***@' + domain;
  }
  
  return username.substring(0, 3) + '***@' + domain;
}