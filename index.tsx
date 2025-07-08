import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './components/productionLogger'; // 本番環境でのログ無効化

// WebSocket接続を制御（開発・本番両方で適用）
if (typeof window !== 'undefined') {
  const originalWebSocket = window.WebSocket;
  
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // 不要なWebSocket接続を阻止
      const blockedPorts = ['1815', '24678', '35729']; // Parcel, Plasmo HMR, LiveReload
      const isBlockedConnection = blockedPorts.some(port => 
        urlString.includes(`localhost:${port}`) || 
        urlString.includes(`127.0.0.1:${port}`)
      );
      
      if (isBlockedConnection) {
        console.warn(`🚫 WebSocket connection blocked: ${urlString}`);
        // 接続を阻止するが、エラーはconsole.warnで警告のみ
        throw new Error(`WebSocket connection to ${urlString} has been blocked to prevent development server conflicts`);
      }
      
      super(url, protocols);
    }
  };
  
  // さらなる安全対策: addEventListener の override
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type: string, listener: ((this: EventTarget, ev: Event) => void) | null, options?: boolean | { capture?: boolean; once?: boolean; passive?: boolean }) {
    // WebSocket関連のイベントリスナーをフィルター
    if (this instanceof WebSocket && ['open', 'message', 'error', 'close'].includes(type)) {
      const url = (this as WebSocket & { url?: string }).url || '';
      const blockedPorts = ['1815', '24678', '35729'];
      const isBlocked = blockedPorts.some(port => url.includes(`localhost:${port}`));
      
      if (isBlocked) {
        console.warn(`🚫 WebSocket event listener blocked for: ${url}`);
        return;
      }
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
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