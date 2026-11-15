import Link from 'next/link';
import { requireContentEditor } from '@/lib/admin-auth';
import { formatChineseDateLocal } from '@/lib/date';
import ArticleManagementActions from '@/components/admin/ArticleManagementActions';

type ArticleStatus = 'draft' | 'published' | 'archived' | 'trashed';
type ArticleFilter = 'all' | ArticleStatus;

const statusLabels: Record<ArticleStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
  trashed: '回收站',
};

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireContentEditor();
  const params = await searchParams;
  const requestedStatus = params.status;
  const activeFilter: ArticleFilter =
    requestedStatus === 'draft' || requestedStatus === 'published' || requestedStatus === 'archived' || requestedStatus === 'trashed'
      ? requestedStatus
      : 'all';

  const [
    { count: totalCount, error: totalError },
    { count: publishedCount, error: publishedError },
    { count: archivedCount, error: archivedError },
    { count: draftCount, error: draftError },
    { count: trashCount, error: trashError },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'trashed'),
  ]);

  let articlesQuery = supabase
    .from('articles')
    .select('id,title,slug,status,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (activeFilter !== 'all') {
    articlesQuery = articlesQuery.eq('status', activeFilter);
  }

  const { data, error: articlesError } = await articlesQuery;

  const stats = [
    {
      key: 'all' as const,
      label: '文章总数',
      value: totalError ? null : totalCount,
      hint: '全部文章',
      href: '/admin/articles?status=all',
    },
    {
      key: 'published' as const,
      label: '已发布',
      value: publishedError ? null : publishedCount,
      hint: '公开展示的文章',
      href: '/admin/articles?status=published',
    },
    {
      key: 'archived' as const,
      label: '已归档',
      value: archivedError ? null : archivedCount,
      hint: '已归档的文章',
      href: '/admin/articles?status=archived',
    },
    {
      key: 'trash' as const,
      label: '回收站',
      value: trashError ? null : trashCount,
      hint: '已删除、可恢复的文章',
      href: '/admin/articles?status=trashed',
    },
    {
      key: 'draft' as const,
      label: '草稿箱',
      value: draftError ? null : draftCount,
      hint: '尚未发布的文章',
      href: '/admin/articles?status=draft',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">文章管理</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            管理文章发布、归档与回收站状态。
          </p>
        </div>
        <Link className="admin-nav-link" href="/admin/articles/new">
          新建文章
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(stat => {
          const isActive = stat.key === activeFilter;
          const cardContent = (
            <>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
              <p className="mt-3 text-3xl font-bold tabular-nums">
                {stat.value === null ? '—' : stat.value}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.hint}</p>
            </>
          );

          return stat.href ? (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className="admin-panel block transition-colors hover:border-[var(--accent)]"
              href={stat.href}
              key={stat.key}
              style={isActive ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)' } : undefined}
            >
              {cardContent}
            </Link>
          ) : (
            <div
              aria-disabled="true"
              className="admin-panel opacity-70"
              key={stat.key}
            >
              {cardContent}
            </div>
          );
        })}
      </section>

      <section className="admin-panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">
            {activeFilter === 'all' ? '全部文章' : statusLabels[activeFilter]}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            最多显示 200 篇，按最近更新时间排序
          </p>
        </div>

        {articlesError ? (
          <p className="py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            文章列表读取失败，请刷新页面后重试。
          </p>
        ) : !data?.length ? (
          <p className="py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            当前分类暂无文章
          </p>
        ) : (
          data.map((article, index) => (
            <div
              key={article.id}
              className="grid grid-cols-1 items-center gap-3 border-t py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-label={`第 ${index + 1} 篇`}
                  className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border px-2 text-xs font-semibold tabular-nums"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{article.title}</p>
                  <p className="mt-1 text-xs opacity-60">
                    {article.slug} · {statusLabels[article.status as ArticleStatus] ?? article.status} · {formatChineseDateLocal(article.updated_at)}
                  </p>
                </div>
              </div>
              <ArticleManagementActions articleId={article.id} status={article.status as ArticleStatus} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
