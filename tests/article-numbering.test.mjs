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

const effectiveAt = '2026-11-15T18:29:54.000Z';
const legacyTimestamp = '2026-11-15T18:29:53Z';

test('accepts article title, H1 major steps, H2 substeps and H3 numbered details', () => {
  const markdown = [
    '# Uptime Kuma 部署教程',
    '',
    '# 一、项目与部署方案',
    '',
    '## 1. 确定部署架构',
    '',
    '### 1. 确认服务组件',
    '',
    '### 2. 规划服务端口',
    '',
    '## 2. 确定部署方式',
    '',
    '### 1. 选择部署方式',
    '',
    '# 二、环境准备',
    '',
    '## 1. 检查系统版本',
    '',
    '### 1. 查看系统信息',
    '',
    '## 总结',
  ].join('\n');
  assert.deepEqual(validateArticleNumbering(markdown), []);
});

test('accepts a numbered H1 as the first heading when the article title is metadata-only', () => {
  assert.deepEqual(validateArticleNumbering([
    '# 一、环境准备',
    '## 1. 检查系统',
    '### 1. 查看系统版本',
  ].join('\n')), []);
});

test('rejects old H2 major-step format and requires H1 major steps', () => {
  const issues = validateArticleNumbering([
    '# 文章标题',
    '## 一. 项目与部署方案',
  ].join('\n'));
  assert.equal(issues.length, 1);
  assert.equal(issues[0].level, 2);
  assert.match(issues[0].message, /必须归属于一个一级大步骤/);
});

test('rejects Arabic or incorrectly punctuated major steps', () => {
  for (const heading of ['# 1. 环境准备', '# 一. 环境准备', '# 环境准备']) {
    const issues = validateArticleNumbering(['# 文章标题', heading].join('\n'));
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /H1 和中文数字加顿号/);
  }
});

test('checks H1 major-step sequence and supports Chinese numbers above ten', () => {
  const markdown = [
    '# 文章标题',
    '# 一、第一部分',
    '# 三、第二部分',
    '# 十一、第三部分',
  ].join('\n');
  const issues = validateArticleNumbering(markdown);
  assert.equal(issues.length, 2);
  assert.match(issues[0].message, /应按顺序编号为「2」/);
  assert.match(issues[1].message, /应按顺序编号为「3」/);
});

test('requires Arabic H2 numbering and detects missing numbers and gaps', () => {
  const markdown = [
    '# 文章标题',
    '# 一、环境准备',
    '## 检查系统版本',
    '## 3. 更新软件包',
  ].join('\n');
  const issues = validateArticleNumbering(markdown);
  assert.equal(issues.length, 2);
  assert.match(issues[0].message, /二级步骤应使用阿拉伯数字/);
  assert.match(issues[1].message, /应从「2」开始/);
});

test('requires Arabic H3 numbering and detects missing numbers and gaps', () => {
  const markdown = [
    '# 文章标题',
    '# 一、环境准备',
    '## 1. 检查系统',
    '### 检查系统版本',
    '### 3. 查看磁盘空间',
  ].join('\n');
  const issues = validateArticleNumbering(markdown);
  assert.equal(issues.length, 2);
  assert.match(issues[0].message, /三级标题应使用阿拉伯数字/);
  assert.match(issues[1].message, /应从「2」开始/);
});

test('resets H2 numbering under each new H1 and H3 numbering under each new H2', () => {
  const markdown = [
    '# 文章标题',
    '# 一、环境准备',
    '## 1. 检查系统',
    '### 1. 查看系统版本',
    '### 2. 检查磁盘空间',
    '## 2. 准备配置',
    '### 1. 创建配置文件',
    '# 二、安装服务',
    '## 1. 安装 Docker',
    '### 1. 验证安装',
  ].join('\n');
  assert.deepEqual(validateArticleNumbering(markdown), []);
});

test('requires H2 and H3 headings to belong to their parent levels', () => {
  const h2Issues = validateArticleNumbering('## 1. 孤立的二级标题');
  assert.equal(h2Issues.length, 1);
  assert.match(h2Issues[0].message, /必须归属于一个一级大步骤/);

  const h3Issues = validateArticleNumbering([
    '# 文章标题',
    '# 一、环境准备',
    '### 1. 孤立的三级标题',
  ].join('\n'));
  assert.equal(h3Issues.length, 1);
  assert.match(h3Issues[0].message, /必须归属于一个二级标题/);
});

