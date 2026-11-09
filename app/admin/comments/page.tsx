import { requireAdmin } from '@/lib/admin-auth';
import CommentsManager from './comments-manager';

export default async function CommentsPage() {
  await requireAdmin();
  return <div className="space-y-4">
    <div>
      <h1 className="text-xl font-semibold">评论管理</h1>
      <p className="mt-1 text-sm opacity-70">管理用户评论。站长和管理员自己的评论会自动公开，不进入待审核队列。</p>
    </div>
    <CommentsManager />
  </div>;
}
