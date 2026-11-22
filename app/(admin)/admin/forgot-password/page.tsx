'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin-client';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSent(false);
    try {
      const supabase = createAdminClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: window.location.origin + '/admin/reset-password' },
      );
      if (resetError) {
        const message = resetError.message.toLowerCase();
        if (message.includes('rate limit') || message.includes('too many requests')) {
          throw new Error('重置邮件发送过于频繁，请稍后再试。');
        }
        throw new Error('重置邮件发送失败，请稍后重试。');
      }
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '请求失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border p-7 shadow-2xl sm:p-9" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
        <p className="text-xs font-semibold tracking-[.2em]" style={{ color: 'var(--accent)' }}>OWENFX STUDIO</p>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>找回后台密码</h1>
        <p className="mb-6 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>输入管理员账号邮件地址，我们会发送密码重置邮件。</p>
        {sent ? (
          <>
            <p role="status" className="rounded-xl border p-4 text-sm leading-7" style={{ borderColor: 'var(--border-color)' }}>
              如果该邮件地址已注册，密码重置邮件将发送至该邮件地址。请检查收件箱和垃圾邮件文件夹，并按邮件中的提示重置密码。
            </p>
            <Link href="/admin/login" className="owenfx-btn owenfx-btn-primary mt-5 w-full">返回后台登录</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>管理员邮件地址</span>
              <input type="email" required autoComplete="email" className="w-full rounded-xl border px-4 py-3 outline-none" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} placeholder="管理员邮件地址" value={email} onChange={event => setEmail(event.target.value)} />
            </label>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button disabled={busy} className="owenfx-btn owenfx-btn-primary w-full">{busy ? '发送中…' : '发送重置邮件'}</button>
          </form>
        )}
        <p className="mt-6 text-center text-xs">
          <Link href="/admin/login" className="underline" style={{ color: 'var(--accent)' }}>返回后台登录</Link>
        </p>
      </section>
    </main>
  );
}
