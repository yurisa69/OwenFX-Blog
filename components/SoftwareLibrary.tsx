import Link from 'next/link';

type SoftwareCategory = { id: string; name: string; slug: string };

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
  tags: { tag: { name: string } | { name: string }[] | null }[] | null;
};

const categoryOrder = ['工具', '多媒体', '系统增强', 'Android软件', 'Windows软件'];
const categoryColors: Record<string, string> = {
  '工具': '#FF4444',
  '多媒体': '#FF8C00',
  '系统增强': '#3FB950',
  'Android软件': '#3B82F6',
  'Windows软件': '#A855F7',
};

export default function SoftwareLibrary({
  items,
  categories,
  activeCategory,
}: {
  items: SoftwareItem[];
  categories: SoftwareCategory[];
  activeCategory: string;
}) {
  const orderedCategories = [...categories].sort((a, b) => {
    const ai = categoryOrder.indexOf(a.name);
    const bi = categoryOrder.indexOf(b.name);
    return (ai < 0 ? categoryOrder.length : ai) - (bi < 0 ? categoryOrder.length : bi);
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" aria-label="软件分类筛选">
        <Link
          href="/software"
          aria-current={activeCategory === 'all' ? 'page' : undefined}
          className={`uiverse-btn !px-4 !py-1.5 text-xs ${activeCategory === 'all' ? 'uiverse-btn-primary' : 'uiverse-btn-ghost'}`}
        >
          全部
        </Link>
        {orderedCategories.map(category => (
          <Link
            key={category.id}
            href={'/software?category=' + encodeURIComponent(category.slug)}
            aria-current={activeCategory === category.slug ? 'page' : undefined}
            className={`uiverse-btn !px-4 !py-1.5 text-xs ${activeCategory === category.slug ? 'uiverse-btn-primary' : 'uiverse-btn-ghost'}`}
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: categoryColors[category.name] || 'var(--accent)' }} />
            {category.name}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="uiverse-card p-6 text-center text-sm opacity-70">该分类暂时没有上架软件。</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map(item => (
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
                const tagLabels: Record<string, string> = {
                  '直播推流': '直播',
                  '屏幕录制': '录屏',
                };
                const tags = (item.tags || [])
                  .map(entry => Array.isArray(entry.tag) ? entry.tag[0]?.name : entry.tag?.name)
                  .filter((tag): tag is string => Boolean(tag))
                  .map(tag => tagLabels[tag] || tag)
                  .sort((a, b) => {
                    const order = ['直播', '录屏', '免费开源'];
                    const ai = order.indexOf(a);
                    const bi = order.indexOf(b);
                    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
                  })
                  .slice(0, 3);
                return tags.length > 0 ? (
                  <div className="mt-2 flex w-full flex-nowrap items-center justify-center gap-1">
                    {tags.map(tag => (
                      <span key={tag} className="whitespace-nowrap rounded-full px-1.5 py-1 text-[9px] leading-none" style={{ background: 'var(--accent-bg)', color: 'var(--text-secondary)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
