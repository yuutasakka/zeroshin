#!/usr/bin/env node

// ファイル変更監視スクリプト
// 使用方法: node scripts/file-change-monitor.js

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');

console.log('🔍 MoneyTicket ファイル変更監視開始');
console.log('===================================');

// 監視設定
const watchOptions = {
  ignored: [
    /node_modules/,
    /.git/,
    /dist/,
    /build/,
    /.next/,
    /\.log$/
  ],
  persistent: true,
  ignoreInitial: true
};

// 変更ログファイル
const logFile = path.join(__dirname, '..', 'file-changes.log');

// ログ記録関数
function logChange(event, filePath) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${event.toUpperCase()} - ${filePath}\n`;
  
  console.log(`📝 ${event.toUpperCase()}: ${filePath}`);
  fs.appendFileSync(logFile, logEntry);
  
  // Git差分を取得（変更の場合）
  if (event === 'change') {
    exec(`git diff --name-only HEAD~1 HEAD`, (error, stdout, stderr) => {
      if (!error && stdout) {
        const changedFiles = stdout.trim().split('\n');
        if (changedFiles.includes(filePath)) {
          console.log(`📊 Git差分あり: ${filePath}`);
          
          // 詳細な差分を表示
          exec(`git diff HEAD~1 HEAD -- "${filePath}"`, (error, stdout, stderr) => {
            if (!error && stdout) {
              console.log(`📋 ${filePath} の変更差分:`);
              console.log(stdout.substring(0, 500) + '...');
            }
          });
        }
      }
    });
  }
}

// ファイル統計情報
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    return null;
  }
}

// 監視開始
const watcher = chokidar.watch('.', watchOptions);

watcher
  .on('add', filePath => {
    logChange('add', filePath);
    const stats = getFileStats(filePath);
    if (stats) {
      console.log(`📏 サイズ: ${stats.size} bytes`);
    }
  })
  .on('change', filePath => {
    logChange('change', filePath);
    const stats = getFileStats(filePath);
    if (stats) {
      console.log(`📏 サイズ: ${stats.size} bytes | 更新: ${stats.modified}`);
    }
  })
  .on('unlink', filePath => {
    logChange('delete', filePath);
  })
  .on('addDir', dirPath => {
    logChange('add_dir', dirPath);
  })
  .on('unlinkDir', dirPath => {
    logChange('delete_dir', dirPath);
  })
  .on('error', error => {
    console.error('❌ 監視エラー:', error);
  });

console.log('👀 ファイル監視中... (Ctrl+C で終了)');
console.log(`📋 変更ログ: ${logFile}`);

// 終了処理
process.on('SIGINT', () => {
  console.log('\n🛑 監視を終了します...');
  watcher.close();
  
  // 最終統計を表示
  exec('git log --oneline -5', (error, stdout, stderr) => {
    if (!error) {
      console.log('\n📊 最近のコミット:');
      console.log(stdout);
    }
  });
  
  process.exit(0);
});

// 定期的に統計情報を表示
setInterval(() => {
  exec('git status --porcelain', (error, stdout, stderr) => {
    if (!error && stdout) {
      console.log('\n📈 現在の変更状況:');
      const lines = stdout.trim().split('\n');
      lines.forEach(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        console.log(`  ${status} ${file}`);
      });
    }
  });
}, 30000); // 30秒ごと