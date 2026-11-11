import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';
import type { Json } from '@/types/database';

export async function GET() {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('support_settings').select('*').order('placement');
  if (error) return NextResponse.json({ error: '赞赏设置读取失败，请确认数据库迁移已执行' }, { status: 500 });
  return NextResponse.json({ settings: data ?? [] });
}

export async function PUT(req: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const body = await req.json().catch(() => null);
  if (!body || !['article', 'software'].includes(body.placement) || !body.methods || typeof body.methods !== 'object' || Array.isArray(body.methods)) return NextResponse.json({ error: '参数无效' }, { status: 400 });
  const methods: Record<string, Json> = {};
  for (const key of ['alipay', 'wechat', 'usdc', 'usdt']) {
    const method = body.methods[key] || {};
    methods[key] = {
      enabled: method.enabled === true,
      qr_url: typeof method.qr_url === 'string' && /^https:\/\//i.test(method.qr_url) ? method.qr_url : '',
      address: typeof method.address === 'string' ? method.address.slice(0, 256) : '',
      network: typeof method.network === 'string' ? method.network.slice(0, 80) : '',
    };
  }
  const { error } = await auth.supabase.from('support_settings').upsert({
    placement: body.placement, enabled: body.enabled === true, methods, updated_at: new Date().toISOString(),
  }, { onConflict: 'placement' });
  if (error) return NextResponse.json({ error: '保存赞赏设置失败' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
