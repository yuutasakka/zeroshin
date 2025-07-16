import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // セキュリティ: 本番環境では詳細情報を隠す
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };

    const debugInfo: any = {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasAccountSid: !!config.accountSid,
      hasAuthToken: !!config.authToken,
      hasPhoneNumber: !!config.phoneNumber,
      timestamp: new Date().toISOString()
    };

    if (!isProduction) {
      // 開発環境では詳細情報を表示
      debugInfo.accountSidPrefix = config.accountSid ? config.accountSid.substring(0, 4) + '...' : 'なし';
      debugInfo.authTokenPrefix = config.authToken ? config.authToken.substring(0, 4) + '...' : 'なし';
      debugInfo.phoneNumber = config.phoneNumber || 'なし';
    }

    res.status(200).json(debugInfo);
  } catch (error) {
    console.error('Debug config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}