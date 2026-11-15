import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARTICLE_NUMBERING_EFFECTIVE_AT,
  getArticleNumberingPublishError,
  getArticleNumberingEditorIssues,
  getArticleNumberingUpdateError,
  getArticleNumberingRevisionRestoreError,
  validateArticleNumbering,
} from '../lib/article-numbering.ts';

test('accepts Chinese major steps and Arabic substeps that reset per section', () => {
  const markdown = [
    '# 文章标题',
    '',
    '## 一. 项目与部署方案',
    '',
    '### 1. 确定部署架构',
    '',
    '### 2. 规划服务端口',
    '',
    '## 二. 环境准备',
    '',
    '### 1. 检查系统版本',
    '',
    '### 2. 更新软件包',
    '',
    '## 总结',
  ].join('\n');
  assert.deepEqual(validateArticleNumbering(markdown), []);
});

test('rejects Arabic numbering on a major step', () => {
  const issues = validateArticleNumbering('## 1. 项目与部署方案');
  assert.equal(issues.length, 1);
  assert.equal(issues[0].line, 1);
  assert.match(issues[0].message, /中文数字/);
});

test('rejects an unnumbered major step', () => {
  const issues = validateArticleNumbering('## 环境准备');
  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /一级大步骤/);
});

test('checks major step sequence and supports Chinese numbers above ten', () => {
  const markdown = ['## 一. 第一部分', '## 三. 第二部分', '## 十一. 第三部分'].join('\n');
  const issues = validateArticleNumbering(markdown);
  assert.equal(issues.length, 2);
  assert.match(issues[0].message, /应按顺序编号为「2」/);
  assert.match(issues[1].message, /应按顺序编号为「3」/);
});

test('requires Arabic substep numbering and detects gaps', () => {
  const markdown = [
    '## 一. 环境准备',
    '### 检查系统版本',
    '### 3. 更新软件包',
  ].join('\n');
  const issues = validateArticleNumbering(markdown);
  assert.equal(issues.length, 2);
  assert.match(issues[0].message, /阿拉伯数字/);
  assert.match(issues[1].message, /应从「2」开始/);
});

test('resets substep numbering under each new major step', () => {
  const markdown = [
    '## 一. 环境准备',
    '### 1. 检查系统版本',
    '## 二. 安装服务',
    '### 2. 安装 Docker',
  ].join('\n');
  const issues = validateArticleNumbering(markdown);
  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /应从「1」开始/);
});

test('does not require numbering for structural headings', () => {
  const markdown = [
    '## 前言',
    '### 背景说明',
    '## 一. 正式步骤',
    '### 1. 执行安装',
    '## 总结',
  ].join('\n');
  assert.deepEqual(validateArticleNumbering(markdown), []);
});

test('warns against numbered headings below the substep level', () => {
  const issues = validateArticleNumbering([
    '## 一. 环境准备',
    '### 1. 检查环境',
    '#### 1.1 检查系统版本',
  ].join('\n'));
  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /无序列表/);
});

test('ignores headings inside fenced code blocks', () => {
  const markdown = [
    '\x60\x60\x60markdown',
    '## 1. 这是代码示例',
    '### 1. 这不是实际标题',
    '\x60\x60\x60',
    '## 一. 正式步骤',
    '### 1. 检查环境',
  ].join('\n');
  assert.deepEqual(validateArticleNumbering(markdown), []);
});

test('reports a substep that is not attached to a major step', () => {
  const issues = validateArticleNumbering('### 1. 独立小步骤');
  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /必须归属于/);
});


test('allows drafts to be saved even when numbering is not compliant', () => {
  assert.equal(getArticleNumberingPublishError('draft', '## 1. 未完成的步骤'), null);
});

test('allows publishing when all step numbering is compliant', () => {
  const markdown = ['## 一. 环境准备', '### 1. 检查系统', '## 总结'].join('\n');
  assert.equal(getArticleNumberingPublishError('published', markdown), null);
});

test('rejects publishing with a structured list of numbering issues', () => {
  const result = getArticleNumberingPublishError('published', [
    '## 1. 环境准备',
    '### 1. 检查系统',
  ].join('\n'));
  assert.equal(result.error, '文章编号不符合规范，请修正后再发布。');
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].line, 1);
});

test('allows restoring a non-compliant revision created before the policy took effect', () => {
  assert.equal(
    getArticleNumberingRevisionRestoreError('published', '## 1. 历史大步骤', '2026-11-14T17:34:10Z'),
    null,
  );
});

test('enforces numbering when restoring a revision created after the policy took effect', () => {
  const result = getArticleNumberingRevisionRestoreError('published', '## 1. 新版大步骤', '2026-11-14T19:04:41Z');
  assert.equal(result.error, '文章编号不符合规范，请修正后再发布。');
});

test('enforces numbering when a revision timestamp is missing or invalid', () => {
  for (const createdAt of [null, undefined, 'not-a-date']) {
    const result = getArticleNumberingRevisionRestoreError('published', '## 1. 无法确认时间的版本', createdAt);
    assert.equal(result.error, '文章编号不符合规范，请修正后再发布。');
  }
});

test('allows restoring a draft revision without numbering validation', () => {
  assert.equal(
    getArticleNumberingRevisionRestoreError('draft', '## 1. 草稿章节', '2026-11-15T00:00:00Z'),
    null,
  );
});

test('records the verified policy effective timestamp', () => {
  assert.equal(ARTICLE_NUMBERING_EFFECTIVE_AT, '2026-11-14T19:04:41.000Z');
});


test('hides numbering warnings for an unchanged pre-policy article in the editor', () => {
  const legacy = '## 1. 项目与部署方案\\n\\n### 本文部署结构';
  assert.deepEqual(getArticleNumberingEditorIssues(legacy, '2026-11-14T17:34:10Z', legacy), []);
});

test('shows numbering warnings after editing a pre-policy article body', () => {
  const legacy = '## 1. 项目与部署方案';
  assert.equal(getArticleNumberingEditorIssues(legacy + '\\n\\n新增内容', '2026-11-14T17:34:10Z', legacy).length, 1);
});

test('allows unchanged historical article republishing but validates changed content', () => {
  const legacy = '## 1. 项目与部署方案';
  assert.equal(getArticleNumberingUpdateError('published', legacy, '2026-11-14T17:34:10Z', 'same-hash', 'same-hash'), null);
  assert.equal(getArticleNumberingUpdateError('published', legacy + '\\n修改', '2026-11-14T17:34:10Z', 'old-hash', 'new-hash').error, '文章编号不符合规范，请修正后再发布。');
});

test('always validates post-policy articles and does not grandfather unknown timestamps', () => {
  const legacy = '## 1. 项目与部署方案';
  for (const publishedAt of ['2026-11-14T19:04:41Z', null, 'invalid']) {
    assert.equal(getArticleNumberingUpdateError('published', legacy, publishedAt, 'same-hash', 'same-hash').error, '文章编号不符合规范，请修正后再发布。');
  }
});

test('draft updates do not run numbering publish validation', () => {
  assert.equal(getArticleNumberingUpdateError('draft', '## 1. Draft', null, null, 'hash'), null);
});
