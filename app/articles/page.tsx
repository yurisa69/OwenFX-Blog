import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatChineseDate } from '@/lib/date';
import Pagination from '@/components/Pagination';

export const metadata = { title: '文章 — OwenFX' };

const PAGE_SIZE = 12;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page || '1', 10);
  let currentPage = Number.isFinite(requestedPage) ? Math.min(100000, Math.max(1, requestedPage)) : 1;
  const supabase = await createClient();
  const { data, count, error } = await supabase.from('articles')
    .select('id,title,slug,excerpt,published_at,created_at', { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

  if (error) throw new Error('文章列表读取失败');

  const total = count || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  let pageRows = data || [];
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
    const corrected = await supabase.from('articles')
      .select('id,title,slug,excerpt,published_at,created_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);
    if (corrected.error) throw new Error('文章列表读取失败');
    pageRows = corrected.data || [];
  }

  return (
    <main className="py-8">
      <h1 className="mb-2 text-2xl font-bold">文章</h1>
      <p className="mb-6 text-sm opacity-70">软件介绍、使用教程与技术分享。</p>
      {!pageRows.length ? (
        <div className="uiverse-card p-6 text-sm opacity-70">文章正在整理中，敬请期待。</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageRows.map(article => (
            <Link key={article.id} href={'/articles/' + article.id} className="uiverse-card p-5">
              <h2 className="font-semibold">{article.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm opacity-70">{article.excerpt}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs opacity-50">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
                <span>{formatChineseDate(article.published_at || article.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/articles" />
      {total > 0 && <p className="mt-3 text-center text-xs text-[var(--text-tertiary)]">共 {total} 篇文章 · 第 {currentPage} / {totalPages} 页</p>}
    </main>
  );
}
