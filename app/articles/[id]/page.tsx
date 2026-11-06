import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ArticleContent from '@/components/ArticleContent';
import ArticleSupport from '@/components/ArticleSupport';

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase.from('articles').select('id,title,excerpt,content_markdown,published_at,created_at')
    .eq('id', id).eq('status', 'published').lte('published_at', new Date().toISOString()).maybeSingle();
  if (!article) notFound();
  return <article className="mx-auto max-w-3xl py-8"><div className="uiverse-card p-5 sm:p-7">
    <h1 className="text-2xl font-bold sm:text-3xl">{article.title}</h1>
    <p className="mb-6 mt-3 text-xs opacity-60">{new Date(article.published_at || article.created_at).toLocaleDateString('zh-CN')}</p>
    {article.excerpt && <p className="mb-6 text-sm leading-7 opacity-75">{article.excerpt}</p>}
    <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}><ArticleContent content={article.content_markdown || ''} /></div>
    <ArticleSupport className="mt-8" />
  </div></article>;
}
