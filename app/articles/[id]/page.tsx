import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { formatChineseDate } from '@/lib/date';
import { readMarkdownFile } from '@/lib/github-articles';
import ArticleContent from '@/components/ArticleContent';
import ArticleSupport from '@/components/ArticleSupport';
import ArticleInteractions from '@/components/ArticleInteractions';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://owenfx-blog.vercel.app';

function sortTagsByLength(tags: string[]) {
  return tags
    .map((tag, index) => ({ tag, index }))
    .sort((a, b) => Array.from(a.tag).length - Array.from(b.tag).length || a.index - b.index)
    .map(({ tag }) => tag);
}

const getPublishedArticle = cache(async (id: string) => {
  const supabase = await createClient();
  const columns = 'id,legacy_id,title,slug,excerpt,seo_title,seo_description,cover_url,github_path,github_sha,published_at,created_at,updated_at,legacy_author,category:categories!articles_category_id_fkey(name),tags:article_tags(tag:tags(name))';
  const publishedAt = new Date().toISOString();
  const { data: articleById } = await supabase.from('articles').select(columns)
    .eq('id', id).eq('status', 'published').lte('published_at', publishedAt).maybeSingle();
  const { data: articleByLegacyId } = articleById
    ? { data: null }
    : await supabase.from('articles').select(columns)
        .eq('legacy_id', id).eq('status', 'published').lte('published_at', publishedAt).maybeSingle();
  return articleById || articleByLegacyId;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await getPublishedArticle(id);
  if (!article) return { robots: { index: false, follow: false } };

  const title = article.seo_title?.trim() || article.title;
  const description = article.seo_description?.trim() || article.excerpt?.trim() || undefined;
  const canonicalPath = `/articles/${encodeURIComponent(article.id)}`;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const images = article.cover_url ? [{ url: article.cover_url }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'article',
      siteName: 'OwenFX',
      locale: 'zh_CN',
      title,
      description,
      url: canonicalUrl,
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.updated_at || undefined,
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images: article.cover_url ? [article.cover_url] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getPublishedArticle(id);
  if (!article?.github_path) notFound();

  const file = await readMarkdownFile(article.github_path, article.github_sha || undefined);
  if (!file) notFound();

  const category = Array.isArray(article.category) ? article.category[0] : article.category;
  const categoryName = category?.name || '';
  const tags = sortTagsByLength((article.tags || [])
    .map((entry: { tag?: { name?: string } | { name?: string }[] | null }) => {
      const tag = Array.isArray(entry.tag) ? entry.tag[0] : entry.tag;
      return tag?.name || '';
    })
    .filter(Boolean));
  const publishedDate = formatChineseDate(article.published_at || article.created_at);
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seo_description || article.excerpt || undefined,
    inLanguage: 'zh-CN',
    ...(categoryName ? { articleSection: categoryName } : {}),
    ...(tags.length ? { keywords: tags } : {}),
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.published_at || article.created_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': new URL(`/articles/${encodeURIComponent(article.id)}`, siteUrl).toString(),
    },
    author: { '@type': 'Organization', name: 'OwenFX' },
    publisher: { '@type': 'Organization', name: 'OwenFX' },
    ...(article.cover_url ? { image: [article.cover_url] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
      }} />
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <article className="uiverse-card mb-8 rounded-xl p-5 sm:p-7">
        <div className="mb-3 flex flex-col items-center gap-1 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center justify-center gap-2">
            <span className="monet-waterlily-flow font-semibold">OWEN</span>
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--accent-bg)' }}><span className="monet-waterlily-flow">站长</span></span>
          </div>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{publishedDate}</span>
        </div>
        <h1 className="mb-6 text-2xl font-bold leading-tight text-left sm:text-3xl">{article.title}</h1>

        {article.excerpt && (
          <p className="article-excerpt-card mb-6 rounded-lg px-4 py-3 text-sm leading-7">
            {article.excerpt}
          </p>
        )}

        <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
          <ArticleContent content={file.content} title={article.title} />
        </div>

        <ArticleSupport className="mt-7" />
        <ArticleInteractions articleId={article.id} />
      </article>
    </div>
    </>
  );
}
