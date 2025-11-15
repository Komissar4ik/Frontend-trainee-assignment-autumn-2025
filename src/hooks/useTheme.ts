import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme';

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const parseTheme = (value: string | null): Theme => {
    return value === 'dark' ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return parseTheme(savedTheme);
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
