'use client';

import { useEffect, useState } from 'react';

type Method = { enabled: boolean; qr_url: string; address: string; network: string };
type Methods = Record<'alipay' | 'wechat' | 'usdc' | 'usdt', Method>;
type Setting = { placement: 'article' | 'software'; enabled: boolean; methods: Methods };
const blank = (): Methods => ({
  alipay: { enabled: false, qr_url: '', address: '', network: '' },
  wechat: { enabled: false, qr_url: '', address: '', network: '' },
  usdc: { enabled: false, qr_url: '', address: '', network: '' },
  usdt: { enabled: false, qr_url: '', address: '', network: '' },
});
const labels = { alipay: '支付宝', wechat: '微信支付', usdc: 'USDC', usdt: 'USDT' };

export default function SupportSettingsManager() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [message, setMessage] = useState('');
  async function load() {
    const response = await fetch('/api/admin/support'); const body = await response.json();
    if (!response.ok) { setMessage(body.error || '读取失败'); return; }
    setSettings((['article', 'software'] as const).map(placement => {
      const found = (body.settings || []).find((item: Setting) => item.placement === placement);
      return { placement, enabled: found?.enabled ?? false, methods: { ...blank(), ...(found?.methods || {}) } };
    }));
  }
  useEffect(() => { void load(); }, []);
  function update(placement: Setting['placement'], fn: (setting: Setting) => Setting) {
    setSettings(current => current.map(item => item.placement === placement ? fn(item) : item));
  }
  async function save(setting: Setting) {
    setMessage('正在保存…');
    const response = await fetch('/api/admin/support', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(setting) });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? `${setting.placement === 'article' ? '文章' : '软件详情'}赞赏设置已保存` : body.error || '保存失败');
  }
  return <div className="grid gap-4 lg:grid-cols-2">
    {settings.map(setting => <section key={setting.placement} className="admin-panel space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{setting.placement === 'article' ? '文章赞赏' : '软件详情赞赏'}</h2><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={setting.enabled} onChange={event => update(setting.placement, item => ({ ...item, enabled: event.target.checked }))} />启用</label></div>
      {(Object.keys(labels) as Array<keyof Methods>).map(key => <div key={key} className="space-y-2 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={setting.methods[key].enabled} onChange={event => update(setting.placement, item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], enabled: event.target.checked } } }))} />{labels[key]}</label>
        {key === 'alipay' || key === 'wechat' ?
          <input type="url" className="w-full rounded-lg border bg-transparent p-2 text-sm" placeholder="收款二维码图片 HTTPS 地址" value={setting.methods[key].qr_url} onChange={event => update(setting.placement, item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], qr_url: event.target.value } } }))} /> :
          <><input className="w-full rounded-lg border bg-transparent p-2 text-sm" placeholder="钱包收款地址" value={setting.methods[key].address} onChange={event => update(setting.placement, item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], address: event.target.value } } }))} /><input className="w-full rounded-lg border bg-transparent p-2 text-sm" placeholder="网络，例如 Ethereum / Arbitrum / TRON" value={setting.methods[key].network} onChange={event => update(setting.placement, item => ({ ...item, methods: { ...item.methods, [key]: { ...item.methods[key], network: event.target.value } } }))} /></>}
      </div>)}
      <button className="uiverse-btn uiverse-btn-primary w-full" onClick={() => void save(setting)}>保存{setting.placement === 'article' ? '文章' : '软件详情'}赞赏配置</button>
    </section>)}
    {message && <p className="text-sm opacity-70 lg:col-span-2">{message}</p>}
  </div>;
}
