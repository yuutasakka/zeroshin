// セキュアなセッション管理
import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from '../middleware/security';

export interface SessionData {
  userId?: string;
  phoneNumber?: string;
  authenticated: boolean;
  createdAt: number;
  lastActivity: number;
  csrfToken?: string;
}

export class SessionManager {
  private static sessions: Map<string, SessionData> = new Map();
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30分
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分

  static {
    // 定期的なクリーンアップ
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);
  }

  // セッション作成
  static async createSession(phoneNumber: string, userId?: string): Promise<{ sessionToken: string; csrfToken: string }> {
    const sessionToken = SecurityMiddleware.generateSessionToken();
    const csrfToken = await SecurityMiddleware.generateCSRFTokenForSession(sessionToken);
    const now = Date.now();

    const sessionData: SessionData = {
      userId,
      phoneNumber,
      authenticated: true,
      createdAt: now,
      lastActivity: now,
      csrfToken
    };

    this.sessions.set(sessionToken, sessionData);
    return { sessionToken, csrfToken };
  }

  // セッション検証
  static validateSession(sessionToken: string): SessionData | null {
    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      return null;
    }

    const now = Date.now();
    
    // セッションタイムアウトチェック
    if (now - session.lastActivity > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionToken);
      return null;
    }

    // 最終アクティビティ時間を更新
    session.lastActivity = now;
    this.sessions.set(sessionToken, session);

    return session;
  }

  // セッション更新
  static updateSession(sessionToken: string, updates: Partial<SessionData>): boolean {
    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      return false;
    }

    const updatedSession = { ...session, ...updates, lastActivity: Date.now() };
    this.sessions.set(sessionToken, updatedSession);
    return true;
  }

  // セッション削除
  static destroySession(sessionToken: string): boolean {
    return this.sessions.delete(sessionToken);
  }

  // リクエストからセッションを取得
  static getSessionFromRequest(request: NextRequest): { session: SessionData | null; sessionToken: string | null } {
    // クッキーからセッショントークンを取得
    const sessionToken = request.cookies.get('session_token')?.value || null;
    
    if (!sessionToken) {
      return { session: null, sessionToken: null };
    }

    const session = this.validateSession(sessionToken);
    return { session, sessionToken };
  }

  // レスポンスにセッションクッキーを設定
  static setSessionCookie(response: NextResponse, sessionToken: string): NextResponse {
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.SESSION_TIMEOUT / 1000, // 秒単位
      path: '/'
    });

    return response;
  }

  // CSRFトークンをクッキーに設定（フロントエンド用）
  static setCSRFCookie(response: NextResponse, csrfToken: string): NextResponse {
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false, // JavaScriptから読み取り可能
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.SESSION_TIMEOUT / 1000,
      path: '/'
    });

    return response;
  }

  // セッションクッキーを削除
  static clearSessionCookies(response: NextResponse): NextResponse {
    response.cookies.delete('session_token');
    response.cookies.delete('csrf_token');
    return response;
  }

  // 期限切れセッションのクリーンアップ
  private static cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [token, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(token);
      }
    }
  }

  // 認証必須のAPIエンドポイント用ミドルウェア
  static requireAuth(handler: (request: NextRequest, session: SessionData) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const { session } = this.getSessionFromRequest(request);

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

      return handler(request, session);
    };
  }

  // セッション統計
  static getSessionStats(): { totalSessions: number; activeSessions: number } {
    const now = Date.now();
    let activeSessions = 0;

    for (const session of this.sessions.values()) {
      if (now - session.lastActivity <= this.SESSION_TIMEOUT) {
        activeSessions++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions
    };
  }
}