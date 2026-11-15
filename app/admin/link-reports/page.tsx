import { requireAdmin } from '@/lib/admin-auth';
import LinkReportsManager from './link-reports-manager';

export default async function SoftwareLinkReportsPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">网盘失效反馈</h1>
        <p className="mt-1 text-sm opacity-70">查看用户提交的下载链接问题，并记录处理结果。不会自动删除或修改现有网盘链接。</p>
      </div>
      <LinkReportsManager />
    </div>
  );
}
