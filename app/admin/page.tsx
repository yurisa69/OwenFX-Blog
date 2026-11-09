import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';

export default async function AdminHome() {
  const { supabase } = await requireContentEditor();
  const [
    { count: articles, error: articlesError },
    { count: software, error: softwareError },
    { count: users, error: usersError },
    { count: pending, error: commentsError },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('software').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const stats = [
    { label: '文章总数', value: articles, error: articlesError, hint: '文章内容与发布状态' },
    { label: '软件资源', value: software, error: softwareError, hint: '软件详情与下载入口' },
    { label: '注册用户', value: users, error: usersError, hint: '已建立个人资料的用户' },
    { label: '待审核评论', value: pending, error: commentsError, hint: '等待处理的用户评论' },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => (
          <div className="admin-panel" key={stat.label}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">{stat.error ? '—' : stat.value ?? 0}</p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.error ? '暂时无法读取统计' : stat.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-panel flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">开始创作</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>使用 Markdown 或富文本模式编写、预览并发布文章。</p>
          </div>
          <Link href="/admin/articles/new" className="uiverse-btn uiverse-btn-primary">写文章</Link>
        </div>
        <div className="admin-panel flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">软件资源管理</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>维护应用图标、软件介绍、官方下载和网盘入口。</p>
          </div>
          <Link href="/admin/software" className="uiverse-btn uiverse-btn-primary">管理软件</Link>
        </div>
      </section>

      <section className="admin-panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">常用功能</h2>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>保留现有工作流程</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <Link href="/admin/articles" className="admin-quick-link"><strong>文章管理</strong><span>编辑文章、草稿和发布版本</span></Link>
          <Link href="/admin/integrations" className="admin-quick-link"><strong>AI 文章导入</strong><span>管理外部写作工具的导入授权</span></Link>
          <Link href="/admin/software" className="admin-quick-link"><strong>软件管理</strong><span>维护软件详情和外部下载链接</span></Link>
          <Link href="/admin/support" className="admin-quick-link"><strong>赞赏设置</strong><span>分别配置文章与软件详情赞赏</span></Link>
          <Link href="/admin/analytics" className="admin-quick-link"><strong>流量统计</strong><span>查看软件、公众号等点击事件</span></Link>
        </div>
      </section>

      <style>{`
        .admin-quick-link{display:flex;min-height:76px;flex-direction:column;justify-content:center;gap:5px;border:1px solid var(--border-color);border-radius:11px;padding:12px;transition:border-color .18s,background .18s}
        .admin-quick-link:hover{border-color:var(--accent);background:var(--accent-bg)}
        .admin-quick-link strong{font-size:13px;font-weight:650;color:var(--text-primary)}
        .admin-quick-link span{font-size:11px;color:var(--text-tertiary)}
      `}</style>
    </div>
  );
}
