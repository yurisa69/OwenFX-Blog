'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

type NavItem = { label: string; href: string | null; icon: string };

const overview: NavItem = { label: '工作概览', href: '/admin', icon: '⌂' };

const navGroups: Array<{ title: string; description: string; items: NavItem[] }> = [
  {
    title: 'Studio',
    description: '内容创作',
    items: [
      { label: '文章管理', href: '/admin/articles', icon: '▤' },
      { label: '同步任务', href: '/admin/article-sync', icon: '↻' },
      { label: 'AI 文章导入', href: '/admin/integrations', icon: '✧' },
    ],
  },
  {
    title: '后台功能',
    description: '资源配置',
    items: [
      { label: '软件管理', href: '/admin/software', icon: '▦' },
      { label: '媒体资源', href: null, icon: '▧' },
      { label: '分类标签', href: null, icon: '◇' },
    ],
  },
  {
    title: '互动运营',
    description: '网站运营',
    items: [
      { label: '流量统计', href: '/admin/analytics', icon: '▥' },
      { label: '安全监控', href: '/admin/security', icon: '◈' },
      { label: '评论管理', href: '/admin/comments', icon: '◌' },
      { label: '用户管理', href: null, icon: '♙' },
      { label: '赞赏设置', href: '/admin/support', icon: '⚙' },
      { label: '失效反馈', href: '/admin/link-feedback', icon: '☁' },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [mobileOpen]);

  const overviewActive = isActivePath(pathname, '/admin');

  function GroupLinks({ group, mobile = false }: { group: typeof navGroups[number]; mobile?: boolean }) {
    return (
      <div className={mobile
        ? 'flex flex-col gap-1 border-l border-[var(--border-color)] ml-3 mt-1 pl-3'
        : 'absolute left-0 top-full z-[60] mt-2 min-w-52 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] p-2 shadow-xl backdrop-blur-2xl'
      }>
        {group.items.map(item => item.href ? (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
            className={`nav-link-pill flex w-full justify-start gap-2 text-sm ${isActivePath(pathname, item.href) ? 'bg-[var(--accent-bg)] text-[var(--text-primary)]' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="w-5 text-center text-[var(--text-tertiary)]" aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ) : (
          <span key={item.label} aria-disabled="true" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[var(--text-tertiary)] opacity-60">
            <span className="w-5 text-center" aria-hidden="true">{item.icon}</span>
            {item.label}
            <span className="ml-auto text-[10px]">规划中</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-nav fixed inset-x-0 top-0 z-50">
      <header className="h-14 flex items-center">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-[var(--accent)]">OwenFX</span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Studio</span>
          </Link>

          <nav aria-label="后台管理导航" className="hidden items-center gap-1 md:flex">
            <Link
              href="/admin"
              aria-current={overviewActive ? 'page' : undefined}
              className={`nav-link-pill text-sm ${overviewActive ? 'bg-[var(--accent-bg)] text-[var(--text-primary)]' : ''}`}
            >
              {overview.label}
            </Link>
            {navGroups.map(group => {
              const active = group.items.some(item => item.href && isActivePath(pathname, item.href));
              const expanded = openGroup === group.title;
              return (
                <div className="relative" key={group.title}>
                  <button
                    type="button"
                    className={`nav-link-pill gap-1 text-sm ${active || expanded ? 'bg-[var(--accent-bg)] text-[var(--text-primary)]' : ''}`}
                    aria-expanded={expanded}
                    onClick={() => setOpenGroup(expanded ? null : group.title)}
                  >
                    {group.title}
                    <span className="text-xs opacity-60" aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
                  </button>
                  {expanded && <GroupLinks group={group} />}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="nav-link-pill text-sm">BLOG »</Link>
            <button
              type="button"
              className="nav-icon-btn md:hidden"
              aria-label={mobileOpen ? '关闭管理菜单' : '打开管理菜单'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(value => !value)}
            >
              {mobileOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="border-t border-[var(--border-color)] px-4 py-3 shadow-lg md:hidden">
          <nav aria-label="移动端后台管理导航" className="flex flex-col gap-1">
            <Link
              href="/admin"
              aria-current={overviewActive ? 'page' : undefined}
              className={`nav-link-pill w-full justify-start text-sm ${overviewActive ? 'bg-[var(--accent-bg)] text-[var(--text-primary)]' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {overview.label}
            </Link>
            {navGroups.map(group => {
              const active = group.items.some(item => item.href && isActivePath(pathname, item.href));
              const expanded = openGroup === group.title;
              return (
                <div key={group.title}>
                  <button
                    type="button"
                    className={`nav-link-pill flex w-full justify-between text-left text-sm ${active || expanded ? 'bg-[var(--accent-bg)] text-[var(--text-primary)]' : ''}`}
                    aria-expanded={expanded}
                    onClick={() => setOpenGroup(expanded ? null : group.title)}
                  >
                    <span>{group.title}<span className="ml-2 text-xs text-[var(--text-tertiary)]">{group.description}</span></span>
                    <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
                  </button>
                  {expanded && <GroupLinks group={group} mobile />}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
