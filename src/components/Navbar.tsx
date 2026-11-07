'use client';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE, isSupportedRegistrationEmail } from '@/lib/registration-email';

type NavUser = {
  id?: string;
  name: string;
  email?: string | null;
  avatar_url: string | null;
};

type ProfileDraft = {
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

type ProfileNotice = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

const navLinks = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/articles' },
  { label: '软件', href: '/software' },
  { label: '分类', href: '/categories' },
  { label: '关于', href: '/about' },
  { label: '联系', href: '/contact' },
];

type AchievementIcon = 'triangle' | 'diamond' | 'star';

const achievements = [
  { title: '软件达人', desc: '分享了 50+ 款优质软件', icon: 'triangle' as const, textColor: 'text-violet-300' },
  { title: 'AI 探索者', desc: '持续关注 AI 领域 100 天', icon: 'diamond' as const, textColor: 'text-blue-300' },
  { title: '连续签到30天', desc: '坚持就是胜利!', icon: 'star' as const, textColor: 'text-amber-300' },
];

const renderAchievementIcon = (icon: AchievementIcon) => {
  switch (icon) {
    case 'triangle':
      return (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4.2 20 18.4H4L12 4.2Z" />
          <path d="M12 8.7 16.2 16.1H7.8L12 8.7Z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3.8 20.2 12 12 20.2 3.8 12 12 3.8Z" />
          <path d="M12 8.1 15.9 12 12 15.9 8.1 12 12 8.1Z" />
        </svg>
      );
    default:
      return (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3.7 14.35 8.45 19.6 9.2 15.8 12.9 16.7 18.1 12 15.65 7.3 18.1 8.2 12.9 4.4 9.2 9.65 8.45 12 3.7Z" />
          <path d="M12 8.15 13.3 10.8 16.25 11.2 14.1 13.25 14.6 16.15 12 14.8 9.4 16.15 9.9 13.25 7.75 11.2 10.7 10.8 12 8.15Z" />
        </svg>
      );
  }
};

const levelThresholds = [0, 300, 800, 1500, 2500, 3800, 5400, 7200, 9000, 12000] as const;
const profileLevel = 9;
const maxProfileLevel = levelThresholds.length - 1;
const isMaxProfileLevel = profileLevel >= maxProfileLevel;
const levelToneClass = profileLevel >= maxProfileLevel
  ? 'drawer-level-tone-max'
  : `drawer-level-tone-${Math.min(Math.max(profileLevel, 1), 7)}`;
const levelStartXp = levelThresholds[profileLevel - 1];
const levelNextXp = levelThresholds[profileLevel];
const levelCurrentXp = isMaxProfileLevel
  ? levelNextXp
  : levelStartXp + Math.round((levelNextXp - levelStartXp) * 0.8);
const levelProgressPercent = isMaxProfileLevel
  ? 100
  : Math.round(((levelCurrentXp - levelStartXp) / (levelNextXp - levelStartXp)) * 100);
const levelStatusLabel = isMaxProfileLevel ? 'Max' : `${levelProgressPercent}%`;
const levelExperienceLabel = isMaxProfileLevel
  ? `满级 · ${levelNextXp} 经验值`
  : `${levelCurrentXp} » ${levelNextXp} 经验值`;

const removeCacheBust = (url: string | null) => url ? url.replace(/([?&])t=\d+$/, '') : null;
const avatarExtensions = ['png', 'jpg', 'jpeg', 'webp'] as const;

const getStoredAvatarCandidates = (userId: string | null | undefined) => {
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim().replace(/\/$/, '');
  if (!baseUrl || !userId) return [];
  return avatarExtensions.map(ext => `${baseUrl}/avatars/${userId}.${ext}`);
};

