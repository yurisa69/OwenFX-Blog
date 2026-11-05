'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const slides = [
  { title: '精选软件', desc: '发现高效实用的开源免费工具', href: '/software', tags: ['免费开源', '精选推荐', '每日更新'] },
  { title: '技术文章', desc: '软件推荐、使用教程与技术分享', href: '/articles', tags: ['教程', '评测', '技巧'] },
  { title: '分类浏览', desc: '按分类快速找到你需要的工具', href: '/categories', tags: ['工具', '开发', '多媒体'] },
];

export default function Carousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = slides[idx];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] mb-6" style={{ background: 'var(--bg-glass)' }}>
      <div className="px-6 py-10 sm:px-10 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">{s.title}</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{s.desc}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {s.tags.map(t => (
            <span key={t} className="rounded-full px-3 py-1 text-xs" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{t}</span>
          ))}
        </div>
        <Link href={s.href} className="inline-flex rounded-xl px-5 py-2.5 text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>立即查看</Link>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className="w-2 h-2 rounded-full" style={{ background: i === idx ? 'var(--accent)' : 'var(--text-tertiary)', opacity: i === idx ? 1 : 0.4 }} />
        ))}
      </div>
    </div>
  );
}
