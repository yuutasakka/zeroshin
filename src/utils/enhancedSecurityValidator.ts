// 強化された統一セキュリティ検証システム - 新しい脅威と適応性に対応
import { UnifiedSecurityValidator, VulnerabilityType, InputType, SecurityVulnerability, UnifiedValidationResult } from './unifiedSecurityValidator';
import { secureLog } from '../config/clientSecurity';

export interface ThreatSignature {
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: VulnerabilityType;
  version: string;
  lastUpdated: number;
}

export interface SecurityConfig {
  enableAIDetection: boolean;
  enableBehavioralAnalysis: boolean;
  enableZeroDayDetection: boolean;
  adaptiveThreshold: number;
  maxProcessingTime: number;
  enableLearning: boolean;
}

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  requestId?: string;
  rateLimit?: {
    count: number;
    window: number;
  };
}

export class EnhancedSecurityValidator extends UnifiedSecurityValidator {
  private static readonly VERSION = '2.1.0';
  private static readonly THREAT_DATABASE_VERSION = '2025.01.29';
  
  // 動的に更新される脅威パターン
  private static threatSignatures: Map<string, ThreatSignature[]> = new Map();
  
  // 機械学習によるリスクスコア調整
  private static adaptiveWeights: Map<VulnerabilityType, number> = new Map();
  
  // ゼロデイ攻撃検出のための異常パターン
  private static anomalyDetectionCache: Map<string, number> = new Map();
  
