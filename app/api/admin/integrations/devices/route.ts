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
  }).select('id,name,scopes,created_at').single();

  if (error || !data) return NextResponse.json({ error: '创建授权失败，请检查 api_devices 数据表权限' }, { status: 500 });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'api_device.create', entity_type: 'api_device', entity_id: data.id,
    details: { name, scopes: ['articles:import'] },
  });
  return NextResponse.json({ device: data, token }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const input = await request.json().catch(() => null);
  const id = typeof input?.id === 'string' ? input.id : '';
  if (!id) return NextResponse.json({ error: '缺少授权设备 ID' }, { status: 400 });
  const { error } = await auth.supabase.from('api_devices')
    .update({ active: false }).eq('id', id).eq('user_id', auth.user.id);
  if (error) return NextResponse.json({ error: '撤销授权失败' }, { status: 500 });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'api_device.revoke', entity_type: 'api_device', entity_id: id,
  });
  return NextResponse.json({ success: true });
}
