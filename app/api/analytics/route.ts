import { NextResponse } from 'next/server';
import { createRateLimitBucketKey, getRequestIp, readLimitedRequestBody } from '@/lib/api-rate-limit';
import { resolveAnalyticsSource } from '@/lib/analytics';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const allowedEvents = new Set([
  'software_click', 'wechat_click', 'ad_click', 'article_view', 'software_view', 'page_view',
]);
const pageViewEvents = new Set(['page_view', 'article_view', 'software_view']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function parseReferrerHost(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.hostname.toLowerCase().slice(0, 180) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  if (!ip) return NextResponse.json({ error: '统计服务暂不可用。' }, { status: 503 });

  const service = createServiceClient();
  const bucketKey = createRateLimitBucketKey('analytics', ip);
  const { data: withinLimit, error: rateError } = await service.rpc('consume_api_rate_limit', {
    p_bucket_key: bucketKey, p_limit: 60, p_window_seconds: 60,
  });
  if (rateError) return NextResponse.json({ error: '统计服务暂不可用。' }, { status: 503 });
  if (withinLimit !== true) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试。' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  const raw = await readLimitedRequestBody(request, 4096);
  if (raw === null) return NextResponse.json({ error: '请求内容过大。' }, { status: 413 });
  const body = parseJsonObject(raw);
  if (!body) return NextResponse.json({ error: '请求格式无效。' }, { status: 400 });

  const eventType = body.event_type;
  if (typeof eventType !== 'string' || !allowedEvents.has(eventType)) {
    return NextResponse.json({ error: '事件类型无效。' }, { status: 400 });
  }

  const targetKey = typeof body.target_key === 'string' ? body.target_key.trim() : '';
  if (pageViewEvents.has(eventType)) {
    if (!targetKey || targetKey.length > 120 || !targetKey.startsWith('/') || targetKey.includes('?') || targetKey.includes('#')) {
      return NextResponse.json({ error: '统计页面无效。' }, { status: 400 });
    }
    if (eventType === 'page_view' && /^\/(admin|auth|api)(\/|$)/u.test(targetKey)) {
      return NextResponse.json({ error: '该页面不参与公开访问统计。' }, { status: 400 });
    }
  } else if (!targetKey || targetKey.length > 120) {
    return NextResponse.json({ error: '统计目标无效。' }, { status: 400 });
  }

  const now = new Date().toISOString();
  let articleId: string | null = null;
  let softwareId: string | null = null;

  if (eventType === 'software_click') {
    const requestedId = typeof body.software_id === 'string' ? body.software_id : '';
    if (!uuidPattern.test(requestedId)) return NextResponse.json({ error: '软件信息无效。' }, { status: 400 });
    const { data: software, error } = await service.from('software').select('id')
      .eq('id', requestedId).eq('status', 'published')
      .or('published_at.is.null,published_at.lte.' + now).maybeSingle();
    if (error) return NextResponse.json({ error: '统计暂不可用。' }, { status: 503 });
    if (!software) return NextResponse.json({ error: '软件不存在或暂未公开。' }, { status: 404 });
    softwareId = software.id;
  }

  if (eventType === 'software_view') {
    const requestedSlug = typeof body.software_slug === 'string' ? body.software_slug.trim() : '';
    if (!requestedSlug || requestedSlug.length > 120 || requestedSlug.includes('/')) {
      return NextResponse.json({ error: '软件信息无效。' }, { status: 400 });
    }
    const { data: software, error } = await service.from('software').select('id')
      .eq('slug', requestedSlug).eq('status', 'published')
      .or('published_at.is.null,published_at.lte.' + now).maybeSingle();
    if (error) return NextResponse.json({ error: '统计暂不可用。' }, { status: 503 });
    if (!software) return NextResponse.json({ error: '软件不存在或暂未公开。' }, { status: 404 });
    softwareId = software.id;
  }

  if (eventType === 'article_view') {
    const requestedId = typeof body.article_id === 'string' ? body.article_id : '';
    if (!uuidPattern.test(requestedId)) return NextResponse.json({ error: '文章信息无效。' }, { status: 400 });
    const { data: article, error } = await service.from('articles').select('id')
      .eq('id', requestedId).eq('status', 'published').lte('published_at', now).maybeSingle();
    if (error) return NextResponse.json({ error: '统计暂不可用。' }, { status: 503 });
    if (!article) return NextResponse.json({ error: '文章不存在或暂未公开。' }, { status: 404 });
    articleId = article.id;
  }

  const referrerInput = typeof body.referrer_url === 'string' ? body.referrer_url : '';
  const visitorInput = typeof body.visitor_id === 'string' ? body.visitor_id : '';
  if (visitorInput && !uuidPattern.test(visitorInput)) {
    return NextResponse.json({ error: '访客标识无效。' }, { status: 400 });
  }

  const source = pageViewEvents.has(eventType)
    ? resolveAnalyticsSource(referrerInput, request.url, body.utm_source)
    : null;
  const requestReferrer = request.headers.get('referer') || '';

  const { error } = await service.from('analytics_events').insert({
    event_type: eventType,
    article_id: articleId,
    software_id: softwareId,
    target_key: targetKey || null,
    referrer_host: source ? source.referrer_host : parseReferrerHost(requestReferrer),
    visitor_id: pageViewEvents.has(eventType) ? visitorInput || null : null,
    source_type: source?.source_type ?? null,
    source_name: source?.source_name ?? null,
  } as never);
  if (error) return NextResponse.json({ error: '统计暂不可用。' }, { status: 503 });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
