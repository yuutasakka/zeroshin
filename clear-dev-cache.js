#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 開発キャッシュをクリア中...');

// Viteキャッシュディレクトリをクリア
const viteCacheDir = path.join(__dirname, 'node_modules', '.vite');
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
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ ${dir}をクリア`);
  }
});

console.log('🎉 キャッシュクリア完了！'); 