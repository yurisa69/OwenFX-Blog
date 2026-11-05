import { notFound } from 'next/navigation';
import { requireContentEditor } from '@/lib/admin-auth';
import ArticleEditor from '@/components/admin/ArticleEditor';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireContentEditor();
  const { id } = await params;
  const { data } = await supabase.from('articles').select('id,title,slug,excerpt,content_markdown,status').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div className="space-y-4"><h2 className="text-xl font-semibold">编辑文章</h2><ArticleEditor initial={data} /></div>;
}
