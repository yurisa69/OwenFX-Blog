import test from 'node:test';
import assert from 'node:assert/strict';
import { getArticleNumberingPublishError, validateArticleNumbering } from '../lib/article-numbering.ts';

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
