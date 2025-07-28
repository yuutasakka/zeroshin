import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 管理画面の動的パスを生成（環境変数ベース）
const ADMIN_PATH_SECRET = process.env.ADMIN_PATH_SECRET || 'default-secret';
// Edge Runtime対応: 簡易ハッシュ生成
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}
const ADMIN_PATH_HASH = simpleHash(ADMIN_PATH_SECRET);
const ADMIN_PATH = `/admin-${ADMIN_PATH_HASH}`;

// Basic認証の設定
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'admin';
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || 'secure-password';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
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

      // 管理画面HTMLの配信（簡略版）
      if (pathname === ADMIN_PATH || pathname === `${ADMIN_PATH}/`) {
        const adminHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>管理者ダッシュボード</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      background: #1a1a2e; 
      color: #ffffff; 
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 管理者エリア</h1>
    <p>認証が完了しました。</p>
    <p>アクセス時刻: ${new Date().toLocaleString('ja-JP')}</p>
  </div>
</body>
</html>`;

        return new NextResponse(adminHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
      }
    }

    // 既知の管理画面パスを404にする
    const commonAdminPaths = ['/admin', '/dashboard', '/manage', '/control'];
    if (commonAdminPaths.some(path => pathname.startsWith(path))) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

function isValidAuth(authHeader: string): boolean {
  try {
    const encoded = authHeader.replace('Basic ', '');
    // Edge Runtime対応: Bufferではなくatobを使用
    const decoded = atob(encoded);
    const [username, password] = decoded.split(':');
    
    return username === BASIC_AUTH_USER && password === BASIC_AUTH_PASS;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    // 管理画面のパスのみを対象にする
    '/admin-:path*',
    '/admin',
    '/dashboard',
    '/manage', 
    '/control'
  ],
};