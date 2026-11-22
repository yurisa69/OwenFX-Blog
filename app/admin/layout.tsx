import Link from 'next/link';
import { cookies } from 'next/headers';
import { requireContentEditor } from '@/lib/admin-auth';
import AdminSidebar from './AdminSidebar';
import './admin.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireContentEditor();
  const cookieStore = await cookies();
  const initialTheme = cookieStore.get('admin-theme')?.value === 'light' ? 'light' : 'dark';

  return (
    <div className="admin-theme-root min-h-screen" data-admin-theme={initialTheme} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: `(() => { try { const root = document.currentScript && document.currentScript.parentElement; const match = document.cookie.match(/(?:^|; )admin-theme=(dark|light)(?:;|$)/); const cookieTheme = match ? match[1] : null; const storedTheme = localStorage.getItem("admin-theme"); const theme = cookieTheme || (storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark"); if (root) { root.setAttribute("data-admin-theme", theme); root.style.colorScheme = theme; } if (!cookieTheme && (storedTheme === "light" || storedTheme === "dark")) document.cookie = "admin-theme=" + storedTheme + "; Path=/; Max-Age=31536000; SameSite=Lax"; } catch {} })();` }} />
    <section className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
      <div className="flex min-h-[calc(100vh-120px)] flex-col gap-4 md:flex-row md:gap-6">
        <AdminSidebar initialTheme={initialTheme} />

        <main className="min-w-0 flex-1">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xs font-medium tracking-[.16em]" style={{ color: 'var(--accent)' }}>OWENFX STUDIO</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>内容管理中心 · 统一管理文章创作、软件资源与网站运营。</p>
            </div>
            <div className="admin-quick-actions flex flex-wrap gap-2">
              <Link href="/admin/articles/new" className="owenfx-btn owenfx-btn-primary admin-write-article-btn">写文章</Link>
              <Link href="/admin/integrations" className="owenfx-btn owenfx-btn-primary">AI 导入</Link>
              <Link href="/admin/software?create=1" className="owenfx-btn owenfx-btn-primary">添加软件</Link>
            </div>
          </header>
          {children}
        </main>
      </div>

      
    </section>
    </div>
  );
}
