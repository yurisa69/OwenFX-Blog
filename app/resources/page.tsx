import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '网盘资源 — OwenFX', description: '整理实用资源的网盘分享入口与更新信息。文件由对应网盘提供，OwenFX 不托管安装包。' };

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('cloud_resources')
    .select('id,title,slug,summary,version_label,updated_at,cloud_resource_links(provider)')
    .eq('status', 'published').not('published_at', 'is', null).lte('published_at', new Date().toISOString())
    .order('updated_at', { ascending: false }).limit(100);
  return <main className="py-8"><h1 className="mb-2 text-2xl font-bold">网盘资源</h1><p className="mb-6 text-sm opacity-70">资源文件存放于第三方网盘，本站仅提供介绍与分享入口，不托管安装包。</p>
    {!data?.length ? <div className="uiverse-card p-6 text-sm opacity-70">资源正在整理中，敬请期待。</div> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map(item => <Link href={'/resources/' + item.slug} key={item.id} className="uiverse-card p-5"><h2 className="font-semibold">{item.title}</h2><p className="my-3 line-clamp-3 text-sm opacity-70">{item.summary}</p><div className="flex flex-wrap gap-2 text-xs opacity-70"><span>{item.version_label || '资源分享'}</span><span>·</span><span>{item.cloud_resource_links?.length || 0} 个网盘入口</span></div></Link>)}</div>}
  </main>;
}
