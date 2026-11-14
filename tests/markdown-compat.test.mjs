import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from '../lib/markdown.ts';

test('preserves legacy soft line breaks in paragraphs', () => {
  const html = markdownToHtml('第一行\n第二行');
  assert.match(html, /第一行<br>\s*第二行/);
});

test('wraps GFM tables for horizontal scrolling', () => {
  const html = markdownToHtml('| 名称 | 说明 |\n| --- | --- |\n| A | B |');
  assert.match(html, /<div class="article-table-wrap"><table>/);
  assert.match(html, /<th>名称<\/th>/);
});

test('supports legacy image dimensions together with title', () => {
  const html = markdownToHtml('![示例](https://example.com/image.png =800x600 "图片标题")');
  assert.match(html, /width="800"/);
  assert.match(html, /height="600"/);
  assert.match(html, /title="图片标题"/);
  assert.match(html, /class="article-markdown-image"/);
});

test('retains standard image titles without forced dimensions', () => {
  const html = markdownToHtml('![示例](https://example.com/image.png "标准标题")');
  assert.match(html, /title="标准标题"/);
  assert.doesNotMatch(html, /width="/);
});

test('does not reinterpret image syntax inside fenced code', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const html = markdownToHtml(fence + 'md\n![示例](https://example.com/image.png =800x600 "标题")\n' + fence);
  assert.match(html, /language-md/);
  assert.match(html, /=800x600/);
  assert.doesNotMatch(html, /<img/);
});

test('supports GFM task lists and strikethrough', () => {
  const html = markdownToHtml('- [x] 已完成\n- [ ] 待处理\n\n~~删除线~~');
  assert.match(html, /class="task-list-item"/);
  assert.match(html, /<del>删除线<\/del>/);
});

test('highlights known code languages and safely handles unknown languages', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const known = markdownToHtml(fence + 'javascript\nconst answer = 42;\n' + fence);
  assert.match(known, /class="[^"]*hljs[^"]*language-javascript/);
  assert.match(known, /data-language="javascript"/);
  const unknown = markdownToHtml(fence + 'madeup-language\nplain text\n' + fence);
  assert.match(unknown, /data-language="madeup-language"/);
  assert.match(unknown, /plain text/);
});

test('does not emit unsafe javascript URLs', () => {
  const html = markdownToHtml('[bad](javascript:alert(1))');
  assert.doesNotMatch(html, /href="javascript:/i);
});

test('keeps image sizing out of inline code', () => {
  const tick = String.fromCharCode(96);
  const html = markdownToHtml(tick + '![示例](https://example.com/image.png =800x600)' + tick);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /=800x600/);
});
