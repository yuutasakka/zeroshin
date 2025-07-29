// インテリジェントログ分析・異常検知システム
import { secureLog } from '../../src/config/clientSecurity';
import { SecurityAuditLogger, SecurityEvent, SecurityEventType, SecurityEventSeverity } from '../../src/utils/securityAuditLogger';

export interface LogPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  category: LogAnalysisCategory;
  threshold: number;
  timeWindow: number; // milliseconds
  isActive: boolean;
  lastTriggered?: number;
  triggerCount: number;
}

export type LogAnalysisCategory = 
  | 'authentication_failure'
  | 'privilege_escalation'
  | 'data_exfiltration'
  | 'brute_force_attack'
  | 'injection_attempt'
  | 'configuration_change'
  | 'performance_anomaly'
  | 'security_bypass'
  | 'suspicious_behavior'
  | 'system_compromise';

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  anomalyType: LogAnalysisCategory;
  description: string;
  affectedSystems: string[];
  timeline: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  evidence: LogEvidence[];
  recommendations: string[];
}

export interface LogEvidence {
  timestamp: number;
  source: string;
  message: string;
  metadata: Record<string, any>;
  severity: string;
  relatedEvents: string[];
}

export interface BehaviorBaseline {
  userId?: string;
  ipAddress?: string;
  endpoint: string;
  normalFrequency: number;
  normalTiming: number[];
  normalDataSize: number;
  standardDeviation: number;
  lastUpdated: number;
  sampleCount: number;
}

export interface ThreatIntelligence {
  iocs: Map<string, IOC>; // Indicators of Compromise
  patterns: Map<string, ThreatPattern>;
  reputation: Map<string, ReputationData>;
  lastUpdated: number;
}

export interface IOC {
  value: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  firstSeen: number;
  lastSeen: number;
  confidence: number;
}

export interface ThreatPattern {
  id: string;
  name: string;
  pattern: RegExp;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitreAttack: string[]; // MITRE ATT&CK framework references
}

export interface ReputationData {
  score: number; // -100 to 100
  category: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  sources: string[];
  lastChecked: number;
}

export class IntelligentLogAnalyzer {
  private static instance: IntelligentLogAnalyzer;
  private logPatterns: Map<string, LogPattern> = new Map();
  private behaviorBaselines: Map<string, BehaviorBaseline> = new Map();
  private threatIntel: ThreatIntelligence;
  private anomalyHistory: AnomalyDetectionResult[] = [];
  private isAnalyzing = false;
  private analysisInterval: NodeJS.Timeout | null = null;
  
  private readonly ANALYSIS_INTERVAL = 2 * 60 * 1000; // 2分
  private readonly BASELINE_LEARNING_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7日
  private readonly ANOMALY_HISTORY_LIMIT = 1000;
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  
  private constructor() {
    this.threatIntel = {
      iocs: new Map(),
      patterns: new Map(),
      reputation: new Map(),
      lastUpdated: 0
    };
    
    this.initializeLogPatterns();
    this.initializeThreatIntelligence();
    this.startAnalysis();
  }
  
  public static getInstance(): IntelligentLogAnalyzer {
    if (!IntelligentLogAnalyzer.instance) {
      IntelligentLogAnalyzer.instance = new IntelligentLogAnalyzer();
    }
    return IntelligentLogAnalyzer.instance;
  }
  
  /**
   * 包括的ログ分析
   */
  async analyzeLogData(timeWindow = 5 * 60 * 1000): Promise<AnomalyDetectionResult[]> {
    const startTime = Date.now() - timeWindow;
    const endTime = Date.now();
    
    try {
      // セキュリティイベントの取得
      const events = SecurityAuditLogger.querySecurityEvents({
        startTime,
        endTime,
        limit: 10000
      });
      
      const anomalies: AnomalyDetectionResult[] = [];
      
      // パターンベース検知
      const patternAnomalies = await this.detectPatternAnomalies(events, startTime, endTime);
      anomalies.push(...patternAnomalies);
      
      // 行動分析ベース検知
      const behaviorAnomalies = await this.detectBehaviorAnomalies(events, startTime, endTime);
      anomalies.push(...behaviorAnomalies);
      
      // 脅威インテリジェンスベース検知
      const threatIntelAnomalies = await this.detectThreatIntelAnomalies(events, startTime, endTime);
      anomalies.push(...threatIntelAnomalies);
      
      // 統計的異常検知
      const statisticalAnomalies = await this.detectStatisticalAnomalies(events, startTime, endTime);
      anomalies.push(...statisticalAnomalies);
      
      // 機械学習ベース検知
      const mlAnomalies = await this.detectMLAnomalies(events, startTime, endTime);
      anomalies.push(...mlAnomalies);
      
      // 異常の重複排除と優先順位付け
      const uniqueAnomalies = this.deduplicateAndPrioritize(anomalies);
      
      // 異常履歴の更新
      this.updateAnomalyHistory(uniqueAnomalies);
      
      // 行動ベースライン更新
      await this.updateBehaviorBaselines(events);
      
      secureLog('Log analysis completed:', {
        eventsAnalyzed: events.length,
        anomaliesDetected: uniqueAnomalies.length,
        timeWindow
      });
      
      return uniqueAnomalies;
      
    } catch (error) {
      secureLog('Log analysis failed:', error);
      throw new Error('Intelligent log analysis failed');
    }
  }
  
