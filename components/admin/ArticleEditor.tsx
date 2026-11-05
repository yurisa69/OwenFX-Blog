'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Draft = { id?: string; title?: string; slug?: string; excerpt?: string; content_markdown?: string; status?: string };

export default function ArticleEditor({ initial = {} }: { initial?: Draft }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title || '');
  const [slug, setSlug] = useState(initial.slug || '');
  const [excerpt, setExcerpt] = useState(initial.excerpt || '');
  const [content, setContent] = useState(initial.content_markdown || '');
  const [status, setStatus] = useState(initial.status || 'draft');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function insertSoftware() {
    try {
      const response = await fetch('/api/software');
      const body = await response.json();
      const items = (body.software || []) as Array<{ title: string; slug: string }>;
      if (!items.length) { setMessage('目前没有已发布的软件，请先在软件库发布软件。'); return; }
      const options = items.map((item, index) => (index + 1) + '. ' + item.title + ' (' + item.slug + ')').join('\n');
      const selected = window.prompt('输入要插入的软件序号：\n' + options);
      if (!selected) return;
      const item = items[Number(selected) - 1];
      if (!item) { setMessage('序号无效'); return; }
      const token = '{{software:' + item.slug + '}}';
      setContent(value => value + (value ? '\n\n' : '') + token);
      setMessage('已插入软件卡片：' + item.title);
    } catch { setMessage('读取软件列表失败'); }
  }

  async function save(nextStatus: 'draft' | 'published') {
    setBusy(true); setMessage('');
    const payload = { title, slug, excerpt, content_markdown: content, status: nextStatus };
    try {
      const response = await fetch(initial.id ? '/api/admin/articles/' + initial.id : '/api/admin/articles', {
        method: initial.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '保存失败');
      setStatus(nextStatus);
      setMessage(nextStatus === 'published' ? '文章已发布' : '草稿已保存');
      if (!initial.id && body.id) router.replace('/admin/articles/' + body.id);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : '保存失败'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">文章标题<input className="admin-input mt-2" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required /></label>
      <label className="block text-sm">文章 URL 标识<input className="admin-input mt-2" value={slug} onChange={event => setSlug(event.target.value)} placeholder="例如 windows-tools-guide" required /><span className="mt-1 block text-xs opacity-60">仅使用小写字母、数字和连字符</span></label>
    </div>
    <label className="block text-sm">文章摘要<textarea className="admin-input mt-2" rows={2} maxLength={300} value={excerpt} onChange={event => setExcerpt(event.target.value)} /></label>
    <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">正文（支持 Markdown）</strong><button type="button" className="admin-nav-link" onClick={() => void insertSoftware()}>插入软件卡片</button></div>
    <textarea className="admin-input min-h-[420px] w-full font-mono text-sm leading-7" value={content} onChange={event => setContent(event.target.value)} placeholder={'# 标题\n\n输入文章内容。代码可使用三反引号代码块。\n\n点击“插入软件卡片”可插入软件详情卡片。'} />
    <div className="rounded-xl border p-3 text-xs leading-6 opacity-70" style={{ borderColor: 'var(--border-color)' }}>软件卡片会以 <code>{'{{software:slug}}'}</code> 形式保存，发布后自动显示对应软件图标和详情链接。软件安装包仍由官方或第三方网盘提供。</div>
    <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={busy} className="uiverse-btn uiverse-btn-ghost" onClick={() => void save('draft')}>保存草稿</button><button type="button" disabled={busy} className="uiverse-btn uiverse-btn-primary" onClick={() => void save('published')}>{busy ? '保存中…' : status === 'published' ? '更新并发布' : '发布文章'}</button><span className="text-xs opacity-60">{message}</span></div>
  </div>;
}
