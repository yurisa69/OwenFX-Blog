import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatChineseDate } from '@/lib/date';

export const metadata = { title: '文章 — OwenFX' };

type ArticlesPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const { category: categorySlug } = await searchParams;
  const supabase = await createClient();

  const { data: selectedCategory } = categorySlug
    ? await supabase.from('categories').select('id,name,slug')
      .eq('kind', 'article').eq('active', true).eq('slug', categorySlug).maybeSingle()
    : { data: null };

  let articlesQuery = supabase.from('articles').select('id,title,slug,excerpt,published_at,created_at')
    .eq('status', 'published').lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).limit(100);

  if (selectedCategory) articlesQuery = articlesQuery.eq('category_id', selectedCategory.id);

  const { data } = await articlesQuery;

  return (
    <main className="py-8">
      <h1 className="mb-2 text-2xl font-bold">{selectedCategory?.name || '文章'}</h1>
      <p className="mb-6 text-sm opacity-70">
        {selectedCategory ? '该分类下的文章。' : '软件介绍、使用教程与技术分享。'}
      </p>
      {!data?.length ? (
        <div className="uiverse-card p-6 text-sm opacity-70">暂无已发布的文章。</div>
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
    </main>
  );
}
