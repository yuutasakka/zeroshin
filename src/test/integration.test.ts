import { describe, test, expect, beforeEach } from 'vitest'
import {
  startDiagnosis,
  apiSmsSend,
  getMockedOtp,
  apiSmsVerify,
  fetchDiagnosisSession,
  generateTestCSRFToken,
  resetIntegrationTestState
} from './utils/integrationTestUtils'

describe('診断フロー統合テスト', () => {
  beforeEach(() => {
    resetIntegrationTestState()
  })

  test('診断→OTP送信→OTP認証成功', async () => {
    const token = generateTestCSRFToken()
    const { sessionId } = await startDiagnosis()
    // SMS送信
    await apiSmsSend('09012345678', { 'X-CSRF-Token': token })
    // モックOTP取得
    const otp = getMockedOtp('09012345678')
    // OTP認証
    const res = await apiSmsVerify('09012345678', otp, { 'X-CSRF-Token': token })
    expect(res.verified).toBe(true)
    // セッション検証
    const record = await fetchDiagnosisSession('09012345678')
    expect(record.prevent_redo).toBe(true)
    expect(record.verified).toBe(true)
    expect(record.sessionId).toBe(sessionId)
  })
}) 