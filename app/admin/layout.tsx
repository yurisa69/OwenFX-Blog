import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireContentEditor();

  return (
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

      <style>{`
        .admin-sidebar{overflow:visible;border:0;border-radius:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;color:var(--text-secondary)}
        .admin-sidebar-desktop{position:sticky;top:6rem;align-self:flex-start;width:248px;min-width:248px;flex-direction:column;transition:width .2s ease,min-width .2s ease}
        .admin-sidebar-brand-row{position:relative;display:flex;min-height:52px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding:0 4px 14px 0;margin-bottom:12px}
        .admin-brand{display:inline-flex;align-items:baseline;white-space:nowrap;gap:0}.admin-brand-owen,.admin-brand-x,.admin-brand-studio{font-family:var(--font-splash),cursive;font-weight:400}.admin-brand-owen{font-size:1.55em;letter-spacing:-.055em;line-height:.8}.admin-brand-n{font-family:var(--font-caramel),cursive;font-size:1.984em;font-weight:400;letter-spacing:-.055em;line-height:.8}.admin-brand-f{position:relative;top:.08em;font-family:var(--font-caramel),cursive;font-size:1.9em;font-weight:400;line-height:.65}.admin-brand-x{font-size:1em;letter-spacing:-.06em}.admin-brand-studio{margin-left:.08em;font-size:1.12em;letter-spacing:-.035em}
        @media(min-width:768px){.admin-sidebar-desktop{display:flex}.admin-sidebar-mobile-trigger{display:none!important}.admin-sidebar-brand-row{margin-left:-16px;margin-top:-16px;padding:0 0 14px 0}.admin-brand{transform:translate(10px,-18px) scale(1.2);transform-origin:left center}.admin-brand-owen{font-size:1.7em}.admin-brand-n{font-size:2.176em}.admin-brand-f{font-size:2.15em}.admin-brand-x{font-size:1em}.admin-brand-studio{font-size:1.22em;margin-left:.1em}}
        .admin-sidebar-nav{display:flex;flex:1;flex-direction:column;gap:10px;overflow:visible;padding:4px 0}
        .admin-sidebar-link{display:flex;min-width:0;min-height:40px;align-items:center;gap:10px;border:1px solid transparent;border-radius:10px;padding:8px 10px;color:var(--text-secondary);font-size:14px;transition:background .18s,border-color .18s,color .18s}
        .admin-sidebar-link:hover{border-color:var(--border-color);background:var(--accent-bg);color:var(--text-primary)}
        .admin-sidebar-link-active{border-color:var(--border-color);background:var(--accent-bg);color:var(--text-primary)}
        .admin-sidebar-icon{display:inline-flex;width:20px;flex:0 0 20px;align-items:center;justify-content:center;font-size:15px;color:var(--text-tertiary)}
        .admin-sidebar-group{min-width:0}
        .admin-sidebar-group-toggle{display:flex;width:100%;min-height:38px;align-items:center;gap:9px;border:1px solid transparent;border-radius:10px;padding:7px 10px;color:var(--text-tertiary);font-size:12px;font-weight:600;letter-spacing:.08em;text-align:left;transition:background .18s,border-color .18s,color .18s}
        .admin-sidebar-group-toggle:hover{border-color:var(--border-color);background:var(--accent-bg);color:var(--text-primary)}
        .admin-sidebar-group-active{color:var(--accent)}
        .admin-sidebar-group-short{display:none;width:20px;flex:0 0 20px;text-align:center;font-size:13px}
        .admin-sidebar-group-description{margin-left:2px;font-size:10px;font-weight:400;letter-spacing:0;opacity:.72}
        .admin-sidebar-chevron{margin-left:auto;font-size:17px;line-height:1}
        .admin-sidebar-group-items{display:flex;flex-direction:column;gap:2px;padding:2px 0 4px 8px}
        .admin-sidebar-planned{margin-left:auto;font-size:10px;opacity:.6}
        .admin-sidebar-link-disabled{cursor:not-allowed;opacity:.58}
        .admin-sidebar-link-disabled:hover{border-color:transparent;background:transparent;color:var(--text-secondary)}
        .admin-sidebar-collapse{display:inline-flex;width:30px;height:30px;flex:0 0 30px;align-items:center;justify-content:center;border:1px solid var(--border-color);border-radius:9px;background:var(--bg-glass);color:var(--text-secondary);font-size:20px;line-height:1;transition:background .18s,border-color .18s,color .18s}
        .admin-sidebar-collapse:hover{border-color:var(--accent);background:var(--accent-bg);color:var(--text-primary)}
        .admin-sidebar-footer{border-top:1px solid var(--border-color);padding:10px 0 0}
        .admin-sidebar-collapsed{width:76px;min-width:76px}
        .admin-sidebar-collapsed .admin-sidebar-brand-row{justify-content:center}
        .admin-sidebar-collapsed .admin-brand{display:none}
        .admin-sidebar-collapsed .admin-sidebar-group-title,.admin-sidebar-collapsed .admin-sidebar-group-description,.admin-sidebar-collapsed .admin-sidebar-chevron,.admin-sidebar-collapsed .admin-sidebar-link-label,.admin-sidebar-collapsed .admin-sidebar-planned{display:none}
        .admin-sidebar-collapsed .admin-sidebar-group-short{display:inline-block}
        .admin-sidebar-collapsed .admin-sidebar-group-toggle,.admin-sidebar-collapsed .admin-sidebar-link{justify-content:center;padding-left:8px;padding-right:8px}
        .admin-sidebar-collapsed .admin-sidebar-group-items{padding-left:0}
        .admin-sidebar-collapsed .admin-sidebar-footer .admin-sidebar-link{justify-content:center;font-size:11px}
        .admin-sidebar-mobile-trigger{display:flex;width:100%;min-height:42px;align-items:center;gap:10px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-glass);padding:9px 12px;color:var(--text-secondary);font-size:14px}
        .admin-sidebar-mobile-overlay{position:fixed;inset:0;z-index:80}
        .admin-sidebar-mobile-backdrop{position:absolute;inset:0;width:100%;height:100%;border:0;background:rgba(0,0,0,.48)}
        .admin-sidebar-mobile-panel{position:absolute;top:0;bottom:0;left:0;display:flex;width:min(58.8vw,224px);flex-direction:column;overflow-y:auto;border-right:1px solid var(--border-color);background:var(--bg-glass);padding:18px 14px;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);box-shadow:0 12px 40px rgba(0,0,0,.2)}
        .admin-sidebar-mobile-panel .admin-sidebar-brand-row{margin:0 0 14px;padding:0 0 14px}
        .admin-sidebar-mobile-panel .admin-brand{transform:none}
        .admin-sidebar-mobile-panel .admin-sidebar-nav{gap:8px}
        .admin-sidebar-mobile-panel .admin-sidebar-group-items{padding-left:8px}
        .admin-sidebar-mobile-panel .admin-sidebar-footer{margin-top:auto}
        .admin-write-article-btn{font-size:14px}
        .admin-nav-link{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border:1px solid var(--border-color);border-radius:9px;color:var(--text-secondary);font-size:13px;transition:color .18s,border-color .18s,background .18s}
        .admin-nav-link:hover{color:var(--accent);border-color:var(--accent);background:var(--accent-bg)}
        .admin-panel{border:1px solid var(--border-color);border-radius:14px;background:var(--bg-glass);padding:18px}
        @media(max-width:767px){.admin-quick-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:8px}.admin-quick-actions a{min-width:0;justify-content:center;padding:9px 4px;white-space:nowrap;font-size:12px}}
      `}</style>
    </section>
  );
}
