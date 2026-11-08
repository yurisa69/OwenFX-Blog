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
};

const categoryOrder = ['工具', '多媒体', '开发工具', '系统增强', 'Android软件', 'Windows软件'];
const categoryColors: Record<string, string> = {
  '工具': '#FF4444',
  '多媒体': '#FF8C00',
  '开发工具': '#FFD700',
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
                  <img src={item.image_url} alt={item.title + ' 官方图标'} className="software-official-icon" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{item.title.slice(0, 1)}</span>
                )}
              </div>
              <h2 className="line-clamp-1 text-sm font-semibold">{item.title}</h2>
              <p className="mt-1 line-clamp-2 text-xs opacity-60">{item.description || item.developer || item.platform || '软件详情'}</p>
              {item.version && <span className="mt-2 text-[11px] opacity-50">{item.version}</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
