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
