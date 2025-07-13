// 入力検証とサニタイゼーション
export class InputValidator {
  // HTMLサニタイゼーション
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  // URLサニタイゼーション
  static sanitizeURL(url: string): string {
    if (typeof url !== 'string') return '#';
    
    const dangerousProtocols = [
      'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:', 'blob:', 'about:'
    ];
    
    const urlLower = url.toLowerCase().trim();
    
    // 危険なプロトコルを除去
    for (const protocol of dangerousProtocols) {
      if (urlLower.startsWith(protocol)) {
        return '#';
      }
    }
    
    // 許可されたプロトコルまたは相対URL
    if (url.match(/^https?:\/\//) || url.startsWith('/') || url.startsWith('#')) {
      return url;
    }
    
    // それ以外は安全なフォールバック
    return '#';
  }

  // 電話番号の正規化と検証
  static validatePhoneNumber(phone: string): { isValid: boolean; normalized: string; error?: string } {
    if (typeof phone !== 'string') {
      return { isValid: false, normalized: '', error: '電話番号は文字列である必要があります' };
    }

    // 全角数字を半角に変換
    const halfWidth = phone.replace(/[０-９]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
    });
    
    // 数字以外を削除
    const normalized = halfWidth.replace(/\D/g, '');
    
    // 日本の携帯電話番号の形式チェック
    if (!/^(090|080|070)\d{8}$/.test(normalized)) {
      return { 
        isValid: false, 
        normalized, 
        error: '090、080、070で始まる11桁の携帯電話番号を入力してください' 
      };
    }

    return { isValid: true, normalized };
  }

  // メールアドレスの検証
  static validateEmail(email: string): { isValid: boolean; normalized: string; error?: string } {
    if (typeof email !== 'string') {
      return { isValid: false, normalized: '', error: 'メールアドレスは文字列である必要があります' };
    }

    const normalized = email.trim().toLowerCase();
    
    // 基本的なメールアドレス形式チェック
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(normalized)) {
      return { 
        isValid: false, 
        normalized, 
        error: '有効なメールアドレスを入力してください' 
      };
    }

    // 長さチェック
    if (normalized.length > 254) {
      return { 
        isValid: false, 
        normalized, 
        error: 'メールアドレスが長すぎます' 
      };
    }

    return { isValid: true, normalized };
  }

  // 一般的なテキスト入力の検証
  static validateText(text: string, maxLength = 1000): { isValid: boolean; sanitized: string; error?: string } {
    if (typeof text !== 'string') {
      return { isValid: false, sanitized: '', error: 'テキストは文字列である必要があります' };
    }

    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, sanitized: '', error: 'テキストを入力してください' };
    }

    if (trimmed.length > maxLength) {
      return { 
        isValid: false, 
        sanitized: trimmed, 
        error: `テキストは${maxLength}文字以内で入力してください` 
      };
    }

    // HTMLタグや危険な文字をサニタイズ
    const sanitized = this.sanitizeHTML(trimmed);

    return { isValid: true, sanitized };
  }

  // 数値の検証
  static validateNumber(value: any, min?: number, max?: number): { isValid: boolean; number: number; error?: string } {
    const num = Number(value);
    
    if (isNaN(num)) {
      return { isValid: false, number: 0, error: '有効な数値を入力してください' };
    }

    if (min !== undefined && num < min) {
      return { isValid: false, number: num, error: `${min}以上の値を入力してください` };
    }

    if (max !== undefined && num > max) {
      return { isValid: false, number: num, error: `${max}以下の値を入力してください` };
    }

    return { isValid: true, number: num };
  }

  // SQLインジェクション対策
  static detectSQLInjection(input: string): boolean {
    if (typeof input !== 'string') return false;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bxp_|\bsp_)/i,
      /(\b(WAITFOR|DELAY)\b)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS対策
  static detectXSS(input: string): boolean {
    if (typeof input !== 'string') return false;
    
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<img[^>]+src[^>]*=\s*["']?[^"']*["']?[^>]*>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // 総合的な入力検証
  static validateInput(input: string, type: 'text' | 'email' | 'phone' | 'url' = 'text'): {
    isValid: boolean;
    sanitized: string;
    error?: string;
  } {
    if (typeof input !== 'string') {
      return { isValid: false, sanitized: '', error: '無効な入力です' };
    }

    // SQLインジェクション検知
    if (this.detectSQLInjection(input)) {
      return { isValid: false, sanitized: '', error: '不正な入力が検出されました' };
    }

    // XSS検知
    if (this.detectXSS(input)) {
      return { isValid: false, sanitized: '', error: '不正なスクリプトが検出されました' };
    }

    // タイプ別検証
    switch (type) {
      case 'email': {
        const result = this.validateEmail(input);
        return { 
          isValid: result.isValid, 
          sanitized: result.normalized, 
          error: result.error 
        };
      }
      case 'phone': {
        const result = this.validatePhoneNumber(input);
        return { 
          isValid: result.isValid, 
          sanitized: result.normalized, 
          error: result.error 
        };
      }
      case 'url': {
        const sanitized = this.sanitizeURL(input);
        return { 
          isValid: sanitized !== '#', 
          sanitized, 
          error: sanitized === '#' ? '無効なURLです' : undefined 
        };
      }
      default: {
        const result = this.validateText(input);
        return { 
          isValid: result.isValid, 
          sanitized: result.sanitized, 
          error: result.error 
        };
      }
    }
  }
}