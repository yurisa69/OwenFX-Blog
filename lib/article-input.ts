export type ArticleWriteInput = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published';
  expectedBlobSha: string | null;
};

export type ArticleInputValidation =
  | { ok: true; value: ArticleWriteInput }
  | { ok: false; status: number; error: string };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateArticleWriteInput(
  input: unknown,
  mode: 'create' | 'update',
): ArticleInputValidation {
  const value = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};

  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const slug = typeof value.slug === 'string' ? value.slug.trim() : '';
  const content = typeof value.content_markdown === 'string' ? value.content_markdown : '';
  const excerpt = typeof value.excerpt === 'string' ? value.excerpt.trim().slice(0, 300) : '';
  const status = value.status === 'published' ? 'published' : 'draft';
  const expectedBlobSha = typeof value.github_blob_sha === 'string' && value.github_blob_sha.length > 0
    ? value.github_blob_sha
    : null;

  if (mode === 'update' && !expectedBlobSha) {
    return { ok: false, status: 428, error: '编辑器缺少文章版本标识，请刷新页面后重试。' };
  }

  if (mode === 'create') {
    if (!title || title.length > 160) {
      return { ok: false, status: 400, error: '标题不能为空且不能超过160字' };
    }
    if (!slugPattern.test(slug) || slug.length > 180) {
      return { ok: false, status: 400, error: 'Slug 仅允许小写字母、数字和连字符' };
    }
  } else if (!title || title.length > 160 || !slugPattern.test(slug) || slug.length > 180) {
    return { ok: false, status: 400, error: '请检查标题和 Slug 格式' };
  }

  if (status === 'published' && !content.trim()) {
    return { ok: false, status: 400, error: '发布前请先填写文章正文' };
  }
  if (content.length > 500000) {
    return { ok: false, status: 413, error: '文章内容过大' };
  }

  return {
    ok: true,
    value: { title, slug, content, excerpt, status, expectedBlobSha },
  };
}
