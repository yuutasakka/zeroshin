import { describe, it, expect } from 'vitest';
import {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateAge,
  validateAmount,
  sanitizeInput,
  sanitizeHTML,
  validateURL,
  validateUsername,
  validateJapanesePhoneNumber,
  validatePostalCode,
  checkPasswordStrength,
  detectSQLInjection,
  detectXSS,
  validateFormData,
} from './inputValidation';

describe('Phone Number Validation', () => {
  it('validates Japanese phone numbers', () => {
    // 有効な番号
    expect(validatePhoneNumber('09012345678')).toBe(true);
    expect(validatePhoneNumber('080-1234-5678')).toBe(true);
    expect(validatePhoneNumber('070 1234 5678')).toBe(true);
    expect(validatePhoneNumber('03-1234-5678')).toBe(true);
    expect(validatePhoneNumber('0312345678')).toBe(true);
    
    // 無効な番号
    expect(validatePhoneNumber('123')).toBe(false);
    expect(validatePhoneNumber('090123456789')).toBe(false); // 長すぎる
    expect(validatePhoneNumber('1234567890')).toBe(false); // 0で始まらない
    expect(validatePhoneNumber('')).toBe(false);
  });

  it('validates international format', () => {
    expect(validatePhoneNumber('+81-90-1234-5678')).toBe(true);
    expect(validatePhoneNumber('+819012345678')).toBe(true);
  });
});

