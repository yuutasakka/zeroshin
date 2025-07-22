import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PhoneVerificationPage from '../PhoneVerificationPage';
import * as api from '../../api/smsAuth';

// APIモック
jest.mock('../../api/smsAuth');
const mockedApi = api as jest.Mocked<typeof api>;

// Propsの型定義
interface Props {
  initialData: {
    phoneNumber: string;
    diagnosisAnswers: any;
  };
  onVerificationSuccess: (phoneNumber: string) => void;
  onBack: () => void;
}

describe('PhoneVerificationPage', () => {
  const defaultProps: Props = {
    initialData: {
      phoneNumber: '09012345678',
      diagnosisAnswers: {
        age: '20s',
        experience: 'beginner'
      }
    },
    onVerificationSuccess: jest.fn(),
    onBack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('電話番号認証ページが正しくレンダリングされる', () => {
    render(<PhoneVerificationPage {...defaultProps} />);

    expect(screen.getByText(/SMS認証/i)).toBeInTheDocument();
    expect(screen.getByText(/09012345678/i)).toBeInTheDocument();
    expect(screen.getByText(/認証コードを送信/i)).toBeInTheDocument();
  });

  test('認証コード送信ボタンをクリックするとAPIが呼ばれる', async () => {
    mockedApi.sendVerificationCode.mockResolvedValue({
      success: true,
      message: '認証コードを送信しました'
    });

    render(<PhoneVerificationPage {...defaultProps} />);

    const sendButton = screen.getByText(/認証コードを送信/i);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockedApi.sendVerificationCode).toHaveBeenCalledWith('09012345678');
      expect(screen.getByPlaceholderText(/6桁の数字/i)).toBeInTheDocument();
    });
  });

  test('認証コードを入力して確認すると成功コールバックが呼ばれる', async () => {
    mockedApi.sendVerificationCode.mockResolvedValue({
      success: true,
      message: '認証コードを送信しました'
    });

    mockedApi.verifyCode.mockResolvedValue({
      success: true,
      message: '認証成功'
    });

    render(<PhoneVerificationPage {...defaultProps} />);

    // 認証コード送信
    fireEvent.click(screen.getByText(/認証コードを送信/i));

    // 認証コード入力
    const codeInput = await screen.findByPlaceholderText(/6桁の数字/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });

    // 確認ボタンクリック
    const verifyButton = screen.getByText(/認証する/i);
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockedApi.verifyCode).toHaveBeenCalledWith('09012345678', '123456');
      expect(defaultProps.onVerificationSuccess).toHaveBeenCalledWith('09012345678');
    });
  });

  test('無効な認証コードでエラーメッセージが表示される', async () => {
    mockedApi.sendVerificationCode.mockResolvedValue({
      success: true,
      message: '認証コードを送信しました'
    });

    mockedApi.verifyCode.mockResolvedValue({
      success: false,
      error: '認証コードが正しくありません'
    });

    render(<PhoneVerificationPage {...defaultProps} />);

    // 認証コード送信
    fireEvent.click(screen.getByText(/認証コードを送信/i));

    // 認証コード入力
    const codeInput = await screen.findByPlaceholderText(/6桁の数字/i);
    fireEvent.change(codeInput, { target: { value: '000000' } });

    // 確認ボタンクリック
    const verifyButton = screen.getByText(/認証する/i);
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/認証コードが正しくありません/i)).toBeInTheDocument();
    });
  });

  test('再送信タイマーが正しく動作する', async () => {
    jest.useFakeTimers();
    
    mockedApi.sendVerificationCode.mockResolvedValue({
      success: true,
      message: '認証コードを送信しました'
    });

    render(<PhoneVerificationPage {...defaultProps} />);

    // 認証コード送信
    fireEvent.click(screen.getByText(/認証コードを送信/i));

    // 再送信ボタンが無効化されている
    await waitFor(() => {
      const resendButton = screen.getByText(/秒後に再送信可能/i);
      expect(resendButton).toBeDisabled();
    });

    // 60秒経過
    jest.advanceTimersByTime(60000);

    await waitFor(() => {
      expect(screen.getByText(/認証コードを再送信/i)).toBeEnabled();
    });

    jest.useRealTimers();
  });

  test('戻るボタンでonBackが呼ばれる', () => {
    render(<PhoneVerificationPage {...defaultProps} />);

    const backButton = screen.getByLabelText(/戻る/i);
    fireEvent.click(backButton);

    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  test('電話番号変更ボタンで編集モードになる', async () => {
    render(<PhoneVerificationPage {...defaultProps} />);

    const changeButton = screen.getByText(/電話番号を変更/i);
    fireEvent.click(changeButton);

    // 電話番号入力フィールドが表示される
    const phoneInput = await screen.findByPlaceholderText(/090-1234-5678/i);
    expect(phoneInput).toBeInTheDocument();

    // 新しい番号を入力
    fireEvent.change(phoneInput, { target: { value: '08011112222' } });

    // 確定ボタンをクリック
    const confirmButton = screen.getByText(/変更を確定/i);
    fireEvent.click(confirmButton);

    // 新しい番号が表示される
    await waitFor(() => {
      expect(screen.getByText(/08011112222/i)).toBeInTheDocument();
    });
  });

  test('連続失敗でロックアウトメッセージが表示される', async () => {
    mockedApi.sendVerificationCode.mockResolvedValue({
      success: true,
      message: '認証コードを送信しました'
    });

    // 5回失敗をシミュレート
    mockedApi.verifyCode.mockResolvedValue({
      success: false,
      error: '認証コードが正しくありません'
    });

    render(<PhoneVerificationPage {...defaultProps} />);

    // 認証コード送信
    fireEvent.click(screen.getByText(/認証コードを送信/i));

    const codeInput = await screen.findByPlaceholderText(/6桁の数字/i);
    const verifyButton = screen.getByText(/認証する/i);

    // 5回失敗
    for (let i = 0; i < 5; i++) {
      fireEvent.change(codeInput, { target: { value: '000000' } });
      fireEvent.click(verifyButton);
      await waitFor(() => {
        expect(mockedApi.verifyCode).toHaveBeenCalledTimes(i + 1);
      });
    }

    // ロックアウトメッセージ
    await waitFor(() => {
      expect(screen.getByText(/認証回数の上限に達しました/i)).toBeInTheDocument();
    });
  });
});