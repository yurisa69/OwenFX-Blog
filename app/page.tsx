import Carousel from '@/components/Carousel';
import HomeSections from '@/components/HomeSections';
import { createClient } from '@/lib/supabase/server';
import { formatChineseDate } from '@/lib/date';

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: software }, { data: articleRows }] = await Promise.all([
    supabase.from('software')
      .select('id,title,slug,description,version,platform,image_url,developer')
      .eq('status', 'published')
      .eq('featured', true)
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('featured_order', { ascending: true })
      .order('updated_at', { ascending: false }).limit(18),
    supabase.from('articles')
      .select('id,title,excerpt,published_at,created_at,categories(name)')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false }).limit(8),
  ]);
  const articles = (articleRows || []).map((article: any) => ({
    id: article.id,
    title: article.title,
    category: article.categories?.name || '文章',
    description: article.excerpt || '',
    createdAt: formatChineseDate(article.published_at || article.created_at),
  }));

  return <div className="pt-6 md:pt-9">
    <Carousel />
    <HomeSections articles={articles} featured={software ?? []} />
    <footer className="text-center py-8 text-sm border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)' }}><p>OwenFX © {new Date().getFullYear()}</p></footer>
  </div>;
}
