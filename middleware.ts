import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { csrfMiddleware } from './server/security/csrf-protection';

// 管理画面の動的パスを生成（環境変数ベース）
const ADMIN_PATH_SECRET = process.env.ADMIN_PATH_SECRET || 'default-secret';
const ADMIN_PATH_HASH = crypto.createHash('sha256').update(ADMIN_PATH_SECRET).digest('hex').substring(0, 16);
const ADMIN_PATH = `/admin-${ADMIN_PATH_HASH}`;

// Basic認証の設定
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'admin';
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || 'secure-password';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF保護の適用（API経由の重要な操作のみ）
  const csrfProtectedPaths = ['/api/send-otp', '/api/verify-otp', '/api/admin-login'];
  if (csrfProtectedPaths.some(path => pathname.startsWith(path))) {
    const csrfResponse = csrfMiddleware({
      excludePaths: ['/api/csrf-token'], // CSRFトークン取得は除外
      methods: ['POST', 'PUT', 'DELETE', 'PATCH']
    })(request);
    
    if (csrfResponse && csrfResponse instanceof NextResponse) {
      return csrfResponse;
    }
  }

  // 管理画面パスの確認
  if (pathname.startsWith(ADMIN_PATH)) {
    // Basic認証の確認
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !isValidAuth(authHeader)) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    // IP制限（オプション - 環境変数で制御）
    if (process.env.ADMIN_IP_WHITELIST) {
      const clientIP = request.ip || request.headers.get('x-forwarded-for');
      const allowedIPs = process.env.ADMIN_IP_WHITELIST.split(',');
      
      if (clientIP && !allowedIPs.includes(clientIP)) {
        return new NextResponse('Access denied', { status: 403 });
      }
    }

    // 管理画面HTMLの配信
    if (pathname === ADMIN_PATH || pathname === `${ADMIN_PATH}/`) {
      const adminHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理者ダッシュボード</title>
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" as="style">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
      color: #ffffff; 
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .admin-container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .admin-title {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .admin-message {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    .admin-button {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #007acc 0%, #0056b3 100%);
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease;
      text-decoration: none;
      display: inline-block;
    }
    .admin-button:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="admin-container">
    <h1 class="admin-title">🔐 管理者エリア</h1>
    <p class="admin-message">認証が完了しました。管理画面にアクセスできます。</p>
    <p class="admin-message">セキュリティのため、このページは外部からアクセスできません。</p>
    <div style="margin-top: 2rem; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px; font-size: 0.9rem; opacity: 0.8;">
      <p>📊 システム状態: 正常稼働中</p>
      <p>🔒 セキュリティレベル: 最高</p>
      <p>⏰ アクセス時刻: ${new Date().toLocaleString('ja-JP')}</p>
    </div>
  </div>
</body>
</html>`;

      return new NextResponse(adminHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      });
    }

    // その他の管理画面リクエストに対してもセキュリティヘッダーを追加
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }

  // 既知の管理画面パスを404にリダイレクト
  const commonAdminPaths = ['/admin', '/dashboard', '/manage', '/control'];
  if (commonAdminPaths.some(path => pathname.startsWith(path))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

function isValidAuth(authHeader: string): boolean {
  try {
    const encoded = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(encoded, 'base64').toString();
    const [username, password] = decoded.split(':');
    
    return username === BASIC_AUTH_USER && password === BASIC_AUTH_PASS;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};