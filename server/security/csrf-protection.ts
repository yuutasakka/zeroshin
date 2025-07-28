/**
 * CSRF攻撃防止システム
 * 電話番号認証と管理画面ログインを保護
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// CSRFトークンの設定
const CSRF_CONFIG = {
  tokenLength: 32,
  headerName: 'X-CSRF-Token',
  cookieName: '_csrf',
  sessionKey: 'csrfSecret',
  maxAge: 3600000, // 1時間
  algorithm: 'sha256',
  encoding: 'hex' as BufferEncoding
};

/**
 * CSRFトークン管理クラス
 */
export class CSRFProtection {
  private static instance: CSRFProtection;
  private tokenStore: Map<string, { token: string; secret: string; expires: number; ip?: string }> = new Map();

  private constructor() {
    // シングルトンパターンで実装
    this.startCleanupInterval();
  }

  public static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  /**
   * セキュアなランダム文字列生成
   */
  private generateSecureRandom(length: number): string {
    return crypto.randomBytes(length).toString(CSRF_CONFIG.encoding);
  }

  /**
   * CSRFトークンの生成
   */
  generateToken(sessionId: string, clientIP?: string): { token: string; secret: string } {
    const secret = this.generateSecureRandom(CSRF_CONFIG.tokenLength);
    const tokenData = `${sessionId}:${secret}:${Date.now()}`;
    const token = crypto
      .createHmac(CSRF_CONFIG.algorithm, process.env.CSRF_SECRET || 'default-csrf-secret')
      .update(tokenData)
      .digest(CSRF_CONFIG.encoding);

    const expires = Date.now() + CSRF_CONFIG.maxAge;
    
    // トークンをメモリストアに保存
    this.tokenStore.set(sessionId, {
      token,
      secret,
      expires,
      ip: clientIP
    });

    return { token, secret };
  }

  /**
   * CSRFトークンの検証
   */
  validateToken(sessionId: string, providedToken: string, clientIP?: string): boolean {
    const tokenData = this.tokenStore.get(sessionId);
    
    if (!tokenData) {
      console.warn('CSRF: Token not found for session', sessionId);
      return false;
    }

    // 有効期限チェック
    if (Date.now() > tokenData.expires) {
      console.warn('CSRF: Token expired for session', sessionId);
      this.tokenStore.delete(sessionId);
      return false;
    }

    // IPアドレスチェック（オプション）
    if (tokenData.ip && clientIP && tokenData.ip !== clientIP) {
      console.warn('CSRF: IP mismatch for session', sessionId, 'Expected:', tokenData.ip, 'Got:', clientIP);
      return false;
    }

    // トークン比較（タイミング攻撃対策）
    const isValid = crypto.timingSafeEqual(
      Buffer.from(tokenData.token, CSRF_CONFIG.encoding),
      Buffer.from(providedToken, CSRF_CONFIG.encoding)
    );

    if (isValid) {
      // 使用済みトークンを削除（ワンタイムトークン）
      this.tokenStore.delete(sessionId);
    } else {
      console.warn('CSRF: Token validation failed for session', sessionId);
    }

    return isValid;
  }

  /**
   * セッション用のCSRFトークンを取得
   */
  getTokenForSession(sessionId: string): string | null {
    const tokenData = this.tokenStore.get(sessionId);
    return tokenData && Date.now() <= tokenData.expires ? tokenData.token : null;
  }

  /**
   * 期限切れトークンのクリーンアップ
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, tokenData] of this.tokenStore.entries()) {
        if (now > tokenData.expires) {
          this.tokenStore.delete(sessionId);
        }
      }
    }, 300000); // 5分ごとにクリーンアップ
  }

  /**
   * すべてのトークンをクリア
   */
  clearAllTokens(): void {
    this.tokenStore.clear();
  }

