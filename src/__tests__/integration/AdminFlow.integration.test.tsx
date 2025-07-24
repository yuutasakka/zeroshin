import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../../App';
import { supabase } from '../../components/supabaseClient';

// モック設定
jest.mock('../../components/supabaseClient');
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

// Intersection Observer モック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

describe('管理者フロー統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Supabaseのモック設定
    mockedSupabase.auth = {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    } as any;

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null })
    });
  });

  test('管理者ログインフローが正常に動作する', async () => {
    render(<App />);

    // フッターの管理者ログインリンクをクリック
    const adminLink = await screen.findByText(/管理者ログイン/i);
    fireEvent.click(adminLink);

    // ログイン選択画面
    await waitFor(() => {
      expect(screen.getByText(/ログイン方法を選択/i)).toBeInTheDocument();
    });

    // 管理者ログインを選択
    const adminLoginButton = screen.getByText(/管理者としてログイン/i);
    fireEvent.click(adminLoginButton);

    // 管理者ログイン画面
    await waitFor(() => {
      expect(screen.getByText(/管理者ログイン/i)).toBeInTheDocument();
    });

    // ログイン成功をモック
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: '123', email: 'admin@example.com' },
        session: { access_token: 'token' }
      },
      error: null
    });

    // 認証情報を入力
    const emailInput = screen.getByPlaceholderText(/メールアドレス/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード/i);

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // ログインボタンをクリック
    const loginButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(loginButton);

    // 管理画面へ遷移
    await waitFor(() => {
      expect(screen.getByText(/管理ダッシュボード/i)).toBeInTheDocument();
    });
  });

  test('管理画面でユーザーデータが表示される', async () => {
    // 既にログイン済みの状態をモック
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: '123', email: 'admin@example.com' },
          access_token: 'token'
        }
      },
      error: null
    });

    // モックデータ
    const mockUserData = [
      {
        id: '1',
        phoneNumber: '09012345678',
        timestamp: new Date().toISOString(),
        diagnosisAnswers: {
          age: '20s',
          experience: 'beginner',
          purpose: 'asset',
          amount: 'under10k',
          timing: 'now'
        },
        smsVerified: true
      }
    ];

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      })
    });

    render(<App />);

    // 管理者ログインリンクをクリック
    const adminLink = await screen.findByText(/管理者ログイン/i);
    fireEvent.click(adminLink);

    // 直接管理画面へ
    await waitFor(() => {
      expect(screen.getByText(/管理ダッシュボード/i)).toBeInTheDocument();
    });

    // ユーザーデータが表示される
    expect(screen.getByText(/09012345678/i)).toBeInTheDocument();
    expect(screen.getByText(/20代/i)).toBeInTheDocument();
  });

  test('管理画面でログアウトが正常に動作する', async () => {
    // ログイン済み状態
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: '123', email: 'admin@example.com' },
          access_token: 'token'
        }
      },
      error: null
    });

    mockedSupabase.auth.signOut.mockResolvedValue({ error: null });

    render(<App />);

    // 管理画面へ
    const adminLink = await screen.findByText(/管理者ログイン/i);
    fireEvent.click(adminLink);

    await waitFor(() => {
      expect(screen.getByText(/管理ダッシュボード/i)).toBeInTheDocument();
    });

    // ログアウトボタンをクリック
    const logoutButton = screen.getByText(/ログアウト/i);
    fireEvent.click(logoutButton);

    // ホーム画面に戻る
    await waitFor(() => {
      expect(screen.getByText(/今すぐ無料で診断を始める/i)).toBeInTheDocument();
    });
  });

  test('管理画面でCSVエクスポートが動作する', async () => {
    // ログイン済み状態
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: '123', email: 'admin@example.com' },
          access_token: 'token'
        }
      },
      error: null
    });

    // モックデータ
    const mockUserData = [
      {
        id: '1',
        phoneNumber: '09012345678',
        timestamp: new Date().toISOString(),
        diagnosisAnswers: {
          age: '20s',
          experience: 'beginner',
          purpose: 'asset',
          amount: 'under10k',
          timing: 'now'
        },
        smsVerified: true
      }
    ];

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      })
    });

    // ダウンロード関数をモック
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          click: mockClick,
          setAttribute: jest.fn(),
          style: {}
        } as any;
      }
      return document.createElement(tagName);
    });

    render(<App />);

    // 管理画面へ
    const adminLink = await screen.findByText(/管理者ログイン/i);
    fireEvent.click(adminLink);

    await waitFor(() => {
      expect(screen.getByText(/管理ダッシュボード/i)).toBeInTheDocument();
    });

    // CSVエクスポートボタンをクリック
    const exportButton = screen.getByText(/CSVエクスポート/i);
    fireEvent.click(exportButton);

    // ダウンロードが実行される
    expect(mockClick).toHaveBeenCalled();
  });

  test('パスワードリセットフローが動作する', async () => {
    render(<App />);

    // 管理者ログイン画面へ
    const adminLink = await screen.findByText(/管理者ログイン/i);
    fireEvent.click(adminLink);

    await waitFor(() => {
      const adminLoginButton = screen.getByText(/管理者としてログイン/i);
      fireEvent.click(adminLoginButton);
    });

    // パスワードを忘れたリンクをクリック
    await waitFor(() => {
      const forgotLink = screen.getByText(/パスワードを忘れた方/i);
      fireEvent.click(forgotLink);
    });

    // パスワードリセット画面
    await waitFor(() => {
      expect(screen.getByText(/パスワードリセット/i)).toBeInTheDocument();
    });

    // メールアドレスを入力
    const emailInput = screen.getByPlaceholderText(/メールアドレス/i);
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });

    // リセットリンク送信をモック
    mockedSupabase.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {},
      error: null
    });

    // 送信ボタンをクリック
    const sendButton = screen.getByText(/リセットリンクを送信/i);
    fireEvent.click(sendButton);

    // 成功メッセージ
    await waitFor(() => {
      expect(screen.getByText(/リセットリンクを送信しました/i)).toBeInTheDocument();
    });
  });
});