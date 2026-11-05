'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/mock-articles';

interface HomeSectionProps {
  articles: Article[];
  featured: { id: string; title: string; slug: string; description: string | null; version: string | null; platform: string | null; image_url: string | null; developer: string | null }[];
}
const PAGE_SIZE = 6;

export default function HomeSections({ articles, featured }: HomeSectionProps) {
  const [fp, setFp] = useState(0);
  const totalPages = Math.max(1, Math.ceil(featured.length / PAGE_SIZE));
  return (
    <>
      <section className="pb-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold md:text-xl">最新文章<span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} /></h2>
          <Link href="/articles" className="text-sm" style={{ color: 'var(--accent)' }}>查看全部</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((a, i) => (
            <Link key={a.id} href={'/articles/' + a.id} className="uiverse-card animate-fade-in p-5" style={{ animationDelay: i * 80 + 'ms' }}>
              <span className="mb-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{a.category}</span>
              <h3 className="mb-2 line-clamp-2 font-semibold">{a.title}</h3>
              <p className="mb-3 line-clamp-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}><span>{a.createdAt}</span></div>
            </Link>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section className="pb-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold md:text-xl">精选软件<span className="h-3 w-3 rounded-full" style={{ background: '#a855f7' }} /></h2>
            <Link href="/software" className="text-sm" style={{ color: 'var(--accent)' }}>查看全部</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featured.slice(fp * PAGE_SIZE, (fp + 1) * PAGE_SIZE).map((s, i) => (
              <Link key={s.id} href={'/software/' + s.slug} className="uiverse-card animate-fade-in flex flex-col items-center p-4 text-center" style={{ animationDelay: i * 80 + 'ms' }}>
                <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl" style={{ background: 'var(--bg-tertiary)' }}>
                  {s.image_url ? <img src={s.image_url} alt={s.title + ' 图标'} className="h-full w-full object-cover" /> : <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{s.title.slice(0, 1)}</span>}
                </div>
                <h3 className="truncate text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{s.description || s.developer || s.platform || '查看软件详情'}</p>
                {s.version && <span className="mt-2 text-[11px] opacity-60">{s.version}</span>}
              </Link>
            ))}
          </div>
          {totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-2">
            <button aria-label="上一页" onClick={() => setFp(p => Math.max(0, p - 1))} disabled={fp === 0} className="h-8 w-8 rounded-full" style={{ color: 'var(--text-secondary)' }}>«</button>
            {Array.from({ length: totalPages }, (_, i) => <button key={i} onClick={() => setFp(i)} className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium" style={fp === i ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : { color: 'var(--text-tertiary)' }}>{i + 1}</button>)}
            <button aria-label="下一页" onClick={() => setFp(p => Math.min(totalPages - 1, p + 1))} disabled={fp === totalPages - 1} className="h-8 w-8 rounded-full" style={{ color: 'var(--text-secondary)' }}>»</button>
          </div>}
        </section>
      )}
    </>
  );
}
