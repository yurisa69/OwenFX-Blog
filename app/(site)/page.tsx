import Carousel from '@/components/Carousel';
import HomeSections from '@/components/HomeSections';
import { formatChineseDate } from '@/lib/date';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: articleRows } = await supabase.from('articles')
    .select('id,title,excerpt,published_at,created_at,categories(name)')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).limit(8);
  const articles = (articleRows || []).map((article: any) => ({
    id: article.id,
    title: article.title,
    category: article.categories?.name || '文章',
    description: article.excerpt || '',
    createdAt: formatChineseDate(article.published_at || article.created_at),
  }));

  return <div className="pt-6 md:pt-9">
    <Carousel />
    <HomeSections articles={articles} />
    <footer className="text-center py-8 text-sm border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)' }}><p>OwenFX © {new Date().getFullYear()}</p></footer>
  </div>;
}
