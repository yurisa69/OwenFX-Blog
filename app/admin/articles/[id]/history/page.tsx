import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireContentEditor } from '@/lib/admin-auth';
import ArticleHistory from '@/components/admin/ArticleHistory';

export default async function ArticleHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireContentEditor();
  const { id } = await params;
  const { data: article } = await supabase.from('articles').select('id,title').eq('id', id).maybeSingle();
  if (!article) notFound();
  const { data: revisions } = await supabase.from('article_revisions')
    .select('id,title,excerpt,github_path,github_sha,content_hash,created_at')
    .eq('article_id', id).order('created_at', { ascending: false }).limit(100);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">文章版本历史</h2><p className="mt-1 text-sm opacity-65">{article.title}</p></div>
      <Link href={`/admin/articles/${id}`} className="admin-nav-link">返回编辑器</Link>
    </div>
    <ArticleHistory articleId={id} revisions={revisions || []} />
  </div>;
}
