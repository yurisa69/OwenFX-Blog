'use client';

import { useEffect, useRef } from 'react';

export default function CodeCopyEnhancer({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanups: Array<() => void> = [];
    const codeBlocks = Array.from(container.querySelectorAll('pre'));
    const codeBlockShells = new Map<HTMLPreElement, HTMLDivElement>();

    codeBlocks.forEach((pre) => {
      const shell = document.createElement('div');
      shell.className = 'code-block-shell';
      pre.parentNode?.insertBefore(shell, pre);
      shell.appendChild(pre);
      codeBlockShells.set(pre, shell);

      const codeElement = pre.querySelector<HTMLElement>('code');
      if (codeElement) {
        const updateOverflowState = () => {
          const hasHorizontalScroll =
            codeElement.scrollWidth > codeElement.clientWidth + 1 ||
            pre.scrollWidth > pre.clientWidth + 1;
          pre.classList.toggle('has-horizontal-scroll', hasHorizontalScroll);
          codeElement.style.paddingBottom = hasHorizontalScroll ? '8px' : '0px';
        };

        const resizeObserver = new ResizeObserver(updateOverflowState);
        resizeObserver.observe(pre);
        resizeObserver.observe(codeElement);
        const frameId = window.requestAnimationFrame(updateOverflowState);

        cleanups.push(() => {
          window.cancelAnimationFrame(frameId);
          resizeObserver.disconnect();
          pre.classList.remove('has-horizontal-scroll');
          codeElement.style.removeProperty('padding-bottom');
        });
      }

      if (shell.querySelector('.code-copy-button')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code');
      button.setAttribute('title', 'Copy code');

      const onClick = async (event: MouseEvent) => {
        event.stopPropagation();
        const code = pre.querySelector('code')?.textContent || '';

        try {
          await navigator.clipboard.writeText(code);
          button.textContent = 'Copied';
          button.setAttribute('aria-label', 'Copied');
        } catch {
          button.textContent = 'Failed';
          button.setAttribute('aria-label', 'Copy failed');
        }

        window.setTimeout(() => {
          button.textContent = 'Copy';
          button.setAttribute('aria-label', 'Copy code');
        }, 1600);
      };

      button.addEventListener('click', onClick);
      shell.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener('click', onClick);
        button.remove();
        shell.classList.remove('code-copy-visible');
        if (shell.parentNode) {
          shell.parentNode.insertBefore(pre, shell);
          shell.remove();
        }
      });
    });

    const onContainerClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const activePre = target.closest('pre');
      codeBlockShells.forEach((shell, pre) => {
        shell.classList.toggle('code-copy-visible', pre === activePre);
      });
    };

    container.addEventListener('click', onContainerClick);
    cleanups.push(() => container.removeEventListener('click', onContainerClick));

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html]);

  return <div ref={containerRef} className="prose-block" dangerouslySetInnerHTML={{ __html: html }} />;
}
