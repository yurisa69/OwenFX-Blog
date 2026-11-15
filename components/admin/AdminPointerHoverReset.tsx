'use client';

import { useEffect } from 'react';

/**
 * Prevent a pointer hover state from transferring to a different admin-page
 * control after navigation. Hover styling returns as soon as the pointer moves.
 */
export default function AdminPointerHoverReset() {
  useEffect(() => {
    const root = document.documentElement;

    function handlePointerDown() {
      root.classList.add('admin-pointer-hover-suppressed');
      document.addEventListener('pointermove', handlePointerMove, { capture: true, once: true });
    }

    function handlePointerMove() {
      root.classList.remove('admin-pointer-hover-suppressed');
      document.removeEventListener('pointermove', handlePointerMove, true);
    }

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointermove', handlePointerMove, true);
      root.classList.remove('admin-pointer-hover-suppressed');
    };
  }, []);

  return null;
}
