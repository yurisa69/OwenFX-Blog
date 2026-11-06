import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '软件库 — OwenFX', description: '发现实用软件，查看介绍、官方渠道与网盘下载入口。' };

export default async function SoftwarePage() {
  const supabase = await createClient();
  const { data } = await supabase.from('software')
    .select('id,title,slug,description,developer,version,platform,image_url,featured')
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('featured', { ascending: false })
    .order('featured_order', { ascending: true })
    .order('updated_at', { ascending: false })
    .limit(100);

  return <main className="py-8">
    <h1 className="mb-2 text-2xl font-bold">应用</h1>
    <p className="mb-6 text-sm opacity-70">软件介绍与下载入口汇总。安装包由软件官方或第三方网盘提供，OwenFX 不托管安装包。</p>
    {!data?.length ? <div className="uiverse-card p-6 text-sm opacity-70">软件库正在整理中，敬请期待。</div> :
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.map((item) => <Link key={item.id} href={'/software/' + item.slug} className="uiverse-card flex flex-col items-center p-4 text-center transition hover:-translate-y-1">
          <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl" style={{ background: 'var(--bg-tertiary)' }}>
            {item.image_url ? <img src={item.image_url} alt={item.title + ' 图标'} className="h-full w-full object-cover" /> : <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{item.title.slice(0, 1)}</span>}
          </div>
          <h2 className="line-clamp-1 text-sm font-semibold">{item.title}</h2>
          <p className="mt-1 line-clamp-2 text-xs opacity-60">{item.description || item.developer || item.platform || '软件详情'}</p>
          {item.version && <span className="mt-2 text-[11px] opacity-50">{item.version}</span>}
        </Link>)}
      </div>}
  </main>;
}
