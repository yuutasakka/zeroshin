#!/usr/bin/env node

/**
 * 本番環境用管理者認証情報生成スクリプト
 * 使用方法: node scripts/generate-production-credentials.js
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// カラー出力
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(color, message) {
  console.log(color + message + colors.reset);
}

// パスワード強度チェック
function checkPasswordStrength(password) {
  const requirements = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  const allMet = Object.values(requirements).every(Boolean);
  
  return { requirements, score, allMet };
}

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

// メイン処理
async function main() {
  console.clear();
  log(colors.bright + colors.blue, '🔐 タスカル 本番環境管理者認証情報生成');
  console.log('='.repeat(60));
  
  try {
    // 1. ユーザー名入力
    const username = await new Promise(resolve => {
      rl.question('本番管理者ユーザー名を入力してください (例: prod_admin): ', resolve);
    });
    
    if (!username || username.length < 3) {
      log(colors.red, '❌ ユーザー名は3文字以上で入力してください');
      process.exit(1);
    }
    
    // 2. 電話番号入力
    const phoneNumber = await new Promise(resolve => {
      rl.question('管理者の電話番号を入力してください (例: +81-90-1234-5678): ', resolve);
    });
    
    const phoneRegex = /^\+\d{1,3}-?\d{1,4}-?\d{1,4}-?\d{1,4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      log(colors.red, '❌ 有効な電話番号を入力してください');
      process.exit(1);
    }
    
    // 3. パスワード選択
    const passwordChoice = await new Promise(resolve => {
      rl.question('パスワードを選択してください:\n1. 自動生成 (推奨)\n2. 手動入力\n選択 (1 or 2): ', resolve);
    });
    
    let password;
    
    if (passwordChoice === '1') {
      // 自動生成
      password = generateSecurePassword(16);
      log(colors.green, '✅ 安全なパスワードを自動生成しました');
    } else if (passwordChoice === '2') {
      // 手動入力
      password = await new Promise(resolve => {
        rl.question('パスワードを入力してください (最小12文字): ', resolve);
      });
      
      const strength = checkPasswordStrength(password);
      if (!strength.allMet) {
        log(colors.red, '❌ パスワードが安全要件を満たしていません:');
        Object.entries(strength.requirements).forEach(([req, met]) => {
          const icon = met ? '✅' : '❌';
          const reqName = {
            length: '12文字以上',
            uppercase: '大文字を含む',
            lowercase: '小文字を含む',
            number: '数字を含む',
            special: '特殊文字を含む'
          };
          console.log(`  ${icon} ${reqName[req]}`);
        });
        process.exit(1);
      }
      log(colors.green, '✅ パスワードが安全要件を満たしています');
    } else {
      log(colors.red, '❌ 無効な選択です');
      process.exit(1);
    }
    
    // 4. bcryptハッシュ生成
    log(colors.yellow, '🔄 bcryptハッシュを生成中...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 5. バックアップコード生成
    const backupCode = generateBackupCode();
    
    // 6. 結果出力
    console.log('\n' + '='.repeat(60));
    log(colors.bright + colors.green, '🎉 本番環境認証情報が生成されました！');
    console.log('='.repeat(60));
    
    console.log(`
📋 本番環境管理者情報:
${'─'.repeat(40)}
ユーザー名: ${colors.bright}${username}${colors.reset}
電話番号: ${colors.bright}${phoneNumber}${colors.reset}
パスワード: ${colors.bright}${password}${colors.reset}
bcryptハッシュ: ${colors.bright}${passwordHash}${colors.reset}
バックアップコード: ${colors.bright}${backupCode}${colors.reset}

🔧 マイグレーションSQL更新:
${'─'.repeat(40)}
1. supabase/migrations/007_update_production_admin_credentials.sql を開く
2. 以下の値を置き換えてください:

   'prod_admin_user' → '${username}'
   '$2b$12$REPLACE_WITH_ACTUAL_BCRYPT_HASH' → '${passwordHash}'
   '+81-90-1234-5678' → '${phoneNumber}'

3. マイグレーション実行:
   supabase db push

⚠️  重要な注意事項:
${'─'.repeat(40)}
• パスワードとバックアップコードを安全な場所に保存してください
• このログをコピーした後、ターミナルをクリアしてください
• マイグレーション実行後、デフォルト管理者は無効化されます
• 初回ログイン時にパスワード変更が求められます

🔐 セキュリティチェックリスト:
${'─'.repeat(40)}
□ パスワードを安全な場所に保存済み
□ バックアップコードを記録済み
□ マイグレーションファイルを更新済み
□ 古いデフォルト認証情報を無効化済み

`);
    
    // 7. 確認
    const confirmed = await new Promise(resolve => {
      rl.question('情報を確認しました。続行しますか？ (y/N): ', resolve);
    });
    
    if (confirmed.toLowerCase() !== 'y') {
      log(colors.yellow, '⚠️ 操作をキャンセルしました');
      process.exit(0);
    }
    
    // 8. 環境変数チェック
    console.log('\n' + '='.repeat(60));
    log(colors.bright + colors.blue, '🔍 環境変数確認');
    console.log('='.repeat(60));
    
    const envVarsToCheck = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SENDGRID_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'VERCEL_TOKEN'
    ];
    
    console.log('必須環境変数の確認:');
    envVarsToCheck.forEach(varName => {
      const isSet = process.env[varName] !== undefined;
      const icon = isSet ? '✅' : '❌';
      const status = isSet ? '設定済み' : '未設定';
      console.log(`  ${icon} ${varName}: ${status}`);
    });
    
    log(colors.bright + colors.green, '\n✅ 認証情報生成完了！');
    log(colors.yellow, '次のステップ: マイグレーションファイルを更新してデプロイしてください');
    
  } catch (error) {
    log(colors.red, `❌ エラーが発生しました: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { generateSecurePassword, generateBackupCode, checkPasswordStrength }; 