import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './components/productionLogger'; // 本番環境でのログ無効化

// 本番環境でWebSocket接続を無効化
if (process.env.NODE_ENV === 'production') {
  // WebSocketコンストラクタを無効化
  if (typeof window !== 'undefined') {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = class extends originalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        // localhost:1815への接続を阻止
        if (typeof url === 'string' && url.includes('localhost:1815')) {
          throw new Error('WebSocket connection disabled in production');
        }
        super(url, protocols);
      }
    };
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);