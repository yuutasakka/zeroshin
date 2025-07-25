import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXJ6YnVxZ3ltcnRuZm12d2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTY3NzgsImV4cCI6MjA0Nzk5Mjc3OH0.s4P00R6h9L7e1G2mpPJg5EkJyxAD85_FTuVzrQqkzB8';

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

    // Service RoleキーまたはAnonキーを使用
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasAnyKey: !!supabaseKey
      });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Supabaseクライアントを作成（Service roleキーが利用可能な場合はそれを使用）
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Using Supabase key type:', supabaseServiceKey ? 'service_role' : 'anon');

    console.log('Fetching admin credentials for username:', username);

    // 管理者情報を取得
    const { data: admin, error: fetchError } = await supabase
      .from('admin_credentials')
      .select('password_hash, is_active')
      .eq('username', username)
      .single();

    if (fetchError) {
      console.error('Admin fetch error:', {
        error: fetchError,
        username: username,
        code: fetchError.code,
        message: fetchError.message
      });
      
      // Service roleキーが無効な場合のエラーハンドリング
      if (fetchError.message?.includes('JWT') || fetchError.code === 'PGRST301') {
        return res.status(500).json({ error: 'Server authentication error' });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin) {
      console.error('Admin not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // パスワードを検証
    console.log('Password verification:', {
      providedPasswordLength: password.length,
      hashLength: admin.password_hash?.length,
      hashPrefix: admin.password_hash?.substring(0, 10)
    });
    
    const isValid = await bcrypt.compare(password, admin.password_hash);
    
    // デバッグ: 新しいハッシュを生成して比較
    if (!isValid && password === 'Admin123!') {
      const newHash = await bcrypt.hash(password, 10);
      console.log('Debug - New hash generated:', newHash);
      console.log('Debug - Existing hash:', admin.password_hash);
      console.log('Debug - Hash match test:', await bcrypt.compare(password, newHash));
    }

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