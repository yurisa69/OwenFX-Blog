import { requireContentEditor } from '@/lib/admin-auth';
import ArticleEditor from '@/components/admin/ArticleEditor';

export default async function NewArticlePage() {
  await requireContentEditor();
  return <div className="space-y-4"><h2 className="text-xl font-semibold">写文章</h2><ArticleEditor /></div>;
}
