import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthGuard from '../../components/AuthGuard';

// Supabaseモック
vi.mock('../../components/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        subscription: { unsubscribe: vi.fn() }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証されていない場合はローディングを表示', () => {
    const { supabase } = require('../../components/supabaseClient');
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthGuard allowedRoles={['admin']}>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('認証情報を確認中…')).toBeInTheDocument();
  });

  it('適切なロールを持つユーザーはコンテンツにアクセス可能', async () => {
    const { supabase } = require('../../components/supabaseClient');
    
    supabase.auth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'user-id' } 
        } 
      }
    });

    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { is_active: true },
            error: null
          })
        }))
      }))
    });

    render(
      <AuthGuard allowedRoles={['admin']}>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
}); 