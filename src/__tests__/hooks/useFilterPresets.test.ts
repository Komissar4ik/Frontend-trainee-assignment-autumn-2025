import { renderHook, act } from '@testing-library/react';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import type { AddsFilters } from '@/types';

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

describe('useFilterPresets', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('should initialize with empty presets', () => {
    const { result } = renderHook(() => useFilterPresets());
    expect(result.current.presets).toEqual([]);
  });

  it('should load presets from localStorage', () => {
    const savedPresets = [{ id: '1', name: 'Test Preset', filters: { status: ['pending'] } }];
    mockLocalStorage.setItem('filter-presets', JSON.stringify(savedPresets));

    const { result } = renderHook(() => useFilterPresets());
    expect(result.current.presets).toEqual(savedPresets);
  });

  it('should save preset correctly', () => {
    const { result } = renderHook(() => useFilterPresets());
    const filters: AddsFilters = {
      status: ['pending', 'approved'],
      categoryId: 1,
    };

    act(() => {
      result.current.savePreset('My Preset', filters);
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe('My Preset');
    expect(result.current.presets[0].filters).toEqual(filters);
  });

  it('should load preset correctly', () => {
    const { result } = renderHook(() => useFilterPresets());
    const filters: AddsFilters = { status: ['pending'] };

    act(() => {
      result.current.savePreset('Test', filters);
    });

    const presetId = result.current.presets[0].id;
    const loadedFilters = result.current.loadPreset(presetId);

    expect(loadedFilters).toEqual(filters);
  });

  it('should return null for non-existent preset', () => {
    const { result } = renderHook(() => useFilterPresets());
    const loadedFilters = result.current.loadPreset('non-existent');
    expect(loadedFilters).toBeNull();
  });

  it('should delete preset correctly', () => {
    const { result } = renderHook(() => useFilterPresets());

    act(() => {
      result.current.savePreset('Preset 1', { status: ['pending'] });
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe('Preset 1');

    act(() => {
      result.current.savePreset('Preset 2', { status: ['approved'] });
    });

    expect(result.current.presets).toHaveLength(2);

    const presetId = result.current.presets[0].id;

    act(() => {
      result.current.deletePreset(presetId);
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe('Preset 2');
  });

  it('should handle invalid JSON in localStorage', () => {
    mockLocalStorage.setItem('filter-presets', 'invalid json');

    const { result } = renderHook(() => useFilterPresets());

    expect(result.current.presets).toEqual([]);
  });
});
