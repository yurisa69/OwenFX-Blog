'use client';

import Link from 'next/link';
import { useState } from 'react';

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

export default function SoftwareLibrary({ items }: { items: SoftwareItem[] }) {
  const [activeCategory, setActiveCategory] = useState('全部');
  const filteredItems = activeCategory === '全部'
    ? items
    : items.filter((item) => item.category?.name === activeCategory);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" aria-label="软件分类筛选">
        <button
          type="button"
          onClick={() => setActiveCategory('全部')}
          aria-pressed={activeCategory === '全部'}
          className={`uiverse-btn !px-4 !py-1.5 text-xs ${activeCategory === '全部' ? 'uiverse-btn-primary' : 'uiverse-btn-ghost'}`}
        >
          全部
        </button>
        {categoryOrder.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveCategory(name)}
            aria-pressed={activeCategory === name}
            className={`uiverse-btn !px-4 !py-1.5 text-xs ${activeCategory === name ? 'uiverse-btn-primary' : 'uiverse-btn-ghost'}`}
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: categoryColors[name] }} />
            {name}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="uiverse-card p-6 text-center text-sm opacity-70">该分类暂时没有上架软件。</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filteredItems.map((item) => (
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
                  .map((entry) => Array.isArray(entry.tag) ? entry.tag[0]?.name : entry.tag?.name)
                  .filter((tag): tag is string => Boolean(tag))
                  .map((tag) => tagLabels[tag] || tag)
                  .sort((a, b) => {
                    const order = ['直播', '录屏', '免费开源'];
                    const ai = order.indexOf(a);
                    const bi = order.indexOf(b);
                    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
                  })
                  .slice(0, 3);
                return tags.length > 0 ? (
                  <div className="mt-2 flex w-full flex-nowrap items-center justify-center gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="whitespace-nowrap rounded-full px-1.5 py-1 text-[9px] leading-none"
                        style={{ background: 'var(--accent-bg)', color: 'var(--text-secondary)' }}>
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
