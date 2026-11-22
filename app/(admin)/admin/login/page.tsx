'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin-client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('reason') === 'password-updated') {
      setNotice('后台密码已更新，请使用新密码登录。');
    }
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const supabase = createAdminClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw new Error('邮件地址或密码错误');

      const requested = new URLSearchParams(window.location.search).get('next') || '/admin';
      const destination = requested.startsWith('/admin')
        && !requested.startsWith('//')
        && !requested.startsWith('/admin/login')
        ? requested
        : '/admin';
      window.location.replace(destination);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败，请稍后重试');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section
        className="w-full max-w-md rounded-3xl border p-7 shadow-2xl sm:p-9"
        style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}
      >
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[.2em]" style={{ color: 'var(--accent)' }}>OWENFX STUDIO</p>
          <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>后台管理登录</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>使用现有管理员账号登录独立管理工作区。</p>
        </div>

        {notice && <p role="status" className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--success)' }}>{notice}</p>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>邮件地址</span>
            <input
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-xl border px-4 py-3 outline-none"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="管理员邮件地址"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>密码</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border px-4 py-3 outline-none"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="请输入密码"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </label>

          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="owenfx-btn owenfx-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? '登录中…' : '登录管理后台'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 text-xs">
          <Link href="/admin/forgot-password" className="underline" style={{ color: 'var(--accent)' }}>忘记密码？</Link>
          <Link href="/" className="underline" style={{ color: 'var(--text-tertiary)' }}>返回主站</Link>
        </div>
      </section>
    </main>
  );
}
