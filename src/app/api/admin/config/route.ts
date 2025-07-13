import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from '../../../../middleware/security';
import { SessionManager } from '../../../../lib/sessionManager';
import { SecureConfigManager } from '../../../../api/secureConfig';

// 設定取得（管理者のみ）
export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック（実装が必要）
    const { session } = SessionManager.getSessionFromRequest(request);
    
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // CSRF保護
    const csrfValid = await SecurityMiddleware.verifyCSRFToken(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // 設定一覧を取得（機密情報は非表示）
    const configs = await SecureConfigManager.getAllConfigs();
    
    const response = NextResponse.json({ configs });
    return SecurityMiddleware.setSecurityHeaders(response);
  } catch (error) {
    console.error('Config GET API error:', error);
    const response = NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}

// 設定更新（管理者のみ）
export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const { session } = SessionManager.getSessionFromRequest(request);
    
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // CSRF保護
    const csrfValid = await SecurityMiddleware.verifyCSRFToken(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // レート制限
    const clientIP = SecurityMiddleware.getClientIP(request);
    const rateLimitOk = await SecurityMiddleware.checkRateLimit(`config_${clientIP}`, 10, 300000); // 5分間に10回
    
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const sanitizedBody = SecurityMiddleware.sanitizeInput(body);
    const { key, value, encrypt = true } = sanitizedBody;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'key と value が必要です' },
        { status: 400 }
      );
    }

    // セキュリティパターン検出
    if (SecurityMiddleware.detectSQLInjection(key) || 
        SecurityMiddleware.detectXSS(key) ||
        SecurityMiddleware.detectSQLInjection(value) || 
        SecurityMiddleware.detectXSS(value)) {
      return NextResponse.json(
        { error: '無効な入力です' },
        { status: 400 }
      );
    }

    // 設定を保存
    const success = await SecureConfigManager.saveSecureConfig(key, value, encrypt);
    
    if (!success) {
      return NextResponse.json(
        { error: '設定の保存に失敗しました' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    return SecurityMiddleware.setSecurityHeaders(response);
  } catch (error) {
    console.error('Config POST API error:', error);
    const response = NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}

// 設定の初期化
export async function PUT(request: NextRequest) {
  try {
    // 管理者認証チェック
    const { session } = SessionManager.getSessionFromRequest(request);
    
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // CSRF保護
    const csrfValid = await SecurityMiddleware.verifyCSRFToken(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // デフォルト設定を初期化
    await SecureConfigManager.initializeDefaultConfigs();
    
    const response = NextResponse.json({ success: true, message: 'デフォルト設定を初期化しました' });
    return SecurityMiddleware.setSecurityHeaders(response);
  } catch (error) {
    console.error('Config PUT API error:', error);
    const response = NextResponse.json(
      { error: '設定の初期化に失敗しました' },
      { status: 500 }
    );
    return SecurityMiddleware.setSecurityHeaders(response);
  }
}