'use client';

import { useEffect, useState } from 'react';
import R2ImageUploader from '@/components/admin/R2ImageUploader';

type Method = { enabled: boolean; qr_url: string; address: string; network: string };
type Methods = Record<'alipay' | 'wechat' | 'usdc' | 'usdt', Method>;
type Placement = 'article' | 'software';
type Setting = { placement: Placement; enabled: boolean; methods: Methods };
const blank = (): Methods => ({
  alipay: { enabled: false, qr_url: '', address: '', network: '' },
  wechat: { enabled: false, qr_url: '', address: '', network: '' },
  usdc: { enabled: false, qr_url: '', address: '', network: '' },
  usdt: { enabled: false, qr_url: '', address: '', network: '' },
});
const labels = { alipay: '支付宝', wechat: '微信支付', usdc: 'USDC', usdt: 'USDT' };

export default function SupportSettingsManager({ placement }: { placement: Placement }) {
  const [setting, setSetting] = useState<Setting>({
    placement,
    enabled: false,
    methods: blank(),
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/api/admin/support');
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || '读取失败');
        const found = (body.settings || []).find((item: Setting) => item.placement === placement);
        if (!cancelled) {
          setSetting({
            placement,
            enabled: found?.enabled ?? false,
            methods: { ...blank(), ...(found?.methods || {}) },
          });
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : '读取失败');
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [placement]);

  function update(fn: (current: Setting) => Setting) {
    setSetting(current => fn(current));
  }

  async function save() {
    setMessage('正在保存…');
    const response = await fetch('/api/admin/support', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(setting),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? `${placement === 'article' ? '文章' : '软件'}赞赏设置已保存` : body.error || '保存失败');
  }

  const title = placement === 'article' ? '文章赞赏' : '软件赞赏';

  return (
    <div className="max-w-3xl">
      <section className="admin-panel space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={setting.enabled} onChange={event => update(item => ({ ...item, enabled: event.target.checked }))} />
            启用
          </label>
        </div>
        {(Object.keys(labels) as Array<keyof Methods>).map(key => (
          <div key={key} className="space-y-2 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={setting.methods[key].enabled}
                onChange={event => update(item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], enabled: event.target.checked } } }))}
              />
              {labels[key]}
            </label>
            {key === 'alipay' || key === 'wechat' ? (
              <R2ImageUploader
                kind="image"
                label={labels[key] + '收款二维码'}
                alt={labels[key] + '收款二维码'}
                value={setting.methods[key].qr_url}
                onChange={value => update(item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], qr_url: value } } }))}
              />
            ) : (
              <>
                <input
                  className="w-full rounded-lg border bg-transparent p-2 text-sm"
                  placeholder="钱包收款地址"
                  value={setting.methods[key].address}
                  onChange={event => update(item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], address: event.target.value } } }))}
                />
                <input
                  className="w-full rounded-lg border bg-transparent p-2 text-sm"
                  placeholder="网络，例如 Ethereum / Arbitrum / TRON"
                  value={setting.methods[key].network}
                  onChange={event => update(item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], network: event.target.value } } }))}
                />
              </>
            )}
          </div>
        ))}
        <button className="owenfx-btn owenfx-btn-primary w-full" onClick={() => void save()}>
          保存{title}配置
        </button>
        {message && <p className="text-sm opacity-70" role="status">{message}</p>}
      </section>
    </div>
  );
}
