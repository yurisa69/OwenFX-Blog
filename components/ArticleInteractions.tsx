'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';

type InteractionType = 'bookmark' | 'like';

export default function ArticleInteractions({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState<InteractionType | null>(null);

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
    if (!userId) { router.push('/login'); return; }
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

  return <div className="flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: 'var(--border-color)' }}>
    <button type="button" onClick={() => void toggle('bookmark')} disabled={busy !== null}
      aria-pressed={saved} className="rounded-xl border px-4 py-2 text-sm transition"
      style={{ borderColor: saved ? 'var(--accent)' : 'var(--border-color)', color: saved ? 'var(--accent)' : 'var(--text-secondary)', background: saved ? 'var(--accent-bg)' : 'transparent' }}>
      {saved ? '已收藏' : '收藏文章'}
    </button>
    <button type="button" onClick={() => void toggle('like')} disabled={busy !== null}
      aria-pressed={liked} className="rounded-xl border px-4 py-2 text-sm transition"
      style={{ borderColor: liked ? 'var(--accent)' : 'var(--border-color)', color: liked ? 'var(--accent)' : 'var(--text-secondary)', background: liked ? 'var(--accent-bg)' : 'transparent' }}>
      {liked ? '♥ 已喜欢' : '♡ 喜欢'}
    </button>
  </div>;
}