  /**
   * パターンベース異常検知
   */
  private async detectPatternAnomalies(
    events: SecurityEvent[],
    startTime: number,
    endTime: number
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];
    
    for (const [patternId, pattern] of this.logPatterns.entries()) {
      if (!pattern.isActive) continue;
      
      let matchCount = 0;
      const matchingEvents: SecurityEvent[] = [];
      
      for (const event of events) {
        const eventText = `${event.action} ${event.details} ${JSON.stringify(event.target)}`;
        if (pattern.pattern.test(eventText)) {
          matchCount++;
          matchingEvents.push(event);
        }
      }
      
      // しきい値を超えた場合
      if (matchCount >= pattern.threshold) {
        const anomaly: AnomalyDetectionResult = {
          isAnomaly: true,
          severity: pattern.severity,
          confidence: Math.min(matchCount / pattern.threshold, 1.0),
          anomalyType: pattern.category,
          description: `${pattern.description} (detected ${matchCount} occurrences)`,
          affectedSystems: [...new Set(matchingEvents.map(e => e.source))],
          timeline: {
            startTime: Math.min(...matchingEvents.map(e => e.timestamp)),
            endTime: Math.max(...matchingEvents.map(e => e.timestamp)),
            duration: Math.max(...matchingEvents.map(e => e.timestamp)) - 
                     Math.min(...matchingEvents.map(e => e.timestamp))
          },
          evidence: matchingEvents.map(e => ({
            timestamp: e.timestamp,
            source: e.source,
            message: e.action,
            metadata: e.details,
            severity: e.severity,
            relatedEvents: [e.id]
          })),
          recommendations: this.generateRecommendations(pattern.category, pattern.severity)
        };
        
        anomalies.push(anomaly);
        
        // パターンのトリガー更新
        pattern.lastTriggered = Date.now();
        pattern.triggerCount++;
      }
    }
    
