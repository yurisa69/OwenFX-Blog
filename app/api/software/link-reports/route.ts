import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const allowedReasons = ['expired', 'not_found', 'password_invalid', 'access_denied', 'other'];

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ error: '请求来源无效。' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: '请求来源无效。' }, { status: 403 });
    }
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: '请先登录后提交反馈。' }, { status: 401 });

  const input = await request.json().catch(() => null);
  const softwareId = typeof input?.softwareId === 'string' ? input.softwareId : '';
  const downloadLinkId = typeof input?.downloadLinkId === 'string' ? input.downloadLinkId : '';
  const reason = typeof input?.reason === 'string' ? input.reason : '';
  const details = typeof input?.details === 'string' ? input.details.trim() : '';

  if (!uuidPattern.test(softwareId) || !uuidPattern.test(downloadLinkId)) {
    return NextResponse.json({ error: '软件或下载链接信息无效。' }, { status: 400 });
  }
  if (!allowedReasons.includes(reason)) return NextResponse.json({ error: '反馈类型无效。' }, { status: 400 });
  if (details.length > 800) return NextResponse.json({ error: '补充说明最多 800 字。' }, { status: 400 });

  const service = createServiceClient();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: rateError } = await service.from('software_link_reports')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_id', user.id)
    .gte('created_at', cutoff);
  if (rateError) return NextResponse.json({ error: '反馈服务暂时不可用。' }, { status: 503 });
  if ((count || 0) >= 5) return NextResponse.json({ error: '每个账号每小时最多提交 5 条反馈。' }, { status: 429 });

  const now = new Date().toISOString();
  const { data: software, error: softwareError } = await service.from('software')
    .select('id,title,status,published_at').eq('id', softwareId).maybeSingle();
  if (softwareError || !software || software.status !== 'published' ||
      (software.published_at && software.published_at > now)) {
    return NextResponse.json({ error: '软件不存在或暂未公开。' }, { status: 404 });
  }

  const { data: link, error: linkError } = await service.from('software_download_links')
    .select('id,provider,share_url').eq('id', downloadLinkId)
    .eq('software_id', softwareId).eq('active', true).maybeSingle();
  if (linkError || !link) return NextResponse.json({ error: '该下载链接不存在或已停用。' }, { status: 404 });

  const { error: insertError } = await service.from('software_link_reports').insert({
    software_id: software.id,
    download_link_id: link.id,
    software_title: software.title,
    provider: link.provider,
    share_url: link.share_url,
    reason,
    details: details || null,
    reporter_id: user.id,
  });
  if (insertError) return NextResponse.json({ error: '反馈提交失败，请稍后重试。' }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 201 });
}
