'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const visitorCookieName = 'owenfx_visitor_id';
const visitorCookieMaxAge = 60 * 60 * 24 * 30;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function getVisitorId() {
  const existing = document.cookie.split(';').map(value => value.trim())
    .find(value => value.startsWith(visitorCookieName + '='))
    ?.slice(visitorCookieName.length + 1);
  if (existing && uuidPattern.test(existing)) return existing;

  const visitorId = window.crypto?.randomUUID?.();
  if (!visitorId) return null;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = visitorCookieName + '=' + visitorId
    + '; Path=/; Max-Age=' + visitorCookieMaxAge + '; SameSite=Lax' + secure;
  return visitorId;
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedKey = useRef('');

  useEffect(() => {
    if (!pathname || /^\/(admin|auth|api)(\/|$)/u.test(pathname)) return;

    const articleMatch = pathname.match(/^\/articles\/([^/]+)\/?$/u);
    const softwareMatch = pathname.match(/^\/software\/([^/]+)\/?$/u);
    const eventType = articleMatch ? 'article_view' : softwareMatch ? 'software_view' : 'page_view';
    const trackedKey = eventType + ':' + pathname;
    if (lastTrackedKey.current === trackedKey) return;
    lastTrackedKey.current = trackedKey;

    const query = new URLSearchParams(window.location.search);
    const payload = {
      event_type: eventType,
      target_key: pathname,
      article_id: articleMatch ? articleMatch[1] : null,
      software_slug: softwareMatch ? decodeURIComponent(softwareMatch[1]) : null,
      visitor_id: getVisitorId(),
      referrer_url: document.referrer || null,
      utm_source: query.get('utm_source'),
    };
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
