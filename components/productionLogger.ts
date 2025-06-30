// 本番環境でのログ無効化
const isProduction = process.env.NODE_ENV === 'production' || 
                    (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'production') ||
                    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

// 本番環境用のログ関数（何も出力しない）
const productionLogger = {
  log: (...args: any[]) => {},
  error: (...args: any[]) => {},
  warn: (...args: any[]) => {},
  info: (...args: any[]) => {},
  debug: (...args: any[]) => {}
};

// 開発環境用のログ関数（通常のconsole）
const developmentLogger = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console)
};

// 環境に応じたロガーをエクスポート
export const logger = isProduction ? productionLogger : developmentLogger;

// セキュリティ強化：本番環境でconsoleオブジェクトとalert関数を無効化
if (isProduction && typeof window !== 'undefined') {
  // 本番環境でのみconsole関数を無効化
  window.console = {
    ...window.console,
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    table: () => {},
    group: () => {},
    groupEnd: () => {},
    groupCollapsed: () => {},
    clear: () => {},
    count: () => {},
    countReset: () => {},
    time: () => {},
    timeEnd: () => {},
    timeLog: () => {},
    assert: () => {},
    dir: () => {},
    dirxml: () => {}
  };

  // 本番環境でalert、confirm、promptを無効化
  window.alert = () => {};
  window.confirm = () => false;
  window.prompt = () => null;
}

// 本番環境でのログとエラーを制御

// WebSocket関連のエラーメッセージパターン
const DEVELOPMENT_ERROR_PATTERNS = [
  /WebSocket connection.*localhost:\d+.*failed/i,
  /ws:\/\/localhost:\d+/i,
  /HMR.*connection/i,
  /Hot.*reload/i,
  /Parcel.*HMR/i,
  /Plasmo.*HMR/i,
  /LiveReload/i,
  /webpack.*HMR/i,
  /Fast.*Refresh/i
];

// グローバルエラーハンドラーの設定
if (typeof window !== 'undefined') {
  // コンソールエラーの抑制
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // 開発環境関連のエラーは抑制
    const isDevelopmentError = DEVELOPMENT_ERROR_PATTERNS.some(pattern => 
      pattern.test(message)
    );
    
    if (isDevelopmentError) {
      // 開発環境エラーは警告レベルに変更
      console.warn('🔧 Development tool warning:', ...args);
      return;
    }
    
    // その他のエラーは通常通り出力
    originalConsoleError.apply(console, args);
  };

  // unhandledrejection イベントハンドラー
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    
    // WebSocket関連のエラーは抑制
    const isDevelopmentError = DEVELOPMENT_ERROR_PATTERNS.some(pattern => 
      pattern.test(message)
    );
    
    if (isDevelopmentError) {
      console.warn('🔧 Development tool promise rejection:', event.reason);
      event.preventDefault(); // エラーの伝播を防ぐ
      return;
    }
  });

  // error イベントハンドラー
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    // WebSocket関連のエラーは抑制
    const isDevelopmentError = DEVELOPMENT_ERROR_PATTERNS.some(pattern => 
      pattern.test(message)
    );
    
    if (isDevelopmentError) {
      console.warn('🔧 Development tool error:', event.message);
      event.preventDefault(); // エラーの伝播を防ぐ
      return;
    }
  });
}

// 本番環境でのconsole.log無効化（window.consoleで既に設定済みのため、冗長性回避）
if ((import.meta as any).env?.PROD && typeof window === 'undefined') {
  // サーバーサイドでのみconsole無効化
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
} 