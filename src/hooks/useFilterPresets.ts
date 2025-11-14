import { useState, useCallback } from 'react';
import type { AdsFilters } from '@/types';

const PRESETS_STORAGE_KEY = 'filter-presets';

interface FilterPreset {
  id: string;
  name: string;
  filters: AdsFilters;
}

export function useFilterPresets(): {
  presets: FilterPreset[];
  savePreset: (name: string, filters: AdsFilters) => void;
  loadPreset: (id: string) => AdsFilters | null;
  deletePreset: (id: string) => void;
} {
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const savePreset = useCallback(
    (name: string, filters: AdsFilters): void => {
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
    },
    []
  );

  const loadPreset = useCallback(
    (id: string): AdsFilters | null => {
      const preset = presets.find((p) => p.id === id);
      return preset ? preset.filters : null;
    },
    [presets]
  );

  const deletePreset = useCallback(
    (id: string): void => {
      setPresets((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  return { presets, savePreset, loadPreset, deletePreset };
}

