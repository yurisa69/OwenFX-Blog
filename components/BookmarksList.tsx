'use client';

import Link from 'next/link';
import { useState } from 'react';
import ArticleActionIcon from '@/components/ArticleActionIcon';
import { getSupabaseBrowser } from '@/lib/supabase';
import { formatChineseDateLocal } from '@/lib/date';

const PAGE_SIZE = 12;

type BookmarkArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
  category: { name: string; slug: string } | null;
};

export type BookmarkRecord = {
  id: string;
  created_at: string;
  article: BookmarkArticle | BookmarkArticle[] | null;
};

function getArticle(value: BookmarkRecord['article']): BookmarkArticle | null {
  return Array.isArray(value) ? value[0] || null : value;
}

export default function BookmarksList({
  userId,
  initialItems,
  initialTotal,
  initialError = '',
}: {
  userId: string;
  initialItems: BookmarkRecord[];
  initialTotal: number;
  initialError?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState(initialError);

  const loadPage = async (nextPage: number) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Supabase 尚未配置，暂时无法加载收藏。');
      return;
    }
    if (loading) return;
    setLoading(true);
    setError('');

    const { data, error: queryError, count } = await supabase
      .from('article_interactions')
      .select(
        'id,created_at,article:articles!inner(id,title,slug,excerpt,published_at,category:categories!articles_category_id_fkey(name,slug))',
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .eq('interaction_type', 'bookmark')
      .eq('article.status', 'published')
      .is('article.deleted_at', null)
      .lte('article.published_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1);

    setLoading(false);
    if (queryError) {
      setError('收藏列表暂时无法加载，请稍后重试。');
      return;
    }

    setItems((data || []) as unknown as BookmarkRecord[]);
    setTotal(count || 0);
    setPage(nextPage);
  };

  const removeBookmark = async (id: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Supabase 尚未配置，暂时无法取消收藏。');
      return;
    }
    if (removingId) return;
    setRemovingId(id);
    setError('');

    const { error: deleteError } = await supabase
      .from('article_interactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('interaction_type', 'bookmark');

    setRemovingId(null);
    if (deleteError) {
      setError('取消收藏失败，请稍后重试。');
      return;
    }

    const nextTotal = Math.max(0, total - 1);
    const remaining = items.filter(item => item.id !== id);
    setTotal(nextTotal);

    if (remaining.length === 0 && page > 0) {
      await loadPage(page - 1);
      return;
    }
    setItems(remaining);
  };

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-glass)] px-3 py-1.5">
            <ArticleActionIcon type="bookmark" />
            文章收藏
          </span>
          <span>共 {total} 篇</span>
        </div>
        {pageCount > 1 && (
          <span className="text-xs text-[var(--text-tertiary)]">第 {page + 1} / {pageCount} 页</span>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-[var(--text-secondary)]">
          {error}
        </p>
      )}

      {items.length === 0 && error ? (
        <div className="uiverse-card flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <h2 className="text-base font-semibold">收藏列表暂时无法加载</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-tertiary)]">
            请检查网络连接后重试，现有收藏记录不会受到影响。
          </p>
          <button type="button" onClick={() => void loadPage(page)} disabled={loading} className="mt-5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50">
            {loading ? '正在加载…' : '重新加载'}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="uiverse-card flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--accent)]">
            <ArticleActionIcon type="bookmark" />
          </span>
          <h2 className="text-base font-semibold">还没有收藏文章</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-tertiary)]">
            在文章页面点击收藏，之后就可以在这里继续阅读。
          </p>
          <Link href="/articles" className="mt-5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
            浏览文章
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => {
            const article = getArticle(item.article);
            if (!article) return null;
            return (
              <article key={item.id} className="uiverse-card flex min-w-0 flex-col p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[var(--border-color)] px-2.5 py-1 text-[11px] text-[var(--text-tertiary)]">
                    {article.category?.name || '文章'}
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    收藏于 {formatChineseDateLocal(item.created_at)}
                  </span>
                </div>
                <Link href={'/articles/' + article.slug} className="group min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-base font-semibold leading-7 text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {article.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    {article.published_at ? '发布于 ' + formatChineseDateLocal(article.published_at) : '继续阅读'}
                    <span aria-hidden="true">›</span>
                  </span>
                </Link>
                <div className="mt-4 flex justify-end border-t border-[var(--border-color)] pt-3">
                  <button
                    type="button"
                    onClick={() => void removeBookmark(item.id)}
                    disabled={removingId !== null}
                    className="rounded-lg px-3 py-2 text-xs text-[var(--text-tertiary)] transition hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] disabled:cursor-wait disabled:opacity-50"
                  >
                    {removingId === item.id ? '处理中…' : '取消收藏'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="收藏列表分页" className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void loadPage(page - 1)}
            disabled={page === 0 || loading}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一页
          </button>
          <button
            type="button"
            onClick={() => void loadPage(page + 1)}
            disabled={page + 1 >= pageCount || loading}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一页
          </button>
        </nav>
      )}
    </section>
  );
}
