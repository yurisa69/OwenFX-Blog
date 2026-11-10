 'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ArticleActionIcon from '@/components/ArticleActionIcon';
import { getSupabaseBrowser } from '@/lib/supabase';
import { getDisplayNameLength, limitDisplayName, MAX_DISPLAY_NAME_LENGTH } from '@/lib/display-name';

type NavUser = { id?: string; name: string; email?: string | null; avatar_url: string | null };
type Profile = { display_name: string; bio: string; avatar_url: string | null };
type ProfileTab = 'profile' | 'likes' | 'bookmarks' | 'comments';
type ProfileArticle = { id?: string; title?: string; slug?: string } | null;
type ProfileInteraction = { id: string; created_at: string; article: ProfileArticle };
type ProfileComment = { id: string; body: string; status: string; created_at: string; article: ProfileArticle };

const navLinks = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/articles' },
  { label: '软件', href: '/software' },
  { label: '分类', href: '/categories' },
  { label: '联系', href: '/contact' },
  { label: '关于', href: '/about' },
];

function SearchIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>;
}
function StarIcon() {
  return <svg className="six-star-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 20 17H4L12 3Z"/><path d="M12 21 4 7h16l-8 14Z"/></svg>;
}
function CloseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
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
  const [profileTab, setProfileTab] = useState<ProfileTab>('profile');
  const [profileLikes, setProfileLikes] = useState<ProfileInteraction[]>([]);
  const [profileBookmarks, setProfileBookmarks] = useState<ProfileInteraction[]>([]);
  const [profileComments, setProfileComments] = useState<ProfileComment[]>([]);
  const [profileListsLoading, setProfileListsLoading] = useState(false);
  const [profileListsError, setProfileListsError] = useState('');
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

  useEffect(() => {
    if (!drawerOpen || !user?.id) return;
    let active = true;
    const loadActivity = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      setProfileListsLoading(true);
      setProfileListsError('');
      const [likes, bookmarks, comments] = await Promise.all([
        supabase.from('article_interactions')
          .select('id,created_at,article:articles(id,title,slug)')
          .eq('user_id', user.id).eq('interaction_type', 'like')
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('article_interactions')
          .select('id,created_at,article:articles(id,title,slug)')
          .eq('user_id', user.id).eq('interaction_type', 'bookmark')
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('comments')
          .select('id,body,status,created_at,article:articles(id,title,slug)')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }).limit(50),
      ]);
      if (!active) return;
      if (likes.error || bookmarks.error || comments.error) {
        setProfileListsError('部分记录暂时无法加载，请稍后重试。');
      }
      if (!likes.error) setProfileLikes((likes.data || []) as unknown as ProfileInteraction[]);
      if (!bookmarks.error) setProfileBookmarks((bookmarks.data || []) as unknown as ProfileInteraction[]);
      if (!comments.error) setProfileComments((comments.data || []) as unknown as ProfileComment[]);
      setProfileListsLoading(false);
    };
    void loadActivity();
    return () => { active = false; };
  }, [drawerOpen, user?.id]);

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
    const nextName = profile.display_name.trim() || user.name;
    if (getDisplayNameLength(nextName) > MAX_DISPLAY_NAME_LENGTH) {
      setNotice('昵称不能超过12个字符');
      return;
    }
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
      setUploading(false);      event.target.value = '';
    }
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
              {navLinks.map(link => <Link key={link.href} href={link.href} className="nav-link-pill text-sm" style={{ fontSize: '14px' }}>{link.label}</Link>)}
            </nav>
            <div className={`nav-actions relative flex items-center gap-2 ${searchOpen ? "nav-actions-search-open" : ""}`}>
              <div className="nav-search-slot flex items-center">
                {searchOpen ? (
                  <form onSubmit={handleSearch} className="nav-search-capsule nav-search-capsule-inline animate-fade-in">
                    <input ref={searchRef} value={searchQuery} onChange={event => setSearchQuery(event.target.value)} type="search" placeholder={isMobileSearch ? "搜索文章 »" : "搜索文章 » 软件"} aria-label="搜索文章或软件" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]" style={{ fontSize: '14px' }}/>
                    <button type="submit" aria-label="提交搜索" className="nav-search-submit"><SearchIcon size={15}/></button>
                  </form>
                ) : <button type="button" aria-label="搜索" className="nav-icon-btn" onClick={() => setSearchOpen(true)}><SearchIcon/></button>}
              </div>
              <div className="nav-theme-slot"><ThemeToggle/></div>
              {user ? (
                <button type="button" aria-label="我的" aria-expanded={drawerOpen} className="nav-icon-btn nav-profile-trigger" onClick={() => { setMenuOpen(false); setDrawerOpen(true); setEditing(false); setProfileTab('profile'); setNotice(''); }}>
                  <StarIcon/>
                </button>
              ) : <Link href="/login" aria-label="我的（登录）" className="nav-icon-btn"><StarIcon/></Link>}
              <button type="button" aria-label={menuOpen ? '关闭菜单' : '打开菜单'} aria-expanded={menuOpen} className="nav-icon-btn mobile-menu-toggle md:hidden" onClick={() => setMenuOpen(value => !value)}>
                {menuOpen ? <CloseIcon/> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>}
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
            <div className="profile-drawer-content">
              {editing ? (
                <section className="profile-edit-card">
                  <div className="profile-edit-heading">
                    <div className="profile-avatar-ring profile-avatar-ring-edit">
                      <div className="profile-avatar-inner">
                        {avatar ? <img src={avatar} alt="头像" className="h-full w-full object-cover"/> : <span>{(displayName || user.name || 'U').slice(0,1).toUpperCase()}</span>}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold">编辑个人资料</h2>
                      <button type="button" className="profile-secondary-action mt-2" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? '上传中…' : '更换头像'}</button>
                      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" onChange={handleAvatarUpload}/>
                    </div>
                  </div>
                  <label className="profile-field-label">昵称</label>
                  <input className="profile-input" maxLength={MAX_DISPLAY_NAME_LENGTH * 2} value={profile.display_name} onChange={event => setProfile(value => ({...value, display_name:limitDisplayName(event.target.value)}))} placeholder="昵称（最多12个字符）"/>
                  <label className="profile-field-label">个人简介</label>
                  <textarea className="profile-input min-h-24 resize-none" maxLength={240} value={profile.bio} onChange={event => setProfile(value => ({...value, bio:event.target.value}))} placeholder="介绍一下自己…"/>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" className="profile-secondary-action" onClick={() => {setEditing(false);setNotice('');}}>取消</button>
                    <button type="button" className="profile-primary-action" disabled={saving || uploading} onClick={handleProfileSave}>{saving ? '保存中…' : '保存资料'}</button>
                  </div>
                </section>
              ) : (
                <>
                  <section className="profile-identity-card">
                    <div className="profile-identity-main">
                      <div className="profile-avatar-ring profile-avatar-ring-compact">
                        <div className="profile-avatar-inner">
                          {avatar ? <img src={avatar} alt="头像" className="h-full w-full object-cover"/> : <span>{(displayName || user.name || 'U').slice(0,1).toUpperCase()}</span>}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-bold">{user.name || '用户'}</h2>
                        <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{user.email || 'OwenFX 用户'}</p>
                        <span className="profile-member-state"><i className="profile-status-dot"/>账号已登录</span>
                      </div>
                    </div>
                    <p className="profile-identity-bio">{profile.bio || '还没有填写个人简介。'}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className="profile-secondary-action" onClick={() => {setEditing(true);setNotice('');}}>编辑资料</button>
                      <Link href="/settings" className="profile-secondary-action" onClick={() => setDrawerOpen(false)}>账号设置</Link>
                    </div>
                  </section>
                  <nav className="profile-activity-tabs" aria-label="个人活动">
                    <button type="button" className={profileTab === 'likes' ? 'profile-activity-tab active' : 'profile-activity-tab'} onClick={() => setProfileTab('likes')}>
                      <ArticleActionIcon type="like" /><span>喜欢</span><b>{profileLikes.length}</b>
                    </button>
                    <button type="button" className={profileTab === 'bookmarks' ? 'profile-activity-tab active' : 'profile-activity-tab'} onClick={() => setProfileTab('bookmarks')}>
                      <ArticleActionIcon type="bookmark" /><span>收藏</span><b>{profileBookmarks.length}</b>
                    </button>
                    <button type="button" className={profileTab === 'comments' ? 'profile-activity-tab active' : 'profile-activity-tab'} onClick={() => setProfileTab('comments')}>
                      <ArticleActionIcon type="comment" /><span>评论</span><b>{profileComments.length}</b>
                    </button>
                  </nav>
                  {profileListsError && <p role="status" className="profile-list-notice">{profileListsError}</p>}
                  <section className="profile-activity-list" aria-live="polite">
                    {profileListsLoading ? (
                      <div className="profile-list-empty">正在加载记录…</div>
                    ) : profileTab === 'likes' || profileTab === 'bookmarks' ? (
                      (profileTab === 'likes' ? profileLikes : profileBookmarks).length === 0 ? (
                        <div className="profile-list-empty">{profileTab === 'likes' ? '还没有喜欢的文章' : '还没有收藏的文章'}</div>
                      ) : (profileTab === 'likes' ? profileLikes : profileBookmarks).map(item => (
                        <Link key={item.id} href={item.article?.slug ? '/articles/' + item.article.slug : '/articles'} className="profile-activity-item" onClick={() => setDrawerOpen(false)}>
                          <span className="profile-activity-item-mark">{profileTab === 'likes' ? <ArticleActionIcon type="like" /> : <ArticleActionIcon type="bookmark" />}</span>
                          <span className="min-w-0 flex-1"><strong>{item.article?.title || '文章'}</strong><small>{new Date(item.created_at).toLocaleDateString('zh-CN')}</small></span>
                          <span className="profile-activity-arrow">›</span>
                        </Link>
                      ))
                    ) : profileComments.length === 0 ? (
                      <div className="profile-list-empty">还没有发表过评论</div>
                    ) : profileComments.map(item => (
                      <article key={item.id} className="profile-comment-item">
                        <div className="profile-comment-meta"><span>{new Date(item.created_at).toLocaleDateString('zh-CN')}</span><span>{item.status === 'approved' ? '已通过' : item.status === 'rejected' ? '未通过' : '审核中'}</span></div>
                        <p>{item.body}</p>
                        {item.article?.slug && <Link href={'/articles/' + item.article.slug} onClick={() => setDrawerOpen(false)}>查看文章 ›</Link>}
                      </article>
                    ))}
                  </section>
                </>
              )}
              {notice && <p role="status" className="profile-list-notice">{notice}</p>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}