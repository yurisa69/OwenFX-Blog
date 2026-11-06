'use client';

import { useState, useEffect } from 'react';

const slides = [
  { title: '精选软件', desc: '发现高效实用的开源免费工具', tags: ['免费开源', '精选推荐', '每日更新'] },
  { title: '技术文章', desc: '软件推荐、使用教程与技术分享', tags: ['教程', '评测', '技巧'] },
  { title: '分类浏览', desc: '按分类快速找到你需要的工具', tags: ['工具', '开发', '多媒体'] },
];

const glowPalettes = [
  ['#818cf8', '#22d3ee', '#a78bfa'],
  ['#f472b6', '#60a5fa', '#c084fc'],
  ['#34d399', '#fbbf24', '#fb7185'],
];

type Glow = { x: number; y: number };

export default function Carousel() {
  const [idx, setIdx] = useState(0);
  const [glowRound, setGlowRound] = useState(0);
  const [glowPositions, setGlowPositions] = useState<Glow[]>([
    { x: 18, y: 28 },
    { x: 78, y: 34 },
    { x: 52, y: 82 },
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIdx(current => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGlowRound(current => (current + 1) % glowPalettes.length);
      setGlowPositions(
        Array.from({ length: 3 }, () => ({
          x: 8 + Math.random() * 84,
          y: 12 + Math.random() * 76,
        }))
      );
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[idx];
  const activePalette = glowPalettes[glowRound];

  return (
    <section
      aria-label="首页精选轮播"
      className="home-feature relative isolate mb-8 overflow-hidden rounded-2xl border"
      style={{
        borderColor: 'var(--border-color)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      {glowPositions.map((position, index) => (
        <div
          key={index}
          className="home-feature-glow"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            background: activePalette[index],
          }}
        />
      ))}
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
        .home-feature { box-shadow:0 12px 36px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.07); }
        .home-feature-glow { position:absolute; z-index:0; width:220px; height:170px; border-radius:999px; filter:blur(48px); pointer-events:none; opacity:.19; transform:translate(-50%,-50%); transition:left 5.8s cubic-bezier(.22,.61,.36,1),top 5.8s cubic-bezier(.22,.61,.36,1),background-color 1.4s ease; }
        .home-feature-copy { animation:home-copy-in .45s ease both; }
        @keyframes home-copy-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 640px) {
          .home-feature { backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); }
          .home-feature-glow { width:145px; height:115px; filter:blur(32px); opacity:.15; transition:left 6.5s ease-in-out,top 6.5s ease-in-out,background-color 1.8s ease; }
          .home-feature-copy { animation:none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-feature-glow,.home-feature-copy { animation:none !important; transition:none !important; }
        }
      `}</style>
    </section>
  );
}
