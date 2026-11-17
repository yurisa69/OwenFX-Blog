import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireContentEditor();

  return (
    <div className="admin-theme-root min-h-screen" data-admin-theme="dark">
    <section className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
      <div className="flex min-h-[calc(100vh-120px)] flex-col gap-4 md:flex-row md:gap-6">
        <AdminSidebar />

        <main className="min-w-0 flex-1">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xs font-medium tracking-[.16em]" style={{ color: 'var(--accent)' }}>OWENFX STUDIO</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>内容管理中心 · 统一管理文章创作、软件资源与网站运营。</p>
            </div>
            <div className="admin-quick-actions flex flex-wrap gap-2">
              <Link href="/admin/articles/new" className="uiverse-btn uiverse-btn-primary admin-write-article-btn">写文章</Link>
              <Link href="/admin/integrations" className="uiverse-btn uiverse-btn-primary">AI 导入</Link>
              <Link href="/admin/software?create=1" className="uiverse-btn uiverse-btn-primary">添加软件</Link>
            </div>
          </header>
          {children}
        </main>
      </div>

      
    </section>
    </div>
  );
}
