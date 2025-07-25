import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
    const { password } = req.body;
    
    // テスト用: Admin123! のハッシュ値を生成
    const testPassword = 'Admin123!';
    const testHash = await bcrypt.hash(testPassword, 10);
    
    // 既存のハッシュ値
    const existingHash = '$2a$10$X3wY6Z8kQ9l2M5nR4pT7vO1uS3jH2gK8fL0xV9bC6mN7eW5dY4qZ2';
    
    // パスワードの検証テスト
    const isValidWithExisting = await bcrypt.compare(password || testPassword, existingHash);
    const isValidWithNewHash = await bcrypt.compare(password || testPassword, testHash);
    
    // Supabase接続テスト
    const supabaseUrl = 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXJ6YnVxZ3ltcnRuZm12d2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTY3NzgsImV4cCI6MjA0Nzk5Mjc3OH0.s4P00R6h9L7e1G2mpPJg5EkJyxAD85_FTuVzrQqkzB8';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // admin_credentialsテーブルからデータを取得
    const { data: adminData, error: fetchError } = await supabase
      .from('admin_credentials')
      .select('username, password_hash, is_active')
      .eq('username', 'admin')
      .single();
    
    let dbHashValidation = false;
    if (adminData && adminData.password_hash) {
      dbHashValidation = await bcrypt.compare(password || testPassword, adminData.password_hash);
    }
    
    return res.status(200).json({ 
      debug: true,
      testResults: {
        providedPassword: password ? `${password.substring(0, 3)}***` : 'none',
        testPassword: testPassword,
        newHashGenerated: testHash,
        existingHash: existingHash,
        isValidWithExisting,
        isValidWithNewHash,
        supabaseConnection: !fetchError,
        adminDataFound: !!adminData,
        dbHashValidation,
        adminData: adminData ? {
          username: adminData.username,
          hashLength: adminData.password_hash?.length,
          isActive: adminData.is_active
        } : null,
        fetchError: fetchError ? {
          message: fetchError.message,
          code: fetchError.code
        } : null
      }
    });

  } catch (error: any) {
    console.error('Test auth error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error.message
    });
  }
}