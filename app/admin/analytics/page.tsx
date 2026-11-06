import { requireAdmin } from '@/lib/admin-auth';

export default async function AnalyticsPage() {
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('analytics_events')
    .select('event_type,target_key,created_at,software_id,resource_id')
    .gte('created_at', since).order('created_at', { ascending: false }).limit(1000);
  const events = data || [];
  const count = (type: string) => events.filter(event => event.event_type === type).length;
  const totals = [
    ['近30天总点击', events.length],
    ['软件下载点击', count('software_click')],
    ['网盘资源点击', count('resource_click')],
    ['公众号点击', count('wechat_click')],
    ['广告点击', count('ad_click')],
  ];
  return <div className="space-y-4">
    <p className="text-sm opacity-60">统计范围：最近30天；当前展示最近1000条事件记录。</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{totals.map(([label, value]) => <div className="admin-panel" key={String(label)}><p className="text-sm opacity-70">{label}</p><p className="mt-2 text-3xl font-bold">{error ? '—' : value}</p></div>)}</div>
    <section className="admin-panel"><h2 className="mb-3 font-semibold">最近点击记录</h2>{error ? <p className="text-sm text-red-500">统计读取失败，请检查 analytics_events 权限。</p> : events.length === 0 ? <p className="text-sm opacity-60">暂无点击记录。</p> : <div className="space-y-2">{events.slice(0, 40).map((event, index) => <div key={index} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 text-sm" style={{ borderColor: 'var(--border-color)' }}><span>{event.event_type === 'software_click' ? '软件下载' : event.event_type === 'resource_click' ? '网盘资源' : event.event_type === 'wechat_click' ? '公众号' : event.event_type === 'ad_click' ? '广告' : event.event_type}</span><span className="text-xs opacity-60">{event.target_key || '—'} · {new Date(event.created_at).toLocaleString('zh-CN')}</span></div>)}</div>}</section>
  </div>;
}
