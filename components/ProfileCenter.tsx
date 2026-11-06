'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';

type Tab = 'profile' | 'bookmarks' | 'comments' | 'likes';
type ArticleRef = { id: string; title: string; slug: string } | null;
type Interaction = { id: string; created_at: string; article: ArticleRef };
type CommentItem = { id: string; body: string; status: string; created_at: string; article: ArticleRef };

export default function ProfileCenter() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{id:string;email?:string;name:string;avatar:string|null;bio:string}>({id:'',name:'',avatar:null,bio:''});
  const [bookmarks, setBookmarks] = useState<Interaction[]>([]);
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) { setLoading(false); return; }
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!active) return;
      if (!authUser) { router.replace('/login?next=/profile'); return; }
      const meta = authUser.user_metadata || {};
      const { data: profile } = await supabase.from('profiles').select('display_name,avatar_url,bio').eq('id', authUser.id).maybeSingle();
      const [interactionResult, commentResult] = await Promise.all([
        supabase.from('article_interactions').select('id,interaction_type,created_at,article:articles(id,title,slug)')
          .eq('user_id', authUser.id).order('created_at', {ascending:false}),
        supabase.from('comments').select('id,body,status,created_at,article:articles(title,slug)')
          .eq('author_id', authUser.id).order('created_at', {ascending:false}),
      ]);
      if (!active) return;
      setUser({id:authUser.id,email:authUser.email,name:profile?.display_name || String(meta.display_name || meta.name || authUser.email?.split('@')[0] || '用户'),avatar:profile?.avatar_url || (typeof meta.avatar_url === 'string' ? meta.avatar_url : null),bio:profile?.bio || ''});
      const rows = (interactionResult.data || []) as unknown as (Interaction & {interaction_type:string})[];
      setBookmarks(rows.filter(row => row.interaction_type === 'bookmark'));
      setLikes(rows.filter(row => row.interaction_type === 'like'));
      setComments((commentResult.data || []) as unknown as CommentItem[]);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [router]);

  const tabs: {id:Tab;label:string;count?:number}[] = [
    {id:'profile',label:'个人信息'},
    {id:'bookmarks',label:'收藏',count:bookmarks.length},
    {id:'comments',label:'我的评论',count:comments.length},
    {id:'likes',label:'我的喜欢',count:likes.length},
  ];

  if (loading) return <div className="py-16 text-center text-sm opacity-60">正在加载个人中心…</div>;

  const list = tab === 'bookmarks' ? bookmarks : likes;
  return <div className="mx-auto max-w-4xl py-8">
    <div className="mb-7">
      <p className="text-xs tracking-[.2em] opacity-50">OWENFX ACCOUNT</p>
      <h1 className="mt-2 text-3xl font-bold">个人中心</h1>
      <p className="mt-2 text-sm opacity-60">管理个人资料，查看你的收藏、评论和喜欢。</p>
    </div>
    <div className="mb-6 flex gap-2 overflow-x-auto border-b pb-3" style={{borderColor:'var(--border-color)'}}>
      {tabs.map(item => <button key={item.id} type="button" onClick={()=>setTab(item.id)}
        className="shrink-0 rounded-xl px-4 py-2 text-sm transition"
        style={{background:tab===item.id?'var(--accent-bg)':'transparent',color:tab===item.id?'var(--accent)':'var(--text-secondary)'}}>
        {item.label}{item.count !== undefined && <span className="ml-2 text-xs opacity-60">{item.count}</span>}
      </button>)}
    </div>

    {tab === 'profile' && <section className="uiverse-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border" style={{borderColor:'var(--border-color)',background:'var(--bg-tertiary)'}}>
        {user.avatar ? <img src={user.avatar} alt="头像" className="h-full w-full object-cover"/> : <span className="text-3xl font-semibold">{user.name.slice(0,1).toUpperCase()}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <p className="mt-1 break-all text-sm opacity-60">{user.email}</p>
        <p className="mt-3 text-sm leading-6 opacity-75">{user.bio || '还没有填写个人简介。'}</p>
      </div>
    </section>}

    {tab === 'comments' && <div className="space-y-3">
      {!comments.length ? <Empty text="你还没有发表过评论"/> : comments.map(item=><div key={item.id} className="uiverse-card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs opacity-55"><span>{new Date(item.created_at).toLocaleString('zh-CN')}</span><span>{item.status==='approved'?'已通过':item.status==='rejected'?'未通过':'审核中'}</span></div>
        <p className="whitespace-pre-wrap text-sm leading-6">{item.body}</p>
        {item.article && <Link className="mt-3 inline-block text-sm" style={{color:'var(--accent)'}} href={'/articles/'+item.article.id}>文章：{item.article.title} →</Link>}
      </div>)}
    </div>}

    {(tab === 'bookmarks' || tab === 'likes') && <div className="space-y-3">
      {!list.length ? <Empty text={tab==='bookmarks'?'你还没有收藏文章':'你还没有点赞文章'}/> : list.map(item=><div key={item.id} className="uiverse-card flex items-center justify-between gap-3 p-4">
        <div className="min-w-0"><p className="truncate text-sm font-medium">{item.article?.title || '文章'}</p><p className="mt-1 text-xs opacity-50">{new Date(item.created_at).toLocaleDateString('zh-CN')}</p></div>
        {item.article && <Link href={'/articles/'+item.article.slug} className="shrink-0 text-sm" style={{color:'var(--accent)'}}>查看 →</Link>}
      </div>)}
    </div>}
  </div>;
}

function Empty({text}:{text:string}) {
  return <div className="uiverse-card p-10 text-center text-sm opacity-60">{text}</div>;
}
