import { NextRequest, NextResponse } from 'next/server';
import { SMSAuthService } from '../../../../api/smsAuth';
import { SecurityMiddleware } from '../../../../middleware/security';

export async function POST(request: NextRequest) {
  try {
    // セキュリティチェック
    const clientIP = SecurityMiddleware.getClientIP(request);
    
    // レート制限チェック
    const rateLimitOk = await SecurityMiddleware.checkRateLimit(clientIP, 5, 60000); // 1分間に5回
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます。しばらく待ってからお試しください。' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // 入力サニタイゼーション
    const sanitizedBody = SecurityMiddleware.sanitizeInput(body);
    const { phoneNumber } = sanitizedBody;
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: '電話番号が必要です' }, 
        { status: 400 }
      );
    }

    // セキュリティパターン検出
    if (SecurityMiddleware.detectSQLInjection(phoneNumber) || 
        SecurityMiddleware.detectXSS(phoneNumber)) {
      return NextResponse.json(
        { error: '無効な入力です' },
        { status: 400 }
      );
    }

    const result = await SMSAuthService.sendOTP(phoneNumber);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });
    return SecurityMiddleware.setSecurityHeaders(response);
  } catch (error) {
    console.error('Send OTP API error:', error);
    const response = NextResponse.json(
      { error: 'SMS送信に失敗しました' }, 
      { status: 500 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}