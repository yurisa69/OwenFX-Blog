import { Suspense } from 'react';
import Carousel from '@/components/Carousel';
import HomeSections from '@/components/HomeSections';
import { formatChineseDate } from '@/lib/date';
import { createClient } from '@/lib/supabase/server';

async function HomeContent() {
  const supabase = await createClient();
  const [{ data: software }, { data: articleRows }] = await Promise.all([
    supabase.from('software')
      .select('id,title,slug,description,version,platform,image_url,developer')
      .eq('status', 'published')
      .eq('featured', true)
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('featured_order', { ascending: true })
      .order('updated_at', { ascending: false }).limit(18),
    supabase.from('articles')
      .select('id,title,excerpt,published_at,created_at,categories(name)')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false }).limit(8),
  ]);

  const articles = (articleRows || []).map((article: any) => ({
    id: article.id,
    title: article.title,
    category: article.categories?.name || '文章',
    description: article.excerpt || '',
    createdAt: formatChineseDate(article.published_at || article.created_at),
  }));

  return <HomeSections articles={articles} featured={software ?? []} />;
}

function HomeContentFallback() {
  return (
    <div aria-label="正在加载首页内容" aria-busy="true" className="space-y-10 pb-10">
      <section className="pb-4">
        <div className="mb-5 h-6 w-28 rounded-md bg-[var(--bg-tertiary)] opacity-70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="uiverse-card min-h-36 animate-pulse p-5">
              <div className="mb-4 h-5 w-16 rounded-full bg-[var(--bg-tertiary)]" />
              <div className="mb-3 h-4 w-4/5 rounded bg-[var(--bg-tertiary)]" />
              <div className="h-3 w-full rounded bg-[var(--bg-tertiary)] opacity-70" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-5 h-6 w-28 rounded-md bg-[var(--bg-tertiary)] opacity-70" />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="uiverse-card flex min-h-36 flex-col items-center justify-center gap-3 p-4">
              <div className="h-[76px] w-[76px] animate-pulse rounded-[22px] bg-[var(--bg-tertiary)]" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--bg-tertiary)]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="pt-6 md:pt-9">
      <Carousel />
      <Suspense fallback={<HomeContentFallback />}>
        <HomeContent />
      </Suspense>
      <footer className="text-center py-8 text-sm border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)' }}>
        <p>OwenFX © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