describe('Email Validation', () => {
  it('validates email addresses', () => {
    // 有効なメール
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@example.co.jp')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
    expect(validateEmail('test_123@sub.example.com')).toBe(true);
    
    // 無効なメール
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user @example.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('Password Validation', () => {
  it('validates password requirements', () => {
    // 有効なパスワード
    expect(validatePassword('Test@123')).toBe(true);
    expect(validatePassword('SecureP@ss123')).toBe(true);
    expect(validatePassword('MyP@ssw0rd!')).toBe(true);
    
    // 無効なパスワード
    expect(validatePassword('short')).toBe(false); // 短すぎる
    expect(validatePassword('alllowercase')).toBe(false); // 大文字なし
    expect(validatePassword('ALLUPPERCASE')).toBe(false); // 小文字なし
    expect(validatePassword('NoNumbers!')).toBe(false); // 数字なし
    expect(validatePassword('NoSpecial123')).toBe(false); // 特殊文字なし
    expect(validatePassword('')).toBe(false);
  });
});

describe('Password Strength Check', () => {
  it('calculates password strength', () => {
    expect(checkPasswordStrength('weak')).toBe('weak');
    expect(checkPasswordStrength('Medium123')).toBe('medium');
    expect(checkPasswordStrength('Str0ng!Pass')).toBe('strong');
    expect(checkPasswordStrength('V3ry$tr0ng!P@ssw0rd')).toBe('very-strong');
  });
});

describe('Age Validation', () => {
  it('validates age ranges', () => {
    expect(validateAge(20)).toBe(true);
    expect(validateAge(65)).toBe(true);
    expect(validateAge(17)).toBe(false); // 未成年
    expect(validateAge(101)).toBe(false); // 上限超過
    expect(validateAge(0)).toBe(false);
    expect(validateAge(-5)).toBe(false);
  });
});

describe('Amount Validation', () => {
  it('validates investment amounts', () => {
    expect(validateAmount(10000)).toBe(true);
    expect(validateAmount(5000000)).toBe(true);
    expect(validateAmount(999)).toBe(false); // 最小値未満
    expect(validateAmount(10000001)).toBe(false); // 最大値超過
    expect(validateAmount(0)).toBe(false);
    expect(validateAmount(-1000)).toBe(false);
  });
});

describe('Input Sanitization', () => {
  it('sanitizes general input', () => {
    expect(sanitizeInput('  Hello World  ')).toBe('Hello World');
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    expect(sanitizeInput('Test & <tag>')).toBe('Test &amp; &lt;tag&gt;');
    expect(sanitizeInput('')).toBe('');
  });

  it('sanitizes HTML content', () => {
    // 安全なHTML
    expect(sanitizeHTML('<p>Hello <strong>World</strong></p>'))
      .toContain('<p>Hello <strong>World</strong></p>');
    
    // 危険なスクリプト
    expect(sanitizeHTML('<script>alert("xss")</script>'))
      .not.toContain('<script>');
    
    // イベントハンドラ
    expect(sanitizeHTML('<div onclick="alert()">Click</div>'))
      .not.toContain('onclick');
    
    // 危険なタグ
    expect(sanitizeHTML('<iframe src="evil.com"></iframe>'))
      .not.toContain('<iframe');
  });
});

describe('URL Validation', () => {
  it('validates URLs', () => {
    // 有効なURL
    expect(validateURL('https://example.com')).toBe(true);
    expect(validateURL('http://sub.example.com/path')).toBe(true);
    expect(validateURL('https://example.com:8080')).toBe(true);
    expect(validateURL('https://example.com/path?query=value')).toBe(true);
    
    // 無効なURL
    expect(validateURL('javascript:alert()')).toBe(false);
    expect(validateURL('data:text/html,<script>alert()</script>')).toBe(false);
    expect(validateURL('not-a-url')).toBe(false);
    expect(validateURL('')).toBe(false);
  });
});

describe('Username Validation', () => {
  it('validates usernames', () => {
    // 有効なユーザー名
    expect(validateUsername('user123')).toBe(true);
    expect(validateUsername('test_user')).toBe(true);
    expect(validateUsername('user-name')).toBe(true);
    
    // 無効なユーザー名
    expect(validateUsername('ab')).toBe(false); // 短すぎる
    expect(validateUsername('verylongusernamethatexceedslimit')).toBe(false);
    expect(validateUsername('user@name')).toBe(false); // 特殊文字
    expect(validateUsername('user name')).toBe(false); // スペース
    expect(validateUsername('')).toBe(false);
  });
});

describe('Japanese Phone Number Validation', () => {
  it('validates Japanese mobile numbers', () => {
    expect(validateJapanesePhoneNumber('090-1234-5678')).toBe(true);
    expect(validateJapanesePhoneNumber('080-1234-5678')).toBe(true);
    expect(validateJapanesePhoneNumber('070-1234-5678')).toBe(true);
    expect(validateJapanesePhoneNumber('09012345678')).toBe(true);
  });

  it('validates Japanese landline numbers', () => {
    expect(validateJapanesePhoneNumber('03-1234-5678')).toBe(true);
    expect(validateJapanesePhoneNumber('06-1234-5678')).toBe(true);
    expect(validateJapanesePhoneNumber('0312345678')).toBe(true);
  });
});

describe('Postal Code Validation', () => {
  it('validates Japanese postal codes', () => {
    expect(validatePostalCode('123-4567')).toBe(true);
    expect(validatePostalCode('1234567')).toBe(true);
    expect(validatePostalCode('〒123-4567')).toBe(true);
    
    expect(validatePostalCode('123-456')).toBe(false);
    expect(validatePostalCode('12345678')).toBe(false);
    expect(validatePostalCode('')).toBe(false);
  });
});

describe('Security Detection', () => {
  it('detects SQL injection attempts', () => {
    expect(detectSQLInjection("'; DROP TABLE users; --")).toBe(true);
    expect(detectSQLInjection("1' OR '1'='1")).toBe(true);
    expect(detectSQLInjection("admin'--")).toBe(true);
    expect(detectSQLInjection("UNION SELECT * FROM users")).toBe(true);
    
    expect(detectSQLInjection("normal input")).toBe(false);
    expect(detectSQLInjection("user's name")).toBe(false); // 正当なアポストロフィ
  });

  it('detects XSS attempts', () => {
    expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
    expect(detectXSS('<img src=x onerror=alert(1)>')).toBe(true);
    expect(detectXSS('javascript:alert()')).toBe(true);
    expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
    
    expect(detectXSS('normal text')).toBe(false);
    expect(detectXSS('<p>paragraph</p>')).toBe(false); // 安全なHTML
  });
});

describe('Form Data Validation', () => {
  it('validates complete form data', () => {
    const validData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '09012345678',
      age: '30',
      amount: '50000',
    };
    
    const result = validateFormData(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns errors for invalid data', () => {
    const invalidData = {
      name: '',
      email: 'invalid-email',
      phone: '123',
      age: '17',
      amount: '500',
    };
    
    const result = validateFormData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('name');
    expect(result.errors).toHaveProperty('email');
    expect(result.errors).toHaveProperty('phone');
    expect(result.errors).toHaveProperty('age');
    expect(result.errors).toHaveProperty('amount');
  });
});