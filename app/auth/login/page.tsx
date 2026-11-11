'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PasswordInput from '@/components/PasswordInput';

export default function AuthLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason === 'password-updated') {
      setNotice('密码已更新，请使用新密码重新登录。');
    } else if (reason === 'email-updated') {
      setNotice('邮件地址已更新，请使用新邮件地址和密码重新登录。');
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw new Error('邮件地址或密码错误');
      const requested = new URLSearchParams(window.location.search).get('next') || '/';
      window.location.href = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border p-7" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-2xl font-bold">登录 OwenFX</h1>
        <p className="mb-6 mt-2 text-sm opacity-70">欢迎回来</p>
        {notice && <p role="status" className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--success)' }}>{notice}</p>}
        <form onSubmit={submit} className="space-y-4">
          <input type="email" required autoComplete="email" className="admin-input w-full" placeholder="邮件地址" value={email} onChange={event => setEmail(event.target.value)} />
          <PasswordInput required autoComplete="current-password" className="admin-input w-full" placeholder="密码" value={password} onChange={event => setPassword(event.target.value)} />
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs underline" style={{ color: 'var(--accent)' }}>忘记密码？</Link>
          </div>
          <button disabled={busy} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '登录中…' : '登录'}</button>
        </form>
        <p className="mt-5 text-center text-xs opacity-70">没有账号？<Link href="/auth/register" className="underline" style={{ color: 'var(--accent)' }}>注册</Link></p>
      </div>
    </div>
  );
}
