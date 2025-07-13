import { NextRequest, NextResponse } from 'next/server';
import { SMSAuthService } from '../../../../api/smsAuth';
import { SecurityMiddleware } from '../../../../middleware/security';
import { SessionManager } from '../../../../lib/sessionManager';

export async function POST(request: NextRequest) {
  try {
    // セキュリティチェック
    const clientIP = SecurityMiddleware.getClientIP(request);
    
    // レート制限チェック
    const rateLimitOk = await SecurityMiddleware.checkRateLimit(clientIP, 10, 60000); // 1分間に10回
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます。しばらく待ってからお試しください。' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // 入力サニタイゼーション
    const sanitizedBody = SecurityMiddleware.sanitizeInput(body);
    const { phoneNumber, otp } = sanitizedBody;
    
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: '電話番号と認証コードが必要です' }, 
        { status: 400 }
      );
    }

    // セキュリティパターン検出
    if (SecurityMiddleware.detectSQLInjection(phoneNumber) || 
        SecurityMiddleware.detectXSS(phoneNumber) ||
        SecurityMiddleware.detectSQLInjection(otp) || 
        SecurityMiddleware.detectXSS(otp)) {
      return NextResponse.json(
        { error: '無効な入力です' },
        { status: 400 }
      );
    }

    const result = await SMSAuthService.verifyOTP(phoneNumber, otp);
    
    if (result.success) {
      // 認証成功時にセッション作成
      const { sessionToken, csrfToken } = await SessionManager.createSession(phoneNumber);
      
      let response = NextResponse.json({ 
        success: true,
        csrfToken // フロントエンド用
      });
      
      // セキュアなクッキーを設定
      response = SessionManager.setSessionCookie(response, sessionToken);
      response = SessionManager.setCSRFCookie(response, csrfToken);
      response = SecurityMiddleware.setSecurityHeaders(response);
      
      return response;
    } else {
      const response = NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
      
      return SecurityMiddleware.setSecurityHeaders(response);
    }
  } catch (error) {
    console.error('Verify OTP API error:', error);
    const response = NextResponse.json(
      { error: '認証に失敗しました' }, 
      { status: 500 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}