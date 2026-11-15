type RichTextNodeLike = {
  nodeType: number;
  tagName?: string;
  textContent?: string | null;
  childNodes?: ArrayLike<RichTextNodeLike>;
  children?: ArrayLike<RichTextNodeLike>;
  parentElement?: RichTextNodeLike | null;
  getAttribute?: (name: string) => string | null;
};

function childNodes(node: RichTextNodeLike) {
  return Array.from(node.childNodes || []);
}

function elementChildren(node: RichTextNodeLike) {
  return Array.from(node.children || []);
}

function findDescendants(node: RichTextNodeLike, tags: string[]): RichTextNodeLike[] {
  const matches: RichTextNodeLike[] = [];
  for (const child of childNodes(node)) {
    if (child.nodeType === 1 && child.tagName && tags.includes(child.tagName.toUpperCase())) {
      matches.push(child);
    }
    matches.push(...findDescendants(child, tags));
  }
  return matches;
}

function textContent(node: RichTextNodeLike): string {
  if (node.nodeType === 3) return node.textContent || '';
  return childNodes(node).map(textContent).join('');
}

function walk(node: RichTextNodeLike, listDepth = 0): string {
  if (node.nodeType === 3) return node.textContent || '';
  if (node.nodeType !== 1) return '';

  const tagName = node.tagName?.toUpperCase() || '';

  if (tagName === 'IMG') {
    const src = node.getAttribute?.('src') || '';
    const alt = (node.getAttribute?.('alt') || '').replace(/\]/g, '\\]');
    return /^https?:\/\//i.test(src) ? `![${alt}](${src})` : '';
  }

  if (tagName === 'TABLE') {
    const rows = findDmÆÈ‹j◊ù