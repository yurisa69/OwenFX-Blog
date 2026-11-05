'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

let themeSwitchTimeout: number | undefined;

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
};

const applyTheme = (next: Theme) => {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.setAttribute('data-theme', next);
  root.style.colorScheme = next;
  if (themeSwitchTimeout) window.clearTimeout(themeSwitchTimeout);
  themeSwitchTimeout = window.setTimeout(() => root.classList.remove('theme-switching'), 120);
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = getStoredTheme();
    setTheme(saved);
    if (document.documentElement.getAttribute('data-theme') === saved) {
      document.documentElement.style.colorScheme = saved;
    } else {
      applyTheme(saved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
