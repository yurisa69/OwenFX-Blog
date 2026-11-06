'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { getSupabaseBrowser } from '@/lib/supabase';

type NavUser = { id?: string; name: string; email?: string | null; avatar_url: string | null };
type Profile = { display_name: string; bio: string; avatar_url: string | null };

const navLinks = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/articles' },
  { label: '软件', href: '/software' },
  { label: '分类', href: '/categories' },
  { label: '关于', href: '/about' },
  { label: '联系', href: '/contact' },
];

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/></svg>;
}
function StarIcon() {
  return <svg className="six-star-spin" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 20 17H4L12 3Z"/><path d="M12 21 4 7h16l-8 14Z"/></svg>;
}
function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg>;
}

export default function Navbar({ initialUser = null }: { initialUser?: NavUser | null }) {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobileSearch, setIsMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<Profile>({ display_name: initialUser?.name || '', bio: '', avatar_url: initialUser?.avatar_url || null });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setUser(initialUser), [initialUser]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileSearch(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.focus();
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.nav-search-slot')) setSearchOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [searchOpen]);
  useEffect(() => {
    if (!drawerOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', close);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = oldOverflow; };
  }, [drawerOpen]);
  useEffect(() => {
    if (!drawerOpen || !user?.id) return;
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data } = await supabase.from('profiles').select('display_name,bio,avatar_url').eq('id', user.id).maybeSingle();
      if (!active) return;
      setProfile({
        display_name: data?.display_name || user.name,
        bio: data?.bio || '',
        avatar_url: data?.avatar_url || user.avatar_url,
      });
    };
    void load();
    return () => { active = false; };
  }, [drawerOpen, user]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    setMenuOpen(false);
    router.push('/software?search=' + encodeURIComponent(query));
  };

  const handleProfileSave = async () => {
    if (!user?.id) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setNotice('Supabase 尚未配置'); return; }
    setSaving(true); setNotice('');
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: profile.display_name.trim() || user.name,
      bio: profile.bio.trim() || null,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    setSaving(false);
    if (error) { setNotice(error.message || '资料保存失败'); return; }
    const nextName = profile.display_name.trim() || user.name;
    setUser({ ...user, name: nextName, avatar_url: profile.avatar_url });
    setEditing(false); setNotice('资料已保存'); router.refresh();
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setNotice('');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/profile/avatar-upload', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || '头像上传失败');
      setProfile(current => ({ ...current, avatar_url: result.url }));
      setNotice('头像上传成功，保存资料后生效');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '头像上传失败');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    setUser(null); setDrawerOpen(false); router.push('/'); router.refresh();
  };

  const avatar = editing ? profile.avatar_url : (user?.avatar_url || profile.avatar_url);
  const displayName = editing ? profile.display_name : (user?.name || '用户');

  return (
    <>
      <div className="glass-nav fixed inset-x-0 top-0 z-50">
        <header className="h-14 flex items-center">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold tracking-tight text-[var(--accent)]">OwenFX</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => <Link key={link.href} href={link.href} className="nav-link-pill">{link.label}</Link>)}
            </nav>
            <div className={`nav-actions relative flex items-center gap-2 ${searchOpen ? "nav-actions-search-open" : ""}`}>
              <div className="nav-search-slot flex items-center">
                {searchOpen ? (
                  <form onSubmit={handleSearch} className="nav-search-capsule nav-search-capsule-inline animate-fade-in">
                    <input ref={searchRef} value={searchQuery} onChange={event => setSearchQuery(event.target.value)} type="search" placeholder={isMobileSearch ? "搜索文章 »" : "搜索文章 » 软件"} aria-label="搜索文章或软件" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"/>
                    <button type="submit" aria-label="提交搜索" className="nav-search-submit"><SearchIcon/></button>
                  </form>
                ) : <button type="button" aria-label="搜索" className="nav-icon-btn" onClick={() => setSearchOpen(true)}><SearchIcon/></button>}
              </div>
              <div className="nav-theme-slot"><ThemeToggle/></div>
              {user ? (
                <button type="button" aria-label="打开个人详情" aria-expanded={drawerOpen} className="nav-icon-btn nav-profile-trigger" onClick={() => { setMenuOpen(false); setDrawerOpen(true); setEditing(false); setNotice(''); }}>
                  <StarIcon/>
                </button>
              ) : <Link href="/login" aria-label="登录" className="nav-icon-btn"><StarIcon/></Link>}
              <button type="button" aria-label={menuOpen ? '关闭菜单' : '打开菜单'} aria-expanded={menuOpen} className="nav-icon-btn mobile-menu-toggle md:hidden" onClick={() => setMenuOpen(value => !value)}>
                {menuOpen ? <CloseIcon/> : <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>}
              </button>
            </div>
          </div>
        </header>
        {menuOpen && (
          <div className="md:hidden animate-fade-in border-t border-[var(--border-color)] shadow-lg">
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 text-sm rounded-lg transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {user && drawerOpen && (
        <div className="profile-drawer-layer">
          <button type="button" aria-label="关闭个人详情" className="profile-drawer-backdrop" onClick={() => setDrawerOpen(false)}/>
          <aside className="profile-drawer-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[.18em] uppercase text-[var(--text-tertiary)]">OWENFX ACCOUNT</span>
              <button type="button" className="profile-round-action" aria-label="关闭" onClick={() => setDrawerOpen(false)}><CloseIcon/></button>
            </div>
            <div className="profile-overview">
              <div className="profile-avatar-ring">
                <div className="profile-avatar-inner">
                  {avatar ? <img src={avatar} alt="头像" className="h-full w-full object-cover"/> : <span>{(displayName || user.name || 'U').slice(0,1).toUpperCase()}</span>}
                </div>
              </div>
              {editing ? (
                <div className="mt-4 w-full text-center">
                  <h2 className="text-2xl font-bold drawer-avatar-flow">编辑个人资料</h2>
                  <button type="button" className="profile-secondary-action mt-3" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? '上传中…' : '更换头像'}</button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" onChange={handleAvatarUpload}/>
                  <label className="profile-field-label">昵称</label>
                  <input className="profile-input" maxLength={40} value={profile.display_name} onChange={event => setProfile(value => ({...value, display_name:event.target.value}))} placeholder="输入昵称"/>
                  <label className="profile-field-label">个人简介</label>
                  <textarea className="profile-input min-h-24 resize-none" maxLength={240} value={profile.bio} onChange={event => setProfile(value => ({...value, bio:event.target.value}))} placeholder="介绍一下自己…"/>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" className="profile-secondary-action" onClick={() => {setEditing(false);setNotice('');}}>取消</button>
                    <button type="button" className="profile-primary-action" disabled={saving || uploading} onClick={handleProfileSave}>{saving ? '保存中…' : '保存资料'}</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mt-4 max-w-full truncate text-3xl font-bold drawer-avatar-flow">{user.name || '用户'}</h2>
                  <p className="mt-2 max-w-full break-all text-sm text-[var(--text-secondary)]">{user.email || 'OwenFX 用户'}</p>
                  <p className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm leading-7 text-[var(--text-secondary)]">{profile.bio || '还没有填写个人简介。点击下方按钮完善你的个人资料。'}</p>
                  <div className="profile-account-meta">
                    <span><i className="profile-status-dot"/>账号已登录</span>
                    <span>OwenFX Member</span>
                  </div>
                  <div className="mt-5 grid w-full grid-cols-2 gap-3">
                    <button type="button" className="profile-primary-action" onClick={() => {setEditing(true);setNotice('');}}>编辑资料</button>
                    <Link href="/settings" className="profile-secondary-action" onClick={() => setDrawerOpen(false)}>账号设置</Link>
                  </div>
                </>
              )}
              {notice && <p role="status" className="mt-4 w-full rounded-xl border border-indigo-300/20 bg-indigo-400/10 px-3 py-2 text-center text-xs text-indigo-200">{notice}</p>}
            </div>
            <div className="profile-drawer-footer">
              <div className="text-xs text-[var(--text-tertiary)]">个人资料由你的 OwenFX 账号管理</div>
              <button type="button" className="profile-logout-action" onClick={handleLogout}>退出登录</button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
