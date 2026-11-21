import test from 'node:test';
import assert from 'node:assert/strict';
import { richTextNodesToMarkdown } from '../lib/article-editor-conversion.ts';

function text(value) {
  return { nodeType: 3, textContent: value };
}

function element(tagName, children = [], attributes = {}) {
  const node = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    childNodes: children,
    children: children.filter(child => child.nodeType === 1),
    parentElement: null,
    getAttribute(name) {
      return Object.hasOwn(attributes, name) ? attributes[name] : null;
    },
  };
  Object.defineProperty(node, 'textContent', {
    get() {
      return children.map(child => child.textContent || '').join('');
    },
  });
  for (const child of children) {
    if (child.nodeType === 1) child.parentElement = node;
  }
  return node;
}

test('converts heading levels to Markdown headings', () => {
  const html = [
    element('h1', [text('一级标题')]),
    element('h2', [text('二级标题')]),
    element('h3', [text('三级标题')]),
  ];
  assert.equal(richTextNodesToMarkdown(html), '# 一级标题\n\n## 二级标题\n\n### 三级标题');
});

test('converts bold, italic, inline code and links', () => {
  const html = [element('p', [
    element('strong', [text('粗体')]),
    text(' '),
    element('em', [text('斜体')]),
    text(' '),
    element('code', [text('const x = 1')]),
    text(' '),
    element('a', [text('链接')], { href: 'https://example.com' }),
  ])];
  assert.equal(
    richTextNodesToMarkdown(html),
    '**粗体** *斜体* `const x = 1` [链接](https://example.com)',
  );
});

test('converts nested unordered lists without flattening their hierarchy', () => {
  const html = [element('ul', [
    element('li', [
      text('父项'),
      element('ul', [
        element('li', [
          text('子项'),
          element('ul', [element('li', [text('孙项')])]),
        ]),
      ]),
    ]),
  ])];
  assert.equal(richTextNodesToMarkdown(html), '- 父项\n  - 子项\n    - 孙项');
});

test('converts ordered lists with stable item numbering', () => {
  const html = [element('ol', [
    element('li', [text('第一项')]),
    element('li', [text('第二项')]),
  ])];
  assert.equal(richTextNodesToMarkdown(html), '1. 第一项\n2. 第二项');
});

test('converts tables and escapes pipe characters in cells', () => {
  const html = [element('table', [
    element('thead', [element('tr', [
      element('th', [text('名称')]),
      element('th', [text('说明')]),
    ])]),
    element('tbody', [element('tr', [
      element('td', [text('A|B')]),
      element('td', [text('内容')]),
    ])]),
  ])];
  assert.equal(
    richTextNodesToMarkdown(html),
    '| 名称 | 说明 |\n| --- | --- |\n| A\\|B | 内容 |',
  );
});

test('converts preformatted code blocks without losing their content', () => {
  const html = [element('pre', [element('code', [text('mkdir -p /opt/app\ncd /opt/app')])])];
  assert.equal(
    richTextNodesToMarkdown(html),
    '```\nmkdir -p /opt/app\ncd /opt/app\n```',
  );
});

test('preserves the selected language when converting rich-text code blocks', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const html = [element('pre', [
    element('code', [text('const answer = 42;')], { class: 'language-javascript' }),
  ], { 'data-language': 'javascript' })];
  assert.equal(richTextNodesToMarkdown(html), fence + 'javascript\nconst answer = 42;\n' + fence);
});

test('preserves pre language metadata and leaves unlabelled blocks plain', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const labelled = [element('pre', [element('code', [text('SELECT 1;')])], { 'data-language': 'sql' })];
  assert.equal(richTextNodesToMarkdown(labelled), fence + 'sql\nSELECT 1;\n' + fence);

  const unlabelled = [element('pre', [element('code', [text('plain text')])])];
  assert.equal(richTextNodesToMarkdown(unlabelled), fence + '\nplain text\n' + fence);
});

test('uses a longer Markdown fence when code contains triple backticks', () => {
  const fence = String.fromCharCode(96).repeat(4);
  const tripleFence = String.fromCharCode(96).repeat(3);
  const html = [element('pre', [element('code', [text('const sample = ' + tripleFence + ';')])], { 'data-language': 'javascript' })];
  assert.equal(richTextNodesToMarkdown(html), fence + 'javascript\nconst sample = ' + tripleFence + ';\n' + fence);
});

test('converts safe images and escapes closing brackets in alt text', () => {
  const html = [element('p', [
    element('img', [], { src: 'https://example.com/image.png', alt: '图]片' }),
  ])];
  assert.equal(richTextNodesToMarkdown(html), '![图\\]片](https://example.com/image.png)');
});

test('drops images with unsafe or non-http sources', () => {
  const html = [element('p', [
    element('img', [], { src: 'javascript:alert(1)', alt: '危险图片' }),
  ])];
  assert.equal(richTextNodesToMarkdown(html), '');
});

test('converts blockquotes, hard line breaks and horizontal rules', () => {
  const html = [
    element('blockquote', [element('p', [text('引用内容')])]),
    element('p', [text('第一行'), element('br'), text('第二行')]),
    element('hr'),
  ];
  assert.equal(
    richTextNodesToMarkdown(html),
    '> 引用内容\n\n第一行\n第二行\n\n---',
  );
});
