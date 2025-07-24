#!/usr/bin/env node
// 🛡️ セキュリティチェックスクリプト

const requiredVars = [
  'ENCRYPTION_KEY',
  'JWT_SECRET', 
  'SESSION_SECRET',
  'CSRF_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 必須環境変数が不足しています:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

// キーの長さチェック
const keyChecks = {
  ENCRYPTION_KEY: 64,
  JWT_SECRET: 32,
  SESSION_SECRET: 32,
  CSRF_SECRET: 32
};

let securityIssues = 0;

Object.entries(keyChecks).forEach(([varName, minLength]) => {
  const value = process.env[varName];
  if (value && value.length < minLength) {
    console.error(`❌ ${varName} が短すぎます (最小: ${minLength}文字, 現在: ${value.length}文字)`);
    securityIssues++;
  }
});

// 本番環境チェック
if (process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ NODE_ENV が production に設定されていません');
}

if (process.env.PRODUCTION_MODE !== 'true') {
  console.warn('⚠️ PRODUCTION_MODE が true に設定されていません');
}

if (securityIssues === 0) {
  console.log('✅ セキュリティチェック完了 - 問題なし');
} else {
  console.error(`❌ ${securityIssues}個のセキュリティ問題が発見されました`);
  process.exit(1);
}
