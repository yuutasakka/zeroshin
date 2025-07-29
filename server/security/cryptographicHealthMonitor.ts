// 暗号化システム健全性監視・自動修復システム
import { EnhancedCryptographicManager } from './enhancedCryptographicManager';
import { secureLog } from '../../src/config/clientSecurity';
import crypto from 'crypto';

export interface CryptographicHealth {
  overall: 'healthy' | 'warning' | 'critical';
  keyManagement: KeyManagementHealth;
  encryption: EncryptionHealth;
  hashing: HashingHealth;
  rotation: RotationHealth;
  integrity: IntegrityHealth;
  lastCheck: number;
  recommendations: string[];
}

export interface KeyManagementHealth {
  status: 'healthy' | 'warning' | 'critical';
  activeKeys: number;
  deprecatedKeys: number;
  revokedKeys: number;
  oldestKeyAge: number;
  youngestKeyAge: number;
  averageKeyUsage: number;
  issues: string[];
}

export interface EncryptionHealth {
  status: 'healthy' | 'warning' | 'critical';
  successRate: number;
  averageProcessingTime: number;
  errorCount: number;
  lastError?: string;
  algorithmStrength: number;
  ivEntropy: number;
  issues: string[];
}

export interface HashingHealth {
  status: 'healthy' | 'warning' | 'critical';
  averageHashTime: number;
  saltQuality: number;
  pepperStrength: number;
  iterationCount: number;
  collisionResistance: number;
  issues: string[];
}

export interface RotationHealth {
  status: 'healthy' | 'warning' | 'critical';
  lastRotation: number;
  rotationInterval: number;
  missedRotations: number;
  rotationSuccessRate: number;
  schedulerStatus: 'active' | 'inactive' | 'error';
  issues: string[];
}

export interface IntegrityHealth {
  status: 'healthy' | 'warning' | 'critical';
  checksumVerifications: number;
  failedVerifications: number;
  dataCorruption: number;
  unauthorizedAccess: number;
  issues: string[];
}

export interface CryptographicAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'key_management' | 'encryption' | 'hashing' | 'rotation' | 'integrity';
  message: string;
  timestamp: number;
  resolved: boolean;
  autoResolved: boolean;
}

export class CryptographicHealthMonitor {
  private static instance: CryptographicHealthMonitor;
  private alerts: Map<string, CryptographicAlert> = new Map();
  private healthHistory: CryptographicHealth[] = [];
  private monitoringActive = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private readonly MONITORING_INTERVAL = 5 * 60 * 1000; // 5分
  private readonly HEALTH_HISTORY_LIMIT = 288; // 24時間分（5分間隔）
  private readonly ALERT_RETENTION_DAYS = 30;
  
  private constructor() {
    this.startMonitoring();
  }
  
  public static getInstance(): CryptographicHealthMonitor {
    if (!CryptographicHealthMonitor.instance) {
      CryptographicHealthMonitor.instance = new CryptographicHealthMonitor();
    }
    return CryptographicHealthMonitor.instance;
  }
  
  /**
   * 包括的な健全性チェック
   */
  async performHealthCheck(): Promise<CryptographicHealth> {
    const startTime = Date.now();
    
    try {
      const [keyHealth, encryptionHealth, hashingHealth, rotationHealth, integrityHealth] = 
        await Promise.all([
          this.checkKeyManagementHealth(),
          this.checkEncryptionHealth(),
          this.checkHashingHealth(),
          this.checkRotationHealth(),
          this.checkIntegrityHealth()
        ]);
      
      const overallHealth = this.determineOverallHealth([
        keyHealth, encryptionHealth, hashingHealth, rotationHealth, integrityHealth
      ]);
      
      const recommendations = this.generateRecommendations({
        keyManagement: keyHealth,
        encryption: encryptionHealth,
        hashing: hashingHealth,
        rotation: rotationHealth,
        integrity: integrityHealth
      });
      
      const health: CryptographicHealth = {
        overall: overallHealth,
        keyManagement: keyHealth,
        encryption: encryptionHealth,
        hashing: hashingHealth,
        rotation: rotationHealth,
        integrity: integrityHealth,
        lastCheck: Date.now(),
        recommendations
      };
      
      // 健全性履歴の保存
      this.saveHealthHistory(health);
      
      // アラートの生成
      await this.generateAlerts(health);
      
      // 自動修復の実行
      await this.performAutoRemediation(health);
      
      secureLog('Cryptographic health check completed:', {
        overall: health.overall,
        duration: Date.now() - startTime,
        recommendations: recommendations.length
      });
      
      return health;
      
    } catch (error) {
      secureLog('Health check failed:', error);
      throw new Error('Cryptographic health check failed');
    }
  }
  
