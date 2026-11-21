import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { formatChineseDateTime } from '@/lib/date';

type RankedSource = {
  source_type: string;
  source_name: string | null;
  referrer_host: string | null;
  views: number;
  visitors: number;
  sessions?: number;
};

type AnalyticsData = {
  summary: {
    total_views: number;
    unique_visitors: number;
    new_visitors: number;
    returning_visitors: number;
    sessions: number;
    views_per_session: number;
    article_views: number;
    software_views: number;
    other_page_views: number;
  };
  daily_trend: Array<{ date: string; views: number; visitors: number; sessions: number }>;
  top_articles: Array<{ id: string; title: string; slug: string; views: number; visitors: number }>;
  top_software: Array<{ id: string; title: string; slug: string; views: number; visitors: number }>;
  sources: RankedSource[];
  source_domains: Array<{ source_type: string; referrer_host: string; views: number; visitors: number }>;
  recent_external_sources: RankedSource[];
};

const sourceLabels: Record<string, string> = {
  direct: '直接访问', search: '搜索引擎', referral: '外部网站',
  internal: '站内跳转', campaign: '推广活动', unknown: '未知来源',
};

function getAnalyticsSince(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function numberText(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(value || 0);
}

function decimalText(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value || 0);
}

function SourceTable({ rows, emptyText }: { rows: RankedSource[]; emptyText: string }) {
  if (!rows.length) return <p className="text-sm opacity-60">{emptyText}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead><tr className="border-b text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
          <th className="py-2 pr-3 font-medium">来源类型</th>
          <th className="py-2 pr-3 font-medium">来源</th>
          <th className="py-2 pr-3 text-right font-medium">浏览量</th>
          <th className="py-2 text-right font-medium">访客数</th>
        </tr></thead>
        <tbody>
          {rows.map((source, index) => (
            <tr key={index} className="border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
              <td className="py-2.5 pr-3">{sourceLabels[source.source_type] || '其他来源'}</td>
              <td className="py-2.5 pr-3 break-all">{source.source_name || source.referrer_host || '—'}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{numberText(source.views)}</td>
              <td className="py-2.5 text-right tabular-nums">{numberText(source.visitors)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const requestedDays = Number(typeof params.period === 'string' ? params.period : '30');
  const days = [7, 30, 90, 365].includes(requestedDays) ? requestedDays : 30;
  const since = getAnalyticsSince(days);
  const { supabase } = await requireAdmin();

  const [{ data, error }, { data: recentClicks, error: clicksError }] = await Promise.all([
    supabase.rpc('get_admin_analytics', { p_since: since }),
    supabase.from('analytics_events').select('event_type,target_key,created_at,software_id')
      .in('event_type', ['software_click', 'wechat_click', 'ad_click'])
      .gte('created_at', since).order('created_at', { ascending: false }).limit(30),
  ]);

  const analytics = data as unknown as AnalyticsData | null;
  const summary = analytics?.summary;
  const trend = analytics?.daily_trend || [];
  const articles = analytics?.top_articles || [];
  const software = analytics?.top_software || [];
  const sources = analytics?.sources || [];
  const sourceDomains = analytics?.source_domains || [];
  const recentExternalSources = analytics?.recent_external_sources || [];
  const maxTrendValue = Math.max(1, ...trend.flatMap(item => [item.views || 0, item.visitors || 0]));
  const stats = [
    { label: '页面浏览量', value: summary?.total_views, hint: '首页及文章、软件详情页面' },
    { label: '独立访客', value: summary?.unique_visitors, hint: '第一方匿名标识，30 天有效期' },
    { label: '新访客', value: summary?.new_visitors, hint: '统计周期内首次观测到的访客' },
    { label: '回访访客', value: summary?.returning_visitors, hint: '此前出现过，本期再次访问' },
    { label: '访问会话', value: summary?.sessions, hint: '连续 30 分钟无活动后重新计次' },
            { label: '会话平均浏览量', value: summary?.views_per_session, hint: '已识别会话内浏览量 ÷ 会话数', decimal: true },
    { label: '文章浏览量', value: summary?.article_views, hint: '已发布文章详情页' },
    { label: '软件详情浏览量', value: summary?.software_views, hint: '已发布软件详情页' },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">网站流量统计</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>访客访问量、热门内容与访问来源</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="统计时间范围">
          {[7, 30, 90, 365].map(period => (
            <Link key={period} href={'/admin/analytics?period=' + period}
              aria-current={days === period ? 'page' : undefined}
              className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
              style={{
                borderColor: days === period ? 'var(--accent)' : 'var(--border-color)',
                background: days === period ? 'var(--accent-bg)' : 'var(--bg-glass)',
                color: 'var(--text-primary)',
              }}>
              {period === 365 ? '近一年' : '近' + period + '天'}
            </Link>
          ))}
        </div>
      </header>

      {error ? (
        <section className="admin-panel">
          <p className="text-sm text-red-500">流量统计读取失败，请检查管理员权限及数据库迁移状态。</p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(stat => (
              <div className="admin-panel" key={stat.label}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {'decimal' in stat && stat.decimal ? decimalText(stat.value) : numberText(stat.value)}
                </p>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.hint}</p>
              </div>
            ))}
          </section>

          <section className="admin-panel">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">访问趋势</h2>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>按 UTC 日期汇总页面浏览量与独立访客</p>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: 'var(--accent)' }} />PV 浏览量</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: 'var(--text-tertiary)' }} />UV 独立访客</span>
                <span style={{ color: 'var(--text-tertiary)' }}>共 {trend.length} 天</span>
              </div>
            </div>
            {trend.length === 0 ? <p className="text-sm opacity-60">暂无访问数据。</p> : (
              <div className="flex h-36 items-end gap-1 sm:gap-1.5" role="img" aria-label="每日页面浏览量和独立访客双柱状趋势图">
                {trend.map(item => {
                  const viewsHeight = item.views ? Math.max(2, Math.round((item.views / maxTrendValue) * 100)) : 0;
                  const visitorsHeight = item.visitors ? Math.max(2, Math.round((item.visitors / maxTrendValue) * 100)) : 0;
                  return (
                    <div key={item.date} className="group flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
                      title={item.date + ' · ' + item.views + ' 次浏览 · ' + item.visitors + ' 位访客 · ' + item.sessions + ' 个会话'}>
                      <div className="w-1/2 rounded-t-sm" style={{
                        height: viewsHeight + '%', minHeight: viewsHeight ? 2 : 0,
                        background: 'var(--accent)', opacity: item.views ? 0.9 : 0,
                      }} />
                      <div className="w-1/2 rounded-t-sm" style={{
                        height: visitorsHeight + '%', minHeight: visitorsHeight ? 2 : 0,
                        background: 'var(--text-tertiary)', opacity: item.visitors ? 0.85 : 0,
                      }} />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-2 flex justify-between text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              <span>{trend[0]?.date || ''}</span><span>{trend[trend.length - 1]?.date || ''}</span>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="admin-panel">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">热门文章</h2><span className="text-xs opacity-60">按浏览量排行 · Top 10</span>
              </div>
              {articles.length === 0 ? <p className="text-sm opacity-60">暂无文章浏览数据。</p> : (
                <div className="space-y-1">
                  {articles.map((article, index) => (
                    <Link key={article.id} href={'/articles/' + article.id} target="_blank"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--accent-bg)]">
                      <span className="w-5 shrink-0 text-xs tabular-nums opacity-50">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{article.title}</span>
                      <span className="shrink-0 text-xs tabular-nums opacity-65">{numberText(article.views)} 次 · {numberText(article.visitors)} 人</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-panel">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">热门软件页面</h2><span className="text-xs opacity-60">按浏览量排行 · Top 10</span>
              </div>
              {software.length === 0 ? <p className="text-sm opacity-60">暂无软件页面浏览数据。</p> : (
                <div className="space-y-1">
                  {software.map((item, index) => (
                    <Link key={item.id} href={'/software/' + encodeURIComponent(item.slug)} target="_blank"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--accent-bg)]">
                      <span className="w-5 shrink-0 text-xs tabular-nums opacity-50">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      <span className="shrink-0 text-xs tabular-nums opacity-65">{numberText(item.views)} 次 · {numberText(item.visitors)} 人</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="admin-panel">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">首次访问来源</h2><span className="text-xs opacity-60">按首次来源归因</span>
              </div>
              <SourceTable rows={sources} emptyText="暂无首次来源数据。" />
            </section>

            <section className="admin-panel">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">首次来源域名排行</h2><span className="text-xs opacity-60">搜索引擎及外部网站 · Top 15</span>
              </div>
              {!sourceDomains.length ? <p className="text-sm opacity-60">暂无外部来源域名数据。</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] text-left text-sm">
                    <thead><tr className="border-b text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                      <th className="py-2 pr-3 font-medium">域名</th>
                      <th className="py-2 pr-3 text-right font-medium">浏览量</th>
                      <th className="py-2 text-right font-medium">访客数</th>
                    </tr></thead>
                    <tbody>
                      {sourceDomains.map((item, index) => (
                        <tr key={item.source_type + ':' + item.referrer_host + ':' + index} className="border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                          <td className="py-2.5 pr-3 break-all">
                            <span>{item.referrer_host}</span>
                            <span className="ml-2 text-xs opacity-55">{sourceLabels[item.source_type] || '其他来源'}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{numberText(item.views)}</td>
                          <td className="py-2.5 text-right tabular-nums">{numberText(item.visitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="admin-panel">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">最近外部来源</h2><span className="text-xs opacity-60">访客最近一次外部进入渠道</span>
            </div>
            <SourceTable rows={recentExternalSources} emptyText="暂无最近外部来源数据。" />
          </section>
        </>
      )}

      <section className="admin-panel">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">最近业务点击</h2>
          <span className="text-xs opacity-60">最近 {Math.min(recentClicks?.length || 0, 30)} 条</span>
        </div>
        {clicksError ? <p className="text-sm text-red-500">点击记录读取失败。</p> : !recentClicks?.length ? (
          <p className="text-sm opacity-60">暂无业务点击记录。</p>
        ) : (
          <div className="space-y-2">
            {recentClicks.map((event, index) => (
              <div key={index} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 text-sm"
                style={{ borderColor: 'var(--border-color)' }}>
                <span>{event.event_type === 'software_click' ? '软件下载入口'
                  : event.event_type === 'wechat_click' ? '微信公众号入口' : '推广点击'}</span>
                <span className="text-xs opacity-60">
                  {(event.event_type === 'software_click'
                    ? event.target_key === 'official' ? '官方下载' : '网盘资源'
                    : event.target_key) || '—'} · {formatChineseDateTime(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-6" style={{ color: 'var(--text-tertiary)' }}>
        统计仅记录页面路径、来源域名、匿名访客标识和匿名会话标识；不采集 IP 地址、设备指纹或完整来源 URL。匿名访客标识有效期为 30 天，会话在连续 30 分钟无活动后重新开始。新访客表示统计系统首次观测到的匿名标识，不代表真实自然人。首次来源和最近外部来源通过 30 天第一方 Cookie 维护，从本次升级后开始累计，不回填历史来源；原有业务点击记录保留。
      </p>
    </div>
  );
}
