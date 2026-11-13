'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import { formatChineseDateLocal } from '@/lib/date';

type CommentAuthor = { display_name?: string | null; avatar_url?: string | null } | null;
type CommentRow = {
  id: string;
  author_id: string;
  body: string;
  status: 'approved' | 'pending' | 'rejected' | 'spam';
  created_at: string;
  author?: CommentAuthor | CommentAuthor[] | null;
};
type CurrentUser = { id: string; name: string; avatar: string | null };

function getAuthor(author: CommentRow['author']): CommentAuthor {
  return Array.isArray(author) ? author[0] || null : author || null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : formatChineseDateLocal(date);
}

export default function ArticleComments({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        if (active) setCommentsLoaded(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user || null;
      if (!active) return;

      if (authUser) {
        const metadata = authUser.user_metadata || {};
        const { data: profile } = await supabase.from('profiles')
          .select('display_name,avatar_url').eq('id', authUser.id).maybeSingle();
        if (!active) return;
        setUser({
          id: authUser.id,
          name: profile?.display_name || String(metadata.display_name || metadata.name || authUser.email?.split('@')[0] || '用户'),
          avatar: profile?.avatar_url || (typeof metadata.avatar_url === 'string' ? metadata.avatar_url : typeof metadata.picture === 'string' ? metadata.picture : null),
        });
      }

      const selection = 'id,author_id,body,status,created_at,author:profiles!comments_author_id_profiles_fkey(display_name,avatar_url)';
      const approvedQuery = supabase.from('comments').select(selection)
        .eq('article_id', articleId).eq('status', 'approved')
        .order('created_at', { ascending: false }).limit(100);
      const pendingQuery = authUser
        ? supabase.from('comments').select(selection).eq('article_id', articleId)
            .eq('author_id', authUser.id).eq('status', 'pending')
            .order('created_at', { ascending: false }).limit(50)
        : Promise.resolve({ data: [] as CommentRow[], error: null });

      const [approvedResult, pendingResult] = await Promise.all([approvedQuery, pendingQuery]);
      if (!active) return;

      const rows = [...(approvedResult.data || []), ...(pendingResult.data || [])] as unknown as CommentRow[];
      const unique = Array.from(new Map(rows.map(row => [row.id, row])).values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setComments(unique);
      if (approvedResult.error || pendingResult.error) setNotice('部分评论暂时无法显示，请稍后重试。');
      setCommentsLoaded(true);
    };

    void load();
    return () => { active = false; };
  }, [articleId]);

  const submitComment = async () => {
    const body = commentText.trim();
    if (!body || submitting) return;
    if (Array.from(body).length > 600) {
      setNotice('每条评论最多 600 字。');
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setNotice('评论服务暂时不可用，请稍后再试。');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setSubmitting(true);
    setNotice('');
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ articleId, body, website: honeypot }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.comment) {
        throw new Error(result.error || '评论提交失败，请稍后重试。');
      }
      const submitted = result.comment as CommentRow;
      if (submitted.status === 'approved' || submitted.status === 'pending') {
        setComments(current => [submitted, ...current]);
      }
      setCommentText('');
      setHoneypot('');
      setNotice(submitted.status === 'approved'
        ? '评论已发布并公开显示。'
        : '评论已提交，审核通过后会公开显示。');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '评论提交失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const initial = user?.name.trim().charAt(0).toUpperCase() || 'U';

  return (
    <section id="article-comments-card" className="uiverse-card mt-3 p-4 sm:p-6" aria-label="文章评论">
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
          {user?.avatar ? <img src={user.avatar} alt="头像" className="h-full w-full object-cover" /> : initial}
        </div>
        <p className={user ? "mt-2 max-w-full truncate text-sm font-semibold monet-waterlily-flow" : "mt-2 max-w-full truncate text-sm font-semibold"}
          style={!user ? { color: 'var(--text-secondary)' } : undefined}>
          {user?.name || '登录后发表评论'}
        </p>
      </div>

      <div className="mb-5 space-y-2">
        <input type="text" name="website" value={honeypot}
          onChange={event => setHoneypot(event.target.value)} tabIndex={-1}
          autoComplete="off" aria-hidden="true"
          className="absolute -left-[10000px] h-px w-px opacity-0" />
        <textarea value={commentText} onChange={event => setCommentText(Array.from(event.target.value).slice(0, 600).join(''))}
          placeholder={user ? '写下评论...' : '登录后即可发表评论'} rows={3} maxLength={1200}
          disabled={!user} className="block w-full resize-none rounded-xl border p-3 text-sm outline-none transition"
          style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
        <div className="w-full">
          {user ? (
            <button type="button" onClick={() => void submitComment()} disabled={!commentText.trim() || submitting}
              className="uiverse-btn uiverse-btn-primary block w-full rounded-xl !px-5 !py-2.5 text-sm">
              {submitting ? '提交中…' : '发表评论'}
            </button>
          ) : (
            <button type="button" onClick={() => router.push('/login?next=' + encodeURIComponent(window.location.pathname))}
              className="uiverse-btn uiverse-btn-primary block w-full rounded-xl !px-5 !py-2.5 text-sm">登录后评论</button>
          )}
        </div>
        {notice && <p role="status" className="text-xs" style={{ color: 'var(--text-secondary)' }}>{notice}</p>}
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">全部评论</h3>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{comments.length} 条</span>
        </div>
        {!commentsLoaded ? (
          <div className="space-y-4" aria-hidden="true">
            {[0, 1].map(item => <div key={item} className="flex gap-3"><div className="h-8 w-8 animate-pulse rounded-full" style={{ background: 'var(--bg-tertiary)' }} /><div className="flex-1 space-y-2 pt-1"><div className="h-3 w-24 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} /><div className="h-3 w-3/4 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} /></div></div>)}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无评论，来发表第一条评论吧。</p>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => {
              const author = getAuthor(comment.author);
              const name = author?.display_name || '用户';
              return (
                <article key={comment.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {author?.avatar_url ? <img src={author.avatar_url} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={comment.author_id === user?.id ? "text-sm font-medium monet-waterlily-flow" : "text-sm font-medium"}>{name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(comment.created_at)}</span>
                      {comment.status === 'pending' && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>审核中</span>}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{comment.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
