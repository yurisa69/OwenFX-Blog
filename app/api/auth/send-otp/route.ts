import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupportedRegistrationEmail, REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE } from '@/lib/registration-email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
    if (!isSupportedRegistrationEmail(email)) return NextResponse.json({ error: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE }, { status: 400 });
    const admin = createAdminClient();
    const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return NextResponse.json({ error: '暂时无法发送验证码' }, { status: 500 });
    const account = users.users.find(user => user.email?.toLowerCase() === email);
    if (!account || account.email_confirmed_at) return NextResponse.json({ error: account ? '该邮箱已经完成验证，请直接登录' : '请先填写注册信息' }, { status: 400 });
    const { count } = await admin.from('verification_codes').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 5) return NextResponse.json({ error: '验证码发送次数过多，请一小时后再试' }, { status: 429 });
    const { data: recent } = await admin.from('verification_codes').select('created_at').eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 60000) return NextResponse.json({ error: '请稍后再重新发送验证码' }, { status: 429 });
    const code = String(randomInt(100000, 1000000));
    const { error } = await admin.from('verification_codes').insert({ email, user_id: account.id, code, used: false, expires_at: new Date(Date.now() + 600000).toISOString() });
    if (error) return NextResponse.json({ error: '验证码发送失败' }, { status: 500 });
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: Number(process.env.SMTP_PORT) || 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email, subject: 'OwenFX 注册验证码', html: '<div style="font-family:sans-serif"><h2>OwenFX 注册验证</h2><p>你的验证码是：</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold">' + code + '</p><p>验证码有效期为10分钟。</p></div>' });
    return NextResponse.json({ success: true, message: '验证码已发送到邮箱' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: '验证码发送失败' }, { status: 500 });
  }
}
