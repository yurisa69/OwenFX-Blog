'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Draft = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content_markdown?: string;
  status?: string;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function inlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^ )]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async" referrerpolicy="no-referrer" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^ )]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function markdownToHtml(source: string) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line.trim().startsWith('```')) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(escapeHtml(heading[2]))}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      output.push('<hr>');
      index += 1;
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])) {
      const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
      const header = cells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      output.push(`<table><thead><tr>${header.map(cell => `<th>${inlineMarkdown(escapeHtml(cell))}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${header.map((_, cellIndex) => `<td>${inlineMarkdown(escapeHtml(row[cellIndex] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(inlineMarkdown(escapeHtml(lines[index].replace(/^\s*>\s?/, ''))));
        index += 1;
      }
      output.push(`<blockquote>${quote.join('<br>')}</blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      const pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
      while (index < lines.length && pattern.test(lines[index])) {
        items.push(`<li>${inlineMarkdown(escapeHtml(lines[index].replace(pattern, '')))}</li>`);
        index += 1;
      }
      output.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s+/.test(lines[index]) && !/^\s*>/.test(lines[index]) && !/^\s*([-*+]\s+|\d+\.\s+)/.test(lines[index]) && !lines[index].trim().startsWith('```')) {
      paragraph.push(inlineMarkdown(escapeHtml(lines[index])));
      index += 1;
    }
    output.push(`<p>${paragraph.join('<br>')}</p>`);
  }

  return output.join('');
}

function htmlToMarkdown(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof HTMLElement)) return '';
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      const alt = (node.getAttribute('alt') || '').replace(/\]/g, '\\]');
      return /^https?:\/\//i.test(src) ? `![${alt}](${src})` : '';
    }
    if (node.tagName === 'TABLE') {
      const rows = Array.from(node.querySelectorAll('tr')).map(row =>
        Array.from(row.querySelectorAll('th,td')).map(cell => cell.textContent?.trim().replace(/\|/g, '\\|') || '')
      );
      if (!rows.length) return '';
      const width = Math.max(...rows.map(row => row.length));
      const normalized = rows.map(row => Array.from({ length: width }, (_, index) => row[index] || ''));
      return [normalized[0], normalized[0].map(() => '---'), ...normalized.slice(1)]
        .map(row => `| ${row.join(' | ')} |`).join('\n') + '\n\n';
    }
    const content = Array.from(node.childNodes).map(walk).join('');
    switch (node.tagName) {
      case 'H1': return `# ${content}\n\n`;
      case 'H2': return `## ${content}\n\n`;
      case 'H3': return `### ${content}\n\n`;
      case 'H4': return `#### ${content}\n\n`;
      case 'H5': return `##### ${content}\n\n`;
      case 'H6': return `###### ${content}\n\n`;
      case 'STRONG': case 'B': return `**${content}**`;
      case 'EM': case 'I': return `*${content}*`;
      case 'CODE': return '`' + content + '`';
      case 'PRE': return '```\n' + (node.textContent || '') + '\n```\n\n';
      case 'LI': { const parent = node.parentElement; const number = parent?.tagName === 'OL' ? Array.from(parent.children).indexOf(node) + 1 : 0; return parent?.tagName === 'OL' ? String(number) + '. ' + content + '\n' : '- ' + content + '\n'; }
      case 'UL': case 'OL': return `${content}\n`;
      case 'BLOCKQUOTE': return content.split('\n').filter(Boolean).map(line => `> ${line}`).join('\n') + '\n\n';
      case 'BR': return '\n';
      case 'HR': return '\n---\n\n';
      case 'P': case 'DIV': return `${content}\n\n`;
      case 'A': {
        const href = node.getAttribute('href') || '';
        return /^(https?:\/\/|mailto:)/i.test(href) ? `[${content}](${href})` : content;
      }
      default: return content;
    }
  };
  return Array.from(doc.body.childNodes).map(walk).join('').replace(/\n{3,}/g, '\n\n').trim();
}

