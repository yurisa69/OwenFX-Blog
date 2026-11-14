import { createClient } from '@/lib/supabase/server';
import SoftwareLibrary from '@/components/SoftwareLibrary';
import Pagination from '@/components/Pagination';

export const metadata = {
  title: '软件库 — OwenFX',
  description: '浏览免费与开源软件，按分类及平台查找所需工具。',
};

const PAGE_SIZE = 20;

export default async function SoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page || '1', 10);
  let currentPage = Number.isFinite(requestedPage) ? Math.min(100000, Math.max(1, requestedPage)) : 1;
  const requestedCategory = (params.category || '').trim();
  const supabase = await createClient();

  const { data: categories, error: categoryError } = await supabase.from('categories')
    .select('id,name,slug')
    .eq('kind', 'software')
    .order('name');

  if (categoryError) throw new Error('软件分类读取失败');

  const activeCategory = (categories || []).find(category => category.slug === requestedCategory) || null;
  const buildQuery = () => {
    let query = supabase.from('software')
      .select('id,title,slug,description,developer,version,platform,image_url,category:categories!software_category_id_fkey(name,slug),tags:software_tags(tag:tags(name))', { count: 'exact' })
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('updated_at', { ascending: false });

    if (activeCategory) query = query.eq('category_id', activeCategory.id);
    return query;
  };

  const { data, count, error } = await buildQuery().range(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE - 1,
  );

  if (error) throw new Error('软件列表读取失败');

  const items = (data || []).map((item) => ({
    ...item,
    category: Array.isArray(item.category) ? item.category[0] || null : item.category,
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  let pageItems = items;
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
    const corrected = await buildQuery().range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);
    if (corrected.error) throw new Error('软件列表读取失败');
    pageItems = (corrected.data || []).map(item => ({
      ...item,
      category: Array.isArray(item.category) ? item.category[0] || null : item.category,
    }));
  }

  return (
    <main className="py-8">
      <h1 className="mb-2 text-2xl font-bold">软件库</h1>
      <p className="mb-6 text-sm opacity-70">浏览免费与开源软件</p>
      <SoftwareLibrary items={pageItems} categories={categories || []} activeCategory={activeCategory?.slug || 'all'} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/software"
        query={activeCategory ? { category: activeCategory.slug } : {}}
      />
      {total > 0 && <p className="mt-3 text-center text-xs text-[var(--text-tertiary)]">共 {total} 款软件 · 第 {currentPage} / {totalPages} 页</p>}
    </main>
  );
}
