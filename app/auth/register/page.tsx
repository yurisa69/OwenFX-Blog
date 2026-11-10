'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isSupportedRegistrationEmail, REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE } from '@/lib/registration-email';
import PasswordInput from '@/components/PasswordInput';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [step, setStep] = useState<'register' | 'sent'>('register');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function register(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    const normalized = email.trim().toLowerCase();
    if (!isSupportedRegistrationEmail(normalized)) {
      setError(REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE);
      setBusy(false);
      return;
    }
    if (password.length < 12) {
      setError('密码至少需要12位');
      setBusy(false);
      return;
    }
    if (name.trim().length > 40) {
      setError('用户名不能超过40个字符');
      setBusy(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, password, name: name.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : '注册失败，请稍后重试。');
      }

      setRegisteredEmail(normalized);
      setPassword('');
      setStep('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/login` },
      });
      if (resendError) {
        const authMessage = resendError.message.toLowerCase();
        if (authMessage.includes('rate limit') || authMessage.includes('too many requests')) {
          throw new Error('邮件发送过于频繁，请稍后再试。');
        }
        throw new Error('确认邮件发送失败，请稍后重试。');
      }
      setMessage('确认邮件已重新发送，请检查收件箱。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border p-7" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
        {step === 'register' ? (
          <>
            <h1 className="text-2xl font-bold">创建账号</h1>
            <p className="mb-6 mt-2 text-sm opacity-70">加入 OwenFX 社区</p>
            <form onSubmit={register} className="space-y-4">
              <input required maxLength={40} className="admin-input w-full" placeholder="用户名" value={name} onChange={event => setName(event.target.value)} />
              <input required type="email" autoComplete="email" className="admin-input w-full" placeholder="邮箱" value={email} onChange={event => setEmail(event.target.value)} />
              <PasswordInput required minLength={12} autoComplete="new-password" className="admin-input w-full" placeholder="密码（至少12位）" value={password} onChange={event => setPassword(event.target.value)} />
              {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
              <button disabled={busy} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '注册中…' : '注册并发送确认邮件'}</button>
            </form>
            <p className="mt-5 text-center text-xs opacity-70">已有账号？<Link href="/auth/login" className="underline" style={{ color: 'var(--accent)' }}>登录</Link></p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">确认你的邮箱</h1>
            <p className="my-4 text-sm opacity-70">我们已向 <strong>{registeredEmail}</strong> 发送 OwenFX 注册确认邮件。请打开邮件并点击“确认注册”完成邮箱验证。</p>
            <p className="mb-4 rounded-xl border p-3 text-sm opacity-80" style={{ borderColor: 'var(--border-color)' }}>完成验证后即可使用注册邮箱和密码登录。如果没有收到邮件，请检查垃圾邮件文件夹。</p>
            {message && <p className="mb-3 text-sm" style={{ color: 'var(--success)' }}>{message}</p>}
            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
            <button type="button" disabled={busy} onClick={resend} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '发送中…' : '重新发送确认邮件'}</button>
            <p className="mt-5 text-center text-xs opacity-70">已经完成验证？<Link href="/auth/login" className="underline" style={{ color: 'var(--accent)' }}>前往登录</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
