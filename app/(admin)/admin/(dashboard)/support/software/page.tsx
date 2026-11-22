import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import SupportSettingsManager from '../support-settings-manager';

export default async function SoftwareSupportSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/support" className="text-sm opacity-70 hover:opacity-100">赞赏设置</Link>
        <span className="text-sm opacity-40">/</span>
        <h1 className="text-xl font-semibold">软件赞赏</h1>
      </div>
      <p className="text-sm opacity-70">配置软件页面使用的赞赏方式，设置仅作用于软件。</p>
      <SupportSettingsManager placement="software" />
    </div>
  );
}
