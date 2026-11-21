import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from '../lib/markdown.ts';

test('preserves legacy soft line breaks in paragraphs', async () => {
  const html = await markdownToHtml('第一行\n第二行');
  assert.match(html, /第一行<br>\s*第二行/);
});

test('wraps GFM tables for horizontal scrolling', async () => {
  const html = await markdownToHtml('| 名称 | 说明 |\n| --- | --- |\n| A | B |');
  assert.match(html, /<div class="article-table-wrap"><table>/);
  assert.match(html, /<th>名称<\/th>/);
});

test('supports legacy image dimensions together with title', async () => {
  const html = await markdownToHtml('![示例](https://example.com/image.png =800x600 "图片标题")');
  assert.match(html, /width="800"/);
  assert.match(html, /height="600"/);
  assert.match(html, /title="图片标题"/);
  assert.match(html, /class="article-markdown-image"/);
});

test('retains standard image titles without forced dimensions', async () => {
  const html = await markdownToHtml('![示例](https://example.com/image.png "标准标题")');
  assert.match(html, /title="标准标题"/);
  assert.doesNotMatch(html, /width="/);
});

test('does not reinterpret image syntax inside fenced code', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const html = await markdownToHtml(fence + 'md\n![示例](https://example.com/image.png =800x600 "标题")\n' + fence);
  assert.match(html, /language-markdown/);
  assert.match(html, /=800x600/);
  assert.doesNotMatch(html, /<img/);
});

test('supports GFM task lists and strikethrough', async () => {
  const html = await markdownToHtml('- [x] 已完成\n- [ ] 待处理\n\n~~删除线~~');
  assert.match(html, /class="task-list-item"/);
  assert.match(html, /<del>删除线<\/del>/);
});

test('highlights known code languages and safely handles unknown languages', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const known = await markdownToHtml(fence + 'javascript\nconst answer = 42;\n' + fence);
  assert.match(known, /class="shiki dracula"/i);
  assert.match(known, /class="language-javascript"/);
  assert.match(known, /data-language="javascript"/);
  const unknown = await markdownToHtml(fence + 'madeup-language\nplain text\n' + fence);
  assert.match(unknown, /data-language="madeup-language"/);
  assert.match(unknown, /plain text/);
});

test('highlights the supported language set with the Dracula theme', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const languages = [
    'bash', 'javascript', 'typescript', 'jsx', 'tsx', 'python', 'html', 'css',
    'json', 'sql', 'yaml', 'markdown', 'java', 'go', 'rust',
  ];

  for (const language of languages) {
    const html = await markdownToHtml(fence + language + '\nconst answer = 42;\n' + fence);
    assert.match(html, /class="shiki dracula"/i, language + ' should use the Dracula theme');
    assert.match(html, new RegExp('class="language-' + language + '"'));
    assert.match(html, /<span[^>]*style="color:/i, language + ' should contain highlighted tokens');
    assert.match(html, new RegExp('data-language="' + language + '"'));
  }
});

test('maps plaintext aliases to Shiki text and retains a plain-text label', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const html = await markdownToHtml(fence + 'plaintext\nplain text\n' + fence);
  assert.match(html, /class="shiki dracula"/i);
  assert.match(html, /class="language-text"/);
  assert.match(html, /data-language="text"/);
  assert.match(html, /plain text/);
});

test('does not emit unsafe javascript URLs', async () => {
  const html = await markdownToHtml('[bad](javascript:alert(1))');
  assert.doesNotMatch(html, /href="javascript:/i);
});

test('keeps image sizing out of inline code', async () => {
  const tick = String.fromCharCode(96);
  const html = await markdownToHtml(tick + '![示例](https://example.com/image.png =800x600)' + tick);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /=800x600/);
});

test('renders footnotes with working reference and return anchors', async () => {
  const html = await markdownToHtml(['正文[^1]', '', '[^1]: 脚注内容'].join('\n'));
  assert.match(html, /href="#user-content-fn-1"/);
  assert.match(html, /id="user-content-fnref-1"/);
  assert.match(html, /id="user-content-fn-1"/);
  assert.match(html, /href="#user-content-fnref-1"/);
  assert.match(html, /脚注内容/);
});

test('preserves nested unordered list structure', async () => {
  const html = await markdownToHtml(['- 父项', '  - 子项', '    - 孙项'].join('\n'));
  assert.match(html, /<li>父项\s*<ul>\s*<li>子项\s*<ul>\s*<li>孙项<\/li>/);
});

test('supports GFM bare URL and angle-bracket autolinks', async () => {
  const html = await markdownToHtml('访问 https://example.com 或 <https://example.org>');
  assert.match(html, /<a href="https:\/\/example\.com"/);
  assert.match(html, /<a href="https:\/\/example\.org"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('supports Setext heading levels', async () => {
  const html = await markdownToHtml(['一级标题', '========', '', '二级标题', '--------'].join('\n'));
  assert.match(html, /<h1>一级标题<\/h1>/);
  assert.match(html, /<h2>二级标题<\/h2>/);
});

test('removes only the matching leading article title heading', async () => {
  const matching = await markdownToHtml(['# 文章标题', '', '正文'].join('\n'), { articleTitle: '文章标题' });
  assert.doesNotMatch(matching, /<h1>/);
  assert.match(matching, /<p>正文<\/p>/);

  const different = await markdownToHtml(['# 其他标题', '', '正文'].join('\n'), { articleTitle: '文章标题' });
  assert.match(different, /<h1>其他标题<\/h1>/);
});

test('removes supported download-link lines without removing surrounding content', async () => {
  const source = [
    '正文保留',
    '**官方下载** https://example.com/download',
    '[下载](https://example.com/file.zip)',
    '结尾保留',
  ].join('\n');
  const html = await markdownToHtml(source, { removeDownloadLinks: true });
  assert.match(html, /正文保留/);
  assert.match(html, /结尾保留/);
  assert.doesNotMatch(html, /example\.com/);
});

test('sanitizes unsafe image URLs while retaining safe image URLs', async () => {
  const unsafe = await markdownToHtml('![危险图片](javascript:alert(1))');
  assert.match(unsafe, /<img/);
  assert.doesNotMatch(unsafe, /src=/i);

  const safe = await markdownToHtml('![安全图片](https://example.com/image.png)');
  assert.match(safe, /src="https:\/\/example\.com\/image\.png"/);
});

test('preserves Unicode circled Arabic numerals in H3 headings as plain text', async () => {
  const html = await markdownToHtml([
    '# 文章标题',
    '',
    '# 一、环境准备',
    '',
    '## 1. 检查服务器',
    '',
    '### ① 查看系统状态',
    '',
    '### ② 检查磁盘空间',
  ].join('\n'));
  assert.match(html, /<h3>① 查看系统状态<\/h3>/);
  assert.match(html, /<h3>② 检查磁盘空间<\/h3>/);
  assert.doesNotMatch(html, /article-heading-number|<span/);
});
