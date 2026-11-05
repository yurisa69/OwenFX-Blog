import { requireContentEditor } from '@/lib/admin-auth';
import SupportSettingsManager from './support-settings-manager';

export default async function SupportPage() {
  await requireContentEditor();
  return <div className="space-y-4">
    <div><h1 className="text-xl font-semibold">赞赏设置</h1><p className="mt-1 text-sm opacity-70">文章赞赏和软件详情赞赏分别保存、分别启用，互不影响。</p></div>
    <SupportSettingsManager />
  </div>;
}
