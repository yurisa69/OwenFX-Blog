import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatChineseDate } from '@/lib/date';
import Pagination from '@/components/Pagination';

export const metadata = { title: '文章 — OwenFX' };

const PAGE_SIZE = 12;

function normalizeSearch(value: string | undefined) {
  return (value || '').replace(/[,%_()\\"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = normalizeSearch(params.q);
  const requestedPage = Math.min(10000, Math.max(1, Number.parseInt(params.page || '1', 10) || 1));
  const supabase = await createClient();

  let request = supabase.from('articles')
    .select('id,title,slug,excerpt,published_at,created_at', { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  if (query) {
    request = request.or('title.ilike.%' + query + '%,excerpt.ilike.%' + query + '%');
  }

  let { data, count, error } = await request.range(
    (requestedPage - 1) * PAGE_SIZE,
    requestedPage * PAGE_SIZE - 1,
  );

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  if (count && currentPage !== requestedPage) {
    const corrected = await request.range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);
    data = corrected.data;
    error = corrected.error;
  }
  const paginationQuery: Record<string, string> = query ? { q: query } : {};

  return (
    <main className="py-8">
      <h1 className="mb-2 text-2xl font-bold">文章</h1>
      <p className="mb-6 text-sm opacity-70">软件介绍、使用教程与技术分享。</p>

      <form action="/articles" method="get" className="mb-6 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={80}
          placeholder="搜索文章标题或摘要"
          aria-label="搜索文章标题或摘要"
          className="admin-input min-w-0 flex-1 sm:max-w-md"
        />
        <button type="submit" className="uiverse-btn uiverse-btn-primary !px-5">搜索</button>
        {query ? <Link href="/articles" className="uiverse-btn uiverse-btn-ghost !px-4">清除</Link> : null}
      </form>

      {error ? (
        <div className="uiverse-card p-6 text-sm opacity-70">暂时无法加载文章，请稍后再试。</div>
      ) : !data?.length ? (
        <div className="uiverse-card p-6 text-sm opacity-70">{query ? '没有找到匹配的文章。' : '文章正在整理中，敬请期待。'}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(article => (
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

      {!error && count ? (
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/articles" query={paginationQuery} />
      ) : null}
    </main>
  );
}
