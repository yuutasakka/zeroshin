#!/usr/bin/env node

/**
 * セキュアな環境変数キー生成ツール
 * AI ConnectX プロジェクト用
 * 
 * 使用方法:
 * node scripts/generate-env-keys.js
 */

import crypto from 'crypto';

console.log('🔐 AI ConnectX - セキュアキー生成ツール');
console.log('=====================================\n');

// 32文字の安全なランダム文字列を生成
function generateSecureKey(purpose = 'general') {
  return crypto.randomBytes(32).toString('hex');
}

// 生成されたキー
const keys = {
  VITE_ENCRYPTION_KEY: generateSecureKey('encryption'),
  VITE_JWT_SECRET: generateSecureKey('jwt'),
  VITE_SESSION_SECRET: generateSecureKey('session')
};

console.log('📋 Vercelで設定すべき環境変数:');
console.log('================================\n');

Object.entries(keys).forEach(([name, value]) => {
  console.log(`${name}:`);
  console.log(`${value}`);
  console.log();
});

console.log('🚀 設定手順:');
console.log('1. Vercel ダッシュボードにアクセス');
console.log('2. プロジェクト → Settings → Environment Variables');
console.log('3. 上記の環境変数を一つずつ追加');
console.log('4. Environment: Production, Preview, Development 全てにチェック');
console.log('5. Save をクリック\n');

console.log('⚠️  セキュリティ注意事項:');
console.log('- これらのキーは絶対に他人と共有しないでください');
console.log('- GitHubなどの公開リポジトリにコミットしないでください');
console.log('- 定期的にキーを再生成することをお勧めします\n');

console.log('✅ このスクリプトを再実行すると、新しいキーが生成されます。');

// .env.local ファイル用のテンプレートも出力
console.log('\n📄 ローカル開発用 .env.local ファイル:');
console.log('=======================================');
Object.entries(keys).forEach(([name, value]) => {
  console.log(`${name}=${value}`);
});

console.log('\n🏁 設定完了後、アプリを再デプロイしてください！'); 