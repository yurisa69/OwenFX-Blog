import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { contentEditorAccessError } from '../lib/article-authorization.ts';
import { validateArticleWriteInput } from '../lib/article-input.ts';
import {
  articleMarkdownPath,
  hashMarkdown,
  validateMarkdownImageUrls,
  writeMarkdownFile,
} from '../lib/github-articles.ts';
import { ensureArticleAuditLog, upsertArticleRevision } from '../lib/article-records.ts';
import {
  createArticleSyncJob,
  claimArticleSyncJob,
  updateArticleSyncJob,
  acquireArticleSyncLock,
  releaseArticleSyncLock,
} from '../lib/article-sync.ts';

test('content editor authorization distinguishes unauthenticated and unauthorized users', () => {
  assert.deepEqual(contentEditorAccessError(null, true, null), {
    status: 401,
    error: '请先登录',
  });
  assert.deepEqual(contentEditorAccessError({ id: 'user-1' }, false, null), {
    status: 403,
    error: '没有内容管理权限',
  });
  assert.deepEqual(contentEditorAccessError({ id: 'user-1' }, true, null), null);
  assert.equal(contentEditorAccessError({ id: 'user-1' }, true, new Error('RPC failed')).status, 403);
});

test('article creation accepts a valid draft and normalizes text fields', () => {
  const result = validateArticleWriteInput({
    title: '  测试文章  ',
    slug: 'test-article',
    excerpt: '  摘要  ',
    content_markdown: '正文',
    status: 'draft',
  }, 'create');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    title: '测试文章',
    slug: 'test-article',
    content: '正文',
    excerpt: '摘要',
    status: 'draft',
    expectedBlobSha: null,
  });
});

test('article creation rejects invalid title and slug values', () => {
  assert.deepEqual(validateArticleWriteInput({ title: '', slug: 'valid-slug' }, 'create'), {
    ok: false,
    status: 400,
    error: '标题不能为空且不能超过160字',
  });
  assert.deepEqual(validateArticleWriteInput({ title: '标题', slug: 'Invalid_slug' }, 'create'), {
    ok: false,
    status: 400,
    error: 'Slug 仅允许小写字母、数字和连字符',
  });
});

test('publishing requires body content and rejects oversized articles', () => {
  assert.equal(validateArticleWriteInput({
    title: '标题', slug: 'valid-slug', content_markdown: '   ', status: 'published',
  }, 'create').status, 400);
  assert.equal(validateArticleWriteInput({
    title: '标题', slug: 'valid-slug', content_markdown: 'x'.repeat(500001),
  }, 'create').status, 413);
});

test('article updates require the editor base blob SHA before accepting changes', () => {
  assert.deepEqual(validateArticleWriteInput({
    title: '标题', slug: 'valid-slug', content_markdown: '正文',
  }, 'update'), {
    ok: false,
    status: 428,
    error: '编辑器缺少文章版本标识，请刷新页面后重试。',
  });
  const valid = validateArticleWriteInput({
    title: '标题', slug: 'valid-slug', content_markdown: '正文',
    github_blob_sha: 'base-blob-sha',
  }, 'update');
  assert.equal(valid.ok, true);
  assert.equal(valid.value.expectedBlobSha, 'base-blob-sha');
});

test('article update preserves the existing combined title and slug validation response', () => {
  const result = validateArticleWriteInput({
    title: '标题', slug: 'BAD SLUG', github_blob_sha: 'base-sha',
  }, 'update');
  assert.deepEqual(result, {
    ok: false,
    status: 400,
    error: '请检查标题和 Slug 格式',
  });
});

