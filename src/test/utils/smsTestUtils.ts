// SMS認証関連のユーティリティ関数

// 認証コード生成
export const generateVerificationCode = (): string => {
  // 6桁の数字を生成
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code
}

// 認証コード検証
export const verifyCode = (inputCode: string, expectedCode: string): boolean => {
  if (!inputCode || !expectedCode) return false;
  return inputCode === expectedCode;
}

// 電話番号の正規化（ハイフンを除去）
export const normalizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/[-\s\(\)]/g, '')
}

// 電話番号の検証
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const normalized = normalizePhoneNumber(phoneNumber)
  // 日本の電話番号形式をチェック（080、090、070で始まる11桁）
  const phoneRegex = /^(070|080|090)\d{8}$/
  return phoneRegex.test(normalized)
}

// OTP試行回数の管理
interface OTPAttempt {
  phoneNumber: string
  attempts: number
  lastAttempt: Date
  isBlocked: boolean
}

let otpAttempts: Map<string, OTPAttempt> = new Map()

// OTP送信試行
export const attemptOTPSend = (phoneNumber: string): { success: boolean; message: string } => {
  const normalized = normalizePhoneNumber(phoneNumber)
  const now = new Date()
  const oneHour = 60 * 60 * 1000 // 1時間（ミリ秒）
  
  let attempt = otpAttempts.get(normalized)
  
  if (!attempt) {
    // 初回試行
    attempt = {
      phoneNumber: normalized,
      attempts: 1,
      lastAttempt: now,
      isBlocked: false
    }
    otpAttempts.set(normalized, attempt)
    return { success: true, message: 'OTP送信成功' }
  }
  
  // ブロック状態をチェック
  if (attempt.isBlocked) {
    // 1時間経過したかチェック
    if (now.getTime() - attempt.lastAttempt.getTime() >= oneHour) {
      // ブロック解除
      attempt.attempts = 1
      attempt.isBlocked = false
      attempt.lastAttempt = now
      return { success: true, message: 'OTP送信成功（ブロック解除）' }
    } else {
      return { success: false, message: '送信制限中です' }
    }
  }
  
  // 1時間以内の試行回数をチェック
  if (now.getTime() - attempt.lastAttempt.getTime() < oneHour) {
    attempt.attempts++
    if (attempt.attempts > 3) {
      attempt.isBlocked = true
      return { success: false, message: '1時間に3回を超える送信は制限されます' }
    }
  } else {
    // 1時間経過したのでリセット
    attempt.attempts = 1
  }
  
  attempt.lastAttempt = now
  return { success: true, message: 'OTP送信成功' }
}

// CSRF トークン生成
export const generateCSRFToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// CSRF トークン検証
export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken
}

// IP制限の管理
interface IPAttempt {
  ip: string
  failedCount: number
  lastFailure: Date
  isBlocked: boolean
}

let ipAttempts: Map<string, IPAttempt> = new Map()

// IP制限チェック
export const checkIPRestriction = (ip: string, isSuccess: boolean): { allowed: boolean; message: string } => {
  let attempt = ipAttempts.get(ip)
  
  if (!attempt) {
    attempt = {
      ip,
      failedCount: 0,
      lastFailure: new Date(),
      isBlocked: false
    }
    ipAttempts.set(ip, attempt)
  }
  
  if (isSuccess) {
    // 成功時はカウントをリセット
    attempt.failedCount = 0
    attempt.isBlocked = false
    return { allowed: true, message: '正常' }
  } else {
    // 失敗時はカウントを増加
    attempt.failedCount++
    attempt.lastFailure = new Date()
    
    if (attempt.failedCount >= 5) {
      attempt.isBlocked = true
      return { allowed: false, message: 'IPがブロックされました' }
    }
    
    return { allowed: true, message: `失敗回数: ${attempt.failedCount}/5` }
  }
}

// テスト用のリセット関数
export const resetOTPAttempts = (): void => {
  otpAttempts.clear()
}

export const resetIPAttempts = (): void => {
  ipAttempts.clear()
} 