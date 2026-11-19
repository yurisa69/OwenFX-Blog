import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '分类 — OwenFX' };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: software }, { data: articles }] = await Promise.all([
    supabase.from('categories').select('id,name,slug,kind,sort_order')
      .eq('active', true)
      .in('kind', ['software', 'article'])
      .order('sort_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('software').select('category_id').eq('status', 'published')
      .or('published_at.is.null,published_at.lte.' + new Date().toISOString()),
    supabase.from('articles').select('category_id').eq('status', 'published')
      .lte('published_at', new Date().toISOString()),
  ]);

  const softwareCounts = new Map<string, number>();
  for (const item of software || []) {
    if (item.category_id) softwareCounts.set(item.category_id, (softwareCounts.get(item.category_id) || 0) + 1);
  }

  const articleCounts = new Map<string, number>();
  for (const item of articles || []) {
    if (item.category_id) articleCounts.set(item.category_id, (articleCounts.get(item.category_id) || 0) + 1);
  }

  const softwareCategories = (categories || [])
    .filter(category => category.kind === 'software')
    .map(category => ({ ...category, count: softwareCounts.get(category.id) || 0 }));
  const articleCategories = (categories || [])
    .filter(category => category.kind === 'article')
    .map(category => ({ ...category, count: articleCounts.get(category.id) || 0 }));

  return (
    <div className="animate-fade-in py-8">
      <h1 className="mb-8 text-2xl font-bold">分类</h1>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">软件分类</h2>
          <span className="text-xs opacity-60">{softwareCategories.length} 个分类</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {softwareCategories.map(category => (
            <Link
              key={category.id}
              href={`/software?category=${encodeURIComponent(category.slug)}`}
              className="uiverse-card p-6 text-center"
            >
              <h3 className="mb-1 text-lg font-semibold">{category.name}</h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{category.count} 个软件</p>
            </Link>
          ))}
          {softwareCategories.length === 0 && <p className="col-span-full py-6 text-center text-sm opacity-70">暂无软件分类。</p>}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">文章分类</h2>
          <span className="text-xs opacity-60">{articleCategories.length} 个分类</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articleCategories.map(category => (
            <Link
              key={category.id}
              href={`/articles?category=${encodeURIComponent(category.slug)}`}
              className="uiverse-card p-6 text-center"
            >
              <h3 className="mb-1 text-lg font-semibold">{category.name}</h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{category.count} 篇文章</p>
            </Link>
          ))}
          {articleCategories.length === 0 && <p className="col-span-full py-6 text-center text-sm opacity-70">暂无文章分类。</p>}
        </div>
      </section>
    </div>
  );
}
