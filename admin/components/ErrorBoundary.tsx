/**
 * React Error Boundary - 管理画面用エラー境界
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { handleBoundaryError, ErrorBoundaryState } from '../utils/errorHandler';
import { navigateTo } from '../utils/navigation';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー処理とログ記録
    const appError = handleBoundaryError(error, errorInfo);
    
    this.setState({
      error: appError
    });

    // カスタムエラーハンドラーの実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 重大なエラーの場合は管理者に通知
    if (appError.severity === 'critical') {
      this.notifyAdmin(appError, errorInfo);
    }
  }

  private notifyAdmin = async (appError: any, errorInfo: ErrorInfo) => {
    // プロダクション環境では実際の通知システムを実装
    logger.error('Critical error in admin panel', {
      error: appError,
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }, 'ErrorBoundary');
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info(`Retrying after error (attempt ${this.retryCount}/${this.maxRetries})`, {}, 'ErrorBoundary');
      
      this.setState({
        hasError: false,
        error: null
      });
    } else {
      logger.warn('Maximum retry attempts reached', { retryCount: this.retryCount }, 'ErrorBoundary');
    }
  };

  private handleGoToDashboard = () => {
    this.setState({
      hasError: false,
      error: null
    });
    navigateTo.dashboard();
  };

  private handleReload = () => {
    logger.info('Page reload requested from error boundary', {}, 'ErrorBoundary');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供された場合
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <span>⚠️</span>
            </div>
            
            <div className="error-content">
              <h1>予期しないエラーが発生しました</h1>
              
              <p>
                管理画面でエラーが発生しました。このエラーは自動的にログに記録されます。
                以下のオプションから選択してください：
              </p>

              {this.state.error && (
                <details className="error-details">
                  <summary>エラー詳細（技術者向け）</summary>
                  <pre>
                    <code>
                      {JSON.stringify({
                        code: this.state.error.code,
                        message: this.state.error.message,
                        severity: this.state.error.severity
                      }, null, 2)}
                    </code>
                  </pre>
                </details>
              )}
            </div>

            <div className="error-actions">
              {this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="retry-button"
                  type="button"
                >
                  再試行 ({this.maxRetries - this.retryCount}回まで)
                </button>
              )}
              
              <button
                onClick={this.handleGoToDashboard}
                className="dashboard-button"
                type="button"
              >
                ダッシュボードに戻る
              </button>
              
              <button
                onClick={this.handleReload}
                className="reload-button"
                type="button"
              >
                ページを再読み込み
              </button>
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 100vh;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 2rem;
              font-family: 'Inter', sans-serif;
              color: #ffffff;
            }

            .error-container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              padding: 2.5rem;
              max-width: 600px;
              width: 100%;
              text-align: center;
            }

            .error-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }

            .error-content h1 {
              color: #ff6b6b;
              margin-bottom: 1rem;
              font-size: 1.8rem;
              font-weight: 600;
            }

            .error-content p {
              margin-bottom: 1.5rem;
              line-height: 1.6;
              opacity: 0.9;
            }

            .error-details {
              margin: 1.5rem 0;
              text-align: left;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 8px;
              padding: 1rem;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              margin-bottom: 1rem;
            }

            .error-details pre {
              margin: 0;
              overflow-x: auto;
              font-size: 0.8rem;
            }

            .error-actions {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              margin-top: 2rem;
            }

            .retry-button,
            .dashboard-button,
            .reload-button {
              padding: 1rem;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .retry-button {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: #ffffff;
            }

            .retry-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            }

            .dashboard-button {
              background: linear-gradient(135deg, #007acc 0%, #0056b3 100%);
              color: #ffffff;
            }

            .dashboard-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
            }

            .reload-button {
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: #ffffff;
            }

            .reload-button:hover {
              background: rgba(255, 255, 255, 0.2);
            }

            @media (max-width: 480px) {
              .error-boundary {
                padding: 1rem;
              }

              .error-container {
                padding: 2rem;
              }

              .error-content h1 {
                font-size: 1.5rem;
              }

              .error-actions {
                gap: 0.75rem;
              }

              .retry-button,
              .dashboard-button,
              .reload-button {
                padding: 0.75rem;
                font-size: 0.9rem;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;