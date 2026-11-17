'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export default function AdminThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved: Theme = localStorage.getItem('admin-theme') === 'light' ? 'light' : 'dark';
    const root = document.querySelector<HTMLElement>('.admin-theme-root');
    const body = document.body;
    const previousBodyTheme = body.getAttribute('data-theme');
    const previousBodyAdminTheme = body.getAttribute('data-admin-theme');
    const previousColorScheme = body.style.colorScheme;

    const applyTheme = (value: Theme) => {
      root?.setAttribute('data-admin-theme', value);
      root?.setAttribute('data-theme', value);
      root?.style.setProperty('color-scheme', value);
      body.setAttribute('data-admin-theme', value);
      body.setAttribute('data-theme', value);
      body.style.colorScheme = value;
    };

    setTheme(saved);
    applyTheme(saved);

    return () => {
      if (previousBodyTheme === null) body.removeAttribute('data-theme');
      else body.setAttribute('data-theme', previousBodyTheme);
      if (previousBodyAdminTheme === null) body.removeAttribute('data-admin-theme');
      else body.setAttribute('data-admin-theme', previousBodyAdminTheme);
      body.style.colorScheme = previousColorScheme;
    };
  }, []);

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const root = document.querySelector<HTMLElement>('.admin-theme-root');
    localStorage.setItem('admin-theme', next);
    root?.setAttribute('data-admin-theme', next);
    root?.setAttribute('data-theme', next);
    root?.style.setProperty('color-scheme', next);
    document.body.setAttribute('data-admin-theme', next);
    document.body.setAttribute('data-theme', next);
    document.body.style.colorScheme = next;
    setTheme(next);
    event.currentTarget.blur();
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="nav-icon-btn"
      aria-label={theme === 'dark' ? '切换后台到浅色模式' : '切换后台到深色模式'}
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}
