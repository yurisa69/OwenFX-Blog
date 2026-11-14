import { requireAdmin } from '@/lib/admin-auth';

const plannedSignals = [
  ['安全事件', 'Cloudflare 安全规则触发的请求记录'],
  ['拦截与挑战', '被 WAF 拦截或要求验证的请求'],
  ['来源信息', '来源 IP、国家/地区、ASN'],
  ['请求详情', '请求路径、触发规则、User-Agent 与发生时间'],
];

export default async function SecurityPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">安全监控</h1>
        <p className="mt-1 text-sm opacity-70">
          集中查看网站边缘安全事件与拦截记录，帮助排查异常访问和潜在攻击。
        </p>
      </div>

      <section className="admin-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">数据源状态</h2>
          <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
            尚未接入
          </span>
        </div>
        <p className="text-sm leading-6 opacity-75">
          当前项目尚未绑定 OwenFX 的正式域名，因此没有连接任何 Cloudflare Zone，也不会读取临时域名的安全日志。
          此页面目前仅为后台入口与功能框架，不代表网站正在接受实时安全监控。
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs opacity-60">安全数据来源</p>
            <p className="mt-1 text-sm font-medium">Cloudflare Security Events（待配置）</p>
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs opacity-60">正式域名</p>
            <p className="mt-1 text-sm font-medium">待购买并接入</p>
          </div>
        </div>
      </section>

      <section className="admin-panel space-y-3">
        <div>
          <h2 className="font-semibold">计划监控内容</h2>
          <p className="mt-1 text-xs opacity-60">接入正式域名及安全数据源后显示真实记录；当前不生成模拟统计。</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {plannedSignals.map(([title, description]) => (
            <div key={title} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-1 last:pb-1">
              <span className="text-sm font-medium">{title}</span>
              <span className="text-xs opacity-60">{description}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs leading-5 opacity-55">
        说明：后续展示的数据将以 Cloudflare 实际提供的安全事件为准。安全事件采样、查询范围及日志保留期限受 Cloudflare 套餐和接口限制；不会把普通访问错误直接认定为攻击。
      </p>
    </div>
  );
}
