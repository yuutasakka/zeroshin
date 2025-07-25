import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORSヘッダーを設定
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCorsHeaders(res);

  // OPTIONSリクエストへの対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GETリクエスト: お客様の声一覧を取得
    if (req.method === 'GET') {
      const { includeInactive } = req.query;
      
      let query = supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });
      
      // 管理画面からの場合は全て表示、そうでなければアクティブのみ
      if (!includeInactive || includeInactive !== 'true') {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ error: error.message });
        return;
      }
      
      res.status(200).json({ data });
      return;
    }
    
    // POSTリクエスト: 新しいお客様の声を作成
    if (req.method === 'POST') {
      const { name_and_role, avatar_emoji, rating_stars, text, display_order, is_active } = req.body;
      
      if (!name_and_role || !text) {
        res.status(400).json({ error: '名前と本文は必須です' });
        return;
      }
      
      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          name_and_role,
          avatar_emoji: avatar_emoji || '😊',
          rating_stars: rating_stars || 5,
          text,
          display_order: display_order || 0,
          is_active: is_active !== false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating testimonial:', error);
        res.status(500).json({ error: error.message });
        return;
      }
      
      res.status(201).json({ data });
      return;
    }
    
    // PUTリクエスト: お客様の声を更新
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'IDが必要です' });
        return;
      }
      
      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({ error: error.message });
        return;
      }
      
      res.status(200).json({ data });
      return;
    }
    
    // DELETEリクエスト: お客様の声を削除
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        res.status(400).json({ error: 'IDが必要です' });
        return;
      }
      
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ error: error.message });
        return;
      }
      
      res.status(200).json({ success: true });
      return;
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Testimonials API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}