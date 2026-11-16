import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';

const providers = ['uc', 'quark', 'baidu', 'thunder', 'aliyun', 'tianyi', '123pan', 'other'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '请求数据无效' }, { status: 400 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ['title', 'slug', 'description', 'developer', 'version', 'file_size', 'platform', 'image_url', 'official_download_url', 'introduction_markdown', 'screenshots']) if (key in body) patch[key] = body[key];
  if (typeof body.status === 'string' && ['draft', 'published', 'archived'].includes(body.status)) {
    patch.status = body.status; patch.published_at = body.status === 'published' ? new Date().toISOString() : null;
  }
  if (typeof patch.file_size === 'string') patch.file_size = patch.file_size.slice(0, 80) || null;
  if (patch.screenshots !== undefined && (!Array.isArray(patch.screenshots) || patch.screenshots.length > 12 || patch.screenshots.some((url: unknown) => typeof url !== 'string' || !/^https:\/\//i.test(url)))) return NextResponse.json({ error: '截图地址必须是 HTTPS，最多 12 张' }, { status: 400 });
  if (typeof patch.slug === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(patch.slug)) return NextResponse.json({ error: 'slug 格式无效' }, { status: 400 });
  if (typeof patch.official_download_url === 'string' && patch.official_download_url && !/^https:\/\//i.test(patch.official_download_url)) return NextResponse.json({ error: '官方下载地址必须使用 HTTPS' }, { status: 400 });
  if (patch.image_url !== undefined && patch.image_url !== null && (typeof patch.image_url !== 'string' || (patch.image_url !== '' && (!/^https:\/\//i.test(patch.image_url) || patch.image_url.length > 2048)))) return NextResponse.json({ error: '软件图标地址必须是有效的 HTTPS 地址' }, { status: 400 });
  const { error } = await auth.supabase.from('software').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: '更新软件失败' }, { status: 400 });
  if (Array.isArray(body.links)) {
    if (body.links.length > 12 || body.links.some((link: any) => !providers.includes(link.provider) || !/^https:\/\//i.test(link.share_url || ''))) return NextResponse.json({ error: '网盘链接无效' }, { status: 400 });
    const removed = await auth.supabase.from('software_download_links').delete().eq('software_id', id);
    if (removed.error) return NextResponse.json({ error: '旧网盘链接清理失败' }, { status: 400 });
    if (body.links.length) {
      const inserted = await auth.supabase.from('software_download_links').insert(body.links.map((link: any, index: number) => ({
        software_id: id, provider: link.provider, label: String(link.label || '网盘下载').slice(0, 80),
        share_url: link.share_url, access_code: String(link.access_code || '').slice(0, 32) || null, sort_order: index, active: true,
      })));
      if (inserted.error) return NextResponse.json({ error: '网盘链接更新失败' }, { status: 400 });
    }
  }
  return NextResponse.json({ ok: true });
}


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = typeof body?.action === 'string' ? body.action : '';
  const { data: item, error } = await auth.supabase.from('software').select('id,title,status,archive_previous_status,trash_previous_status').eq('id', id).maybeSingle();
  if (error || !item) return NextResponse.json({ error: '软件不存在' }, { status: 404 });
  const now = new Date().toISOString();
  let values: Record<string, unknown> | null = null;
  let auditAction = '';
  if (action === 'archive') {
    if (!['draft', 'published'].includes(item.status)) return NextResponse.json({ error: '只有草稿或已发布软件可以归档。' }, { status: 409 });
    values = { status: 'archived', archive_previous_status: item.status, updated_at: now }; auditAction = 'software.archive';
  } else if (action === 'restore_archive') {
    if (item.status !== 'archived') return NextResponse.json({ error: '软件当前不在归档状态。' }, { status: 409 });
    values = { status: item.archive_previous_status === 'published' ? 'published' : 'draft', archive_previous_status: null, updated_at: now }; auditAction = 'software.restore_archive';
  } else if (action === 'restore_trash') {
    if (item.status !== 'trashed') return NextResponse.json({ error: '软件不在回收站中。' }, { status: 409 });
    values = { status: ['draft','published','archived'].includes(item.trash_previous_status || '') ? item.trash_previous_status : 'draft', trash_previous_status: null, deleted_at: null, updated_at: now }; auditAction = 'software.restore_trash';
  } else if (action === 'permanent_delete') {
    if (item.status !== 'trashed') return NextResponse.json({ error: '只能永久删除回收站中的软件。' }, { status: 409 });
    const { data: deleted, error: deleteError } = await auth.supabase.from('software').delete().eq('id', id).eq('status', 'trashed').select('id').maybeSingle();
    if (deleteError || !deleted) return NextResponse.json({ error: '永久删除失败，请检查关联数据后重试。' }, { status: 409 });
    await auth.supabase.from('audit_logs').insert({ actor_id: auth.user.id, action: 'software.permanent_delete', entity_type: 'software', entity_id: id, details: { title: item.title } });
    return NextResponse.json({ success: true });
  } else return NextResponse.json({ error: '不支持的软件管理操作。' }, { status: 400 });
  const { data: updated, error: updateError } = await auth.supabase.from('software').update(values).eq('id', id).eq('status', item.status).select('id').maybeSingle();
  if (updateError || !updated) return NextResponse.json({ error: '软件状态更新失败，请刷新后重试。' }, { status: 409 });
  await auth.supabase.from('audit_logs').insert({ actor_id: auth.user.id, action: auditAction, entity_type: 'software', entity_id: id });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { data: item, error } = await auth.supabase.from('software').select('id,status').eq('id', id).maybeSingle();
  if (error || !item) return NextResponse.json({ error: '软件不存在' }, { status: 404 });
  if (item.status === 'trashed') return NextResponse.json({ error: '软件已经在回收站中。' }, { status: 409 });
  const { data: updated, error: updateError } = await auth.supabase.from('software').update({ status: 'trashed', deleted_at: new Date().toISOString(), trash_previous_status: item.status, updated_at: new Date().toISOString() }).eq('id', id).eq('status', item.status).select('id').maybeSingle();
  if (updateError || !updated) return NextResponse.json({ error: '移入回收站失败，请刷新后重试。' }, { status: 409 });
  await auth.supabase.from('audit_logs').insert({ actor_id: auth.user.id, action: 'software.trash', entity_type: 'software', entity_id: id });
  return NextResponse.json({ success: true });
}
