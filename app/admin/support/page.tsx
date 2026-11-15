import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';

const supportTypes = [
  {
    title: '文章赞赏',
    description: '设置文章页面底部展示的赞赏方式、收款二维码和钱包地址。',
    href: '/admin/support/article',
  },
  {
    title: '软件赞赏',
    description: '设置软件页面展示的赞赏方式、收款二维码和钱包地址。',
    href: '/admin/support/software',
  },
];

export default async function SupportPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">赞赏设置</h1>
        <p className="mt-1 text-sm opacity-70">选择要配置的赞赏类型，两类配置独立保存、独立启用。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {supportTypes.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="admin-panel group block space-y-3 transition-colors hover:border-[var(--accent)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{item.title}</h2>
            </div>
            <p className="text-sm opacity-70">{item.description}</p>
            <p className="text-xs" style={{ color: 'var(--accent)' }}>进入设置</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
