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

// Brand-mark style vector artwork. These are clean, scalable marks rather than app-store tiles.
function ProviderIcon({ provider }: { provider: string }) {
  const iconClass = "h-8 w-8 shrink-0";
  const svgProps = {
    "aria-hidden": true,
    viewBox: "0 0 1024 1024",
    className: iconClass,
    xmlns: "http://www.w3.org/2000/svg",
    fill: "currentColor",
  };

  // 使用用户最新提供的原始 SVG 路径；顺序：UC、夸克、百度网盘、迅雷。
  if (provider === 'uc') return (
    <svg {...svgProps} style={{ color: '#D26826' }}>
      <g transform="translate(512 512) scale(0.84) translate(-512 -512)">
        <path d="M274.280342 654.005224c9.69685-50.631144 37.479613-89.838098 78.277808-119.7872 24.891923-18.273179 51.358715-34.419927 77.313853-51.221592 41.430598-26.816762 76.131935-59.491952 93.820805-107.012246 19.757996-53.076846 18.346857-104.753809-17.61417-150.34517-45.558615-57.763588-107.086947-75.44018-178.190355-62.706157-51.713802 9.265014-94.065376 36.024471-130.726344 72.526827-15.237029 15.172561-28.224832 32.16763-38.193881 53.68776 3.436262-2.326998 5.288446-3.546779 7.104815-4.814656 19.720134-13.749142 41.452087-20.349467 65.608254-19.402909 40.377616 1.577938 73.809029 35.942607 74.717725 76.282361 0.600681 26.546609-7.622608 50.202379-23.496134 70.628594-20.225647 26.028816-42.022069 50.841945-63.272046 76.06542-45.746904 54.301743-69.424162 116.076692-59.873646 187.533141 9.601682 71.829955 47.079248 126.060067 110.722754 160.828942 40.101323 21.906939 84.121909 29.192879 131.572618 28.729322-2.565429-1.067308-3.574409-1.6158-4.650927-1.913583C306.245358 837.991586 258.034333 738.816842 274.280342 654.005224z"/>
        <path d="M635.544269 478.401788c36.902468 12.149714 70.174246 31.611975 103.969956 50.177819 35.504632 19.507286 72.874751 20.302395 111.1331 9.019421 7.475252-2.204202 10.504238-6.281053 9.79304-14.048971-0.939395-10.228969-0.403183-20.640086-1.924839-30.758538-10.134825-67.343781-46.508243-113.77323-111.137193-136.75157-8.093329-2.877537-10.689457-7.361665-13.099343-15.040555-4.628414-14.756075-10.866489-29.082362-17.427928-43.12417-2.700505-5.77554-7.957229-10.355859-13.009292-16.677844-4.817726 7.206122-8.905834 12.56927-12.20088 18.387789-12.351306 21.800515-16.32685 45.835931-17.216103 70.381977-0.272199 7.540743-2.243087 13.130042-8.242731 17.286712-13.294794 9.212826-25.922393 19.730367-40.148395 27.185152-30.444383 15.95232-61.732993 30.297027-91.821265 44.88835C568.329425 459.151351 602.155834 467.410456 635.544269 478.401788z"/>
        <path d="M673.563164 811.088866c-12.976546-3.01159-26.302039-4.510734-40.022529-6.780427 0.694825-2.615571 1.196245-4.867868 1.888-7.060813 10.070356-31.897478 11.874445-64.206324 7.691169-97.453542-13.919011-110.61019-125.914758-176.923502-215.691457-157.747767-47.78226 10.205433-81.620949 36.890188-101.228519 81.56876 71.884191-71.190389 179.466418-49.432853 223.887117 12.062733 29.315676 40.581254 37.269835 85.23322 22.286586 133.007293-15.030321 47.921429-49.582255 77.453023-97.616248 95.934956 61.796438 1.750877 233.275951-3.621481 254.119675-10.259668-2.342348-4.469801-4.089132-9.146311-6.938016-13.010315C709.838346 824.957735 692.984493 815.59346 673.563164 811.088866z"/>
        <path d="M534.685163 725.447347c-0.433882-56.465013-42.902112-102.863762-102.437044-103.161544-64.24214-0.324388-103.433744 52.433186-103.439884 102.995769-0.00614 54.04387 44.74918 103.402021 102.848413 102.490256C488.697783 827.724755 535.121092 782.037203 534.685163 725.447347zM431.128623 772.184811c-26.053376-0.092098-46.77328-21.143553-46.654576-47.393403 0.113587-25.645077 22.200628-47.642067 47.403636-47.214325 25.605168 0.431835 47.329958 22.166859 47.504944 47.521317C479.561705 751.020792 457.772446 772.282025 431.128623 772.184811z"/>
        <path d="M863.073332 624.677269c-5.123694-20.192901-19.295462-31.397081-38.401612-36.170804-13.314237-3.325745-27.16878-4.612041-40.83708-6.376221-37.299511-4.811586-70.12615-20.315698-101.579513-40.246633-63.176878-40.032762-132.093481-57.691957-206.838835-48.972365-12.923334 1.50733-25.443485 6.463202-38.149878 9.827833 0.225127 0.895393 0.448208 1.786693 0.671289 2.681062 8.211009 0 16.518209-0.797156 24.616654 0.158612 19.765159 2.331092 40.018436 3.377934 59.039651 8.670473 67.429739 18.757203 115.761514 62.206784 150.210094 121.894188 4.919033 8.525164 10.476609 14.224979 19.98824 14.746866 13.645788 0.74599 27.538193 2.113127 40.957831 0.376577 11.717879-1.51654 23.611767-5.593392 34.234709-10.9197 30.68793-15.395642 61.841463-22.267143 95.451956-9.4093 0.747014-1.765203 1.174756-2.301416 1.152243-2.819209C863.542007 626.968451 863.355765 625.800859 863.073332 624.677269z"/>
      </g>
    </svg>
  );

  if (provider === 'quark') return (
    <svg {...svgProps} style={{ color: '#3A25DD' }}>
      <g transform="translate(512 512) scale(0.84) translate(-512 -512)">
        <path d="M511.71328 870.4C308.79744 869.15072 152.51456 705.45408 153.6 510.48448a358.4 358.4 0 1 1 716.8 3.70688C868.59776 716.8 704.512 870.4 511.71328 870.4z m-0.22528-538.76736c-10.87488 1.16736-21.9136 1.57696-32.62464 3.60448a179.67104 179.67104 0 0 0 34.816 356.22912c19.12832-0.2048 29.65504-8.37632 33.28-27.38176 2.29376-12.02176 3.21536-24.30976 4.42368-36.51584 4.85376-49.74592 26.0096-71.0656 75.776-76.1856 11.96032-1.2288 23.98208-2.048 35.77856-4.21888 20.31616-3.70688 28.48768-14.06976 28.672-34.63168 1.16736-99.328-80.09728-180.65408-180.1216-180.89984z"/>
      </g>
    </svg>
  );

  if (provider === 'baidu') return (
    <svg {...svgProps} style={{ color: '#06A7FF' }}>
      <g transform="translate(512 512) scale(0.84) translate(-512 -512)">
        <path d="M529.01888 240.4608c-72.16128 0-130.65216 58.49088-130.65216 130.65216C398.36672 443.26912 456.8576 501.76 529.01888 501.76c72.15616 0 130.64704-58.49088 130.64704-130.64704-0.0768-72.12544-58.52672-130.57024-130.64704-130.65216m0-117.5808c137.088 0 248.22784 111.13984 248.22784 248.23296s-111.13984 248.23296-248.22784 248.23296c-137.09824 0-248.23296-111.13984-248.23296-248.23296S391.92064 122.88 529.01888 122.88z" fill="#06A7FF"/>
        <path d="M924.99968 807.79776c-92.40576 85.98016-236.95872 80.93696-323.14368-11.26912-22.14912-23.75168-20.84352-60.94848 2.8928-83.09248 23.74656-22.14912 60.94848-20.84864 83.0976 2.8928 41.82016 44.86144 112.09728 47.3088 156.94848 5.48352 44.8512-41.83552 47.3088-112.10752 5.4784-156.9536-41.82528-44.85632-112.09216-47.3088-156.94336-5.48352-23.74656 22.13888-60.94848 20.84352-83.09248-2.90304s-20.84864-60.94848 2.89792-83.09248c92.66176-85.78048 237.31712-80.19968 323.0976 12.4672 85.34016 92.18048 80.31744 235.95008-11.23328 321.95072zM280.78592 527.89248c-64.93696 0-117.5808 52.63872-117.5808 117.58592 0 64.94208 52.64384 117.5808 117.5808 117.5808s117.5808-52.63872 117.5808-117.5808c-0.07168-64.91136-52.66944-117.51424-117.5808-117.58592m0-117.58592c129.87904 0 235.16672 105.28768 235.16672 235.17184S410.66496 880.64 280.78592 880.64 45.6192 775.35744 45.6192 645.47328s105.28768-235.16672 235.16672-235.16672z" fill="#06A7FF"/>
        <path d="M434.33472 823.53152l-83.9936-82.304 266.2144-271.77472 83.98848 82.30912-266.20928 271.7696z" fill="#06A7FF"/>
        <path d="M529.01888 619.34592c-137.03168-0.15872-248.07424-111.2064-248.23296-248.23296 0-32.47104 26.3168-58.79296 58.79296-58.79296 32.47104 0 58.78784 26.32192 58.78784 58.79296 0.03072 72.15616 58.54208 130.62656 130.70336 130.59584 72.11008-0.0256 130.57024-58.48064 130.59584-130.59584 0-32.47104 26.32192-58.79296 58.78784-58.79296s58.79296 26.32192 58.79296 58.79296c-0.15872 137.02656-111.20128 248.07424-248.22784 248.23296z" fill="#FF436A"/>
      </g>
    </svg>
  );

  if (provider === 'thunder') return (
    <svg {...svgProps} style={{ color: '#1390F2' }}>
      <g transform="translate(512 512) scale(0.84) translate(-512 -512)">
        <path d="M861.658 109.937c-57.586 23.637-132.32 60.945-195.812 97.792-78.903 45.766-155.027 97.208-219.563 148.422l-12.745 10.08-2.318-2.783c-1.273-1.621-5.328-6.953-8.919-11.933-32.792-45.189-78.906-76.472-123.511-84.002-19.235-3.13-47.043-0.348-67.434 6.953-9.732 3.359-10.66 3.475-102.656 10.428-50.982 3.939-93.966 7.065-95.471 7.065-5.796 0-0.58 1.393 22.128 5.909 57.355 11.24 89.447 19.35 118.068 29.778 17.377 6.257 49.589 19.698 50.285 20.971 1.273 2.086-7.07 66.854-11.008 85.856-1.277 6.024-2.898 13.906-3.707 17.38-0.696 3.475-1.277 15.989-1.393 27.81 0 17.84 0.465 23.633 2.666 34.412 8.342 41.595 28.734 77.626 63.495 112.156 20.391 20.275 40.434 35.57 90.259 68.478 28.269 18.766 46.227 29.658 79.827 48.548 13.326 7.414 27.693 15.64 31.864 18.305 31.4 19.699 56.658 42.06 126.525 112.04 37.308 37.54 50.402 49.94 49.934 47.62-1.621-9.62-12.626-64.073-16.568-81.801-16.453-74.5-35.342-139.387-49.937-171.48-3.13-7.065-6.49-14.366-7.305-16.22l-1.502-3.478 30.82 0.464c25.954 0.349 76.24-1.505 77.741-2.778 0.116-0.232-1.273-5.448-3.355-11.588-2.086-6.14-3.478-11.353-3.246-11.705 0.351-0.228 8.806 3.479 19.002 8.343l18.418 8.686 33.601-9.495c18.422-5.216 34.065-9.739 34.645-10.08 0.465-0.229-2.433-3.942-6.485-8.226-4.055-4.171-9.619-10.196-12.513-13.21-6.028-6.485-7.882-6.953 20.62 4.98l20.046 8.343 22.829-8.343c12.513-4.628 23.285-8.687 23.866-9.031s-4.288-5.68-11.012-11.937l-12.049-11.353 20.507 6.837 20.627 6.721 54.112-19.347c29.89-10.66 57.119-20.398 60.597-21.551 3.474-1.048 6.72-2.434 7.3-2.782 1.274-1.273-56.193-26.529-107.294-47.155-58.853-23.754-144.25-54.34-179.24-64.192-7.302-1.969-13.787-4.055-14.255-4.515-0.46-0.58 12.165-19.234 28.153-41.711 15.876-22.48 28.973-41.018 28.973-41.134 0-0.232-3.598-0.81-8.117-1.157-4.397-0.465-8.11-1.161-8.11-1.51 0-0.344 17.268-25.37 38.352-55.497s38.468-55.152 38.584-55.73c0-0.463-3.71-1.276-8.342-1.74-4.632-0.345-8.687-0.925-8.92-1.157-0.467-0.464 8.92-13.558 60.482-84.234 15.527-21.204 28.156-38.813 27.928-38.93-0.232-0.238-8.926 3.12-19.467 7.408z"/>
      </g>
    </svg>
  );

  return null;
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
          <div className="relative grid w-full grid-cols-2 gap-3">
            {software.official_download_url ? (
              <TrackLink href={software.official_download_url} eventType="software_click" targetKey="official"
                softwareId={software.id}
                className="uiverse-btn uiverse-btn-primary flex w-full items-center justify-center rounded-full !px-4 !py-2 text-sm">
                官方下载
              </TrackLink>
            ) : (
              <div className="flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                官方下载
              </div>
            )}
            <div className="uiverse-btn uiverse-btn-ghost flex w-full items-center justify-center rounded-full !px-4 !py-2 text-sm">
              网盘下载
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 justify-items-center gap-x-2 gap-y-3">
            {quickProviders.map(({ key, label, link }) => link ? (
              <TrackLink key={key} href={link.share_url} eventType="software_click" targetKey={key}
                softwareId={software.id}
                className="flex min-w-0 flex-col items-center gap-1.5 text-xs">
                <ProviderIcon provider={key} />
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                {link.access_code && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>提取码 {link.access_code}</span>}
              </TrackLink>
            ) : (
              <div key={key} aria-disabled="true" title={providerNames[key] + '暂未添加链接'}
                className="flex min-w-0 flex-col items-center gap-1.5 text-xs">
                <ProviderIcon provider={key} />
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
          {links.some((link: { provider: string }) => !['uc', 'quark', 'baidu', 'thunder'].includes(link.provider)) && (
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
              {links.filter((link: { provider: string }) => !['uc', 'quark', 'baidu', 'thunder'].includes(link.provider)).map(link => (
                <TrackLink key={link.id} href={link.share_url} eventType="software_click" targetKey={link.provider}
                  softwareId={software.id} className="text-xs font-medium text-[var(--accent)]">
                  {providerNames[link.provider] || link.provider}{link.access_code ? ' · 提取码 ' + link.access_code : ''}
                </TrackLink>
              ))}
            </div>
          )}
          {!software.official_download_url && links.length === 0 && (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>官方下载入口暂未添加。</p>
          )}
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
