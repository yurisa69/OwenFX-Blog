import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '分类 — OwenFX' };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: software }] = await Promise.all([
    supabase.from('categories').select('id,name,slug,sort_order')
      .eq('kind', 'software').eq('active', true)
      .order('sort_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('software').select('category_id').eq('status', 'published')
      .or('published_at.is.null,published_at.lte.' + new Date().toISOString()),
  ]);
  const counts = new Map<string, number>();
  for (const item of software || []) {
    if (item.category_id) counts.set(item.category_id, (counts.get(item.category_id) || 0) + 1);
  }
  const visibleCategories = (categories || [])
    .map(category => ({ ...category, count: counts.get(category.id) || 0 }))
    .filter(category => category.count > 0);

  return (
    <div className="animate-fade-in py-8">
      <h1 className="text-2xl font-bold mb-6">分类</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCategories.map((category, index) => (
          <Link key={category.id} href="/software" className="uiverse-card p-6 text-center" style={{ animationDelay: index * 80 + 'ms' }}>
            <h2 className="text-lg font-semibold mb-1">{category.name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{category.count} 个软件</p>
          </Link>
        ))}
        {visibleCategories.length === 0 && <p className="col-span-full py-8 text-center text-sm opacity-70">暂无已发布的软件分类。</p>}
      </div>
    </div>
  );
}
