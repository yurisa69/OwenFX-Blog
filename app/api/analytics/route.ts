import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const allowed = ['software_click', 'wechat_click', 'ad_click', 'article_view'];
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !allowed.includes(body.event_type)) return NextResponse.json({ error: '事件类型无效' }, { status: 400 });
  const supabase = await createClient();
  const referrer = req.headers.get('referer') || '';
  let host: string | null = null;
  try { host = referrer ? new URL(referrer).hostname.slice(0, 180) : null; } catch {}
  const row = {
    event_type: body.event_type,
    resource_id: null,
    software_id: typeof body.software_id === 'string' ? body.software_id : null,
    article_id: typeof body.article_id === 'string' ? body.article_id : null,
    target_key: typeof body.target_key === 'string' ? body.target_key.slice(0, 120) : null,
    referrer_host: host,
  };
  const { error } = await supabase.from('analytics_events').insert(row);
  if (error) return NextResponse.json({ error: '统计暂不可用' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
