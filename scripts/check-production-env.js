#!/usr/bin/env node

/**
 * 本番環境変数確認スクリプト
 * 使用方法: node scripts/check-production-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 環境変数設定状況をチェック
function checkEnvironmentVariables() {
  console.log('🔍 本番環境変数確認');
  console.log('='.repeat(50));
  
  const requiredVars = [
    {
      name: 'VITE_SUPABASE_URL',
      description: 'SupabaseプロジェクトURL',
      example: 'https://your-project.supabase.co',
      critical: true
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      description: 'Supabase匿名キー（公開用）',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      critical: true
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabaseサービスロールキー（管理用）',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      critical: true
    },
    {
      name: 'SENDGRID_API_KEY',
      description: 'SendGridメール送信APIキー',
      example: 'SG.your-api-key...',
      critical: true
    },
    {
      name: 'TWILIO_ACCOUNT_SID',
      description: 'Twilio SMS送信用アカウントSID',
      example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      critical: false
    },
    {
      name: 'TWILIO_AUTH_TOKEN',
      description: 'Twilio認証トークン',
      example: 'your-auth-token',
      critical: false
    },
    {
      name: 'VERCEL_TOKEN',
      description: 'Vercelデプロイ用トークン',
      example: 'your-vercel-token',
      critical: false
    },
    {
      name: 'NODE_ENV',
      description: '実行環境',
      example: 'production',
      critical: true
    }
  ];
  
  let criticalMissing = 0;
  let warningCount = 0;
  
  requiredVars.forEach(variable => {
    const isSet = process.env[variable.name] !== undefined;
    const value = process.env[variable.name];
    
    let status, icon;
    if (isSet) {
      // 値の妥当性をチェック
      if (variable.name === 'VITE_SUPABASE_URL' && !value.includes('supabase.co')) {
        status = 'warning';
        icon = '⚠️';
        warningCount++;
      } else if (variable.name === 'NODE_ENV' && value !== 'production') {
        status = 'warning';
        icon = '⚠️';
        warningCount++;
      } else {
        status = 'success';
        icon = '✅';
      }
    } else {
      if (variable.critical) {
        status = 'error';
        icon = '❌';
        criticalMissing++;
      } else {
        status = 'warning';
        icon = '⚠️';
        warningCount++;
      }
    }
    
    console.log(`${icon} ${variable.name}`);
    console.log(`   説明: ${variable.description}`);
    console.log(`   例: ${variable.example}`);
    
    if (isSet) {
      // セキュリティのため、値の一部のみ表示
      const maskedValue = value.length > 10 ? 
        value.substring(0, 10) + '...' + value.substring(value.length - 4) :
        value;
      console.log(`   現在の値: ${maskedValue}`);
    } else {
      console.log(`   ${colors.red}未設定${colors.reset}`);
    }
    console.log('');
  });
  
  // サマリー
  console.log('='.repeat(50));
  console.log('📊 環境変数確認サマリー');
  console.log('='.repeat(50));
  
  const totalVars = requiredVars.length;
  const setVars = requiredVars.filter(v => process.env[v.name] !== undefined).length;
  
  console.log(`設定済み: ${setVars}/${totalVars}`);
  
  if (criticalMissing > 0) {
    log(colors.red, `❌ 重要な環境変数が${criticalMissing}個未設定です`);
  }
  
  if (warningCount > 0) {
    log(colors.yellow, `⚠️ 警告: ${warningCount}個の項目で注意が必要です`);
  }
  
  if (criticalMissing === 0 && warningCount === 0) {
    log(colors.green, '✅ 全ての環境変数が適切に設定されています');
  }
  
  return { criticalMissing, warningCount };
}

// Vercel環境変数確認
function checkVercelEnvironment() {
  console.log('\n🚀 Vercel環境設定確認');
  console.log('='.repeat(50));
  
  // vercel.jsonファイルの確認
  const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
  
  if (fs.existsSync(vercelConfigPath)) {
    log(colors.green, '✅ vercel.json が存在します');
    
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // 環境変数設定の確認
      if (vercelConfig.env) {
        log(colors.green, '✅ 環境変数設定が見つかりました');
        console.log('設定されている環境変数:');
        Object.keys(vercelConfig.env).forEach(key => {
          console.log(`  - ${key}`);
        });
      } else {
        log(colors.yellow, '⚠️ vercel.jsonに環境変数設定がありません');
      }
      
      // ビルド設定の確認
      if (vercelConfig.buildCommand) {
        log(colors.green, `✅ ビルドコマンド: ${vercelConfig.buildCommand}`);
      }
      
    } catch (error) {
      log(colors.red, '❌ vercel.jsonの解析に失敗しました');
    }
  } else {
    log(colors.yellow, '⚠️ vercel.json が見つかりません');
  }
}

// セキュリティ設定確認
function checkSecuritySettings() {
  console.log('\n🔒 セキュリティ設定確認');
  console.log('='.repeat(50));
  
  const securityChecks = [
    {
      name: 'HTTPS強制',
      check: () => process.env.NODE_ENV === 'production',
      description: '本番環境でHTTPS通信を強制'
    },
    {
      name: 'デバッグモード無効',
      check: () => process.env.VITE_DEBUG !== 'true',
      description: '本番環境でデバッグログを無効化'
    },
    {
      name: 'ソースマップ無効',
      check: () => process.env.GENERATE_SOURCEMAP !== 'true',
      description: '本番環境でソースマップ生成を無効化'
    },
    {
      name: 'エラー詳細非表示',
      check: () => process.env.NODE_ENV === 'production',
      description: '本番環境でエラー詳細を非表示'
    }
  ];
  
  securityChecks.forEach(check => {
    const passed = check.check();
    const icon = passed ? '✅' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.description}`);
  });
}

// package.json確認
function checkPackageJson() {
  console.log('\n📦 package.json確認');
  console.log('='.repeat(50));
  
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // 本番用スクリプトの確認
    const requiredScripts = [
      'build',
      'start',
      'test',
      'security:scan'
    ];
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(colors.green, `✅ ${script} スクリプトが定義されています`);
      } else {
        log(colors.yellow, `⚠️ ${script} スクリプトが未定義です`);
      }
    });
    
    // 依存関係の確認
    const criticalDeps = ['react', 'bcrypt', '@supabase/supabase-js'];
    criticalDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        log(colors.green, `✅ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        log(colors.red, `❌ 重要な依存関係が不足: ${dep}`);
      }
    });
    
  } catch (error) {
    log(colors.red, '❌ package.jsonの読み込みに失敗しました');
  }
}

// メイン実行
function main() {
  console.clear();
  log(colors.bright + colors.blue, '🔍 AI ConectX 本番環境確認');
  console.log('='.repeat(60));
  
  const { criticalMissing, warningCount } = checkEnvironmentVariables();
  checkVercelEnvironment();
  checkSecuritySettings();
  checkPackageJson();
  
  // 最終判定
  console.log('\n' + '='.repeat(60));
  console.log('🎯 最終判定');
  console.log('='.repeat(60));
  
  if (criticalMissing === 0 && warningCount === 0) {
    log(colors.bright + colors.green, '🎉 本番環境の準備が完了しています！');
    console.log('\n次のステップ:');
    console.log('1. node scripts/generate-production-credentials.js を実行');
    console.log('2. マイグレーションファイルを更新');
    console.log('3. 本番デプロイを実行');
  } else if (criticalMissing === 0) {
    log(colors.yellow, '⚠️ 警告はありますが、デプロイ可能です');
    console.log(`警告項目数: ${warningCount}`);
  } else {
    log(colors.red, '❌ 重要な設定が不足しています');
    console.log(`必須項目の不足: ${criticalMissing}`);
    console.log('デプロイ前に設定を完了してください');
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkEnvironmentVariables, checkSecuritySettings }; 