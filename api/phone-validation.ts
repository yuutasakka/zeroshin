import type { VercelRequest, VercelResponse } from '@vercel/node';
import { phoneNumberValidator } from '../server/services/phoneNumberValidation';

/**
 * 電話番号検証API
 * POST /api/phone-validation
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ 
        error: 'Phone number is required',
        details: 'Please provide a valid phone number string'
      });
    }

    // 電話番号検証を実行
    const validationResult = await phoneNumberValidator.validatePhoneNumber(phoneNumber);
    
    // SMS送信可能性をチェック
    const smsCapability = await phoneNumberValidator.canSendSMS(phoneNumber);

    // レスポンス用にデータを整形
    const response = {
      phoneNumber: phoneNumber,
      validation: {
        isValid: validationResult.isValid,
        normalizedE164: validationResult.normalizedE164,
        nationalFormat: validationResult.nationalFormat,
        countryCode: validationResult.countryCode,
        isJapanese: validationResult.isJapanese
      },
      carrier: {
        name: validationResult.carrier,
        lineType: validationResult.lineType
      },
      sms: {
        canSend: smsCapability.canSend,
        reason: smsCapability.reason,
        canReceiveSMS: validationResult.canReceiveSMS
      },
      risk: {
        score: validationResult.riskScore,
        level: validationResult.riskScore > 70 ? 'high' : 
               validationResult.riskScore > 40 ? 'medium' : 'low'
      },
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      timestamp: new Date().toISOString()
    };

    // ログ出力（機密情報をマスク）
    console.log('Phone validation completed:', {
      phone: phoneNumber.substring(0, 3) + '****',
      isValid: validationResult.isValid,
      lineType: validationResult.lineType,
      canSendSMS: smsCapability.canSend,
      riskScore: validationResult.riskScore,
      carrier: validationResult.carrier,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Phone validation API error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Phone validation service error',
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}