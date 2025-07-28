import { useState, useEffect, useCallback } from 'react';

interface CSRFTokenData {
  csrfToken: string;
  sessionId: string;
  expiresIn: number;
  timestamp: number;
}

interface UseCSRFResult {
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  addCSRFHeaders: (headers?: Record<string, string>) => Record<string, string>;
  isTokenValid: () => boolean;
}

/**
 * CSRF保護用のReact Hook
 */
export const useCSRF = (): UseCSRFResult => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<CSRFTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSRFトークンの取得
  const fetchCSRFToken = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CSRF token fetch failed: ${response.status}`);
      }

      const data: CSRFTokenData = await response.json();
      
      setCsrfToken(data.csrfToken);
      setTokenData(data);

      // ローカルストレージにも保存（セッション用）
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrfTokenData', JSON.stringify({
          ...data,
          fetchedAt: Date.now()
        }));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('CSRF token fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // トークンの有効性チェック
  const isTokenValid = useCallback((): boolean => {
    if (!tokenData) return false;
    
    const now = Date.now();
    const expiresAt = tokenData.timestamp + tokenData.expiresIn;
    
    // 有効期限の10%前に無効とみなす（余裕を持った更新）
    const bufferTime = tokenData.expiresIn * 0.1;
    return now < (expiresAt - bufferTime);
  }, [tokenData]);

  // CSRFヘッダーの追加
  const addCSRFHeaders = useCallback((headers: Record<string, string> = {}): Record<string, string> => {
    if (csrfToken) {
      return {
        ...headers,
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json',
      };
    }
    return headers;
  }, [csrfToken]);

  // トークンの更新
  const refreshToken = useCallback(async (): Promise<void> => {
    await fetchCSRFToken();
  }, [fetchCSRFToken]);

  // 初期化とトークンの自動更新
  useEffect(() => {
    // ページ読み込み時の処理
    const initializeCSRF = async () => {
      // セッションストレージからの復元を試行
      if (typeof window !== 'undefined') {
        const storedData = sessionStorage.getItem('csrfTokenData');
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            const now = Date.now();
            const age = now - parsed.fetchedAt;
            
            // 5分以内のデータは有効とみなす
            if (age < 300000) {
              setCsrfToken(parsed.csrfToken);
              setTokenData(parsed);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Failed to parse stored CSRF data:', err);
          }
        }
      }

      // 新しいトークンを取得
      await fetchCSRFToken();
    };

    initializeCSRF();
  }, [fetchCSRFToken]);

  // トークンの自動更新（有効期限の80%で更新）
  useEffect(() => {
    if (!tokenData || !csrfToken) return;

    const updateInterval = tokenData.expiresIn * 0.8; // 80%の時点で更新
    const timeoutId = setTimeout(() => {
      if (!isTokenValid()) {
        fetchCSRFToken();
      }
    }, updateInterval);

    return () => clearTimeout(timeoutId);
  }, [tokenData, csrfToken, isTokenValid, fetchCSRFToken]);

  // ページのフォーカス時にトークンの有効性を確認
  useEffect(() => {
    const handleFocus = () => {
      if (!isTokenValid()) {
        fetchCSRFToken();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isTokenValid, fetchCSRFToken]);

  return {
    csrfToken,
    isLoading,
    error,
    refreshToken,
    addCSRFHeaders,
    isTokenValid,
  };
};

/**
 * CSRF保護付きのfetch関数
 */
export const csrfFetch = async (
  url: string,
  options: RequestInit = {},
  csrfToken?: string
): Promise<Response> => {
  // CSRFトークンの取得
  let token = csrfToken;
  if (!token && typeof window !== 'undefined') {
    // クッキーからトークンを取得
    const cookies = document.cookie.split('; ');
    const csrfCookie = cookies.find(cookie => cookie.startsWith('_csrf='));
    token = csrfCookie?.split('=')[1];
  }

  // ヘッダーにCSRFトークンを追加
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any)['X-CSRF-Token'] = token;
  }

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
};

export default useCSRF;