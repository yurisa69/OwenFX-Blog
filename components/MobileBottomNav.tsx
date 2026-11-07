'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: '首页',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    href: '/software',
    label: '软件',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8.5h12l1.1 11a1.5 1.5 0 0 1-1.5 1.5H6.4a1.5 1.5 0 0 1-1.5-1.5L6 8.5Z" />
        <path d="M9 8.5V6a3 3 0 0 1 6 0v2.5" />
        <path d="m9 13 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/categories',
    label: '分类',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="17.5" cy="6.5" r="3.5" />
        <path d="M6.5 10.2 9.8 7.1a2.2 2.2 0 0 0-3.3-2.9 2.2 2.2 0 0 0-3.3 2.9l3.3 3.1Z" />
        <path d="M6.5 14 10 21H3L6.5 14Z" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: '我的',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
] as const

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (!expanded) return
    const timeout = window.setTimeout(() => setExpanded(false), 3000)
    return () => window.clearTimeout(timeout)
  }, [expanded, pathname])

  return (
    <div className="pointer-events-none fixed right-3 top-1/2 z-40 -translate-y-1/2 md:hidden">
      <nav
        aria-label="移动端主导航"
        className={`pointer-events-auto absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-glass)] px-1 py-2 backdrop-blur-[24px] transition-all duration-300 ease-out ${
          expanded
            ? 'translate-x-0 scale-100 opacity-100'
            : 'pointer-events-none translate-x-4 scale-95 opacity-0'
        }`}
        aria-hidden={!expanded}
      >
        {tabs.map(({ href, label, icon }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              tabIndex={expanded ? 0 : -1}
              className={`flex w-14 flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[11px] transition ${
                active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span className={active ? 'scale-105' : ''}>{icon}</span>
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        aria-label={expanded ? '收起导航菜单' : '展开导航菜单'}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        tabIndex={expanded ? -1 : 0}
        className={`pointer-events-auto absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--text-secondary)] shadow-[0_8px_28px_rgba(0,0,0,.2)] backdrop-blur-[24px] transition-all duration-300 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
          expanded
            ? 'pointer-events-none translate-x-4 scale-90 opacity-0'
            : 'translate-x-0 scale-100 opacity-100'
        }`}
      >
        <svg
          className={`h-6 w-6 ${expanded ? '' : 'animate-[spin_8s_linear_infinite] motion-reduce:animate-none'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2.8 14 4l2.2-.2 1.1 2.1 2 1.1-.2 2.2 1.2 2.8-1.2 2.8.2 2.2-2 1.1-1.1 2.1L14 20l-2 1.2L10 20l-2.2.2-1.1-2.1-2-1.1.2-2.2L3.7 12l1.2-2.8-.2-2.2 2-1.1 1.1-2.1L10 4l2-1.2Z" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      </button>
    </div>
  )
}
