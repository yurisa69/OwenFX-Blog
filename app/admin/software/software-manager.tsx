'use client';

import { useEffect, useState } from 'react';

type LinkItem = { provider: string; label: string; share_url: string; access_code: string };
type SoftwareRow = { id: string; title: string; slug: string; description: string | null; developer: string | null; version: string | null; platform: string | null; image_url: string | null; official_download_url: string | null; introduction_markdown: string | null; status: string; featured: boolean; software_download_links?: LinkItem[] };

const emptyLink = (): LinkItem => ({ provider: 'quark', label: '夸克网盘', share_url: '', access_code: '' });
const providers = [{ value: 'baidu', label: '百度网盘' }, { value: 'quark', label: '夸克网盘' }, { value: 'aliyun', label: '阿里云盘' }, { value: 'tianyi', label: '天翼云盘' }, { value: '123pan', label: '123云盘' }, { value: 'other', label: '其他' }];

export default function SoftwareManager() {
  const [rows, setRows] = useState<SoftwareRow[]>([]);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({ title: '', slug: '', description: '', developer: '', version: '', platform: 'Windows', image_url: '', official_download_url: '', introduction_markdown: '', featured: false });
  const [links, setLinks] = useState<LinkItem[]>([emptyLink()]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch('/api/admin/software');
    const body = await response.json();
    if (response.ok) setRows(body.software || []); else setError(body.error || '读取软件列表失败');
  }
  useEffect(() => { void load(); }, []);

  function change<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }
  function reset() {
    setEditId('');
    setForm({ title: '', slug: '', description: '', developer: '', version: '', platform: 'Windows', image_url: '', official_download_url: '', introduction_markdown: '', featured: false });
    setLinks([emptyLink()]);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const payload = { ...form, links: links.filter(link => link.share_url.trim()) };
    const response = await fetch(editId ? '/api/admin/software/' + editId : '/api/admin/software', {
      method: editId ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error || '保存失败'); setBusy(false); return; }
    reset(); await load(); setBusy(false);
  }
  function edit(row: SoftwareRow) {
    setEditId(row.id);
    setForm({ title: row.title, slug: row.slug, description: row.description || '', developer: row.developer || '', version: row.version || '', platform: row.platform || '', image_url: row.image_url || '', official_download_url: row.official_download_url || '', introduction_markdown: row.introduction_markdown || '', featured: row.featured });
    setLinks(row.software_download_links?.length ? row.software_download_links : [emptyLink()]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function toggle(row: SoftwareRow) {
    const status = row.status === 'published' ? 'draft' : 'published';
    const response = await fetch('/api/admin/software/' + row.id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || '状态更新失败'); else await load();
  }

  return <div className="space-y-5">
    <form onSubmit={save} className="admin-panel grid gap-3 sm:grid-cols-2">
      <h2 className="sm:col-span-2 font-semibold">{editId ? '编辑软件' : '添加软件'}</h2>
      <input required className="rounded-lg border bg-transparent p-2" placeholder="软件名称" value={form.title} onChange={e => change('title', e.target.value)} />
      <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="rounded-lg border bg-transparent p-2" placeholder="英文 slug，例如 vscode" value={form.slug} onChange={e => change('slug', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="一句话介绍" value={form.description} onChange={e => change('description', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2" placeholder="开发者 / 厂商" value={form.developer} onChange={e => change('developer', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2" placeholder="版本号" value={form.version} onChange={e => change('version', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2" placeholder="平台，例如 Windows / Android" value={form.platform} onChange={e => change('platform', e.target.value)} />
      <input type="url" className="rounded-lg border bg-transparent p-2" placeholder="官方图标 HTTPS 图片地址" value={form.image_url} onChange={e => change('image_url', e.target.value)} />
      <input type="url" className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="官方官方下载页面 HTTPS 地址" value={form.official_download_url} onChange={e => change('official_download_url', e.target.value)} />
      <textarea rows={6} className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="软件详细介绍（支持 Markdown 文本）" value={form.introduction_markdown} onChange={e => change('introduction_markdown', e.target.value)} />
      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-center justify-between"><strong className="text-sm">网盘下载链接</strong><button type="button" className="admin-nav-link" onClick={() => setLinks(items => [...items, emptyLink()])}>添加链接</button></div>
        {links.map((link, index) => <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          <select className="rounded-lg border bg-transparent p-2" value={link.provider} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, provider: e.target.value } : item))}>{providers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
          <input className="rounded-lg border bg-transparent p-2" placeholder="链接显示名称" value={link.label} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} />
          <input type="url" className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="HTTPS 分享链接" value={link.share_url} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, share_url: e.target.value } : item))} />
          <input className="rounded-lg border bg-transparent p-2" placeholder="提取码（可选）" value={link.access_code} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, access_code: e.target.value } : item))} />
          {links.length > 1 && <button type="button" className="text-left text-sm text-red-500" onClick={() => setLinks(items => items.filter((_, i) => i !== index))}>删除此链接</button>}
        </div>)}
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.featured} onChange={e => change('featured', e.target.checked)} />设为首页精选软件</label>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy} className="uiverse-btn uiverse-btn-primary">{busy ? '保存中…' : editId ? '保存修改' : '保存软件草稿'}</button>{editId && <button type="button" className="uiverse-btn uiverse-btn-ghost" onClick={reset}>取消编辑</button>}</div>
      {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
    </form>
    <section className="admin-panel">
      <h2 className="mb-3 font-semibold">软件列表</h2>
      {rows.length === 0 ? <p className="text-sm opacity-70">暂无软件条目</p> : rows.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
        <div className="flex items-center gap-3">{row.image_url ? <img src={row.image_url} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <div className="h-10 w-10 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />}<div><p className="text-sm font-semibold">{row.title}</p><p className="text-xs opacity-60">{row.slug} · {row.status}{row.featured ? ' · 首页精选' : ''}</p></div></div>
        <div className="flex gap-2"><button type="button" className="admin-nav-link" onClick={() => edit(row)}>编辑</button><button type="button" className="admin-nav-link" onClick={() => void toggle(row)}>{row.status === 'published' ? '撤回为草稿' : '发布'}</button></div>
      </div>)}
    </section>
  </div>;
}
