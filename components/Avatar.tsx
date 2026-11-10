'use client';

import { useState, type SyntheticEvent } from 'react';

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
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageReady = Boolean(src && loadedSrc === src && failedSrc !== src);

  const handleLoad = async (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    try {
      if (typeof image.decode === 'function') await image.decode();
    } catch {
      // Keep the fallback visible if decoding fails.
      setFailedSrc(src || null);
      return;
    }
    if (src && image.isConnected) setLoadedSrc(src);
  };

  return (
    <span className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        {fallback}
      </span>
      {src && failedSrc !== src && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={() => setFailedSrc(src)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${imageReady ? 'opacity-100' : 'opacity-0'} ${className}`}
        />
      )}
    </span>
  );
}
