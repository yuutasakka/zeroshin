import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizedDiagnosisFlow from '../OptimizedDiagnosisFlow';

// モックデータ
const mockOnComplete = jest.fn();
const mockOnCancel = jest.fn();

describe('OptimizedDiagnosisFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('診断フォームが正しくレンダリングされる', () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // タイトルが表示されている
    expect(screen.getByText(/あなたに最適な金融商品を診断/i)).toBeInTheDocument();
    
    // 最初の質問が表示されている
    expect(screen.getByText(/年齢と投資経験/i)).toBeInTheDocument();
  });

  test('質問1の選択肢をクリックすると次の質問に進む', async () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // 最初の選択肢をクリック
    const firstOption = screen.getByText(/20代・投資未経験/i);
    fireEvent.click(firstOption);

    // 次の質問が表示される
    await waitFor(() => {
      expect(screen.getByText(/投資の目的と予算/i)).toBeInTheDocument();
    });
  });

  test('すべての質問に回答すると電話番号入力画面が表示される', async () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // 質問1
    fireEvent.click(screen.getByText(/20代・投資未経験/i));

    // 質問2
    await waitFor(() => {
      fireEvent.click(screen.getByText(/資産形成・月1万円以下/i));
    });

    // 電話番号入力画面が表示される
    await waitFor(() => {
      expect(screen.getByText(/診断結果を受け取る/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/090-1234-5678/i)).toBeInTheDocument();
    });
  });

  test('電話番号を入力して送信すると完了コールバックが呼ばれる', async () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // 質問に回答
    fireEvent.click(screen.getByText(/20代・投資未経験/i));
    await waitFor(() => {
      fireEvent.click(screen.getByText(/資産形成・月1万円以下/i));
    });

    // 電話番号を入力
    const phoneInput = await screen.findByPlaceholderText(/090-1234-5678/i);
    fireEvent.change(phoneInput, { target: { value: '09012345678' } });

    // 送信ボタンをクリック
    const submitButton = screen.getByText(/診断結果を受け取る/i);
    fireEvent.click(submitButton);

    // コールバックが正しい引数で呼ばれる
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith({
        ageAndExperience: '20s-beginner',
        purposeAndBudget: 'asset-building-under-10k',
        phoneNumber: '09012345678'
      });
    });
  });

  test('戻るボタンをクリックすると前の質問に戻る', async () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // 質問1に回答
    fireEvent.click(screen.getByText(/20代・投資未経験/i));

    // 質問2が表示される
    await waitFor(() => {
      expect(screen.getByText(/投資の目的と予算/i)).toBeInTheDocument();
    });

    // 戻るボタンをクリック
    const backButton = screen.getByLabelText(/前の質問に戻る/i);
    fireEvent.click(backButton);

    // 質問1に戻る
    await waitFor(() => {
      expect(screen.getByText(/年齢と投資経験/i)).toBeInTheDocument();
    });
  });

  test('プログレスバーが正しく更新される', async () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // 初期状態（33%）
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '33');

    // 質問1に回答（66%）
    fireEvent.click(screen.getByText(/20代・投資未経験/i));
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('aria-valuenow', '66');
    });

    // 質問2に回答（100%）
    fireEvent.click(screen.getByText(/資産形成・月1万円以下/i));
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  test('無効な電話番号でエラーメッセージが表示される', async () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // 質問に回答
    fireEvent.click(screen.getByText(/20代・投資未経験/i));
    await waitFor(() => {
      fireEvent.click(screen.getByText(/資産形成・月1万円以下/i));
    });

    // 無効な電話番号を入力
    const phoneInput = await screen.findByPlaceholderText(/090-1234-5678/i);
    fireEvent.change(phoneInput, { target: { value: '123' } });

    // 送信ボタンをクリック
    const submitButton = screen.getByText(/診断結果を受け取る/i);
    fireEvent.click(submitButton);

    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText(/正しい電話番号を入力してください/i)).toBeInTheDocument();
    });
  });

  test('キャンセルボタンでonCancelが呼ばれる', () => {
    render(
      <OptimizedDiagnosisFlow
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // キャンセルボタンをクリック
    const cancelButton = screen.getByLabelText(/診断を中止/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});