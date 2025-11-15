import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

const mockLocalStorage = ((): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useTheme', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should initialize with light theme by default', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should load saved theme from localStorage', () => {
    mockLocalStorage.setItem('app-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should toggle theme correctly', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(mockLocalStorage.getItem('app-theme')).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(mockLocalStorage.getItem('app-theme')).toBe('light');
  });

  it('should save theme to localStorage on change', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(mockLocalStorage.getItem('app-theme')).toBe('dark');
  });
});
