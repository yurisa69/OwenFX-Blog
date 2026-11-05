'use client';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE, isSupportedRegistrationEmail } from '@/lib/registration-email';

type NavUser = { id?: string; name: string; email?: string | null; avatar_url: string | null };
type ProfileDraft = { display_name: string; bio: string; avatar_url: string | null };
type ProfileNotice = { type: 'success' | 'error' | 'info'; text: string } | null;

const navLinks = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/articles' },
  { label: '软件', href: '/software' },
  { label: '分类', href: '/categories' },
  { label: '关于', href: '/about' },
  { label: '联系', href: '/contact' },
];

const getErrorText = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function Navbar({ initialUser = null }: { initialUser?: NavUser | null }) {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(initialUser);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<ProfileNotice>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({ display_name: '', bio: '', avatar_url: null });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUser(initialUser); }, [initialUser]);
  useEffect(() => {
    if (user) setProfileDraft({ display_name: user.name || '', bio: '', avatar_url: user.avatar_url });
  }, [user]);

  useLayoutEffect(() => {
    const locked = drawerOpen || profileOpen || loginOpen || registerOpen;
    document.documentElement.classList.toggle('drawer-scroll-lock', locked);
    document.body.classList.toggle('drawer-scroll-lock', locked);
    if (locked) {
      const w = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--drawer-scrollbar-width', `${w}px`);
    } else {
      document.documentElement.style.removeProperty('--drawer-scrollbar-width');
    }
    return () => {
      document.documentElement.classList.remove('drawer-scroll-lock');
      document.body.classList.remove('drawer-scroll-lock');
      document.documentElement.style.removeProperty('--drawer-scrollbar-width');
    };
  }, [drawerOpen, profileOpen, loginOpen, registerOpen]);

  const closeAll = () => {
    setDrawerOpen(false); setProfileOpen(false); setLoginOpen(false); setRegisterOpen(false); setOtpMode(false); setNotice(null);
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    setUser(null); closeAll(); router.refresh();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setNotice(null);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登录失败');
      setUser(data.user); closeAll(); router.refresh();
    } catch (err) { setNotice({ type: 'error', text: getErrorText(err, '登录失败') }); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!isSupportedRegistrationEmail(email)) { setNotice({ type: 'error', text: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE }); return; }
    setLoading(true); setNotice(null);
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发送验证码失败');
      setOtpMode(true); setNotice({ type: 'success', text: '验证码已发送，请查收邮箱' });
    } catch (err) { setNotice({ type: 'error', text: getErrorText(err, '发送验证码失败') }); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setNotice(null);
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, token: otpCode }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '验证失败');
      setUser(data.user); closeAll(); router.refresh();
    } catch (err) { setNotice({ type: 'error', text: getErrorText(err, '验证失败') }); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupportedRegistrationEmail(email)) { setNotice({ type: 'error', text: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE }); return; }
    setLoading(true); setNotice(null);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');
      setNotice({ type: 'success', text: '注册成功，请登录' }); setRegisterOpen(false); setLoginOpen(true);
    } catch (err) { setNotice({ type: 'error', text: getErrorText(err, '注册失败') }); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingAvatar(true); setNotice(null);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch('/api/auth/upload-avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传失败');
      setUser(prev => prev ? { ...prev, avatar_url: data.url } : null);
      setProfileDraft(prev => ({ ...prev, avatar_url: data.url }));
      setNotice({ type: 'success', text: '头像已更新' });
    } catch (err) { setNotice({ type: 'error', text: getErrorText(err, '上传失败') }); }
    finally { setUploadingAvatar(false); }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setLoading(true); setNotice(null);
    try {
      const res = await fetch('/api/auth/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileDraft) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      setUser(prev => prev ? { ...prev, name: profileDraft.display_name, avatar_url: profileDraft.avatar_url } : null);
      setNotice({ type: 'success', text: '资料已保存' });
    } catch (err) { setNotice({ type: 'error', text: getErrorText(err, '保存失败') }); }
    finally { setLoading(false); }
  };

  return (
    <>
      <header className="glass-nav fixed top-0 left-0 right-0 z-50 h-14 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/5" onClick={() => setDrawerOpen(true)} aria-label="打开菜单">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <Link href="/" className="font-semibold text-lg tracking-tight"><span className="gradient-text">OwenFX</span></Link>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">{link.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-white/5 transition">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-medium text-white">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                )}
                <span className="hidden sm:inline text-sm text-[var(--text-secondary)]">{user.name}</span>
              </button>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90 transition">登录</button>
            )}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(86vw,320px)] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-lg">导航</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <nav className="space-y-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]">{link.label}</Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {profileOpen && user && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setProfileOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-[min(90vw,380px)] bg-[var(--bg-secondary)] border-l border-[var(--border-color)] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-lg">个人中心</span>
              <button onClick={() => setProfileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="text-center mb-6">
              <div className="relative inline-block">
                {profileDraft.avatar_url || user.avatar_url ? (
                  <img src={profileDraft.avatar_url || user.avatar_url || ''} alt="" className="h-20 w-20 rounded-full object-cover mx-auto border-2 border-[var(--border-color)]" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-[var(--accent)] flex items-center justify-center text-2xl font-medium text-white mx-auto">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs">{uploadingAvatar ? '…' : '✎'}</button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-[var(--text-tertiary)]">{user.email}</p>
            </div>
            {notice && <div className={`mb-4 rounded-xl px-3 py-2 text-sm ${notice.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : notice.type === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-blue-500/10 text-blue-300'}`}>{notice.text}</div>}
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">显示名称</label>
                <input value={profileDraft.display_name} onChange={e => setProfileDraft(p => ({ ...p, display_name: e.target.value }))} className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
              </div>
              <button onClick={handleSaveProfile} disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{loading ? '保存中…' : '保存资料'}</button>
            </div>
            <button onClick={handleLogout} className="w-full rounded-xl border border-[var(--border-color)] py-2.5 text-sm text-[var(--text-secondary)] hover:bg-white/5">退出登录</button>
          </aside>
        </div>
      )}

      {loginOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLoginOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">登录</h2>
            {notice && <div className={`mb-3 rounded-xl px-3 py-2 text-sm ${notice.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{notice.text}</div>}
            {otpMode ? (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="输入验证码" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm outline-none" />
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? '验证中…' : '验证登录'}</button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm outline-none" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm outline-none" />
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? '登录中…' : '登录'}</button>
                <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full text-sm text-[var(--accent)]">使用验证码登录</button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-[var(--text-tertiary)]">还没有账号？ <button onClick={() => { setLoginOpen(false); setRegisterOpen(true); setNotice(null); }} className="text-[var(--accent)]">注册</button></p>
          </div>
        </div>
      )}

      {registerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRegisterOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">注册</h2>
            {notice && <div className={`mb-3 rounded-xl px-3 py-2 text-sm ${notice.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{notice.text}</div>}
            <form onSubmit={handleRegister} className="space-y-3">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm outline-none" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码（至少6位）" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm outline-none" />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? '注册中…' : '注册'}</button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--text-tertiary)]">已有账号？ <button onClick={() => { setRegisterOpen(false); setLoginOpen(true); setNotice(null); }} className="text-[var(--accent)]">登录</button></p>
          </div>
        </div>
      )}
    </>
  );
}
