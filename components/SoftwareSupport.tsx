'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Method = { enabled?: boolean; qr_url?: string; address?: string; network?: string };
type Config = { enabled: boolean; methods: Record<string, Method> };

type SupportTone = 'alipay' | 'wechat' | 'usdc' | 'usdt';

function SupportIcon({ type }: { type: SupportTone }) {
  if (type === 'alipay') return <svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="alipay-circle-clip"><circle cx="12" cy="12" r="12" /></clipPath></defs><path clipPath="url(#alipay-circle-clip)" fill="#1677FF" d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809" /></svg>;
  if (type === 'wechat') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#07C160" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" /></svg>;
  if (type === 'usdc') return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#2775ca" /><path fill="#fff" d="M18.7 34.7a14.2 14.2 0 0 1 0-21.4l1.8 2.4a11.2 11.2 0 0 0 0 16.6l-1.8 2.4Zm10.6 0-1.8-2.4a11.2 11.2 0 0 0 0-16.6l1.8-2.4a14.2 14.2 0 0 1 0 21.4ZM25.3 35h-2.6v-3c-2.4-.3-4.5-1.3-6.1-2.8l2-2.9a9 9 0 0 0 5.5 2.2c1.8 0 2.8-.7 2.8-1.9 0-3-9.6-1.4-9.6-7.5 0-2.8 2.1-4.9 5.4-5.4V11h2.6v2.7a10 10 0 0 1 5.2 2.2l-1.9 2.9a8 8 0 0 0-4.9-1.7c-1.5 0-2.4.6-2.4 1.7 0 2.8 9.6 1.2 9.6 7.4 0 2.8-2 5.1-5.6 5.7V35Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#50AF95" d="M18.7538 10.5176c0 .6251-2.2379 1.1483-5.2381 1.2812l.0028.0007c-.0848.0064-.5233.0325-1.5012.0325-.7778 0-1.33-.0233-1.5237-.0325-3.0059-.1322-5.2495-.6555-5.2495-1.2819s2.2436-1.149 5.2495-1.2834v2.0442c.1965.0142.7594.0474 1.5372.0474.9334 0 1.4008-.0389 1.4849-.0466V9.2356c2.9994.1337 5.2381.657 5.2381 1.282zm5.19.5466L12.1248 22.389a.1803.1803 0 0 1-.2496 0L.0562 11.0635a.1781.1781 0 0 1-.0382-.2079l4.3762-9.1921a.1767.1767 0 0 1 .1626-.1026h14.8878a.1768.1768 0 0 1 .1612.1032l4.3762 9.1922a.1782.1782 0 0 1-.0382.2079zm-4.478-.4038c0-.8068-2.5515-1.4799-5.9473-1.6369V7.195h4.186V4.4055H6.3076V7.195h4.1852v1.8286c-3.4018.1562-5.9601.83-5.9601 1.6376 0 .8075 2.5583 1.4806 5.9601 1.6376v5.8618h3.025v-5.8639c3.394-.1563 5.948-.8295 5.948-1.6363z" /></svg>;
}

export default function SoftwareSupport({ className = '', placement = 'software' }: { className?: string; placement?: 'article' | 'software' }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/support?placement=' + placement, { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load support settings');
        const value = await response.json() as Config;
        if (!cancelled) setConfig(value);
      } catch {
        if (!cancelled) setConfig({ enabled: false, methods: {} });
      }
    };
    void loadConfig();
    return () => { cancelled = true; };
  }, [placement]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const methods = ['alipay', 'wechat', 'usdc', 'usdt'];
  const labels: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    usdc: 'USDC',
    usdt: 'USDT',
  };
  const enabledMethods = methods.filter(key => config?.methods?.[key]?.enabled);
  const dialog = open && typeof document !== 'undefined' ? createPortal(
    <div className="support-modal-overlay" role="presentation" onClick={() => setOpen(false)}>
      <div className="support-modal-card" role="dialog" aria-modal="true" aria-labelledby="support-modal-title"
        onClick={event => event.stopPropagation()}>
        <button type="button" className="support-modal-close" onClick={() => setOpen(false)} aria-label="关闭赞赏支持">×</button>
        <h2 id="support-modal-title" className="support-modal-title">感谢您的支持</h2>
        <div className="support-method-grid">
          {methods.map(key => {
            const method = config?.methods?.[key] || {};
            const enabled = !!method.enabled;
            return (
              <div key={key} className="support-method-card" aria-disabled={!enabled}>
                <span className={"support-method-icon support-method-icon-" + key}><SupportIcon type={key as SupportTone} /></span>
                <strong className="support-method-label">{labels[key]}</strong>
                {enabled ? (
                  key === 'alipay' || key === 'wechat' ? (
                    method.qr_url ? <img src={method.qr_url} alt={labels[key] + '收款二维码'}
                      className="mx-auto mt-2 h-36 w-36 rounded-lg object-contain" /> :
                      <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>尚未配置收款二维码</p>
                  ) : (
                    <>
                      <p className="mt-2 break-all text-center text-xs">{method.address || '尚未配置钱包地址'}</p>
                      {method.network && <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>网络：{method.network}</p>}
                      {method.address && <button type="button" onClick={() => {
                        void navigator.clipboard.writeText(method.address || '');
                      }} className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>复制地址</button>}
                    </>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          每一份支持，都是我们持续分享与更新的动力。感谢有你！
        </p>
      </div>
    </div>,
    document.body
  ) : null;

  if (!config?.enabled) return null;
  return (
    <div className={className + ' flex justify-center'}>
      <button type="button" className="support-trigger" onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        赞赏支持
      </button>
      {dialog}
    </div>
  );
}
