import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';

const navGroups = [
  {
    title: '工作台',
    items: [{ label: '工作概览', href: '/admin', icon: '⌂' }],
  },
  {
    title: '内容创作',
    items: [
      { label: '文章管理', href: '/admin/articles', icon: '▤' },
      { label: 'AI 文章导入', href: '/admin/integrations', icon: '✧' },
    ],
  },
  {
    title: '资源管理',
    items: [
      { label: '软件库管理', href: '/admin/software', icon: '▦' },
      { label: '媒体资源库', href: null, icon: '▧', pending: true },
      { label: '分类与标签', href: null, icon: '◇', pending: true },
    ],
  },
  {
    title: '互动与运营',
    items: [
      { label: '评论审核', href: '/admin/comments', icon: '◌' },
      { label: '数据统计', href: '/admin/analytics', icon: '▥' },
      { label: '赞赏与设置', href: '/admin/support', icon: '⚙' },
      { label: '用户管理', href: null, icon: '♙', pending: true },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireContentEditor();

  return (
    <section className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
      <div className="flex min-h-[calc(100vh-120px)] flex-col gap-4 md:flex-row md:gap-6">
        <aside className="admin-sidebar md:sticky md:top-24 md:flex md:w-[248px] md:shrink-0 md:flex-col md:self-start">
          <div className="border-b px-5 py-5" style={{ borderColor: 'var(--border-color)' }}>
            <Link href="/admin" className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              OwenFX <span className="gradient-text">Studio</span>
            </Link>
            <p className="mt-2 truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
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
                      <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
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
              <span className="admin-sidebar-icon" aria-hidden="true">↗</span>
              <span>返回网站</span>
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[.16em]" style={{ color: 'var(--accent)' }}>STUDIO WORKSPACE</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">OwenFX Studio</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>统一管理文章创作、软件资源与网站运营。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/articles/new" className="uiverse-btn uiverse-btn-primary">写文章</Link>
              <Link href="/admin/software" className="admin-nav-link">添加软件</Link>
            </div>
          </header>
          {children}
        </main>
      </div>

      <style>{`
        .admin-sidebar{overflow:visible;border:0;border-radius:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none}
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
