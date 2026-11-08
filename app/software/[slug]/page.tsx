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
  const iconClass = "h-11 w-11 shrink-0";
  const iconStyle = { color: 'var(--text-primary)' };
  const svgProps = { "aria-hidden": true, viewBox: "0 0 1024 1024", className: iconClass, xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", style: iconStyle };

  // Brand mapping: UC squirrel, Quark Q, Baidu cloud, Thunder bird.
  if (provider === 'uc') return (
    <svg {...svgProps}><g transform="translate(512 512) scale(0.9) translate(-512 -512)">
      <path d="M331.817056 0c27.812837 7.968953 57.348664 12.297928 83.151513 24.508856 140.651176 66.55861 178.100956 220.556708 87.01449 350.513947-32.105812 45.811732-76.281553 77.477546-122.330284 107.341371-34.342799 22.273869-69.469593 43.702744-101.719404 68.755597-69.97759 54.365681-109.711357 125.728263-109.558358 215.820735 0.189999 112.987338 65.548616 206.907788 169.338008 246.761554 4.618973 1.77099 7.989953 6.78796 11.94293 10.29294h-32.111812c-26.147847-4.814972-52.626692-8.299951-78.38754-14.675914C132.709222 982.97024 60.129648 916.799628 21.183876 815.442222 9.306945 784.528403 6.79996 750.016605 0 717.152798v-21.407875c0.994994-6.981959 2.260987-13.943918 2.941983-20.957877 4.238975-43.696744 13.525921-86.842491 37.933777-123.215278 31.307817-46.658727 67.621604-89.947473 101.478406-134.912209 19.243887-25.56085 40.584762-50.044707 56.21967-77.707545 29.586827-52.347693 22.277869-111.232348-14.517914-148.745128-36.205788-36.912784-93.731451-44.197741-147.133138-18.236894C26.581844 176.998963 16.914901 183.416925 6.937959 189.193891c1.161993-9.369945 4.628973-16.563903 8.889948-23.252863C55.311676 103.959391 109.663357 58.440658 176.437966 29.546827 208.625778 15.618908 244.237569 9.599944 278.298369 0h53.518687z"/>
      <path d="M463.830282 1023.994c6.663961-4.863972 12.762925-10.901936 20.077883-14.403916 75.945555-36.356787 120.826292-95.219442 126.29026-179.970945 5.455968-84.717504-40.295764-163.76304-112.74534-196.702847-84.550505-38.437775-163.977039-29.839825-236.148616 30.68282-4.020976 3.36998-7.861954 6.950959-15.165911 9.007947 2.118988-5.897965 3.47198-12.219928 6.466962-17.634897 45.339734-81.94952 135.588206-120.591293 234.952623-100.827409 150.075121 29.850825 247.092552 175.994969 217.183728 327.443081-3.316981 16.775902-7.770954 33.330805-12.08793 51.650698 55.187677 5.929965 109.550358 14.068918 138.474189 75.814556-34.566797 2.766984-65.661615 6.041965-96.839432 7.560955-46.870725 2.285987-93.80445 3.270981-140.703176 4.999971-6.403962 0.232999-12.766925 1.557991-19.147888 2.379986H463.830282z"/>
      <path d="M1023.994 685.040986c-51.1907-18.687891-98.710422-7.608955-145.933145 15.474909-34.978795 17.0989-72.626574 22.881866-110.84735 10.981936-7.566956-2.358986-15.691908-8.870948-19.733885-15.724908-73.30957-124.400271-178.486954-194.375861-326.116089-192.88287-3.276981 0.031-6.557962-0.353998-9.835942-0.547996-0.429997-1.68299-0.854995-3.36898-1.281993-5.051971 12.731925-4.135976 25.211852-9.505944 38.243776-12.194928 63.250629-13.055924 125.215266-4.238975 186.720906 12.011929 49.371711 13.044924 94.570446 35.105794 136.981197 62.983631 47.72072 31.369816 99.832415 49.216712 156.653083 53.780685 7.094958 0.570997 14.145917 1.807989 21.185875 2.946983 33.771802 5.456968 60.361646 20.813878 73.964567 53.950684l-0.001 14.271916zM546.627797 433.099462c34.856796-16.048906 70.483587-30.64182 104.337389-48.584715 28.718832-15.215911 55.478675-34.1528 82.919514-51.737697 10.772937-6.90596 14.718914-16.793902 14.843913-30.107823 0.341998-36.103788 7.949953-70.766585 26.653844-102.222401 4.448974-7.478956 10.16394-14.201917 16.103905-22.390869 26.383845 23.504862 37.950778 53.149689 45.395734 84.316506 3.166981 13.270922 8.885948 19.500886 21.661873 24.037859 120.915292 42.891749 163.76204 150.24612 160.971057 245.413562-0.173999 5.929965-7.771954 14.877913-13.778919 16.895901-52.145694 17.535897-104.03439 16.406904-154.152097-7.505956-49.228712-23.482862-97.023432-50.204706-147.139138-71.528581-47.098724-20.044883-97.162431-31.245817-148.957127-31.877813-2.744984-0.03-5.483968-0.630996-8.223952-0.964995-0.213999-1.248993-0.422998-2.495985-0.635996-3.742978zM398.959662 669.996074c83.173513 0.077 149.929122 66.55061 150.002121 149.368125 0.073 82.748515-66.51161 149.562124-149.544123 150.064121-83.513511 0.497997-151.015115-66.873608-150.783117-150.497118 0.229999-82.893514 66.962608-149.011127 150.325119-148.935128z m66.053613 149.714123c0.021-37.118783-30.138823-67.512604-66.611609-67.128607-36.730785 0.382998-66.808609 30.981818-66.54961 67.695604 0.251999 35.487792 30.67382 66.052613 66.229611 66.53261 36.394787 0.495997 66.910608-30.099824 66.931608-67.099607z"/>
      <path d="M546.627797 433.099462c34.856796-16.048906 70.483587-30.64182 104.337389-48.584715 28.718832-15.215911 55.478675-34.1528 82.919514-51.737697 10.772937-6.90596 14.718914-16.793902 14.843913-30.107823 0.341998-36.103788 7.949953-70.766585 26.653844-102.222401 4.448974-7.478956 10.16394-14.201917 16.103905-22.390869 26.383845 23.504862 37.950778 53.149689 45.395734 84.316506 3.166981 13.270922 8.885948 19.500886 21.661873 24.037859 120.915292 42.891749 163.76204 150.24612 160.971057 245.413562-0.173999 5.929965-7.771954 14.877913-13.778919 16.895901-52.145694 17.535897-104.03439 16.406904-154.152097-7.505956-49.228712-23.482862-97.023432-50.204706-147.139138-71.528581-47.098724-20.044883-97.162431-31.245817-148.957127-31.877813-2.744984-0.03-5.483968-0.630996-8.223952-0.964995-0.213999-1.248993-0.422998-2.495985-0.635996-3.742978z"/>
    </g></svg>
  );
  if (provider === 'quark') return (
    <svg {...svgProps}><g transform="translate(512 512) scale(0.9) translate(-512 -512)">
      <path d="M466.48395 1021.645c-120.473-10.65-235.417-65.024-317.645-149.76C66.30495 786.585 24.42295 703.13 4.40395 583.782c-5.222-30.924-5.99-104.806-1.28-135.219C14.28595 373.402 39.27095 302.131 73.37095 247.347 169.88295 91.7 331.93095 0 509.95295 0c75.98 0 144.384 13.824 210.278 42.65 57.498 25.241 120.73 70.144 163.124 116.224 66.355 72.038 100.454 133.376 125.44 225.996 19.763 73.063 20.275 175.77 1.536 248.32-21.095 80.384-49.716 137.78-101.223 201.524-44.749 55.654-91.801 94.873-153.753 128.204-65.076 35.124-125.184 52.532-201.216 58.778-37.172 3.072-51.456 3.072-87.655 0v-0.051z m91.853-260.506c12.8-5.478 22.63-20.838 22.63-35.635 0-25.498 4.967-54.374 11.47-67.072 13.311-26.06 30.975-35.123 84.582-43.469 20.787-3.072 42.137-7.526 47.36-9.625 14.848-6.503 27.084-18.944 35.123-36.352 7.27-15.872 7.526-17.408 7.526-58.01-0.256-45.056-1.792-54.886-17.408-95.232-23.193-60.467-84.019-120.832-144.435-142.643a427.11 427.11 0 0 0-53.862-13.517c-28.621-4.71-34.048-4.966-58.778-2.048-48.896 5.632-79.104 15.309-112.947 35.584-21.35 12.954-22.887 14.336-48.64 39.731-37.735 37.223-57.242 73.37-69.223 127.488-20.838 94.874 16.896 194.97 96 255.335 33.076 25.19 81.408 45.516 116.583 48.896 30.208 3.072 72.857 1.28 84.019-3.43z"/>
    </g></svg>
  );
  return (
    <svg {...svgProps}><g transform="translate(512 512) scale(1.2) translate(-512 -512)">
      <path d="M327.68 460.92288c-5.4272-69.18144 14.2336-128.3072 68.23936-173.09696 36.864-30.72 80.34304-45.056 128.28672-41.5744 104.448 7.35232 184.60672 94.86336 173.85472 215.04 30.72 1.65888 59.98592 8.51968 86.016 25.47712C841.728 524.288 870.21568 577.536 864.82944 646.61504c-6.144 79.11424-63.488 141.45536-141.76256 154.15296-57.50784 9.33888-107.66336-7.76192-149.15584-48.76288a42.12736 42.12736 0 0 1 58.53184-60.57984c34.22208 32.99328 79.42144 33.36192 111.2064 11.6736A86.016 86.016 0 0 0 767.2832 585.728c-25.4976-39.09632-78.25408-51.58912-116.55168-26.13248-14.00832 9.29792-25.98912 21.87264-38.17472 33.71008-56.46336 54.86592-111.55456 111.22688-169.3696 164.63872-50.76992 46.8992-111.57504 57.99936-175.90272 32.89088-62.30016-24.30976-98.304-71.8848-107.29472-138.58816-11.6736-86.016 47.96416-172.27776 140.88192-188.23168 8.76544-1.49504 17.67424-2.06848 26.80832-3.09248z m185.18016-130.1504c-51.54816-0.8192-99.08224 39.424-100.10624 93.06112-1.20832 64 45.34272 106.14784 99.328 106.496 55.93088 0.38912 100.22912-44.11392 100.51584-104.93952 0.28672-50.74944-46.36672-94.57664-99.69664-94.6176zM243.11808 632.2176c0 47.43168 37.70368 85.89312 84.09088 85.87264 48.82432 0 87.73632-38.13376 87.53152-85.68832-0.22528-48.25088-38.912-85.89312-88.28928-85.87264-45.69088 0.02048-83.37408 38.78912-83.33312 85.68832z"/>
      <path d="M512.65536 617.79968c-40.36608 0-77.27104-11.12064-109.48608-35.57376-50.176-38.11328-77.14816-88.53504-76.0832-152.14592 0.36864-22.26176 12.45184-36.67968 34.816-41.69728a42.37312 42.37312 0 0 1 47.3088 24.28928 67.76832 67.76832 0 0 1 5.07904 23.20384c2.33472 54.66112 52.08064 99.28704 107.25376 93.83936A98.5088 98.5088 0 0 0 609.8944 444.416c0.94208-6.98368 2.048-13.94688 3.072-20.91008 2.90816-19.37408 20.15232-35.06176 39.07584-35.55328 23.73632-0.6144 40.96 12.0832 44.93312 33.75104 5.57056 30.43328-1.78176 59.392-14.47936 86.34368-27.58656 58.6752-74.09664 94.37184-137.66656 107.58144a119.68512 119.68512 0 0 1-16.384 2.048c-5.28384 0.38912-10.5472 0.12288-15.79008 0.12288z"/>
      <path d="M511.65184 966.26688V1024h-157.47072v-57.73312z" opacity=".5"/>
      <path d="M511.6928 965.95968V1024h158.86336v-58.04032z"/>
    </g></svg>
  );
}  if (provider === 'thunder') return (
    <svg {...svgProps}><g transform="translate(512 512) scale(1) translate(-512 -512)">
      <path d="M432.64 407.04s199.68-217.6 468.48-322.56c0 0 12.8-5.12 2.56 7.68s-56.32 84.48-66.56 97.28l-35.84 33.28 17.92-5.12-35.84 79.36-46.08 46.08 33.28-10.24-38.4 92.16-40.96 40.96 35.84-20.48s-17.92 38.4-35.84 66.56c0 0 163.84 17.92 302.08 81.92 0 0-76.8 20.48-107.52 28.16l-33.28-7.68 15.36 10.24-35.84 15.36c-2.56 0-28.16-7.68-40.96-2.56 0 0 15.36 5.12 17.92 10.24l-38.4 15.36s-7.68 5.12-15.36 5.12c-5.12 0-38.4-7.68-48.64-2.56 0 0 20.48 10.24 28.16 10.24 0 0-12.8 17.92-122.88 23.04 0 0 81.92 227.84 79.36 258.56-2.56 30.72-48.64-35.84-48.64-35.84s-69.12-76.8-89.6-92.16c-20.48-15.36-79.36-25.6-204.8-104.96s-125.44-181.76-117.76-230.4c7.68-48.64 7.68-84.48-23.04-94.72s-81.92-23.04-189.44-25.6c0 0-17.92-12.8 12.8-12.8 30.72 2.56 112.64 2.56 156.16-5.12 48.64-10.24 66.56-25.6 104.96-20.48 38.4 5.12 87.04 17.92 140.8 71.68z"/>
    </g></svg>
  );

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
                    softwareId={software.id}
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
