// 統一セキュリティ検証システム - 全ての入力を一元管理
import { InputValidator, ValidationResult } from './inputValidation';
import { TemplateSecurityManager, TemplateValidationResult } from './templateSecurityManager';
import { securityChecks } from '../middleware/securityMiddleware';

export interface UnifiedValidationResult {
  isSecure: boolean;
  sanitizedInput: any;
  vulnerabilities: SecurityVulnerability[];
  warnings: string[];
  inputType: InputType;
  processingTime: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityVulnerability {
  type: VulnerabilityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigated: boolean;
  location?: string;
}

export type VulnerabilityType = 
  | 'sql_injection'
  | 'xss_attack'
  | 'template_injection'
  | 'path_traversal'
  | 'command_injection'
  | 'ldap_injection'
  | 'xml_injection'
  | 'csrf_vulnerability'
  | 'insecure_deserialization'
  | 'buffer_overflow'
  | 'format_string'
  | 'code_injection';

export type InputType = 
  | 'text'
  | 'html'
  | 'template'
  | 'url'
  | 'email'
  | 'phone'
  | 'sql_query'
  | 'json'
  | 'xml'
  | 'file_path'
  | 'command'
  | 'regex'
  | 'unknown';

export class UnifiedSecurityValidator {
  private static readonly VULNERABILITY_PATTERNS = {
    sql_injection: [
      /(\b(select|insert|update|delete|drop|create|alter|exec|union|script)\b)/gi,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/gi,
      /(--|#|\/\*|\*\/)/g,
      /(\bxp_|\bsp_)/gi,
      /(\b(waitfor|delay)\b)/gi,
      /('|")\s*(or|and)\s*('|")/gi
    ],
    xss_attack: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*=\s*["']?[^"']*["']?[^>]*>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ],
    template_injection: [
      /\{\{.*?\}\}/g,
      /\{%.*?%\}/g,
      /<%.*?%>/g,
      /\$\{.*?\}/g,
      /#\{.*?\}/g,
      /@\{.*?\}/g,
      /\{\{\{.*?\}\}\}/g
    ],
    path_traversal: [
      /\.\./g,
      /\.\\\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.%2f/gi,
      /%2e\//gi,
      /\.%5c/gi,
      /%2e%5c/gi
    ],
    command_injection: [
      /[;&|`$(){}\\[\]]/g,
      /\b(cat|ls|dir|type|copy|move|del|rm|chmod|chown|ps|kill|wget|curl|nc|netcat)\b/gi,
      /\b(sh|bash|cmd|powershell|python|perl|ruby|php)\b/gi,
      />/g,
      /<(?!\w)/g,
      /\|\|/g,
      /&&/g
    ],
    ldap_injection: [
      /[*()\\]/g,
      /\x00/g,
      /[&|!]/g,
      /[=<>~]/g
    ],
    xml_injection: [
      /<\?xml/gi,
      /<!\[CDATA\[/gi,
      /<!DOCTYPE/gi,
      /<!ENTITY/gi,
      /&[a-zA-Z0-9]+;/g
    ],
    code_injection: [
      /eval\(/gi,
      /Function\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /new\s+Function/gi,
      /require\s*\(/gi,
      /import\s*\(/gi
    ]
  };

  /**
   * 統一入力検証 - 全ての入力タイプに対応
   */
  static async validateInput(
    input: any,
    inputType: InputType = 'unknown',
    context?: { 
      userId?: string; 
      sessionId?: string; 
      endpoint?: string;
      strictMode?: boolean;
    }
  ): Promise<UnifiedValidationResult> {
    const startTime = Date.now();
    
    const result: UnifiedValidationResult = {
      isSecure: true,
      sanitizedInput: input,
      vulnerabilities: [],
      warnings: [],
      inputType,
      processingTime: 0,
      riskLevel: 'low'
    };

    try {
      // 入力タイプの自動検出
      if (inputType === 'unknown') {
        inputType = this.detectInputType(input);
        result.inputType = inputType;
      }

      // 基本的なサニタイゼーション
      result.sanitizedInput = this.performBasicSanitization(input, inputType);

      // 脆弱性検出
      await this.detectVulnerabilities(input, result, context);

      // 入力タイプ別の特殊検証
      await this.performTypeSpecificValidation(input, inputType, result, context);

      // リスクレベルの算出
      result.riskLevel = this.calculateRiskLevel(result.vulnerabilities);

      // セキュリティ判定
      result.isSecure = this.determineSecurityStatus(result);

      // 処理時間の記録
      result.processingTime = Date.now() - startTime;

      // セキュリティログ
      if (result.vulnerabilities.length > 0 || result.riskLevel !== 'low') {
        this.logSecurityEvent(input, result, context);
      }

    } catch (error) {
      result.isSecure = false;
      result.vulnerabilities.push({
        type: 'code_injection',
        severity: 'high',
        description: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        mitigated: false
      });
      result.riskLevel = 'high';
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 入力タイプの自動検出
   */
  private static detectInputType(input: any): InputType {
    if (typeof input !== 'string') {
      return 'unknown';
    }

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
      return 'email';
    }

    // Phone
    if (/^[\+\d\s\-\(\)]{10,}$/.test(input)) {
      return 'phone';
    }

    // URL
    if (/^https?:\/\//.test(input)) {
      return 'url';
    }

    // HTML
    if (/<[^>]+>/.test(input)) {
      return 'html';
    }

    // Template
    if (/\{\{.*?\}\}|<%.*?%>|\$\{.*?\}/.test(input)) {
      return 'template';
    }

    // JSON
    if (/^\s*[\{\[]/.test(input.trim())) {
      return 'json';
    }

    // XML
    if (/^\s*<\?xml|^\s*<\w+/.test(input.trim())) {
      return 'xml';
    }

    // File path
    if (/^([a-zA-Z]:)?[\/\\]|\.\./.test(input)) {
      return 'file_path';
    }

    // SQL
    if (/\b(select|insert|update|delete|create|drop|alter)\b/gi.test(input)) {
      return 'sql_query';
    }

    // Command
    if (/^[a-zA-Z]+\s+/.test(input) && /[;&|`$]/.test(input)) {
      return 'command';
    }

    return 'text';
  }

  /**
   * 基本的なサニタイゼーション
   */
  private static performBasicSanitization(input: any, inputType: InputType): any {
    if (typeof input !== 'string') {
      return input;
    }

    switch (inputType) {
      case 'html':
        return InputValidator.sanitizeHTML(input);
      
      case 'url':
        return InputValidator.sanitizeURL(input);
      
      case 'sql_query':
        return securityChecks.sanitizeInput(input);
      
      case 'file_path':
        return securityChecks.sanitizePath(input);
      
      case 'command':
        return securityChecks.sanitizeCommand(input);
      
      case 'template':
        const templateResult = TemplateSecurityManager.validateTemplate(input);
        return templateResult.sanitizedTemplate;
      
      default:
        return InputValidator.sanitizeHTML(input);
    }
  }

  /**
   * 包括的な脆弱性検出
   */
  private static async detectVulnerabilities(
    input: any,
    result: UnifiedValidationResult,
    context?: any
  ): Promise<void> {
    if (typeof input !== 'string') {
      return;
    }

    // 各脆弱性タイプの検査
    for (const [vulnType, patterns] of Object.entries(this.VULNERABILITY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          const vulnerability: SecurityVulnerability = {
            type: vulnType as VulnerabilityType,
            severity: this.getSeverityForVulnerabilityType(vulnType as VulnerabilityType),
            description: `${vulnType} pattern detected in input`,
            mitigated: true, // 検出後にサニタイゼーション済み
            location: context?.endpoint
          };
          
          result.vulnerabilities.push(vulnerability);
        }
      }
    }

    // 高度な検出ロジック
    this.detectAdvancedThreats(input, result);
  }

