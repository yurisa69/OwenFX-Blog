import { redirect } from 'next/navigation';
import BookmarksList, { type BookmarkRecord } from '@/components/BookmarksList';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '我的收藏 — OwenFX' };

const PAGE_SIZE = 12;

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Fbookmarks');
  }

  const { data, error, count } = await supabase
    .from('article_interactions')
    .select(
      'id,created_at,article:articles!inner(id,title,slug,excerpt,published_at,category:categories!articles_category_id_fkey(name,slug))',
      { count: 'exact' },
    )
    .eq('user_id', user.id)
    .eq('interaction_type', 'bookmark')
    .eq('article.status', 'published')
    .is('article.deleted_at', null)
    .lte('article.published_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  return (
    <main className="py-8">
      <header className="mb-7">
        <p className="mb-2 text-xs font-semibold tracking-[.18em] text-[var(--accent)]">YOUR LIBRARY</p>
        <h1 className="text-2xl font-bold">我的收藏</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          收藏的文章会集中保存在这里，方便你随时继续阅读。
        </p>
      </header>
      <BookmarksList
        userId={user.id}
        initialItems={(data || []) as unknown as BookmarkRecord[]}
        initialTotal={count || 0}
        initialError={error ? '收藏列表暂时无法加载，请稍后重试。' : ''}
      />
    </main>
  );
}
