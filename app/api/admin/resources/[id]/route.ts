import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ['title', 'summary', 'description_markdown', 'version_label']) if (typeof body?.[key] === 'string') patch[key] = body[key].slice(0, key === 'description_markdown' ? 30000 : key === 'title' ? 180 : 500);
  if (['draft', 'published', 'archived'].includes(body?.status)) { patch.status = body.status; patch.published_at = body.status === 'published' ? new Date().toISOString() : null; }
  const { error } = await auth.supabase.from('cloud_resources').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: '资源更新失败' }, { status: 400 });
  if (Array.isArray(body?.links)) {
    if (body.links.length < 1 || body.links.length > 10 || body.links.some((link: any) => typeof link.share_url !== 'string' || !/^https:\/\//i.test(link.share_url))) return NextResponse.json({ error: '网盘分享链接必须是 HTTPS，且至少一条' }, { status: 400 });
    const removed = await auth.supabase.from('cloud_resource_links').delete().eq('resource_id', id);
    if (removed.error) return NextResponse.json({ error: '旧链接清理失败' }, { status: 400 });
    const { error: linkError } = await auth.supabase.from('cloud_resource_links').insert(body.links.map((link: any, index: number) => ({
      resource_id: id, provider: String(link.provider || 'other'), share_url: link.share_url,
      access_code: typeof link.access_code === 'string' ? link.access_code.slice(0, 32) : null,
      label: String(link.label || '网盘链接').slice(0, 60), is_primary: index === 0, sort_order: index,
    })));
    if (linkError) return NextResponse.json({ error: '网盘链接更新失败' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { error } = await auth.supabase.from('cloud_resources').delete().eq('id', id);
  if (error) return NextResponse.json({ error: '删除失败' }, { status: 400 });
  return NextResponse.json({ success: true });
}
