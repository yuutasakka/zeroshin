import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '2rem',
          textAlign: 'center' as const,
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            申し訳ございません。エラーが発生しました。
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            ページを再読み込みしてお試しください。
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;