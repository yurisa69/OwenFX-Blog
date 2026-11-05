'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '首页', icon: 'M3 10.5 12 3l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9' },
  { href: '/categories', label: '分类', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  { href: '/bookmarks', label: '收藏', icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
  { href: '/about', label: '我的', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 3.6-7 8-7s8 3 8 7' },
] as const

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 lg:hidden pointer-events-none">
      <nav className="pointer-events-auto mx-auto flex max-w-md items-center justify-around rounded-2xl border border-[var(--border-color)] bg-[var(--bg-glass)] px-1 py-2 shadow-[0_8px_32px_rgba(0,0,0,.35)] backdrop-blur-xl">
        {tabs.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] transition ${
                active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d={icon} />
              </svg>
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
