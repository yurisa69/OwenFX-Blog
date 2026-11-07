'use client'

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
        <circle cx="6.5" cy="6.5" r="3.5" />
        <path d="M17.5 10.2 14.2 7.1a2.2 2.2 0 0 1 3.3-2.9 2.2 2.2 0 0 1 3.3 2.9l-3.3 3.1Z" />
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 md:hidden pointer-events-none">
      <nav className="pointer-events-auto mx-auto flex max-w-md items-center justify-around rounded-2xl border border-[var(--border-color)] bg-[var(--bg-glass)] px-1 py-2 shadow-[0_8px_32px_rgba(0,0,0,.35)] backdrop-blur-xl">
        {tabs.map(({ href, label, icon }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] transition ${
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
    </div>
  )
}
