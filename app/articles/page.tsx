import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '文章 — OwenFX' };
export default async function ArticlesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('articles').select('id,title,slug,excerpt,published_at,created_at')
    .eq('status', 'published').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(100);
  return <main className="py-8"><h1 className="mb-2 text-2xl font-bold">文章</h1><p className="mb-6 text-sm opacity-70">软件介绍、使用教程与技术分享。</p>
    {!data?.length ? <div className="uiverse-card p-6 text-sm opacity-70">文章正在整理中，敬请期待。</div> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map(article => <Link key={article.id} href={'/articles/' + article.id} className="uiverse-card p-5"><h2 className="font-semibold">{article.title}</h2><p className="mt-3 line-clamp-3 text-sm opacity-70">{article.excerpt}</p><p className="mt-4 text-xs opacity-50">{new Date(article.published_at || article.created_at).toLocaleDateString('zh-CN')}</p></Link>)}</div>}
  </main>;
}