  // デフォルト設定
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    enableAIDetection: true,
    enableBehavioralAnalysis: true,
    enableZeroDayDetection: true,
    adaptiveThreshold: 0.7,
    maxProcessingTime: 1000, // 1秒
    enableLearning: true
  };

  static {
    this.initializeThreatDatabase();
    this.initializeAdaptiveWeights();
  }

  /**
   * 拡張された入力検証 - 新しい脅威と適応性に対応
   */
  static async validateInputEnhanced(
    input: any,
    inputType: InputType = 'unknown',
    context: SecurityContext,
    config: Partial<SecurityConfig> = {}
  ): Promise<UnifiedValidationResult> {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    
    try {
      // 基本検証の実行
      const baseResult = await super.validateInput(input, inputType, context);
      
      // 強化検証の実行
      await this.performEnhancedValidation(input, baseResult, context, mergedConfig);
      
      // 処理時間チェック
      const processingTime = Date.now() - startTime;
      if (processingTime > mergedConfig.maxProcessingTime) {
        baseResult.warnings.push(`Processing time exceeded threshold: ${processingTime}ms`);
      }
      
      return baseResult;
      
    } catch (error) {
      secureLog('Enhanced validation error:', error);
      throw error;
    }
  }

  /**
   * 強化検証の実行
   */
  private static async performEnhancedValidation(
    input: any,
    result: UnifiedValidationResult,
    context: SecurityContext,
    config: SecurityConfig
  ): Promise<void> {
    // 新しい脅威パターンの検出
    if (config.enableAIDetection) {
      await this.detectEmergingThreats(input, result, context);
    }
    
    // 行動分析
    if (config.enableBehavioralAnalysis) {
      await this.performBehavioralAnalysis(input, result, context);
    }
    
    // ゼロデイ攻撃検出
    if (config.enableZeroDayDetection) {
      await this.detectZeroDayAttacks(input, result, context);
    }
    
    // 適応的リスク評価
    this.performAdaptiveRiskAssessment(result, config);
    
    // 学習機能
    if (config.enableLearning) {
      await this.updateLearningModel(input, result, context);
    }
  }

  /**
   * 新しい脅威パターンの検出
   */
  private static async detectEmergingThreats(
    input: any,
    result: UnifiedValidationResult,
    context: SecurityContext
  ): Promise<void> {
    if (typeof input !== 'string') return;
    
    // 動的に更新された脅威パターンをチェック
    for (const [category, signatures] of this.threatSignatures.entries()) {
      for (const signature of signatures) {
        if (signature.pattern.test(input)) {
          result.vulnerabilities.push({
            type: signature.category,
            severity: signature.severity,
            description: `${signature.description} (v${signature.version})`,
            mitigated: false,
            location: `Enhanced Detector - ${category}`
          });
        }
      }
    }
    
    // AI駆動の脅威検出（疑似実装）
    const aiRiskScore = await this.calculateAIRiskScore(input, context);
    if (aiRiskScore > 0.8) {
      result.vulnerabilities.push({
        type: 'code_injection',
        severity: 'high',
        description: `AI-detected high-risk pattern (score: ${aiRiskScore})`,
        mitigated: false,
        location: 'AI Threat Detector'
      });
    }
  }

  /**
   * 行動分析
   */
  private static async performBehavioralAnalysis(
    input: any,
    result: UnifiedValidationResult,
    context: SecurityContext
  ): Promise<void> {
    // ユーザー行動パターン分析
    if (context.userId) {
      const userBehavior = await this.analyzeUserBehavior(context.userId, input);
      if (userBehavior.isAnomalous) {
        result.vulnerabilities.push({
          type: 'security_violation' as VulnerabilityType,
          severity: 'medium',
          description: 'Anomalous user behavior detected',
          mitigated: false,
          location: 'Behavioral Analyzer'
        });
      }
    }
    
    // レート制限違反の検出
    if (context.rateLimit && context.rateLimit.count > 100) {
      result.vulnerabilities.push({
        type: 'csrf_vulnerability',
        severity: 'high',
        description: 'Rate limit violation detected',
        mitigated: false,
        location: 'Rate Limit Analyzer'
      });
    }
    
    // 地理的異常の検出
    const geoRisk = await this.analyzeGeographicAnomaly(context);
    if (geoRisk.isRisky) {
      result.warnings.push(`Geographic anomaly detected: ${geoRisk.reason}`);
    }
  }

  /**
   * ゼロデイ攻撃検出
   */
  private static async detectZeroDayAttacks(
    input: any,
    result: UnifiedValidationResult,
    context: SecurityContext
  ): Promise<void> {
    if (typeof input !== 'string') return;
    
    // 異常なエンコーディングパターンの検出
    const encodingAnomalies = this.detectEncodingAnomalies(input);
    if (encodingAnomalies.length > 0) {
      result.vulnerabilities.push({
        type: 'xss_attack',
        severity: 'high',
        description: `Suspicious encoding patterns: ${encodingAnomalies.join(', ')}`,
        mitigated: false,
        location: 'Zero-Day Detector'
      });
    }
    
    // 未知のペイロード構造の検出
    const payloadAnomaly = this.detectPayloadAnomalies(input);
    if (payloadAnomaly.score > 0.7) {
      result.vulnerabilities.push({
        type: 'code_injection',
        severity: 'critical',
        description: `Unknown payload structure detected (score: ${payloadAnomaly.score})`,
        mitigated: false,
        location: 'Payload Anomaly Detector'
      });
    }
    
    // ポリグロット攻撃の検出
    const polyglotRisk = this.detectPolyglotAttacks(input);
    if (polyglotRisk.detected) {
      result.vulnerabilities.push({
        type: 'xss_attack',
        severity: 'critical',
        description: 'Polyglot attack vector detected',
        mitigated: false,
        location: 'Polyglot Detector'
      });
    }
  }

  /**
   * 適応的リスク評価
   */
  private static performAdaptiveRiskAssessment(
    result: UnifiedValidationResult,
    config: SecurityConfig
  ): void {
    let adjustedRiskScore = 0;
    
    // 適応的重み付けを適用
    for (const vuln of result.vulnerabilities) {
      const baseScore = this.getVulnerabilityBaseScore(vuln.severity);
      const adaptiveWeight = this.adaptiveWeights.get(vuln.type) || 1.0;
      adjustedRiskScore += baseScore * adaptiveWeight;
    }
    
    // 動的しきい値の適用
    if (adjustedRiskScore > config.adaptiveThreshold * 100) {
      result.riskLevel = 'critical';
    } else if (adjustedRiskScore > config.adaptiveThreshold * 60) {
      result.riskLevel = 'high';
    } else if (adjustedRiskScore > config.adaptiveThreshold * 30) {
      result.riskLevel = 'medium';
    } else {
      result.riskLevel = 'low';
    }
  }

  /**
   * 学習機能の更新
   */
  private static async updateLearningModel(
    input: any,
    result: UnifiedValidationResult,
    context: SecurityContext
  ): Promise<void> {
    // 攻撃パターンの学習
    if (result.vulnerabilities.length > 0) {
      for (const vuln of result.vulnerabilities) {
        const currentWeight = this.adaptiveWeights.get(vuln.type) || 1.0;
        // 検出された脅威の重みを増加
        this.adaptiveWeights.set(vuln.type, Math.min(currentWeight * 1.1, 2.0));
      }
    }
    
    // 異常パターンキャッシュの更新
    if (typeof input === 'string') {
      const inputHash = this.calculateInputHash(input);
      const currentCount = this.anomalyDetectionCache.get(inputHash) || 0;
      this.anomalyDetectionCache.set(inputHash, currentCount + 1);
      
      // キャッシュサイズ制限
      if (this.anomalyDetectionCache.size > 10000) {
        this.cleanupAnomalyCache();
      }
    }
  }

  /**
   * 脅威データベースの初期化
   */
  private static initializeThreatDatabase(): void {
    // 2025年最新の脅威パターン
    const emergingThreats: { [key: string]: ThreatSignature[] } = {
      'ai_prompt_injection': [
        {
          pattern: /ignore\s+(previous|all)\s+(instructions?|prompts?)/gi,
          description: 'AI prompt injection attempt',
          severity: 'high',
          category: 'code_injection',
          version: '2025.1',
          lastUpdated: Date.now()
        }
      ],
      'webassembly_exploit': [
        {
          pattern: /\(module\s*\(memory|WebAssembly\.Module/gi,
          description: 'WebAssembly exploitation attempt',
          severity: 'critical',
          category: 'code_injection',
          version: '2025.1',
          lastUpdated: Date.now()
        }
      ],
      'supply_chain_attack': [
        {
          pattern: /require\s*\(\s*['"`][^'"`]*[./]+[^'"`]*['"`]\s*\)/gi,
          description: 'Potential supply chain attack vector',
          severity: 'high',
          category: 'code_injection',
          version: '2025.1',
          lastUpdated: Date.now()
        }
      ]
    };
    
    for (const [category, threats] of Object.entries(emergingThreats)) {
      this.threatSignatures.set(category, threats);
    }
  }

  /**
   * 適応的重みの初期化
   */
  private static initializeAdaptiveWeights(): void {
    const initialWeights: [VulnerabilityType, number][] = [
      ['sql_injection', 1.0],
      ['xss_attack', 1.0],
      ['template_injection', 1.0],
      ['path_traversal', 1.0],
      ['command_injection', 1.2],
      ['ldap_injection', 0.8],
      ['xml_injection', 0.9],
      ['csrf_vulnerability', 1.0],
      ['insecure_deserialization', 1.1],
      ['buffer_overflow', 1.3],
      ['format_string', 1.0],
      ['code_injection', 1.4]
    ];
    
    this.adaptiveWeights = new Map(initialWeights);
  }

  /**
   * AIリスクスコアの計算（疑似実装）
   */
  private static async calculateAIRiskScore(
    input: string,
    context: SecurityContext
  ): Promise<number> {
    // 実際の実装では機械学習モデルを使用
    let riskScore = 0;
    
    // エントロピー分析
    const entropy = this.calculateEntropy(input);
    if (entropy > 4.5) riskScore += 0.3;
    
    // 難読化検出
    const obfuscationScore = this.detectObfuscation(input);
    riskScore += obfuscationScore * 0.4;
    
    // コンテキスト分析
    if (context.userAgent && /bot|crawler|scanner/i.test(context.userAgent)) {
      riskScore += 0.2;
    }
    
    return Math.min(riskScore, 1.0);
  }

  /**
   * ユーザー行動分析
   */
  private static async analyzeUserBehavior(
    userId: string,
    input: any
  ): Promise<{ isAnomalous: boolean; reason?: string }> {
    // 実際の実装では履歴データベースを使用
    
    // 簡易実装: 異常な入力頻度の検出
    const userInputCache = this.anomalyDetectionCache.get(`user_${userId}`) || 0;
    if (userInputCache > 50) {
      return { isAnomalous: true, reason: 'High input frequency' };
    }
    
    return { isAnomalous: false };
  }

  /**
   * 地理的異常分析
   */
  private static async analyzeGeographicAnomaly(
    context: SecurityContext
  ): Promise<{ isRisky: boolean; reason?: string }> {
    // 実際の実装では地理的IPデータベースを使用
    if (context.ipAddress) {
      // TORや既知の悪意あるIPの検出
      if (this.isTorExitNode(context.ipAddress)) {
        return { isRisky: true, reason: 'TOR exit node detected' };
      }
      
      if (this.isMaliciousIP(context.ipAddress)) {
        return { isRisky: true, reason: 'Known malicious IP' };
      }
    }
    
    return { isRisky: false };
  }

  /**
   * エンコーディング異常の検出
   */
  private static detectEncodingAnomalies(input: string): string[] {
    const anomalies: string[] = [];
    
    // 複数エンコーディングの検出
    if (/%[0-9A-F]{2}/i.test(input) && /&#x?[0-9A-F]+;/i.test(input)) {
      anomalies.push('Mixed encoding schemes');
    }
    
    // 過度のエンコーディング
    const encodedRatio = (input.match(/%[0-9A-F]{2}/gi) || []).length / input.length;
    if (encodedRatio > 0.3) {
      anomalies.push('Excessive URL encoding');
    }
    
    // Unicode正規化攻撃
    if (/[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff]/g.test(input)) {
      anomalies.push('Unicode normalization attack');
    }
    
    return anomalies;
  }

  /**
   * ペイロード異常の検出
   */
  private static detectPayloadAnomalies(input: string): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    
    // 異常な構造複雑度
    const structuralComplexity = this.calculateStructuralComplexity(input);
    if (structuralComplexity > 0.8) {
      score += 0.4;
      reasons.push('High structural complexity');
    }
    
    // 異常なキーワード密度
    const keywordDensity = this.calculateMaliciousKeywordDensity(input);
    if (keywordDensity > 0.6) {
      score += 0.3;
      reasons.push('High malicious keyword density');
    }
    
    // バイナリデータの混在
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(input)) {
      score += 0.3;
      reasons.push('Binary data in text input');
    }
    
    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * ポリグロット攻撃の検出
   */
  private static detectPolyglotAttacks(input: string): { detected: boolean; contexts: string[] } {
    const contexts: string[] = [];
    
    // HTML + JavaScript
    if (/<[^>]*on\w+[^>]*>/i.test(input) && /<script/i.test(input)) {
      contexts.push('HTML-JavaScript');
    }
    
    // CSS + JavaScript
    if (/expression\s*\(/i.test(input) && /javascript:/i.test(input)) {
      contexts.push('CSS-JavaScript');
    }
    
    // SQL + JavaScript
    if (/\bunion\b.*select/i.test(input) && /<script/i.test(input)) {
      contexts.push('SQL-JavaScript');
    }
    
    return { detected: contexts.length > 0, contexts };
  }

  /**
   * ヘルパーメソッド
   */
  private static getVulnerabilityBaseScore(severity: string): number {
    switch (severity) {
      case 'critical': return 40;
      case 'high': return 30;
      case 'medium': return 20;
      case 'low': return 10;
      default: return 5;
    }
  }

  private static calculateInputHash(input: string): string {
    // 簡易ハッシュ実装
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash).toString(16);
  }

  private static cleanupAnomalyCache(): void {
    // 古いエントリの削除（最大5000エントリまで削減）
    const entries = Array.from(this.anomalyDetectionCache.entries());
    entries.sort((a, b) => b[1] - a[1]); // 使用頻度順でソート
    
    this.anomalyDetectionCache.clear();
    for (let i = 0; i < Math.min(5000, entries.length); i++) {
      this.anomalyDetectionCache.set(entries[i][0], entries[i][1]);
    }
  }

  private static calculateEntropy(input: string): number {
    const charCounts = new Map<string, number>();
    for (const char of input) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }
    
    let entropy = 0;
    for (const count of charCounts.values()) {
      const probability = count / input.length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }

  private static detectObfuscation(input: string): number {
    let obfuscationScore = 0;
    
    // 文字エンコーディングの過度の使用
    const encodedChars = (input.match(/\\x[0-9A-F]{2}|\\u[0-9A-F]{4}|&#\d+;|%[0-9A-F]{2}/gi) || []).length;
    obfuscationScore += Math.min(encodedChars / input.length, 0.5);
    
    // 異常な文字列連結
    const concatenations = (input.match(/\+\s*['"`]/g) || []).length;
    if (concatenations > 5) obfuscationScore += 0.3;
    
    return Math.min(obfuscationScore, 1.0);
  }

  private static isTorExitNode(ip: string): boolean {
    // 実際の実装ではTOR出口ノードデータベースを使用
    // ここでは簡易実装
    const torPatterns = [
      /^127\.0\.0\.1$/,
      /^192\.168\./,
      /^10\./,
      /^172\.1[6-9]\./,
      /^172\.2[0-9]\./,
      /^172\.3[01]\./
    ];
    
    return torPatterns.some(pattern => pattern.test(ip));
  }

  private static isMaliciousIP(ip: string): boolean {
    // 実際の実装では脅威インテリジェンスデータベースを使用
    // ここでは簡易実装
    const maliciousPatterns = [
      /^0\.0\.0\.0$/,
      /^255\.255\.255\.255$/
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(ip));
  }

  private static calculateStructuralComplexity(input: string): number {
    const specialChars = (input.match(/[{}()\[\]<>]/g) || []).length;
    const quotes = (input.match(/['"`]/g) || []).length;
    const operators = (input.match(/[+\-*\/=&|!<>]/g) || []).length;
    
    const complexity = (specialChars + quotes + operators) / input.length;
    return Math.min(complexity * 2, 1.0);
  }

  private static calculateMaliciousKeywordDensity(input: string): number {
    const maliciousKeywords = [
      'script', 'eval', 'function', 'execute', 'system', 'cmd', 'exec',
      'select', 'union', 'insert', 'delete', 'drop', 'create', 'alter',
      'onload', 'onerror', 'onclick', 'javascript', 'vbscript',
      'iframe', 'object', 'embed', 'applet', 'meta'
    ];
    
    const lowerInput = input.toLowerCase();
    const foundKeywords = maliciousKeywords.filter(keyword => 
      lowerInput.includes(keyword)
    );
    
    return foundKeywords.length / maliciousKeywords.length;
  }

  /**
   * 脅威データベースの更新
   */
  static updateThreatDatabase(category: string, signatures: ThreatSignature[]): void {
    this.threatSignatures.set(category, signatures);
    secureLog('Threat database updated:', { category, count: signatures.length });
  }

  /**
   * システム統計の取得
   */
  static getSecurityStats(): {
    version: string;
    threatDatabaseVersion: string;
    totalSignatures: number;
    adaptiveWeights: Record<string, number>;
    anomalyCacheSize: number;
  } {
    let totalSignatures = 0;
    for (const signatures of this.threatSignatures.values()) {
      totalSignatures += signatures.length;
    }
    
    const adaptiveWeightsObj: Record<string, number> = {};
    for (const [key, value] of this.adaptiveWeights.entries()) {
      adaptiveWeightsObj[key] = value;
    }
    
    return {
      version: this.VERSION,
      threatDatabaseVersion: this.THREAT_DATABASE_VERSION,
      totalSignatures,
      adaptiveWeights: adaptiveWeightsObj,
      anomalyCacheSize: this.anomalyDetectionCache.size
    };
  }
}