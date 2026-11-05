'use client'

import Link from 'next/link'

export default function BookmarksPage() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <p className="text-sm text-[var(--text-tertiary)]">Library</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">我的收藏</h1>
      </div>

      <div
        className="rounded-2xl border border-[var(--border-color)] p-10 text-center"
        style={{ background: 'var(--bg-glass)' }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[.04]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-[var(--text-tertiary)]">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-[var(--text-primary)]">还没有收藏</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          登录后点击文章或软件详情页的收藏按钮，即可保存到这里。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/articles"
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            去看文章
          </Link>
          <Link
            href="/software"
            className="rounded-xl border border-[var(--border-color)] bg-white/[.04] px-5 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-white/[.07]"
          >
            浏览软件
          </Link>
        </div>
      </div>
    </div>
  )
}
