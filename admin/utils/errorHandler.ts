/**
 * 中央集約エラーハンドリングシステム
 */

import { logger } from './logger';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
  originalError?: any;
}

// 定義済みエラータイプ
export const ErrorTypes = {
  // 認証関連
  AUTH_FAILED: {
    code: 'AUTH_FAILED',
    message: 'Authentication failed',
    userMessage: 'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
    severity: 'medium' as const
  },
  
  INSUFFICIENT_PRIVILEGES: {
    code: 'INSUFFICIENT_PRIVILEGES',
    message: 'Insufficient privileges',
    userMessage: '管理者権限がありません。',
    severity: 'high' as const
  },

  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Session expired',
    userMessage: 'セッションが期限切れです。再度ログインしてください。',
    severity: 'medium' as const
  },

  // データベース関連
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed',
    userMessage: 'データの処理中にエラーが発生しました。しばらくしてから再試行してください。',
    severity: 'high' as const
  },

  DATA_NOT_FOUND: {
    code: 'DATA_NOT_FOUND',
    message: 'Data not found',
    userMessage: '要求されたデータが見つかりません。',
    severity: 'low' as const
  },

  // バリデーション関連
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    userMessage: '入力内容に不正な値が含まれています。',
    severity: 'low' as const
  },

  // ネットワーク関連
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network request failed',
    userMessage: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    severity: 'medium' as const
  },

  // 一般的なエラー
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred',
    userMessage: '予期しないエラーが発生しました。',
    severity: 'high' as const
  }
} as const;

class ErrorHandler {
  // エラーの作成
  createError(
    errorType: typeof ErrorTypes[keyof typeof ErrorTypes],
    context?: string,
    originalError?: any
  ): AppError {
    return {
      ...errorType,
      context,
      originalError
    };
  }

  // エラーの処理
  handleError(error: AppError | Error | any, context?: string): AppError {
    let appError: AppError;

    // AppErrorの場合
    if (this.isAppError(error)) {
      appError = error;
    }
    // 標準エラーの場合
    else if (error instanceof Error) {
      appError = this.createError(ErrorTypes.UNKNOWN_ERROR, context, error);
    }
    // その他の場合
    else {
      appError = this.createError(ErrorTypes.UNKNOWN_ERROR, context, error);
    }

    // ログに記録
    logger.error(appError.message, {
      code: appError.code,
      severity: appError.severity,
      context: appError.context,
      originalError: appError.originalError
    }, context);

    return appError;
  }

  // Supabaseエラーの処理
  handleSupabaseError(error: any, context?: string): AppError {
    if (!error) {
      return this.createError(ErrorTypes.UNKNOWN_ERROR, context);
    }

    // 認証エラー
    if (error.message?.includes('Invalid login credentials')) {
      return this.createError(ErrorTypes.AUTH_FAILED, context, error);
    }

    // 権限エラー  
    if (error.message?.includes('insufficient_privilege') || 
        error.code === 'PGRST301') {
      return this.createError(ErrorTypes.INSUFFICIENT_PRIVILEGES, context, error);
    }

    // データが見つからない
    if (error.code === 'PGRST116') {
      return this.createError(ErrorTypes.DATA_NOT_FOUND, context, error);
    }

    // その他のデータベースエラー
    return this.createError(ErrorTypes.DATABASE_ERROR, context, error);
  }

  // ネットワークエラーの処理
  handleNetworkError(error: any, context?: string): AppError {
    return this.createError(ErrorTypes.NETWORK_ERROR, context, error);
  }

  // AppErrorかどうかの判定
  private isAppError(error: any): error is AppError {
    return error && 
           typeof error.code === 'string' &&
           typeof error.message === 'string' &&
           typeof error.userMessage === 'string' &&
           typeof error.severity === 'string';
  }

  // ユーザー向けエラーメッセージの取得
  getUserMessage(error: AppError | Error | any): string {
    if (this.isAppError(error)) {
      return error.userMessage;
    }
    return ErrorTypes.UNKNOWN_ERROR.userMessage;
  }

  // エラーの重要度判定
  isCritical(error: AppError): boolean {
    return error.severity === 'critical' || error.severity === 'high';
  }
}

export const errorHandler = new ErrorHandler();

// React Error Boundary用のエラー情報
export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

// エラー境界で使用するエラー処理
export const handleBoundaryError = (error: Error, errorInfo: any): AppError => {
  const appError = errorHandler.createError(
    ErrorTypes.UNKNOWN_ERROR,
    'ErrorBoundary',
    { error, errorInfo }
  );
  
  logger.error('React Error Boundary triggered', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack
  }, 'ErrorBoundary');

  return appError;
};