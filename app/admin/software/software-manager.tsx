'use client';

import { useEffect, useState } from 'react';
import R2ImageUploader from '@/components/admin/R2ImageUploader';

type LinkItem = { provider: string; label: string; share_url: string; access_code: string };
type SoftwareRow = { id: string; title: string; slug: string; description: string | null; developer: string | null; version: string | null; platform: string | null; file_size: string | null; image_url: string | null; official_download_url: string | null; introduction_markdown: string | null; screenshots?: string[] | null; status: string; archive_previous_status?: string | null; trash_previous_status?: string | null; deleted_at?: string | null; software_download_links?: LinkItem[] };

const emptyLink = (): LinkItem => ({ provider: '', label: '', share_url: '', access_code: '' });
const providers = [{ value: 'uc', label: 'UC网盘' }, { value: 'quark', label: '夸克网盘' }, { value: 'baidu', label: '百度网盘' }, { value: 'thunder', label: '迅雷网盘' }];
const providerNames: Record<string, string> = { uc: 'UC', quark: '夸克', baidu: '百度', thunder: '迅雷' };

export default function SoftwareManager({ initialCreate = false }: { initialCreate?: boolean }) {
  const [rows, setRows] = useState<SoftwareRow[]>([]);
  const [editId, setEditId] = useState('');
  const [formOpen, setFormOpen] = useState(initialCreate);
  const [form, setForm] = useState({ title: '', slug: '', description: '', developer: '', version: '', file_size: '', platform: '', image_url: '', official_download_url: '', introduction_markdown: '', screenshots: '',  });
  const [links, setLinks] = useState<LinkItem[]>([]);
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
    setFormOpen(false);
    setForm({ title: '', slug: '', description: '', developer: '', version: '', file_size: '', platform: '', image_url: '', official_download_url: '', introduction_markdown: '', screenshots: '',  });
    setLinks([]);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const payload = { ...form, screenshots: form.screenshots.split(/\r?\n/).map(url => url.trim()).filter(Boolean), links: links.filter(link => link.share_url.trim()) };
    const response = await fetch(editId ? '/api/admin/software/' + editId : '/api/admin/software', {
      method: editId ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error || '保存失败'); setBusy(false); return; }
    reset(); await load(); setBusy(false);
  }
  function edit(row: SoftwareRow) {
    setEditId(row.id);
    setFormOpen(true);
    setForm({ title: row.title, slug: row.slug, description: row.description || '', developer: row.developer || '', version: row.version || '', file_size: row.file_size || '', platform: row.platform || '', image_url: row.image_url || '', official_download_url: row.official_download_url || '', introduction_markdown: row.introduction_markdown || '', screenshots: (row.screenshots || []).join('\n') });
    setLinks(row.software_download_links || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function manage(row: SoftwareRow, action: 'archive' | 'restore_archive' | 'restore_trash' | 'permanent_delete' | 'trash') {
    const prompts = { archive: '确定归档这个软件吗？', restore_archive: '确定恢复归档软件吗？', restore_trash: '确定恢复这个软件吗？', permanent_delete: '确定永久删除这个软件吗？此操作不可恢复。', trash: '确定将这个软件移入回收站吗？' };
    if (!window.confirm(prompts[action])) return;
    const response = await fetch('/api/admin/software/' + row.id, { method: action === 'trash' ? 'DELETE' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || '软件状态更新失败'); else { setError(''); await load(); }
  }


  const totalCount = rows.length;
  const publishedCount = rows.filter(row => row.status === 'published').length;
  const archivedCount = rows.filter(row => row.status === 'archived').length;
  const draftCount = rows.filter(row => row.status === 'draft').length;
  const stats = [
    { label: '软件总数', value: totalCount, hint: '全部软件资料' },
    { label: '已发布', value: publishedCount, hint: '公开展示的软件' },
    { label: '已归档', value: archivedCount, hint: '已归档的软件' },
    { label: '回收站', value: rows.filter(row => row.status === 'trashed').length, hint: '已删除、可恢复的软件' },
    { label: '草稿箱', value: draftCount, hint: '尚未发布的软件' },
  ];

  return <div className="space-y-5">
    <div>
      <h2 className="text-lg font-semibold">软件库管理</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>管理软件资料、官方图标、官方下载与网盘链接。</p>
    </div>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {stats.map(stat => <div key={stat.label} className="admin-panel">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
        <p className="mt-3 text-3xl font-bold tabular-nums">{stat.value}</p>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.hint}</p>
      </div>)}
    </section>
    {formOpen && <form onSubmit={save} className="admin-panel grid gap-3 sm:grid-cols-2">
      <h2 className="sm:col-span-2 font-semibold">{editId ? '编辑软件' : '添加软件'}</h2>
      <input required className="rounded-lg border bg-transparent p-2" placeholder="软件名称" value={form.title} onChange={e => change('title', e.target.value)} />
      <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="rounded-lg border bg-transparent p-2" placeholder="英文 slug，例如 vscode" value={form.slug} onChange={e => change('slug', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="一句话介绍" value={form.description} onChange={e => change('description', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2" placeholder="开发者 / 厂商" value={form.developer} onChange={e => change('developer', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2" placeholder="版本号" value={form.version} onChange={e => change('version', e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2" placeholder="文件大小，例如 120 MB" value={form.file_size} onChange={e => change("file_size", e.target.value)} />
      <input className="rounded-lg border bg-transparent p-2" placeholder="平台，例如 Linux、macOS、Windows" value={form.platform} onChange={e => change('platform', e.target.value)} />
      <R2ImageUploader kind="software_icon" label="软件官方图标" alt={(form.title || "软件") + " 官方图标"} value={form.image_url} onChange={value => change('image_url', value)} />
      <input type="url" className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="官方官方下载页面 HTTPS 地址" value={form.official_download_url} onChange={e => change('official_download_url', e.target.value)} />
      <textarea rows={6} className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="软件详细介绍（支持 Markdown 文本）" value={form.introduction_markdown} onChange={e => change('introduction_markdown', e.target.value)} />
      <textarea rows={3} className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="软件截图 HTTPS 图片地址，每行一个（可选）" value={form.screenshots} onChange={e => change('screenshots', e.target.value)} />
      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-center justify-between"><strong className="text-sm">网盘下载链接</strong><button type="button" className="admin-nav-link" onClick={() => setLinks(items => [...items, emptyLink()])}>添加链接</button></div>
        {links.map((link, index) => <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          <select className="rounded-lg border bg-transparent p-2" value={link.provider} required={Boolean(link.share_url.trim())} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, provider: e.target.value, label: providerNames[e.target.value] || '' } : item))}><option value="">请选择网盘</option>{providers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
          <input className="rounded-lg border bg-transparent p-2" placeholder="链接显示名称" value={link.label} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} />
          <input type="url" className="rounded-lg border bg-transparent p-2 sm:col-span-2" placeholder="HTTPS 分享链接" value={link.share_url} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, share_url: e.target.value } : item))} />
          <input className="rounded-lg border bg-transparent p-2" placeholder="提取码（可选）" value={link.access_code} onChange={e => setLinks(items => items.map((item, i) => i === index ? { ...item, access_code: e.target.value } : item))} />
          {links.length > 1 && <button type="button" className="text-left text-sm text-red-500" onClick={() => setLinks(items => items.filter((_, i) => i !== index))}>删除此链接</button>}
        </div>)}
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy} className="uiverse-btn uiverse-btn-primary">{busy ? '保存中…' : editId ? '保存修改' : '保存软件草稿'}</button>{editId && <button type="button" className="uiverse-btn uiverse-btn-ghost" onClick={reset}>取消编辑</button>}</div>
      {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
    </form>}
    <section className="admin-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">软件列表</h2>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>最多显示 300 个，按最近更新时间排序</p>
      </div>
      {rows.length === 0 ? <p className="text-sm opacity-70">暂无软件条目</p> : rows.map((row, index) => <div key={row.id} className="border-t py-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex min-w-0 items-center gap-3">
          <span aria-label={`第 ${index + 1} 个软件`} className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border px-2 text-xs font-semibold tabular-nums" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{index + 1}</span>
          {row.image_url ? <img src={row.image_url} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" /> : <div className="h-10 w-10 shrink-0 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />}
          <div className="min-w-0">
            <p className="font-medium">{row.title}</p>
            <p className="mt-1 text-xs opacity-60">{row.slug} · {({ published: '已发布', draft: '草稿', archived: '已归档', trashed: '回收站' } as Record<string, string>)[row.status] || row.status}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-start gap-2">
          {row.status === 'trashed' ? <>
            <button type="button" className="admin-nav-link !text-green-500" onClick={() => void manage(row, 'restore_trash')}>恢复</button>
            <button type="button" className="admin-nav-link !text-red-500" onClick={() => void manage(row, 'permanent_delete')}>永久删除</button>
          </> : <>
            <button type="button" className="admin-nav-link !text-red-500" onClick={() => void manage(row, 'trash')}>删除</button>
            {row.status === 'archived' ? <button type="button" className="admin-nav-link !text-green-500" onClick={() => void manage(row, 'restore_archive')}>恢复归档</button> : <button type="button" className="admin-nav-link !text-amber-400" onClick={() => void manage(row, 'archive')}>归档</button>}
            <button type="button" className="admin-nav-link !text-rose-400" onClick={() => edit(row)}>编辑</button>
          </>}
        </div>
      </div>)}
    </section>
  </div>;
}
