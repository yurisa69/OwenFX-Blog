import { requireAdmin } from '@/lib/admin-auth';
import SoftwareManager from './software-manager';

export default async function SoftwareAdminPage() {
  await requireContentEditor();
  return <div className="space-y-4">
    <div><h1 className="text-xl font-semibold">软件库管理</h1><p className="mt-1 text-sm opacity-70">管理软件资料、官方图标、官方下载入口与第三方网盘链接。OwenFX 不托管安装包。</p></div>
    <SoftwareManager />
  </div>;
}
