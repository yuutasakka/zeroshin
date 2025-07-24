import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardNavigation,
  useLiveRegion,
  useFocusManagement,
  useContrastRatio,
  useReducedMotion,
  useHighContrast,
  useAriaLabel,
} from './useAccessibility';

describe('useKeyboardNavigation', () => {
  it('detects keyboard navigation', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    
    expect(result.current).toBe(false);
    
    // Tabキーを押す
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(event);
    });
    
    expect(result.current).toBe(true);
    
    // マウスクリック
    act(() => {
      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);
    });
    
    expect(result.current).toBe(false);
  });
});

describe('useLiveRegion', () => {
  beforeEach(() => {
    // ライブリージョンを作成
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(politeRegion);
    
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    document.body.appendChild(assertiveRegion);
  });

  it('announces messages to live regions', () => {
    const { result } = renderHook(() => useLiveRegion());
    
    act(() => {
      result.current.announce('Hello', 'polite');
    });
    
    const politeRegion = document.querySelector('[aria-live="polite"]');
    expect(politeRegion?.textContent).toBe('Hello');
    expect(result.current.announcements).toContain('Hello');
  });

  it('prevents duplicate announcements', () => {
    const { result } = renderHook(() => useLiveRegion());
    
    act(() => {
      result.current.announce('Test message', 'polite');
      result.current.announce('Test message', 'polite');
    });
    
    expect(result.current.announcements.filter(msg => msg === 'Test message')).toHaveLength(1);
  });

  it('clears announcements after timeout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLiveRegion());
    
    act(() => {
      result.current.announce('Temporary', 'assertive');
    });
    
    expect(result.current.announcements).toContain('Temporary');
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.announcements).not.toContain('Temporary');
    vi.useRealTimers();
  });
});

describe('useFocusManagement', () => {
  it('saves and restores focus', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    
    act(() => {
      result.current.saveFocus();
    });
    
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    expect(document.activeElement).toBe(input);
    
    act(() => {
      result.current.restoreFocus();
    });
    
    expect(document.activeElement).toBe(button);
  });

  it('traps focus within element', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    const button3 = document.createElement('button');
    
    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    document.body.appendChild(container);
    
    const cleanup = result.current.trapFocus(container);
    
    // 最初の要素にフォーカス
    expect(document.activeElement).toBe(button1);
    
    // クリーンアップ
    cleanup();
  });
});

describe('useContrastRatio', () => {
  it('calculates contrast ratio correctly', () => {
    const { result } = renderHook(() => useContrastRatio());
    
    // 黒と白
    const ratio1 = result.current.calculateContrast('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
    expect(ratio1).toBeCloseTo(21, 1);
    
    // 同じ色
    const ratio2 = result.current.calculateContrast('rgb(128, 128, 128)', 'rgb(128, 128, 128)');
    expect(ratio2).toBeCloseTo(1, 1);
  });

  it('checks accessibility compliance', () => {
    const { result } = renderHook(() => useContrastRatio());
    
    // AA基準
    expect(result.current.isAccessible(4.5, 'AA')).toBe(true);
    expect(result.current.isAccessible(4.4, 'AA')).toBe(false);
    
    // AAA基準
    expect(result.current.isAccessible(7, 'AAA')).toBe(true);
    expect(result.current.isAccessible(6.9, 'AAA')).toBe(false);
  });
});

describe('useReducedMotion', () => {
  it('detects reduced motion preference', () => {
    // matchMediaをモック
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    
    window.matchMedia = mockMatchMedia;
    
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('responds to preference changes', () => {
    let listener: any;
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event, fn) => {
        listener = fn;
      }),
      removeEventListener: vi.fn(),
    }));
    
    window.matchMedia = mockMatchMedia;
    
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    
    // 設定を変更
    act(() => {
      listener({ matches: true });
    });
    
    expect(result.current).toBe(true);
  });
});

describe('useHighContrast', () => {
  it('detects high contrast mode on Windows', () => {
    // Windows環境をシミュレート
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
    });
    
    const { result } = renderHook(() => useHighContrast());
    
    // 高コントラストモードの検出ロジックがテストされる
    expect(typeof result.current).toBe('boolean');
  });
});

describe('useAriaLabel', () => {
  it('generates proper ARIA labels', () => {
    const { result, rerender } = renderHook(
      ({ base, additional }) => useAriaLabel(base, additional),
      {
        initialProps: { base: 'Email', additional: undefined },
      }
    );
    
    expect(result.current).toBe('Email');
    
    // 追加情報を含む
    rerender({ base: 'Email', additional: '必須' });
    expect(result.current).toBe('Email, 必須');
    
    // 基本ラベルの変更
    rerender({ base: 'Password', additional: '8文字以上' });
    expect(result.current).toBe('Password, 8文字以上');
  });
});