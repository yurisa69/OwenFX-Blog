import { createClient } from '@/lib/supabase/server';
import SoftwareLibrary from '@/components/SoftwareLibrary';

export const metadata = {
  title: '软件库 — OwenFX',
  description: '精选免费与开源软件，按工具、多媒体、开发工具、系统增强及平台分类浏览。',
};

export default async function SoftwarePage() {
  const supabase = await createClient();
  const { data } = await supabase.from('software')
    .select('id,title,slug,description,developer,version,platform,image_url,featured,category:categories!software_category_id_fkey(name,slug)')
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('featured', { ascending: false })
    .order('featured_order', { ascending: true })
    .order('updated_at', { ascending: false })
    .limit(100);

  const items = (data || []).map((item) => ({
    ...item,
    category: Array.isArray(item.category) ? item.category[0] || null : item.category,
  }));

  return (
    <main className="py-8">
      <h1 className="mb-2 text-2xl font-bold">软件库</h1>
      <p className="mb-6 text-sm opacity-70">精选免费与开源软件</p>
      <SoftwareLibrary items={items} />
      <p className="mt-6 text-xs opacity-50">OwenFX 仅提供软件介绍与官方下载、网盘资源入口，不托管软件安装包。</p>
    </main>
  );
}
