import { createClient } from '@/lib/supabase/server';
import SoftwareLibrary from '@/components/SoftwareLibrary';

export const metadata = {
  title: '软件库 — OwenFX',
  description: '精选免费与开源软件，按工具、多媒体、开发工具、系统增强及平台分类浏览。',
};

const PAGE_SIZE = 20;

function normalizeSearch(value: string | undefined) {
  return (value || '').replace(/[,%_()\\"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export default async function SoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = normalizeSearch(params.q);
  const category = (params.category || '').trim().slice(0, 80);
  const tag = (params.tag || '').trim().slice(0, 80);
  const requestedPage = Math.min(10000, Math.max(1, Number.parseInt(params.page || '1', 10) || 1));
  const supabase = await createClient();

  const [{ data: categoryRows }, { data: tagRows }] = await Promise.all([
    supabase.from('categories').select('name,slug').order('name'),
    supabase.from('tags').select('name,slug').eq('active', true).order('name'),
  ]);

  let matchingSoftwareIds: string[] | null = null;
  let tagLookupFailed = false;
  if (tag) {
    const { data: tagLinks, error: tagError } = await supabase
      .from('software_tags')
      .select('software_id,tags!inner(slug,active)')
      .eq('tags.slug', tag)
      .eq('tags.active', true);

    tagLookupFailed = Boolean(tagError);
    matchingSoftwareIds = tagError ? [] : [...new Set((tagLinks || []).map(link => link.software_id))];
  }

  let data: any[] = [];
  let count = 0;
  let error: { message: string } | null = tagLookupFailed ? { message: '标签筛选暂时不可用' } : null;

  if (matchingSoftwareIds === null || matchingSoftwareIds.length > 0) {
    let request = supabase.from('software')
      .select('id,title,slug,description,developer,version,platform,image_url,featured,category:categories!software_category_id_fkey(name,slug),tags:software_tags(tag:tags(name,slug))', { count: 'exact' })
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('featured_order', { ascending: true })
      .order('updated_at', { ascending: false });

    request = request.or('published_at.is.null,published_at.lte.' + new Date().toISOString());
    if (query) {
      request = request.or('title.ilike.%' + query + '%,description.ilike.%' + query + '%,developer.ilike.%' + query + '%');
    }
    if (category) request = request.eq('category.slug', category);
    if (matchingSoftwareIds) request = request.in('id', matchingSoftwareIds);

    const result = await request.range(
      (requestedPage - 1) * PAGE_SIZE,
      requestedPage * PAGE_SIZE - 1,
    );
    data = result.data || [];
    count = result.count || 0;
    error = result.error;
    const lastPage = Math.max(1, Math.ceil(count / PAGE_SIZE));
    if (count && requestedPage > lastPage) {
      const corrected = await request.range((lastPage - 1) * PAGE_SIZE, lastPage * PAGE_SIZE - 1);
      data = corrected.data || [];
      error = corrected.error;
    }
  }

  const items = data.map((item) => ({
    ...item,
    category: Array.isArray(item.category) ? item.category[0] || null : item.category,
  }));

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  return (
    <main className="py-8">
      <h1 className="mb-2 text-2xl font-bold">软件库</h1>
      <p className="mb-6 text-sm opacity-70">精选免费与开源软件</p>
      <SoftwareLibrary
        items={items}
        categories={categoryRows || []}
        tags={tagRows || []}
        query={query}
        activeCategory={category}
        activeTag={tag}
        currentPage={currentPage}
        totalPages={totalPages}
        error={Boolean(error)}
      />
    </main>
  );
}
