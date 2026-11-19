'use client';

import { useEffect, useMemo, useState } from 'react';
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

function getTagDisplayName(name: string) {
  return name === '免费开源' ? '开源免费' : name;
}

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
  const [displayTags, setDisplayTags] = useState(tags);

  useEffect(() => {
    const shuffled = [...tags];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    setDisplayTags(shuffled);
  }, [tags]);

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
    displayTags.filter((_, index) => index % 2 === 0),
    displayTags.filter((_, index) => index % 2 === 1),
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
        onPointerDown={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onClick={() => {
          setSelectedTag((current) => current === tag.slug ? null : tag.slug);
        }}
        className={`shrink-0 whitespace-nowrap border-0 bg-transparent px-1 py-0 text-sm font-medium transition-colors duration-200 cursor-pointer touch-manipulation select-none focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 ${active ? 'software-tag-active' : ''}`}
      >
        <span className="software-tag-electric-label">
          <span className="software-tag-breath-opacity">
            <span className="software-tag-breath-text" data-text={getTagDisplayName(tag.name)}>{getTagDisplayName(tag.name)}</span>
          </span>
          {active && (
            <svg className="software-tag-electric-overlay" viewBox="0 0 86 24" preserveAspectRatio="none" aria-hidden="true">
              <path className="software-tag-electric-trace software-tag-electric-glow-outer" pathLength="1000" d="M3 20 L8 3 L13 20 M5 13 H11 M17 20 V8 C17 5 25 4 25 10 V20 M38 3 V20 M38 12 C35 5 29 6 29 13 C29 20 36 21 38 14 M43 20 V7 M43 11 C45 6 48 6 50 7 M62 13 C62 5 54 5 54 13 C54 21 62 21 62 13 M68 7 V20 M68 3.5 V3 M83 3 V20 M83 12 C80 5 74 6 74 13 C74 20 81 21 83 14" />
              <path className="software-tag-electric-trace software-tag-electric-glow-mid" pathLength="1000" d="M3 20 L8 3 L13 20 M5 13 H11 M17 20 V8 C17 5 25 4 25 10 V20 M38 3 V20 M38 12 C35 5 29 6 29 13 C29 20 36 21 38 14 M43 20 V7 M43 11 C45 6 48 6 50 7 M62 13 C62 5 54 5 54 13 C54 21 62 21 62 13 M68 7 V20 M68 3.5 V3 M83 3 V20 M83 12 C80 5 74 6 74 13 C74 20 81 21 83 14" />
              <path className="software-tag-electric-trace software-tag-electric-glow-core" pathLength="1000" d="M3 20 L8 3 L13 20 M5 13 H11 M17 20 V8 C17 5 25 4 25 10 V20 M38 3 V20 M38 12 C35 5 29 6 29 13 C29 20 36 21 38 14 M43 20 V7 M43 11 C45 6 48 6 50 7 M62 13 C62 5 54 5 54 13 C54 21 62 21 62 13 M68 7 V20 M68 3.5 V3 M83 3 V20 M83 12 C80 5 74 6 74 13 C74 20 81 21 83 14" />
            </svg>
          )}
        </span>
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
                  <div className="tag-cloud-segment flex shrink-0 items-center gap-8 pr-8">
                    {rowTags.map((tag) => renderTag(tag, rowIndex))}
                  </div>
                  <div className="tag-cloud-segment flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
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
                  '开源免费': '开源免费',
                  '免费开源': '开源免费',
                };
                const cardTags = getSoftwareTagNames(item)
                  .map((tag) => tagLabels[tag] || tag)
                  .sort((a, b) => {
                    const order = ['直播', '录屏', '开源免费'];
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
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .tag-cloud-track {
          display: flex;
          width: max-content;
          animation-name: tag-cloud-danmaku;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        .tag-cloud-segment {
          flex: 0 0 auto;
          min-width: max-content;
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
