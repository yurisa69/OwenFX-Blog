import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function authorizeAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: '请先登录' }, { status: 401 }) };
  const { data, error } = await supabase.rpc('is_owenfx_admin');
  if (error || data !== true) return { response: NextResponse.json({ error: '需要站长或管理员权限' }, { status: 403 }) };
  return { supabase, user };
}

export async function authorizeContentEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: '请先登录' }, { status: 401 }) };
  const { data, error } = await supabase.rpc('is_owenfx_content_editor');
  if (error || data !== true) return { response: NextResponse.json({ error: '没有内容管理权限' }, { status: 403 }) };
  return { supabase, user };
}
