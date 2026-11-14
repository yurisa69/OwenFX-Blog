'use client';

import Link from 'next/link';

type HomeArticle = { id: string; title: string; category: string; description: string; createdAt: string };
interface HomeSectionProps { articles: HomeArticle[]; }

export default function HomeSections({ articles }: HomeSectionProps) {
  return <>
    <section className="pb-14">
      <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold md:text-xl">最新文章<span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} /></h2><Link href="/articles" className="text-sm" style={{ color: 'var(--accent)' }}>查看全部</Link></div>
      {articles.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{articles.map((article, index) => <Link key={article.id} href={'/articles/' + article.id} className="uiverse-card animate-fade-in p-5" style={{ animationDelay: index * 80 + 'ms' }}>
        <span className="mb-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{article.category}</span>
        <h3 className="mb-2 line-clamp-2 font-semibold">{article.title}</h3><p className="mb-3 line-clamp-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{article.description}</p><span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>{article.createdAt}</span>
      </Link>)}</div> : <div className="uiverse-card p-5 text-sm opacity-60">暂无已发布文章。</div>}
    </section>

  </>;
}
