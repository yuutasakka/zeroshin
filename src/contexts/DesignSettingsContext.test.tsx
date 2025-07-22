import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DesignSettingsProvider, useDesignTemplate, useHeaderData } from './DesignSettingsContext';
import React from 'react';

// Supabaseのモック
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  })),
};

vi.mock('../components/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// テスト用コンポーネント
const TestComponent: React.FC = () => {
  const { currentTemplate, setTemplate, templateConfig } = useDesignTemplate();
  const headerData = useHeaderData();

  return (
    <div>
      <div data-testid="current-template">{currentTemplate}</div>
      <div data-testid="template-config">{JSON.stringify(templateConfig)}</div>
      <div data-testid="header-data">{JSON.stringify(headerData)}</div>
      <button onClick={() => setTemplate('classic')}>Change to Classic</button>
    </div>
  );
};

describe('DesignSettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // デフォルトのSupabaseレスポンス
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  it('provides default values', () => {
    render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    expect(screen.getByTestId('current-template')).toHaveTextContent('modern');
    expect(screen.getByTestId('template-config')).toContainHTML('modern');
  });

  it('loads settings from Supabase', async () => {
    const mockHeaderData = {
      logo: { text: 'Test Logo' },
      navigation: { items: [] },
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 1,
        setting_key: 'header_data',
        setting_value: mockHeaderData,
      },
      error: null,
    });

    render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    await waitFor(() => {
      const headerData = screen.getByTestId('header-data');
      expect(headerData).toHaveTextContent('Test Logo');
    });
  });

  it('saves template to localStorage', async () => {
    const { rerender } = render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    // テンプレートを変更
    const button = screen.getByText('Change to Classic');
    await act(async () => {
      button.click();
    });

    expect(localStorage.getItem('design-template')).toBe('classic');
    expect(screen.getByTestId('current-template')).toHaveTextContent('classic');

    // 再レンダリング後も保持される
    rerender(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    expect(screen.getByTestId('current-template')).toHaveTextContent('classic');
  });

  it('subscribes to real-time updates', async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    };
    
    mockSupabase.channel.mockReturnValue(mockChannel);

    render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    // チャンネルが作成される
    expect(mockSupabase.channel).toHaveBeenCalledWith('design-settings-changes');
    
    // イベントリスナーが設定される
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'homepage_content_settings',
      }),
      expect.any(Function)
    );
    
    // サブスクライブされる
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('handles real-time updates', async () => {
    let realtimeCallback: any;
    const mockChannel = {
      on: vi.fn((event, config, callback) => {
        realtimeCallback = callback;
        return mockChannel;
      }),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    };
    
    mockSupabase.channel.mockReturnValue(mockChannel);

    render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    // リアルタイム更新をシミュレート
    const newHeaderData = {
      logo: { text: 'Updated Logo' },
      navigation: { items: [] },
    };

    act(() => {
      realtimeCallback({
        eventType: 'UPDATE',
        new: {
          setting_key: 'header_data',
          setting_value: newHeaderData,
        },
      });
    });

    await waitFor(() => {
      const headerData = screen.getByTestId('header-data');
      expect(headerData).toHaveTextContent('Updated Logo');
    });
  });

  it('handles template-specific configurations', () => {
    render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    const templateConfig = screen.getByTestId('template-config');
    
    // modern テンプレートの設定を確認
    expect(templateConfig).toHaveTextContent('modern');
    expect(templateConfig).toHaveTextContent('horizontal');
  });

  it('updates multiple settings simultaneously', async () => {
    const mockData = [
      {
        id: 1,
        setting_key: 'header_data',
        setting_value: { logo: { text: 'Header' } },
      },
      {
        id: 2,
        setting_key: 'footer_data',
        setting_value: { copyright: '2024' },
      },
    ];

    mockSupabase.in.mockReturnValueOnce({
      data: mockData,
      error: null,
    });

    render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    // 複数の設定が読み込まれる
    expect(mockSupabase.from).toHaveBeenCalledWith('homepage_content_settings');
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockSupabase.in.mockReturnValueOnce({
      data: null,
      error: new Error('Database error'),
    });

    render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('設定の読み込みに失敗'),
        expect.any(Error)
      );
    });

    // デフォルト値が使用される
    expect(screen.getByTestId('current-template')).toHaveTextContent('modern');

    consoleErrorSpy.mockRestore();
  });

  it('cleans up subscriptions on unmount', () => {
    const unsubscribeFn = vi.fn();
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: unsubscribeFn }),
    };
    
    mockSupabase.channel.mockReturnValue(mockChannel);

    const { unmount } = render(
      <DesignSettingsProvider>
        <TestComponent />
      </DesignSettingsProvider>
    );

    unmount();

    // アンサブスクライブが呼ばれる
    expect(unsubscribeFn).toHaveBeenCalled();
  });

  it('throws error when used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDesignSettings must be used within DesignSettingsProvider');

    consoleErrorSpy.mockRestore();
  });
});