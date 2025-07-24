// エンタープライズレベルセッション管理システム
import CryptoJS from 'crypto-js';
import { SecureConfigManager } from '../api/secureConfig';
import { secureLog } from '../../security.config';
import { SecureTokenManager, TokenPair } from './secureTokenManager';

export interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
  mfaVerified: boolean;
  loginAttempts: number;
  suspiciousActivity: boolean;
  geoLocation?: {
    country: string;
    region: string;
    city: string;
  };
  securityLevel: 'low' | 'medium' | 'high';
  privileges: string[];
}

export interface SessionSecurityEvent {
  type: 'login' | 'logout' | 'token_refresh' | 'suspicious' | 'session_hijack' | 'timeout';
  sessionId: string;
  userId: string;
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
}

export class SecureSessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30分
  private static readonly MAX_SESSIONS_PER_USER = 5;
  private static readonly SESSION_ROTATION_INTERVAL = 15 * 60 * 1000; // 15分でセッションID更新
  
  // セッションストレージ（本番環境ではRedis等を使用）
  private static sessions = new Map<string, SessionData>();
  private static userSessions = new Map<string, Set<string>>();
  private static securityEvents: SessionSecurityEvent[] = [];
  
  // セッション固定攻撃対策用
  private static pendingSessions = new Map<string, { timestamp: number; attempts: number }>();

  /**
   * セキュアなセッション作成
   */
  static async createSession(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    mfaVerified: boolean = false
  ): Promise<{ sessionData: SessionData; tokenPair: TokenPair }> {
    try {
      // セッション固定攻撃対策：既存のペンディングセッションを無効化
      await this.invalidatePendingSessions(ipAddress);
      
      // ユーザーの既存セッション数をチェック
      await this.enforceSessionLimit(userId);
      
      // デバイスフィンガープリンティング
      const deviceId = await this.generateDeviceId(userAgent, ipAddress);
      
      // セキュアなセッションID生成
      const sessionId = this.generateSecureSessionId();
      
      // 地理的位置情報の推定
      const geoLocation = await this.estimateGeoLocation(ipAddress);
      
      // セキュリティレベルの決定
      const securityLevel = this.determineSecurityLevel(ipAddress, userAgent, mfaVerified);
      
      const sessionData: SessionData = {
        sessionId,
        userId,
        email,
        deviceId,
        userAgent,
        ipAddress,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        mfaVerified,
        loginAttempts: 0,
        suspiciousActivity: false,
        geoLocation,
        securityLevel,
        privileges: this.getDefaultPrivileges(securityLevel)
      };
      
      // セッション保存
      this.sessions.set(sessionId, sessionData);
      
      // ユーザーセッション管理
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId)!.add(sessionId);
      
      // JWT トークンペア生成
      const tokenPair = await SecureTokenManager.generateTokenPair(
        userId,
        email,
        sessionId,
        deviceId,
        ipAddress,
        sessionData.privileges
      );
      
      // セキュリティイベント記録
      await this.logSecurityEvent({
        type: 'login',
        sessionId,
        userId,
        timestamp: Date.now(),
        ipAddress,
        userAgent,
        details: {
          mfaVerified,
          securityLevel,
          deviceId
        }
      });
      
      secureLog('セッション作成成功', {
        sessionId,
        userId,
        deviceId,
        securityLevel,
        mfaVerified
      });
      
      return { sessionData, tokenPair };
    } catch (error) {
      secureLog('セッション作成エラー:', error);
      throw new Error('セッション作成に失敗しました');
    }
  }

  /**
   * セッション検証
   */
  static async validateSession(sessionId: string, ipAddress: string, userAgent: string): Promise<SessionData | null> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return null;
      }
      
      // セッションアクティブ状態チェック
      if (!session.isActive) {
        secureLog('非アクティブセッション検出', { sessionId });
        return null;
      }
      
      // タイムアウトチェック
      if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
        await this.expireSession(sessionId, 'timeout');
        return null;
      }
      
      // セッションハイジャック検出
      if (await this.detectSessionHijacking(session, ipAddress, userAgent)) {
        await this.terminateSession(sessionId, 'session_hijack');
        return null;
      }
      
      // 最終アクティビティ更新
      session.lastActivity = Date.now();
      this.sessions.set(sessionId, session);
      
      // セッションローテーション判定
      if (this.shouldRotateSession(session)) {
        return await this.rotateSession(sessionId);
      }
      
      return session;
    } catch (error) {
      secureLog('セッション検証エラー:', error);
      return null;
    }
  }

  /**
   * セッションローテーション（セッション固定攻撃対策）
   */
  static async rotateSession(oldSessionId: string): Promise<SessionData | null> {
    try {
      const oldSession = this.sessions.get(oldSessionId);
      if (!oldSession) {
        return null;
      }
      
      // 新しいセッションID生成
      const newSessionId = this.generateSecureSessionId();
      
      // セッションデータをコピー
      const newSession: SessionData = {
        ...oldSession,
        sessionId: newSessionId,
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      
      // 新しいセッションを保存
      this.sessions.set(newSessionId, newSession);
      
      // 古いセッションを削除
      this.sessions.delete(oldSessionId);
      
      // ユーザーセッション管理を更新
      const userSessions = this.userSessions.get(oldSession.userId);
      if (userSessions) {
        userSessions.delete(oldSessionId);
        userSessions.add(newSessionId);
      }
      
      secureLog('セッションローテーション実行', {
        oldSessionId,
        newSessionId,
        userId: oldSession.userId
      });
      
      return newSession;
    } catch (error) {
      secureLog('セッションローテーションエラー:', error);
      return null;
    }
  }

  /**
   * セッション終了
   */
  static async terminateSession(sessionId: string, reason: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }
      
      // セッションを非アクティブ化
      session.isActive = false;
      this.sessions.set(sessionId, session);
      
      // ユーザーセッション管理から削除
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
      }
      
      // セキュリティイベント記録
      await this.logSecurityEvent({
        type: 'logout',
        sessionId,
        userId: session.userId,
        timestamp: Date.now(),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        details: { reason }
      });
      
      secureLog('セッション終了', { sessionId, reason, userId: session.userId });
      
      return true;
    } catch (error) {
      secureLog('セッション終了エラー:', error);
      return false;
    }
  }

  /**
   * ユーザーの全セッション終了
   */
  static async terminateAllUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    try {
      const userSessions = this.userSessions.get(userId);
      if (!userSessions) {
        return;
      }
      
      const terminationPromises = Array.from(userSessions).map(sessionId => {
        if (sessionId !== excludeSessionId) {
          return this.terminateSession(sessionId, 'user_logout_all');
        }
        return Promise.resolve(false);
      });
      
      await Promise.all(terminationPromises);
      
      secureLog('全セッション終了', { userId, excludeSessionId });
    } catch (error) {
      secureLog('全セッション終了エラー:', error);
    }
  }

  /**
   * セッションハイジャック検出
   */
  private static async detectSessionHijacking(
    session: SessionData,
    currentIP: string,
    currentUserAgent: string
  ): Promise<boolean> {
    try {
      // IPアドレスの大幅な変更を検出
      if (!this.isIPAddressValid(session.ipAddress, currentIP)) {
        secureLog('セッションハイジャック疑惑: IP変更', {
          sessionId: session.sessionId,
          oldIP: session.ipAddress,
          newIP: currentIP
        });
        return true;
      }
      
      // ユーザーエージェントの大幅な変更を検出
      if (!this.isUserAgentValid(session.userAgent, currentUserAgent)) {
        secureLog('セッションハイジャック疑惑: UserAgent変更', {
          sessionId: session.sessionId,
          oldUA: session.userAgent,
          newUA: currentUserAgent
        });
        return true;
      }
      
      // 地理的位置の大幅な変更を検出
      const currentGeo = await this.estimateGeoLocation(currentIP);
      if (session.geoLocation && currentGeo && 
          !this.isGeoLocationValid(session.geoLocation, currentGeo)) {
        secureLog('セッションハイジャック疑惑: 地理的位置変更', {
          sessionId: session.sessionId,
          oldGeo: session.geoLocation,
          newGeo: currentGeo
        });
        return true;
      }
      
      return false;
    } catch (error) {
      secureLog('セッションハイジャック検出エラー:', error);
      return false;
    }
  }

  /**
   * セキュアなセッションID生成
   */
  private static generateSecureSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
    const hash = CryptoJS.SHA256(timestamp + randomString).toString();
    return `sess_${hash.substring(0, 48)}`;
  }

  /**
   * デバイスID生成
   */
  private static async generateDeviceId(userAgent: string, ipAddress: string): Promise<string> {
    try {
      const deviceFingerprint = {
        userAgent,
        language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
        timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown'
      };
      
      const fingerprintString = JSON.stringify(deviceFingerprint);
      return CryptoJS.SHA256(fingerprintString).toString();
    } catch (error) {
      secureLog('デバイスID生成エラー:', error);
      return CryptoJS.SHA256(userAgent + ipAddress).toString();
    }
  }

  /**
   * セキュリティレベル決定
   */
  private static determineSecurityLevel(
    ipAddress: string,
    userAgent: string,
    mfaVerified: boolean
  ): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // MFA検証済み
    if (mfaVerified) score += 30;
    
    // プライベートIP範囲
    if (this.isPrivateIPAddress(ipAddress)) score += 10;
    
    // 既知のブラウザ
    if (this.isKnownBrowser(userAgent)) score += 10;
    
    // モバイルデバイス
    if (this.isMobileDevice(userAgent)) score -= 5;
    
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  /**
   * デフォルト権限設定
   */
  private static getDefaultPrivileges(securityLevel: 'low' | 'medium' | 'high'): string[] {
    switch (securityLevel) {
      case 'high':
        return ['read', 'write', 'admin', 'sensitive'];
      case 'medium':
        return ['read', 'write'];
      case 'low':
      default:
        return ['read'];
    }
  }

  /**
   * セッション制限の強制
   */
  private static async enforceSessionLimit(userId: string): Promise<void> {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions || userSessions.size < this.MAX_SESSIONS_PER_USER) {
      return;
    }
    
    // 最も古いセッションを終了
    const sessionIds = Array.from(userSessions);
    const sessions = sessionIds.map(id => this.sessions.get(id)).filter(Boolean) as SessionData[];
    sessions.sort((a, b) => a.lastActivity - b.lastActivity);
    
    const sessionsToTerminate = sessions.slice(0, sessions.length - this.MAX_SESSIONS_PER_USER + 1);
    
    for (const session of sessionsToTerminate) {
      await this.terminateSession(session.sessionId, 'session_limit_exceeded');
    }
  }

  /**
   * ペンディングセッション無効化
   */
  private static async invalidatePendingSessions(ipAddress: string): Promise<void> {
    const now = Date.now();
    for (const [sessionId, data] of this.pendingSessions.entries()) {
      if (now - data.timestamp > 300000) { // 5分以上古い
        this.pendingSessions.delete(sessionId);
      }
    }
  }

  /**
   * セッションローテーション判定
   */
  private static shouldRotateSession(session: SessionData): boolean {
    return Date.now() - session.createdAt > this.SESSION_ROTATION_INTERVAL;
  }

  /**
   * セッション期限切れ処理
   */
  private static async expireSession(sessionId: string, reason: string): Promise<void> {
    await this.terminateSession(sessionId, reason);
  }

  /**
   * 地理的位置推定（簡易実装）
   */
  private static async estimateGeoLocation(ipAddress: string): Promise<{ country: string; region: string; city: string } | undefined> {
    try {
      // 実際の実装では外部のGeoIPサービスを使用
      // ここでは簡易的な実装
      if (this.isPrivateIPAddress(ipAddress)) {
        return { country: 'JP', region: 'Unknown', city: 'Unknown' };
      }
      
      // プレースホルダー実装
      return { country: 'JP', region: 'Tokyo', city: 'Tokyo' };
    } catch (error) {
      secureLog('地理的位置推定エラー:', error);
      return undefined;
    }
  }

  /**
   * IPアドレス検証
   */
  private static isIPAddressValid(oldIP: string, newIP: string): boolean {
    if (oldIP === newIP) return true;
    
    // 同一サブネット内なら許可
    const oldParts = oldIP.split('.');
    const newParts = newIP.split('.');
    
    if (oldParts.length === 4 && newParts.length === 4) {
      return oldParts.slice(0, 3).join('.') === newParts.slice(0, 3).join('.');
    }
    
    return false;
  }

  /**
   * ユーザーエージェント検証
   */
  private static isUserAgentValid(oldUA: string, newUA: string): boolean {
    // ブラウザとOSが同じかチェック
    const oldBrowser = this.extractBrowserInfo(oldUA);
    const newBrowser = this.extractBrowserInfo(newUA);
    
    return oldBrowser.name === newBrowser.name && oldBrowser.os === newBrowser.os;
  }

  /**
   * 地理的位置検証
   */
  private static isGeoLocationValid(
    oldGeo: { country: string; region: string; city: string },
    newGeo: { country: string; region: string; city: string }
  ): boolean {
    // 同一国内なら許可
    return oldGeo.country === newGeo.country;
  }

  /**
   * プライベートIPアドレス判定
   */
  private static isPrivateIPAddress(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fd00:/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * 既知ブラウザ判定
   */
  private static isKnownBrowser(userAgent: string): boolean {
    const knownBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    return knownBrowsers.some(browser => userAgent.includes(browser));
  }

  /**
   * モバイルデバイス判定
   */
  private static isMobileDevice(userAgent: string): boolean {
    return /Mobile|Android|iPhone|iPad/.test(userAgent);
  }

  /**
   * ブラウザ情報抽出
   */
  private static extractBrowserInfo(userAgent: string): { name: string; os: string } {
    let name = 'Unknown';
    let os = 'Unknown';
    
    if (userAgent.includes('Chrome')) name = 'Chrome';
    else if (userAgent.includes('Firefox')) name = 'Firefox';
    else if (userAgent.includes('Safari')) name = 'Safari';
    else if (userAgent.includes('Edge')) name = 'Edge';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return { name, os };
  }

  /**
   * セキュリティイベント記録
   */
  private static async logSecurityEvent(event: SessionSecurityEvent): Promise<void> {
    this.securityEvents.push(event);
    
    // イベント履歴のサイズ制限
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-500);
    }
    
    secureLog('セキュリティイベント記録', event);
  }

  /**
   * セッション統計取得
   */
  static getSessionStats(): {
    activeSessions: number;
    totalUsers: number;
    securityEvents: number;
  } {
    return {
      activeSessions: Array.from(this.sessions.values()).filter(s => s.isActive).length,
      totalUsers: this.userSessions.size,
      securityEvents: this.securityEvents.length
    };
  }

  /**
   * ユーザーセッション一覧取得
   */
  static getUserSessions(userId: string): SessionData[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];
    
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(Boolean) as SessionData[];
  }

  /**
   * 定期クリーンアップ
   */
  static cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // 期限切れセッションのクリーンアップ
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isActive || now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        
        const userSessions = this.userSessions.get(session.userId);
        if (userSessions) {
          userSessions.delete(sessionId);
          if (userSessions.size === 0) {
            this.userSessions.delete(session.userId);
          }
        }
        
        cleanedCount++;
      }
    }
    
    // ペンディングセッションのクリーンアップ
    for (const [sessionId, data] of this.pendingSessions.entries()) {
      if (now - data.timestamp > 300000) {
        this.pendingSessions.delete(sessionId);
      }
    }
    
    secureLog('セッションマネージャークリーンアップ完了', {
      cleanedSessions: cleanedCount,
      activeSessions: this.sessions.size,
      activeUsers: this.userSessions.size
    });
  }
}

// 定期クリーンアップの設定（5分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    SecureSessionManager.cleanup();
  }, 5 * 60 * 1000);
}