'use client';
import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setVisible(false), 2000);
      } else {
        setVisible(false);
        if (timer) clearTimeout(timer);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (timer) clearTimeout(timer); };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button onClick={scrollToTop} aria-label="返回顶部"
      className={"fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white active:bg-[var(--accent)] active:text-white active:scale-90 " + (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
      </svg>
    </button>
  );
}
