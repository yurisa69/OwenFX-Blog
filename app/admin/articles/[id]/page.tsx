import { notFound } from 'next/navigation';
import { requireContentEditor } from '@/lib/admin-auth';
import { readMarkdownFile } from '@/lib/github-articles';
import ArticleEditor from '@/components/admin/ArticleEditor';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireContentEditor();
  const { id } = await params;
  const { data } = await supabase.from('articles')
    .select('id,title,slug,excerpt,status,github_path,github_sha,content_hash')
    .eq('id', id).maybeSingle();
  if (!data) notFound();

  let content = '';
  if (data.github_path) {
    const file = await readMarkdownFile(data.github_path);
    if (!file) throw new Error('GitHub 中找不到这篇文章的 Markdown 文件，请检查 GitHub 仓库配置。');
    content = file.content;
  }

  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">编辑文章</h2><a className="admin-nav-link" href={`/admin/articles/${id}/history`}>版本历史</a></div><ArticleEditor initial={{ ...data, content_markdown: content }} /></div>;
}
