/**
 * React Router ナビゲーションヘルパー
 */

// ナビゲーション関数（React Router v6対応）
let navigate: ((to: string, options?: any) => void) | null = null;

// navigate関数を設定（AdminAppコンポーネントで初期化）
export const setNavigate = (navigateFn: (to: string, options?: any) => void) => {
  navigate = navigateFn;
};

// 安全なナビゲーション関数
export const navigateTo = {
  dashboard: () => {
    if (navigate) {
      navigate('/dashboard');
    } else {
      // フォールバック（React Routerが利用できない場合）
      window.location.href = '/dashboard';
    }
  },

  login: () => {
    if (navigate) {
      navigate('/login');
    } else {
      window.location.href = '/login';
    }
  },

  settings: () => {
    if (navigate) {
      navigate('/settings');
    } else {
      window.location.href = '/settings';
    }
  },

  users: () => {
    if (navigate) {
      navigate('/users');
    } else {
      window.location.href = '/users';
    }
  },

  reports: () => {
    if (navigate) {
      navigate('/reports');
    } else {
      window.location.href = '/reports';
    }
  },

  // カスタムパスへのナビゲーション
  to: (path: string) => {
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  },

  // 外部URLへのナビゲーション（新しいタブで開く）
  external: (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  // ページリロード
  reload: () => {
    window.location.reload();
  }
};

// ブラウザの戻るボタン対応
export const handleBrowserBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigateTo.dashboard();
  }
};