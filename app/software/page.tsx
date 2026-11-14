import { createClient } from '@/lib/supabase/server';
import SoftwareLibrary from '@/components/SoftwareLibrary';

export const metadata = {
  title: '软件库 — OwenFX',
  description: '浏览免费与开源软件，按分类及平台查找所需工具。',
};

export default async function SoftwarePage() {
  const supabase = await createClient();
  const { data } = await supabase.from('software')
    .select('id,title,slug,description,developer,version,platform,image_url,category:categories!software_category_id_fkey(name,slug),tags:software_tags(tag:tags(name))')
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('updated_at', { ascending: false })
    .limit(100);

  const items = (data || []).map((item) => ({
    ...item,
    category: Array.isArray(item.category) ? item.category[0] || null : item.category,
  }));

  return (
    <main className="py-8">
      <h1 className="mb-2 text-2xl font-bold">软件库</h1>
      <p className="mb-6 text-sm opacity-70">浏览免费与开源软件</p>
      <SoftwareLibrary items={items} />
    </main>
  );
}
