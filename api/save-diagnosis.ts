import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// CSRF検証（簡易実装）
function validateCSRF(req: VercelRequest): boolean {
  const csrfToken = req.headers['x-csrf-token'] as string;
  const cookieToken = req.cookies?._csrf;
  return !!(csrfToken && cookieToken && csrfToken === cookieToken);
}

/**
 * 診断データ保存API
 * POST /api/save-diagnosis
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  
  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // CSRFトークンの検証
    if (!validateCSRF(req)) {
      console.warn('Save diagnosis CSRF validation failed');
      return res.status(403).json({ 
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID'
      });
    }

    const { phoneNumber, diagnosisAnswers } = req.body;

    // 入力値の検証
    if (!phoneNumber || !diagnosisAnswers) {
      return res.status(400).json({ 
        error: 'Phone number and diagnosis answers are required' 
      });
    }

    // 電話番号の正規化と検証
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (!/^(090|080|070)\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format' 
      });
    }

    // Supabase設定
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({
        error: 'Database configuration not found',
        code: 'CONFIG_MISSING'
      });
    }

    // Supabaseクライアント作成
    const supabase = createClient(supabaseUrl, supabaseKey);

    // セッションIDの生成
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 国際電話番号形式に変換（+81形式）
    const internationalPhone = '+81' + normalizedPhone.substring(1);

    // 診断セッションデータの作成
    const sessionData = {
      phone_number: internationalPhone,
      diagnosis_answers: diagnosisAnswers,
      session_id: sessionId,
      sms_verified: true, // API経由での保存は認証済み前提
      verification_status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Supabaseにデータを保存
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        error: 'Failed to save diagnosis data',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // 成功レスポンス
    res.status(200).json({
      success: true,
      sessionId: sessionId,
      message: 'Diagnosis data saved successfully',
      data: {
        id: data.id,
        sessionId: sessionId,
        phoneNumber: normalizedPhone,
        saved_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Save diagnosis API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}