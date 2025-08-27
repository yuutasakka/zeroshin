/**
 * 入力検証・サニタイゼーションユーティリティ
 */

// 基本的なサニタイゼーション
export const sanitizeInput = {
  // 基本的なHTML/JSインジェクション防止
  html: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // 検索クエリのサニタイゼーション
  searchQuery: (input: string): string => {
    // SQLインジェクション防止の基本的な処理
    return input
      .trim()
      .replace(/['"`;\\]/g, '') // 危険な文字を除去
      .substring(0, 100); // 長さ制限
  },

  // 電話番号の正規化
  phoneNumber: (input: string): string => {
    return input.replace(/[^\d+\-]/g, '');
  },

  // メールアドレスの正規化
  email: (input: string): string => {
    return input.toLowerCase().trim();
  }
};

// バリデーション関数
export const validate = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phoneNumber: (phone: string): boolean => {
    const phoneRegex = /^[\d+\-\s()]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  },

  required: (value: string | number | boolean): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  isNumber: (value: string): boolean => {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value));
  },

  inRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  }
};

// フォーム検証のヘルパー
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateForm = {
  loginForm: (email: string, password: string): ValidationResult => {
    const errors: string[] = [];

    if (!validate.required(email)) {
      errors.push('メールアドレスは必須です');
    } else if (!validate.email(email)) {
      errors.push('有効なメールアドレスを入力してください');
    }

    if (!validate.required(password)) {
      errors.push('パスワードは必須です');
    } else if (!validate.minLength(password, 6)) {
      errors.push('パスワードは6文字以上で入力してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  systemSettings: (settings: any): ValidationResult => {
    const errors: string[] = [];

    if (settings.maxUsersPerDay !== undefined) {
      if (!validate.isNumber(settings.maxUsersPerDay.toString())) {
        errors.push('最大ユーザー数は数値で入力してください');
      } else if (!validate.inRange(settings.maxUsersPerDay, 1, 100000)) {
        errors.push('最大ユーザー数は1-100000の範囲で入力してください');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};