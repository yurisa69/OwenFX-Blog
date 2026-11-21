'use client';

import { useEffect, useRef } from 'react';

export default function ArticleViewTracker({ articleId }: { articleId: string }) {
  const lastTrackedArticleId = useRef<string | null>(null);

  useEffect(() => {
    if (!articleId || lastTrackedArticleId.current === articleId) return;
    lastTrackedArticleId.current = articleId;

    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_type: 'article_view', article_id: articleId }),
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt article reading.
    });
  }, [articleId]);

  return null;
}
