#!/usr/bin/env node

/**
 * セキュアな管理者認証情報生成スクリプト
 * 本番環境用の安全なパスワードとbcryptハッシュを生成
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';

async function generateSecureAdminCredentials() {
  console.log('🔐 セキュアな管理者認証情報を生成中...\n');

  // 強力なパスワード生成（16文字、大小英数字+記号）
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // bcryptハッシュ生成（12ラウンド）
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // セッション秘密鍵生成
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  
  // JWT秘密鍵生成
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  // 暗号化キー生成
  const encryptionKey = crypto.randomBytes(32).toString('hex');

  // バックアップコード生成
  const backupCode = 'SECURE-' + Date.now() + '-' + crypto.randomBytes(8).toString('hex').toUpperCase();

  console.log('✅ 生成完了！以下の情報を安全に保管してください：\n');
  
  console.log('📋 【管理者アカウント情報】');
  console.log(`ユーザー名: admin_${Date.now().toString().slice(-6)}`);
  console.log(`パスワード: ${password}`);
  console.log(`bcryptハッシュ: ${passwordHash}`);
  console.log(`バックアップコード: ${backupCode}\n`);
  
  console.log('🔑 【環境変数】');
  console.log(`SESSION_SECRET=${sessionSecret}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);
  
  console.log('🗄️ 【SQL更新文】');
  console.log(`-- 既存のデフォルト管理者を無効化`);
  console.log(`UPDATE admin_credentials SET is_active = false WHERE username = 'admin';`);
  console.log(``);
  console.log(`-- 新しい安全な管理者を追加`);
  console.log(`INSERT INTO admin_credentials (`);
  console.log(`  username, password_hash, backup_code, is_active, requires_password_change`);
  console.log(`) VALUES (`);
  console.log(`  'admin_${Date.now().toString().slice(-6)}',`);
  console.log(`  '${passwordHash}',`);
  console.log(`  '${backupCode}',`);
  console.log(`  true,`);
  console.log(`  true`);
  console.log(`);`);
  
  console.log('\n⚠️  【重要な注意事項】');
  console.log('1. このパスワードを安全な場所に保管してください');
  console.log('2. 初回ログイン後、必ずパスワードを変更してください');
  console.log('3. 環境変数をVercelに設定してください');
  console.log('4. このコンソール出力は他人に見せないでください');
}

// パスワード強度検証
function validatePasswordStrength(password) {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks, strength: score >= 4 ? 'Strong' : score >= 3 ? 'Medium' : 'Weak' };
}

// スクリプト実行
generateSecureAdminCredentials().catch(console.error);

export { generateSecureAdminCredentials, validatePasswordStrength };