import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isSupportedRegistrationEmail,
  REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE,
} from '@/lib/registration-email';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';

  if (!isSupportedRegistrationEmail(email)) {
    return NextResponse.json({ error: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: '登录状态已失效，请重新登录后再试。' }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: new URL('/settings?emailChange=success', request.url).toString() }
  );

  if (error) {
    const authMessage = error.message.toLowerCase();
    if (
      authMessage.includes('already registered') ||
      authMessage.includes('already been registered') ||
      authMessage.includes('email_exists') ||
      authMessage.includes('user_already_exists') ||
      authMessage.includes('already in use')
    ) {
      return NextResponse.json(
        { error: '该邮件地址已有注册记录（可能尚未完成验证）。请先完成该邮件地址原有的注册验证，或更换其他邮件地址。' },
        { status: 409 }
      );
    }
    if (authMessage.includes('rate limit') || authMessage.includes('too many requests')) {
      return NextResponse.json({ error: '邮件地址验证请求过于频繁，请稍后再试。' }, { status: 429 });
    }
    return NextResponse.json({ error: '邮件地址修改请求失败，请检查邮件地址后稍后重试。' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