    return anomalies;
  }
  
  /**
   * 行動分析ベース異常検知
   */
  private async detectBehaviorAnomalies(
    events: SecurityEvent[],
    startTime: number,
    endTime: number
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];
    
    // ユーザー行動分析
    const userBehaviors = this.groupEventsByUser(events);
    
    for (const [userId, userEvents] of userBehaviors.entries()) {
      const baseline = this.behaviorBaselines.get(`user_${userId}`);
      if (!baseline) continue;
      
      const currentFrequency = userEvents.length;
      const timeSpan = endTime - startTime;
      const normalizedFrequency = (currentFrequency / timeSpan) * (60 * 60 * 1000); // events per hour
      
      // 頻度異常の検出
      const frequencyDeviation = Math.abs(normalizedFrequency - baseline.normalFrequency) / baseline.standardDeviation;
      
      if (frequencyDeviation > 3) { // 3σを超える場合
        const anomaly: AnomalyDetectionResult = {
          isAnomaly: true,
          severity: frequencyDeviation > 5 ? 'critical' : 'high',
          confidence: Math.min(frequencyDeviation / 5, 1.0),
          anomalyType: 'suspicious_behavior',
          description: `Abnormal user activity frequency detected for user ${userId}`,
          affectedSystems: [userId],
          timeline: { startTime, endTime, duration: endTime - startTime },
          evidence: userEvents.map(e => ({
            timestamp: e.timestamp,
            source: e.source,
            message: e.action,
            metadata: e.details,
            severity: e.severity,
            relatedEvents: [e.id]
          })),
          recommendations: [
            'Review user account for potential compromise',
            'Implement additional authentication measures',
            'Monitor user activity closely'
          ]
        };
        
        anomalies.push(anomaly);
      }
      
      // タイミング異常の検出
      const eventTimes = userEvents.map(e => new Date(e.timestamp).getHours());
      const unusualTimes = eventTimes.filter(hour => !baseline.normalTiming.includes(hour));
      
      if (unusualTimes.length > userEvents.length * 0.5) {
        const anomaly: AnomalyDetectionResult = {
          isAnomaly: true,
          severity: 'medium',
          confidence: unusualTimes.length / userEvents.length,
          anomalyType: 'suspicious_behavior',
          description: `User ${userId} active during unusual hours`,
          affectedSystems: [userId],
          timeline: { startTime, endTime, duration: endTime - startTime },
          evidence: userEvents.filter(e => unusualTimes.includes(new Date(e.timestamp).getHours())).map(e => ({
            timestamp: e.timestamp,
            source: e.source,
            message: e.action,
            metadata: e.details,
            severity: e.severity,
            relatedEvents: [e.id]
          })),
          recommendations: [
            'Verify user identity during unusual hours',
            'Review access patterns',
            'Consider time-based access restrictions'
          ]
        };
        
        anomalies.push(anomaly);
      }
    }
    
    return anomalies;
  }
  
  /**
   * 脅威インテリジェンスベース異常検知
   */
  private async detectThreatIntelAnomalies(
    events: SecurityEvent[],
    startTime: number,
    endTime: number
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];
    
    for (const event of events) {
      // IOC との照合
      const iocMatches = this.checkIOCMatches(event);
      if (iocMatches.length > 0) {
        const highestSeverityIOC = iocMatches.reduce((prev, current) => 
          this.getSeverityScore(current.severity) > this.getSeverityScore(prev.severity) ? current : prev
        );
        
        const anomaly: AnomalyDetectionResult = {
          isAnomaly: true,
          severity: highestSeverityIOC.severity,
          confidence: highestSeverityIOC.confidence,
          anomalyType: 'system_compromise',
          description: `Known threat indicator detected: ${highestSeverityIOC.description}`,
          affectedSystems: [event.source],
          timeline: { 
            startTime: event.timestamp, 
            endTime: event.timestamp, 
            duration: 0 
          },
          evidence: [{
            timestamp: event.timestamp,
            source: event.source,
            message: event.action,
            metadata: { ...event.details, ioc: highestSeverityIOC.value },
            severity: event.severity,
            relatedEvents: [event.id]
          }],
          recommendations: [
            'Immediately isolate affected systems',
            'Conduct forensic analysis',
            'Update security controls',
            'Review incident response procedures'
          ]
        };
        
        anomalies.push(anomaly);
      }
      
      // 脅威パターンとの照合
      const patternMatches = this.checkThreatPatterns(event);
      for (const pattern of patternMatches) {
        const anomaly: AnomalyDetectionResult = {
          isAnomaly: true,
          severity: pattern.severity,
          confidence: 0.8,
          anomalyType: 'system_compromise',
          description: `Threat pattern detected: ${pattern.description}`,
          affectedSystems: [event.source],
          timeline: { 
            startTime: event.timestamp, 
            endTime: event.timestamp, 
            duration: 0 
          },
          evidence: [{
            timestamp: event.timestamp,
            source: event.source,
            message: event.action,
            metadata: { ...event.details, pattern: pattern.name },
            severity: event.severity,
            relatedEvents: [event.id]
          }],
          recommendations: [
            'Analyze attack vectors',
            'Strengthen security controls',
            'Update threat detection rules'
          ]
        };
        
        anomalies.push(anomaly);
      }
    }
    
    return anomalies;
  }
  
  /**
   * 統計的異常検知
   */
  private async detectStatisticalAnomalies(
    events: SecurityEvent[],
    startTime: number,
    endTime: number
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];
    
    // イベントタイプ別の頻度分析
    const eventTypeFreq = new Map<SecurityEventType, number>();
    for (const event of events) {
      eventTypeFreq.set(event.type, (eventTypeFreq.get(event.type) || 0) + 1);
    }
    
    // 過去データとの比較（簡易実装）
    const historicalData = this.getHistoricalEventFrequency();
    
    for (const [eventType, frequency] of eventTypeFreq.entries()) {
      const historical = historicalData.get(eventType);
      if (!historical) continue;
      
      const zScore = (frequency - historical.mean) / historical.stdDev;
      
      if (Math.abs(zScore) > 2.5) { // 2.5σを超える場合
        const anomaly: AnomalyDetectionResult = {
          isAnomaly: true,
          severity: Math.abs(zScore) > 4 ? 'critical' : 'high',
          confidence: Math.min(Math.abs(zScore) / 4, 1.0),
          anomalyType: 'performance_anomaly',
          description: `Statistical anomaly in ${eventType} events (${frequency} vs expected ${historical.mean})`,
          affectedSystems: ['security_monitoring'],
          timeline: { startTime, endTime, duration: endTime - startTime },
          evidence: events.filter(e => e.type === eventType).slice(0, 10).map(e => ({
            timestamp: e.timestamp,
            source: e.source,
            message: e.action,
            metadata: e.details,
            severity: e.severity,
            relatedEvents: [e.id]
          })),
          recommendations: [
            'Investigate root cause of frequency anomaly',
            'Review system performance',
            'Check for potential attacks or system issues'
          ]
        };
        
        anomalies.push(anomaly);
      }
    }
    
    return anomalies;
  }
  
  /**
   * 機械学習ベース異常検知（疑似実装）
   */
  private async detectMLAnomalies(
    events: SecurityEvent[],
    startTime: number,
    endTime: number
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];
    
    // 特徴量抽出
    const features = this.extractFeatures(events);
    
    // 異常スコア計算（疑似実装）
    for (const feature of features) {
      const anomalyScore = this.calculateAnomalyScore(feature);
      
      if (anomalyScore > 0.8) {
        const anomaly: AnomalyDetectionResult = {
          isAnomaly: true,
          severity: anomalyScore > 0.95 ? 'critical' : 'high',
          confidence: anomalyScore,
          anomalyType: 'suspicious_behavior',
          description: `ML-detected anomaly in ${feature.type} (score: ${anomalyScore.toFixed(3)})`,
          affectedSystems: feature.affectedSystems,
          timeline: { startTime, endTime, duration: endTime - startTime },
          evidence: feature.relatedEvents.map(event => ({
            timestamp: event.timestamp,
            source: event.source,
            message: event.action,
            metadata: event.details,
            severity: event.severity,
            relatedEvents: [event.id]
          })),
          recommendations: [
            'Analyze feature patterns',
            'Review ML model predictions',
            'Investigate potential threats'
          ]
        };
        
        anomalies.push(anomaly);
      }
    }
    
    return anomalies;
  }
  
  /**
   * ログパターンの初期化
   */
  private initializeLogPatterns(): void {
    const patterns: Omit<LogPattern, 'triggerCount' | 'lastTriggered'>[] = [
      {
        id: 'auth_brute_force',
        name: 'Authentication Brute Force',
        pattern: /authentication.*fail.*rate.*high/i,
        severity: 'high',
        description: 'Multiple failed authentication attempts detected',
        category: 'brute_force_attack',
        threshold: 10,
        timeWindow: 5 * 60 * 1000,
        isActive: true
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Attempt',
        pattern: /privilege.*escalat|sudo.*fail|admin.*access.*denied/i,
        severity: 'critical',
        description: 'Potential privilege escalation attempt',
        category: 'privilege_escalation',
        threshold: 3,
        timeWindow: 10 * 60 * 1000,
        isActive: true
      },
      {
        id: 'data_exfiltration',
        name: 'Data Exfiltration Pattern',
        pattern: /large.*transfer|unusual.*download|data.*export/i,
        severity: 'critical',
        description: 'Potential data exfiltration activity',
        category: 'data_exfiltration',
        threshold: 5,
        timeWindow: 15 * 60 * 1000,
        isActive: true
      },
      {
        id: 'injection_attempt',
        name: 'Injection Attack Attempt',
        pattern: /sql.*inject|xss.*attempt|script.*inject|template.*inject/i,
        severity: 'high',
        description: 'Code injection attempt detected',
        category: 'injection_attempt',
        threshold: 1,
        timeWindow: 1 * 60 * 1000,
        isActive: true
      },
      {
        id: 'config_change',
        name: 'Critical Configuration Change',
        pattern: /config.*change|security.*setting.*modified|policy.*update/i,
        severity: 'medium',
        description: 'Critical system configuration change',
        category: 'configuration_change',
        threshold: 1,
        timeWindow: 30 * 60 * 1000,
        isActive: true
      }
    ];
    
    for (const pattern of patterns) {
      this.logPatterns.set(pattern.id, {
        ...pattern,
        triggerCount: 0
      });
    }
  }
  
  /**
   * 脅威インテリジェンスの初期化
   */
  private initializeThreatIntelligence(): void {
    // 既知の悪意あるIPアドレス（例）
    const maliciousIPs = [
      '0.0.0.0',
      '255.255.255.255',
      '127.0.0.1' // 例示用
    ];
    
    for (const ip of maliciousIPs) {
      this.threatIntel.iocs.set(ip, {
        value: ip,
        type: 'ip',
        severity: 'high',
        description: 'Known malicious IP address',
        source: 'threat_intelligence',
        firstSeen: Date.now() - 30 * 24 * 60 * 60 * 1000,
        lastSeen: Date.now(),
        confidence: 0.9
      });
    }
    
    // 脅威パターン
    this.threatIntel.patterns.set('apt_pattern_1', {
      id: 'apt_pattern_1',
      name: 'APT Lateral Movement',
      pattern: /psexec|wmic.*process.*call.*create|net.*user.*\/add/i,
      indicators: ['lateral_movement', 'privilege_escalation'],
      severity: 'critical',
      description: 'Advanced Persistent Threat lateral movement pattern',
      mitreAttack: ['T1021', 'T1078']
    });
    
    this.threatIntel.lastUpdated = Date.now();
  }
  
  /**
   * ヘルパーメソッド
   */
  private groupEventsByUser(events: SecurityEvent[]): Map<string, SecurityEvent[]> {
    const userEvents = new Map<string, SecurityEvent[]>();
    
    for (const event of events) {
      const userId = event.actor.userId || 'anonymous';
      if (!userEvents.has(userId)) {
        userEvents.set(userId, []);
      }
      userEvents.get(userId)!.push(event);
    }
    
    return userEvents;
  }
  
  private checkIOCMatches(event: SecurityEvent): IOC[] {
    const matches: IOC[] = [];
    
    // IPアドレスチェック
    if (event.actor.ipAddress) {
      const ioc = this.threatIntel.iocs.get(event.actor.ipAddress);
      if (ioc) {
        matches.push(ioc);
      }
    }
    
    // その他のIOCチェック
    const eventText = JSON.stringify(event);
    for (const [value, ioc] of this.threatIntel.iocs.entries()) {
      if (eventText.includes(value)) {
        matches.push(ioc);
      }
    }
    
    return matches;
  }
  
  private checkThreatPatterns(event: SecurityEvent): ThreatPattern[] {
    const matches: ThreatPattern[] = [];
    const eventText = `${event.action} ${JSON.stringify(event.details)}`;
    
    for (const pattern of this.threatIntel.patterns.values()) {
      if (pattern.pattern.test(eventText)) {
        matches.push(pattern);
      }
    }
    
    return matches;
  }
  
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
  
  private getHistoricalEventFrequency(): Map<SecurityEventType, { mean: number; stdDev: number }> {
    // 実際の実装では、データベースから履歴データを取得
    return new Map([
      ['authentication', { mean: 100, stdDev: 15 }],
      ['authorization', { mean: 50, stdDev: 10 }],
      ['data_access', { mean: 200, stdDev: 30 }],
      ['security_violation', { mean: 5, stdDev: 3 }]
    ]);
  }
  
  private extractFeatures(events: SecurityEvent[]): Array<{
    type: string;
    values: number[];
    affectedSystems: string[];
    relatedEvents: SecurityEvent[];
  }> {
    // 機械学習用の特徴量抽出
    return [
      {
        type: 'event_frequency',
        values: [events.length],
        affectedSystems: [...new Set(events.map(e => e.source))],
        relatedEvents: events
      }
    ];
  }
  
  private calculateAnomalyScore(feature: any): number {
    // 疑似機械学習異常スコア計算
    if (feature.type === 'event_frequency' && feature.values[0] > 1000) {
      return 0.85;
    }
    return Math.random() * 0.5; // ランダムな低スコア
  }
  
  private deduplicateAndPrioritize(anomalies: AnomalyDetectionResult[]): AnomalyDetectionResult[] {
    // 重複排除と優先順位付け
    const unique = new Map<string, AnomalyDetectionResult>();
    
    for (const anomaly of anomalies) {
      const key = `${anomaly.anomalyType}_${anomaly.description}`;
      const existing = unique.get(key);
      
      if (!existing || this.getSeverityScore(anomaly.severity) > this.getSeverityScore(existing.severity)) {
        unique.set(key, anomaly);
      }
    }
    
    return Array.from(unique.values()).sort((a, b) => 
      this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
    );
  }
  
  private updateAnomalyHistory(anomalies: AnomalyDetectionResult[]): void {
    this.anomalyHistory.push(...anomalies);
    if (this.anomalyHistory.length > this.ANOMALY_HISTORY_LIMIT) {
      this.anomalyHistory = this.anomalyHistory.slice(-this.ANOMALY_HISTORY_LIMIT);
    }
  }
  
  private async updateBehaviorBaselines(events: SecurityEvent[]): Promise<void> {
    // 行動ベースラインの更新
    const userEvents = this.groupEventsByUser(events);
    
    for (const [userId, userEventList] of userEvents.entries()) {
      const baselineKey = `user_${userId}`;
      let baseline = this.behaviorBaselines.get(baselineKey);
      
      if (!baseline) {
        baseline = {
          userId,
          endpoint: '',
          normalFrequency: userEventList.length,
          normalTiming: userEventList.map(e => new Date(e.timestamp).getHours()),
          normalDataSize: 0,
          standardDeviation: 1,
          lastUpdated: Date.now(),
          sampleCount: 1
        };
      } else {
        // 指数移動平均での更新
        const alpha = 0.1;
        baseline.normalFrequency = (1 - alpha) * baseline.normalFrequency + alpha * userEventList.length;
        baseline.lastUpdated = Date.now();
        baseline.sampleCount++;
      }
      
      this.behaviorBaselines.set(baselineKey, baseline);
    }
  }
  
  private generateRecommendations(category: LogAnalysisCategory, severity: string): string[] {
    const recommendations: Record<LogAnalysisCategory, string[]> = {
      authentication_failure: [
        'Implement account lockout policies',
        'Enable multi-factor authentication',
        'Monitor authentication logs closely'
      ],
      privilege_escalation: [
        'Review user privileges immediately',
        'Implement least privilege principles',
        'Audit administrative access'
      ],
      data_exfiltration: [
        'Implement data loss prevention controls',
        'Monitor data transfer patterns',
        'Review access to sensitive data'
      ],
      brute_force_attack: [
        'Implement rate limiting',
        'Use CAPTCHA for repeated failures',
        'Block suspicious IP addresses'
      ],
      injection_attempt: [
        'Update input validation',
        'Implement web application firewall',
        'Review code for vulnerabilities'
      ],
      configuration_change: [
        'Review change management process',
        'Implement change approval workflow',
        'Monitor configuration integrity'
      ],
      performance_anomaly: [
        'Investigate system performance',
        'Check resource utilization',
        'Review application logs'
      ],
      security_bypass: [
        'Strengthen security controls',
        'Review bypass mechanisms',
        'Implement additional monitoring'
      ],
      suspicious_behavior: [
        'Investigate user activity',
        'Review access patterns',
        'Consider additional authentication'
      ],
      system_compromise: [
        'Isolate affected systems immediately',
        'Conduct forensic analysis',
        'Implement incident response plan'
      ]
    };
    
    return recommendations[category] || ['Review security controls', 'Investigate further'];
  }
  
  /**
   * 分析開始
   */
  private startAnalysis(): void {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    this.analysisInterval = setInterval(async () => {
      try {
        await this.analyzeLogData();
      } catch (error) {
        secureLog('Automated log analysis failed:', error);
      }
    }, this.ANALYSIS_INTERVAL);
    
    secureLog('Intelligent log analysis started');
  }
  
  /**
   * 分析停止
   */
  stopAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.isAnalyzing = false;
    secureLog('Intelligent log analysis stopped');
  }
  
  /**
   * 異常履歴取得
   */
  getAnomalyHistory(hours = 24): AnomalyDetectionResult[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.anomalyHistory.filter(a => a.timeline.endTime > cutoffTime);
  }
  
  /**
   * 脅威インテリジェンス更新
   */
  updateThreatIntelligence(iocs: IOC[], patterns: ThreatPattern[]): void {
    for (const ioc of iocs) {
      this.threatIntel.iocs.set(ioc.value, ioc);
    }
    
    for (const pattern of patterns) {
      this.threatIntel.patterns.set(pattern.id, pattern);
    }
    
    this.threatIntel.lastUpdated = Date.now();
    secureLog('Threat intelligence updated:', { 
      iocs: iocs.length, 
      patterns: patterns.length 
    });
  }
}