'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type SoftwareTag = {
  id: string;
  name: string;
  slug: string;
};

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
  tags: { tag: SoftwareTag | SoftwareTag[] | null }[] | null;
};

function getSoftwareTagNames(item: SoftwareItem) {
  return (item.tags || [])
    .map((entry) => Array.isArray(entry.tag) ? entry.tag[0]?.name : entry.tag?.name)
    .filter((tag): tag is string => Boolean(tag));
}

export default function SoftwareLibrary({
  items,
  tags,
  initialCategory = '全部',
}: {
  items: SoftwareItem[];
  tags: SoftwareTag[];
  initialCategory?: string;
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesCategory = initialCategory === '全部'
      || item.category?.name === initialCategory;
    const matchesTag = !selectedTag
      || (item.tags || []).some((entry) => {
        const relatedTags = Array.isArray(entry.tag)
          ? entry.tag
          : entry.tag ? [entry.tag] : [];
        return relatedTags.some((tag) => tag?.slug === selectedTag);
      });
    return matchesCategory && matchesTag;
  }), [items, initialCategory, selectedTag]);

  const tagRows = [
    tags.filter((_, index) => index % 2 === 0),
    tags.filter((_, index) => index % 2 === 1),
  ];

  const renderTag = (tag: SoftwareTag | null, row: number, index: number, duplicate = false) => {
    const isAll = tag === null;
    const active = isAll ? selectedTag === null : selectedTag === tag.slug;
    return (
      <button
        key={`${row}-${duplicate ? 'copy-' : ''}${tag?.id ?? 'all'}-${index}`}
        type="button"
        tabIndex={duplicate ? -1 : 0}
        aria-hidden={duplicate || undefined}
        aria-pressed={duplicate ? undefined : active}
        onClick={() => {
          if (duplicate) return;
          setSelectedTag(isAll || active ? null : tag?.slug ?? null);
        }}
        className="shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors duration-200"
        style={{
          borderColor: active ? 'var(--accent)' : 'var(--border)',
          background: active ? 'var(--accent-bg)' : 'var(--card-bg)',
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
        }}
      >
        {tag?.name ?? '全部'}
      </button>
    );
  };

  return (
    <>
      {tags.length > 0 && (
        <section className="mb-8" aria-label="软件标签筛选">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">热门标签</h2>
            <span className="text-xs opacity-60">选择标签筛选软件</span>
          </div>
          <div className="tag-cloud group relative flex flex-col gap-3 overflow-hidden py-1">
            {tagRows.map((rowTags, rowIndex) => {
              const rowItems = rowIndex === 0 ? [null, ...rowTags] : rowTags;
              return (
                <div
                  key={rowIndex}
                  className={`tag-cloud-track flex w-max items-center ${rowIndex === 0 ? 'tag-cloud-forward' : 'tag-cloud-reverse'}`}
                >
                  <div className="flex shrink-0 items-center gap-2.5">
                    {rowItems.map((tag, index) => renderTag(tag, rowIndex, index))}
                  </div>
                  <div className="-ml-2.5 flex shrink-0 items-center gap-2.5" aria-hidden="true">
                    {rowItems.map((tag, index) => renderTag(tag, rowIndex, index, true))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {filteredItems.length === 0 ? (
        <div className="uiverse-card p-6 text-center text-sm opacity-70">
          {selectedTag ? '没有找到带有该标签的软件。' : '该分类暂时没有上架软件。'}
        </div>
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
                const cardTags = getSoftwareTagNames(item)
                  .map((tag) => tagLabels[tag] || tag)
                  .sort((a, b) => {
                    const order = ['直播', '录屏', '免费开源'];
                    const ai = order.indexOf(a);
                    const bi = order.indexOf(b);
                    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
                  })
                  .slice(0, 3);
                return cardTags.length > 0 ? (
                  <div className="mt-2 flex w-full flex-nowrap items-center justify-center gap-1">
                    {cardTags.map((tag) => (
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

      <style jsx>{`
        @keyframes tag-cloud-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes tag-cloud-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .tag-cloud-track {
          animation-duration: 34s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .tag-cloud-forward { animation-name: tag-cloud-left; }
        .tag-cloud-reverse { animation-name: tag-cloud-right; animation-duration: 39s; }
        .tag-cloud:hover .tag-cloud-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .tag-cloud-track { animation: none; }
          .tag-cloud { overflow-x: auto; }
        }
      `}</style>
    </>
  );
}