export default function ArticleEditor({ initial = {} }: { initial?: Draft }) {
  const router = useRouter();
  const richRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'markdown' | 'rich'>('markdown');
  const [title, setTitle] = useState(initial.title || '');
  const [slug, setSlug] = useState(initial.slug || '');
  const [excerpt, setExcerpt] = useState(initial.excerpt || '');
  const [content, setContent] = useState(initial.content_markdown || '');
  const [status, setStatus] = useState(initial.status === 'published' ? 'published' : 'draft');
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);

  // 不将 content 加入依赖：每次输入都会更新它，重新写入 innerHTML 会导致编辑光标跳动。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode === 'rich' && richRef.current) richRef.current.innerHTML = markdownToHtml(content);
  }, [mode, preview]);

  function switchMode(next: 'markdown' | 'rich') {
    if (mode === 'rich' && richRef.current) setContent(htmlToMarkdown(richRef.current.innerHTML));
    setMode(next);
  }

  function runFormat(command: string, value?: string) {
    richRef.current?.focus();
    document.execCommand(command, false, value);
    if (richRef.current) setContent(htmlToMarkdown(richRef.current.innerHTML));
  }

  function insertTable() {
    const rows = Math.max(2, Math.min(10, Number(window.prompt('表格行数（2–10，包含表头）', '3')) || 3));
    const columns = Math.max(2, Math.min(8, Number(window.prompt('表格列数（2–8）', '3')) || 3));
    const table = `<table><tbody>${Array.from({ length: rows }, (_, row) => `<tr>${Array.from({ length: columns }, (_, column) => row === 0 ? `<th>表头${column + 1}</th>` : '<td>内容</td>').join('')}</tr>`).join('')}</tbody></table><p><br></p>`;
    richRef.current?.focus();
    document.execCommand('insertHTML', false, table);
    if (richRef.current) setContent(htmlToMarkdown(richRef.current.innerHTML));
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setUploadBusy(true);
    const isVideo = file.type.startsWith('video/');
    setMessage(isVideo ? '正在安全直传视频到 Cloudflare R2…' : '正在安全直传图片到 Cloudflare R2…');
    try {
      const alt = isVideo ? file.name : (window.prompt('图片替代文字（可选）', file.name) || file.name);
      const kind = isVideo ? 'video' : 'image';
      const signedResponse = await fetch('/api/r2-upload/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, fileName: file.name, contentType: file.type, size: file.size }),
      });
      const signed = await signedResponse.json();
      if (!signedResponse.ok) throw new Error(signed.error || '无法创建 R2 上传地址');

      const putResponse = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: signed.headers,
        body: file,
      });
      if (!putResponse.ok) throw new Error('R2 文件上传失败，请检查存储桶 CORS 配置');

      const completeResponse = await fetch('/api/r2-upload/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: signed.key, kind, fileName: file.name, alt }),
      });
      const completed = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completed.error || 'R2 文件登记失败');
      const url = completed.asset.public_url;

      if (isVideo) {
        const link = `[视频：${file.name.replace(/[\[\]]/g, '')}](${url})`;
        if (mode === 'markdown') setContent(value => `${value}${value ? '\n\n' : ''}${link}`);
        else if (richRef.current) {
          richRef.current.focus();
          document.execCommand('insertHTML', false, `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(file.name)}</a>`);
          setContent(htmlToMarkdown(richRef.current.innerHTML));
        }
        setMessage('视频已直传 R2，媒体元数据已登记');
      } else {
        if (mode === 'markdown') {
          setContent(value => `${value}${value ? '\n\n' : ''}![${alt}](${url})`);
        } else if (richRef.current) {
          richRef.current.focus();
          document.execCommand('insertHTML', false, `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`);
          setContent(htmlToMarkdown(richRef.current.innerHTML));
        }
        setMessage('图片已直传 R2，并插入文章');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '媒体上传失败');
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function save(nextStatus: 'draft' | 'published' = 'draft') {
    if (!title.trim() || !slug.trim()) {
      setMessage('请先填写文章标题和 Slug');
      return;
    }
    setBusy(true);
    setMessage('');
    const finalContent = mode === 'rich' && richRef.current ? htmlToMarkdown(richRef.current.innerHTML) : content;
    try {
      const response = await fetch(initial.id ? `/api/admin/articles/${initial.id}` : '/api/admin/articles', {
        method: initial.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, slug, excerpt, content_markdown: finalContent, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '保存失败');
      setStatus(nextStatus);
      setMessage(nextStatus === 'published' ? '文章已发布' : '草稿已保存');
      if (!initial.id && result.id) router.replace(`/admin/articles/${result.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block text-sm">文章标题
        <input value={title} onChange={event => {
          setTitle(event.target.value);
          if (!initial.id && !slug) setSlug(event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `article-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
        }} maxLength={160} className="admin-input mt-2" placeholder="输入文章标题" />
      </label>
      <label className="block text-sm">URL Slug
        <input value={slug} onChange={event => setSlug(event.target.value)} className="admin-input mt-2" placeholder="my-first-post" />
        <span className="mt-1 block text-xs" style={{ color: 'var(--text-tertiary)' }}>仅使用小写英文字母、数字和连字符</span>
      </label>
    </div>

    <label className="block text-sm">文章摘要
      <textarea value={excerpt} onChange={event => setExcerpt(event.target.value)} maxLength={300} rows={2} className="admin-input mt-2" placeholder="简要介绍这篇文章" />
    </label>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <button type="button" className={`admin-tab ${mode === 'markdown' ? 'active' : ''}`} onClick={() => switchMode('markdown')}>Markdown</button>
        <button type="button" className={`admin-tab ${mode === 'rich' ? 'active' : ''}`} onClick={() => switchMode('rich')}>富文本</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" className="hidden" onChange={event => void uploadImage(event.target.files?.[0])} />
        <button type="button" className="admin-tab" disabled={uploadBusy} onClick={() => fileRef.current?.click()}>{uploadBusy ? '上传中…' : '上传 R2 媒体'}</button>
        <button type="button" className="admin-tab" onClick={() => setPreview(!preview)}>{preview ? '返回编辑' : '预览文章'}</button>
      </div>
    </div>

    {preview ? <article className="admin-preview" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} /> :
      mode === 'markdown' ? <textarea value={content} onChange={event => setContent(event.target.value)} rows={22} className="admin-input font-mono text-sm leading-7" placeholder={'# 文章标题\n\n在这里编写 Markdown 内容…'} /> :
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex flex-wrap gap-1 border-b p-2" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
            <button className="admin-tool" type="button" onClick={() => runFormat('bold')}><b>B</b></button>
            <button className="admin-tool" type="button" onClick={() => runFormat('italic')}><i>I</i></button>
            <button className="admin-tool" type="button" onClick={() => runFormat('formatBlock', 'h2')}>H2</button>
            <button className="admin-tool" type="button" onClick={() => runFormat('formatBlock', 'h3')}>H3</button>
            <button className="admin-tool" type="button" onClick={() => runFormat('insertUnorderedList')}>• 列表</button>
            <button className="admin-tool" type="button" onClick={() => runFormat('insertOrderedList')}>1. 编号</button>
            <button className="admin-tool" type="button" onClick={() => runFormat('formatBlock', 'pre')}>代码块</button>
            <button className="admin-tool" type="button" onClick={() => runFormat('insertHorizontalRule')}>分隔线</button>
            <button className="admin-tool" type="button" onClick={() => runFormat('formatBlock', 'blockquote')}>引用</button>
            <button className="admin-tool" type="button" onClick={() => {
              const url = window.prompt('输入 https:// 链接地址');
              if (url && /^https?:\/\//i.test(url)) runFormat('createLink', url);
            }}>插入链接</button>
            <button className="admin-tool" type="button" onClick={insertTable}>插入表格</button>
          </div>
          <div ref={richRef} contentEditable suppressContentEditableWarning onInput={event => setContent(htmlToMarkdown(event.currentTarget.innerHTML))}
            onPaste={event => {
              const html = event.clipboardData.getData('text/html');
              if (html) {
                event.preventDefault();
                document.execCommand('insertHTML', false, html);
                setContent(htmlToMarkdown(event.currentTarget.innerHTML));
              }
            }}
            className="admin-rich min-h-[420px] p-5 outline-none" data-placeholder="开始写作…" />
        </div>
    }

    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
      <p className="text-sm" aria-live="polite" style={{ color: message.includes('失败') || message.includes('不能为空') ? 'var(--danger)' : 'var(--text-secondary)' }}>{message || `${content.length.toLocaleString()} 字符 · 当前状态：${status === 'published' ? '已发布' : '草稿'}`}</p>
      <div className="flex gap-2">
        <button type="button" disabled={busy || uploadBusy} onClick={() => void save('draft')} className="uiverse-btn uiverse-btn-ghost">{busy ? '保存中…' : '保存草稿'}</button>
        <button type="button" disabled={busy || uploadBusy} onClick={() => void save('published')} className="uiverse-btn uiverse-btn-primary">{busy ? '处理中…' : status === 'published' ? '更新并发布' : '发布文章'}</button>
      </div>
    </div>

    <style jsx>{`
      .admin-input{display:block;width:100%;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-secondary);color:var(--text-primary);padding:11px 13px;outline:none}
      .admin-input:focus{border-color:var(--accent)}
      .admin-tab,.admin-tool{border:1px solid var(--border-color);border-radius:8px;padding:7px 12px;font-size:13px;color:var(--text-secondary)}
      .admin-tab.active{background:var(--accent-bg);border-color:var(--accent);color:var(--accent)}
      .admin-tool:hover{background:var(--bg-tertiary);color:var(--text-primary)}
      .admin-rich{color:var(--text-primary);line-height:1.8}
      .admin-rich:empty:before{content:attr(data-placeholder);color:var(--text-tertiary)}
      .admin-rich :global(img){max-width:100%;height:auto;border-radius:10px}
      .admin-rich :global(table){width:100%;border-collapse:collapse}
      .admin-rich :global(th),.admin-rich :global(td){border:1px solid var(--border-color);padding:8px;text-align:left}
      .admin-preview{padding:24px;border:1px solid var(--border-color);border-radius:12px;line-height:1.8;overflow-wrap:anywhere}
      .admin-preview :global(h1){font-size:2rem;font-weight:800;margin:1.2em 0 .5em}
      .admin-preview :global(h2){font-size:1.5rem;font-weight:750;margin:1.1em 0 .5em}
      .admin-preview :global(h3){font-size:1.2rem;font-weight:700;margin:1em 0 .5em}
      .admin-preview :global(pre){padding:14px;border-radius:10px;background:var(--bg-secondary);overflow:auto}
      .admin-preview :global(code){font-family:var(--font-geist-mono)}
      .admin-preview :global(blockquote){border-left:3px solid var(--accent);padding-left:14px;color:var(--text-secondary)}
      .admin-preview :global(img){max-width:100%;height:auto;border-radius:10px}
      .admin-preview :global(table){width:100%;border-collapse:collapse}
      .admin-preview :global(th),.admin-preview :global(td){border:1px solid var(--border-color);padding:8px;text-align:left}
    `}</style>
  </div>;
}
