import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

import { markdownToHtml } from '@/lib/markdown';
import CodeCopyEnhancer from '@/components/CodeCopyEnhancer';

export default async function ArticleContent({ content, title }: { content: string; title?: string }) {
  const matches = [...content.matchAll(/\{\{software:([a-z0-9-]+)\}\}/g)];
  const slugs = [...new Set(matches.map(match => match[1]))];
  const supabase = await createClient();
  const { data } = slugs.length
    ? await supabase.from('software').select('id,title,slug,image_url,description,version').in('slug', slugs).eq('status', 'published')
    : { data: [] as any[] };
  const software = new Map((data || []).map(item => [item.slug, item]));
  const pieces = content.split(/(\{\{software:[a-z0-9-]+\}\})/g);

  return <div className="article-content space-y-4">
    {pieces.map((piece, index) => {
      const match = piece.match(/^\{\{software:([a-z0-9-]+)\}\}$/);
      if (match) {
        const item = software.get(match[1]);
        if (!item) return null;
        return <Link key={index} href={'/software/' + item.slug} className="uiverse-card flex items-center gap-4 p-4">
          <div className="software-icon-frame flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            {item.image_url ? <img src={item.image_url} alt={item.title + ' 图标'} width={56} height={56} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <span className="text-xl font-bold">{item.title.slice(0, 1)}</span>}
          </div>
          <div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs opacity-70">{item.description || item.version || '查看软件详情'}</p></div>
          <span className="text-sm" style={{ color: 'var(--accent)' }}>查看 →</span>
        </Link>;
      }
      if (!piece.trim()) return null;
      return <CodeCopyEnhancer key={index} html={markdownToHtml(piece, { articleTitle: title, removeDownloadLinks: true })} />;
    })}

  </div>;
}
