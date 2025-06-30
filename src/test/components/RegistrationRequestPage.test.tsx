import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationRequestPage from '../../components/RegistrationRequestPage';

// モック
vi.mock('../../components/supabaseClient', () => ({
  registrationManager: {
    createRegistrationRequest: vi.fn(),
    checkEmailExists: vi.fn()
  }
}));

describe('RegistrationRequestPage', () => {
  const mockProps = {
    onSubmitSuccess: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('フォームが正しく表示される', () => {
    render(<RegistrationRequestPage {...mockProps} />);
    
    expect(screen.getByLabelText('氏名')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('電話番号')).toBeInTheDocument();
    expect(screen.getByLabelText('利用目的')).toBeInTheDocument();
  });

  it('必須項目が未入力の場合エラーメッセージが表示される', async () => {
    const
}); 