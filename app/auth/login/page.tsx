'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AuthLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError) throw new Error('邮箱或密码错误');
      const requested = new URLSearchParams(window.location.search).get('next') || '/';
      window.location.href = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';
    } catch (err) { setError(err instanceof Error ? err.message : '登录失败'); setBusy(false); }
  }
  return <div className="flex min-h-[70vh] items-center justify-center px-5 py-10"><div className="w-full max-w-sm rounded-2xl border p-7" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
    <h1 className="text-2xl font-bold">登录 OwenFX</h1><p className="mb-6 mt-2 text-sm opacity-70">欢迎回来</p>
    <form onSubmit={submit} className="space-y-4"><input type="email" required autoComplete="email" className="admin-input w-full" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" required autoComplete="current-password" className="admin-input w-full" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />{error && <p className="text-sm text-red-500">{error}</p>}<button disabled={busy} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '登录中…' : '登录'}</button></form>
    <p className="mt-5 text-center text-xs opacity-70">没有账号？<Link href="/auth/register" className="underline" style={{ color: 'var(--accent)' }}>注册</Link></p>
  </div></div>;
}
