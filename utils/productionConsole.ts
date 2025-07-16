// 本番環境用コンソール管理
// 開発環境でのみコンソールログを出力

const isDevelopment = (() => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  // サーバーサイドでの判定
  return process.env.NODE_ENV === 'development';
})();

export const productionConsole = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // エラーは本番環境でも出力（重要）
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};