import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';

export default async function AdminArticlesPage() {
  const { supabase } = await requireContentEditor();
  const { data } = await supabase.from('articles').select('id,title,slug,status,updated_at').order('updated_at', { ascending: false }).limit(200);
  return <div className="admin-panel">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">文章管理</h2></div>
    {!data?.length ? <p className="text-sm opacity-60">暂无文章</p> : data.map(article => <div key={article.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3" style={{ borderColor: 'var(--border-color)' }}><div><p className="font-medium">{article.title}</p><p className="text-xs opacity-60">{article.slug} · {article.status} · {new Date(article.updated_at).toLocaleDateString('zh-CN')}</p></div><Link className="admin-nav-link" href={'/admin/articles/' + article.id}>编辑</Link></div>)}
  </div>;
}
