// テンプレートインジェクション対策システム
import { InputValidator } from './inputValidation';

export interface TemplateSecurityConfig {
  allowedTags: string[];
  allowedAttributes: { [tag: string]: string[] };
  allowedProtocols: string[];
  maxTemplateLength: number;
  enableStrictMode: boolean;
}

export interface TemplateValidationResult {
  isSecure: boolean;
  sanitizedTemplate: string;
  vulnerabilities: string[];
  warnings: string[];
  blockedPatterns: string[];
}

export class TemplateSecurityManager {
  private static readonly DEFAULT_CONFIG: TemplateSecurityConfig = {
    allowedTags: ['p', 'div', 'span', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: {
      'div': ['class', 'id'],
      'span': ['class', 'id'],
      'p': ['class'],
      'h1': ['class'],
      'h2': ['class'],
      'h3': ['class'],
      'h4': ['class'],
      'h5': ['class'],
      'h6': ['class'],
      'ul': ['class'],
      'ol': ['class'],
      'li': ['class']
    },
    allowedProtocols: ['http:', 'https:', 'mailto:'],
    maxTemplateLength: 50000,
    enableStrictMode: true
  };

  /**
   * テンプレートインジェクション攻撃の検出と防止
   */
  static validateTemplate(
    template: string, 
    config: Partial<TemplateSecurityConfig> = {}
  ): TemplateValidationResult {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    const result: TemplateValidationResult = {
      isSecure: true,
      sanitizedTemplate: template,
      vulnerabilities: [],
      warnings: [],
      blockedPatterns: []
    };

    try {
      // 基本的な長さチェック
      if (template.length > finalConfig.maxTemplateLength) {
        result.isSecure = false;
        result.vulnerabilities.push('Template exceeds maximum length limit');
        result.sanitizedTemplate = template.substring(0, finalConfig.maxTemplateLength);
      }

      // テンプレートインジェクションパターンの検出
      this.detectTemplateInjection(template, result);

      // サーバーサイドテンプレートインジェクション (SSTI) の検出
      this.detectSSTI(template, result);

      // クライアントサイドテンプレートインジェクション (CSTI) の検出
      this.detectCSTI(template, result);

      // 式インジェクションの検出
      this.detectExpressionInjection(template, result);

      // テンプレートの安全な処理
      if (result.isSecure || !finalConfig.enableStrictMode) {
        result.sanitizedTemplate = this.sanitizeTemplate(template, finalConfig);
      } else {
        result.sanitizedTemplate = this.escapeTemplate(template);
      }

      // 最終セキュリティチェック
      this.performFinalSecurityCheck(result.sanitizedTemplate, result);

    } catch (error) {
      result.isSecure = false;
      result.vulnerabilities.push(`Template validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.sanitizedTemplate = this.escapeTemplate(template);
    }

    return result;
  }

  /**
   * テンプレートインジェクションパターンの検出
   */
  private static detectTemplateInjection(template: string, result: TemplateValidationResult): void {
    const injectionPatterns = [
      // Jinja2/Django/Flask テンプレート
      /\{\{.*?\}\}/g,
      /\{%.*?%\}/g,
      /\{#.*?#\}/g,
      
      // Handlebars/Mustache
      /\{\{\{.*?\}\}\}/g,
      /\{\{[^}]*\}\}/g,
      
      // Twig
      /\{\{.*?\}\}/g,
      /\{%.*?%\}/g,
      
      // ERB (Ruby)
      /<%.*?%>/g,
      /<%=.*?%>/g,
      /<%#.*?%>/g,
      
      // JSP
      /<%.*?%>/g,
      /<jsp:.*?>/g,
      
      // Smarty
      /\{.*?\}/g,
      /\{\*.*?\*\}/g,
      
      // Velocity
      /#\{.*?\}/g,
      /#set.*?#end/g,
      
      // FreeMarker
      /<#.*?>/g,
      /<@.*?>/g,
      /\$\{.*?\}/g,
      
      // Thymeleaf
      /th:.*?=/g,
      /\[\[.*?\]\]/g,
      
      // Pebble
      /\{\{.*?\}\}/g,
      /\{%.*?%\}/g
    ];

    for (const pattern of injectionPatterns) {
      const matches = template.match(pattern);
      if (matches) {
        result.isSecure = false;
        result.vulnerabilities.push('Template injection pattern detected');
        result.blockedPatterns.push(...matches);
      }
    }
  }

  /**
   * サーバーサイドテンプレートインジェクション (SSTI) の検出
   */
  private static detectSSTI(template: string, result: TemplateValidationResult): void {
    const sstiPatterns = [
      // Python/Jinja2 specific
      /__import__/g,
      /exec\(/g,
      /eval\(/g,
      /\.popen\(/g,
      /\.system\(/g,
      /subprocess/g,
      /os\..*\(/g,
      
      // Java specific
      /Runtime\.getRuntime\(\)/g,
      /ProcessBuilder/g,
      /Class\.forName/g,
      /\.newInstance\(\)/g,
      
      // PHP specific
      /system\(/g,
      /exec\(/g,
      /shell_exec\(/g,
      /passthru\(/g,
      /file_get_contents\(/g,
      /include\(/g,
      /require\(/g,
      
      // Node.js specific
      /require\(/g,
      /process\..*\(/g,
      /child_process/g,
      /fs\./g,
      
      // Ruby specific
      /Kernel\.system/g,
      /\.send\(/g,
      /\.instance_eval/g,
      /\.class_eval/g,
      
      // 一般的な危険な関数
      /\.constructor/g,
      /\.prototype/g,
      /Function\(/g,
      /setTimeout\(/g,
      /setInterval\(/g
    ];

    for (const pattern of sstiPatterns) {
      const matches = template.match(pattern);
      if (matches) {
        result.isSecure = false;
        result.vulnerabilities.push('Server-Side Template Injection (SSTI) pattern detected');
        result.blockedPatterns.push(...matches);
      }
    }
  }

  /**
   * クライアントサイドテンプレートインジェクション (CSTI) の検出
   */
  private static detectCSTI(template: string, result: TemplateValidationResult): void {
    const cstiPatterns = [
      // Angular expressions
      /\{\{.*?\}\}/g,
      /ng-.*?=/g,
      
      // Vue.js
      /v-.*?=/g,
      /\{\{.*?\}\}/g,
      /@.*?=/g,
      
      // React (JSX)
      /\{.*?\}/g,
      /dangerouslySetInnerHTML/g,
      
      // JavaScript template literals
      /`.*?\${.*?}.*?`/g,
      
      // jQuery
      /\$\(.*?\)/g,
      
      // DOM manipulation
      /innerHTML/g,
      /outerHTML/g,
      /insertAdjacentHTML/g,
      /document\.write/g,
      /document\.writeln/g,
      
      // Event handlers
      /on\w+\s*=/g,
      /javascript:/g
    ];

    for (const pattern of cstiPatterns) {
      const matches = template.match(pattern);
      if (matches) {
        result.isSecure = false;
        result.vulnerabilities.push('Client-Side Template Injection (CSTI) pattern detected');
        result.blockedPatterns.push(...matches);
      }
    }
  }

  /**
   * 式インジェクションの検出
   */
  private static detectExpressionInjection(template: string, result: TemplateValidationResult): void {
    const expressionPatterns = [
      // 数学的式
      /\${?\d+[\+\-\*\/]\d+}?/g,
      
      // 条件式
      /\${?.*?[\?\:].*?}?/g,
      
      // 関数呼び出し
      /\${?\w+\(.*?\)}?/g,
      
      // プロパティアクセス
      /\${?\w+\.\w+.*?}?/g,
      
      // 配列アクセス
      /\${?\w+\[.*?\]}?/g,
      
      // EL式 (Expression Language)
      /\$\{.*?\}/g,
      
      // OGNL式
      /%\{.*?\}/g,
      
      // SpEL式 (Spring Expression Language)
      /#\{.*?\}/g,
      
      // MVEL式
      /@\{.*?\}/g
    ];

    for (const pattern of expressionPatterns) {
      const matches = template.match(pattern);
      if (matches) {
        result.warnings.push('Expression injection pattern detected');
        result.blockedPatterns.push(...matches);
      }
    }
  }

  /**
   * テンプレートの安全なサニタイゼーション
   */
  private static sanitizeTemplate(template: string, config: TemplateSecurityConfig): string {
    let sanitized = template;

    // HTMLエスケープ
    sanitized = InputValidator.sanitizeHTML(sanitized);

    // 危険なプロトコルの除去
    for (const protocol of ['javascript:', 'data:', 'vbscript:', 'file:']) {
      const regex = new RegExp(protocol, 'gi');
      sanitized = sanitized.replace(regex, '#');
    }

    // 危険なタグの除去
    const dangerousTags = ['script', 'object', 'embed', 'applet', 'form', 'input', 'textarea', 'select', 'meta', 'link', 'style'];
    for (const tag of dangerousTags) {
      const regex = new RegExp(`</?${tag}[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    // 危険な属性の除去
    const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onfocus', 'onblur', 'onchange', 'onsubmit'];
    for (const attr of dangerousAttributes) {
      const regex = new RegExp(`${attr}\\s*=\\s*["\'][^"\']*["\']`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    return sanitized;
  }

  /**
   * テンプレートの完全エスケープ（厳格モード）
   */
  private static escapeTemplate(template: string): string {
    return template
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\{/g, '&#123;')
      .replace(/\}/g, '&#125;')
      .replace(/\$/g, '&#36;')
      .replace(/@/g, '&#64;')
      .replace(/#/g, '&#35;')
      .replace(/%/g, '&#37;');
  }

  /**
   * 最終セキュリティチェック
   */
  private static performFinalSecurityCheck(sanitizedTemplate: string, result: TemplateValidationResult): void {
    // エスケープ漏れのチェック
    const escapeLeakPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /\{\{.*?\}\}/,
      /<%.*?%>/,
      /\$\{.*?\}/
    ];

    for (const pattern of escapeLeakPatterns) {
      if (pattern.test(sanitizedTemplate)) {
        result.warnings.push('Potential escape leak detected in sanitized template');
        break;
      }
    }

    // 長すぎる属性値のチェック
    const longAttributePattern = /\w+\s*=\s*["\'][^"\']{1000,}["\']]/g;
    if (longAttributePattern.test(sanitizedTemplate)) {
      result.warnings.push('Unusually long attribute values detected');
    }

    // 深いネストのチェック
    const nestingLevel = (sanitizedTemplate.match(/</g) || []).length;
    if (nestingLevel > 100) {
      result.warnings.push('Deep nesting detected - potential DoS risk');
    }
  }

  /**
   * 安全なテンプレートレンダリング
   */
  static renderSecureTemplate(template: string, data: any = {}, config?: Partial<TemplateSecurityConfig>): string {
    const validation = this.validateTemplate(template, config);
    
    if (!validation.isSecure) {
      throw new Error(`Template validation failed: ${validation.vulnerabilities.join(', ')}`);
    }

    // データのサニタイゼーション
    const sanitizedData = this.sanitizeTemplateData(data);
    
    // 安全なテンプレートレンダリング（基本的な置換のみ）
    let rendered = validation.sanitizedTemplate;
    
    // {{variable}} 形式の安全な置換
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = sanitizedData[key];
      return value ? InputValidator.sanitizeHTML(String(value)) : '';
    });

    return rendered;
  }

  /**
   * テンプレートデータのサニタイゼーション
   */
  private static sanitizeTemplateData(data: any): any {
    if (typeof data === 'string') {
      return InputValidator.sanitizeHTML(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeTemplateData(item));
    }
    
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // キー名のサニタイゼーション
        const cleanKey = key.replace(/[^\w]/g, '');
        sanitized[cleanKey] = this.sanitizeTemplateData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * テンプレートセキュリティ統計の取得
   */
  static getSecurityStats(templates: string[]): {
    totalTemplates: number;
    secureTemplates: number;
    vulnerableTemplates: number;
    commonVulnerabilities: { [key: string]: number };
  } {
    const stats = {
      totalTemplates: templates.length,
      secureTemplates: 0,
      vulnerableTemplates: 0,
      commonVulnerabilities: {} as { [key: string]: number }
    };

    for (const template of templates) {
      const validation = this.validateTemplate(template);
      
      if (validation.isSecure) {
        stats.secureTemplates++;
      } else {
        stats.vulnerableTemplates++;
        
        for (const vulnerability of validation.vulnerabilities) {
          stats.commonVulnerabilities[vulnerability] = 
            (stats.commonVulnerabilities[vulnerability] || 0) + 1;
        }
      }
    }

    return stats;
  }
}

// テンプレートセキュリティミドルウェア
export const templateSecurityMiddleware = (
  template: string, 
  data?: any, 
  config?: Partial<TemplateSecurityConfig>
) => {
  const validation = TemplateSecurityManager.validateTemplate(template, config);
  
  if (!validation.isSecure) {
    console.warn('Template security violation:', {
      vulnerabilities: validation.vulnerabilities,
      blockedPatterns: validation.blockedPatterns
    });
  }
  
  return validation;
};