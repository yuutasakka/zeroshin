#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 新しいセキュリティキーを生成します...\n');

// 暗号化キーの生成（32バイト = 256ビット）
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

// JWT秘密鍵の生成（32バイト、base64エンコード）
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET=' + jwtSecret);

// セッション秘密鍵の生成（32バイト、base64エンコード）
const sessionSecret = crypto.randomBytes(32).toString('base64');
console.log('SESSION_SECRET=' + sessionSecret);

// CSRF秘密鍵の生成（32バイト、base64エンコード）
const csrfSecret = crypto.randomBytes(32).toString('base64');
console.log('CSRF_SECRET=' + csrfSecret);

console.log('\n⚠️  重要な注意事項:');
console.log('1. これらの値をVercelの環境変数に設定してください');
console.log('2. 絶対にコードにハードコーディングしないでください');
console.log('3. .envファイルに保存する場合は、gitignoreされていることを確認してください');
console.log('\n📝 Vercelでの設定方法:');
console.log('vercel env add ENCRYPTION_KEY production');
console.log('vercel env add JWT_SECRET production');
console.log('vercel env add SESSION_SECRET production');
console.log('vercel env add CSRF_SECRET production');
console.log('\n✅ Twilioの認証情報も必ずローテーションしてください:');
console.log('1. Twilioコンソールにログイン');
console.log('2. Account > API keys & tokensで新しい認証トークンを生成');
console.log('3. Vercelに新しい値を設定:');
console.log('   vercel env add TWILIO_ACCOUNT_SID production');
console.log('   vercel env add TWILIO_AUTH_TOKEN production');
console.log('   vercel env add TWILIO_PHONE_NUMBER production');