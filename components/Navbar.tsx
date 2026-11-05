'use client'

import Link from 'next/link'
import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

const links = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/articles' },
  { label: '软件', href: '/software' },
  { label: '分类', href: '/categories' },
  { label: '关于', href: '/about' },
]

type NavUser = { id: string; name: string; email?: string | null; avatar_url: string | null } | null

export default function Navbar({ initialUser = null }: { initialUser?: NavUser }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-50 h-14">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-1.5 text-[var(--text-secondary)]" onClick={() => setOpen(true)} aria-label="菜单">☰</button>
          <Link href="/" className="text-lg font-semibold"><span className="gradient-text">OwenFX</span></Link>
        </div>
        <nav className="hidden lg:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {initialUser ? (
            <span className="text-sm text-[var(--text-secondary)]">{initialUser.name}</span>
          ) : (
            <Link href="/login" className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white">登录</Link>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(80vw,300px)] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-5">
            <div className="mb-6 flex justify-between items-center">
              <span className="font-semibold">导航</span>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="space-y-1">
              {links.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-[var(--text-secondary)] hover:bg-white/5">{l.label}</Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </header>
  )
}
