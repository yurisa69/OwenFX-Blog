'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Device = {
  id: string;
  name: string;
  scopes: string[];
  active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export default function IntegrationDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [name, setName] = useState('ChatGPT 文章导入');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [siteOrigin, setSiteOrigin] = useState('');

  async function load() {
    const response = await fetch('/api/admin/integrations/devices', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '授权设备读取失败');
    setDevices(result.devices || []);
  }

  useEffect(() => {
    void load().catch(error => setMessage(error instanceof Error ? error.message : '读取失败'));
  }, []);

  async function createDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setToken('');
    try {
      const response = await fetch('/api/admin/integrations/devices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '创建授权失败');
      setToken(result.token);
      await load();
      setMessage('授权创建成功。请立即复制密钥；离开此页面后无法再次查看。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建授权失败');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm('确定撤销这项授权？撤销后使用该密钥的导入请求将立即失效。')) return;
    const response = await fetch('/api/admin/integrations/devices', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || '撤销失败');
      return;
    }
    await load();
    setMessage('授权已撤销');
  }

  async function copyToken() {
    await navigator.clipboard.writeText(token);
    setMessage('授权密钥已复制');
  }

  const endpoint = siteOrigin ? `${siteOrigin}/api/integrations/v1/articles/import` : '/api/integrations/v1/articles/import';

  return <div className="space-y-5">
    <section className="admin-panel space-y-3">
      <h2 className="font-semibold">创建 ChatGPT 导入授权</h2>
      <p className="text-sm opacity-70">每个授权仅允许导入文章草稿。密钥只在创建时显示一次，可以随时撤销。</p>
      <form onSubmit={createDevice} className="flex flex-wrap gap-2">
        <input className="admin-input min-w-[220px] flex-1" value={name} onChange={event => setName(event.target.value)} maxLength={100} required aria-label="设备名称"/>
        <button className="uiverse-btn uiverse-btn-primary" disabled={busy}>{busy ? '创建中…' : '创建授权密钥'}</button>
      </form>
      {token && <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--accent)' }}>
        <p className="text-sm font-medium">新授权密钥（仅显示这一次）</p>
        <code className="block break-all text-xs">{token}</code>
        <button type="button" className="uiverse-btn uiverse-btn-ghost" onClick={() => void copyToken()}>复制密钥</button>
      </div>}
    </section>

    <section className="admin-panel space-y-3">
      <h2 className="font-semibold">导入接口</h2>
      <p className="text-xs opacity-70">将此地址配置到支持外部 API 的 ChatGPT 连接器中。请求必须使用 Bearer 授权。</p>
      <code className="block break-all rounded-lg p-3 text-xs" style={{ background: 'var(--bg-secondary)' }}>{endpoint}</code>
      <pre className="overflow-x-auto rounded-lg p-3 text-xs leading-6" style={{ background: 'var(--bg-secondary)' }}>{`POST ${endpoint}
Authorization: Bearer <你的授权密钥>
Content-Type: application/json

{
  "title": "文章标题",
  "slug": "article-slug",
  "excerpt": "文章摘要",
  "markdown": "# 文章标题\\n\\n文章正文",
  "category": "tutorials",
  "tags": ["windows", "guide"],
  "request_id": "chatgpt-unique-request-id"
}`}</pre>
      <p className="text-xs opacity-60">接口只创建草稿，不会直接发布。分类和标签必须使用 OwenFX 中已经存在的 slug。</p>
    </section>

    <section className="admin-panel space-y-3">
      <h2 className="font-semibold">已授权设备</h2>
      {!devices.length ? <p className="text-sm opacity-60">尚未创建导入授权。</p> : devices.map(device => <div key={device.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <p className="font-medium text-sm">{device.name}</p>
          <p className="text-xs opacity-60">{device.scopes.join(', ')} · {device.last_used_at ? `最近使用 ${new Date(device.last_used_at).toLocaleString('zh-CN')}` : '尚未使用'} · {device.expires_at ? `有效期至 ${new Date(device.expires_at).toLocaleDateString('zh-CN')}` : '无过期时间'}</p>
        </div>
        <button type="button" disabled={!device.active} className="admin-nav-link" onClick={() => void revoke(device.id)}>{device.active ? '撤销授权' : '已撤销'}</button>
      </div>)}
    </section>
    <p className="text-sm" aria-live="polite">{message}</p>
  </div>;
}