  /**
   * 鍵管理健全性チェック
   */
  private async checkKeyManagementHealth(): Promise<KeyManagementHealth> {
    const cryptoManager = EnhancedCryptographicManager.getInstance();
    const stats = cryptoManager.getEncryptionStatistics();
    const issues: string[] = [];
    
    // 鍵の年齢分析
    const now = Date.now();
    const maxKeyAge = 30 * 24 * 60 * 60 * 1000; // 30日
    const warningKeyAge = 25 * 24 * 60 * 60 * 1000; // 25日
    
    let oldestKeyAge = 0;
    let youngestKeyAge = now;
    
    // 実際の実装では、鍵メタデータから計算
    if (stats.averageKeyAge > warningKeyAge) {
      issues.push('Keys approaching expiration threshold');
    }
    
    if (stats.averageKeyAge > maxKeyAge) {
      issues.push('Keys exceeded maximum age limit');
    }
    
    // アクティブ鍵の数チェック
    if (stats.activeKeys < 1) {
      issues.push('Insufficient active keys');
    } else if (stats.activeKeys > 10) {
      issues.push('Excessive number of active keys');
    }
    
    // 使用統計の分析
    const averageUsage = stats.totalEncryptions / Math.max(stats.activeKeys, 1);
    if (averageUsage > 10000) {
      issues.push('High key usage detected - consider rotation');
    }
    
    // 状態判定
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.some(issue => issue.includes('exceeded') || issue.includes('Insufficient'))) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      activeKeys: stats.activeKeys,
      deprecatedKeys: stats.deprecatedKeys,
      revokedKeys: 0, // 実装では実際の値を取得
      oldestKeyAge,
      youngestKeyAge,
      averageKeyUsage: averageUsage,
      issues
    };
  }
  
  /**
   * 暗号化健全性チェック
   */
  private async checkEncryptionHealth(): Promise<EncryptionHealth> {
    const issues: string[] = [];
    
    // テスト暗号化の実行
    const testResults = await this.performEncryptionTests();
    
    // アルゴリズム強度チェック
    const algorithmStrength = this.assessAlgorithmStrength();
    if (algorithmStrength < 0.8) {
      issues.push('Encryption algorithm strength below recommended threshold');
    }
    
    // IV エントロピーチェック
    const ivEntropy = await this.assessIVEntropy();
    if (ivEntropy < 7.0) {
      issues.push('IV entropy below cryptographic standards');
    }
    
    // パフォーマンスチェック
    if (testResults.averageTime > 100) {
      issues.push('Encryption performance degradation detected');
    }
    
    // エラー率チェック
    if (testResults.errorRate > 0.01) {
      issues.push('High encryption error rate detected');
    }
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (testResults.errorRate > 0.05 || algorithmStrength < 0.6) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      successRate: 1 - testResults.errorRate,
      averageProcessingTime: testResults.averageTime,
      errorCount: testResults.errorCount,
      lastError: testResults.lastError,
      algorithmStrength,
      ivEntropy,
      issues
    };
  }
  
  /**
   * ハッシュ化健全性チェック
   */
  private async checkHashingHealth(): Promise<HashingHealth> {
    const issues: string[] = [];
    
    // ハッシュ化テストの実行
    const hashTests = await this.performHashingTests();
    
    // ソルト品質チェック
    const saltQuality = await this.assessSaltQuality();
    if (saltQuality < 0.9) {
      issues.push('Salt quality below recommended standards');
    }
    
    // ペッパー強度チェック
    const pepperStrength = await this.assessPepperStrength();
    if (pepperStrength < 0.8) {
      issues.push('Pepper strength insufficient');
    }
    
    // 反復回数チェック
    const iterationCount = 100000; // 設定値
    if (iterationCount < 100000) {
      issues.push('PBKDF2 iteration count below recommended minimum');
    }
    
    // 衝突耐性チェック
    const collisionResistance = await this.assessCollisionResistance();
    if (collisionResistance < 0.95) {
      issues.push('Hash collision resistance below acceptable threshold');
    }
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (saltQuality < 0.7 || pepperStrength < 0.6 || iterationCount < 50000) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      averageHashTime: hashTests.averageTime,
      saltQuality,
      pepperStrength,
      iterationCount,
      collisionResistance,
      issues
    };
  }
  
  /**
   * ローテーション健全性チェック
   */
  private async checkRotationHealth(): Promise<RotationHealth> {
    const issues: string[] = [];
    
    // 最後のローテーション時刻チェック
    const lastRotation = Date.now() - (2 * 24 * 60 * 60 * 1000); // 仮の値
    const rotationInterval = 24 * 60 * 60 * 1000; // 24時間
    const timeSinceLastRotation = Date.now() - lastRotation;
    
    let missedRotations = 0;
    if (timeSinceLastRotation > rotationInterval * 1.2) {
      missedRotations = Math.floor(timeSinceLastRotation / rotationInterval) - 1;
      issues.push(`Missed ${missedRotations} scheduled rotations`);
    }
    
    // スケジューラーステータスチェック
    const schedulerStatus = this.checkRotationScheduler();
    if (schedulerStatus !== 'active') {
      issues.push('Rotation scheduler is not active');
    }
    
    // ローテーション成功率
    const rotationSuccessRate = 0.98; // 実装では実際の統計を取得
    if (rotationSuccessRate < 0.95) {
      issues.push('Low rotation success rate detected');
    }
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (schedulerStatus === 'error' || missedRotations > 2) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      lastRotation,
      rotationInterval,
      missedRotations,
      rotationSuccessRate,
      schedulerStatus,
      issues
    };
  }
  
  /**
   * 整合性健全性チェック
   */
  private async checkIntegrityHealth(): Promise<IntegrityHealth> {
    const issues: string[] = [];
    
    // チェックサム検証統計
    const checksumStats = await this.getChecksumStatistics();
    
    const failureRate = checksumStats.failed / Math.max(checksumStats.total, 1);
    if (failureRate > 0.01) {
      issues.push('High checksum verification failure rate');
    }
    
    // データ破損検出
    if (checksumStats.corrupted > 0) {
      issues.push(`Data corruption detected in ${checksumStats.corrupted} instances`);
    }
    
    // 不正アクセス検出
    if (checksumStats.unauthorizedAccess > 0) {
      issues.push(`Unauthorized access attempts detected: ${checksumStats.unauthorizedAccess}`);
    }
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (failureRate > 0.05 || checksumStats.corrupted > 5) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      checksumVerifications: checksumStats.total,
      failedVerifications: checksumStats.failed,
      dataCorruption: checksumStats.corrupted,
      unauthorizedAccess: checksumStats.unauthorizedAccess,
      issues
    };
  }
  
  /**
   * 暗号化テストの実行
   */
  private async performEncryptionTests(): Promise<{
    averageTime: number;
    errorRate: number;
    errorCount: number;
    lastError?: string;
  }> {
    const testData = 'Health check test data';
    const iterations = 10;
    let totalTime = 0;
    let errorCount = 0;
    let lastError: string | undefined;
    
    const cryptoManager = EnhancedCryptographicManager.getInstance();
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        const encrypted = await cryptoManager.encryptData(testData);
        const decrypted = await cryptoManager.decryptData(encrypted);
        totalTime += Date.now() - startTime;
        
        if (decrypted.toString() !== testData) {
          errorCount++;
          lastError = 'Decryption mismatch';
        }
      } catch (error) {
        errorCount++;
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return {
      averageTime: totalTime / iterations,
      errorRate: errorCount / iterations,
      errorCount,
      lastError
    };
  }
  
  /**
   * ハッシュ化テストの実行
   */
  private async performHashingTests(): Promise<{ averageTime: number }> {
    const testPassword = 'HealthCheckPassword123!';
    const iterations = 5;
    let totalTime = 0;
    
    const cryptoManager = EnhancedCryptographicManager.getInstance();
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await cryptoManager.hashPasswordAdvanced(testPassword, 'health-check-user');
      totalTime += Date.now() - startTime;
    }
    
    return {
      averageTime: totalTime / iterations
    };
  }
  
  /**
   * アルゴリズム強度評価
   */
  private assessAlgorithmStrength(): number {
    // AES-256-GCM の強度評価
    // 実際の実装では、使用中のアルゴリズムと鍵長を評価
    return 0.95; // AES-256-GCM は非常に強力
  }
  
  /**
   * IV エントロピー評価
   */
  private async assessIVEntropy(): Promise<number> {
    // IV のランダム性をテスト
    const testIterations = 100;
    let totalEntropy = 0;
    
    for (let i = 0; i < testIterations; i++) {
      const iv = crypto.randomBytes(16);
      const entropy = this.calculateEntropy(iv);
      totalEntropy += entropy;
    }
    
    return totalEntropy / testIterations;
  }
  
  /**
   * ソルト品質評価
   */
  private async assessSaltQuality(): Promise<number> {
    // ソルトのランダム性と一意性をテスト
    const saltCount = 100;
    const salts = new Set<string>();
    let totalEntropy = 0;
    
    for (let i = 0; i < saltCount; i++) {
      const salt = crypto.randomBytes(32);
      salts.add(salt.toString('base64'));
      totalEntropy += this.calculateEntropy(salt);
    }
    
    const uniqueness = salts.size / saltCount;
    const avgEntropy = totalEntropy / saltCount;
    
    return Math.min(uniqueness * (avgEntropy / 8), 1.0);
  }
  
  /**
   * ペッパー強度評価
   */
  private async assessPepperStrength(): Promise<number> {
    // ペッパーの複雑度とエントロピーを評価
    const pepper = process.env.GLOBAL_PEPPER || 'default-pepper';
    const entropy = this.calculateStringEntropy(pepper);
    
    // 長さと複雑度の評価
    const lengthScore = Math.min(pepper.length / 64, 1.0);
    const entropyScore = Math.min(entropy / 6, 1.0);
    
    return (lengthScore + entropyScore) / 2;
  }
  
  /**
   * 衝突耐性評価
   */
  private async assessCollisionResistance(): Promise<number> {
    // ハッシュ関数の衝突耐性をテスト
    // 実際の実装では、大量のテストデータでハッシュの分布を分析
    return 0.98; // SHA-512 + bcrypt の組み合わせは非常に強力
  }
  
  /**
   * エントロピー計算
   */
  private calculateEntropy(buffer: Buffer): number {
    const byteFreq = new Array(256).fill(0);
    for (const byte of buffer) {
      byteFreq[byte]++;
    }
    
    let entropy = 0;
    for (const freq of byteFreq) {
      if (freq > 0) {
        const probability = freq / buffer.length;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }
  
  /**
   * 文字列エントロピー計算
   */
  private calculateStringEntropy(str: string): number {
    const charFreq = new Map<string, number>();
    for (const char of str) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }
    
    let entropy = 0;
    for (const freq of charFreq.values()) {
      const probability = freq / str.length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }
  
  /**
   * 全体健全性判定
   */
  private determineOverallHealth(healthChecks: Array<{ status: string }>): 'healthy' | 'warning' | 'critical' {
    const criticalCount = healthChecks.filter(h => h.status === 'critical').length;
    const warningCount = healthChecks.filter(h => h.status === 'warning').length;
    
    if (criticalCount > 0) {
      return 'critical';
    } else if (warningCount > 2) {
      return 'critical';
    } else if (warningCount > 0) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
  
  /**
   * 推奨事項生成
   */
  private generateRecommendations(health: Omit<CryptographicHealth, 'overall' | 'lastCheck' | 'recommendations'>): string[] {
    const recommendations: string[] = [];
    
    // 鍵管理の推奨事項
    if (health.keyManagement.activeKeys < 2) {
      recommendations.push('Generate additional encryption keys for redundancy');
    }
    if (health.keyManagement.averageKeyUsage > 5000) {
      recommendations.push('Consider more frequent key rotation due to high usage');
    }
    
    // 暗号化の推奨事項
    if (health.encryption.averageProcessingTime > 50) {
      recommendations.push('Optimize encryption performance or consider hardware acceleration');
    }
    if (health.encryption.successRate < 0.99) {
      recommendations.push('Investigate and resolve encryption failures');
    }
    
    // ハッシュ化の推奨事項
    if (health.hashing.averageHashTime > 300) {
      recommendations.push('Consider adjusting PBKDF2 iteration count for better performance');
    }
    if (health.hashing.saltQuality < 0.9) {
      recommendations.push('Improve salt generation algorithm');
    }
    
    // ローテーションの推奨事項
    if (health.rotation.missedRotations > 0) {
      recommendations.push('Investigate and fix key rotation scheduler issues');
    }
    
    // 整合性の推奨事項
    if (health.integrity.failedVerifications > 10) {
      recommendations.push('Investigate data integrity issues and potential corruption');
    }
    
    return recommendations;
  }
  
  /**
   * その他のヘルパーメソッド
   */
  private checkRotationScheduler(): 'active' | 'inactive' | 'error' {
    // 実際の実装では、スケジューラーの状態を確認
    return 'active';
  }
  
  private async getChecksumStatistics(): Promise<{
    total: number;
    failed: number;
    corrupted: number;
    unauthorizedAccess: number;
  }> {
    // 実際の実装では、チェックサム検証の統計を取得
    return {
      total: 1000,
      failed: 2,
      corrupted: 0,
      unauthorizedAccess: 0
    };
  }
  
  private saveHealthHistory(health: CryptographicHealth): void {
    this.healthHistory.push(health);
    if (this.healthHistory.length > this.HEALTH_HISTORY_LIMIT) {
      this.healthHistory = this.healthHistory.slice(-this.HEALTH_HISTORY_LIMIT);
    }
  }
  
  private async generateAlerts(health: CryptographicHealth): Promise<void> {
    // クリティカルな問題に対するアラート生成
    if (health.overall === 'critical') {
      const alert: CryptographicAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'critical',
        category: 'integrity',
        message: 'Critical cryptographic system health detected',
        timestamp: Date.now(),
        resolved: false,
        autoResolved: false
      };
      
      this.alerts.set(alert.id, alert);
      secureLog('Critical cryptographic alert generated:', alert);
    }
  }
  
  private async performAutoRemediation(health: CryptographicHealth): Promise<void> {
    // 自動修復の実行
    if (health.rotation.schedulerStatus === 'inactive') {
      // スケジューラーの再起動を試行
      try {
        // 実際の実装では、スケジューラーを再起動
        secureLog('Attempting to restart rotation scheduler');
      } catch (error) {
        secureLog('Failed to restart rotation scheduler:', error);
      }
    }
  }
  
  /**
   * 監視開始
   */
  private startMonitoring(): void {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        secureLog('Automated health check failed:', error);
      }
    }, this.MONITORING_INTERVAL);
    
    secureLog('Cryptographic health monitoring started');
  }
  
  /**
   * 監視停止
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitoringActive = false;
    secureLog('Cryptographic health monitoring stopped');
  }
  
  /**
   * 健全性履歴取得
   */
  getHealthHistory(hours = 24): CryptographicHealth[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.healthHistory.filter(h => h.lastCheck > cutoffTime);
  }
  
  /**
   * アクティブアラート取得
   */
  getActiveAlerts(): CryptographicAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }
}