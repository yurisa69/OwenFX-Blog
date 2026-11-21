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
  assert.match(known, /class="shiki[^"]*github-light[^"]*github-dark/i);
  assert.match(known, /class="language-javascript"/);
  assert.match(known, /data-language="javascript"/);
  const unknown = await markdownToHtml(fence + 'madeup-language\nplain text\n' + fence);
  assert.match(unknown, /data-language="madeup-language"/);
  assert.match(unknown, /plain text/);
});

test('highlights common GitHub languages on demand with both GitHub themes', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const samples = [
    ['bash', 'echo "hello"', 'echo'],
    ['javascript', 'const answer = 42;', 'const'],
    ['typescript', 'const answer: number = 42;', 'number'],
    ['jsx', 'const App = () => <div>Hello</div>;', 'div'],
    ['tsx', 'const App = () => <div>Hello</div>;', 'div'],
    ['python', 'def greet():\n    return "hello"', 'return'],
    ['html', '<main><h1>Hello</h1></main>', 'main'],
    ['css', '.card { color: red; }', 'color'],
    ['json', '{ "enabled": true }', 'enabled'],
    ['sql', 'SELECT id FROM users;', 'SELECT'],
    ['yaml', 'services:\n  web:\n    image: nginx', 'services'],
    ['markdown', '# Heading\n**bold**', 'Heading'],
    ['java', 'public class Main { public static void main(String[] args) {} }', 'class'],
    ['go', 'package main\nfunc main() {}', 'func'],
    ['rust', 'fn main() { println!("hello"); }', 'fn'],
    ['c', 'int main(void) { return 0; }', 'return'],
    ['cpp', '#include <iostream>\nint main() { std::cout << "hi"; }', 'std'],
    ['csharp', 'public class Program { static void Main() { Console.WriteLine("hi"); } }', 'class'],
    ['php', '<?php echo "hello"; ?>', 'echo'],
    ['ruby', 'puts "hello"', 'puts'],
    ['kotlin', 'fun main() { println("hello") }', 'fun'],
    ['swift', 'let message = "hello"\nprint(message)', 'let'],
    ['dart', 'void main() { print("hello"); }', 'void'],
    ['vue', '<template><button>hello</button></template>', 'template'],
    ['svelte', '<script>let count = 0;</script><button>{count}</button>', 'script'],
    ['scss', '$primary: #333; .button { color: $primary; }', 'primary'],
    ['docker', 'FROM node:22\nWORKDIR /app', 'FROM'],
    ['toml', '[server]\nport = 3000', 'server'],
    ['ini', '[server]\nport=3000', 'server'],
    ['xml', '<root><item>value</item></root>', 'root'],
    ['powershell', 'Get-ChildItem -Path .', 'Get-ChildItem'],
    ['graphql', 'query User { user { id name } }', 'query'],
    ['diff', '+added line\n-removed line', 'added'],
    ['http', 'GET / HTTP/1.1\nHost: example.com', 'GET'],
    ['nginx', 'server { listen 80; }', 'server'],
  ];

  for (const [language, source, token] of samples) {
    const html = await markdownToHtml(fence + language + '\n' + source + '\n' + fence);
    assert.match(html, /class="shiki[^"]*github-light[^"]*github-dark/i, language + ' should include both GitHub themes');
    assert.ok(html.includes('class="language-' + language + '"'), language + ' should retain its language class');
    assert.match(html, /<span[^>]*style="[^"]*--shiki-light:[^"]*--shiki-dark:/i, language + ' should contain colored syntax tokens');
    assert.ok(html.includes(token), language + ' should retain its sample source');
  }
});

test('normalizes common language aliases before loading Shiki grammars', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const aliases = [
    ['c++', 'cpp', 'std'],
    ['c#', 'csharp', 'Console'],
    ['dockerfile', 'docker', 'FROM'],
    ['ps1', 'powershell', 'Get-ChildItem'],
    ['gql', 'graphql', 'query'],
    ['cjs', 'javascript', 'module'],
  ];

  for (const [alias, canonical, sample] of aliases) {
    const html = await markdownToHtml(fence + alias + '\n' + sample + '\n' + fence);
    assert.ok(html.includes('class="language-' + canonical + '"'), alias + ' should map to ' + canonical);
    assert.ok(html.includes('data-language="' + canonical + '"'), alias + ' should display its canonical language label');
    assert.match(html, /class="shiki[^"]*github-light[^"]*github-dark/i);
  }
});

test('highlights Nginx configuration blocks and standalone directives', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const config = [
    'server {',
    '    listen 80;',
    '    server_name status.example.com;',
    '}',
  ].join('\n');
  const directives = [
    'proxy_http_version 1.1;',
    'proxy_set_header Upgrade $http_upgrade;',
    'proxy_set_header Connection "upgrade";',
  ].join('\n');

  for (const source of [config, directives]) {
    const html = await markdownToHtml(fence + 'nginx\n' + source + '\n' + fence);
    assert.match(html, /class="shiki[^"]*github-light[^"]*github-dark/i);
    assert.match(html, /class="language-nginx"/);
    assert.match(html, /data-language="nginx"/);
    assert.match(html, /<span[^>]*style="[^"]*--shiki-light:[^"]*--shiki-dark:/i);
  }

  const directiveHtml = await markdownToHtml(fence + 'nginx\n' + directives + '\n' + fence);
  assert.match(directiveHtml, /proxy_http_version/);
  assert.match(directiveHtml, /proxy_set_header/);
  assert.match(directiveHtml, /\$http_upgrade/);
  assert.match(directiveHtml, /"upgrade"/);
});

test('maps plaintext aliases to Shiki text and retains a plain-text label', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const html = await markdownToHtml(fence + 'plaintext\nplain text\n' + fence);
  assert.match(html, /class="shiki[^"]*github-light[^"]*github-dark/i);
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
