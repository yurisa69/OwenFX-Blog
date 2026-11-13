import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authorizeContentEditor } from '@/lib/admin-api';

export async function GET() {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('api_devices')
    .select('id,name,scopes,active,expires_at,last_used_at,created_at')
    .eq('user_id', auth.user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: '读取授权设备失败' }, { status: 500 });
  return NextResponse.json({ devices: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const input = await request.json().catch(() => null);
  const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 100) : '';
  if (!name) return NextResponse.json({ error: '请填写设备名称' }, { status: 400 });

  const token = `owfx_${randomBytes(32).toString('base64url')}`;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { data, error } = await auth.supabase.from('api_devices').insert({
    user_id: auth.user.id,
    name,
    token_hash: tokenHash,
    scopes: ['articles:import'],
    active: true,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }).select('id,name,scopes,expires_at,created_at').single();

  if (error || !data) return NextResponse.json({ error: '创建授权失败，请检查 api_devices 数据表权限' }, { status: 500 });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'api_device.create', entity_type: 'api_device', entity_id: data.id,
    details: { name, scopes: ['articles:import'] },
  });
  return NextResponse.json({ device: data, token }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const input = await request.json().catch(() => null);
  const id = typeof input?.id === 'string' ? input.id : '';
  if (!id) return NextResponse.json({ error: '缺少授权设备 ID' }, { status: 400 });

  const { data: device, error: readError } = await auth.supabase.from('api_devices')
    .select('id,active,expires_at').eq('id', id).eq('user_id', auth.user.id).maybeSingle();
  if (readError) return NextResponse.json({ error: '读取授权状态失败' }, { status: 500 });
  if (!device) return NextResponse.json({ error: '授权记录不存在' }, { status: 404 });
  if (device.active) return NextResponse.json({ error: '该授权当前已启用' }, { status: 409 });
  if (device.expires_at && new Date(device.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: '该授权已过期，不能恢复；请创建新的授权密钥' }, { status: 409 });
  }

  const { data, error } = await auth.supabase.from('api_devices')
    .update({ active: true }).eq('id', id).eq('user_id', auth.user.id).eq('active', false)
    .select('id').maybeSingle();
  if (error) return NextResponse.json({ error: '恢复授权失败' }, { status: 500 });
  if (!data) return NextResponse.json({ error: '授权状态已变化，请刷新后重试' }, { status: 409 });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'api_device.restore', entity_type: 'api_device', entity_id: id,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const input = await request.json().catch(() => null);
  const id = typeof input?.id === 'string' ? input.id : '';
  const action = input?.action === 'delete' ? 'delete' : 'revoke';
  if (!id) return NextResponse.json({ error: '缺少授权设备 ID' }, { status: 400 });

  if (action === 'delete') {
    const { data, error } = await auth.supabase.from('api_devices')
      .delete().eq('id', id).eq('user_id', auth.user.id).eq('active', false)
      .select('id').maybeSingle();
    if (error) return NextResponse.json({ error: '删除授权记录失败' }, { status: 500 });
    if (!data) return NextResponse.json({ error: '只能永久删除已撤销的授权记录；记录可能不存在或仍处于启用状态' }, { status: 409 });
    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.user.id, action: 'api_device.delete', entity_type: 'api_device', entity_id: id,
    });
    return NextResponse.json({ success: true, deleted: true });
  }

  const { data, error } = await auth.supabase.from('api_devices')
    .update({ active: false }).eq('id', id).eq('user_id', auth.user.id).eq('active', true)
    .select('id').maybeSingle();
  if (error) return NextResponse.json({ error: '撤销授权失败' }, { status: 500 });
  if (!data) return NextResponse.json({ error: '授权记录不存在或已经撤销' }, { status: 404 });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'api_device.revoke', entity_type: 'api_device', entity_id: id,
  });
  return NextResponse.json({ success: true });
}
