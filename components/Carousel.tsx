'use client';

import { useState, useEffect } from 'react';
import ParticleBackground from '@/components/ParticleBackground';

const slides = [
  { title: '精选软件', desc: '发现高效实用的开源免费工具', tags: ['免费开源', '精选推荐', '每日更新'] },
  { title: '技术文章', desc: '软件推荐、使用教程与技术分享', tags: ['教程', '评测', '技巧'] },
  { title: '分类浏览', desc: '按分类快速找到你需要的工具', tags: ['工具', '开发', '多媒体'] },
];

export default function Carousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIdx(current => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[idx];

  return (
    <section
      aria-label="首页精选轮播"
      className="home-feature relative isolate mb-8 overflow-hidden rounded-2xl border"
      style={{
        borderColor: 'var(--border-color)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <ParticleBackground />
      <div className="home-feature-glow home-feature-glow-one" />
      <div className="home-feature-glow home-feature-glow-two" />
      <div className="relative z-10 flex min-h-[190px] flex-col justify-center px-6 py-8 sm:min-h-[220px] sm:px-10 sm:py-10">
        <div key={idx} className="home-feature-copy">
          <span className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: 'var(--border-color)', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            OWENFX · 精选推荐
          </span>
          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">{slide.title}</h2>
          <p className="mb-5 max-w-xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{slide.desc}</p>
          <div className="flex flex-wrap gap-2">
            {slide.tags.map(tag => (
              <span key={tag} className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: 'var(--border-color)', background: 'rgba(129,140,248,0.07)', color: 'var(--text-secondary)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-7 flex items-center gap-2" aria-label="轮播分页">
          {slides.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={`切换到第 ${index + 1} 张`}
              aria-current={index === idx ? 'true' : undefined}
              onClick={() => setIdx(index)}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: index === idx ? 28 : 8,
                background: index === idx ? 'var(--accent)' : 'var(--text-tertiary)',
                opacity: index === idx ? 1 : 0.45,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        .home-feature { box-shadow: 0 12px 44px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.07); animation: home-breathe 6s ease-in-out infinite; }
        .home-feature-glow { position:absolute; z-index:0; width:240px; height:180px; border-radius:999px; filter:blur(58px); pointer-events:none; opacity:.2; }
        .home-feature-glow-one { top:-90px; left:12%; background:#818cf8; animation: home-glow-one 7s ease-in-out infinite; }
        .home-feature-glow-two { right:8%; bottom:-110px; background:#06b6d4; animation: home-glow-two 8s ease-in-out infinite; }
        .home-feature-copy { animation: home-copy-in .55s ease both; }
        @keyframes home-breathe { 0%,100% { box-shadow:0 12px 44px rgba(0,0,0,.12),0 0 18px rgba(129,140,248,.07),inset 0 1px 0 rgba(255,255,255,.07); } 50% { box-shadow:0 16px 52px rgba(0,0,0,.16),0 0 34px rgba(129,140,248,.17),inset 0 1px 0 rgba(255,255,255,.12); } }
        @keyframes home-glow-one { 0%,100% { transform:translate3d(0,0,0) scale(1); opacity:.16; } 50% { transform:translate3d(35px,22px,0) scale(1.18); opacity:.3; } }
        @keyframes home-glow-two { 0%,100% { transform:translate3d(0,0,0) scale(1); opacity:.13; } 50% { transform:translate3d(-28px,-18px,0) scale(1.2); opacity:.26; } }
        @keyframes home-copy-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .home-feature,.home-feature-glow,.home-feature-copy { animation:none !important; } }
      `}</style>
    </section>
  );
}
