import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!email || !/^\d{6}$/.test(code)) return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    const admin = createAdminClient();
    const { data, error } = await admin.from('verification_codes').select('id,user_id')
      .eq('email', email).eq('code', code).eq('used', false).gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    const { error: usedError } = await admin.from('verification_codes').update({ used: true }).eq('id', data.id);
    if (usedError) return NextResponse.json({ error: '验证失败，请重试' }, { status: 500 });
    if (data.user_id) {
      const { error: confirmError } = await admin.auth.admin.updateUserById(data.user_id, { email_confirm: true });
      if (confirmError) return NextResponse.json({ error: '邮箱验证成功，但账号激活失败，请联系管理员' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}
