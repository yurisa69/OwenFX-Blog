import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';

const providers = ['uc', 'quark', 'baidu', 'thunder', 'aliyun', 'tianyi', '123pan', 'other'];
const slugOk = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export async function GET() {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('software')
    .select('id,title,slug,description,developer,version,file_size,platform,image_url,official_download_url,introduction_markdown,screenshots,featured_order,status,featured,software_download_links(id,provider,label,share_url,access_code)')
    .order('updated_at', { ascending: false }).limit(300);
  if (error) return NextResponse.json({ error: '软件列表读取失败，请确认数据库迁移已执行' }, { status: 500 });
  return NextResponse.json({ software: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '请求数据无效' }, { status: 400 });
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!title || title.length > 180 || !slugOk(slug)) return NextResponse.json({ error: '请填写软件名称和有效的英文 slug' }, { status: 400 });
  const links = Array.isArray(body.links) ? body.links : [];
  if (links.length > 12 || links.some((link: any) => !providers.includes(link.provider) || !/^https:\/\//i.test(link.share_url || ''))) return NextResponse.json({ error: '网盘链接无效，最多 12 个且必须使用 HTTPS' }, { status: 400 });
  const official = typeof body.official_download_url === 'string' ? body.official_download_url.trim() : '';
  if (official && !/^https:\/\//i.test(official)) return NextResponse.json({ error: '官方下载地址必须使用 HTTPS' }, { status: 400 });
  const iconUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  if (iconUrl && (!/^https:\/\//i.test(iconUrl) || iconUrl.length > 2048)) return NextResponse.json({ error: '软件图标地址必须是有效的 HTTPS 地址' }, { status: 400 });
  const { data, error } = await auth.supabase.from('software').insert({
    title, slug, description: String(body.description || '').slice(0, 500),
    introduction_markdown: String(body.introduction_markdown || '').slice(0, 30000),
    screenshots: Array.isArray(body.screenshots) && body.screenshots.length <= 12 && body.screenshots.every((url: unknown) => typeof url === 'string' && /^https:\/\//i.test(url)) ? body.screenshots : [],
    featured_order: Number.isFinite(Number(body.featured_order)) ? Math.max(0, Number(body.featured_order)) : 0,
    developer: String(body.developer || '').slice(0, 160) || null,
    version: String(body.version || '').slice(0, 80) || null,
    file_size: String(body.file_size || '').slice(0, 80) || null,
    platform: String(body.platform || '').slice(0, 160) || null,
    image_url: iconUrl || null,
    official_download_url: official || null, download_url: official || null,
    status: 'draft', featured: body.featured === true,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? '软件 slug 已存在' : '创建软件失败，请检查数据库结构' }, { status: 400 });
  if (links.length) {
    const { error: linkError } = await auth.supabase.from('software_download_links').insert(links.map((link: any, index: number) => ({
      software_id: data.id, provider: link.provider, label: String(link.label || '网盘下载').slice(0, 80),
      share_url: link.share_url, access_code: String(link.access_code || '').slice(0, 32) || null, sort_order: index, active: true,
    })));
    if (linkError) { await auth.supabase.from('software').delete().eq('id', data.id); return NextResponse.json({ error: '网盘链接保存失败' }, { status: 400 }); }
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
