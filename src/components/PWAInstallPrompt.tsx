import React, { useState, useEffect } from 'react';
import { addBreadcrumb } from '../utils/sentry';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // PWAがすでにインストールされているかチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // iOSデバイスの検出
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      // インストール済みでない場合、24時間に1回プロンプトを表示
      const lastPrompt = localStorage.getItem('lastIOSInstallPrompt');
      const now = Date.now();
      if (!lastPrompt || now - parseInt(lastPrompt) > 24 * 60 * 60 * 1000) {
        setShowIOSPrompt(true);
      }
    }

    // beforeinstallpromptイベントのリスナー
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // 初回訪問から30秒後にプロンプトを表示
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt');
        if (!hasSeenPrompt) {
          setShowInstallPrompt(true);
          addBreadcrumb('PWA install prompt shown', 'ui', 'info');
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // アプリがインストールされた時のイベント
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwaInstalled', 'true');
      addBreadcrumb('PWA installed', 'ui', 'info');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        addBreadcrumb('PWA install accepted', 'ui', 'info');
      } else {
        addBreadcrumb('PWA install dismissed', 'ui', 'info');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      localStorage.setItem('hasSeenInstallPrompt', 'true');
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('hasSeenInstallPrompt', 'true');
    if (showIOSPrompt) {
      localStorage.setItem('lastIOSInstallPrompt', Date.now().toString());
    }
  };

  if (isInstalled || (!showInstallPrompt && !showIOSPrompt)) {
    return null;
  }

  // iOS用のインストール案内
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i className="fas fa-download text-blue-600 text-lg"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">
              アプリとして使用できます
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              ホーム画面に追加して、より快適にご利用いただけます
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-3">
              <p className="mb-2">インストール方法:</p>
              <ol className="space-y-1">
                <li>1. Safari下部の <i className="fas fa-share"></i> 共有ボタンをタップ</li>
                <li>2. 「ホーム画面に追加」を選択</li>
                <li>3. 「追加」をタップ</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              今はしない
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 通常のインストールプロンプト
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <i className="fas fa-download text-blue-600 text-lg"></i>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">
            MoneyTicketをインストール
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            アプリとしてインストールすると、より快適にご利用いただけます
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              インストール
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              今はしない
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;