import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackLink from '@/components/TrackLink';

export default async function ResourceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: resource } = await supabase.from('cloud_resources')
    .select('id,title,slug,summary,description_markdown,version_label,updated_at,cloud_resource_links(id,provider,share_url,access_code,label,sort_order)')
    .eq('slug', slug).eq('status', 'published').not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString()).maybeSingle();
  if (!resource) notFound();
  const names: Record<string, string> = { baidu: '百度网盘', quark: '夸克网盘', aliyun: '阿里云盘', tianyi: '天翼云盘', '123pan': '123云盘', other: '其他网盘' };
  const links = [...(resource.cloud_resource_links || [])].sort((a, b) => a.sort_order - b.sort_order);
  return <article className="mx-auto max-w-3xl py-8"><div className="uiverse-card p-6">
    <p className="mb-2 text-xs opacity-60">网盘资源分享</p><h1 className="text-2xl font-bold">{resource.title}</h1>
    {resource.summary && <p className="mt-3 text-sm leading-7 opacity-80">{resource.summary}</p>}
    <div className="mt-4 flex flex-wrap gap-3 text-xs opacity-60">{resource.version_label && <span>版本：{resource.version_label}</span>}<span>更新：{new Date(resource.updated_at).toLocaleDateString('zh-CN')}</span></div>
    <div className="my-6 border-t" style={{ borderColor: 'var(--border-color)' }} /><h2 className="mb-3 font-semibold">选择网盘下载</h2>
    <div className="space-y-3">{links.map(link => <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }} key={link.id}><div><p className="font-medium">{names[link.provider] || link.provider} · {link.label}</p>{link.access_code && <p className="mt-1 text-sm opacity-70">提取码：<code>{link.access_code}</code></p>}</div><TrackLink href={link.share_url} eventType="resource_click" targetKey={link.provider} resourceId={resource.id} className="uiverse-btn uiverse-btn-primary">打开网盘分享</TrackLink></div>)}</div>
    <p className="mt-5 text-xs leading-6 opacity-60">文件由第三方网盘存储和提供，本站不托管安装包，也不代理文件下载。</p>
    {resource.description_markdown && <section className="mt-8 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}><h2 className="mb-3 font-semibold">资源说明</h2><pre className="whitespace-pre-wrap break-words text-sm leading-7">{resource.description_markdown}</pre></section>}
  </div></article>;
}
