import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../src/components/supabaseClient';

// LINE Login APIエンドポイント
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_REDIRECT_URI = process.env.LINE_REDIRECT_URI || 'https://zeroshin.vercel.app/api/line-callback';

interface LineTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface LineProfileResponse {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'login':
        return handleLineLogin(req, res);
      case 'callback':
        return handleLineCallback(req, res);
      case 'verify':
        return handleTokenVerification(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('LINE認証エラー:', error);
    return res.status(500).json({ 
      error: 'LINE認証処理中にエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

// LINE Login URL生成
async function handleLineLogin(req: VercelRequest, res: VercelResponse) {
  if (!LINE_CHANNEL_ID) {
    return res.status(500).json({ error: 'LINE設定が不完全です' });
  }

  // CSRF対策用のstate生成
  const state = crypto.randomBytes(32).toString('hex');
  const nonce = crypto.randomBytes(32).toString('hex');

  // stateをデータベースに一時保存
  await supabase.from('line_auth_states').insert({
    state,
    nonce,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10分後
    created_at: new Date().toISOString()
  });

  const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', LINE_CHANNEL_ID);
  authUrl.searchParams.set('redirect_uri', LINE_REDIRECT_URI);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'profile openid');
  authUrl.searchParams.set('nonce', nonce);

  return res.json({
    authUrl: authUrl.toString(),
    state
  });
}

// LINE Callback処理
async function handleLineCallback(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `LINE認証エラー: ${error}` });
  }

  if (!code || !state) {
    return res.status(400).json({ error: '認証パラメータが不正です' });
  }

  // state検証
  const { data: stateData } = await supabase
    .from('line_auth_states')
    .select('*')
    .eq('state', state)
    .single();

  if (!stateData) {
    return res.status(400).json({ error: '不正なstateパラメータです' });
  }

  // stateを削除（1回のみ使用）
  await supabase.from('line_auth_states').delete().eq('state', state);

  try {
    // アクセストークン取得
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_CHANNEL_ID!,
        client_secret: LINE_CHANNEL_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('LINE トークン取得に失敗しました');
    }

    const tokenData: LineTokenResponse = await tokenResponse.json();

    // プロフィール取得
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('LINE プロフィール取得に失敗しました');
    }

    const profile: LineProfileResponse = await profileResponse.json();

    // ユーザー情報をデータベースに保存
    const { data: userData, error: userError } = await supabase
      .from('line_users')
      .upsert({
        line_user_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
        status_message: profile.statusMessage,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'line_user_id'
      })
      .select()
      .single();

    if (userError) {
      throw new Error('ユーザー情報の保存に失敗しました');
    }

    // JWT生成
    const sessionToken = jwt.sign(
      {
        userId: profile.userId,
        displayName: profile.displayName,
        type: 'line_auth'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // 認証ログ記録
    await supabase.from('line_auth_logs').insert({
      line_user_id: profile.userId,
      action: 'login_success',
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent'],
      success: true,
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      user: {
        id: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      },
      token: sessionToken
    });

  } catch (error) {
    // エラーログ記録
    await supabase.from('line_auth_logs').insert({
      line_user_id: null,
      action: 'login_error',
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent'],
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      created_at: new Date().toISOString()
    });

    throw error;
  }
}

// トークン検証
async function handleTokenVerification(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証トークンが必要です' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'line_auth') {
      return res.status(401).json({ error: '不正なトークンタイプです' });
    }

    // ユーザー情報を取得
    const { data: userData } = await supabase
      .from('line_users')
      .select('*')
      .eq('line_user_id', decoded.userId)
      .single();

    return res.json({
      valid: true,
      user: {
        id: decoded.userId,
        displayName: decoded.displayName,
        pictureUrl: userData?.picture_url
      }
    });

  } catch (error) {
    return res.status(401).json({ 
      valid: false, 
      error: 'トークンが無効です' 
    });
  }
}