import { useState, useCallback } from 'react';
import type { AddsFilters } from '@/types';

const PRESETS_STORAGE_KEY = 'filter-presets';

interface FilterPreset {
  id: string;
  name: string;
  filters: AddsFilters;
}

export function useFilterPresets(): {
  presets: FilterPreset[];
  savePreset: (name: string, filters: AddsFilters) => void;
  loadPreset: (id: string) => AddsFilters | null;
  deletePreset: (id: string) => void;
} {
  const isValidFilterPreset = (obj: unknown): obj is FilterPreset => {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    if (!('id' in obj) || !('name' in obj) || !('filters' in obj)) {
      return false;
    }
    const id = 'id' in obj ? obj.id : undefined;
    const name = 'name' in obj ? obj.name : undefined;
    const filters = 'filters' in obj ? obj.filters : undefined;
    return (
      typeof id === 'string' &&
      typeof name === 'string' &&
      typeof filters === 'object' &&
      filters !== null
    );
  };

  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (!saved) {
        return [];
      }
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidFilterPreset);
      }
      return [];
    } catch {
      return [];
    }
  });

  const savePreset = useCallback((name: string, filters: AddsFilters): void => {
    setPresets((prev) => {
      const newPreset: FilterPreset = {
        id: Date.now().toString(),
        name,
        filters,
      };
      const updated = [...prev, newPreset];
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadPreset = useCallback(
    (id: string): AddsFilters | null => {
      const preset = presets.find((p) => p.id === id);
      return preset ? preset.filters : null;
    },
    [presets]
  );

  const deletePreset = useCallback((id: string): void => {
    setPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { presets, savePreset, loadPreset, deletePreset };
}
