import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: any = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasTwilioConfig: {
        TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
      },
      hasSupabaseConfig: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    },
    imports: {}
  };

  // Test import paths
  try {
    await import('../src/api/smsAuth');
    results.imports.smsAuth = '✅ Success';
  } catch (error: any) {
    results.imports.smsAuth = `❌ Failed: ${error.message}`;
  }

  try {
    await import('../src/api/securityMiddleware');
    results.imports.securityMiddleware = '✅ Success';
  } catch (error: any) {
    results.imports.securityMiddleware = `❌ Failed: ${error.message}`;
  }

  try {
    await import('../src/utils/productionLogger');
    results.imports.productionLogger = '✅ Success';
  } catch (error: any) {
    results.imports.productionLogger = `❌ Failed: ${error.message}`;
  }

  try {
    const twilioModule = await import('twilio');
    results.imports.twilio = '✅ Success';
    results.twilioModuleKeys = Object.keys(twilioModule);
  } catch (error: any) {
    results.imports.twilio = `❌ Failed: ${error.message}`;
  }

  res.status(200).json(results);
}