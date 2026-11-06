import { requireAdmin } from '@/lib/admin-auth';
import ResourceManager from './resource-manager';

export default async function ResourcesAdminPage() {
  await requireAdmin();
  return <div className="space-y-4"><div><h2 className="text-xl font-semibold">网盘资源库</h2><p className="mt-1 text-sm opacity-70">只管理分享链接和提取码，不上传或托管安装包。</p></div><ResourceManager /></div>;
}
