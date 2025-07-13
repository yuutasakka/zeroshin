import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from '../../../../middleware/security';
import { SessionManager } from '../../../../lib/sessionManager';

export async function GET(request: NextRequest) {
  try {
    // セッション情報を取得
    const { session } = SessionManager.getSessionFromRequest(request);
    
    if (!session || !session.authenticated) {
      const response = NextResponse.json({ 
        authenticated: false,
        user: null 
      });
      return SecurityMiddleware.setSecurityHeaders(response);
    }

    // 認証済みの場合
    const response = NextResponse.json({ 
      authenticated: true,
      user: {
        phoneNumber: session.phoneNumber,
        userId: session.userId,
        lastActivity: session.lastActivity
      },
      csrfToken: session.csrfToken
    });
    
    return SecurityMiddleware.setSecurityHeaders(response);
  } catch (error) {
    console.error('Auth check API error:', error);
    const response = NextResponse.json(
      { error: '認証状態の確認に失敗しました' }, 
      { status: 500 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}

// 後方互換性のためのPOSTメソッド
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitizedBody = SecurityMiddleware.sanitizeInput(body);
    const { phoneNumber } = sanitizedBody;
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: '電話番号が必要です' }, 
        { status: 400 }
      );
    }

    // セッション情報を取得
    const { session } = SessionManager.getSessionFromRequest(request);
    
    if (!session || !session.authenticated || session.phoneNumber !== phoneNumber) {
      const response = NextResponse.json({ verified: false });
      return SecurityMiddleware.setSecurityHeaders(response);
    }

    const response = NextResponse.json({ verified: true });
    return SecurityMiddleware.setSecurityHeaders(response);
  } catch (error) {
    console.error('Check auth API error:', error);
    const response = NextResponse.json({ verified: false });
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}