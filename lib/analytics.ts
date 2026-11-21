export type AnalyticsSourceType = 'direct' | 'search' | 'referral' | 'internal' | 'campaign';
export type AnalyticsSource = {
  source_type: AnalyticsSourceType;
  source_name: string | null;
  referrer_host: string | null;
};

const searchHostPatterns = [
  /(^|\.)google\./iu,
  /(^|\.)bing\.com$/iu,
  /(^|\.)duckduckgo\.com$/iu,
  /(^|\.)baidu\.com$/iu,
  /(^|\.)sogou\.com$/iu,
  /(^|\.)so\.com$/iu,
  /(^|\.)yahoo\.com$/iu,
  /(^|\.)yandex\./iu,
  /(^|\.)naver\.com$/iu,
];

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/\.$/u, '').replace(/^www\./u, '');
}

export function resolveAnalyticsSource(rawReferrer: unknown, requestUrl: string, rawUtmSource: unknown): AnalyticsSource {
  let referrerHost: string | null = null;
  if (typeof rawReferrer === 'string' && rawReferrer.length <= 2048) {
    try {
      const referrer = new URL(rawReferrer);
      if (referrer.protocol === 'http:' || referrer.protocol === 'https:') {
        referrerHost = normalizeHost(referrer.hostname);
      }
    } catch {
      referrerHost = null;
    }
  }

  const utmSource = typeof rawUtmSource === 'string'
    ? rawUtmSource.trim().replace(/[^a-z0-9._-]/giu, '').slice(0, 80)
    : '';
  if (utmSource) return { source_type: 'campaign', source_name: utmSource, referrer_host: referrerHost };
  if (!referrerHost) return { source_type: 'direct', source_name: null, referrer_host: null };

  let currentHost = '';
  try {
    currentHost = normalizeHost(new URL(requestUrl).hostname);
  } catch {
    currentHost = '';
  }
  if (currentHost && referrerHost === currentHost) {
    return { source_type: 'internal', source_name: null, referrer_host: referrerHost };
  }
  if (searchHostPatterns.some(pattern => pattern.test(referrerHost))) {
    return { source_type: 'search', source_name: null, referrer_host: referrerHost };
  }
  return { source_type: 'referral', source_name: null, referrer_host: referrerHost };
}