const getErrorText = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function Navbar({ initialUser = null }: { initialUser?: NavUser | null }) {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(initialUser);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
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
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    if (user) {
      setProfileDraft({
        display_name: user.name || '',
        bio: '',
        avatar_url: user.avatar_url,
      });
    }
  }, [user]);

  useLayoutEffect(() => {
    if (drawerOpen || profileOpen || loginOpen || registerOpen) {
      document.documentElement.classList.add('drawer-scroll-lock');
      document.body.classList.add('drawer-scroll-lock');
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--drawer-scrollbar-width', `${scrollbarWidth}px`);
    } else {
      document.documentElement.classList.remove('drawer-scroll-lock');
      document.body.classList.remove('drawer-scroll-lock');
      document.documentElement.style.removeProperty('--drawer-scrollbar-width');
    }
    return () => {
      document.documentElement.classList.remove('drawer-scroll-lock');
      document.body.classList.remove('drawer-scroll-lock');
      document.documentElement.style.removeProperty('--drawer-scrollbar-width');
    };
  }, [drawerOpen, profileOpen, loginOpen, registerOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    const outside = (e: PointerEvent) => { if (e.target instanceof Node && !searchWrapRef.current?.contains(e.target)) setSearchOpen(false); };
    window.addEventListener('keydown', key); document.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside); };
  }, [searchOpen]);
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const q = searchQuery.trim(); if (!q) return;
    setSearchOpen(false); setMenuOpen(false); router.push('/software?search=' + encodeURIComponent(q));
  };

  const closeAll = () => {
    setDrawerOpen(false);
    setProfileOpen(false);
    setLoginOpen(false);
    setRegisterOpen(false);
    setOtpMode(false);
    setNotice(null);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    closeAll();
    router.refresh();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登录失败');
      setUser(data.user);
      closeAll();
      router.refresh();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorText(err, '登录失败') });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!isSupportedRegistrationEmail(email)) {
      setNotice({ type: 'error', text: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE });
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发送验证码失败');
      setOtpMode(true);
      setNotice({ type: 'success', text: '验证码已发送，请查收邮箱' });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorText(err, '发送验证码失败') });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '验证失败');
      setUser(data.user);
      closeAll();
      router.refresh();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorText(err, '验证失败') });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupportedRegistrationEmail(email)) {
      setNotice({ type: 'error', text: REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE });
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');
      setNotice({ type: 'success', text: '注册成功，请登录' });
      setRegisterOpen(false);
      setLoginOpen(true);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorText(err, '注册失败') });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingAvatar(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/auth/upload-avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传失败');
      setUser(prev => prev ? { ...prev, avatar_url: data.url } : null);
      setProfileDraft(prev => ({ ...prev, avatar_url: data.url }));
      setNotice({ type: 'success', text: '头像已更新' });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorText(err, '上传失败') });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      setUser(prev => prev ? { ...prev, name: profileDraft.display_name, avatar_url: profileDraft.avatar_url } : null);
      setNotice({ type: 'success', text: '资料已保存' });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorText(err, '保存失败') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className={"glass-nav fixed top-0 left-0 right-0 z-50 flex flex-col " + (scrolled ? "shadow-sm" : "")}>
      <header className="h-14 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold tracking-tight text-[var(--accent)]">OwenFX</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="px-3 py-1.5 text-sm rounded-full transition-all duration-200 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className={"nav-actions relative flex items-center gap-2 " + (searchOpen ? "nav-actions-search-open" : "")}>
            <div ref={searchWrapRef} className="nav-search-slot flex items-center">
              {!searchOpen ? (
                <button type="button" aria-label="搜索" aria-expanded={searchOpen}
                  onClick={() => setSearchOpen(true)}
                  className="nav-icon-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                  </svg>
                </button>
              ) : (
                <form onSubmit={handleSearch} className="nav-search-capsule nav-search-capsule-inline animate-fade-in">
                  <input ref={searchInputRef} value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
                    type="search" placeholder="搜索文章 » 软件" aria-label="搜索文章或软件"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]" />
                  <button type="submit" aria-label="提交搜索" className="nav-search-submit">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.5" y1="16.5" x2="21" y2="21" />
                    </svg>
                  </button>
                </form>
              )}
            </div>
            <div className="nav-theme-slot">
              <ThemeToggle />
            </div>
            {user ? (
              <button type="button" aria-label="打开用户卡片" aria-expanded={profileOpen}
                onClick={() => setProfileOpen(true)}
                className="nav-star-btn">
                <svg className="six-star-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 20 17H4L12 3Z" />
                  <path d="M12 21 4 7h16l-8 14Z" />
                </svg>
              </button>
            ) : (
              <button type="button" aria-label="登录" onClick={() => setLoginOpen(true)}
                className="nav-star-btn">
                <svg className="six-star-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 20 17H4L12 3Z" />
                  <path d="M12 21 4 7h16l-8 14Z" />
                </svg>
              </button>
            )}
            <button className={"md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all " + (menuOpen ? "bg-[var(--bg-tertiary)]" : "")}
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="md:hidden animate-fade-in border-t border-[var(--border-color)] shadow-lg">
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 text-sm rounded-lg transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside ref={drawerRef} className="absolute left-0 top-0 bottom-0 w-[min(86vw,320px)] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-lg">导航</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <nav className="space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Profile Drawer */}
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
                  <div className="h-20 w-20 rounded-full bg-[var(--accent)] flex items-center justify-center text-2xl font-medium text-white mx-auto">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs"
                >
                  {uploadingAvatar ? '…' : '✎'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <h3 className="mt-3 text-lg font-semibold drawer-avatar-flow">{user.name}</h3>
              <p className="text-sm text-[var(--text-tertiary)]">{user.email}</p>

              <div className="mt-4">
                <div className={`text-sm font-medium drawer-level-tone ${levelToneClass}`}>Lv.{profileLevel} {levelStatusLabel}</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${levelProgressPercent}%` }} />
                </div>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{levelExperienceLabel}</p>
              </div>
            </div>

            {notice && (
              <div className={`mb-4 rounded-xl px-3 py-2 text-sm ${
                notice.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' :
                notice.type === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-blue-500/10 text-blue-300'
              }`}>{notice.text}</div>
            )}

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">显示名称</label>
                <input
                  value={profileDraft.display_name}
                  onChange={e => setProfileDraft(p => ({ ...p, display_name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '保存中…' : '保存资料'}
              </button>
            </div>

            <div className="my-4 h-px bg-white/10" />

            <div className="space-y-3">
              {achievements.map(({ title, desc, icon, textColor }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className={`achievement-geometry-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${textColor}`}>
                    {renderAchievementIcon(icon)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{title}</p>
                    <p className="truncate text-sm text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <button
                onClick={handleLogout}
                className="w-full rounded-xl border border-[var(--border-color)] py-2.5 text-sm text-[var(--text-secondary)] hover:bg-white/5"
              >
                退出登录
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Login Modal */}
      {loginOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLoginOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">登录</h2>
            {notice && (
              <div className={`mb-3 rounded-xl px-3 py-2 text-sm ${
                notice.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
              }`}>{notice.text}</div>
            )}
            {otpMode ? (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="输入验证码"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2.5 text-sm outline-none"
                />
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50">
                  {loading ? '验证中…' : '验证登录'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="邮箱"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2.5 text-sm outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2.5 text-sm outline-none"
                />
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50">
                  {loading ? '登录中…' : '登录'}
                </button>
                <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full text-sm text-[var(--accent)]">
                  使用验证码登录
                </button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-[var(--text-tertiary)]">
              还没有账号？{' '}
              <button onClick={() => { setLoginOpen(false); setRegisterOpen(true); setNotice(null); }} className="text-[var(--accent)]">
                注册
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRegisterOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">注册</h2>
            {notice && (
              <div className={`mb-3 rounded-xl px-3 py-2 text-sm ${
                notice.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
              }`}>{notice.text}</div>
            )}
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="邮箱"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2.5 text-sm outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="密码（至少6位）"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2.5 text-sm outline-none"
              />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {loading ? '注册中…' : '注册'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--text-tertiary)]">
              已有账号？{' '}
              <button onClick={() => { setRegisterOpen(false); setLoginOpen(true); setNotice(null); }} className="text-[var(--accent)]">
                登录
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
