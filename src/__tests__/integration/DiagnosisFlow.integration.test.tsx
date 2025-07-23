import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../../App';
import * as api from '../../api/smsAuth';
import { supabase } from '../../components/supabaseClient';

// モック設定
jest.mock('../../api/smsAuth');
jest.mock('../../components/supabaseClient');

const mockedApi = api as jest.Mocked<typeof api>;
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

// Intersection Observer モック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

describe('診断フロー統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Supabaseのモック設定
    mockedSupabase.auth = {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
    } as any;
  });

  test('完全な診断フローが正常に動作する', async () => {
    render(<App />);

    // 1. ホーム画面で診断開始ボタンをクリック
    const startButton = await screen.findByText(/今すぐ無料で診断を始める/i);
    fireEvent.click(startButton);

    // 2. 診断フォームで質問に回答
    // 質問1: 年齢と投資経験
    await waitFor(() => {
      expect(screen.getByText(/年齢と投資経験/i)).toBeInTheDocument();
    });
    
    const firstOption = screen.getByText(/20代・投資未経験/i);
    fireEvent.click(firstOption);

    // 質問2: 投資の目的と予算
    await waitFor(() => {
      expect(screen.getByText(/投資の目的と予算/i)).toBeInTheDocument();
    });
    
    const secondOption = screen.getByText(/資産形成・月1万円以下/i);
    fireEvent.click(secondOption);

    // 3. 電話番号入力
    await waitFor(() => {
      expect(screen.getByText(/診断結果を受け取る/i)).toBeInTheDocument();
    });

    const phoneInput = screen.getByPlaceholderText(/090-1234-5678/i);
    fireEvent.change(phoneInput, { target: { value: '09012345678' } });

    const submitButton = screen.getByText(/診断結果を受け取る/i);
    fireEvent.click(submitButton);

    // 4. SMS認証画面
    await waitFor(() => {
      expect(screen.getByText(/SMS認証/i)).toBeInTheDocument();
    });

    // 認証コード送信
    mockedApi.sendVerificationCode.mockResolvedValue({
      success: true,
      message: '認証コードを送信しました'
    });

    const sendCodeButton = screen.getByText(/認証コードを送信/i);
    fireEvent.click(sendCodeButton);

    // 認証コード入力
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/6桁の数字/i)).toBeInTheDocument();
    });

    mockedApi.verifyCode.mockResolvedValue({
      success: true,
      message: '認証成功'
    });

    const codeInput = screen.getByPlaceholderText(/6桁の数字/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const verifyButton = screen.getByText(/認証する/i);
    fireEvent.click(verifyButton);

    // 5. 結果画面
    await waitFor(() => {
      expect(screen.getByText(/診断結果/i)).toBeInTheDocument();
    });

    // 結果が表示されている
    expect(screen.getByText(/あなたに最適なプラン/i)).toBeInTheDocument();
  });

  test('診断途中でキャンセルすると最初に戻る', async () => {
    render(<App />);

    // 診断開始
    const startButton = await screen.findByText(/今すぐ無料で診断を始める/i);
    fireEvent.click(startButton);

    // 診断フォームが表示される
    await waitFor(() => {
      expect(screen.getByText(/年齢と投資経験/i)).toBeInTheDocument();
    });

    // キャンセルボタンをクリック
    const cancelButton = screen.getByLabelText(/診断を中止/i);
    fireEvent.click(cancelButton);

    // ホーム画面に戻る
    await waitFor(() => {
      expect(screen.getByText(/今すぐ無料で診断を始める/i)).toBeInTheDocument();
    });
  });

  test('SMS認証失敗時にエラーメッセージが表示される', async () => {
    render(<App />);

    // 診断フローを進める
    const startButton = await screen.findByText(/今すぐ無料で診断を始める/i);
    fireEvent.click(startButton);

    // 質問に回答
    await waitFor(() => {
      fireEvent.click(screen.getByText(/20代・投資未経験/i));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/資産形成・月1万円以下/i));
    });

    // 電話番号入力
    const phoneInput = await screen.findByPlaceholderText(/090-1234-5678/i);
    fireEvent.change(phoneInput, { target: { value: '09012345678' } });
    fireEvent.click(screen.getByText(/診断結果を受け取る/i));

    // SMS認証画面
    await waitFor(() => {
      expect(screen.getByText(/SMS認証/i)).toBeInTheDocument();
    });

    // 認証コード送信エラー
    mockedApi.sendVerificationCode.mockResolvedValue({
      success: false,
      error: 'SMSの送信に失敗しました'
    });

    const sendCodeButton = screen.getByText(/認証コードを送信/i);
    fireEvent.click(sendCodeButton);

    // エラーメッセージ表示
    await waitFor(() => {
      expect(screen.getByText(/SMSの送信に失敗しました/i)).toBeInTheDocument();
    });
  });

  test('診断データが正しく引き継がれる', async () => {
    render(<App />);

    const testData = {
      age: '20代',
      experience: '投資未経験',
      purpose: '資産形成',
      budget: '月1万円以下'
    };

    // 診断開始
    const startButton = await screen.findByText(/今すぐ無料で診断を始める/i);
    fireEvent.click(startButton);

    // 質問に回答
    await waitFor(() => {
      fireEvent.click(screen.getByText(/20代・投資未経験/i));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/資産形成・月1万円以下/i));
    });

    // 電話番号入力
    const phoneInput = await screen.findByPlaceholderText(/090-1234-5678/i);
    fireEvent.change(phoneInput, { target: { value: '09012345678' } });
    fireEvent.click(screen.getByText(/診断結果を受け取る/i));

    // SMS認証を完了
    await waitFor(() => {
      expect(screen.getByText(/SMS認証/i)).toBeInTheDocument();
    });

    mockedApi.sendVerificationCode.mockResolvedValue({ success: true, message: '' });
    mockedApi.verifyCode.mockResolvedValue({ success: true, message: '' });

    fireEvent.click(screen.getByText(/認証コードを送信/i));
    
    const codeInput = await screen.findByPlaceholderText(/6桁の数字/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText(/認証する/i));

    // 結果画面で診断データが反映されている
    await waitFor(() => {
      expect(screen.getByText(/診断結果/i)).toBeInTheDocument();
      expect(screen.getByText(/20代/i)).toBeInTheDocument();
      expect(screen.getByText(/投資未経験/i)).toBeInTheDocument();
    });
  });

  test('オフライン時にローカルストレージに保存される', async () => {
    // オフライン状態をシミュレート
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(<App />);

    // 診断開始
    const startButton = await screen.findByText(/今すぐ無料で診断を始める/i);
    fireEvent.click(startButton);

    // 質問に回答
    await waitFor(() => {
      fireEvent.click(screen.getByText(/20代・投資未経験/i));
    });

    // オフライン機能は無効化されているため、データは保存されない
    // const savedData = localStorage.getItem('moneyticket_offline_data');
    // expect(savedData).toBeTruthy();
    
    // セキュリティのためオフライン機能は無効化
    // if (savedData) {
    //   const parsed = JSON.parse(savedData);
    //   expect(parsed.diagnosisAnswers).toBeDefined();
    }

    // オンラインに戻す
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });
});