import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupportedRegistrationEmail, REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE } from '@/lib/registration-email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!email || !password || !name) return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    if (name.length > 40) return NextResponse.json({ error: '用户名不能超过40个字符' }, { status: 400 });
    if (!isSupportedRegistrationEmail(email)) return NextResponse.json({ error: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: '密码至少6位' }, { status: 400 });

    const admin = createAdminClient();
    const { count } = await admin.from('verification_codes').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 5) return NextResponse.json({ error: '验证码发送次数过多，请一小时后再试' }, { status: 429 });
    const { data: recent } = await admin.from('verification_codes').select('created_at').eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 60000) return NextResponse.json({ error: '请稍后再重新发送验证码' }, { status: 429 });

    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { display_name: name } });
    if (error || !data.user) return NextResponse.json({ error: error?.message.includes('already registered') ? '该邮箱已注册' : '注册失败，请稍后重试' }, { status: 400 });

    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await admin.from('verification_codes').insert({ email, user_id: data.user.id, code, used: false, expires_at: expiresAt });
    if (insertError) { await admin.auth.admin.deleteUser(data.user.id); return NextResponse.json({ error: '验证码暂时无法创建' }, { status: 500 }); }

    try {
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: Number(process.env.SMTP_PORT) || 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email, subject: 'OwenFX 注册验证码', html: '<div style="font-family:sans-serif"><h2>OwenFX 注册验证</h2><p>你的验证码是：</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold">' + code + '</p><p>验证码有效期为10分钟。</p></div>' });
    } catch {
      await admin.from('verification_codes').delete().eq('user_id', data.user.id);
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: '验证码邮件发送失败，请检查邮箱配置后重试' }, { status: 502 });
    }
    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
