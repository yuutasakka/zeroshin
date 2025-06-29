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