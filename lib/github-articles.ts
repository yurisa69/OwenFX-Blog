import { createHash } from 'node:crypto';

type GitHubContentResponse = {
  sha: string;
  content: string;
  encoding: string;
};

function getRepositoryConfig() {
  const repository = process.env.GITHUB_REPOSITORY || 'yurisa69/OwenFX-Blog';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const [owner, repo] = repository.split('/');
  if (!owner || !repo || repository.split('/').length !== 2) {
    throw new Error('GITHUB_REPOSITORY 必须采用 owner/repository 格式');
  }
  return { owner, repo, branch };
}

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('缺少 GITHUB_TOKEN，暂时无法保存文章正文');
  return { ...getRepositoryConfig(), token };
}

function apiUrl(path: string) {
  const { owner, repo } = getConfig();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
}

async function githubRequest(url: string, init: RequestInit = {}) {
  const { token } = getConfig();
  return fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

export async function readMarkdownFileFresh(path: string, ref?: string): Promise<{ content: string; sha: string } | null> {
  const { owner, repo, branch } = getRepositoryConfig();
  const targetRef = ref || branch;

  if (process.env.GITHUB_TOKEN) {
    const response = await githubRequest(`${apiUrl(path)}?ref=${encodeURIComponent(targetRef)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`读取 GitHub 文章失败（HTTP ${response.status}）`);
    const file = await response.json() as GitHubContentResponse;
    if (file.encoding !== 'base64' || typeof file.content !== 'string') {
      throw new Error('GitHub 返回的文章文件格式不受支持');
    }
    return { content: Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8'), sha: file.sha };
  }

  // The OwenFX repository is public, so public article rendering can read raw
  // Markdown without a write token. Writes and revision deletes still require GITHUB_TOKEN.
  const rawPath = path.split('/').map(encodeURIComponent).join('/');
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(targetRef)}/${rawPath}`;
  const response = await fetch(rawUrl, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`读取公开 GitHub 文章失败（HTTP ${response.status}）`);
  return { content: await response.text(), sha: '' };
}

export async function readMarkdownFile(path: string, ref?: string): Promise<{ content: string; sha: string } | null> {
  const { owner, repo, branch } = getRepositoryConfig();
  const targetRef = ref || branch;
  const rawPath = path.split('/').map(encodeURIComponent).join('/');
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(targetRef)}/${rawPath}`;
  const response = await fetch(rawUrl, {
    next: { revalidate: 300, tags: ['github-articles'] },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`读取公开 GitHub 文章失败（HTTP ${response.status}）`);
  return { content: await response.text(), sha: '' };
}

export async function writeMarkdownFile(path: string, content: string, message: string) {
  const existing = await readMarkdownFileFresh(path);
  const { branch } = getConfig();
  const response = await githubRequest(apiUrl(path), {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(details.message || `写入 GitHub 文章失败（HTTP ${response.status}）`);
  }
  const result = await response.json() as { content?: { sha?: string }; commit?: { sha?: string } };
  const blobSha = result.content?.sha;
  const commitSha = result.commit?.sha;
  if (!blobSha || !commitSha) throw new Error('GitHub 已响应，但没有返回文件或提交 SHA');
  return { path, blobSha, commitSha, previousContent: existing?.content ?? null };
}

export async function deleteMarkdownFile(path: string, sha: string, message: string) {
  const response = await githubRequest(apiUrl(path), {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: getConfig().branch }),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`删除旧 GitHub 文章文件失败（HTTP ${response.status}）`);
  }
}

export function hashMarkdown(content: string) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function articleMarkdownPath(slug: string) {
  return `content/articles/${slug}.md`;
}

export function validateMarkdownImageUrls(content: string) {
  const urls = [...content.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^ )]+)\)/g)].map(match => match[2]);
  if (!urls.length) return null;
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  if (!publicBase) return '文章包含图片，但 R2_PUBLIC_BASE_URL 尚未配置';
  if (urls.some(url => !url.startsWith(publicBase + '/'))) {
    return '文章图片必须先上传到 Cloudflare R2，再插入 R2 图片地址';
  }
  return null;
}
