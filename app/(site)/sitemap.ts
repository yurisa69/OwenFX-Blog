import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://owenfx-blog.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [{ data: articles }, { data: software }] = await Promise.all([
    supabase.from('articles')
      .select('id,updated_at,published_at')
      .eq('status', 'published')
      .lte('published_at', now)
      .order('published_at', { ascending: false })
      .limit(1000),
    supabase.from('software')
      .select('slug,updated_at,published_at')
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order('updated_at', { ascending: false })
      .limit(1000),
  ]);

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/articles`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/software`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    ...(articles || []).map(article => ({
      url: `${siteUrl}/articles/${encodeURIComponent(article.id)}`,
      lastModified: article.updated_at || article.published_at || undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...(software || []).map(item => ({
      url: `${siteUrl}/software/${encodeURIComponent(item.slug)}`,
      lastModified: item.updated_at || item.published_at || undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
