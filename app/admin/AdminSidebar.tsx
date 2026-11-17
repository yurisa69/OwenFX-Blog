'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminThemeToggle from './AdminThemeToggle';

type NavItem = {
  label: string;
  href: string | null;
  icon: string;
};

const overview: NavItem = { label: '工作概览', href: '/admin', icon: '⌂' };

const navGroups: Array<{
  title: string;
  description: string;
  short: string;
  items: NavItem[];
}> = [
  {
    title: 'Studio',
    description: '内容创作',
    short: 'S',
    items: [
      { label: '文章管理', href: '/admin/articles', icon: '▤' },
      { label: '同步任务', href: '/admin/article-sync', icon: '↻' },
      { label: 'AI 文章导入', href: '/admin/integrations', icon: '✧' },
    ],
  },
  {
    title: '后台功能',
    description: '',
    short: '▦',
    items: [
      { label: '软件管理', href: '/admin/software', icon: '▦' },
      { label: '媒体资源', href: null, icon: '▧' },
      { label: '分类标签', href: null, icon: '◇' },
    ],
  },
  {
    title: '互动运营',
    description: '',
    short: '◈',
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(navGroups.map(group => group.title));

  useEffect(() => {
    const activeGroup = navGroups.find(group =>
      group.items.some(item => item.href && isActivePath(pathname, item.href))
    );
    if (activeGroup) {
      setExpandedGroups(current => current.includes(activeGroup.title)
        ? current
        : [...current, activeGroup.title]);
    }
    setMobileOpen(false);
  }, [pathname]);

  function toggleGroup(title: string) {
    setExpandedGroups(current => current.includes(title)
      ? current.filter(item => item !== title)
      : [...current, title]);
  }

  function Navigation({ compact = false }: { compact?: boolean }) {
    return (
      <nav aria-label="OwenFX Studio 工作空间导航" className="admin-sidebar-nav">
        <Link
          href="/admin"
          title={compact ? overview.label : undefined}
          aria-current={isActivePath(pathname, '/admin') ? 'page' : undefined}
          className={`admin-sidebar-link ${isActivePath(pathname, '/admin') ? 'admin-sidebar-link-active' : ''}`}
        >
          <span className="admin-sidebar-icon" aria-hidden="true">{overview.icon}</span>
          <span className="admin-sidebar-link-label">{overview.label}</span>
        </Link>

        {navGroups.map(group => {
          const expanded = expandedGroups.includes(group.title);
          const hasActiveItem = group.items.some(item => item.href && isActivePath(pathname, item.href));

          return (
            <div className="admin-sidebar-group" key={group.title}>
              <button
                type="button"
                className={`admin-sidebar-group-toggle ${hasActiveItem ? 'admin-sidebar-group-active' : ''}`}
                onClick={() => toggleGroup(group.title)}
                aria-expanded={expanded}
                title={compact ? group.title : undefined}
              >
                <span className="admin-sidebar-group-short" aria-hidden="true">{group.short}</span>
                <span className="admin-sidebar-group-title">{group.title}</span>
                <span className="admin-sidebar-group-description">{group.description}</span>
                <span className="admin-sidebar-chevron" aria-hidden="true">{expanded ? '⌄' : '›'}</span>
              </button>

              {expanded && (
                <div className="admin-sidebar-group-items">
                  {group.items.map(item => item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={compact ? item.label : undefined}
                      aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                      className={`admin-sidebar-link ${isActivePath(pathname, item.href) ? 'admin-sidebar-link-active' : ''}`}
                    >
                      <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
                      <span className="admin-sidebar-link-label">{item.label}</span>
                    </Link>
                  ) : (
                    <span
                      key={item.label}
                      aria-disabled="true"
                      title={item.label + '（规划中）'}
                      className="admin-sidebar-link admin-sidebar-link-disabled"
                    >
                      <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
                      <span className="admin-sidebar-link-label">{item.label}</span>
                      <span className="admin-sidebar-planned">规划中</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  function Brand() {
    return (
      <div className="admin-brand-header">
        <Link href="/admin" className="admin-brand text-xl font-bold tracking-tight md:text-2xl" style={{ color: 'var(--text-primary)' }}>
          <span className="admin-brand-owen">Owe</span><span className="admin-brand-n">n</span><span className="admin-brand-f">F</span><span className="admin-brand-x">X</span>{' '}
          <span className="admin-gradient-text admin-brand-studio">Studio</span>
        </Link>
      </div>
    );
  }

  function Footer() {
    return (
      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-sidebar-link" >
          <span className="admin-gradient-text font-semibold tracking-wide">BLOG »</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="admin-glass-nav fixed inset-x-0 top-0 z-50">
        <header className="h-14 flex items-center px-4 md:px-6">
          <div className="flex items-center gap-2">
          <button
            type="button"
            className="admin-nav-icon-btn"
            aria-label={mobileOpen ? '关闭管理菜单' : '打开管理菜单'}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-navigation"
            onClick={() => setMobileOpen(value => !value)}
          >
            <svg className="admin-six-star-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 20 17H4L12 3Z" />
              <path d="M12 21 4 7h16l-8 14Z" />
            </svg>
          </button>
          <AdminThemeToggle />
          </div>
        </header>
      </div>

      {mobileOpen && (
        <div className="admin-sidebar-mobile-overlay">
          <button
            type="button"
            className="admin-sidebar-mobile-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭管理菜单"
          />
          <aside id="admin-mobile-navigation" className="admin-sidebar admin-sidebar-mobile-panel">
            <div className="admin-sidebar-brand-row">
              <Brand />
              <button
                type="button"
                className="admin-sidebar-collapse"
                onClick={() => setMobileOpen(false)}
                aria-label="关闭菜单"
              >
                ×
              </button>
            </div>
            <Navigation />
            <Footer />
          </aside>
        </div>
      )}
    </>
  );
}
