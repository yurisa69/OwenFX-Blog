import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireContentEditor();
  return <section className="mx-auto max-w-6xl py-8">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.22em]" style={{ color: 'var(--accent)' }}>OWENFX STUDIO</p><h1 className="mt-1 text-2xl font-bold">内容管理</h1><p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p></div>
      <nav className="flex flex-wrap gap-2">
        <Link className="admin-nav-link" href="/admin">概览</Link><Link className="admin-nav-link" href="/admin/articles">文章</Link><Link className="admin-nav-link" href="/admin/articles/new">写文章</Link>
        <Link className="admin-nav-link" href="/admin/software">软件库</Link><Link className="admin-nav-link" href="/admin/resources">网盘资源</Link><Link className="admin-nav-link" href="/admin/support">赞赏设置</Link><Link className="admin-nav-link" href="/admin/analytics">流量统计</Link><Link className="admin-nav-link" href="/">返回网站</Link>
      </nav>
    </div>
    {children}
    <style>{`.admin-nav-link{display:inline-flex;padding:8px 12px;border:1px solid var(--border-color);border-radius:9px;color:var(--text-secondary);font-size:13px}.admin-nav-link:hover{color:var(--accent);border-color:var(--accent)}.admin-panel{border:1px solid var(--border-color);border-radius:14px;background:var(--bg-glass);padding:20px}`}</style>
  </section>;
}
