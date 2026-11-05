import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';

const slugOk = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const providers = ['baidu', 'quark', 'aliyun', 'tianyi', '123pan', 'other'];

export async function GET() {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('cloud_resources')
    .select('id,title,slug,summary,description_markdown,status,version_label,updated_at,cloud_resource_links(id,provider,share_url,access_code,label,active)')
    .order('updated_at', { ascending: false }).limit(300);
  if (error) return NextResponse.json({ error: '资源列表读取失败' }, { status: 500 });
  return NextResponse.json({ resources: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const links = Array.isArray(body?.links) ? body.links : [];
  if (!title || title.length > 180 || !slugOk(slug) || links.length < 1 || links.length > 10) return NextResponse.json({ error: '请填写标题、英文 slug，并至少添加一个网盘链接（最多 10 个）' }, { status: 400 });
  if (links.some((link: any) => !providers.includes(link.provider) || typeof link.share_url !== 'string' || !/^https:\/\//i.test(link.share_url) || link.share_url.length > 2048)) return NextResponse.json({ error: '网盘类型或 HTTPS 分享链接无效' }, { status: 400 });
  const { data, error } = await auth.supabase.from('cloud_resources').insert({
    title, slug, summary: typeof body.summary === 'string' ? body.summary.slice(0, 500) : '',
    description_markdown: typeof body.description_markdown === 'string' ? body.description_markdown.slice(0, 30000) : '',
    version_label: typeof body.version_label === 'string' ? body.version_label.slice(0, 80) : null,
    status: 'draft', published_at: null, created_by: auth.user.id,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? '资源 slug 已存在' : '创建资源失败' }, { status: 400 });
  const { error: linksError } = await auth.supabase.from('cloud_resource_links').insert(links.map((link: any, index: number) => ({
    resource_id: data.id, provider: link.provider, share_url: link.share_url.trim(),
    access_code: typeof link.access_code === 'string' ? link.access_code.slice(0, 32) : null,
    label: typeof link.label === 'string' ? link.label.slice(0, 60) : '网盘链接', is_primary: index === 0, sort_order: index,
  })));
  if (linksError) { await auth.supabase.from('cloud_resources').delete().eq('id', data.id); return NextResponse.json({ error: '保存网盘链接失败，请检查迁移是否已执行' }, { status: 400 }); }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
