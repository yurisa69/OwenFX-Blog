import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDisplayNameLength, MAX_DISPLAY_NAME_LENGTH } from '@/lib/display-name';
import {
  isSupportedRegistrationEmail,
  REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE,
} from '@/lib/registration-email';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
  } | null;

  if (!payload) {
    return NextResponse.json({ error: '请求数据无效' }, { status: 400 });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';

  if (!isSupportedRegistrationEmail(email)) {
    return NextResponse.json({ error: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE }, { status: 400 });
  }
  if (password.length < 12) {
    return NextResponse.json({ error: '密码至少需要12位' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: '请输入用户名' }, { status: 400 });
  }
  if (getDisplayNameLength(name) > MAX_DISPLAY_NAME_LENGTH) {
    return NextResponse.json({ error: '用户名不能超过12个字符' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: new URL('/auth/login', request.url).toString(),
    },
  });

  if (error) {
    const authMessage = error.message.toLowerCase();
    if (authMessage.includes('rate limit') || authMessage.includes('too many requests')) {
      return NextResponse.json({ error: '邮件发送过于频繁，请稍后再试。' }, { status: 429 });
    }
    if (authMessage.includes('password')) {
      return NextResponse.json({ error: '密码不符合要求，请检查后重试。' }, { status: 400 });
    }
    return NextResponse.json({ error: '注册请求失败，请检查邮件地址后重试。' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
