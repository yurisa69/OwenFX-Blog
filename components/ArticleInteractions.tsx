'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import ArticleComments from '@/components/ArticleComments';

type InteractionType = 'bookmark' | 'like';

function ActionIcon({ type, active = false }: { type: 'like' | 'bookmark' | 'comment' | 'share'; active?: boolean }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (type === 'like') return <svg {...common} fill={active ? 'currentColor' : 'none'}><path d="M20.8 8.7c0 5.1-8.8 10-8.8 10s-8.8-4.9-8.8-10A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" /></svg>;
  if (type === 'bookmark') return <svg {...common} fill={active ? 'currentColor' : 'none'}><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z" /></svg>;
  if (type === 'comment') return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></svg>;
  return <svg {...common}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4m-6.6 9.4 6.6 2.6" /></svg>;
}

export default function ArticleInteractions({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState<InteractionType | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setUserId(user.id);
      const { data } = await supabase.from('article_interactions')
        .select('interaction_type').eq('user_id', user.id).eq('article_id', articleId);
      if (!active) return;
      setSaved(!!data?.some(row => row.interaction_type === 'bookmark'));
      setLiked(!!data?.some(row => row.interaction_type === 'like'));
    };
    void load();
    return () => { active = false; };
  }, [articleId]);

  const toggle = async (type: InteractionType) => {
    if (!userId) { router.push('/login?next=' + encodeURIComponent(window.location.pathname)); return; }
    const supabase = getSupabaseBrowser();
    if (!supabase || busy) return;
    const current = type === 'bookmark' ? saved : liked;
    setBusy(type);
    const result = current
      ? await supabase.from('article_interactions').delete().eq('user_id', userId).eq('article_id', articleId).eq('interaction_type', type)
      : await supabase.from('article_interactions').insert({ user_id: userId, article_id: articleId, interaction_type: type });
    setBusy(null);
    if (result.error) return;
    if (type === 'bookmark') setSaved(!current);
    else setLiked(!current);
  };

  const shareArticle = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        setShareNotice('');
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNotice('文章链接已复制');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareNotice('分享失败，请复制浏览器地址栏链接');
    }
  };

  const actionClass = 'flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition';
  const idleStyle = { color: 'var(--text-secondary)', background: 'transparent' };
  const activeStyle = { color: 'var(--accent)', background: 'var(--accent-bg)' };

  return (
    <div className="mt-7 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
      <div className="grid grid-cols-4 gap-1 sm:gap-3">
        <button type="button" onClick={() => void toggle('like')} disabled={busy !== null}
          aria-pressed={liked} className={actionClass} style={liked ? activeStyle : idleStyle}>
          <ActionIcon type="like" active={liked} />
          <span>{liked ? '已喜欢' : '喜欢'}</span>
        </button>
        <button type="button" onClick={() => void toggle('bookmark')} disabled={busy !== null}
          aria-pressed={saved} className={actionClass} style={saved ? activeStyle : idleStyle}>
          <ActionIcon type="bookmark" active={saved} />
          <span>{saved ? '已收藏' : '收藏'}</span>
        </button>
        <button type="button" onClick={() => setCommentsOpen(open => !open)}
          aria-expanded={commentsOpen} aria-controls="article-comments-card"
          className={actionClass} style={commentsOpen ? activeStyle : idleStyle}>
          <ActionIcon type="comment" />
          <span>评论</span>
        </button>
        <button type="button" onClick={() => void shareArticle()} className={actionClass} style={idleStyle}>
          <ActionIcon type="share" />
          <span>转发</span>
        </button>
      </div>
      {shareNotice && <p role="status" className="mt-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{shareNotice}</p>}
      {commentsOpen && <ArticleComments articleId={articleId} />}
    </div>
  );
}
