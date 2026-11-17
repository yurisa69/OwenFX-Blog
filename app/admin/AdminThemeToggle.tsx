'use client';

import { useLayoutEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export default function AdminThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('.admin-theme-root');
    const initializedTheme = root?.dataset.adminTheme;
    const cookieMatch = document.cookie.match(/(?:^|; )admin-theme=(dark|light)(?:;|$)/);
    let stored: string | null = null;
    try { stored = localStorage.getItem('admin-theme'); } catch {}

    // The layout's pre-hydration initializer is authoritative; do not re-apply
    // a second theme value after the browser has already painted the page.
    const saved: Theme = initializedTheme === 'light' || initializedTheme === 'dark'
      ? initializedTheme
      : cookieMatch?.[1] === 'light' || (!cookieMatch && stored === 'light') ? 'light' : 'dark';

    if (root && root.dataset.adminTheme !== saved) {
      root.dataset.adminTheme = saved;
    }
    if (root && root.style.colorScheme !== saved) {
      root.style.colorScheme = saved;
    }
    setTheme(saved);

    if (!cookieMatch) {
      document.cookie = 'admin-theme=' + saved + '; Path=/; Max-Age=31536000; SameSite=Lax';
    }
  }, [initialTheme]);

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    const root = document.querySelector<HTMLElement>('.admin-theme-root');
    const current: Theme = root?.dataset.adminTheme === 'light' ? 'light' : 'dark';
    const next: Theme = current === 'dark' ? 'light' : 'dark';

    // Change the single theme source first; React state only updates the icon.
    if (root) {
      root.dataset.adminTheme = next;
      root.style.colorScheme = next;
    }
    setTheme(next);

    try { localStorage.setItem('admin-theme', next); } catch {}
    document.cookie = 'admin-theme=' + next + '; Path=/; Max-Age=31536000; SameSite=Lax';
    event.currentTarget.blur();
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="admin-nav-icon-btn"
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
