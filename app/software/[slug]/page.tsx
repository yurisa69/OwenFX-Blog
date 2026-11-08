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
  uc: 'UC网盘',
  quark: '夸克网盘',
  baidu: '百度网盘',
  thunder: '迅雷网盘',
  aliyun: '阿里云盘',
  tianyi: '天翼云盘',
  '123pan': '123云盘',
  other: '其他网盘',
};

function formatPlatforms(platform: string | null) {
  if (!platform) return [];
  return [...new Set(platform
    .split(/[、，,;；|]+/)
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => value.replace(/\s+\d[\d./+-]*(?:\s*\/\s*\d[\d./+-]*)?$/, '').trim())
    .filter(Boolean))]
    .sort((a, b) => {
      const order: Record<string, number> = {
        Linux: 0,
        macOS: 1,
        Windows: 2,
      };
      return (order[a] ?? Number.MAX_SAFE_INTEGER) - (order[b] ?? Number.MAX_SAFE_INTEGER);
    });
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'uc') return <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-lg font-black italic tracking-[-2px] text-white shadow-sm">UC</span>;
  if (provider === 'quark') return <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-2xl font-bold text-white shadow-sm">夸</span>;
  if (provider === 'baidu') return (
    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ff] shadow-sm">
      <svg viewBox="0 0 48 48" className="h-8 w-8" fill="#2878E5">
        <ellipse cx="13" cy="13" rx="4.5" ry="7" transform="rotate(-25 13 13)" /><ellipse cx="24" cy="9" rx="4.5" ry="7" /><ellipse cx="35" cy="13" rx="4.5" ry="7" transform="rotate(25 35 13)" /><ellipse cx="8" cy="26" rx="4.5" ry="7" transform="rotate(-35 8 26)" /><path d="M24 19c-5.5 0-8 5.4-11 10.1-3.1 4.8-.2 9.2 4.5 8.2 2.3-.5 4.2-2.1 6.5-2.1s4.2 1.6 6.5 2.1c4.7 1 7.6-3.4 4.5-8.2C32 24.4 29.5 19 24 19Z" /><ellipse cx="40" cy="26" rx="4.5" ry="7" transform="rotate(35 40 26)" />
      </svg>
    </span>
  );
  return <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-sm"><svg viewBox="0 0 48 48" className="h-8 w-8" fill="none"><path d="M27.5 4 10 27h11l-1 17 18-25H27l.5-15Z" fill="#FFD84D" stroke="#FFF2A6" strokeLinejoin="round" strokeWidth="1.5" /></svg></span>;
}

function sortSoftwareTags(tags: string[]) {
  const priority = ['直播推流', '屏幕录制', '免费开源'];
  return tags
    .map((tag, index) => ({ tag, index }))
    .sort((a, b) => {
      const ai = priority.indexOf(a.tag);
      const bi = priority.indexOf(b.tag);
      const ar = ai === -1 ? priority.length : ai;
      const br = bi === -1 ? priority.length : bi;
      return ar - br || a.index - b.index;
    })
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
  const tags = sortSoftwareTags((software.tags || [])
    .map((entry: { tag?: { name?: string } | { name?: string }[] | null }) => {
      const tag = Array.isArray(entry.tag) ? entry.tag[0] : entry.tag;
      return tag?.name || '';
    })
    .filter(Boolean));
  const links = [...(software.software_download_links || [])]
    .filter((link: { active?: boolean }) => link.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order);
  const quickProviders = [
    { key: 'uc', label: 'UC' },
    { key: 'quark', label: '夸克' },
    { key: 'baidu', label: '百度' },
    { key: 'thunder', label: '迅雷' },
  ].map(provider => ({ ...provider, link: links.find((link: { provider: string }) => link.provider === provider.key) }));

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
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="software-icon-frame mb-3 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:h-24 sm:w-24">
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
          {software.platform && formatPlatforms(software.platform).length > 0 && <span>平台：{formatPlatforms(software.platform).join('、')}</span>}
          {software.updated_at && <span>更新：{new Date(software.updated_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' })}</span>}
        </div>

        {(software.description || software.introduction_markdown) && (
          <section className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="mb-4 text-lg font-semibold">软件介绍</h2>
            {slug === 'obs-studio' ? (
              <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                OBS Studio 是一款免费开源的屏幕录制与直播软件，支持显示器、应用窗口、摄像头、图片、文字和音频设备等多来源画面采集，可组合场景并通过转场切换，同时支持实时音频混音。适用于软件教程、课程录制、游戏录制、产品演示和直播。初次使用建议先检查画面尺寸、帧率、编码器及音频来源。
              </p>
            ) : (
              <>
                {software.description && (
                  <p className="mb-4 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{software.description}</p>
                )}
                {software.introduction_markdown && <ArticleContent content={software.introduction_markdown} />}
              </>
            )}
          </section>
        )}

        <div className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="mb-4 text-lg font-semibold">获取方式</h2>
          <div className="flex flex-wrap items-center gap-3">
            {software.official_download_url && (
              <TrackLink href={software.official_download_url} eventType="software_click" targetKey="official"
                softwareId={software.id} className="uiverse-btn uiverse-btn-primary rounded-full !px-4 !py-2 text-sm">
                官方下载
              </TrackLink>
            )}
            <details className="group">
              <summary className="uiverse-btn uiverse-btn-ghost inline-flex cursor-pointer list-none items-center rounded-full !px-4 !py-2 text-sm [&::-webkit-details-marker]:hidden">
                网盘下载
              </summary>
              <div className="mt-4 flex flex-wrap items-start gap-x-5 gap-y-3">
                {quickProviders.map(({ key, label, link }) => link ? (
                  <TrackLink key={key} href={link.share_url} eventType="software_click" targetKey={key}
                    softwareId={software.id} title={providerNames[key]}
                    className="flex min-w-14 flex-col items-center gap-1.5 text-xs transition-opacity hover:opacity-80">
                    <ProviderIcon provider={key} />
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    {link.access_code && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>提取码 {link.access_code}</span>}
                  </TrackLink>
                ) : (
                  <div key={key} aria-disabled="true" title={providerNames[key] + '暂未添加链接'}
                    className="flex min-w-14 flex-col items-center gap-1.5 text-xs opacity-35">
                    <ProviderIcon provider={key} />
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  </div>
                ))}
              </div>
              {links.some((link: { provider: string }) => !['uc', 'quark', 'baidu', 'thunder'].includes(link.provider)) && (
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                  {links.filter((link: { provider: string }) => !['uc', 'quark', 'baidu', 'thunder'].includes(link.provider)).map(link => (
                    <TrackLink key={link.id} href={link.share_url} eventType="software_click" targetKey={link.provider}
                      softwareId={software.id} className="text-xs font-medium text-[var(--accent)]">
                      {providerNames[link.provider] || link.provider}{link.access_code ? ' · 提取码 ' + link.access_code : ''}
                    </TrackLink>
                  ))}
                </div>
              )}
              {links.length === 0 && <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>网盘资源暂未添加。</p>}
            </details>
            {!software.official_download_url && links.length === 0 && <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>官方下载入口暂未添加。</p>}
          </div>
        </div>
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
