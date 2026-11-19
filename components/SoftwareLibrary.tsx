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

  const renderTag = (tag: SoftwareTag, row: number, duplicate = false) => {
    const active = selectedTag === tag.slug;
    return (
      <button
        key={`${row}-${duplicate ? 'copy-' : ''}${tag.id}`}
        type="button"
        tabIndex={duplicate ? -1 : 0}
        aria-hidden={duplicate || undefined}
        aria-pressed={duplicate ? undefined : active}
        onClick={() => {
          if (!duplicate) setSelectedTag(active ? null : tag.slug);
        }}
        className={`shrink-0 cursor-pointer whitespace-nowrap border-0 bg-transparent px-1 py-0 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 ${active ? 'software-tag-active' : ''}`}
      >
        {row === 0 && !duplicate && tag.id === tags[0]?.id ? (
          <span className="software-tag-electric-label">
            {tag.name}
            <svg className="software-tag-electric-overlay" viewBox="0 0 86 24" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id="software-tag-electric-glow" x="-80%" y="-120%" width="260%" height="340%">
                  <feGaussianBlur stdDeviation="1.7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                id="software-tag-electric-path"
                className="software-tag-electric-trace"
                pathLength="1000"
                d="M3 20 L8 3 L13 20 M5 13 H11 M17 20 V8 C17 5 25 4 25 10 V20 M38 3 V20 M38 12 C35 5 29 6 29 13 C29 20 36 21 38 14 M43 20 V7 M43 11 C45 6 48 6 50 7 M62 13 C62 5 54 5 54 13 C54 21 62 21 62 13 M68 7 V20 M68 3.5 V3 M83 3 V20 M83 12 C80 5 74 6 74 13 C74 20 81 21 83 14"
              />
              <circle className="software-tag-electric-halo" r="3.1" filter="url(#software-tag-electric-glow)">
                <animateMotion dur="3.4s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#software-tag-electric-path" />
                </animateMotion>
              </circle>
              <circle className="software-tag-electric-core" r="1.25">
                <animateMotion dur="3.4s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#software-tag-electric-path" />
                </animateMotion>
              </circle>
            </svg>
          </span>
        ) : tag.name}
      </button>
    );
  };

  return (
    <>
      {tags.length > 0 && (
        <section className="mb-8" aria-label="软件标签筛选">
          <div className="tag-cloud group flex flex-col gap-4 overflow-hidden py-2">
            {tagRows.map((rowTags, rowIndex) => (
              rowTags.length > 0 && (
                <div
                  key={rowIndex}
                  className={`tag-cloud-track flex w-max items-center ${rowIndex === 0 ? 'tag-cloud-fast' : 'tag-cloud-slow'}`}
                >
                  <div className="flex shrink-0 items-center gap-8 pr-8">
                    {rowTags.map((tag) => renderTag(tag, rowIndex))}
                  </div>
                  <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
                    {rowTags.map((tag) => renderTag(tag, rowIndex, true))}
                  </div>
                </div>
              )
            ))}
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
        @keyframes tag-cloud-danmaku {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .tag-cloud-track {
          animation-name: tag-cloud-danmaku;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .tag-cloud-fast { animation-duration: 28s; }
        .tag-cloud-slow { animation-duration: 36s; }
        @media (prefers-reduced-motion: reduce) {
          .tag-cloud-track { animation: none; }
          .tag-cloud { overflow-x: auto; }
        }
      `}</style>
    </>
  );
}
