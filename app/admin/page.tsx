import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';

export default async function AdminHome() {
  const { supabase } = await requireContentEditor();
  const [{ count: total }, { count: drafts }, { count: published }, { count: pending }, { count: software }] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('software').select('*', { count: 'exact', head: true }),
  ]);
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['文章总数', total], ['已发布', published], ['草稿', drafts], ['待审核评论', pending], ['软件条目', software]].map(([label, value]) => <div className="admin-panel" key={String(label)}><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p><p className="mt-2 text-3xl font-bold">{value ?? '—'}</p></div>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="admin-panel flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">开始创作</h2><p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>使用 Markdown 或富文本模式编写并发布文章。</p></div><Link href="/admin/articles/new" className="uiverse-btn uiverse-btn-primary">新建文章</Link></div>
      <div className="admin-panel flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">管理软件库</h2><p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>维护应用图标、介绍、官方入口和网盘链接。</p></div><Link href="/admin/software" className="uiverse-btn uiverse-btn-primary">软件管理</Link></div>
    </div>
    <div className="admin-panel"><h2 className="font-semibold">功能说明</h2><ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2" style={{ color: 'var(--text-secondary)' }}><li>✓ 文章创建、编辑和发布</li><li>✓ 软件库独立管理</li><li>✓ 文章内插入软件卡片</li><li>✓ 软件详情官方下载和网盘入口</li><li>✓ 文章与软件赞赏配置分离</li><li>✓ 下载点击统计</li><li>✓ 安装包不由本站托管</li></ul></div>
  </div>;
}
