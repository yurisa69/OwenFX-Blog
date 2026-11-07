'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Method = { enabled?: boolean; qr_url?: string; address?: string; network?: string };
type Config = { enabled: boolean; methods: Record<string, Method> };

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
              <div key={key} className="support-method-card" aria-disabled={!enabled}
                style={!enabled ? { opacity: 0.48 } : undefined}>
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
                ) : (
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>暂未启用</p>
                )}
              </div>
            );
          })}
        </div>
        {enabledMethods.length === 0 && (
          <p className="mt-4 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
            目前尚未开放收款方式，敬请期待。
          </p>
        )}
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
