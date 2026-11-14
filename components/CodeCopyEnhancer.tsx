'use client';

import { useEffect, useRef } from 'react';

export default function CodeCopyEnhancer({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanups: Array<() => void> = [];
    container.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.code-copy-button')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制代码');
      const onClick = async () => {
        const code = pre.querySelector('code')?.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = '已复制';
        } catch {
          button.textContent = '复制失败';
        }
        window.setTimeout(() => {
          button.textContent = '复制';
        }, 1600);
      };
      button.addEventListener('click', onClick);
      pre.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener('click', onClick);
        button.remove();
      });
    });

    return () => cleanups.forEach(cleanup => cleanup());
  }, [html]);

  return <div ref={containerRef} className="prose-block" dangerouslySetInnerHTML={{ __html: html }} />;
}
