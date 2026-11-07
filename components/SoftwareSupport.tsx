'use client';

import { useEffect, useState } from 'react';

type Method = { enabled?: boolean; qr_url?: string; address?: string; network?: string };
type Config = { enabled: boolean; methods: Record<string, Method> };

export default function SoftwareSupport({ className = '', placement = 'software' }: { className?: string; placement?: 'article' | 'software' }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/support?placement=' + placement);
        const primary = await response.json() as Config;
        const hasEnabledMethod = (value: Config | null) =>
          !!value && Object.values(value.methods || {}).some(method => method.enabled);

        if (placement === 'article' && (!primary?.enabled || !hasEnabledMethod(primary))) {
          const fallbackResponse = await fetch('/api/support?placement=software');
          const fallback = await fallbackResponse.json() as Config;
          if (!cancelled) setConfig(fallback);
          return;
        }
        if (!cancelled) setConfig(primary);
      } catch {
        if (!cancelled) setConfig({ enabled: false, methods: {} });
      }
    };
    void loadConfig();
    return () => { cancelled = true; };
  }, [placement]);
  const methods = ['alipay', 'wechat', 'usdc', 'usdt'].filter(key => config?.methods?.[key]?.enabled);
  const labels: Record<string, string> = { alipay: '支付宝', wechat: '微信支付', usdc: 'USDC', usdt: 'USDT' };
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  if (!config?.enabled) return null;
  return <div className={className + ' flex justify-center'}>
    <button type="button" className="support-trigger" onClick={() => setOpen(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      赞赏支持
    </button>
    {open && <div className="support-modal-overlay" role="presentation" onClick={() => setOpen(false)}>
      <div className="support-modal-card" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
        <button type="button" className="support-modal-close" onClick={() => setOpen(false)} aria-label="关闭">×</button>
        <h2 className="support-modal-title">感谢您的支持</h2>
        {methods.length > 0 ? <div className="support-method-grid">{methods.map(key => {
          const method = config.methods[key] || {};
          return <div key={key} className="support-method-card"><strong>{labels[key]}</strong>
            {key === 'alipay' || key === 'wechat' ? method.qr_url ? <img src={method.qr_url} alt={labels[key] + '收款二维码'} className="mx-auto mt-2 h-36 w-36 rounded-lg object-contain" /> : <p className="mt-2 text-xs opacity-60">暂未配置二维码</p> :
              <><p className="mt-2 break-all text-xs">{method.address || '暂未配置钱包地址'}</p>{method.network && <p className="text-[11px] opacity-60">网络：{method.network}</p>}{method.address && <button type="button" onClick={() => navigator.clipboard.writeText(method.address || '')} className="mt-2 text-xs">复制地址</button>}</>}
          </div>;
        })}</div> : <p className="py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>暂未配置可用的赞赏方式，敬请期待。</p>}
      </div>
    </div>}
  </div>;
}
