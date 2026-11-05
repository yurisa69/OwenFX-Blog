'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const slides = [
  { title: '精选 AI 工具合集', desc: 'Cursor、Claude、Midjourney 等效率利器', href: '/software', color: '#818cf8' },
  { title: '开源软件推荐', desc: '免费、安全、持续维护的优质开源项目', href: '/software', color: '#06b6d4' },
  { title: '技术文章与教程', desc: '设计、前端、运营与增长实践分享', href: '/articles', color: '#a855f7' },
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
      <div className="px-6 py-10 sm:px-10 sm:py-14">
        <div className="max-w-xl">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: s.color + '22', color: s.color }}>精选推荐</span>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{s.title}</h2>
          <p className="text-sm sm:text-base mb-6" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
          <Link href={s.href} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white" style={{ background: s.color }}>
            立即查看 →
          </Link>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className="w-2 h-2 rounded-full transition-all" style={{ background: i === idx ? 'var(--accent)' : 'var(--text-tertiary)', opacity: i === idx ? 1 : 0.4 }} />
        ))}
      </div>
    </div>
  );
}
