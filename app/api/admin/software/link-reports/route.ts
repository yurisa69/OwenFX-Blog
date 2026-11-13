import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';

const statuses = ['pending', 'reviewed', 'resolved', 'dismissed'];

export async function GET() {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const { data, error } = await auth.supabase.from('software_link_reports')
    .select('id,software_id,download_link_id,software_title,provider,share_url,reason,details,reporter_id,status,admin_note,created_at,updated_at')
    .order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: '失效反馈列表读取失败。' }, { status: 500 });
  return NextResponse.json({ reports: data || [] });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const input = await request.json().catch(() => null);
  const id = typeof input?.id === 'string' ? input.id : '';
  const status = typeof input?.status === 'string' ? input.status : '';
  const adminNote = typeof input?.adminNote === 'string' ? input.adminNote.trim() : '';
  if (!id || !statuses.includes(status)) return NextResponse.json({ error: '反馈编号或状态无效。' }, { status: 400 });
  if (adminNote.length > 500) return NextResponse.json({ error: '管理员备注最多 500 字。' }, { status: 400 });

  const { data, error } = await auth.supabase.from('software_link_reports')
    .update({ status, admin_note: adminNote || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,status,admin_note,updated_at').maybeSingle();
  if (error || !data) return NextResponse.json({ error: '更新反馈状态失败。' }, { status: 500 });

  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'software_link_report.update',
    entity_type: 'software_link_report',
    entity_id: id,
    details: { status },
  });
  return NextResponse.json({ report: data });
}
