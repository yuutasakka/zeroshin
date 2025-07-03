import { describe, test, expect, beforeEach } from 'vitest'
import {
  generateVerificationCode,
  verifyCode,
  normalizePhoneNumber,
  validatePhoneNumber,
  attemptOTPSend,
  resetOTPAttempts
} from './utils/smsTestUtils'

describe('SMS認証テスト', () => {
  beforeEach(() => {
    resetOTPAttempts()
  })

  describe('認証コード生成テスト', () => {
    test('認証コードが6桁の数字で生成される', () => {
      const code = generateVerificationCode()
      expect(code).toMatch(/^\d{6}$/)
    })

    test('複数回生成で異なるコードが生成される（高確率）', () => {
      const codes = new Set()
      
      // 100回生成して重複をチェック
      for (let i = 0; i < 100; i++) {
        const code = generateVerificationCode()
        expect(code).toMatch(/^\d{6}$/)
        codes.add(code)
      }
      
      // 90%以上は異なるコードであることを期待（統計的に問題ない範囲）
      expect(codes.size).toBeGreaterThan(90)
    })

    test('生成されるコードは100000以上999999以下', () => {
      for (let i = 0; i < 10; i++) {
        const code = generateVerificationCode()
        const numCode = parseInt(code, 10)
        expect(numCode).toBeGreaterThanOrEqual(100000)
        expect(numCode).toBeLessThanOrEqual(999999)
      }
    })
  })

  describe('認証コード検証テスト', () => {
    test('正しい認証コードで認証成功', () => {
      const result = verifyCode('123456', '123456')
      expect(result).toBe(true)
    })

    test('間違った認証コードで認証失敗', () => {
      const result = verifyCode('123456', '654321')
      expect(result).toBe(false)
    })

    test('文字列の長さが違う場合は認証失敗', () => {
      expect(verifyCode('12345', '123456')).toBe(false)
      expect(verifyCode('1234567', '123456')).toBe(false)
    })

    test('空文字の場合は認証失敗', () => {
      expect(verifyCode('', '123456')).toBe(false)
      expect(verifyCode('123456', '')).toBe(false)
      expect(verifyCode('', '')).toBe(false)
    })

    test('数字以外の文字が含まれる場合の動作', () => {
      expect(verifyCode('12345a', '123456')).toBe(false)
      expect(verifyCode('123456', '12345a')).toBe(false)
      expect(verifyCode('abcdef', '123456')).toBe(false)
    })
  })

  describe('電話番号の正規化テスト', () => {
    test('ハイフンが正しく除去される', () => {
      expect(normalizePhoneNumber('090-1234-5678')).toBe('09012345678')
      expect(normalizePhoneNumber('080-1234-5678')).toBe('08012345678')
      expect(normalizePhoneNumber('070-1234-5678')).toBe('07012345678')
    })

    test('スペースが正しく除去される', () => {
      expect(normalizePhoneNumber('090 1234 5678')).toBe('09012345678')
      expect(normalizePhoneNumber('080 1234 5678')).toBe('08012345678')
    })

    test('括弧が正しく除去される', () => {
      expect(normalizePhoneNumber('090(1234)5678')).toBe('09012345678')
      expect(normalizePhoneNumber('(090)1234-5678')).toBe('09012345678')
    })

    test('複数の記号が混在していても正しく除去される', () => {
      expect(normalizePhoneNumber('090-1234 (5678)')).toBe('09012345678')
      expect(normalizePhoneNumber('(090) 1234-5678')).toBe('09012345678')
    })

    test('既に正規化済みの番号はそのまま', () => {
      expect(normalizePhoneNumber('09012345678')).toBe('09012345678')
    })
  })

  describe('電話番号バリデーションテスト', () => {
    test('正しい電話番号形式は検証に合格', () => {
      expect(validatePhoneNumber('09012345678')).toBe(true)
      expect(validatePhoneNumber('08012345678')).toBe(true)
      expect(validatePhoneNumber('07012345678')).toBe(true)
    })

    test('ハイフン付きでも検証に合格', () => {
      expect(validatePhoneNumber('090-1234-5678')).toBe(true)
      expect(validatePhoneNumber('080-1234-5678')).toBe(true)
      expect(validatePhoneNumber('070-1234-5678')).toBe(true)
    })

    test('無効なプレフィックスは検証に失敗', () => {
      expect(validatePhoneNumber('05012345678')).toBe(false)  // 050は対象外
      expect(validatePhoneNumber('03012345678')).toBe(false)  // 固定電話
      expect(validatePhoneNumber('09912345678')).toBe(false)  // 099は無効
    })

    test('桁数が間違っている場合は検証に失敗', () => {
      expect(validatePhoneNumber('0901234567')).toBe(false)   // 10桁
      expect(validatePhoneNumber('090123456789')).toBe(false) // 12桁
      expect(validatePhoneNumber('09012345')).toBe(false)     // 8桁
    })

    test('数字以外の文字が含まれる場合は検証に失敗', () => {
      expect(validatePhoneNumber('090abcd5678')).toBe(false)
      expect(validatePhoneNumber('090-abcd-5678')).toBe(false)
      expect(validatePhoneNumber('あいう')).toBe(false)
    })

    test('空文字や不正な形式は検証に失敗', () => {
      expect(validatePhoneNumber('')).toBe(false)
      expect(validatePhoneNumber('090')).toBe(false)
      expect(validatePhoneNumber('090-')).toBe(false)
    })
  })

  describe('OTP送信制限テスト', () => {
    test('初回送信は成功する', () => {
      const result = attemptOTPSend('09012345678')
      expect(result.success).toBe(true)
      expect(result.message).toBe('OTP送信成功')
    })

    test('同じ番号で連続3回まで送信可能', () => {
      const phoneNumber = '09012345678'
      
      expect(attemptOTPSend(phoneNumber).success).toBe(true)
      expect(attemptOTPSend(phoneNumber).success).toBe(true)
      expect(attemptOTPSend(phoneNumber).success).toBe(true)
    })

    test('同じ番号で4回目の送信は失敗', () => {
      const phoneNumber = '09012345678'
      
      // 3回送信
      attemptOTPSend(phoneNumber)
      attemptOTPSend(phoneNumber)
      attemptOTPSend(phoneNumber)
      
      // 4回目は失敗
      const result = attemptOTPSend(phoneNumber)
      expect(result.success).toBe(false)
      expect(result.message).toBe('1時間に3回を超える送信は制限されます')
    })

    test('制限状態で再度送信すると制限メッセージが返る', () => {
      const phoneNumber = '09012345678'
      
      // 制限まで送信
      attemptOTPSend(phoneNumber)
      attemptOTPSend(phoneNumber)
      attemptOTPSend(phoneNumber)
      attemptOTPSend(phoneNumber) // 制限に到達
      
      // さらに送信を試みる
      const result = attemptOTPSend(phoneNumber)
      expect(result.success).toBe(false)
      expect(result.message).toBe('送信制限中です')
    })

    test('正規化された電話番号で制限が共有される', () => {
      // ハイフンありとなしで同じ番号として扱われる
      expect(attemptOTPSend('090-1234-5678').success).toBe(true)
      expect(attemptOTPSend('09012345678').success).toBe(true)
      expect(attemptOTPSend('090 1234 5678').success).toBe(true)
      
      // 4回目（正規化されて同じ番号）は失敗
      const result = attemptOTPSend('090(1234)5678')
      expect(result.success).toBe(false)
    })
  })
}) 