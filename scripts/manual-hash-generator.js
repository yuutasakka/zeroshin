import bcrypt from 'bcrypt';
import crypto from 'crypto';

// 安全なパスワード生成
function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // 各要件を満たすように最低1文字ずつ確保
  password += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // 大文字
  password += String.fromCharCode(97 + Math.floor(Math.random() * 26)); // 小文字
  password += String.fromCharCode(48 + Math.floor(Math.random() * 10)); // 数字
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // 特殊文字
  
  // 残りの文字をランダムに生成
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // シャッフル
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// バックアップコード生成
function generateBackupCode() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `MT-PROD-${timestamp}-${random}`;
}

async function generateCredentials() {
  console.log('🔐 AI ConnectX 本番環境認証情報生成');
  console.log('='.repeat(60));
  
  // 認証情報生成
  const username = 'admin0630';
  const phoneNumber = '+81-90-1234-5678'; // 管理者の実際の電話番号
  const password = generateSecurePassword(16);
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const backupCode = generateBackupCode();
  
  console.log(`
📋 本番環境管理者情報:
${'─'.repeat(40)}
ユーザー名: ${username}
電話番号: ${phoneNumber}
パスワード: ${password}
bcryptハッシュ: ${passwordHash}
バックアップコード: ${backupCode}

🔧 マイグレーションSQL更新:
${'─'.repeat(40)}
1. supabase/migrations/007_update_production_admin_credentials.sql を開く
2. 以下の値を置き換えてください:

   'prod_admin_user' → '${username}'
   '$2b$12$REPLACE_WITH_ACTUAL_BCRYPT_HASH' → '${passwordHash}'
   '+81XX-XXXX-XXXX' → '${phoneNumber}'

⚠️  重要な注意事項:
${'─'.repeat(40)}
• パスワードとバックアップコードを安全な場所に保存してください
• 電話番号を実際の管理者番号に変更してください
• マイグレーション実行後、デフォルト管理者は無効化されます
`);
}

generateCredentials().catch(console.error); 