import { mockArticles } from '@/lib/mock-articles';
import Link from 'next/link';
export const metadata = { title: '文章 — OwenFX' };
export default function ArticlesPage() {
  return (
    <div className="animate-fade-in py-8">
      <h1 className="text-2xl font-bold mb-2">文章</h1>
      <p className="text-sm mb-6" style={{color:'var(--text-secondary)'}}>软件推荐、使用教程与技术分享</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockArticles.map((a, i) => (
          <Link key={a.id} href={'/articles/' + a.id} className="rounded-2xl border border-[var(--border-color)] p-5 transition hover:border-[var(--accent)]" style={{ background:'var(--bg-glass)', animationDelay: i * 80 + 'ms' }}>
            <span className="text-xs font-medium rounded-full px-2 py-0.5 mb-3 inline-block" style={{background:'var(--accent-bg)', color:'var(--accent)'}}>{a.category}</span>
            <h2 className="font-semibold mb-2 line-clamp-2">{a.title}</h2>
            <p className="text-sm mb-3 line-clamp-2" style={{color:'var(--text-secondary)'}}>{a.excerpt}</p>
            <div className="flex items-center gap-3 text-xs" style={{color:'var(--text-tertiary)'}}><span>{a.createdAt}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
