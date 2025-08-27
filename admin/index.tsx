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

// セキュリティは適切なサーバーサイド認証で実装
// クライアントサイドでの開発者ツール制限は推奨されません