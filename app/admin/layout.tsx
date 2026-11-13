import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';

const navGroups = [
  {
    title: '工作概览',
    items: [{ label: 'Studio 首页', href: '/admin', icon: '⌂' }],
  },
  {
    title: '内容创作',
    items: [
      { label: '文章管理', href: '/admin/articles', icon: '▤' },
      { label: '同步任务', href: '/admin/article-sync', icon: '↻' },
      { label: 'AI 文章导入', href: '/admin/integrations', icon: '✧' },
    ],
  },
  {
    title: '软件资源',
    items: [
      { label: '软件库管理', href: '/admin/software', icon: '▦' },
      { label: '媒体资源库', href: null, icon: '▧' },
      { label: '分类与标签', href: null, icon: '◇' },
    ],
  },
  {
    title: '互动与运营',
    items: [
      { label: '流量统计', href: '/admin/analytics', icon: '▥' },
      { label: '评论管理', href: '/admin/comments', icon: '◌' },
      { label: '用户管理', href: null, icon: '♙' },
      { label: '赞赏设置', href: '/admin/support', icon: '⚙' },
      { label: '失效反馈', href: '/admin/link-reports', icon: '☁' },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireContentEditor();

  return (
    <section className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
      <div className="flex min-h-[calc(100vh-120px)] flex-col gap-4 md:flex-row md:gap-6">
        <aside className="admin-sidebar md:sticky md:top-24 md:flex md:w-[248px] md:shrink-0 md:flex-col md:self-start">
          <div className="admin-brand-header border-b px-5 py-5" style={{ borderColor: 'var(--border-color)' }}>
            <Link href="/admin" className="admin-brand text-xl font-bold tracking-tight md:text-2xl" style={{ color: 'var(--text-primary)' }}>
              <span className="admin-brand-owen">Owen</span><span className="admin-brand-f">F</span><span className="admin-brand-x">X</span>{' '}
              <span className="gradient-text admin-brand-studio">Studio</span>
            </Link>
          </div>

          <nav aria-label="OwenFX Studio 工作空间导航" className="flex-1 space-y-5 overflow-x-auto px-3 py-4 md:overflow-visible">
            {navGroups.map(group => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[10px] font-semibold tracking-[.18em]" style={{ color: 'var(--text-tertiary)' }}>
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-1">
                  {group.items.map(item => item.href ? (
                    <Link key={item.label} href={item.href} className="admin-sidebar-link">
                      {item.icon ? <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span> : null}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span key={item.label} aria-disabled="true" title="该模块尚未开放" className="admin-sidebar-link admin-sidebar-link-disabled">
                      <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="ml-auto text-[9px] opacity-60">规划中</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
            <Link href="/" className="admin-sidebar-link">
              <span className="gradient-text font-semibold tracking-wide">BLOG »</span>
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xs font-medium tracking-[.16em]" style={{ color: 'var(--accent)' }}>OWENFX STUDIO</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>内容管理中心 · 统一管理文章创作、软件资源与网站运营。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/articles/new" className="uiverse-btn uiverse-btn-primary">写文章</Link>
              <Link href="/admin/integrations" className="uiverse-btn uiverse-btn-primary">AI 导入</Link>
              <Link href="/admin/software" className="uiverse-btn uiverse-btn-primary">添加软件</Link>
            </div>
          </header>
          {children}
        </main>
      </div>

      <style>{`
        .admin-sidebar{overflow:visible;border:0;border-radius:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none}
        .admin-brand-header{position:relative}
        .admin-brand{display:inline-flex;align-items:baseline;white-space:nowrap;gap:0}
        .admin-brand-owen,.admin-brand-x,.admin-brand-studio{font-family:var(--font-splash),cursive;font-weight:400}.admin-brand-owen{font-size:1.55em;letter-spacing:-.055em;line-height:.8}.admin-brand-f{position:relative;top:.08em;font-family:var(--font-caramel),cursive;font-size:1.9em;font-weight:400;line-height:.65}.admin-brand-x{font-size:1em;letter-spacing:-.06em}.admin-brand-studio{margin-left:.08em;font-size:1.12em;letter-spacing:-.035em}
        @media(min-width:768px){.admin-brand-header{margin-left:-16px;margin-top:-16px;padding:0 0 20px 0}.admin-brand{transform:translate(12px,-28px) scale(1.2);transform-origin:left center}.admin-brand-owen{font-size:1.7em}.admin-brand-f{font-size:2.15em;top:.1em}.admin-brand-x{font-size:1em}.admin-brand-studio{font-size:1.22em;margin-left:.1em}}
        .admin-sidebar-link{display:flex;min-width:0;min-height:40px;align-items:center;gap:10px;border:1px solid transparent;border-radius:10px;padding:8px 10px;color:var(--text-secondary);font-size:13px;transition:background .18s,border-color .18s,color .18s}
        .admin-sidebar-link:hover{border-color:var(--border-color);background:var(--accent-bg);color:var(--text-primary)}
        .admin-sidebar-icon{display:inline-flex;width:20px;flex:0 0 20px;align-items:center;justify-content:center;font-size:15px;color:var(--text-tertiary)}
        .admin-sidebar-link-disabled{cursor:not-allowed;opacity:.58}
        .admin-sidebar-link-disabled:hover{border-color:transparent;background:transparent;color:var(--text-secondary)}
        .admin-nav-link{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border:1px solid var(--border-color);border-radius:9px;color:var(--text-secondary);font-size:13px;transition:color .18s,border-color .18s,background .18s}
        .admin-nav-link:hover{color:var(--accent);border-color:var(--accent);background:var(--accent-bg)}
        .admin-panel{border:1px solid var(--border-color);border-radius:14px;background:var(--bg-glass);padding:18px}
        @media(max-width:767px){.admin-sidebar nav{display:flex;flex-direction:column;gap:14px}.admin-sidebar nav>div{min-width:0}.admin-sidebar-link{min-height:42px;padding:8px}.admin-sidebar-link-disabled{font-size:12px}}
      `}</style>
    </section>
  );
}
