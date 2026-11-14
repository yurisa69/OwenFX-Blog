import Link from 'next/link';
import Pagination from '@/components/Pagination';

type SoftwareItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  version: string | null;
  platform: string | null;
  image_url: string | null;
  category: { name: string; slug: string } | null;
  tags: { tag: { name: string; slug: string } | { name: string; slug: string }[] | null }[] | null;
};

type FilterOption = { name: string; slug: string };

const categoryColors: Record<string, string> = {
  '工具': '#FF4444',
  '多媒体': '#FF8C00',
  '开发工具': '#FFD700',
  '系统增强': '#3FB950',
  'Android软件': '#3B82F6',
  'Windows软件': '#A855F7',
};

type Props = {
  items: SoftwareItem[];
  categories: FilterOption[];
  tags: FilterOption[];
  query: string;
  activeCategory: string;
  activeTag: string;
  currentPage: number;
  totalPages: number;
  error: boolean;
};

function filterHref(query: string, category: string, tag: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  if (tag) params.set('tag', tag);
  const search = params.toString();
  return '/software' + (search ? '?' + search : '');
}

export default function SoftwareLibrary({
  items,
  categories,
  tags,
  query,
  activeCategory,
  activeTag,
  currentPage,
  totalPages,
  error,
}: Props) {
  const paginationQuery: Record<string, string> = {};
  if (query) paginationQuery.q = query;
  if (activeCategory) paginationQuery.category = activeCategory;
  if (activeTag) paginationQuery.tag = activeTag;

  return (
    <>
      <form action="/software" method="get" className="mb-5 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={80}
          placeholder="搜索软件名称、介绍或开发者"
          aria-label="搜索软件名称、介绍或开发者"
          className="admin-input min-w-0 flex-1 sm:max-w-md"
        />
        {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
        {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
        <button type="submit" className="uiverse-btn uiverse-btn-primary !px-5">搜索</button>
        {query || activeCategory || activeTag ? <Link href="/software" className="uiverse-btn uiverse-btn-ghost !px-4">清除筛选</Link> : null}
      </form>

      <div className="mb-4 flex flex-wrap gap-2" aria-label="软件分类筛选">
        <Link
          href={filterHref(query, '', activeTag)}
          aria-current={!activeCategory ? 'page' : undefined}
          className={'uiverse-btn !px-4 !py-1.5 text-xs ' + (!activeCategory ? 'uiverse-btn-primary' : 'uiverse-btn-ghost')}
        >全部</Link>
        {categories.map((item) => (
          <Link
            key={item.slug}
            href={filterHref(query, item.slug, activeTag)}
            aria-current={activeCategory === item.slug ? 'page' : undefined}
            className={'uiverse-btn !px-4 !py-1.5 text-xs ' + (activeCategory === item.slug ? 'uiverse-btn-primary' : 'uiverse-btn-ghost')}
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: categoryColors[item.name] || 'var(--accent)' }} />
            {item.name}
          </Link>
        ))}
      </div>

      {tags.length ? (
        <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="软件标签筛选">
          <span className="mr-1 text-xs opacity-60">标签</span>
          <Link
            href={filterHref(query, activeCategory, '')}
            aria-current={!activeTag ? 'page' : undefined}
            className={'rounded-full border px-3 py-1 text-xs ' + (!activeTag ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border-color)] opacity-70')}
          >全部</Link>
          {tags.map((item) => (
            <Link
              key={item.slug}
              href={filterHref(query, activeCategory, item.slug)}
              aria-current={activeTag === item.slug ? 'page' : undefined}
              className={'rounded-full border px-3 py-1 text-xs ' + (activeTag === item.slug ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border-color)] opacity-70')}
            >{item.name}</Link>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="uiverse-card p-6 text-center text-sm opacity-70">暂时无法加载软件，请稍后再试。</div>
      ) : items.length === 0 ? (
        <div className="uiverse-card p-6 text-center text-sm opacity-70">没有找到符合条件的软件。</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <Link key={item.id} href={'/software/' + item.slug} className="uiverse-card flex flex-col items-center p-4 text-center transition hover:-translate-y-1">
              <div className="software-icon-frame mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title + ' 图标'} width={64} height={64} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{item.title.slice(0, 1)}</span>
                )}
              </div>
              <h2 className="line-clamp-1 text-sm font-semibold">{item.title}</h2>
              {(() => {
                const tagLabels: Record<string, string> = { '直播推流': '直播', '屏幕录制': '录屏' };
                const itemTags = (item.tags || [])
                  .map((entry) => Array.isArray(entry.tag) ? entry.tag[0]?.name : entry.tag?.name)
                  .filter((name): name is string => Boolean(name))
                  .map((name) => tagLabels[name] || name)
                  .sort((a, b) => {
                    const order = ['直播', '录屏', '免费开源'];
                    const ai = order.indexOf(a);
                    const bi = order.indexOf(b);
                    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
                  })
                  .slice(0, 3);
                return itemTags.length ? (
                  <div className="mt-2 flex w-full flex-nowrap items-center justify-center gap-1">
                    {itemTags.map((name) => (
                      <span key={name} className="whitespace-nowrap rounded-full px-1.5 py-1 text-[9px] leading-none" style={{ background: 'var(--accent-bg)', color: 'var(--text-secondary)' }}>{name}</span>
                    ))}
                  </div>
                ) : null;
              })()}
            </Link>
          ))}
        </div>
      )}

      {!error && items.length ? (
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/software" query={paginationQuery} />
      ) : null}
    </>
  );
}
