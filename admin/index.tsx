import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';
import './styles/admin.css';

// 管理画面専用のエントリーポイント
const container = document.getElementById('admin-root');
if (!container) {
  throw new Error('Admin root element not found');
}

const root = createRoot(container);
root.render(<AdminApp />);

// 管理画面用の追加セキュリティ設定
if (process.env.NODE_ENV === 'production') {
  // 開発者ツールの無効化
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  });

  // 右クリック無効化
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // ソース表示の無効化
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
  });
}