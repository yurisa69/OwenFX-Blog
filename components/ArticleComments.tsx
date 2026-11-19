'use client';

import { useEffect, useRef, useState } from 'react';
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
  parent_comment_id: string | null;
  author?: CommentAuthor | CommentAuthor[] | null;
};
type CurrentUser = { id: string; name: string; avatar: string | null };

function getAuthor(author: CommentRow['author']): CommentAuthor {
  return Array.isArray(author) ? author[0] || null : author || null;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatChineseDateLocal(date)} • ${hours}:${minutes}`;
}

export default function ArticleComments({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [likeStats, setLikeStats] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'popular'>('oldest');

  useEffect(() => {
    if (notice !== '回复已发布！') return;
    const timer = window.setTimeout(() => {
      setNotice(current => current === '回复已发布！' ? '' : current);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

      const selection = 'id,author_id,body,status,created_at,parent_comment_id,author:profiles!comments_author_id_profiles_fkey(display_name,avatar_url)';
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
      const visibleCommentIds = unique.filter(row => row.status === 'approved').map(row => row.id);
      if (visibleCommentIds.length) {
        const { data: likes, error: likesError } = await supabase.from('comment_likes')
          .select('comment_id,user_id').in('comment_id', visibleCommentIds);
        if (!active) return;
        if (!likesError) {
          const nextStats: Record<string, { count: number; liked: boolean }> = {};
          for (const id of visibleCommentIds) nextStats[id] = { count: 0, liked: false };
          for (const like of likes || []) {
            const stats = nextStats[like.comment_id];
            if (!stats) continue;
            stats.count += 1;
            if (like.user_id === authUser?.id) stats.liked = true;
          }
          setLikeStats(nextStats);
        } else setNotice('评论点赞暂时无法加载，请稍后重试。');
      }
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
      setNotice(replyingTo ? '每条回复最多 600 字。' : '每条评论最多 600 字。');
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setNotice(replyingTo ? '回复服务暂时不可用，请稍后再试。' : '评论服务暂时不可用，请稍后再试。');
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
        body: JSON.stringify(replyingTo
          ? { articleId, body, parentCommentId: replyingTo }
          : { articleId, body, website: honeypot }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.comment) {
        throw new Error(result.error || (replyingTo ? '回复提交失败，请稍后重试。' : '评论提交失败，请稍后重试。'));
      }
      const submitted = result.comment as CommentRow;
      if (submitted.status === 'approved' || submitted.status === 'pending') {
        setComments(current => replyingTo ? [...current, submitted] : [submitted, ...current]);
      }
      const wasReply = Boolean(replyingTo);
      setCommentText('');
      setHoneypot('');
      setReplyingTo(null);
      setReplyingToName('');
      setNotice(wasReply
        ? submitted.status === 'approved' ? '回复已发布！' : '回复已提交，审核通过后会公开显示。'
        : submitted.status === 'approved' ? '评论已发布并公开显示。' : '评论已提交，审核通过后会公开显示。');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : (replyingTo ? '回复提交失败，请稍后重试。' : '评论提交失败，请稍后重试。'));
    } finally {
      setSubmitting(false);
    }
  };

  const login = () => router.push('/login?next=' + encodeURIComponent(window.location.pathname));

  const toggleCommentLike = async (comment: CommentRow) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { login(); return; }
    if (likeBusyId === comment.id) return;
    const current = likeStats[comment.id] || { count: 0, liked: false };
    setLikeBusyId(comment.id);
    const result = current.liked
      ? await supabase.from('comment_likes').delete().eq('comment_id', comment.id).eq('user_id', session.user.id)
      : await supabase.from('comment_likes').insert({ comment_id: comment.id, user_id: session.user.id });
    setLikeBusyId(null);
    if (result.error) {
      setNotice(result.error.code === '23505' ? '你已经点过赞了。' : '点赞操作失败，请稍后重试。');
      return;
    }
    setLikeStats(previous => ({
      ...previous,
      [comment.id]: { count: Math.max(0, current.count + (current.liked ? -1 : 1)), liked: !current.liked },
    }));
  };

  const initial = user?.name.trim().charAt(0).toUpperCase() || 'U';
  const rootComments = comments.filter(comment => !comment.parent_comment_id);
  const floorNumbers = new Map(
    [...rootComments]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((comment, index) => [comment.id, index + 1]),
  );
  const sortedRootComments = [...rootComments].sort((a, b) => {
    if (commentSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (commentSort === 'popular') {
      const likeDifference = (likeStats[b.id]?.count || 0) - (likeStats[a.id]?.count || 0);
      if (likeDifference !== 0) return likeDifference;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const replyTargetName = replyingTo ? replyingToName : '';

  return (
    <section id="article-comments-card" className="article-comments-surface uiverse-card mt-3 p-4 sm:p-6" aria-label="文章评论">
      <div className="mb-5 md:grid md:grid-cols-[120px_minmax(0,1fr)] md:items-center md:gap-5">
        <div className="article-comments-identity mb-5 flex flex-col items-center justify-center text-center md:mb-0">
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            {user?.avatar ? <img src={user.avatar} alt="头像" className="h-full w-full object-cover" /> : initial}
          </div>
          <p className={user ? "mt-2 max-w-full truncate text-sm font-semibold monet-waterlily-flow" : "mt-2 max-w-full truncate text-sm font-semibold"}
            style={!user ? { color: 'var(--text-secondary)' } : undefined}>
            {user?.name || '登录后发表评论'}
          </p>
        </div>

        <div className="article-comments-compose space-y-2">
        <input type="text" name="website" value={honeypot}
          onChange={event => setHoneypot(event.target.value)} tabIndex={-1}
          autoComplete="off" aria-hidden="true"
          className="absolute -left-[10000px] h-px w-px opacity-0" />
        <textarea ref={commentInputRef} value={commentText} onChange={event => setCommentText(Array.from(event.target.value).slice(0, 600).join(''))}
          placeholder={user ? (replyingTo ? `回复 ${replyTargetName}...` : '写下评论...') : '登录后即可发表评论'} rows={3} maxLength={1200}
          disabled={!user} className="block w-full resize-none rounded-xl border p-3 text-sm outline-none transition"
          style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
        <div className="article-comments-compose-actions flex w-full items-center justify-end">
          <button type="button" onClick={() => user ? void submitComment() : login()}
            disabled={Boolean(user && (!commentText.trim() || submitting))}
            aria-label={!user ? '登录后评论' : submitting ? '正在发送评论' : replyingTo ? '发送回复' : '发表评论'}
            title={!user ? '登录后评论' : submitting ? '正在发送' : replyingTo ? '发送回复' : '发表评论'}
            className="article-comment-submit-desktop uiverse-btn uiverse-btn-primary hidden w-full rounded-xl !px-5 !py-2.5 text-sm md:block">
            {!user ? '登录后评论' : submitting ? '提交中…' : replyingTo ? '发送回复' : '发表评论'}
          </button>
          <button type="button" onClick={() => user ? void submitComment() : login()}
            disabled={Boolean(user && (!commentText.trim() || submitting))}
            aria-label={!user ? '登录后评论' : submitting ? '正在发送评论' : replyingTo ? '发送回复' : '发表评论'}
            title={!user ? '登录后评论' : submitting ? '正在发送' : replyingTo ? '发送回复' : '发表评论'}
            className="article-comment-send-mobile inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-45 md:hidden"
            style={{ borderColor: 'var(--border-color)', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-[19px] w-[19px]">
              <path d="M22.05 2.25 2.8 9.7c-1.3.5-1.2 2.3.1 2.7l5.1 1.7 1.8 5.5c.4 1.2 2 1.4 2.7.3l3-4.6 5.1 3.7c1 .7 2.3.1 2.5-1.1l2.1-13.8c.2-1.3-1-2.3-2.2-1.8Z" />
              <path d="m8 14.1 10.9-8.2-8.2 9.3-.5 4.1-2.2-5.2Z" fill="var(--accent-bg)" />
            </svg>
          </button>
        </div>
        {notice && <p role="status" className="text-xs" style={{ color: 'var(--text-secondary)' }}>{notice}</p>}
        </div>
      </div>

      <div className="article-comments-list border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <h3 className="text-sm font-semibold">全部评论</h3>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{comments.length} 条</span>
          </div>
          <select
            value={commentSort}
            onChange={event => setCommentSort(event.target.value as 'newest' | 'oldest' | 'popular')}
            aria-label="评论排序"
            className="max-w-[124px] rounded-lg border px-2 py-1.5 text-xs outline-none"
            style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
          >
            <option value="oldest">正序</option>
            <option value="newest">倒序</option>
            <option value="popular">最热</option>
          </select>
        </div>
        {!commentsLoaded ? (
          <div className="space-y-4" aria-hidden="true">
            {[0, 1].map(item => <div key={item} className="flex gap-3"><div className="h-8 w-8 animate-pulse rounded-full" style={{ background: 'var(--bg-tertiary)' }} /><div className="flex-1 space-y-2 pt-1"><div className="h-3 w-24 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} /><div className="h-3 w-3/4 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} /></div></div>)}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无评论，来发表第一条评论吧。</p>
        ) : (
          <div className="space-y-5">
            {sortedRootComments.map(comment => {
              const author = getAuthor(comment.author);
              const name = author?.display_name || '用户';
              const replies = comments.filter(item => item.parent_comment_id === comment.id);
              const stats = likeStats[comment.id] || { count: 0, liked: false };
              return (
                <article key={comment.id} className="flex gap-3 border-b pb-5 last:border-b-0 last:pb-0" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {author?.avatar_url ? <img src={author.avatar_url} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={comment.author_id === user?.id ? "text-sm font-medium monet-waterlily-flow" : "text-sm font-medium"}>{name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(comment.created_at)} • {floorNumbers.get(comment.id)}楼</span>
                      {comment.status === 'pending' && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>审核中</span>}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{comment.body}</p>
                    {comment.status === 'approved' && (
                      <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <button type="button" onClick={() => void toggleCommentLike(comment)} disabled={likeBusyId === comment.id}
                          aria-pressed={stats.liked} className="inline-flex min-h-8 items-center gap-1.5 rounded-md transition hover:text-[var(--accent)]"
                          style={stats.liked ? { color: 'var(--accent)' } : undefined}>
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill={stats.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5-8c2 0 3 2 2 4l-1 4h6a2 2 0 0 1 2 2l-1.5 7a2 2 0 0 1-2 2H7" />
                          </svg>
                          <span>点赞{stats.count > 0 ? ` ${stats.count}` : ''}</span>
                        </button>
                        <button type="button" onClick={() => {
                          if (!user) { login(); return; }
                          setReplyingTo(current => current === comment.id ? null : comment.id);
                          setReplyingToName(current => replyingTo === comment.id ? '' : name);
                          setCommentText(''); setNotice('');
                          commentInputRef.current?.focus();
                        }} className="inline-flex min-h-8 items-center gap-1.5 rounded-md transition hover:text-[var(--accent)]">
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-8l-6 3v-3.5A2.5 2.5 0 0 1 2.5 16V7A2.5 2.5 0 0 1 5 4.5Z" />
                          </svg><span>回复</span>{replies.length > 0 && <span className="text-xs tabular-nums" style={{ color: 'var(--text-tertiary)' }}>+{replies.length}</span>}
                        </button>
                        {replies.length > 0 && (
                          <>
                            <button type="button"
                              onClick={() => setExpandedReplies(current => ({ ...current, [comment.id]: !current[comment.id] }))}
                              aria-expanded={Boolean(expandedReplies[comment.id])}
                              aria-controls={`article-replies-${comment.id}`}
                              className="inline-flex min-h-8 items-center gap-1 rounded-md transition hover:text-[var(--accent)]">
                              <span>{expandedReplies[comment.id] ? '收起回复' : '展开回复'}</span>
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                                className={`h-3.5 w-3.5 transition-transform ${expandedReplies[comment.id] ? 'rotate-180' : ''}`}>
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {replies.length > 0 && expandedReplies[comment.id] && (
                      <div id={`article-replies-${comment.id}`} className="mt-3 space-y-3 border-l-2 pl-3" style={{ borderColor: 'var(--border-color)' }}>
                        {replies.map(reply => {
                          const replyAuthor = getAuthor(reply.author);
                          const replyName = replyAuthor?.display_name || '用户';
                          const replyStats = likeStats[reply.id] || { count: 0, liked: false };
                          return (
                            <div key={reply.id} className="flex gap-2.5 border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: "var(--border-color)" }}>
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px]"
                                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                {replyAuthor?.avatar_url ? <img src={replyAuthor.avatar_url} alt="" className="h-full w-full object-cover" /> : replyName.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className={reply.author_id === user?.id ? "text-xs font-medium monet-waterlily-flow" : "text-xs font-medium"}>{replyName}</span>
                                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{formatDate(reply.created_at)}</span>
                                  {reply.status === 'pending' && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>审核中</span>}
                                </div>
                                <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{reply.body}</p>
                                {reply.status === 'approved' && (
                                  <div className="mt-1 flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    <button type="button" onClick={() => void toggleCommentLike(reply)} disabled={likeBusyId === reply.id}
                                      aria-pressed={replyStats.liked} className="inline-flex min-h-7 items-center gap-1.5 rounded-md transition hover:text-[var(--accent)]"
                                      style={replyStats.liked ? { color: 'var(--accent)' } : undefined}>
                                      <svg aria-hidden="true" viewBox="0 0 24 24" fill={replyStats.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5-8c2 0 3 2 2 4l-1 4h6a2 2 0 0 1 2 2l-1.5 7a2 2 0 0 1-2 2H7" />
                                      </svg>
                                      <span>点赞{replyStats.count > 0 ? ` ${replyStats.count}` : ''}</span>
                                    </button>
                                    <button type="button" onClick={() => {
                                      if (!user) { login(); return; }
                                      setReplyingTo(reply.parent_comment_id);
                                      setReplyingToName(replyName);
                                      setCommentText(''); setNotice('');
                                      commentInputRef.current?.focus();
                                    }} className="inline-flex min-h-7 items-center gap-1.5 rounded-md transition hover:text-[var(--accent)]">
                                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-8l-6 3v-3.5A2.5 2.5 0 0 1 2.5 16V7A2.5 2.5 0 0 1 5 4.5Z" />
                                      </svg>
                                      <span>回复</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
