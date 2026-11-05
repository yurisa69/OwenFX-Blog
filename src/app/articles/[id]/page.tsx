import { getArticle } from '@/lib/mock-articles';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = getArticle(id);
  if (!article) notFound();

  return (
    <div className="py-8 max-w-3xl">
      <Link href="/articles" className="text-sm text-[var(--accent)] mb-4 inline-block">← 返回文章列表</Link>
      <span className="text-xs font-medium rounded-full px-2 py-0.5 mb-3 inline-block" style={{background:'var(--accent-bg)', color:'var(--accent)'}}>{article.category}</span>
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">{article.title}</h1>
      <div className="flex items-center gap-3 text-sm mb-8" style={{color:'var(--text-tertiary)'}}>
        <span>{article.createdAt}</span>
        {article.readingTime && <span>· {article.readingTime} 分钟阅读</span>}
      </div>
      <div className="prose prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed">
        <p>{article.excerpt}</p>
        {article.content && <div className="mt-6 whitespace-pre-wrap">{article.content}</div>}
      </div>
    </div>
  );
}
