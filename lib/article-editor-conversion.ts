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

const LANGUAGE_ALIASES: Record<string, string> = {
  sh: 'bash', shell: 'bash', zsh: 'bash', js: 'javascript', node: 'javascript',
  mjs: 'javascript', cjs: 'javascript', ts: 'typescript', py: 'python',
  htm: 'html', xhtml: 'html', md: 'markdown', mdx: 'markdown',
  yml: 'yaml', txt: 'plaintext', text: 'plaintext', plain: 'plaintext',
};
function normalizeCodeLanguage(value: string) {
  const language = value.trim().toLowerCase().replace(/^\./, '');
  if (!/^[a-z0-9_+#.-]{1,32}$/.test(language)) return '';
  return LANGUAGE_ALIASES[language] || language;
}
function languageFromClass(value: string) {
  return value.match(/(?:^|\s)(?:language-|lang-|highlight-)([a-zA-Z0-9_+#.-]{1,32})(?=\s|$)/i)?.[1] || '';
}
function getCodeLanguage(pre: RichTextNodeLike, code?: RichTextNodeLike) {
  const candidates = [
    code?.getAttribute?.('data-language'), code?.getAttribute?.('data-lang'),
    pre.getAttribute?.('data-language'), pre.getAttribute?.('data-lang'),
    languageFromClass(code?.getAttribute?.('class') || ''),
    languageFromClass(pre.getAttribute?.('class') || ''),
    languageFromClass(pre.parentElement?.getAttribute?.('class') || ''),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeCodeLanguage(candidate);
    if (normalized) return normalized;
  }
  return '';
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
    const rows = findDescendants(node, ['TR']).map(row =>
      elementChildren(row)
        .filter(cell => cell.tagName && ['TH', 'TD'].includes(cell.tagName.toUpperCase()))
        .map(cell => textContent(cell).trim().replace(/\|/g, '\\|')),
    );
    if (!rows.length) return '';
    const width = Math.max(...rows.map(row => row.length));
    const normalized = rows.map(row => Array.from({ length: width }, (_, index) => row[index] || ''));
    return [normalized[0], normalized[0].map(() => '---'), ...normalized.slice(1)]
      .map(row => `| ${row.join(' | ')} |`).join('\n') + '\n\n';
  }

  if (tagName === 'UL' || tagName === 'OL') {
    return elementChildren(node)
      .filter(child => child.tagName?.toUpperCase() === 'LI')
      .map(child => walk(child, listDepth))
      .join('') + '\n';
  }

  if (tagName === 'LI') {
    const parent = node.parentElement;
    const parentTag = parent?.tagName?.toUpperCase();
    const siblings = parent ? elementChildren(parent).filter(child => child.tagName?.toUpperCase() === 'LI') : [];
    const number = siblings.indexOf(node) + 1;
    const marker = parentTag === 'OL' ? `${number}. ` : '- ';
    const children = childNodes(node);
    const nestedLists = children.filter(child => ['UL', 'OL'].includes(child.tagName?.toUpperCase() || ''));
    const inlineContent = children
      .filter(child => !nestedLists.includes(child))
      .map(child => walk(child, listDepth))
      .join('')
      .trim();
    const nestedContent = nestedLists.map(child => walk(child, listDepth + 1).trimEnd()).filter(Boolean).join('\n');
    return `${'  '.repeat(listDepth)}${marker}${inlineContent}${nestedContent ? `\n${nestedContent}` : ''}\n`;
  }

  if (tagName === 'PRE') {
    const codeNode = childNodes(node).find(child =>
      child.nodeType === 1 && child.tagName?.toUpperCase() === 'CODE',
    );
    const language = getCodeLanguage(node, codeNode);
    const code = textContent(codeNode || node).replace(/\r\n?/g, '\n');
    const backtick = String.fromCharCode(96);
    const backtickRunPattern = new RegExp(backtick + '{3,}', 'g');
    const longestBacktickRun = Math.max(0, ...Array.from(code.matchAll(backtickRunPattern), match => match[0].length));
    const fence = backtick.repeat(Math.max(3, longestBacktickRun + 1));
    return fence + language + '\n' + code + '\n' + fence + '\n\n';
  }

  const content = childNodes(node).map(child => walk(child, listDepth)).join('');
  switch (tagName) {
    case 'H1': return `# ${content}\n\n`;
    case 'H2': return `## ${content}\n\n`;
    case 'H3': return `### ${content}\n\n`;
    case 'H4': return `#### ${content}\n\n`;
    case 'H5': return `##### ${content}\n\n`;
    case 'H6': return `###### ${content}\n\n`;
    case 'STRONG':
    case 'B': return `**${content}**`;
    case 'EM':
    case 'I': return `*${content}*`;
    case 'CODE': return '`' + content + '`';
    case 'BLOCKQUOTE':
      return content.split('\n').filter(Boolean).map(line => `> ${line}`).join('\n') + '\n\n';
    case 'BR': return '\n';
    case 'HR': return '\n---\n\n';
    case 'P':
    case 'DIV': return `${content}\n\n`;
    case 'A': {
      const href = node.getAttribute?.('href') || '';
      return /^(https?:\/\/|mailto:)/i.test(href) ? `[${content}](${href})` : content;
    }
    default: return content;
  }
}

export function richTextNodesToMarkdown(nodes: ArrayLike<RichTextNodeLike>) {
  return Array.from(nodes).map(node => walk(node)).join('').replace(/\n{3,}/g, '\n\n').trim();
}

export function htmlToMarkdown(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return richTextNodesToMarkdown(doc.body.childNodes as unknown as ArrayLike<RichTextNodeLike>);
}
