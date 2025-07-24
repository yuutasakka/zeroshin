// プロダクション環境用ロガー
// デバッグコードを本番環境でも安全に使用

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info', 
  WARN: 'warn',
  ERROR: 'error'
};

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  action?: string;
  timestamp?: string;
  [key: string]: any;
}

class ProductionLogger {
  private static isProduction(): boolean {
    return process.env.NODE_ENV === 'production' ||
           (typeof window !== 'undefined' && 
            window.location.hostname !== 'localhost' &&
            !window.location.hostname.includes('127.0.0.1') &&
            !window.location.hostname.includes('dev'));
  }

  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  // セキュリティ情報のマスキング
  private static maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const masked = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'otp', 'phone'];
    
    Object.keys(masked).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        if (typeof masked[key] === 'string') {
          masked[key] = masked[key].length > 4 ? 
            masked[key].substring(0, 2) + '***' + masked[key].substring(masked[key].length - 2) :
            '***';
        } else {
          masked[key] = '***';
        }
      }
    });
    
    return masked;
  }

  public static debug(message: string, context?: LogContext): void {
    if (!this.isProduction()) {
      console.log(this.formatMessage('debug', message, this.maskSensitiveData(context)));
    }
  }

  public static info(message: string, context?: LogContext): void {
    const maskedContext = this.maskSensitiveData(context);
    if (this.isProduction()) {
      // 本番環境では構造化ログを出力
      console.info(JSON.stringify({
        level: 'info',
        message,
        context: maskedContext,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.info(this.formatMessage('info', message, maskedContext));
    }
  }

  public static warn(message: string, context?: LogContext): void {
    const maskedContext = this.maskSensitiveData(context);
    if (this.isProduction()) {
      console.warn(JSON.stringify({
        level: 'warn',
        message,
        context: maskedContext,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.warn(this.formatMessage('warn', message, maskedContext));
    }
  }

  public static error(message: string, error?: Error, context?: LogContext): void {
    const maskedContext = this.maskSensitiveData(context);
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: this.isProduction() ? undefined : error.stack
    } : undefined;

    if (this.isProduction()) {
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: errorInfo,
        context: maskedContext,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.error(this.formatMessage('error', message, maskedContext));
      if (error) console.error(error);
    }
  }

  // セキュリティイベント専用ロガー
  public static security(event: string, details?: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const securityLog = {
      level: 'security',
      event,
      severity,
      details: this.maskSensitiveData(details),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ip: typeof window !== 'undefined' ? window.location.hostname : undefined
    };

    if (this.isProduction()) {
      console.warn(JSON.stringify(securityLog));
    } else {
      console.warn(` SECURITY [${severity.toUpperCase()}]: ${event}`, securityLog);
    }
  }

  // パフォーマンス監視
  public static performance(metric: string, value: number, unit: string = 'ms', context?: LogContext): void {
    const perfLog = {
      level: 'performance',
      metric,
      value,
      unit,
      context: this.maskSensitiveData(context),
      timestamp: new Date().toISOString()
    };

    if (this.isProduction()) {
      console.info(JSON.stringify(perfLog));
    } else {
      console.log(` PERF: ${metric} = ${value}${unit}`, context);
    }
  }
}

export default ProductionLogger;