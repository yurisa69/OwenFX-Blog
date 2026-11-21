'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  isExternalAnalyticsSource,
  normalizeAnalyticsSourceSnapshot,
  resolveAnalyticsSource,
  type AnalyticsSourceSnapshot,
} from '@/lib/analytics';

const visitorCookieName = 'owenfx_visitor_id';
const sessionCookieName = 'owenfx_session_id';
const firstSourceCookieName = 'owenfx_first_source';
const lastExternalSourceCookieName = 'owenfx_last_external_source';
const sessionSourceCookieName = 'owenfx_session_source';
const visitorCookieMaxAge = 60 * 60 * 24 * 30;
const sessionCookieMaxAge = 60 * 30;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function readCookie(name: string): string | null {
  const value = document.cookie.split(';').map(item => item.trim())
    .find(item => item.startsWith(name + '='))
    ?.slice(name.length + 1);
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = name + '=' + encodeURIComponent(value)
    + '; Path=/; Max-Age=' + maxAge + '; SameSite=Lax' + secure;
}

function readSourceCookie(name: string): AnalyticsSourceSnapshot | null {
  const raw = readCookie(name);
  if (!raw) return null;
  try {
    return normalizeAnalyticsSourceSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeSourceCookie(name: string, source: AnalyticsSourceSnapshot, maxAge: number) {
  writeCookie(name, JSON.stringify(source), maxAge);
}

function getVisitorId(): string | null {
  const existing = readCookie(visitorCookieName);
  if (existing && uuidPattern.test(existing)) return existing;

  const visitorId = window.crypto?.randomUUID?.();
  if (!visitorId) return null;
  writeCookie(visitorCookieName, visitorId, visitorCookieMaxAge);
  return visitorId;
}

function getSessionId(): { id: string | null; isNew: boolean } {
  const existing = readCookie(sessionCookieName);
  if (existing && uuidPattern.test(existing)) {
    writeCookie(sessionCookieName, existing, sessionCookieMaxAge);
    return { id: existing, isNew: false };
  }

  const sessionId = window.crypto?.randomUUID?.();
  if (!sessionId) return { id: null, isNew: true };
  writeCookie(sessionCookieName, sessionId, sessionCookieMaxAge);
  return { id: sessionId, isNew: true };
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedKey = useRef('');
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (/^\/(admin|auth|api)(\/|$)/u.test(pathname)) {
      previousPathname.current = pathname;
      return;
    }

    const articleMatch = pathname.match(/^\/articles\/([^/]+)\/?$/u);
    const softwareMatch = pathname.match(/^\/software\/([^/]+)\/?$/u);
    const eventType = articleMatch ? 'article_view' : softwareMatch ? 'software_view' : 'page_view';
    const trackedKey = eventType + ':' + pathname;
    if (lastTrackedKey.current === trackedKey) return;
    lastTrackedKey.current = trackedKey;

    const query = new URLSearchParams(window.location.search);
    const referrerUrl = previousPathname.current
      ? new URL(previousPathname.current, window.location.origin).toString()
      : document.referrer || null;
    const currentSource = resolveAnalyticsSource(
      referrerUrl,
      window.location.origin,
      query.get('utm_source'),
      query.get('utm_medium'),
      query.get('utm_campaign'),
    );
    const currentSnapshot: AnalyticsSourceSnapshot = {
      source_type: currentSource.source_type,
      source_name: currentSource.source_name,
      referrer_host: currentSource.referrer_host,
    };

    const firstSource = readSourceCookie(firstSourceCookieName) || currentSnapshot;
    writeSourceCookie(firstSourceCookieName, firstSource, visitorCookieMaxAge);

    const storedLastExternalSource = readSourceCookie(lastExternalSourceCookieName);
    const lastExternalSource = isExternalAnalyticsSource(currentSnapshot)
      ? currentSnapshot
      : storedLastExternalSource;
    if (lastExternalSource) {
      writeSourceCookie(lastExternalSourceCookieName, lastExternalSource, visitorCookieMaxAge);
    }

    const session = getSessionId();
    const storedSessionSource = readSourceCookie(sessionSourceCookieName);
    const sessionSource = session.isNew || !storedSessionSource ? currentSnapshot : storedSessionSource;
    writeSourceCookie(sessionSourceCookieName, sessionSource, sessionCookieMaxAge);

    const payload = {
      event_type: eventType,
      target_key: pathname,
      article_id: articleMatch ? articleMatch[1] : null,
      software_slug: softwareMatch ? decodeURIComponent(softwareMatch[1]) : null,
      visitor_id: getVisitorId(),
      session_id: session.id,
      referrer_url: referrerUrl,
      utm_source: currentSource.utm_source,
      utm_medium: currentSource.utm_medium,
      utm_campaign: currentSource.utm_campaign,
      first_source: firstSource,
      last_external_source: lastExternalSource,
      session_source: sessionSource,
    };

    previousPathname.current = pathname;
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
