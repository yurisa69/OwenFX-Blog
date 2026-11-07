import { requireContentEditor } from '@/lib/admin-auth';
import IntegrationDevices from '@/components/admin/IntegrationDevices';

export default async function AdminIntegrationsPage() {
  await requireContentEditor();
  return <div className="space-y-4"><div><h2 className="text-xl font-semibold">AI 文章导入</h2><p className="mt-1 text-sm opacity-65">管理 ChatGPT 等外部写作工具的文章导入授权。</p></div><IntegrationDevices /></div>;
}
