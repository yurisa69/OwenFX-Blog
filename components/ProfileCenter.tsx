'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';

type Tab = 'profile' | 'bookmarks' | 'comments' | 'likes';
type ArticleRef = { id: string; title: string; slug: string } | null;
type Interaction = { id: string; created_at: string; article: ArticleRef };
type CommentItem = { id: string; body: string; status: string; created_at: string; article: ArticleRef };
type UserProfile = { id: string; email?: string; name: string; avatar: string | null; bio: string };

const EMPTY_USER: UserProfile = { id: '', name: '', avatar: null, bio: '' };

export default function ProfileCenter() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState<Tab | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [bookmarks, setBookmarks] = useState<Interaction[]>([]);
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Tab[]>(['profile']);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        if (active) {
          setError('Supabase 尚未配置，暂时无法加载个人中心。');
          setLoading(false);
        }
        return;
      }

      // The session is already maintained by the browser client; avoid a network
      // round-trip to auth.getUser() just to obtain the current user's id.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError || !session?.user) {
        router.replace('/login?next=/profile');
        return;
      }

      const authUser = session.user;
      const meta = authUser.user_metadata || {};
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name,avatar_url,bio')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!active) return;
      if (profileError) setError('个人资料暂时无法完整加载，请稍后重试。');
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: profile?.display_name || String(meta.display_name || meta.name || authUser.email?.split('@')[0] || '用户'),
        avatar: profile?.avatar_url || (typeof meta.avatar_url === 'string' ? meta.avatar_url : null),
        bio: profile?.bio || '',
      });
      setLoading(false);
    };

    void loadProfile();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (loading || !user.id || tab === 'profile' || loadedTabs.includes(tab)) return;

    let active = true;
    const loadTab = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      setTabLoading(tab);
      setError('');

      try {
        if (tab === 'bookmarks' || tab === 'likes') {
          const interactionType = tab === 'bookmarks' ? 'bookmark' : 'like';
          const { data, error: queryError } = await supabase
            .from('article_interactions')
            .select('id,created_at,article:articles(id,title,slug)')
            .eq('user_id', user.id)
            .eq('interaction_type', interactionType)
            .order('created_at', { ascending: false })
            .limit(50);

          if (queryError) throw queryError;
          if (!active) return;
          const rows = (data || []) as unknown as Interaction[];
          if (tab === 'bookmarks') setBookmarks(rows);
          else setLikes(rows);
        } else {
          const { data, error: queryError } = await supabase
            .from('comments')
            .select('id,body,status,created_at,article:articles(title,slug)')
            .eq('author_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (queryError) throw queryError;
          if (!active) return;
          setComments((data || []) as unknown as CommentItem[]);
        }

        if (active) setLoadedTabs(current => [...current, tab]);
      } catch {
        if (active) setError('数据加载失败，请检查网络后重试。');
      } finally {
        if (active) setTabLoading(null);
      }
    };

    void loadTab();
    return () => { active = false; };
  }, [loading, user.id, tab, loadedTabs]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'profile', label: '个人信息' },
    { id: 'bookmarks', label: '收藏', ...(loadedTabs.includes('bookmarks') ? { count: bookmarks.length } : {}) },
    { id: 'comments', label: '我的评论', ...(loadedTabs.includes('comments') ? { count: comments.length } : {}) },
    { id: 'likes', label: '我的喜欢', ...(loadedTabs.includes('likes') ? { count: likes.length } : {}) },
  ];

  const list = tab === 'bookmarks' ? bookmarks : likes;
  return <div className="mx-auto max-w-4xl py-8">
    <div className="mb-7">
      <p className="text-xs tracking-[.2em] opacity-50">OWENFX ACCOUNT</p>
      <h1 className="mt-2 text-3xl font-bold">个人中心</h1>
      <p className="mt-2 text-sm opacity-60">管理个人资料，查看你的收藏、评论和喜欢。</p>
    </div>
    <div className="mb-6 flex gap-2 overflow-x-auto border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
      {tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)}
        className="shrink-0 rounded-xl px-4 py-2 text-sm transition"
        style={{ background: tab === item.id ? 'var(--accent-bg)' : 'transparent', color: tab === item.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
        {item.label}{item.count !== undefined && <span className="ml-2 text-xs opacity-60">{item.count}</span>}
      </button>)}
    </div>

    {error && <p role="status" className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{error}</p>}

    {tab === 'profile' && <section className="uiverse-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}>
        {loading ? <span className="h-full w-full animate-pulse rounded-full" style={{ background: 'var(--bg-tertiary)' }} /> : user.avatar ? <img src={user.avatar} alt="头像" className="h-full w-full object-cover" /> : <span className="text-3xl font-semibold">{user.name.slice(0, 1).toUpperCase() || 'U'}</span>}
      </div>
      <div className="min-w-0 flex-1">
        {loading ? <div className="space-y-3"><div className="h-5 w-32 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} /><div className="h-3 w-48 max-w-full animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} /></div> : <>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="mt-1 break-all text-sm opacity-60">{user.email}</p>
          <p className="mt-3 text-sm leading-6 opacity-75">{user.bio || '还没有填写个人简介。'}</p>
        </>}
      </div>
    </section>}

    {tabLoading === tab && <div className="uiverse-card p-8 text-center text-sm opacity-60">正在加载数据…</div>}

    {tab === 'comments' && tabLoading !== tab && <div className="space-y-3">
      {!comments.length ? <Empty text="你还没有发表过评论" /> : comments.map(item => <div key={item.id} className="uiverse-card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs opacity-55"><span>{new Date(item.created_at).toLocaleString('zh-CN')}</span><span>{item.status === 'approved' ? '已通过' : item.status === 'rejected' ? '未通过' : '审核中'}</span></div>
        <p className="whitespace-pre-wrap text-sm leading-6">{item.body}</p>
        {item.article && <Link className="mt-3 inline-block text-sm" style={{ color: 'var(--accent)' }} href={'/articles/' + item.article.id}>文章：{item.article.title} →</Link>}
      </div>)}
    </div>}

    {(tab === 'bookmarks' || tab === 'likes') && tabLoading !== tab && <div className="space-y-3">
      {!list.length ? <Empty text={tab === 'bookmarks' ? '你还没有收藏文章' : '你还没有点赞文章'} /> : list.map(item => <div key={item.id} className="uiverse-card flex items-center justify-between gap-3 p-4">
        <div className="min-w-0"><p className="truncate text-sm font-medium">{item.article?.title || '文章'}</p><p className="mt-1 text-xs opacity-50">{new Date(item.created_at).toLocaleDateString('zh-CN')}</p></div>
        {item.article && <Link href={'/articles/' + item.article.slug} className="shrink-0 text-sm" style={{ color: 'var(--accent)' }}>查看 →</Link>}
      </div>)}
    </div>}
  </div>;
}

function Empty({ text }: { text: string }) {
  return <div className="uiverse-card p-10 text-center text-sm opacity-60">{text}</div>;
}
