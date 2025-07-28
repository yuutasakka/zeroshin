import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export interface OTPData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// 暗号化用の秘密鍵（環境変数から取得、なければデフォulト値）
const ENCRYPTION_KEY = process.env.OTP_ENCRYPTION_KEY || 'default-otp-encryption-key-32bytes';

/**
 * データを暗号化（AES-256-CBC）
 */
function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt OTP data');
  }
}

/**
 * データを復号化
 */
function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt OTP data');
  }
}

/**
 * OTPデータをクッキーに保存
 */
export function storeOTPInCookie(
  res: VercelResponse,
  phoneNumber: string,
  otpData: OTPData
): void {
  try {
    const dataToStore = {
      [phoneNumber]: otpData
    };
    
    const encrypted = encrypt(JSON.stringify(dataToStore));
    
    // セキュアクッキーとして保存（5分間の有効期限）
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=300`;
    
    res.setHeader('Set-Cookie', `_otp_data=${encrypted}; ${cookieOptions}`);
    
  } catch (error) {
    console.error('Failed to store OTP in cookie:', error);
    throw new Error('Failed to store OTP data');
  }
}

/**
 * クッキーからOTPデータを取得
 */
export function getOTPFromCookie(
  req: VercelRequest,
  phoneNumber: string
): OTPData | null {
  try {
    const otpCookie = req.cookies?._otp_data;
    if (!otpCookie) {
      return null;
    }
    
    const decrypted = decrypt(otpCookie);
    const data = JSON.parse(decrypted);
    
    return data[phoneNumber] || null;
    
  } catch (error) {
    console.error('Failed to retrieve OTP from cookie:', error);
    return null;
  }
}

/**
 * OTPデータをクッキーから削除
 */
export function removeOTPFromCookie(
  res: VercelResponse,
  req: VercelRequest,
  phoneNumber: string
): void {
  try {
    const otpCookie = req.cookies?._otp_data;
    if (!otpCookie) {
      return;
    }
    
    const decrypted = decrypt(otpCookie);
    const data = JSON.parse(decrypted);
    
    // 該当の電話番号のデータを削除
    delete data[phoneNumber];
    
    if (Object.keys(data).length === 0) {
      // データが空になったらクッキーを削除
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=0`;
      res.setHeader('Set-Cookie', `_otp_data=; ${cookieOptions}`);
    } else {
      // 他のデータが残っている場合は更新
      const encrypted = encrypt(JSON.stringify(data));
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=300`;
      res.setHeader('Set-Cookie', `_otp_data=${encrypted}; ${cookieOptions}`);
    }
    
  } catch (error) {
    console.error('Failed to remove OTP from cookie:', error);
  }
}

/**
 * OTPデータを更新（試行回数の増加など）
 */
export function updateOTPInCookie(
  res: VercelResponse,
  req: VercelRequest,
  phoneNumber: string,
  otpData: OTPData
): void {
  try {
    const otpCookie = req.cookies?._otp_data;
    if (!otpCookie) {
      throw new Error('OTP cookie not found');
    }
    
    const decrypted = decrypt(otpCookie);
    const data = JSON.parse(decrypted);
    
    // データを更新
    data[phoneNumber] = otpData;
    
    const encrypted = encrypt(JSON.stringify(data));
    
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=300`;
    
    res.setHeader('Set-Cookie', `_otp_data=${encrypted}; ${cookieOptions}`);
    
  } catch (error) {
    console.error('Failed to update OTP in cookie:', error);
    throw new Error('Failed to update OTP data');
  }
}