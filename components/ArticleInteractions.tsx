'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import ArticleComments from '@/components/ArticleComments';
import ArticleActionIcon from '@/components/ArticleActionIcon';

type InteractionType = 'bookmark' | 'like';

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
          <ArticleActionIcon type="like" active={liked} />
          <span>{liked ? '已喜欢' : '喜欢'}</span>
        </button>
        <button type="button" onClick={() => void toggle('bookmark')} disabled={busy !== null}
          aria-pressed={saved} className={actionClass} style={saved ? activeStyle : idleStyle}>
          <ArticleActionIcon type="bookmark" active={saved} />
          <span>{saved ? '已收藏' : '收藏'}</span>
        </button>
        <button type="button" onClick={() => setCommentsOpen(open => !open)}
          aria-expanded={commentsOpen} aria-controls="article-comments-card"
          className={actionClass} style={commentsOpen ? activeStyle : idleStyle}>
          <ArticleActionIcon type="comment" />
          <span>评论</span>
        </button>
        <button type="button" onClick={() => void shareArticle()} className={actionClass} style={idleStyle}>
          <ArticleActionIcon type="share" />
          <span>转发</span>
        </button>
      </div>
      {shareNotice && <p role="status" className="mt-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{shareNotice}</p>}
      {commentsOpen && <ArticleComments articleId={articleId} />}
    </div>
  );
}
