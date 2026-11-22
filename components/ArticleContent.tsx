import Link from 'next/link';
import Image from 'next/image';
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

  const renderedPieces = await Promise.all(pieces.map(async (piece, index) => {
    const match = piece.match(/^\{\{software:([a-z0-9-]+)\}\}$/);
    if (match) {
      const item = software.get(match[1]);
      if (!item) return null;
      return <Link key={index} href={'/software/' + item.slug} className="owenfx-card flex items-center gap-4 p-4">
        <div className="software-icon-frame flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          {item.image_url ? <Image src={item.image_url} alt={item.title + ' å›¾æ ‡'} width={56} height={56} unoptimized loading="lazy" decoding="async" referrerPolicy="no-refe¶»§q«^