'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
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
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );
      if (resetError) {
        const message = resetError.message.toLowerCase();
        if (message.includes('rate limit') || message.includes('too many requests')) {
          throw new Error('重置邮件发送过于频繁，请稍后再试。');
        }
        throw new Error('重置邮件发送失败，请稍后重试。');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border p-7" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-2xl font-bold">找回密码</h1>
        <p className="mb-6 mt-2 text-sm opacity-70">输入注册邮件地址，我们会发送密码重置邮件。</p>
        {sent ? (
          <>
            <p role="status" className="rounded-xl border p-4 text-sm leading-7" style={{ borderColor: 'var(--border-color)' }}>
              如果该邮件地址已注册，密码重置邮件将发送至该邮件地址。请检查收件箱和垃圾邮件文件夹，并按邮件中的提示重置密码。
            </p>
            <Link href="/auth/login" className="uiverse-btn uiverse-btn-primary mt-5 w-full">返回登录</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input type="email" required autoComplete="email" className="admin-input w-full" placeholder="注册邮件地址" value={email} onChange={event => setEmail(event.target.value)} />
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button disabled={busy} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '发送中…' : '发送重置邮件'}</button>
            <p className="text-center text-xs opacity-70"><Link href="/auth/login" className="underline" style={{ color: 'var(--accent)' }}>返回登录</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
