 'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ArticleActionIcon from '@/components/ArticleActionIcon';
import Avatar from '@/components/Avatar';
import { getSupabaseBrowser } from '@/lib/supabase';
import { getDisplayNameLength, limitDisplayName, MAX_DISPLAY_NAME_LENGTH } from '@/lib/display-name';
import { formatChineseDateLocal } from '@/lib/date';

type NavUser = { id?: string; name: string; email?: string | null; avatar_url: string | null };
type Profile = { display_name: string; bio: string; avatar_url: string | null };
type ProfileTab = 'profile' | 'notifications' | 'likes' | 'bookmarks';
type ProfileArticle = { id?: string; title?: string; slug?: string } | null;
type ProfileInteraction = { id: string; created_at: string; article: ProfileArticle };
type ProfileNotification = { id: string; body: string; author_id: string; created_at: string; author: { display_name?: string | null } | { display_name?: string | null }[] | null; article: ProfileArticle };

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

function SiteNavbarContent({ initialUser = null }: { initialUser?: NavUser | null }) {
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
  const [profileNotifications, setProfileNotifications] = useState<ProfileNotification[]>([]);
  const [profileListsLoading, setProfileListsLoading] = useState(false);
  const [profileListsError, setProfileListsError] = useState('');
  const [profileLoadedTabs, setProfileLoadedTabs] = useState<Record<'notifications' | 'likes' | 'bookmarks', boolean>>({ notifications: false, likes: false, bookmarks: false });
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
  // Warm the account profile as soon as the authenticated Navbar mounts.
  // The server-provided Session remains the immediate fallback; profile data
  // and its image are fetched/decoded in the background before the drawer opens.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let active = true;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const preloadAvatar = (url: string | null) => {
      if (!url) return;
      const image = new window.Image();
      image.decoding = 'async';
      image.src = url;
      if (typeof image.decode === 'function') {
        void image.decode().catch(() => undefined);
      }
    };

    const load = async () => {
      const [sessionResult, profileResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('profiles')
          .select('display_name,bio,avatar_url')
          .eq('id', userId)
          .maybeSingle(),
      ]);
      if (!active) return;

      const sessionUser = sessionResult.data.session?.user;
      if (sessionUser && sessionUser.id !== userId) return;

      const metadata = (sessionUser?.user_metadata || {}) as Record<string, unknown>;
      const sessionAvatar = typeof metadata.avatar_url === 'string'
        ? metadata.avatar_url
        : typeof metadata.picture === 'string'
          ? metadata.picture
          : null;
      const sessionName = typeof metadata.display_name === 'string'
        ? metadata.display_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : null;

      if (sessionUser?.id === userId) preloadAvatar(sessionAvatar);
      if (profileResult.error) {
        if (sessionUser?.id === userId && sessionAvatar) {
          setUser(current => current?.id === userId && !current.avatar_url
            ? { ...current, avatar_url: sessionAvatar }
            : current);
        }
        return;
      }

      const data = profileResult.data;
      const nextAvatar = data?.avatar_url || sessionAvatar;
      setProfile(current => ({
        display_name: data?.display_name || sessionName || current.display_name,
        bio: data?.bio || current.bio,
        avatar_url: data?.avatar_url || current.avatar_url || sessionAvatar,
      }));
      setUser(current => current?.id === userId
        ? {
            ...current,
            name: data?.display_name || current.name || sessionName || '用户',
            avatar_url: data?.avatar_url || current.avatar_url || sessionAvatar,
          }
        : current);
      preloadAvatar(nextAvatar);
    };

    void load();
    return () => { active = false; };
  }, [user?.id]);


  const loadProfileTab = async (tab: 'notifications' | 'likes' | 'bookmarks') => {
    if (profileTab === tab) {
      setProfileTab('profile');
      return;
    }
    setProfileTab(tab);
    if (!user?.id || profileLoadedTabs[tab] || profileListsLoading) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setProfileListsError('Supabase 尚未配置，暂时无法加载记录。');
      return;
    }

    setProfileListsLoading(true);
    setProfileListsError('');
    try {
      if (tab === 'notifications') {
        const { data: ownComments, error: ownCommentsError } = await supabase.from('comments')
          .select('id')
          .eq('author_id', user.id)
          .eq('status', 'approved')
          .is('parent_comment_id', null)
          .order('created_at', { ascending: false })
          .limit(500);
        if (ownCommentsError) throw ownCommentsError;

        const commentIds = (ownComments || []).map(comment => comment.id);
        if (commentIds.length === 0) {
          setProfileNotifications([]);
        } else {
          const { data, error } = await supabase.from('comments')
            .select('id,body,author_id,created_at,author:profiles!comments_author_id_profiles_fkey(display_name),article:articles(id,title,slug)')
            .in('parent_comment_id', commentIds)
            .eq('status', 'approved')
            .neq('author_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setProfileNotifications((data || []) as unknown as ProfileNotification[]);
        }
      } else {
        const { data, error } = await supabase.from('article_interactions')
          .select('id,created_at,article:articles(id,title,slug)')
          .eq('user_id', user.id)
          .eq('interaction_type', tab === 'likes' ? 'like' : 'bookmark')
          .order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        if (tab === 'likes') setProfileLikes((data || []) as unknown as ProfileInteraction[]);
        else setProfileBookmarks((data || []) as unknown as ProfileInteraction[]);
      }
      setProfileLoadedTabs(current => ({ ...current, [tab]: true }));
    } catch {
      setProfileListsError('记录暂时无法加载，请点击选项重试。');
    } finally {
      setProfileListsLoading(false);
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    setMenuOpen(false);
    router.push('/search?q=' + encodeURIComponent(query));
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
            <div className="profile-drawer-content" onClick={event => {
              if (event.target === event.currentTarget && profileTab !== 'profile') setProfileTab('profile');
            }}>
              {editing ? (
                <section className="profile-edit-card">
                  <div className="profile-edit-heading">
                    <div className="profile-avatar-ring profile-avatar-ring-edit">
                      <div className="profile-avatar-inner">
                        <Avatar src={avatar} alt="头像" fallback={(displayName || user.name || 'U').slice(0,1).toUpperCase()} priority />
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
                          <Avatar src={avatar} alt="头像" fallback={(displayName || user.name || 'U').slice(0,1).toUpperCase()} priority />
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
                    <button type="button" className={profileTab === 'notifications' ? 'profile-activity-tab active' : 'profile-activity-tab'} onClick={() => void loadProfileTab('notifications')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg><span>通知</span>{profileLoadedTabs.notifications && profileNotifications.length > 0 && <b>{profileNotifications.length}</b>}
                    </button>
                    <button type="button" className={profileTab === 'likes' ? 'profile-activity-tab active' : 'profile-activity-tab'} onClick={() => void loadProfileTab('likes')}>
                      <ArticleActionIcon type="like" /><span>喜欢</span>{profileLoadedTabs.likes && profileLikes.length > 0 && <b>{profileLikes.length}</b>}
                    </button>
                    <button type="button" className={profileTab === 'bookmarks' ? 'profile-activity-tab active' : 'profile-activity-tab'} onClick={() => void loadProfileTab('bookmarks')}>
                      <ArticleActionIcon type="bookmark" /><span>收藏</span>{profileLoadedTabs.bookmarks && profileBookmarks.length > 0 && <b>{profileBookmarks.length}</b>}
                    </button>
                  </nav>
                  {profileListsError && <p role="status" className="profile-list-notice">{profileListsError}</p>}
                  {profileTab !== 'profile' && <section className="profile-activity-list" aria-live="polite">
                    {profileListsLoading ? (
                      <div className="profile-list-empty">正在加载记录…</div>
                    ) : profileTab === 'notifications' ? (
                      profileNotifications.length === 0 ? (
                        <div className="profile-list-empty">暂时没有人回复你的评论</div>
                      ) : profileNotifications.map(item => {
                        const replyAuthor = Array.isArray(item.author) ? item.author[0] : item.author;
                        return (
                          <Link key={item.id} href={item.article?.slug ? '/articles/' + item.article.slug : '/articles'} className="profile-activity-item" onClick={() => setDrawerOpen(false)}>
                            <span className="profile-activity-item-mark"><ArticleActionIcon type="comment" /></span>
                            <span className="min-w-0 flex-1">
                              <strong>{replyAuthor?.display_name || '用户'} 回复了你的评论</strong>
                              <small>{item.article?.title || '文章'} · {formatChineseDateLocal(item.created_at)}</small>
                              <small className="mt-1 block truncate">{item.body}</small>
                            </span>
                            <span className="profile-activity-arrow">›</span>
                          </Link>
                        );
                      })
                    ) : (
                      (profileTab === 'likes' ? profileLikes : profileBookmarks).length === 0 ? (
                        <div className="profile-list-empty">{profileTab === 'likes' ? '还没有喜欢的文章' : '还没有收藏的文章'}</div>
                      ) : (profileTab === 'likes' ? profileLikes : profileBookmarks).map(item => (
                        <Link key={item.id} href={item.article?.slug ? '/articles/' + item.article.slug : '/articles'} className="profile-activity-item" onClick={() => setDrawerOpen(false)}>
                          <span className="profile-activity-item-mark">{profileTab === 'likes' ? <ArticleActionIcon type="like" /> : <ArticleActionIcon type="bookmark" />}</span>
                          <span className="min-w-0 flex-1"><strong>{item.article?.title || '文章'}</strong><small>{formatChineseDateLocal(item.created_at)}</small></span>
                          <span className="profile-activity-arrow">›</span>
                        </Link>
                      ))
                    )}
                  </section>}
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

export default function Navbar({ initialUser = null }: { initialUser?: NavUser | null }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return <SiteNavbarContent initialUser={initialUser} />;
}
