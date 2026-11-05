'use client';

import { useEffect, useState } from 'react';

type LinkItem = { provider: string; share_url: string; access_code: string; label: string };
type Resource = { id: string; title: string; slug: string; summary: string; status: string; version_label: string | null; cloud_resource_links?: LinkItem[] };
const blank = (): LinkItem => ({ provider: 'quark', share_url: '', access_code: '', label: '主链接' });
const providers = [['baidu', '百度网盘'], ['quark', '夸克网盘'], ['aliyun', '阿里云盘'], ['tianyi', '天翼云盘'], ['123pan', '123云盘'], ['other', '其他网盘']];

export default function ResourceManager() {
  const [rows, setRows] = useState<Resource[]>([]);
  const [title, setTitle] = useState(''); const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState(''); const [version, setVersion] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([blank()]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function load() { const response = await fetch('/api/admin/resources'); const body = await response.json(); if (response.ok) setRows(body.resources || []); else setError(body.error || '读取失败'); }
  useEffect(() => { void load(); }, []);
  function changeLink(index: number, key: keyof LinkItem, value: string) { setLinks(old => old.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const response = await fetch('/api/admin/resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, slug, summary, version_label: version, links }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(body.error || '创建失败'); return; }
    setTitle(''); setSlug(''); setSummary(''); setVersion(''); setLinks([blank()]); await load();
  }
  async function toggle(row: Resource) {
    const response = await fetch('/api/admin/resources/' + row.id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: row.status === 'published' ? 'draft' : 'published' }) });
    const body = await response.json().catch(() => ({})); if (!response.ok) setError(body.error || '更新失败'); else await load();
  }
  async function remove(row: Resource) {
    if (!window.confirm('确定删除资源“' + row.title + '”及其分享链接吗？')) return;
    const response = await fetch('/api/admin/resources/' + row.id, { method: 'DELETE' });
    const body = await response.json().catch(() => ({})); if (!response.ok) setError(body.error || '删除失败'); else await load();
  }
  return <div className="space-y-4">
    <form onSubmit={create} className="admin-panel grid gap-3 sm:grid-cols-2">
      <h3 className="sm:col-span-2 font-semibold">添加网盘资源</h3>
      <input className="rounded-lg border bg-transparent p-2" placeholder="资源名称" value={title} onChange={e => setTitle(e.target.value)} required />
      <input className="rounded-lg border bg-transparent p-2" placeholder="英文 slug，例如 useful-tool" value={slug} onChange={e => setSlug(e.target.value)} required />
      <input className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="资源简介" value={summary} onChange={e => setSummary(e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="版本或资源标识（可选）" value={version} onChange={e => setVersion(e.target.value)} />
      <div className="space-y-3 sm:col-span-2"><div className="flex items-center justify-between"><b className="text-sm">网盘分享链接</b><button type="button" className="admin-nav-link" onClick={() => setLinks(old => old.length < 10 ? [...old, blank()] : old)}>＋ 添加备用网盘</button></div>
        {links.map((link, index) => <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
          <select className="rounded-lg border bg-transparent p-2" value={link.provider} onChange={e => changeLink(index, 'provider', e.target.value)}>{providers.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
          <input className="rounded-lg border bg-transparent p-2" placeholder="链接名称，如主链接/备用链接" value={link.label} onChange={e => changeLink(index, 'label', e.target.value)} />
          <input className="rounded-lg border bg-transparent p-2 sm:col-span-2" type="url" placeholder="HTTPS 网盘分享链接" value={link.share_url} onChange={e => changeLink(index, 'share_url', e.target.value)} required />
          <input className="rounded-lg border bg-transparent p-2" placeholder="提取码（可留空）" value={link.access_code} onChange={e => changeLink(index, 'access_code', e.target.value)} />
          {links.length > 1 && <button type="button" className="text-left text-sm text-rose-500" onClick={() => setLinks(old => old.filter((_, i) => i !== index))}>移除此链接</button>}
        </div>)}
      </div>
      <button disabled={busy} className="uiverse-btn uiverse-btn-primary sm:col-span-2">{busy ? '保存中…' : '保存为草稿'}</button>
      {error && <p className="text-sm text-rose-500 sm:col-span-2">{error}</p>}
    </form>
    <section className="admin-panel"><h3 className="mb-3 font-semibold">资源列表</h3>
      {rows.length === 0 ? <p className="text-sm opacity-60">暂无资源</p> : rows.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
        <div><p className="font-medium">{row.title}</p><p className="text-xs opacity-60">/resources/{row.slug} · {row.version_label || '未标版本'} · {row.cloud_resource_links?.length || 0} 个链接 · {row.status}</p></div>
        <div className="flex gap-2"><button type="button" className="admin-nav-link" onClick={() => void toggle(row)}>{row.status === 'published' ? '撤回' : '发布'}</button><button type="button" className="admin-nav-link" onClick={() => void remove(row)}>删除</button></div>
      </div>)}
    </section>
  </div>;
}
