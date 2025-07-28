import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * パブリック設定API
 * GET /api/public-config
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETリクエストのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 本番環境の設定を返す
    const config = {
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      environment: process.env.NODE_ENV || 'development',
      timestamp: Date.now()
    };

    // 設定値の存在確認
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!config.supabaseUrl,
        hasKey: !!config.supabaseAnonKey
      });
      
      return res.status(500).json({
        error: 'Supabase configuration not found',
        success: false
      });
    }

    res.status(200).json(config);

  } catch (error) {
    console.error('Public config error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      success: false
    });
  }
}