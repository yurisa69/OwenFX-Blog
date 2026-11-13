'use client';

import { useState } from 'react';
import Link from 'next/link';

type HomeArticle = { id: string; title: string; category: string; description: string; createdAt: string };
type FeaturedSoftware = { id: string; title: string; slug: string; description: string | null; version: string | null; platform: string | null; image_url: string | null; developer: string | null };
interface HomeSectionProps { articles: HomeArticle[]; featured: FeaturedSoftware[]; }
const PAGE_SIZE = 6;

export default function HomeSections({ articles, featured }: HomeSectionProps) {
  const [fp, setFp] = useState(0);
  const totalPages = Math.max(1, Math.ceil(featured.length / PAGE_SIZE));
  return <>
    <section className="pb-14">
      <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold md:text-xl">最新文章<span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} /></h2><Link href="/articles" className="text-sm" style={{ color: 'var(--accent)' }}>查看全部</Link></div>
      {articles.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{articles.map((article, index) => <Link key={article.id} href={'/articles/' + article.id} className="uiverse-card animate-fade-in p-5" style={{ animationDelay: index * 80 + 'ms' }}>
        <span className="mb-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{article.category}</span>
        <h3 className="mb-2 line-clamp-2 font-semibold">{article.title}</h3><p className="mb-3 line-clamp-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{article.description}</p><span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>{article.createdAt}</span>
      </Link>)}</div> : <div className="uiverse-card p-5 text-sm opacity-60">暂无已发布文章。</div>}
    </section>
    {featured.length > 0 && <section className="pb-10">
      <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold md:text-xl">精选推荐<span className="h-3 w-3 rounded-full" style={{ background: '#a855f7' }} /></h2><Link href="/software" className="text-sm" style={{ color: 'var(--accent)' }}>查看全部</Link></div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {featured.slice(fp * PAGE_SIZE, (fp + 1) * PAGE_SIZE).map((item, index) => <Link key={item.id} href={'/software/' + item.slug} aria-label={'查看' + item.title + '软件详情'} className="uiverse-card animate-fade-in flex min-h-36 flex-col items-center justify-center gap-3 p-4 text-center transition hover:-translate-y-1" style={{ animationDelay: index * 80 + 'ms' }}>
          <div className="software-icon-frame flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[22px] shadow-sm">
            {item.image_url ? <img src={item.image_url} alt={item.title + ' 官方图标'} width={76} height={76} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{item.title.slice(0, 1)}</span>}
          </div>
          <h3 className="w-full truncate text-sm font-semibold">{item.title}</h3>
        </Link>)}
      </div>
      {totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-2"><button aria-label="上一页" disabled={fp === 0} onClick={() => setFp(page => Math.max(0, page - 1))}>«</button>{Array.from({ length: totalPages }, (_, index) => <button key={index} onClick={() => setFp(index)} className="h-8 w-8 rounded-full text-xs" style={fp === index ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : { color: 'var(--text-tertiary)' }}>{index + 1}</button>)}<button aria-label="下一页" disabled={fp === totalPages - 1} onClick={() => setFp(page => Math.min(totalPages - 1, page + 1))}>»</button></div>}
    </section>}
  </>;
}
