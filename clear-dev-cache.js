#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 開発キャッシュをクリア中...');

// Viteキャッシュディレクトリをクリア
const viteCacheDir = path.join(process.cwd(), 'node_modules', '.vite');
if (fs.existsSync(viteCacheDir)) {
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
  console.log('✅ Viteキャッシュをクリア');
}

// その他のキャッシュディレクトリ
const cacheDirectories = [
  '.parcel-cache',
  '.plasmo',
  'dist',
  '.next'
];

cacheDirectories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ ${dir}をクリア`);
  }
});

console.log('🎉 キャッシュクリア完了！'); 