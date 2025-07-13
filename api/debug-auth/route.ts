import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisSessionManager } from '../../../../components/supabaseClient';
import { SecurityMiddleware } from '../../../middleware/security';
import { SessionManager } from '../../../lib/sessionManager';

export async function POST(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    const response = NextResponse.json({ error: 'Debug API not available in production' }, { status: 404 });
    return SecurityMiddleware.setSecurityHeaders(response);
  }

  // セキュリティチェック
  const clientIP = SecurityMiddleware.getClientIP(request);
  
  // レート制限チェック（開発環境でも適用）
  const rateLimitOk = await SecurityMiddleware.checkRateLimit(`debug_${clientIP}`, 20, 60000); // 1分間に20回
  if (!rateLimitOk) {
    const response = NextResponse.json(
      { error: 'リクエストが多すぎます。しばらく待ってからお試しください。' },
      { status: 429 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }

  // 開発環境でも認証をチェック（オプション）
  const { session } = SessionManager.getSessionFromRequest(request);
  if (!session && process.env.REQUIRE_AUTH_FOR_DEBUG === 'true') {
    const response = NextResponse.json(
      { error: 'Authentication required for debug API' },
      { status: 401 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
  
  try {
    console.log('🟢 デバッグAPI: リクエスト受信');
    
    const body = await request.json();
    
    // 入力サニタイゼーション
    const sanitizedBody = SecurityMiddleware.sanitizeInput(body);
    const { action, sessionId, phoneNumber } = sanitizedBody;
    
    console.log('🟢 リクエストボディ（サニタイズ済み）:', { action, sessionId: sessionId ? '[REDACTED]' : null, phoneNumber: phoneNumber ? '[REDACTED]' : null });
    
    const diagnosisManager = new DiagnosisSessionManager();
    
    let result: any = {};
    
    switch (action) {
      case 'check_session':
        if (sessionId) {
          console.log('🔍 セッションチェック:', sessionId);
          const session = await diagnosisManager.getDiagnosisSession(sessionId);
          result = {
            action: 'check_session',
            sessionId,
            session,
            exists: !!session,
            sms_verified: session?.sms_verified || false
          };
        } else {
          result = { error: 'sessionId が必要です' };
        }
        break;
        
      case 'check_phone':
        if (phoneNumber) {
          console.log('🔍 電話番号チェック:', phoneNumber);
          const isUsed = await diagnosisManager.checkPhoneNumberUsage(phoneNumber);
          result = {
            action: 'check_phone',
            phoneNumber,
            isUsed
          };
        } else {
          result = { error: 'phoneNumber が必要です' };
        }
        break;
        
      case 'list_sessions':
        console.log('🔍 全セッション一覧取得');
        // 管理者用の全セッション取得（開発環境のみ）
        if (process.env.NODE_ENV !== 'production') {
          try {
            const sessions = await diagnosisManager.getAllSessions();
            result = {
              action: 'list_sessions',
              sessions,
              count: sessions ? sessions.length : 0
            };
          } catch (error) {
            result = { error: 'セッション取得エラー', details: error };
          }
        } else {
          result = { error: '本番環境では利用できません' };
        }
        break;
        
      default:
        result = { error: '不明なアクション', availableActions: ['check_session', 'check_phone', 'list_sessions'] };
    }
    
    console.log('🟢 デバッグAPI結果:', result);
    
    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: 'development',
      ...result
    });
    
    return SecurityMiddleware.setSecurityHeaders(response);
    
  } catch (error) {
    console.error('❌ デバッグAPIエラー:', error);
    const response = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}

export async function GET(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    const response = NextResponse.json({ error: 'Debug API not available in production' }, { status: 404 });
    return SecurityMiddleware.setSecurityHeaders(response);
  }

  // セキュリティチェック（GET用）
  const clientIP = SecurityMiddleware.getClientIP(request);
  const rateLimitOk = await SecurityMiddleware.checkRateLimit(`debug_get_${clientIP}`, 10, 60000);
  if (!rateLimitOk) {
    const response = NextResponse.json(
      { error: 'リクエストが多すぎます' },
      { status: 429 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
  
  try {
    console.log('🟢 デバッグAPI GET: ヘルスチェック');
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'health') {
      const response = NextResponse.json({
        success: true,
        message: 'デバッグAPIは正常に動作しています',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      return SecurityMiddleware.setSecurityHeaders(response);
    }
    
    const response = NextResponse.json({
      success: true,
      message: 'AI ConectX 認証デバッグAPI',
      availableActions: [
        'POST /api/debug-auth - { action: "check_session", sessionId: "..." }',
        'POST /api/debug-auth - { action: "check_phone", phoneNumber: "..." }',
        'POST /api/debug-auth - { action: "list_sessions" }',
        'GET /api/debug-auth?action=health'
      ],
      timestamp: new Date().toISOString(),
      environment: 'development'
    });
    
    return SecurityMiddleware.setSecurityHeaders(response);
    
  } catch (error) {
    console.error('❌ デバッグAPI GETエラー:', error);
    const response = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}