test('does not require numbering for structural headings', () => {
  const markdown = [
    '# 前言',
    '# 一、正式步骤',
    '## 1. 执行安装',
    '### 1. 验证安装',
    '## 总结',
    '### 官方资料',
  ].join('\n');
  assert.deepEqual(validateArticleNumbering(markdown), []);
});

test('warns against numbered headings below H3', () => {
  const issues = validateArticleNumbering([
    '# 文章标题',
    '# 一、环境准备',
    '## 1. 检查环境',
    '### 1. 检查系统',
    '#### 1.1 检查系统版本',
  ].join('\n'));
  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /四级及以下内容/);
});

test('ignores headings inside fenced code blocks', () => {
  const markdown = [
    '```markdown',
    '# 一、这是代码示例',
    '## 1. 这不是实际标题',
    '### 1. 这也不是实际标题',
    '```',
    '# 文章标题',
    '# 一、正式步骤',
    '## 1. 检查环境',
    '### 1. 查看状态',
  ].join('\n');
  assert.deepEqual(validateArticleNumbering(markdown), []);
});

test('allows drafts to be saved even when numbering is not compliant', () => {
  assert.equal(getArticleNumberingPublishError('draft', '# 1. 未完成的步骤'), null);
});

test('allows publishing when all heading levels are compliant', () => {
  const markdown = [
    '# 文章标题',
    '# 一、环境准备',
    '## 1. 检查系统',
    '### 1. 查看系统版本',
    '## 总结',
  ].join('\n');
  assert.equal(getArticleNumberingPublishError('published', markdown), null);
});

test('rejects publishing with a structured list of numbering issues', () => {
  const result = getArticleNumberingPublishError('published', [
    '# 文章标题',
    '## 1. 旧版大步骤',
  ].join('\n'));
  assert.equal(result.error, '文章编号不符合规范，请修正后再发布。');
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].level, 2);
});

test('allows restoring a non-compliant revision created before the revised policy took effect', () => {
  assert.equal(
    getArticleNumberingRevisionRestoreError('published', '## 1. 历史大步骤', legacyTimestamp),
    null,
  );
});

test('enforces the revised hierarchy when restoring a revision created after the policy took effect', () => {
  const result = getArticleNumberingRevisionRestoreError('published', '## 1. 新版大步骤', effectiveAt);
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
    getArticleNumberingRevisionRestoreError('draft', '## 1. 草稿章节', effectiveAt),
    null,
  );
});

test('records the revised policy effective timestamp', () => {
  assert.equal(ARTICLE_NUMBERING_EFFECTIVE_AT, effectiveAt);
});

test('hides numbering warnings for an unchanged pre-policy article in the editor', () => {
  const legacy = '## 1. 项目与部署方案\n\n### 本文部署结构';
  assert.deepEqual(getArticleNumberingEditorIssues(legacy, legacyTimestamp, legacy), []);
});

test('shows numbering warnings after editing a pre-policy article body', () => {
  const legacy = '## 1. 项目与部署方案';
  assert.equal(getArticleNumberingEditorIssues(legacy + '\n\n新增内容', legacyTimestamp, legacy).length, 1);
});

test('allows unchanged historical article republishing but validates changed content', () => {
  const legacy = '## 1. 项目与部署方案';
  assert.equal(getArticleNumberingUpdateError('published', legacy, legacyTimestamp, 'same-hash', 'same-hash'), null);
  assert.equal(getArticleNumberingUpdateError('published', legacy + '\n修改', legacyTimestamp, 'old-hash', 'new-hash').error, '文章编号不符合规范，请修正后再发布。');
});

test('always validates post-policy articles and does not grandfather unknown timestamps', () => {
  const legacy = '## 1. 项目与部署方案';
  for (const publishedAt of [effectiveAt, null, 'invalid']) {
    assert.equal(getArticleNumberingUpdateError('published', legacy, publishedAt, 'same-hash', 'same-hash').error, '文章编号不符合规范，请修正后再发布。');
  }
});

test('draft updates do not run numbering publish validation', () => {
  assert.equal(getArticleNumberingUpdateError('draft', '## 1. Draft', null, null, 'hash'), null);
});
