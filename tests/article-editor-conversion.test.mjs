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
  assert.equm���jם