'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

type NavUser = { id?: string; name: string; email?: string | null; avatar_url: string | null };

const navLinks = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/articles' },
  { label: '软件', href: '/software' },
  { label: '分类', href: '/categories' },
  { label: '关于', href: '/about' },
  { label: '联系', href: '/contact' },
];

function StarIcon() {
  return (
    <svg className="six-star-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 20 17H4L12 3Z" />
      <path d="M12 21 4 7h16l-8 14Z" />
    </svg>
  );
}

export default function Navbar({ initialUser = null }: { initialUser?: NavUser | null }) {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [searchOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(`/articles?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <header className="glass-nav h-14 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold tracking-tight text-[var(--accent)]">OwenFX</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 text-sm rounded-full transition-all duration-200 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className={`nav-actions relative flex items-center gap-2 ${searchOpen ? 'nav-actions-search-open' : ''}`}>
            <div ref={searchWrapRef} className="nav-search-slot flex items-center">
              {!searchOpen ? (
                <button type="button" aria-label="搜索" aria-expanded={searchOpen} onClick={() => setSearchOpen(true)} className="nav-icon-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                  </svg>
                </button>
              ) : (
                <form onSubmit={handleSearch} className="nav-search-capsule nav-search-capsule-inline">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    type="search"
                    placeholder="搜索文章 · 软件"
                    aria-label="搜索文章或软件"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                  <button type="submit" aria-label="提交搜索" className="nav-search-submit">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.5" y1="16.5" x2="21" y2="21" />
                    </svg>
                  </button>
                </form>
              )}
            </div>

            <div className="nav-theme-slot">
              <ThemeToggle />
            </div>

            {user ? (
              <button type="button" aria-label="用户" className="nav-star-btn" onClick={() => router.push('/about')}>
                <StarIcon />
              </button>
            ) : (
              <Link href="/login" aria-label="登录" className="nav-star-btn">
                <StarIcon />
              </Link>
            )}

            <button
              className={`md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all ${menuOpen ? 'bg-[var(--bg-tertiary)]' : ''}`}
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] shadow-lg" style={{ background: 'var(--bg-secondary)' }}>
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 text-sm rounded-lg transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
