import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from '../../../../middleware/security';
import { SessionManager } from '../../../../lib/sessionManager';

export async function POST(request: NextRequest) {
  try {
    // セッション情報を取得
    const { sessionToken } = SessionManager.getSessionFromRequest(request);
    
    if (sessionToken) {
      // セッションを破棄
      SessionManager.destroySession(sessionToken);
    }
    
    // クッキーをクリア
    let response = NextResponse.json({ success: true });
    response = SessionManager.clearSessionCookies(response);
    response = SecurityMiddleware.setSecurityHeaders(response);
    
    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    const response = NextResponse.json(
      { error: 'ログアウトに失敗しました' }, 
      { status: 500 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}