#!/usr/bin/env node
// 🔑 本番環境変数生成スクリプト

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🚀 本番環境変数生成スクリプト');
console.log('=====================================');

// セキュリティキーの生成
const generateSecureKey = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateBase64Key = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

// 環境変数の生成
const envVars = {
  // セキュリティ関連
  ENCRYPTION_KEY: generateSecureKey(32), // 64文字
  JWT_SECRET: generateBase64Key(32),
  SESSION_SECRET: generateBase64Key(32),
  CSRF_SECRET: generateBase64Key(32),
  
  // 本番環境フラグ
  PRODUCTION_MODE: 'true',
  NODE_ENV: 'production',
  
  // レート制限設定
  RATE_LIMIT_WINDOW_MS: '900000', // 15分
  RATE_LIMIT_MAX_REQUESTS: '100',
  SMS_RATE_LIMIT_MAX: '3',
  SMS_WINDOW_MINUTES: '60',
  AUTH_RATE_LIMIT_MAX: '10',
  IP_RATE_LIMIT_MAX: '10',
  
  // セキュリティ設定
  ENABLE_SECURITY_HEADERS: 'true',
  ENABLE_RATE_LIMITING: 'true',
  ENABLE_REQUEST_LOGGING: 'true',
  ENABLE_CORS_STRICT: 'true',
  
  // アプリケーション設定
  VITE_APP_TITLE: 'MoneyTicket',
  VITE_APP_VERSION: '1.0.0',
  VITE_APP_DESCRIPTION: '資産運用診断アプリケーション'
};

// 手動設定が必要な変数
const manualVars = {
  // Twilio設定（要手動設定）
  TWILIO_ACCOUNT_SID: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  TWILIO_AUTH_TOKEN: 'your-twilio-auth-token-here',
  TWILIO_PHONE_NUMBER: '+815012345678',
  
  // Supabase設定（要手動設定）
  VITE_SUPABASE_URL: 'https://your-project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'your-supabase-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'your-supabase-service-role-key',
  DATABASE_URL: 'postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres',
  
  // Google Gemini API（要手動設定）
  GEMINI_API_KEY: 'your-gemini-api-key-here'
};

console.log('✅ セキュリティキー生成完了');
console.log('');

// .env.production ファイルの生成
const envContent = [
  '# 🚀 本番環境変数設定',
  '# 自動生成日時: ' + new Date().toISOString(),
  '',
  '# ============================',
  '# 🔑 セキュリティ関連（自動生成）',
  '# ============================',
  ...Object.entries(envVars).map(([key, value]) => `${key}=${value}`),
  '',
  '# ========================================',
  '# 📱 外部サービス設定（要手動設定）',
  '# ========================================',
  ...Object.entries(manualVars).map(([key, value]) => `${key}=${value}`),
  '',
  '# ⚠️ 重要: 上記の外部サービス設定は手動で正しい値に変更してください',
  '# - Twilio: https://console.twilio.com/',
  '# - Supabase: https://app.supabase.com/',
  '# - Google Cloud: https://console.cloud.google.com/',
].join('\n');

// ファイル保存
const envFilePath = path.join(process.cwd(), '.env.production');
fs.writeFileSync(envFilePath, envContent);

console.log('📝 本番環境変数ファイル生成完了:');
console.log(`   ${envFilePath}`);
console.log('');

// Vercel用の設定コマンド生成
const vercelCommands = [
  '# 🔧 Vercel環境変数設定コマンド',
  '# 以下のコマンドをコピーしてVercel CLIで実行:',
  '',
  '# セキュリティキー設定',
  ...Object.entries(envVars)
    .filter(([key]) => ['ENCRYPTION_KEY', 'JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'].includes(key))
    .map(([key, value]) => `vercel env add ${key} production`),
  '',
  '# アプリケーション設定',
  ...Object.entries(envVars)
    .filter(([key]) => !['ENCRYPTION_KEY', 'JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'].includes(key))
    .map(([key, value]) => `vercel env add ${key} production`),
  '',
  '# ⚠️ 外部サービス設定（手動で値を入力）',
  ...Object.keys(manualVars).map(key => `vercel env add ${key} production`),
].join('\n');

const vercelFilePath = path.join(process.cwd(), 'vercel-env-commands.txt');
fs.writeFileSync(vercelFilePath, vercelCommands);

console.log('🔧 Vercel設定コマンド生成完了:');
console.log(`   ${vercelFilePath}`);
console.log('');

// セキュリティレポート
console.log('🔒 生成されたセキュリティキー:');
console.log('=====================================');
Object.entries(envVars)
  .filter(([key]) => ['ENCRYPTION_KEY', 'JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'].includes(key))
  .forEach(([key, value]) => {
    console.log(`${key}: ${value.substring(0, 8)}...${value.substring(value.length - 8)} (${value.length}文字)`);
  });

console.log('');
console.log('📋 次のステップ:');
console.log('=====================================');
console.log('1. .env.production ファイルを確認');
console.log('2. Twilio、Supabase、Gemini APIの設定値を更新');
console.log('3. vercel-env-commands.txt のコマンドを実行');
console.log('4. Vercelダッシュボードで環境変数を確認');
console.log('5. デプロイ前にセキュリティチェックを実行');

console.log('');
console.log('⚠️  重要な注意事項:');
console.log('=====================================');
console.log('- .env.production ファイルをGitにコミットしないでください');
console.log('- 生成されたキーは安全に保管してください');
console.log('- 本番環境でのみ使用してください');
console.log('- 定期的にキーをローテーションしてください');

console.log('');
console.log('✅ 本番環境変数生成完了！');

// セキュリティチェック用のスクリプト生成
const securityCheckScript = `#!/usr/bin/env node
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
  missingVars.forEach(varName => console.error(\`  - \${varName}\`));
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
    console.error(\`❌ \${varName} が短すぎます (最小: \${minLength}文字, 現在: \${value.length}文字)\`);
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
  console.error(\`❌ \${securityIssues}個のセキュリティ問題が発見されました\`);
  process.exit(1);
}
`;

const securityCheckPath = path.join(process.cwd(), 'scripts', 'security-check.js');

// scriptsディレクトリが存在しない場合は作成
const scriptsDir = path.join(process.cwd(), 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

fs.writeFileSync(securityCheckPath, securityCheckScript);
fs.chmodSync(securityCheckPath, 0o755); // 実行可能にする

console.log('');
console.log('🛡️ セキュリティチェックスクリプト生成完了:');
console.log(`   ${securityCheckPath}`);
console.log('   実行: node scripts/security-check.js');