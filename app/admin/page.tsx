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
    { label: '文章总数', value: articles, error: articlesError, hint: '文章内容与发布状态', href: '/admin/articles' },
    { label: '软件资源', value: software, error: softwareError, hint: '软件详情与下载入口', href: '/admin/software' },
    { label: '注册用户', value: users, error: usersError, hint: '已建立个人资料的用户', href: null },
    { label: '待审核评论', value: pending, error: commentsError, hint: '等待处理的用户评论', href: '/admin/comments' },
  ];

  const workspaces = [
    {
      title: '文章创作',
      description: '使用 Markdown 或富文本编写、预览、管理草稿并发布文章。',
      links: [
        { label: '文章管理', href: '/admin/articles', detail: '编辑文章、草稿和发布版本' },
        { label: 'AI 文章导入', href: '/admin/integrations', detail: '管理外部写作工具的导入授权' },
      ],
    },
    {
      title: '软件资源',
      description: '维护应用图标、软件介绍、官方下载和国内网盘入口。',
      links: [
        { label: '软件管理', href: '/admin/software', detail: '添加、编辑软件资料和下载链接' },
      ],
    },
    {
      title: '互动管理',
      description: '集中处理网站用户评论与内容互动。',
      links: [
        { label: '评论审核', href: '/admin/comments', detail: '查看并处理待审核的用户评论' },
      ],
    },
    {
      title: '网站运营',
      description: '查看网站流量数据，分别维护文章和软件详情的赞赏配置。',
      links: [
        { label: '流量统计', href: '/admin/analytics', detail: '查看软件、公众号等点击事件' },
        { label: '赞赏设置', href: '/admin/support', detail: '分别配置文章与软件详情赞赏' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => {
          const content = (
            <>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
              <p className="mt-3 text-3xl font-bold tabular-nums">{stat.error ? '—' : stat.value ?? 0}</p>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.error ? '暂时无法读取统计' : stat.hint}</p>
            </>
          );
          return stat.href ? (
            <Link className="admin-panel block transition-colors hover:border-[var(--accent)]" href={stat.href} key={stat.label}>{content}</Link>
          ) : (
            <div className="admin-panel" key={stat.label}>{content}</div>
          );
        })}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">工作空间</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>从一个入口完成内容创作、软件资源维护和网站运营。</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {workspaces.map(workspace => (
            <section className="admin-panel" key={workspace.title}>
              <h3 className="text-base font-semibold">{workspace.title}</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{workspace.description}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {workspace.links.map(item => (
                  <Link className="admin-quick-link" href={item.href} key={item.href}>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <style>{`
        .admin-quick-link{display:flex;min-height:68px;flex-direction:column;justify-content:center;gap:5px;border:1px solid var(--border-color);border-radius:11px;padding:12px;transition:border-color .18s,background .18s}
        .admin-quick-link:hover{border-color:var(--accent);background:var(--accent-bg)}
        .admin-quick-link strong{font-size:13px;font-weight:650;color:var(--text-primary)}
        .admin-quick-link span{font-size:11px;color:var(--text-tertiary)}
      `}</style>
    </div>
  );
}
