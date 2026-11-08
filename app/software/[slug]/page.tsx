import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackLink from '@/components/TrackLink';
import SoftwareSupport from '@/components/SoftwareSupport';
import ArticleContent from '@/components/ArticleContent';

const categoryColors: Record<string, string> = {
  '工具': '#FF4444',
  '多媒体': '#FF8C00',
  '开发工具': '#FFD700',
  '系统增强': '#3FB950',
  'Android软件': '#3B82F6',
  'Windows软件': '#A855F7',
};

const providerNames: Record<string, string> = {
  baidu: '百度网盘',
  quark: '夸克网盘',
  aliyun: '阿里云盘',
  tianyi: '天翼云盘',
  '123pan': '123云盘',
  other: '其他网盘',
};

function sortTagsByLength(tags: string[]) {
  return tags
    .map((tag, index) => ({ tag, index }))
    .sort((a, b) => Array.from(a.tag).length - Array.from(b.tag).length || a.index - b.index)
    .map(({ tag }) => tag);
}

export default async function SoftwareDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: software } = await supabase.from('software')
    .select('id,title,slug,description,developer,version,file_size,platform,image_url,category_id,category:categories!software_category_id_fkey(name),official_download_url,introduction_markdown,screenshots,updated_at,tags:software_tags(tag:tags(name)),software_download_links(id,provider,label,share_url,access_code,sort_order,active)')
    .eq('slug', slug).eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`).maybeSingle();
  if (!software) notFound();

  const category = Array.isArray(software.category) ? software.category[0] : software.category;
  const categoryName = category?.name || '';
  const categoryColor = categoryColors[categoryName] || 'var(--accent)';
  const tags = sortTagsByLength((software.tags || [])
    .map((entry: { tag?: { name?: string } | { name?: string }[] | null }) => {
      const tag = Array.isArray(entry.tag) ? entry.tag[0] : entry.tag;
      return tag?.name || '';
    })
    .filter(Boolean));
  const links = [...(software.software_download_links || [])]
    .filter((link: { active?: boolean }) => link.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order);

  const { data: relatedSoftware } = software.category_id
    ? await supabase.from('software')
        .select('id,title,slug,description,image_url,version')
        .eq('category_id', software.category_id)
        .eq('status', 'published')
        .neq('id', software.id)
        .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
        .order('featured', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(4)
    : { data: [] };

  return (
    <article className="animate-fade-in mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <section className="uiverse-card mb-6 rounded-xl p-5 sm:p-7">
        <div className="mb-4 flex items-start gap-4 sm:gap-5">
          <div className="software-icon-frame flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:h-24 sm:w-24">
            {software.image_url
              ? <img src={software.image_url} alt={software.title + ' 图标'} className="h-full w-full object-cover" />
              : <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{software.title.slice(0, 1)}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{software.title}</h1>
            {categoryName && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: 'var(--accent-bg)', color: categoryColor }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
                {categoryName}
              </span>
            )}
          </div>
        </div>

        {software.description && (
          <p className="mb-4 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{software.description}</p>
        )}

        {tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px]"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {software.developer && <span>开发者：{software.developer}</span>}
          {software.version && <span>版本：{software.version}</span>}
          {software.file_size && <span>大小：{software.file_size}</span>}
          {software.platform && <span>平台：{software.platform}</span>}
          {software.updated_at && <span>更新：{new Date(software.updated_at).toLocaleDateString('zh-CN')}</span>}
        </div>

        <div className="border-t pt-5" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="mb-3 font-semibold">下载入口</h2>
          <div className="flex flex-wrap gap-3">
            {software.official_download_url && (
              <TrackLink href={software.official_download_url} eventType="software_click" targetKey="official"
                softwareId={software.id} className="uiverse-btn uiverse-btn-primary rounded-full !px-4 !py-2 text-sm">
                官方下载
              </TrackLink>
            )}
            {!software.official_download_url && links.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>下载入口暂未添加。</p>
            )}
          </div>

          {links.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {links.map(link => (
                <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 sm:p-4"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{providerNames[link.provider] || link.provider} · {link.label}</p>
                    {link.access_code && <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>提取码：{link.access_code}</p>}
                  </div>
                  <TrackLink href={link.share_url} eventType="software_click" targetKey={link.provider}
                    softwareId={software.id} className="uiverse-btn uiverse-btn-ghost rounded-full !px-4 !py-2 text-sm">
                    网盘下载
                  </TrackLink>
                </div>
              ))}
            </div>
          )}
        </div>

        {software.introduction_markdown && (
          <section className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="mb-4 text-lg font-semibold">软件介绍</h2>
            <ArticleContent content={software.introduction_markdown} />
          </section>
        )}

        {Array.isArray(software.screenshots) && software.screenshots.length > 0 && (
          <section className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="mb-3 text-lg font-semibold">软件截图</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {software.screenshots.map((url: string, index: number) => (
                <a key={url + index} href={url} target="_blank" rel="noopener noreferrer"
                  className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <img src={url} alt={software.title + ' 截图 ' + (index + 1)} className="h-auto w-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          </section>
        )}

        <SoftwareSupport className="mt-8" />
      </section>

      {relatedSoftware && relatedSoftware.length > 0 && (
        <section className="uiverse-card rounded-xl p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">同类软件推荐</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedSoftware.map(item => (
              <Link key={item.id} href={'/software/' + item.slug}
                className="flex items-center gap-3 rounded-xl p-3 text-sm transition hover:brightness-110"
                style={{ background: 'var(--bg-secondary)' }}>
                <div className="software-icon-frame flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title + ' 图标'} className="h-full w-full object-cover" />
                    : <span className="font-semibold" style={{ color: 'var(--accent)' }}>{item.title.slice(0, 1)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {item.description || item.version || '查看软件详情'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
