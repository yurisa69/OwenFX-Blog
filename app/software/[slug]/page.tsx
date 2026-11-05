import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackLink from '@/components/TrackLink';
import SoftwareSupport from '@/components/SoftwareSupport';

export default async function SoftwareDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: software } = await supabase.from('software')
    .select('id,title,slug,description,developer,version,platform,image_url,official_download_url,introduction_markdown,screenshots,updated_at,software_download_links(id,provider,label,share_url,access_code,sort_order)')
    .eq('slug', slug).eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`).maybeSingle();
  if (!software) notFound();

  const providerNames: Record<string, string> = { baidu: '百度网盘', quark: '夸克网盘', aliyun: '阿里云盘', tianyi: '天翼云盘', '123pan': '123云盘', other: '其他网盘' };
  const links = [...(software.software_download_links || [])].sort((a, b) => a.sort_order - b.sort_order);

  return <article className="mx-auto max-w-3xl py-8">
    <div className="uiverse-card p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ background: 'var(--bg-tertiary)' }}>
          {software.image_url ? <img src={software.image_url} alt={software.title + ' 图标'} className="h-full w-full object-cover" /> : <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{software.title.slice(0, 1)}</span>}
        </div>
        <div className="min-w-0"><h1 className="text-2xl font-bold">{software.title}</h1><p className="mt-1 text-sm opacity-70">{[software.developer, software.version && `版本 ${software.version}`, software.platform].filter(Boolean).join(' · ')}</p></div>
      </div>
      {software.description && <p className="mt-5 text-sm leading-7 opacity-80">{software.description}</p>}
      {Array.isArray(software.screenshots) && software.screenshots.length > 0 && <section className="mt-7"><h2 className="mb-3 font-semibold">软件截图</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{software.screenshots.map((url: string, index: number) => <a key={url + index} href={url} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}><img src={url} alt={software.title + ' 截图 ' + (index + 1)} className="h-auto w-full object-cover" loading="lazy" /></a>)}</div></section>}
      <div className="my-6 border-t" style={{ borderColor: 'var(--border-color)' }} />
      <h2 className="mb-3 font-semibold">下载入口</h2>
      <div className="flex flex-wrap gap-3">{software.official_download_url && <TrackLink href={software.official_download_url} eventType="software_click" targetKey="official" softwareId={software.id} className="uiverse-btn uiverse-btn-primary">官方下载</TrackLink>}</div>
      {links.length > 0 && <div className="mt-3 space-y-3">{links.map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
        <div><p className="text-sm font-medium">{providerNames[link.provider] || link.provider} · {link.label}</p>{link.access_code && <p className="mt-1 text-xs opacity-70">提取码：{link.access_code}</p>}</div>
        <TrackLink href={link.share_url} eventType="software_click" targetKey={link.provider} softwareId={software.id} className="uiverse-btn uiverse-btn-ghost">网盘下载</TrackLink>
      </div>)}</div>}
      {!software.official_download_url && links.length === 0 && <p className="text-sm opacity-60">下载入口暂未添加。</p>}
      {software.introduction_markdown && <section className="mt-8 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}><h2 className="mb-3 font-semibold">软件介绍</h2><pre className="whitespace-pre-wrap break-words text-sm leading-7">{software.introduction_markdown}</pre></section>}
      <p className="mt-6 text-xs opacity-50">最后更新：{new Date(software.updated_at).toLocaleDateString('zh-CN')}</p>
      <SoftwareSupport className="mt-8" />
    </div>
  </article>;
}
