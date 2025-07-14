#!/usr/bin/env node

/**
 * 本番環境用環境変数検証スクリプト
 * 本番デプロイ前に実行してセキュリティ設定を確認
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_VARS = [
  'VITE_JWT_SECRET',
  'VITE_SESSION_SECRET', 
  'VITE_ENCRYPTION_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY'
];

const FORBIDDEN_VALUES = [
  'CHANGE_ME',
  'CHANGE_IN_PRODUCTION',
  'dev-',
  'localhost',
  'test'
];

const DEFAULT_HASHES = [
  // ハードコードされたハッシュは削除済み - セキュリティ向上のため
];

function validateEnvironmentVariables() {
  console.log('🔍 本番環境セキュリティ検証を開始...\n');
  
  const errors = [];
  const warnings = [];
  
  // 環境変数の存在と値をチェック
  REQUIRED_VARS.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
      errors.push(`❌ ${varName} が設定されていません`);
      return;
    }
    
    // 禁止値チェック
    const hasForbiddenValue = FORBIDDEN_VALUES.some(forbidden => 
      value.toLowerCase().includes(forbidden.toLowerCase())
    );
    
    if (hasForbiddenValue) {
      errors.push(`❌ ${varName} に不適切な値が含まれています`);
      return;
    }
    
    // 最小長チェック
    if (varName.includes('SECRET') || varName.includes('KEY')) {
      if (value.length < 32) {
        warnings.push(`⚠️ ${varName} は32文字以上を推奨します（現在: ${value.length}文字）`);
      }
    }
    
    console.log(`✅ ${varName}: OK`);
  });
  
  // package.jsonのスクリプト確認
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log('✅ ビルドスクリプト: OK');
    } else {
      warnings.push('⚠️ package.jsonにビルドスクリプトが見つかりません');
    }
  } catch (error) {
    warnings.push('⚠️ package.jsonの読み込みに失敗しました');
  }
  
  // セキュリティファイルの存在確認
  const securityFiles = [
    'vercel.json',
    'security.config.ts',
    'components/ProductionSecurityValidator.tsx'
  ];
  
  securityFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`✅ ${file}: 存在確認`);
    } else {
      warnings.push(`⚠️ ${file} が見つかりません`);
    }
  });
  
  // 結果表示
  console.log('\n📊 検証結果:');
  console.log(`✅ 成功: ${REQUIRED_VARS.length - errors.length}/${REQUIRED_VARS.length}`);
  console.log(`⚠️ 警告: ${warnings.length}`);
  console.log(`❌ エラー: ${errors.length}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️ 警告:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ エラー:');
    errors.forEach(error => console.log(`  ${error}`));
    console.log('\n🚨 本番環境にデプロイする前に上記のエラーを修正してください！');
    process.exit(1);
  }
  
  console.log('\n🎉 セキュリティ検証が完了しました。本番環境にデプロイ可能です！');
}

// スクリプト実行部分
validateEnvironmentVariables();

module.exports = { validateEnvironmentVariables }; 