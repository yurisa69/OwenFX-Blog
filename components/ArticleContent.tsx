import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function inlineMarkdown(value: string) {
  return value
    .replace(/!\\[([^\\]]*)\\]\\((https?:\\/\\/[^ )]+)\\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^ )]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/(?<!\\*)\\*([^*]+)\\*(?!\\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function markdownToHtml(source: string) {
  const lines = source.replace(/\\r\\n/g, '\\n').split('\\n');
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
      output.push(`<pre><code>${escapeHtml(code.join('\\n'))}</code></pre>`);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(escapeHtml(heading[2]))}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && /^\\s*\\|?\\s*:?-{3,}:?\\s*(\\|\\s*:?-{3,}:?\\s*)+\\|?\\s*$/.test(lines[index + 1])) {
      const cells = (row: string) => row.trim().replace(/^\\|/, '').replace(/\\|$/, '').split('|').map(cell => cell.trim());
      const header = cells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      output.push(`<div class="article-table-wrap"><table><thead><tr>${header.map(cell => `<th>${inlineMarkdown(escapeHtml(cell))}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${header.map((_, cellIndex) => `<td>${inlineMarkdown(escapeHtml(row[cellIndex] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    if (/^\\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\\s*>/.test(lines[index])) {
        quote.push(inlineMarkdown(escapeHtml(lines[index].replace(/^\\s*>\\s?/, '')));
        index += 1;
      }
      output.push(`<blockquote>${quote.join('<br>')}</blockquote>`);
      continue;
    }

    if (/^\\s*[-*+]\\s+/.test(line) || /^\\s*\\d+\\.\\s+/.test(line)) {
      const ordered = /^\\s*\\d+\\.\\s+/.test(line);
      const items: string[] = [];
      const pattern = ordered ? /^\\s*\\d+\\.\\s+/ : /^\\s*[-*+]\\s+/;
      while (index < lines.length && pattern.test(lines[index])) {
        items.push(`<li>${inlineMarkdown(escapeHtml(lines[index].replace(pattern, '')))}</li>`);
        index += 1;
      }
      output.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,6})\\s+/.test(lines[index]) && !/^\\s*>/.test(lines[index]) && !/^\\s*([-*+]\\s+|\\d+\\.\\s+)/.test(lines[index]) && !lines[index].trim().startsWith('```')) {
      paragraph.push(inlineMarkdown(escapeHtml(lines[index])));
      index += 1;
    }
    output.push(`<p>${paragraph.join('<br>')}</p>`);
  }
  return output.join('');
}

export default async function ArticleContent({ content }: { content: string }) {
  const matches = [...content.matchAll(/\\{\\{software:([a-z0-9-]+)\\}\\}/g)];
  const slugs = [...new Set(matches.map(match => match[1]))];
  const supabase = await createClient();
  const { data } = slugs.length
    ? await supabase.from('software').select('id,title,slug,image_url,description,version').in('slug', slugs).eq('status', 'published')
    : { data: [] as any[] };
  const software = new Map((data || []).map(item => [item.slug, item]));
  const pieces = content.split(/(\\{\\{software:[a-z0-9-]+\\}\\})/g);

  return <div className="article-content space-y-4">
    {pieces.map((piece, index) => {
      const match = piece.match(/^\\{\\{software:([a-z0-9-]+)\\}\\}$/);
      if (match) {
        const item = software.get(match[1]);
        if (!item) return null;
        return <Link key={index} href={'/software/' + item.slug} className="uiverse-card flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
            {item.image_url ? <img src={item.image_url} alt={item.title + ' 图标'} className="h-full w-full object-cover" /> : <span className="text-xl font-bold">{item.title.slice(0, 1)}</span>}
          </div>
          <div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs opacity-70">{item.description || item.version || '查看软件详情'}</p></div>
          <span className="text-sm" style={{ color: 'var(--accent)' }}>查看 →</span>
        </Link>;
      }
      if (!piece.trim()) return null;
      return <div key={index} className="prose-block" dangerouslySetInnerHTML={{ __html: markdownToHtml(piece) }} />;
    })}
    <style jsx global>{`
      .article-content img{max-width:100%;height:auto;border-radius:12px;margin:1rem auto}
      .article-content pre{overflow-x:auto;padding:1rem;border-radius:12px;background:var(--bg-secondary)}
      .article-content blockquote{border-left:3px solid var(--accent);padding-left:1rem;color:var(--text-secondary)}
      .article-content table{width:100%;border-collapse:collapse;min-width:520px}
      .article-content th,.article-content td{border:1px solid var(--border-color);padding:9px 12px;text-align:left}
      .article-table-wrap{max-width:100%;overflow-x:auto}
      .article-content ul,.article-content ol{padding-left:1.5rem;list-style:revert}
      .article-content a{color:var(--accent);text-decoration:underline}
    `}</style>
  </div>;
}
