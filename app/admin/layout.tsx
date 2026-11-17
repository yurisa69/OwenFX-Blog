import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';
import AdminNavbar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireContentEditor();

  return (
    <section className="admin-layout-shell mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-6 md:px-6 md:pb-10">
      <AdminNavbar />

      <main className="min-w-0">
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

      <style>{`
        body:has(.admin-layout-shell) > main{padding-top:56px!important;padding-bottom:0!important}
        body:has(.admin-layout-shell) > main > div{max-width:none!important;padding-left:0!important;padding-right:0!important}
        .admin-write-article-btn{font-size:14px}
        .admin-panel{border:1px solid var(--border-color);border-radius:14px;background:var(--bg-glass);padding:18px}
        @media(max-width:767px){.admin-quick-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:8px}.admin-quick-actions a{min-width:0;justify-content:center;padding:9px 4px;white-space:nowrap;font-size:12px}}
      `}</style>
    </section>
  );
}