  /**
   * 統計情報取得
   */
  getStats(): { totalTokens: number; expiredTokens: number } {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const tokenData of this.tokenStore.values()) {
      if (now > tokenData.expires) {
        expiredCount++;
      }
    }

    return {
      totalTokens: this.tokenStore.size,
      expiredTokens: expiredCount
    };
  }
}

/**
 * CSRFミドルウェア
 */
export function csrfMiddleware(options: {
  excludePaths?: string[];
  methods?: string[];
} = {}) {
  const { excludePaths = [], methods = ['POST', 'PUT', 'DELETE', 'PATCH'] } = options;
  
  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // 除外パスのチェック
    if (excludePaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // 対象メソッドのみ検証
    if (!methods.includes(method)) {
      return NextResponse.next();
    }

    const csrf = CSRFProtection.getInstance();
    const sessionId = request.cookies.get('sessionId')?.value || 
                     request.headers.get('x-session-id') ||
                     'anonymous';
    
    // CSRFトークンの取得
    const csrfToken = request.headers.get(CSRF_CONFIG.headerName) ||
                     request.cookies.get(CSRF_CONFIG.cookieName)?.value;

    if (!csrfToken) {
      console.warn('CSRF: No token provided', { method, pathname, sessionId });
      return new NextResponse('CSRF token required', { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    const clientIP = request.ip || request.headers.get('x-forwarded-for');
    const isValid = csrf.validateToken(sessionId, csrfToken, clientIP);

    if (!isValid) {
      console.warn('CSRF: Invalid token', { method, pathname, sessionId, clientIP });
      return new NextResponse('Invalid CSRF token', { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // 検証成功時は次のミドルウェアに進む
    return NextResponse.next();
  };
}

/**
 * APIルート用のCSRF検証ヘルパー
 */
export async function validateCSRFForAPI(
  request: NextRequest,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const csrf = CSRFProtection.getInstance();
  const csrfToken = request.headers.get(CSRF_CONFIG.headerName);

  if (!csrfToken) {
    return { success: false, error: 'CSRF token required' };
  }

  const clientIP = request.ip || request.headers.get('x-forwarded-for');
  const isValid = csrf.validateToken(sessionId, csrfToken, clientIP);

  if (!isValid) {
    return { success: false, error: 'Invalid CSRF token' };
  }

  return { success: true };
}

/**
 * フロントエンド用のCSRFトークン取得API
 */
export class CSRFTokenAPI {
  static async generateTokenResponse(
    sessionId: string,
    clientIP?: string
  ): Promise<NextResponse> {
    const csrf = CSRFProtection.getInstance();
    const { token, secret } = csrf.generateToken(sessionId, clientIP);

    const response = NextResponse.json({
      csrfToken: token,
      expiresIn: CSRF_CONFIG.maxAge,
      timestamp: Date.now()
    });

    // CSRFトークンをセキュアなクッキーとしても設定
    response.cookies.set(CSRF_CONFIG.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_CONFIG.maxAge / 1000,
      path: '/'
    });

    return response;
  }
}

/**
 * React Hook用のCSRFヘルパー
 */
export const CSRFHelper = {
  /**
   * フェッチリクエストにCSRFトークンを追加
   */
  addCSRFHeaders: (headers: Record<string, string> = {}): Record<string, string> => {
    const csrfToken = typeof window !== 'undefined' 
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith(`${CSRF_CONFIG.cookieName}=`))
          ?.split('=')[1]
      : null;

    if (csrfToken) {
      headers[CSRF_CONFIG.headerName] = csrfToken;
    }

    return headers;
  },

  /**
   * フォームデータにCSRFトークンを追加
   */
  addCSRFToFormData: (formData: FormData): FormData => {
    const csrfToken = typeof window !== 'undefined'
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith(`${CSRF_CONFIG.cookieName}=`))
          ?.split('=')[1]
      : null;

    if (csrfToken) {
      formData.append('_csrf', csrfToken);
    }

    return formData;
  }
};

export default CSRFProtection;