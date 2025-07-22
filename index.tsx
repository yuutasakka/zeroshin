import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import './src/utils/productionLogger'; // 本番環境でのログ無効化
// import { initSentry } from './src/utils/sentry';
// import { setupServiceWorker } from './src/utils/registerSW';
// import './src/i18n/config'; // i18n初期化

// Sentryの初期化
// initSentry();

// Service Workerの登録
// if ('serviceWorker' in navigator) {
//   setupServiceWorker();
// }

// WebSocket接続を制御（開発・本番両方で適用）
// 一時的に無効化してデバッグ

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