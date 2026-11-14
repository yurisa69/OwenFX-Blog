import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { readMarkdownFile } from '@/lib/github-articles';

export const metadata: Metadata = {
  title: '全站搜索 — OwenFX',
  description: '搜索 OwenFX 的文章、软件和标签。',
};

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  github_path: string | null;
  content_markdown: string | null;
  published_at: string | null;
  created_at: string;
};

type SoftwareRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  version: string | null;
  platform: string | null;
  image_url: string | null;
  category: { name: string; slug: string } | { name: string; slug: string }[] | null;
  tags: { tag: { name: string; slug: string } | { name: string; slug: string }[] | null }[] | null;
};

type TagRow = { id: string; name: string; slug: string };

function includesQuery(value: string | null | undefined, query: string) {
  return Boolean(value && value.toLocaleLowerCase().includes(query));
}

async function fetchAllRows<T>(
  loadPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 500;
  for (let offset = 0; offset < 100000; offset += pageSize) {
    const { data, error } = await loadPage(offset, offset + pageSize - 1);
    if (error) throw new Error('搜索内容读取失败：' + error.message);
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || '').replace(/[%_]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  const normalizedQuery = query.toLocaleLowerCase();
  const supabase = await createClient();

  if (!query) {
    return (
      <main className="mx-auto max-w-5xl py-10">
        <h1 className="text-2xl font-bold">全站搜索</h1>
        <p className="mt-3 text-sm opacity-70">输入关键词，搜索文章、软件名称、介绍和标签。</p>
      </main>
    );
  }

  const now = new Date().toISOString();
  const [articles, software, tagResult] = await Promise.all([
    fetchAllRows<ArticleRow>((from, to) => supabase.from('articles')
      .select('id,title,slug,excerpt,github_path,content_markdown,published_at,created_at')
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order('published_at', { ascending: false })
      .range(from, to)),
    fetchAllRows<SoftwareRow & { introduction_markdown?: string | null }>((from, to) => supabase.from('software')
      .select('id,title,slug,description,developer,version,platform,image_url,introduction_markdown,category:categories!software_category_id_fkey(name,slug),tags:software_tags(tag:tags(name,slug))')
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order('featured', { ascending: false })
      .order('featured_order', { ascending: true })
      .order('updated_at', { ascending: false })
      .range(from, to)),
    supabase.from('tags').select('id,name,slug')
      .eq('active', true)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(50),
  ]);
  const tags = (tagResult.data || []) as TagRow[];
  const tagIds = tags.map(tag => tag.id);

  const [articleTagRefs, softwareTagRefs] = tagIds.length
    ? await Promise.all([
        supabase.from('article_tags').select('article_id').in('tag_id', tagIds),
        supabase.from('software_tags').select('software_id').in('tag_id', tagIds),
      ])
    : [{ data: [] as { article_id: string }[] }, { data: [] as { software_id: string }[] }];

  const taggedArticleIds = new Set((articleTagRefs.data || []).map(row => row.article_id));
  const taggedSoftwareIds = new Set((softwareTagRefs.data || []).map(row => row.software_id));

  const articleMatches = await mapWithConcurrency(articles, 8, async article => {
    if (
      includesQuery(article.title, normalizedQuery)
      || includesQuery(article.excerpt, normalizedQuery)
      || taggedArticleIds.has(article.id)
    ) return true;

    let body = article.content_markdown || '';
    if (article.github_path) {
      try {
        const markdown = await readMarkdownFile(article.github_path);
        if (markdown?.content) body = markdown.content;
      } catch {
        // Keep metadata and any locally indexed content searchable if GitHub is temporarily unavailable.
      }
    }
    return includesQuery(body, normalizedQuery);
  });

  const matchedArticles = articles.filter((article, index) => articleMatches[index]);
  const matchedSoftware = software.filter(item => {
    const itemTags = (item.tags || []).flatMap(entry => {
      if (Array.isArray(entry.tag)) return entry.tag;
      return entry.tag ? [entry.tag] : [];
    });
    return taggedSoftwareIds.has(item.id)
      || includesQuery(item.title, normalizedQuery)
      || includesQuery(item.description, normalizedQuery)
      || includesQuery(item.introduction_markdown, normalizedQuery)
      || includesQuery(item.developer, normalizedQuery)
      || includesQuery(item.platform, normalizedQuery)
      || itemTags.some(tag => includesQuery(tag.name, normalizedQuery));
  });

  const total = matchedArticles.length + matchedSoftware.length + tags.length;

  return (
    <main className="mx-auto max-w-5xl py-8">
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-[.16em] text-[var(--text-tertiary)]">OWENFX SEARCH</p>
        <h1 className="mt-2 text-2xl font-bold">搜索结果</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          “{query}” · 找到 {total} 项结果
        </p>
      </div>

      {tags.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">标签</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Link key={tag.id} href={'/search?q=' + encodeURIComponent(tag.name)}
                className="rounded-full border px-3 py-1.5 text-sm transition hover:border-[var(--accent)]"
                style={{ borderColor: 'var(--border-color)', background: 'var(--accent-bg)' }}>
                #{tag.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-9">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">文章</h2>
          <span className="text-xs text-[var(--text-tertiary)]">{matchedArticles.length} 篇</span>
        </div>
        {matchedArticles.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {matchedArticles.map(article => (
              <Link key={article.id} href={'/articles/' + article.id} className="uiverse-card p-5 transition hover:-translate-y-0.5">
                <h3 className="font-semibold">{article.title}</h3>
                {article.excerpt && <p className="mt-2 line-clamp-3 text-sm text-[var(--text-secondary)]">{article.excerpt}</p>}
              </Link>
            ))}
          </div>
        ) : <p className="uiverse-card p-4 text-sm opacity-60">没有匹配的文章。</p>}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">软件</h2>
          <span className="text-xs text-[var(--text-tertiary)]">{matchedSoftware.length} 款</span>
        </div>
        {matchedSoftware.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {matchedSoftware.map(item => {
              const category = Array.isArray(item.category) ? item.category[0] : item.category;
              const itemTags = (item.tags || []).flatMap(entry => {
                if (Array.isArray(entry.tag)) return entry.tag;
                return entry.tag ? [entry.tag] : [];
              });
              return (
                <Link key={item.id} href={'/software/' + item.slug} className="uiverse-card flex min-w-0 flex-col items-center p-4 text-center transition hover:-translate-y-0.5">
                  <div className="software-icon-frame mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.title + ' 图标'} width={56} height={56} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      : <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{item.title.slice(0, 1)}</span>}
                  </div>
                  <h3 className="line-clamp-1 w-full text-sm font-semibold">{item.title}</h3>
                  {category?.name && <span className="mt-1 text-xs text-[var(--text-tertiary)]">{category.name}</span>}
                  {itemTags.length > 0 && <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {itemTags.slice(0, 3).map(tag => <span key={tag.slug} className="rounded-full px-2 py-1 text-[10px]" style={{ background: 'var(--accent-bg)', color: 'var(--text-secondary)' }}>#{tag.name}</span>)}
                  </div>}
                </Link>
              );
            })}
          </div>
        ) : <p className="uiverse-card p-4 text-sm opacity-60">没有匹配的软件。</p>}
      </section>

      {total === 0 && <p className="mt-8 text-center text-sm text-[var(--text-tertiary)]">换一个关键词试试。</p>}
    </main>
  );
}
