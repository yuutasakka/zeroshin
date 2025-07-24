import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// CSS imports for test environment
import './test-styles.css';

// テスト後のクリーンアップ
afterEach(() => {
  cleanup();
});

// グローバルモックの設定
beforeAll(() => {
  // LocalStorage モック
  const localStorageMock: Storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  global.localStorage = localStorageMock;

  // SessionStorage モック
  const sessionStorageMock: Storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  global.sessionStorage = sessionStorageMock;

  // Fetch モック
  global.fetch = vi.fn();

  // IntersectionObserver モック
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver as any;

  // ResizeObserver モック
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver as any;

  // matchMedia モック
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // scrollTo モック
  window.scrollTo = vi.fn();

  // createPortal モック（モーダルテスト用）
  vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
      ...actual,
      createPortal: (node: any) => node,
    };
  });

  // URL.createObjectURL モック
  window.URL.createObjectURL = vi.fn(() => 'mock-url');
  window.URL.revokeObjectURL = vi.fn();

  // Crypto モック
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    },
  });
});

// Supabase クライアントモック
vi.mock('../components/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  },
}));

// Sentry モック
vi.mock('../utils/sentry', () => ({
  initSentry: vi.fn(),
  captureError: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setContext: vi.fn(),
}));

// 環境変数モック
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_SENTRY_DSN: 'https://test@sentry.io/123',
    VITE_SENTRY_ENVIRONMENT: 'test',
    DEV: true,
    PROD: false,
    MODE: 'test',
  },
}));

// Console エラーを抑制（テスト中の意図的なエラーのため）
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Failed prop type'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});