  /**
   * 高度な脅威検出
   */
  private static detectAdvancedThreats(input: string, result: UnifiedValidationResult): void {
    // エンコード回避の検出
    const encodedPatterns = [
      /%3C%73%63%72%69%70%74/gi, // <script encoded
      /&#x3C;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74/gi, // HTML entity encoded
      /\u003C\u0073\u0063\u0072\u0069\u0070\u0074/gi // Unicode escaped
    ];

    for (const pattern of encodedPatterns) {
      if (pattern.test(input)) {
        result.vulnerabilities.push({
          type: 'xss_attack',
          severity: 'high',
          description: 'Encoded XSS payload detected',
          mitigated: true
        });
      }
    }

    // ポリグロット攻撃の検出
    const polyglotPattern = /javascript:|data:|vbscript:|livescript:|mocha:|tcl:|perl:|python:/gi;
    if (polyglotPattern.test(input)) {
      result.vulnerabilities.push({
        type: 'code_injection',
        severity: 'high',
        description: 'Polyglot injection attempt detected',
        mitigated: true
      });
    }

    // 異常な長さの検出
    if (input.length > 10000) {
      result.warnings.push('Unusually long input detected - potential DoS attempt');
    }

    // 連続する特殊文字の検出
    if (/[<>'"&;(){}[\]]{10,}/.test(input)) {
      result.warnings.push('High concentration of special characters detected');
    }
  }

  /**
   * 入力タイプ別の特殊検証
   */
  private static async performTypeSpecificValidation(
    input: any,
    inputType: InputType,
    result: UnifiedValidationResult,
    context?: any
  ): Promise<void> {
    switch (inputType) {
      case 'email':
        const emailValidation = InputValidator.validateEmail(input);
        if (!emailValidation.isValid) {
          result.vulnerabilities.push({
            type: 'xss_attack',
            severity: 'medium',
            description: 'Invalid email format detected',
            mitigated: true
          });
        }
        break;

      case 'phone':
        const phoneValidation = InputValidator.validatePhoneNumber(input);
        if (!phoneValidation.isValid) {
          result.warnings.push('Invalid phone number format');
        }
        break;

      case 'template':
        const templateValidation = TemplateSecurityManager.validateTemplate(input);
        if (!templateValidation.isSecure) {
          for (const vulnerability of templateValidation.vulnerabilities) {
            result.vulnerabilities.push({
              type: 'template_injection',
              severity: 'high',
              description: vulnerability,
              mitigated: true
            });
          }
        }
        break;

      case 'json':
        try {
          JSON.parse(input);
        } catch {
          result.warnings.push('Invalid JSON format detected');
        }
        break;

      case 'xml':
        if (/<!\[CDATA\[|<!ENTITY/.test(input)) {
          result.vulnerabilities.push({
            type: 'xml_injection',
            severity: 'high',
            description: 'XML injection pattern detected',
            mitigated: true
          });
        }
        break;
    }
  }

  /**
   * 脆弱性タイプの重要度取得
   */
  private static getSeverityForVulnerabilityType(type: VulnerabilityType): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<VulnerabilityType, 'low' | 'medium' | 'high' | 'critical'> = {
      sql_injection: 'critical',
      xss_attack: 'high',
      template_injection: 'high',
      path_traversal: 'high',
      command_injection: 'critical',
      ldap_injection: 'medium',
      xml_injection: 'medium',
      csrf_vulnerability: 'high',
      insecure_deserialization: 'critical',
      buffer_overflow: 'critical',
      format_string: 'high',
      code_injection: 'critical'
    };

    return severityMap[type] || 'medium';
  }

  /**
   * リスクレベルの算出
   */
  private static calculateRiskLevel(vulnerabilities: SecurityVulnerability[]): 'low' | 'medium' | 'high' | 'critical' {
    if (vulnerabilities.some(v => v.severity === 'critical')) {
      return 'critical';
    }
    if (vulnerabilities.some(v => v.severity === 'high')) {
      return 'high';
    }
    if (vulnerabilities.some(v => v.severity === 'medium')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * セキュリティステータスの判定
   */
  private static determineSecurityStatus(result: UnifiedValidationResult): boolean {
    // Critical または High の脆弱性がある場合は非セキュア
    const hasCriticalVulns = result.vulnerabilities.some(
      v => v.severity === 'critical' || v.severity === 'high'
    );
    
    return !hasCriticalVulns;
  }

  /**
   * セキュリティイベントのログ記録
   */
  private static logSecurityEvent(
    input: any,
    result: UnifiedValidationResult,
    context?: any
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      inputType: result.inputType,
      riskLevel: result.riskLevel,
      vulnerabilityCount: result.vulnerabilities.length,
      vulnerabilities: result.vulnerabilities.map(v => ({
        type: v.type,
        severity: v.severity,
        mitigated: v.mitigated
      })),
      warnings: result.warnings,
      context: {
        userId: context?.userId,
        sessionId: context?.sessionId,
        endpoint: context?.endpoint,
        inputHash: this.hashInput(input)
      },
      processingTime: result.processingTime
    };

    if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
      console.error('High-risk security event detected:', logData);
    } else {
      console.warn('Security event detected:', logData);
    }
  }

  /**
   * 入力値のハッシュ化（ログ用）
   */
  private static hashInput(input: any): string {
    const crypto = require('crypto');
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(inputStr).digest('hex').substring(0, 16);
  }

  /**
   * バッチ検証（複数入力の一括処理）
   */
  static async validateInputBatch(
    inputs: Array<{ value: any; type?: InputType; name?: string }>,
    context?: any
  ): Promise<Array<UnifiedValidationResult & { inputName?: string }>> {
    const results = [];

    for (const input of inputs) {
      const result = await this.validateInput(
        input.value,
        input.type || 'unknown',
        context
      );
      
      results.push({
        ...result,
        inputName: input.name
      });
    }

    return results;
  }

  /**
   * セキュリティ統計の取得
   */
  static getSecurityStatistics(): {
    totalValidations: number;
    vulnerabilitiesFound: number;
    riskDistribution: Record<string, number>;
    commonVulnerabilities: Record<string, number>;
  } {
    // 実装では実際の統計データを返す
    return {
      totalValidations: 0,
      vulnerabilitiesFound: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      commonVulnerabilities: {}
    };
  }
}

// エクスポート用のヘルパー関数
export const validateSecureInput = async (
  input: any,
  type?: InputType,
  context?: any
): Promise<UnifiedValidationResult> => {
  return UnifiedSecurityValidator.validateInput(input, type, context);
};

export const isInputSecure = async (
  input: any,
  type?: InputType,
  context?: any
): Promise<boolean> => {
  const result = await UnifiedSecurityValidator.validateInput(input, type, context);
  return result.isSecure;
};