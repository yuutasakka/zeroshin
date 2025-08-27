/**
 * 管理画面用ログシステム
 * プロダクション環境では適切なログサービスに送信
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class AdminLogger {
  private logEntries: LogEntry[] = [];
  private maxEntries = 1000;

  private createEntry(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context
    };
  }

  private log(entry: LogEntry) {
    this.logEntries.push(entry);
    
    // 古いログエントリを制限
    if (this.logEntries.length > this.maxEntries) {
      this.logEntries = this.logEntries.slice(-this.maxEntries);
    }

    // 開発環境では console に出力
    if (process.env.NODE_ENV === 'development') {
      const contextStr = entry.context ? `[${entry.context}] ` : '';
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(`${contextStr}${entry.message}`, entry.data);
          break;
        case LogLevel.WARN:
          console.warn(`${contextStr}${entry.message}`, entry.data);
          break;
        case LogLevel.INFO:
          console.info(`${contextStr}${entry.message}`, entry.data);
          break;
        case LogLevel.DEBUG:
          console.debug(`${contextStr}${entry.message}`, entry.data);
          break;
      }
    }

    // プロダクション環境では外部ログサービスに送信
    // TODO: 実装時に適切なログサービス（Sentry, LogRocket等）を設定
    if (process.env.NODE_ENV === 'production' && entry.level === LogLevel.ERROR) {
      this.sendToLogService(entry);
    }
  }

  private sendToLogService(entry: LogEntry) {
    // プロダクション環境での実装例
    // try {
    //   logService.send(entry);
    // } catch (error) {
    //   // ログサービス自体のエラーは silent fail
    // }
  }

  error(message: string, data?: any, context?: string) {
    this.log(this.createEntry(LogLevel.ERROR, message, data, context));
  }

  warn(message: string, data?: any, context?: string) {
    this.log(this.createEntry(LogLevel.WARN, message, data, context));
  }

  info(message: string, data?: any, context?: string) {
    this.log(this.createEntry(LogLevel.INFO, message, data, context));
  }

  debug(message: string, data?: any, context?: string) {
    this.log(this.createEntry(LogLevel.DEBUG, message, data, context));
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return this.logEntries;
    return this.logEntries.filter(entry => entry.level === level);
  }

  clearLogs() {
    this.logEntries = [];
  }
}

export const logger = new AdminLogger();