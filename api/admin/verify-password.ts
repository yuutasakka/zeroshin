import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Service roleを使用してSupabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 管理者情報を取得
    const { data: admin, error: fetchError } = await supabase
      .from('admin_credentials')
      .select('password_hash, is_active')
      .eq('username', username)
      .single();

    if (fetchError || !admin) {
      console.error('Admin fetch error:', fetchError);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // パスワードを検証
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      // ログイン失敗を記録（audit_logsに）
      await supabase.from('audit_logs').insert({
        event_type: 'admin_login_failure',
        username: username,
        description: 'Invalid password',
        ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        severity: 'warning'
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ログイン成功を記録
    await supabase.from('audit_logs').insert({
      event_type: 'admin_login_success',
      username: username,
      description: 'Admin login successful',
      ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      severity: 'info'
    });

    // 最終ログイン時刻を更新
    await supabase
      .from('admin_credentials')
      .update({ last_login: new Date().toISOString() })
      .eq('username', username);

    return res.status(200).json({ 
      success: true,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}