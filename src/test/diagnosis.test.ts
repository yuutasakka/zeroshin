import { describe, test, expect, beforeEach } from 'vitest'
import {
  selectAge,
  selectExperience,
  getSelectedAge,
  getSelectedExperience,
  resetDiagnosisData,
  isDiagnosisComplete,
  selectPurpose,
  selectAmount,
  selectTiming
} from './utils/diagnosisTestUtils'
import {
  attemptOTPSend,
  resetOTPAttempts,
  generateCSRFToken,
  validateCSRFToken,
  checkIPRestriction,
  resetIPAttempts
} from './utils/smsTestUtils'

describe('診断機能テスト', () => {
  beforeEach(() => {
    resetDiagnosisData()
    resetOTPAttempts()
    resetIPAttempts()
  })

  describe('年代選択テスト', () => {
    test('年代選択が正しく動作する', () => {
      // 20代を選択
      selectAge('20s')
      // 選択された値が正しいか確認
      expect(getSelectedAge()).toBe('20s')
    })

    test('30代選択が正しく動作する', () => {
      selectAge('30s')
      expect(getSelectedAge()).toBe('30s')
    })

    test('40代選択が正しく動作する', () => {
      selectAge('40s')
      expect(getSelectedAge()).toBe('40s')
    })

    test('50代選択が正しく動作する', () => {
      selectAge('50s')
      expect(getSelectedAge()).toBe('50s')
    })

    test('60代以上選択が正しく動作する', () => {
      selectAge('60s_plus')
      expect(getSelectedAge()).toBe('60s_plus')
    })
  })

  describe('投資経験選択テスト', () => {
    test('投資経験選択が正しく動作する', () => {
      selectExperience('beginner')
      expect(getSelectedExperience()).toBe('beginner')
    })

    test('経験者選択が正しく動作する', () => {
      selectExperience('experienced')
      expect(getSelectedExperience()).toBe('experienced')
    })

    test('上級者選択が正しく動作する', () => {
      selectExperience('expert')
      expect(getSelectedExperience()).toBe('expert')
    })
  })

  describe('診断フロー完了テスト', () => {
    test('すべての項目を選択すると完了状態になる', () => {
      selectAge('30s')
      selectExperience('beginner')
      selectPurpose('retirement')
      selectAmount('1000000')
      selectTiming('immediately')

      expect(isDiagnosisComplete()).toBe(true)
    })

    test('一つでも項目が未選択だと未完了状態になる', () => {
      selectAge('30s')
      selectExperience('beginner')
      selectPurpose('retirement')
      // amount と timing を選択しない

      expect(isDiagnosisComplete()).toBe(false)
    })
  })

  describe('レート制限テスト', () => {
    test('1時間3回超えるとOTP送信失敗', async () => {
      const phoneNumber = '09012345678'
      
      // 1回目〜3回目は成功
      expect(attemptOTPSend(phoneNumber).success).toBe(true)
      expect(attemptOTPSend(phoneNumber).success).toBe(true)
      expect(attemptOTPSend(phoneNumber).success).toBe(true)
      
      // 4回目は失敗
      const result = attemptOTPSend(phoneNumber)
      expect(result.success).toBe(false)
      expect(result.message).toBe('1時間に3回を超える送信は制限されます')
    })

    test('異なる電話番号は独立してカウントされる', () => {
      const phone1 = '09012345678'
      const phone2 = '08087654321'
      
      // phone1で3回送信
      expect(attemptOTPSend(phone1).success).toBe(true)
      expect(attemptOTPSend(phone1).success).toBe(true)
      expect(attemptOTPSend(phone1).success).toBe(true)
      
      // phone2は影響を受けない
      expect(attemptOTPSend(phone2).success).toBe(true)
      
      // phone1の4回目は失敗
      expect(attemptOTPSend(phone1).success).toBe(false)
      
      // phone2は引き続き成功
      expect(attemptOTPSend(phone2).success).toBe(true)
    })
  })

  describe('CSRF保護テスト', () => {
    test('CSRFトークンなしPOSTは403相当の失敗', async () => {
      const validToken = generateCSRFToken()
      const invalidToken = 'invalid_token'
      
      // 正しいトークンは成功
      expect(validateCSRFToken(validToken, validToken)).toBe(true)
      
      // 間違ったトークンは失敗
      expect(validateCSRFToken(invalidToken, validToken)).toBe(false)
      
      // トークンなし（空文字）は失敗
      expect(validateCSRFToken('', validToken)).toBe(false)
    })

    test('CSRFトークンが正しく生成される', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      
      // 32文字のトークンが生成される
      expect(token1).toHaveLength(32)
      expect(token2).toHaveLength(32)
      
      // 異なるトークンが生成される
      expect(token1).not.toBe(token2)
      
      // 英数字のみで構成される
      expect(token1).toMatch(/^[a-zA-Z0-9]+$/)
      expect(token2).toMatch(/^[a-zA-Z0-9]+$/)
    })
  })

  describe('IPブロックテスト', () => {
    test('failed_count=5でブロック', async () => {
      const ip = '192.168.1.100'
      
      // 1回目〜4回目の失敗
      expect(checkIPRestriction(ip, false).allowed).toBe(true)
      expect(checkIPRestriction(ip, false).allowed).toBe(true)
      expect(checkIPRestriction(ip, false).allowed).toBe(true)
      expect(checkIPRestriction(ip, false).allowed).toBe(true)
      
      // 5回目の失敗でブロック
      const result = checkIPRestriction(ip, false)
      expect(result.allowed).toBe(false)
      expect(result.message).toBe('IPがブロックされました')
    })

    test('成功するとカウントがリセットされる', () => {
      const ip = '192.168.1.101'
      
      // 3回失敗
      expect(checkIPRestriction(ip, false).allowed).toBe(true)
      expect(checkIPRestriction(ip, false).allowed).toBe(true)
      expect(checkIPRestriction(ip, false).allowed).toBe(true)
      
      // 1回成功（カウントリセット）
      expect(checkIPRestriction(ip, true).allowed).toBe(true)
      
      // また失敗してもカウントは1から
      const result = checkIPRestriction(ip, false)
      expect(result.allowed).toBe(true)
      expect(result.message).toBe('失敗回数: 1/5')
    })

    test('異なるIPは独立してカウントされる', () => {
      const ip1 = '192.168.1.100'
      const ip2 = '192.168.1.101'
      
      // ip1で4回失敗
      expect(checkIPRestriction(ip1, false).allowed).toBe(true)
      expect(checkIPRestriction(ip1, false).allowed).toBe(true)
      expect(checkIPRestriction(ip1, false).allowed).toBe(true)
      expect(checkIPRestriction(ip1, false).allowed).toBe(true)
      
      // ip2は影響を受けない
      expect(checkIPRestriction(ip2, false).allowed).toBe(true)
      
      // ip1の5回目でブロック
      expect(checkIPRestriction(ip1, false).allowed).toBe(false)
      
      // ip2は引き続き正常
      expect(checkIPRestriction(ip2, false).allowed).toBe(true)
    })
  })
}) 