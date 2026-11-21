export type AnalyticsSourceType = 'direct' | 'search' | 'referral' | 'internal' | 'campaign';
export type AnalyticsSourceSnapshot = {
  source_type: AnalyticsSourceType;
  source_name: string | null;
  referrer_host: string | null;
};
export type AnalyticsSource = AnalyticsSourceSnapshot & {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

const sourceTypes = new Set<AnalyticsSourceType>(['direct', 'search', 'referral', 'internal', 'campaign']);

const searchHostPatterns = [
  /(^|\.)google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/iu,
  /(^|\.)bing\.com$/iu,
  /(^|\.)duckduckgo\.com$/iu,
  /(^|\.)baidu\.com$/iu,
  /(^|\.)sogou\.com$/iu,
  /(^|\.)so\.com$/iu,
  /(^|\.)sm\.cn$/iu,
  /(^|\.)yahoo\.(?:com|[a-z]{2,3}|co\.[a-z]{2})$/iu,
  /(^|\.)yandex\.(?:com|[a-z]{2,3}|com\.[a-z]{2})$/iu,
  /(^|\.)naver\.com$/iu,
  /(^|\.)search\.brave\.com$/iu,
  /(^|\.)ecosia\.org$/iu,
  /(^|\.)qwant\.com$/iu,
  /(^|\.)startpage\.com$/iu,
];

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/\.$/u, '').replace(/^www\./u, '');
}

export function sanitizeAnalyticsLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const sanitized = value.normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 80);
  return sanitized || null;
}

function parseHttpHost(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return normalizeHost(url.hostname).slice(0, 180) || null;
  } catch {
    return null;
  }
}

function parseSafeHost(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 180) return null;
  const host = normalizeHost(value.trim());
  if (!host || !/^[a-z0-9.-]+$/iu.test(host) || host.startsWith('.') || host.endsWith('.') || host.includes('..')) {
    return null;
  }
  return host;
}

export function isExternalAnalyticsSource(source: AnalyticsSourceSnapshot | null | undefined): source is AnalyticsSourceSnapshot {
  return !!source && (source.source_type === 'search' || source.source_type === 'referral' || source.source_type === 'campaign');
}

export function normalizeAnalyticsSourceSnapshot(value: unknown): AnalyticsSourceSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const sourceType = candidate.source_type;
  if (typeof sourceType !== 'string' || !sourceTypes.has(sourceType as AnalyticsSourceType)) return null;
  return {
    source_type: sourceType as AnalyticsSourceType,
    source_name: sanitizeAnalyticsLabel(candidate.source_name),
    referrer_host: parseSafeHost(candidate.referrer_host),
  };
}

export function resolveAnalyticsSource(
  rawReferrer: unknown,
  requestUrl: string,
  rawUtmSource: unknown,
  rawUtmMedium?: unknown,
  rawUtmCampaign?: unknown,
): AnalyticsSource {
  const utmSource = sanitizeAnalyticsLabel(rawUtmSource);
  const utmMedium = sanitizeAnalyticsLabel(rawUtmMedium);
  const utmCampaign = sanitizeAnalyticsLabel(rawUtmCampaign);
  const rawReferrerHost = parseHttpHost(rawReferrer);

  let currentHost = '';
  try {
    currentHost = normalizeHost(new URL(requestUrl).hostname);
  } catch {
    currentHost = '';
  }

  if (utmSource || utmMedium || utmCampaign) {
    return {
      source_type: 'campaign',
      source_name: utmSource || utmCampaign || utmMedium,
      referrer_host: rawReferrerHost && rawReferrerHost !== currentHost ? rawReferrerHost : null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    };
  }

  if (!rawReferrerHost) {
    return {
      source_type: 'direct',
      source_name: null,
      referrer_host: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    };
  }

  if (currentHost && rawReferrerHost === currentHost) {
    return {
      source_type: 'internal',
      source_name: null,
      referrer_host: rawReferrerHost,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    };
  }

  const sourceType = searchHostPatterns.some(pattern => pattern.test(rawReferrerHost)) ? 'search' : 'referral';
  return {
    source_type: sourceType,
    source_name: null,
    referrer_host: rawReferrerHost,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
  };
}
