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
    const { count } = await admin.from('verification_codes').select('id', { count: 'exact', head: true })
      .eq('email', email).gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 5) return NextResponse.json({ error: '验证码发送次数过多，请一小时后再试' }, { status: 429 });
    const { data: recent } = await admin.from('verification_codes').select('created_at')
      .eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 60000) {
      return NextResponse.json({ error: '请稍后再重新发送验证码' }, { status: 429 });
    }

    // A previous registration may have created an unconfirmed Auth user before the OTP was entered.
    // Reuse that pending account and issue a fresh code instead of treating it as a completed registration.
    const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return NextResponse.json({ error: '暂时无法检查邮箱注册状态，请稍后重试' }, { status: 500 });
    const existingUser = users.users.find(user => user.email?.toLowerCase() === email);
    if (existingUser?.email_confirmed_at) {
      return NextResponse.json({ error: '该邮箱已完成注册，请直接登录或使用其他邮箱。' }, { status: 400 });
    }

    let userId = existingUser?.id;
    const isPendingRegistration = Boolean(existingUser);
    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { display_name: name },
      });
      if (error || !data.user) {
        const message = error?.message.toLowerCase() || '';
        const alreadyRegistered = message.includes('already registered') || message.includes('already been registered') || message.includes('email_exists');
        return NextResponse.json({
          error: alreadyRegistered ? '该邮箱已有注册记录，请尝试登录或完成邮箱验证。' : '注册失败，请稍后重试',
        }, { status: 400 });
      }
      userId = data.user.id;
    }

    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Only the newest code remains valid after a resend.
    const { error: invalidateError } = await admin.from('verification_codes').update({ used: true })
      .eq('email', email).eq('used', false);
    if (invalidateError) {
      if (!isPendingRegistration) await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: '验证码暂时无法创建，请稍后重试' }, { status: 500 });
    }

    const { error: insertError } = await admin.from('verification_codes').insert({
      email, user_id: userId, code, used: false, expires_at: expiresAt,
    });
    if (insertError) {
      if (!isPendingRegistration) await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: '验证码暂时无法创建' }, { status: 500 });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'OwenFX 注册验证码',
        html: '<div style="font-family:sans-serif"><h2>OwenFX 注册验证</h2><p>你的验证码是：</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold">' + code + '</p><p>验证码有效期为10分钟。</p></div>',
      });
    } catch {
      await admin.from('verification_codes').update({ used: true }).eq('email', email).eq('code', code);
      if (!isPendingRegistration) await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: '验证码邮件发送失败，请检查邮箱配置后重试' }, { status: 502 });
    }

    return NextResponse.json({ success: true, email, pendingRegistration: isPendingRegistration });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
