alter table public.articles
  add column if not exists legacy_author text;

insert into public.categories (kind, name, slug, description, sort_order, active)
values
  ('article', '工具评测', 'tools-review', '软件与效率工具评测', 10, true),
  ('article', '教程', 'tutorials', '软件使用与技术教程', 20, true),
  ('article', '系统技巧', 'system-tips', '系统优化与实用技巧', 30, true),
  ('article', '应用推荐', 'app-recommendations', '应用精选与推荐', 40, true)
on conflict (kind, slug) do update
set name = excluded.name, description = excluded.description, active = true;

insert into public.tags (name, slug, active)
values
  ('Windows', 'windows', true),
  ('效率', 'efficiency', true),
  ('开源', 'open-source', true),
  ('指南', 'guide', true),
  ('入门', 'beginner', true),
  ('优化', 'optimization', true),
  ('Android', 'android', true),
  ('应用', 'apps', true),
  ('精选', 'featured', true)
on conflict (slug) do update
set name = excluded.name, active = true;

insert into public.articles
  (legacy_id, title, slug, excerpt, content_markdown, category_id, legacy_author, status, featured, created_at, published_at)
values
  ('a1', '2026 必备：Windows 效率工具推荐', '2026-windows-efficiency-tools',
   '十大开源利器，提升你的 Windows 工作效率。',
   E'## 概述\nWindows 拥有众多优秀的免费工具。以下是必装推荐。\n## Everything\nWindows 上最快的文件搜索工具。',
   (select id from public.categories where kind = 'article' and slug = 'tools-review'),
   'OwenFX', 'draft', true, '2026-06-25T00:00:00+08:00', null),
  ('a2', '开源软件指南：从入门到精通', 'open-source-software-guide',
   '教你正确选择和使用开源软件。',
   E'## 为什么选择开源？\n免费、透明、社区驱动。\n## 如何选择\n查看 GitHub Stars、更新频率和文档质量。',
   (select id from public.categories where kind = 'article' and slug = 'tutorials'),
   'OwenFX', 'draft', false, '2026-06-22T00:00:00+08:00', null),
  ('a3', '系统优化：完全指南', 'windows-system-optimization-guide',
   '从启动优化到磁盘清理，完整的 Windows 优化指南。',
   E'## 启动优化\n减少开机自启程序，加快启动速度。\n## 磁盘清理\n定期清理临时文件和系统缓存。',
   (select id from public.categories where kind = 'article' and slug = 'system-tips'),
   'OwenFX', 'draft', false, '2026-06-18T00:00:00+08:00', null),
  ('a4', '2026 最佳 Android 应用', '2026-best-android-apps',
   'Android 平台上效率与娱乐的精选应用推荐。',
   E'## 效率工具\nTasker 和 Solid Explorer 是 Android 必备工具。\n## 娱乐应用\n优秀的媒体和娱乐应用推荐。',
   (select id from public.categories where kind = 'article' and slug = 'app-recommendations'),
   'OwenFX', 'draft', false, '2026-07-01T00:00:00+08:00', null)
on conflict (legacy_id) do update set
  title = excluded.title,
  slug = excluded.slug,
  excerpt = excluded.excerpt,
  content_markdown = excluded.content_markdown,
  category_id = excluded.category_id,
  legacy_author = excluded.legacy_author,
  featured = excluded.featured,
  created_at = excluded.created_at;

insert into public.article_tags (article_id, tag_id)
select a.id, t.id
from (values
  ('a1', 'windows'), ('a1', 'efficiency'), ('a1', 'open-source'),
  ('a2', 'open-source'), ('a2', 'guide'), ('a2', 'beginner'),
  ('a3', 'windows'), ('a3', 'optimization'), ('a3', 'guide'),
  ('a4', 'android'), ('a4', 'apps'), ('a4', 'featured')
) as mapping(legacy_id, tag_slug)
join public.articles a on a.legacy_id = mapping.legacy_id
join public.tags t on t.slug = mapping.tag_slug
on conflict (article_id, tag_id) do nothing;
