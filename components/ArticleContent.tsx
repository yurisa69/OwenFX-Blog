import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function markdownToHtml(source: string) {
  let html = escapeHtml(source);
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^ )]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.split(/\n{2,}/).map(block => /^(<h[1-3]|<pre)/.test(block) ? block : '<p>' + block.replace(/\n/g, '<br>') + '</p>').join('');
  return html;
}

export default async function ArticleContent({ content }: { content: string }) {
  const matches = [...content.matchAll(/\{\{software:([a-z0-9-]+)\}\}/g)];
  const slugs = [...new Set(matches.map(match => match[1]))];
  const supabase = await createClient();
  const { data } = slugs.length ? await supabase.from('software').select('id,title,slug,image_url,description,version').in('slug', slugs).eq('status', 'published') : { data: [] as any[] };
  const software = new Map((data || []).map(item => [item.slug, item]));
  const pieces = content.split(/(\{\{software:[a-z0-9-]+\}\})/g);
  return <div className="article-content space-y-4">
    {pieces.map((piece, index) => {
      const match = piece.match(/^\{\{software:([a-z0-9-]+)\}\}$/);
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
  </div>;
}
