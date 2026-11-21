import { requireAdmin } from '@/lib/admin-auth';
import { formatChineseDateTime } from '@/lib/date';

function getAnalyticsSince() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

function getRelatedTitle(value: unknown): string | null {
  const related = Array.isArray(value) ? value[0] : value;
  if (!related || typeof related !== 'object' || !('title' in related)) return null;
  return typeof related.title === 'string' ? related.title : null;
}

export default async function AnalyticsPage() {
  const { supabase } = await requireAdmin();
  const since = getAnalyticsSince();
  const { data, error, count: exactCount } = await supabase.from('analytics_events')
    .select('event_type,target_key,created_at,software_id,article_id,referrer_host,article:articles!analytics_events_article_id_fkey(title),software:software!analytics_events_software_id_fkey(title)', { count: 'exact' })
    .neq('event_type', 'resource_click')
    .gte('created_at', since).order('created_at', { ascending: false }).limit(1000);
  const events = data || [];
  const sampleCount = (type: string) => events.filter(event => event.event_type === type).length;

  const articleViews = new Map<string, { title: string; count: number }>();
  const referrerCounts = new Map<string, number>();
  for (const event of events) {
    if (event.event_type === 'article_view' && event.article_id) {
      const current = articleViews.get(event.article_id);
      articleViews.set(event.article_id, {
        title: getRelatedTitle(event.article) || current?.title || '文章',
        count: (current?.count || 0) + 1,
      });
    }
    if (event.referrer_host) {
      referrerCounts.set(event.referrer_host, (referrerCounts.get(event.referrer_host) || 0) + 1);
    }
  }
  const topArticles = [...articleViews.entries()]
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const topReferrers = [...referrerCounts.entries()]
    .map(([host, count]) => ({ host, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totals = [
    ['近30天业务事件', exactCount ?? events.length],
    ['文章浏览（样本）', sampleCount('article_view')],
    ['软件下载点击（样本）', sampleCount('software_click')],
    ['公众号点击（样本）', sampleCount('wechat_click')],
    ['广告点击（样本）', sampleCount('ad_click')],
  ];

  return <div className="space-y-4">
    <p className="text-sm opacity-60">统计范围：最近30天；业务事件总数为精确计数，排行与分类计数基于最近1000条事件样本。页面访问总量、热门软件详情页及独立访客请查看 Vercel Web Analytics。</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{totals.map(([label, value]) => <div className="admin-panel" key={String(label)}><p className="text-sm opacity-70">{label}</p><p className="mt-2 text-3xl font-bold">{error ? '—' : value}</p></div>)}</div>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="admin-panel">
        <h2 className="mb-1 font-semibold">热门文章浏览</h2>
        <p className="mb-3 text-xs opacity-60">最近1000条业务事件样本，不代表完整30天排行。</p>
        {error ? <p className="text-sm text-red-500">统计读取失败。</p> : topArticles.length === 0 ? <p className="text-sm opacity-60">暂无文章浏览记录。</p> : <div className="space-y-2">{topArticles.map(item => <div key={item.id} className="flex items-center justify-between gap-3 border-t py-2 text-sm" style={{ borderColor: 'var(--border-color)' }}><span className="min-w-0 truncate">{item.title}</span><span className="shrink-0 tabular-nums opacity-70">{item.count}</span></div>)}</div>}
      </section>

      <section className="admin-panel">
        <h2 className="mb-1 font-semibold">业务事件来源域名</h2>
        <p className="mb-3 text-xs opacity-60">来自现有 referrer_host 字段，按最近1000条业务事件样本汇总。</p>
        {error ? <p className="text-sm text-red-500">统计读取失败。</p> : topReferrers.length === 0 ? <p className="text-sm opacity-60">暂无可用来源域名。</p> : <div className="space-y-2">{topReferrers.map(item => <div key={item.host} className="flex items-center justify-between gap-3 border-t py-2 text-sm" style={{ borderColor: 'var(--border-color)' }}><span className="min-w-0 truncate">{item.host}</span><span className="shrink-0 tabular-nums opacity-70">{item.count}</span></div>)}</div>}
      </section>
    </div>

    <section className="admin-panel">
      <h2 className="mb-3 font-semibold">最近业务事件</h2>
      {error ? <p className="text-sm text-red-500">统计读取失败，请检查 analytics_events 权限。</p> : events.length === 0 ? <p className="text-sm opacity-60">暂无业务事件记录。</p> : <div className="space-y-2">{events.slice(0, 40).map((event, index) => {
        const label = event.event_type === 'software_click' ? '软件下载' : event.event_type === 'wechat_click' ? '公众号' : event.event_type === 'ad_click' ? '广告' : event.event_type === 'article_view' ? '文章浏览' : event.event_type;
        const target = event.event_type === 'software_click'
          ? (event.target_key === 'official' ? '官方' : event.target_key || '网盘')
          : event.event_type === 'article_view'
            ? getRelatedTitle(event.article) || '文章'
            : event.target_key;
        return <div key={index} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 text-sm" style={{ borderColor: 'var(--border-color)' }}>
          <span className="min-w-0">{label} · {target || '—'}</span>
          <span className="text-xs opacity-60">{event.referrer_host || '未提供来源'} · {formatChineseDateTime(event.created_at)}</span>
        </div>;
      })}</div>}
    </section>
  </div>;
}
