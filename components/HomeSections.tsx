'use client';

import Link from 'next/link';
import { categoryColors } from '@/lib/mock';
import { sortTagsByLength } from '@/lib/tag-utils';
import type { Article } from '@/lib/mock-articles';
import type { Software } from '@/lib/types';

export default function HomeSections({ articles, featured }: { articles: Article[]; featured: Software[] }) {
  return (
    <>
      <section className="pb-14">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">最新文章<span className="w-3 h-3 rounded-full" style={{background:'#28c840'}}></span></h2>
          <Link href="/articles" className="text-sm" style={{ color: 'var(--accent)' }}>查看全部</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a, i) => (
            <Link key={a.id} href={'/articles/' + a.id} className="rounded-2xl border border-[var(--border-color)] p-5" style={{ background: 'var(--bg-glass)' }}>
              <span className="text-xs font-medium rounded-full px-2 py-0.5 mb-3 inline-block" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{a.category}</span>
              <h3 className="font-semibold mb-2 line-clamp-2">{a.title}</h3>
              <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.createdAt}</div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="pb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">精选推荐<span className="w-3 h-3 rounded-full" style={{background:'#a855f7'}}></span></h2>
            <Link href="/software" className="text-sm" style={{ color: 'var(--accent)' }}>查看全部</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((s) => (
              <Link key={s.id} href={'/software/' + s.id} className="rounded-2xl border border-[var(--border-color)] p-5" style={{ background: 'var(--bg-glass)' }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-base truncate">{s.title}</h3>
                  <span className="shrink-0 ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{s.category}</span>
                </div>
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                <div className="flex flex-wrap gap-1">{sortTagsByLength(s.tags).slice(0, 3).map((t) => (<span key={t} className="px-1.5 py-[2px] text-[11px] rounded-full" style={{ background: 'var(--bg-tertiary, #1e293b)', color: 'var(--text-secondary)' }}>{t}</span>))}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
