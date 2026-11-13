'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PasswordInput from '@/components/PasswordInput';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        setInvalidLink(true);
        return;
      }
      setReady(true);
    });

    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('error') || params.get('error_description')) {
      setInvalidLink(true);
    }

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
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      const message = updateError.message.toLowerCase();
      if (message.includes('weak') || message.includes('strength') || message.includes('too short')) {
        setError('新密码未满足安全要求，请更换更复杂的密码。');
      } else if (message.includes('rate limit') || message.includes('too many requests')) {
        setError('操作过于频繁，请稍后重试。');
      } else {
        setError('密码重置失败，链接可能已失效，请重新申请。');
      }
      setBusy(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) {
      setError('密码已更新，但自动退出登录失败。请手动退出后使用新密码登录。');
      setBusy(false);
      return;
    }
    router.replace('/auth/login?reason=password-updated');
    router.refresh();
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border p-7" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-2xl font-bold">重置密码</h1>
        <p className="mb-6 mt-2 text-sm opacity-70">请设置一个新的登录密码。</p>
        {invalidLink && !ready ? (
          <>
            <p role="alert" className="mb-4 text-sm text-red-500">重置链接无效或已过期，请重新申请密码重置邮件。</p>
            <Link href="/auth/forgot-password" className="uiverse-btn uiverse-btn-primary w-full">重新申请</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <PasswordInput required minLength={12} autoComplete="new-password" className="admin-input w-full" placeholder="新密码（至少12位）" value={newPassword} onChange={event => setNewPassword(event.target.value)} />
            <PasswordInput required minLength={12} autoComplete="new-password" className="admin-input w-full" placeholder="确认新密码" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button disabled={busy || !ready} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '正在更新…' : '确认重置密码'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
