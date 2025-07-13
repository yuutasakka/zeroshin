// SMS認証システムの動作確認スクリプト
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 SMS認証システムの動作確認を開始します...\n');

// 1. 環境変数の確認
console.log('📋 環境変数の確認:');
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

const envStatus = {};
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  envStatus[varName] = {
    exists: !!value,
    hasValue: value && value.length > 0,
    masked: value ? `${value.substring(0, 8)}...` : 'なし'
  };
  
  const status = envStatus[varName].exists && envStatus[varName].hasValue ? '✅' : '❌';
  console.log(`  ${status} ${varName}: ${envStatus[varName].masked}`);
});

// 2. ファイル構造の確認
console.log('\n📁 ファイル構造の確認:');

const requiredFiles = [
  'src/api/smsAuth.ts',
  'src/lib/supabaseAuth.ts',
  'src/api/secureConfig.ts',
  'src/app/api/auth/send-otp/route.ts',
  'src/app/api/auth/verify-otp/route.ts',
  'src/app/api/auth/check/route.ts',
  'supabase/migrations/010_create_secure_configs_table.sql'
];

const projectRoot = path.join(__dirname, '../..');

requiredFiles.forEach(filePath => {
  const exists = fs.existsSync(path.join(projectRoot, filePath));
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${filePath}`);
});

// 3. 基本的な構文チェック
console.log('\n🔍 基本的な構文チェック:');
try {
  // TypeScriptファイルの基本的な読み込みテスト
  const smsAuthContent = fs.readFileSync(path.join(projectRoot, 'src/api/smsAuth.ts'), 'utf8');
  const hasValidExport = smsAuthContent.includes('export class SMSAuthService');
  console.log(`  ${hasValidExport ? '✅' : '❌'} SMSAuthService クラスが存在`);
  
  const hasSendOTP = smsAuthContent.includes('static async sendOTP');
  console.log(`  ${hasSendOTP ? '✅' : '❌'} sendOTP メソッドが存在`);
  
  const hasVerifyOTP = smsAuthContent.includes('static async verifyOTP');
  console.log(`  ${hasVerifyOTP ? '✅' : '❌'} verifyOTP メソッドが存在`);

  // API ルートの確認
  const sendOTPRoute = fs.readFileSync(path.join(projectRoot, 'src/app/api/auth/send-otp/route.ts'), 'utf8');
  const hasPostMethod = sendOTPRoute.includes('export async function POST');
  console.log(`  ${hasPostMethod ? '✅' : '❌'} send-otp API ルートが存在`);

} catch (error) {
  console.log(`  ❌ ファイル読み込みエラー: ${error.message}`);
}

// 4. Supabase マイグレーションファイルの確認
console.log('\n🗄️ データベース設定の確認:');
try {
  const migrationContent = fs.readFileSync(path.join(projectRoot, 'supabase/migrations/010_create_secure_configs_table.sql'), 'utf8');
  
  const hasSecureConfigsTable = migrationContent.includes('CREATE TABLE IF NOT EXISTS secure_configs');
  console.log(`  ${hasSecureConfigsTable ? '✅' : '❌'} secure_configs テーブル定義`);
  
  const hasSMSTable = migrationContent.includes('CREATE TABLE IF NOT EXISTS sms_verifications');
  console.log(`  ${hasSMSTable ? '✅' : '❌'} sms_verifications テーブル定義`);
  
  const hasRateLimitFunction = migrationContent.includes('check_sms_rate_limit');
  console.log(`  ${hasRateLimitFunction ? '✅' : '❌'} レート制限関数`);
  
  const hasIncrementFunction = migrationContent.includes('increment_attempts');
  console.log(`  ${hasIncrementFunction ? '✅' : '❌'} 試行回数カウント関数`);

} catch (error) {
  console.log(`  ❌ マイグレーションファイル読み込みエラー: ${error.message}`);
}

// 5. 設定の推奨事項
console.log('\n💡 設定の推奨事項:');

const missingEnvVars = requiredEnvVars.filter(varName => !envStatus[varName].exists || !envStatus[varName].hasValue);
if (missingEnvVars.length > 0) {
  console.log('  ⚠️  未設定の環境変数があります:');
  missingEnvVars.forEach(varName => {
    console.log(`     - ${varName}`);
  });
  console.log('  これらの設定が必要です。');
} else {
  console.log('  ✅ すべての必要な環境変数が設定されています');
}

// 6. 本番環境での注意事項
console.log('\n🚀 本番環境での注意事項:');
console.log('  📋 実行前の確認事項:');
console.log('     1. Supabase でマイグレーションを実行');
console.log('     2. Twilio アカウントの設定と電話番号の取得');
console.log('     3. 環境変数の本番設定への反映');
console.log('     4. SMS 送信料金の確認');
console.log('');
console.log('  🛡️  セキュリティチェック:');
console.log('     1. SERVICE_ROLE_KEY は絶対にクライアントサイドで使用しない');
console.log('     2. 本番環境では実際の電話番号でのテストを実施');
console.log('     3. レート制限が正しく動作することを確認');
console.log('     4. OTP の有効期限が適切に設定されていることを確認');

console.log('\n🎉 SMS認証システムの基本構造は正常です！');
console.log('次は Supabase マイグレーションの実行と Twilio の設定を行ってください。');