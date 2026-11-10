'use client';

import { useState } from 'react';

type AvatarProps = {
  src?: string | null;
  alt?: string;
  fallback: string;
  className?: string;
  priority?: boolean;
};

export default function Avatar({
  src,
  alt = '',
  fallback,
  className = '',
  priority = false,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Render a known avatar URL immediately. The fallback is only for a missing
  // URL or a real image request failure; it never covers a loading image.
  if (!src || failedSrc === src) {
    return (
      <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailedSrc(src)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
