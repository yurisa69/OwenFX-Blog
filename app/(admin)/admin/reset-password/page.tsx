'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin-client';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createAdminClient();
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) setInvalidLink(true);
      else setReady(true);
    });

    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('error') || params.get('error_description')) setInvalidLink(true);
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 12) {
      setError('新密码至少需要 12 位。');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致。');
      return;
    }

    setBusy(true);
    try {
      const supabase = createAdminClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        const message = updateError.message.toLowerCase();
        if (message.includes('weak') || message.includes('strength') || message.includes('too short')) {
          throw new Error('新密码未满足安全要求，请更换更复杂的密码。');
        }
        if (message.includes('rate limit') || message.includes('too many requests')) {
          throw new Error('操作过于频繁，请稍后重试。');
        }
        throw new Error('密码重置失败，链接可能已失效，请重新申请。');
      }

      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) throw new Error('密码已更新，但后台会话退出失败，请重新打开后台登录页。');
      router.replace('/admin/login?reason=password-updated');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '密码重置失败，请稍后重试。');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border p-7 shadow-2xl sm:p-9" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
        <p className="text-xs font-semibold tracking-[.2em]" style={{ color: 'var(--accent)' }}>OWENFX STUDIO</p>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>重置后台密码</h1>
        <p className="mb-6 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>请设置一个新的登录密码。</p>
        {invalidLink && !ready ? (
          <>
            <p role="alert" className="mb-4 text-sm text-red-500">重置链接无效或已过期，请重新申请密码重置邮件。</p>
            <Link href="/admin/forgot-password" className="owenfx-btn owenfx-btn-primary w-full">重新申请</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>新密码（至少 12 位）</span>
              <input type="password" required minLength={12} autoComplete="new-password" className="w-full rounded-xl border px-4 py-3 outline-none" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} value={newPassword} onChange={event => setNewPassword(event.target.value)} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>确认新密码</span>
              <input type="password" required minLength={12} autoComplete="new-password" className="w-full rounded-xl border px-4 py-3 outline-none" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
            </label>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button disabled={busy || !ready} className="owenfx-btn owenfx-btn-primary w-full">{busy ? '正在更新…' : '确认重置密码'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