test('article paths and content hashes are deterministic', () => {
  assert.equal(articleMarkdownPath('sample-article'), 'content/articles/sample-article.md');
  assert.equal(hashMarkdown('hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

test('image validation only accepts configured public R2 URLs', () => {
  const previous = process.env.R2_PUBLIC_BASE_URL;
  try {
    delete process.env.R2_PUBLIC_BASE_URL;
    assert.match(validateMarkdownImageUrls('![图](https://cdn.example.com/a.png)'), /R2_PUBLIC_BASE_URL/);
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com/';
    assert.equal(validateMarkdownImageUrls('![图](https://cdn.example.com/a.png)'), null);
    assert.match(validateMarkdownImageUrls('![图](https://other.example.com/a.png)'), /Cloudflare R2/);
    assert.equal(validateMarkdownImageUrls('没有图片'), null);
  } finally {
    if (previous === undefined) delete process.env.R2_PUBLIC_BASE_URL;
    else process.env.R2_PUBLIC_BASE_URL = previous;
  }
});

test('createArticleSyncJob passes an idempotent operation record to the database RPC', async () => {
  let captured;
  const service = {
    async rpc(name, args) {
      captured = { name, args };
      return { data: { id: args.p_id, state: 'pending' }, error: null };
    },
  };
  const job = await createArticleSyncJob(service, {
    idempotencyKey: 'create:user-1:article.md:hash',
    operation: 'create',
    actorId: 'user-1',
    targetPath: 'content/articles/article.md',
    contentHash: 'hash',
    metadata: { status: 'draft' },
  });
  assert.match(job.id, /^[0-9a-f-]{36}$/i);
  assert.equal(captured.name, 'create_article_sync_job');
  assert.equal(captured.args.p_idempotency_key, 'create:user-1:article.md:hash');
  assert.equal(captured.args.p_operation, 'create');
  assert.equal(captured.args.p_target_path, 'content/articles/article.md');
  assert.deepEqual(captured.args.p_metadata, { status: 'draft' });
});

test('createArticleSyncJob reports RPC errors and invalid RPC responses', async () => {
  await assert.rejects(
    createArticleSyncJob({ rpc: async () => ({ data: null, error: { message: 'database unavailable' } }) }, {
      idempotencyKey: 'key', operation: 'create', targetPath: 'a.md', contentHash: 'hash', metadata: {},
    }),
    /database unavailable/,
  );
  await assert.rejects(
    createArticleSyncJob({ rpc: async () => ({ data: null, error: null }) }, {
      idempotencyKey: 'key', operation: 'create', targetPath: 'a.md', contentHash: 'hash', metadata: {},
    }),
    /未返回有效任务/,
  );
});

test('claimArticleSyncJob returns a lease or null when another worker owns the job', async () => {
  let args;
  const service = { async rpc(name, value) { args = { name, value }; return { data: { id: 'job-1' }, error: null }; } };
  const lease = await claimArticleSyncJob(service, 'job-1');
  assert.equal(args.name, 'claim_article_sync_job');
  assert.equal(args.value.p_id, 'job-1');
  assert.match(lease.leaseToken, /^[0-9a-f-]{36}$/i);
  assert.equal(lease.job.id, 'job-1');
  assert.equal(await claimArticleSyncJob({ rpc: async () => ({ data: null, error: null }) }, 'job-2'), null);
});

test('sync job updates require a valid lease and an accepted state transition', async () => {
  let args;
  await updateArticleSyncJob({
    async rpc(name, value) { args = { name, value }; return { data: true, error: null }; },
  }, 'job-1', 'lease-1', 'completed', { articleId: 'article-1', githubSha: 'commit-1' });
  assert.equal(args.name, 'update_article_sync_job');
  assert.equal(args.value.p_state, 'completed');
  assert.equal(args.value.p_article_id, 'article-1');
  await assert.rejects(
    updateArticleSyncJob({ rpc: async () => ({ data: false, error: null }) }, 'job-1', 'stale', 'completed'),
    /租约已失效/,
  );
});

test('article sync locks report acquisition and release results', async () => {
  const calls = [];
  const service = {
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: true, error: null };
    },
  };
  assert.equal(await acquireArticleSyncLock(service, 'article-1', 'job-1', 'lease-1'), true);
  assert.equal(await releaseArticleSyncLock(service, 'article-1', 'job-1', 'lease-1'), true);
  assert.deepEqual(calls.map(call => call.name), ['acquire_article_sync_lock', 'release_article_sync_lock']);
});

test('GitHub article writes update only when the editor base blob SHA still matches', async t => {
  const oldEnv = {
    token: process.env.GITHUB_TOKEN,
    repository: process.env.GITHUB_REPOSITORY,
    branch: process.env.GITHUB_BRANCH,
  };
  process.env.GITHUB_TOKEN = 'test-token';
  process.env.GITHUB_REPOSITORY = 'yurisa69/OwenFX-Blog';
  process.env.GITHUB_BRANCH = 'main';
  const calls = [];
  const fetchMock = mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', headers: init.headers, body: init.body });
    if (!init.method) {
      return new Response(JSON.stringify({
        sha: 'blob-current',
        encoding: 'base64',
        content: Buffer.from('previous body').toString('base64'),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      content: { sha: 'blob-next' },
      commit: { sha: 'commit-next' },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  t.after(() => {
    fetchMock.mock.restore();
    if (oldEnv.token === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = oldEnv.token;
    if (oldEnv.repository === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = oldEnv.repository;
    if (oldEnv.branch === undefined) delete process.env.GITHUB_BRANCH; else process.env.GITHUB_BRANCH = oldEnv.branch;
  });

  const result = await writeMarkdownFile(
    'content/articles/sample.md',
    'new body',
    'Update article',
    { expectedBlobSha: 'blob-current' },
  );
  assert.deepEqual(result, {
    path: 'content/articles/sample.md',
    blobSha: 'blob-next',
    commitSha: 'commit-next',
    previousContent: 'previous body',
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[1].method, 'PUT');
  const body = JSON.parse(calls[1].body);
  assert.equal(body.sha, 'blob-current');
  assert.equal(body.branch, 'main');
  assert.equal(Buffer.from(body.content, 'base64').toString('utf8'), 'new body');
});

test('GitHub article writes reject stale blob SHAs before attempting a PUT', async t => {
  const oldToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'test-token';
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    sha: 'blob-newer',
    encoding: 'base64',
    content: Buffer.from('newer body').toString('base64'),
  }), { status: 200, headers: { 'content-type': 'application/json' } }));
  t.after(() => {
    fetchMock.mock.restore();
    if (oldToken === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = oldToken;
  });
  await assert.rejects(
    writeMarkdownFile('content/articles/sample.md', 'stale body', 'Update', { expectedBlobSha: 'blob-old' }),
    /版本已在其他位置更新/,
  );
  assert.equal(fetchMock.mock.callCount(), 1);
});

function createArticleRecordService({
  revisionLookup = { data: null, error: null },
  auditLookup = { data: null, error: null },
  writeError = null,
} = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      const state = { table, action: 'select', filters: [], values: null };
      const builder = {
        select(columns) { state.columns = columns; return this; },
        eq(column, value) { state.filters.push(['eq', column, value]); return this; },
        contains(column, value) { state.filters.push(['contains', column, value]); return this; },
        maybeSingle() {
          calls.push({ ...state });
          return Promise.resolve(table === 'article_revisions' ? revisionLookup : auditLookup);
        },
        update(values) { state.action = 'update'; state.values = values; return this; },
        insert(values) {
          state.action = 'insert';
          state.values = values;
          calls.push({ ...state });
          return Promise.resolve({ error: writeError });
        },
        then(resolve, reject) {
          calls.push({ ...state });
          return Promise.resolve({ error: writeError }).then(resolve, reject);
        },
      };
      return builder;
    },
  };
}

const sampleRevision = {
  article_id: 'article-1',
  editor_id: 'editor-1',
  title: '测试文章',
  excerpt: '摘要',
  content_markdown: '',
  github_path: 'content/articles/test.md',
  github_sha: 'commit-1',
  content_hash: 'hash-1',
  sync_job_id: 'job-1',
};

const sampleAudit = {
  actor_id: 'editor-1',
  action: 'article.publish',
  entity_type: 'article',
  entity_id: 'article-1',
  details: {
    sync_job_id: 'job-1',
    storage: 'github',
    github_path: 'content/articles/test.md',
    github_sha: 'commit-1',
  },
};

test('article revision persistence inserts a new revision for a new sync job', async () => {
  const service = createArticleRecordService();
  await upsertArticleRevision(service, sampleRevision);
  assert.equal(service.calls.length, 2);
  assert.equal(service.calls[0].table, 'article_revisions');
  assert.equal(service.calls[0].action, 'select');
  assert.equal(service.calls[1].action, 'insert');
  assert.deepEqual(service.calls[1].values, sampleRevision);
});

test('article revision persistence updates the existing revision for an idempotent retry', async () => {
  const service = createArticleRecordService({ revisionLookup: { data: { id: 'revision-1' }, error: null } });
  await upsertArticleRevision(service, sampleRevision);
  assert.equal(service.calls[1].action, 'update');
  assert.deepEqual(service.calls[1].filters, [['eq', 'id', 'revision-1']]);
});

test('article revision persistence reports lookup and write failures', async () => {
  const lookupFailure = createArticleRecordService({
    revisionLookup: { data: null, error: { message: 'revision lookup failed' } },
  });
  await assert.rejects(upsertArticleRevision(lookupFailure, sampleRevision), /revision lookup failed/);

  const writeFailure = createArticleRecordService({ writeError: { message: 'revision write failed' } });
  await assert.rejects(upsertArticleRevision(writeFailure, sampleRevision), /版本索引写入失败/);
});

test('audit log persistence avoids duplicate entries for the same sync job', async () => {
  const service = createArticleRecordService({ auditLookup: { data: { id: 'audit-1' }, error: null } });
  await ensureArticleAuditLog(service, sampleAudit);
  assert.equal(service.calls.length, 1);
  assert.equal(service.calls[0].table, 'audit_logs');
  assert.equal(service.calls[0].action, 'select');
});

test('audit log persistence inserts a record when the sync job has no audit entry', async () => {
  const service = createArticleRecordService();
  await ensureArticleAuditLog(service, sampleAudit);
  assert.equal(service.calls.length, 2);
  assert.equal(service.calls[1].action, 'insert');
  assert.deepEqual(service.calls[1].values, sampleAudit);
});
