import { createHash } from 'node:crypto';

type GitHubContentResponse = {
  sha: string;
  content: string;
  encoding: string;
};

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || 'yurisa69/OwenFX-Blog';
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token) throw new Error('缺少 GITHUB_TOKEN，暂时无法保存文章正文');
  const [owner, repo] = repository.split('/');
  if (!owner || !repo || repository.split('/').length !== 2) {
    throw new Error('GITHUB_REPOSITORY 必须采用 owner/repository 格式');
  }
  return { token, owner, repo, branch };
}

function apiUrl(path: string) {
  const { owner, repo } = getConfig();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
}

async function githubRequest(url: string, init: RequestInit = {}) {
  const { token } = getConfig();
  const response = await fetch(url, {
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
  return response;
}

export async function readMarkdownFile(path: string): Promise<{ content: string; sha: string } | null> {
  const response = await githubRequest(`${apiUrl(path)}?ref=${encodeURIComponent(getConfig().branch)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`读取 GitHub 文章失败（HTTP ${response.status}）`);
  const file = await response.json() as GitHubContentResponse;
  if (file.encoding !== 'base64' || typeof file.content !== 'string') {
    throw new Error('GitHub 返回的文章文件格式不受支持');
  }
  return { content: Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8'), sha: file.sha };
}

export async function writeMarkdownFile(path: string, content: string, message: string) {
  const existing = await readMarkdownFile(path);
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
  const sha = result.content?.sha;
  const commitSha = result.commit?.sha;
  if (!sha || !commitSha) throw new Error('GitHub 已响应，但没有返回文件或提交 SHA');
  return { path, blobSha: sha, commitSha, previousContent: existing?.content ?? null };
}

export function hashMarkdown(content: string) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function articleMarkdownPath(slug: string) {
  return `content/articles/${slug}.md`;
}
