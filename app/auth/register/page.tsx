'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isSupportedRegistrationEmail, REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE } from '@/lib/registration-email';

export default function RegisterPage() {
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [password, setPassword] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState(''); const [code, setCode] = useState('');
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function register(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const normalized = email.trim().toLowerCase();
    if (!isSupportedRegistrationEmail(normalized)) { setError(REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE); setBusy(false); return; }
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: normalized, name, password }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || '注册失败');
      setRegisteredEmail(body.email || normalized);
      setPendingRegistration(Boolean(body.pendingRegistration));
      setStep('verify');
    } catch (err) { setError(err instanceof Error ? err.message : '注册失败'); }
    finally { setBusy(false); }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: registeredEmail, code }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || '验证失败');
      window.location.href = '/auth/login';
    } catch (err) { setError(err instanceof Error ? err.message : '验证失败'); setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: registeredEmail }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || '发送失败'); setError('验证码已重新发送');
    } catch (err) { setError(err instanceof Error ? err.message : '发送失败'); }
    finally { setBusy(false); }
  }
  return <div className="flex min-h-[70vh] items-center justify-center px-5 py-10"><div className="w-full max-w-sm rounded-2xl border p-7" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
    {step === 'register' ? <><h1 className="text-2xl font-bold">创建账号</h1><p className="mb-6 mt-2 text-sm opacity-70">加入 OwenFX 社区</p><form onSubmit={register} className="space-y-4"><input required maxLength={40} className="admin-input w-full" placeholder="用户名" value={name} onChange={e => setName(e.target.value)} /><input required type="email" autoComplete="email" className="admin-input w-full" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} /><input required minLength={6} type="password" autoComplete="new-password" className="admin-input w-full" placeholder="密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} />{error && <p className="text-sm text-red-500">{error}</p>}<button disabled={busy} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '注册中…' : '注册并发送验证码'}</button></form><p className="mt-5 text-center text-xs opacity-70">已有账号？<Link href="/auth/login" className="underline" style={{ color: 'var(--accent)' }}>登录</Link></p></> :
    <><h1 className="text-2xl font-bold">验证邮箱</h1><p className="my-4 text-sm opacity-70">验证码已发送到 {registeredEmail}</p>{pendingRegistration && <p className="mb-4 rounded-xl border p-3 text-sm opacity-80" style={{ borderColor: 'var(--border-color)' }}>检测到该邮箱已有一条尚未完成验证的注册记录，已为你重新发送验证码。验证后请使用首次注册时设置的密码登录。</p>}<form onSubmit={verify} className="space-y-4"><input required inputMode="numeric" maxLength={6} className="admin-input w-full text-center text-xl tracking-[.5em]" placeholder="6位验证码" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />{error && <p className="text-sm" style={{ color: error.includes('重新发送') ? 'var(--success)' : 'var(--danger)' }}>{error}</p>}<button disabled={busy || code.length !== 6} className="uiverse-btn uiverse-btn-primary w-full">{busy ? '验证中…' : '确认验证'}</button></form><button type="button" disabled={busy} onClick={resend} className="mt-4 w-full text-sm underline" style={{ color: 'var(--accent)' }}>重新发送验证码</button></>}
  </div></div>;
}
