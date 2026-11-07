import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { readMarkdownFile } from '@/lib/github-articles';
import ArticleContent from '@/components/ArticleContent';
import ArticleSupport from '@/components/ArticleSupport';
import ArticleInteractions from '@/components/ArticleInteractions';

const categoryColors: Record<string, string> = {
  '工具评测': '#6366f1',
  '教程': '#f59e0b',
  '系统技巧': '#10b981',
};

function sortTagsByLength(tags: string[]) {
  return tags
    .map((tag, index) => ({ tag, index }))
    .sort((a, b) => Array.from(a.tag).length - Array.from(b.tag).length || a.index - b.index)
    .map(({ tag }) => tag);
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const columns = 'id,title,slug,excerpt,github_path,published_at,created_at,legacy_author,category:categories!articles_category_id_fkey(name),tags:article_tags(tag:tags(name))';
  const { data: articleById } = await supabase.from('articles').select(columns)
    .eq('id', id).eq('status', 'published').lte('published_at', new Date().toISOString()).maybeSingle();
  const { data: articleByLegacyId } = articleById
    ? { data: null }
    : await supabase.from('articles').select(columns)
        .eq('legacy_id', id).eq('status', 'published').lte('published_at', new Date().toISOString()).maybeSingle();
  const article = articleById || articleByLegacyId;
  if (!article?.github_path) notFound();

  const file = await readMarkdownFile(article.github_path);
  if (!file) notFound();

  const category = Array.isArray(article.category) ? article.category[0] : article.category;
  const categoryName = category?.name || '';
  const categoryColor = categoryColors[categoryName] || '#6366f1';
  const tags = sortTagsByLength((article.tags || [])
    .map((entry: { tag?: { name?: string } | { name?: string }[] | null }) => {
      const tag = Array.isArray(entry.tag) ? entry.tag[0] : entry.tag;
      return tag?.name || '';
    })
    .filter(Boolean));
  const publishedDate = new Date(article.published_at || article.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: 'numeric',
  });

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="monet-waterlily-flow font-semibold">OWEN</span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--accent-bg)' }}><span className="monet-waterlily-flow">站长</span></span>
      </div>

      <article className="uiverse-card mb-8 rounded-xl p-5 sm:p-7">
        <h1 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl">{article.title}</h1>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {categoryName && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: 'var(--accent-bg)', color: categoryColor }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
              {categoryName}
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>· {publishedDate}</span>
        </div>

        {article.excerpt && (
          <p className="mb-6 rounded-lg px-4 py-3 text-sm leading-7"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            {article.excerpt}
          </p>
        )}

        <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
          <ArticleContent content={file.content} />
        </div>

        {tags.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <ArticleSupport className="mt-7" />
        <ArticleInteractions articleId={article.id} />
      </article>
    </div>
  );
}
